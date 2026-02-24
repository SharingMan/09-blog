#!/usr/bin/env node

/**
 * GitHub Actions 同步脚本
 * 用于在 GitHub Actions 中自动同步 Notion 文章
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// 读取 .env.local 文件
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    });
  }
}

loadEnv();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN || !DATABASE_ID) {
  console.error('❌ 请配置 NOTION_TOKEN 和 NOTION_DATABASE_ID 环境变量');
  process.exit(1);
}

// 通用重试工具（用于 Notion API / fetch 等）
async function withRetry(fn, options = {}) {
  const {
    // 默认重试次数和间隔调低，避免在网络很差时卡太久
    retries = 1,
    delayMs = 1500,
    onRetry,
    name = 'operation',
  } = options;

  let attempt = 0;
  // 允许 1 次初次尝试 + retries 次重试
  const maxAttempts = Math.max(1, retries + 1);

  // 记录最后一次错误，用于最终抛出
  let lastError;

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      attempt++;

      const isLast = attempt >= maxAttempts;
      const message = err && err.message ? err.message : String(err);

      if (isLast) {
        console.error(`❌ ${name} 失败（已重试 ${attempt - 1} 次）:`, message);
        throw err;
      }

      console.warn(`⚠️ ${name} 出错，将在 ${delayMs}ms 后重试（第 ${attempt} 次重试）:`, message);
      if (typeof onRetry === 'function') {
        try {
          onRetry(err, attempt);
        } catch {
          // 忽略 onRetry 中的错误
        }
      }

      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  // 理论上不会走到这里
  throw lastError || new Error(`${name} 失败（未知错误）`);
}

// 带超时的 fetch，防止单次请求挂起太久
async function fetchWithTimeout(url, options = {}) {
  const { timeoutMs = 15000, ...rest } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...rest, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// 格式化数据库 ID
function formatDatabaseId(id) {
  if (id.includes('-')) return id;
  if (id.length === 32) {
    return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20, 32)}`;
  }
  return id;
}

// 格式化日期
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

// 计算阅读时间
function calculateReadTime(content) {
  const wordCount = content.replace(/\s/g, '').length;
  const minutes = Math.ceil(wordCount / 300);
  return `${minutes} 分钟`;
}

// 下载图片并保存到本地，返回本地路径（带重试）
async function downloadImageToLocal(imageUrl, articleId, index) {
  try {
    // 仅处理 http/https 图片
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    const imagesDir = path.join(process.cwd(), 'public/images/articles');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // 从 URL 中提取扩展名（忽略查询参数）
    let ext = '.jpg';
    try {
      const urlObj = new URL(imageUrl);
      const pathname = urlObj.pathname;
      const guessedExt = path.extname(pathname);
      if (guessedExt) {
        ext = guessedExt;
      }
    } catch {
      // 解析失败就用默认后缀
    }

    const safeArticleId = String(articleId || 'article').replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `${safeArticleId}-${index}${ext}`;
    const filepath = path.join(imagesDir, filename);

    // 对已同步文章，Notion 图片可能已替换但序号不变。
    // 这里始终覆盖同名文件，避免复用到历史旧图。
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    console.log(`🖼  正在下载图片: ${imageUrl}`);

    // 使用带超时的 fetch，并且不做多次重试，避免在网络差时长时间卡住
    const res = await withRetry(
      () => fetchWithTimeout(imageUrl, { timeoutMs: 15000 }),
      {
        retries: 0,
        delayMs: 0,
        name: '图片下载',
      }
    );

    if (!res.ok) {
      console.warn(`⚠️  图片下载失败 (${res.status}): ${imageUrl}`);
      return imageUrl;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filepath, buffer);

    console.log(`🖼  图片已保存: /images/articles/${filename}`);
    return `/images/articles/${filename}`;
  } catch (error) {
    console.warn(`⚠️  下载图片出错: ${imageUrl}`, error && error.message ? error.message : error);
    return imageUrl;
  }
}

// 处理 Markdown 内容中的图片：下载到本地并替换为本地路径
async function processImagesInContent(content, articleId) {
  let index = 1;

  const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  const replacements = [];

  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const alt = match[1] || '';
    const url = match[2];

    // 为每张图片生成本地路径
    const localPath = await downloadImageToLocal(url, articleId, index++);
    if (localPath !== url) {
      replacements.push({
        original: fullMatch,
        replacement: `![${alt}](${localPath})`,
      });
    }
  }

  if (replacements.length === 0) {
    return content;
  }

  let newContent = content;
  for (const r of replacements) {
    newContent = newContent.replace(r.original, r.replacement);
  }

  return newContent;
}

// 将 Notion 块转换为 Markdown
async function blocksToMarkdown(notion, blockId, depth = 0) {
  if (depth > 15) {
    console.warn(`⚠️ 达到最大深度限制 (${depth})，停止递归处理`);
    return '';
  }

  console.log(`🔍 正在处理块 ${blockId}（深度: ${depth}）`);

  // 处理分页，获取所有块
  let allBlocks = [];
  let cursor = null;

  do {
    const requestOptions = {
      block_id: blockId,
      page_size: 100,
    };

    // 只有当cursor存在时才添加start_cursor参数
    if (cursor) {
      requestOptions.start_cursor = cursor;
    }

    const blocks = await withRetry(
      () => notion.blocks.children.list(requestOptions),
      {
        retries: 5,
        delayMs: 3000,
        name: `获取页面内容块（深度${depth}）`,
      }
    );

    allBlocks.push(...blocks.results);
    cursor = blocks.next_cursor;

    if (blocks.has_more) {
      console.log(`📄 获取更多块... 当前已获取 ${allBlocks.length} 个块`);
    }
  } while (cursor);

  let markdown = '';

  console.log(`📝 处理 ${allBlocks.length} 个块（深度: ${depth}）`);

  for (let i = 0; i < allBlocks.length; i++) {
    const block = allBlocks[i];
    console.log(`   处理块 ${i + 1}/${allBlocks.length} - 类型: ${block.type}`);
    switch (block.type) {
      case 'paragraph':
        const paragraphText = block.paragraph.rich_text.map(t => t.plain_text).join('');
        if (paragraphText.trim()) {
          markdown += paragraphText + '\n\n';
        }
        break;

      case 'heading_1':
        markdown += '# ' + block.heading_1.rich_text.map(t => t.plain_text).join('') + '\n\n';
        break;

      case 'heading_2':
        markdown += '## ' + block.heading_2.rich_text.map(t => t.plain_text).join('') + '\n\n';
        break;

      case 'heading_3':
        markdown += '### ' + block.heading_3.rich_text.map(t => t.plain_text).join('') + '\n\n';
        break;

      case 'bulleted_list_item':
        const bulletedText = block.bulleted_list_item.rich_text.map(t => t.plain_text).join('');
        if (bulletedText.trim()) {
          markdown += '- ' + bulletedText + '\n';
        }
        // 处理嵌套列表
        if (block.has_children && block.id) {
          const childContent = await blocksToMarkdown(notion, block.id, depth + 1);
          if (childContent) {
            markdown += childContent.replace(/^/gm, '  '); // 添加缩进
          }
        }
        break;

      case 'numbered_list_item':
        const numberedText = block.numbered_list_item.rich_text.map(t => t.plain_text).join('');
        if (numberedText.trim()) {
          markdown += '1. ' + numberedText + '\n';
        }
        // 处理嵌套列表
        if (block.has_children && block.id) {
          const childContent = await blocksToMarkdown(notion, block.id, depth + 1);
          if (childContent) {
            markdown += childContent.replace(/^/gm, '  '); // 添加缩进
          }
        }
        break;

      case 'quote':
        markdown += '> ' + block.quote.rich_text.map(t => t.plain_text).join('') + '\n\n';
        break;

      case 'code':
        const language = block.code.language || '';
        const codeText = block.code.rich_text.map(t => t.plain_text).join('');
        markdown += '```' + language + '\n' + codeText + '\n```\n\n';
        break;

      case 'divider':
        markdown += '---\n\n';
        break;

      case 'image':
        let imageUrl = '';
        if (block.image.type === 'external') {
          imageUrl = block.image.external.url || '';
        } else if (block.image.type === 'file') {
          imageUrl = block.image.file?.url || '';
        } else {
          // 兼容旧版本 API
          imageUrl = block.image.file?.url || block.image.external?.url || '';
        }
        const imageCaption = (block.image.caption || []).map(t => t.plain_text).join('');
        if (imageUrl) {
          markdown += `![${imageCaption}](${imageUrl})\n\n`;
        }
        break;

      case 'table':
        // 处理表格
        if (block.has_children && block.id) {
          const tableRows = await blocksToMarkdown(notion, block.id, depth + 1);
          if (tableRows) {
            let processedTable = tableRows;

            // 始终确保有分隔线，以便正确渲染为 Markdown 表格
            const rows = tableRows.trim().split('\n');
            if (rows.length > 0) {
              const firstRow = rows[0];
              // 简单检查是否已有分隔线 (有些实现可能会自己加)
              const hasSeparator = rows.length > 1 && rows[1].includes('---');

              if (!hasSeparator) {
                // 计算列数 (通过统计管道符数量 - 1)
                const pipeCount = (firstRow.match(/\|/g) || []).length;
                const colCount = Math.max(1, pipeCount - 1);

                // 构造分隔线 | --- | --- |
                const separator = '|' + Array(colCount).fill(' --- ').join('|') + '|';
                rows.splice(1, 0, separator);
                processedTable = rows.join('\n');
                console.log(`   🛠️  已为表格添加分隔线 (列数: ${colCount})`);
              }
            }

            markdown += processedTable + '\n\n';
          }
        }
        break;

      case 'table_row':
        // 处理表格行
        if (block.table_row && block.table_row.cells) {
          const cells = block.table_row.cells.map(cell =>
            cell.map(t => t.plain_text).join('')
          ).join(' | ');
          markdown += `| ${cells} |\n`;
        }
        break;

      default:
        if (block.has_children && block.id) {
          const childContent = await blocksToMarkdown(notion, block.id, depth + 1);
          if (childContent) {
            markdown += childContent;
          }
        }
        break;
    }
  }

  return markdown.trim();
}

// 读取同步状态
const SYNC_STATE_FILE = path.join(process.cwd(), '.notion-sync-state.json');
function readSyncState() {
  try {
    if (fs.existsSync(SYNC_STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(SYNC_STATE_FILE, 'utf8'));
      // 强制重置 lastSyncTime 以进行全量同步
      state.lastSyncTime = new Date(0).toISOString();
      return state;
    }
  } catch (error) {
    console.error('读取同步状态失败:', error);
  }
  return {
    lastSyncTime: new Date(0).toISOString(),
    syncedPages: {}
  };
}

// 保存同步状态
function saveSyncState(state) {
  fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// 创建文章文件（包含图片本地化）
async function createArticleFile(article) {
  const articlesDir = path.join(process.cwd(), 'app/data/articles');
  if (!fs.existsSync(articlesDir)) {
    fs.mkdirSync(articlesDir, { recursive: true });
  }

  // 先将内容中的远程图片下载到本地，并替换为本地路径
  const processedContent = await processImagesInContent(article.content, article.id);

  const filePath = path.join(articlesDir, `${article.id}.md`);
  const frontmatter = `---
title: ${article.title}
date: ${article.date}
readTime: ${article.readTime}
${article.category ? `category: ${article.category}\n` : ''}${article.tags && article.tags.length > 0 ? `tags: ${article.tags.join(', ')}\n` : ''}---

${processedContent}`;

  fs.writeFileSync(filePath, frontmatter, 'utf8');
}

// 主函数
async function main() {
  console.log('🚀 开始同步 Notion 文章...\n');

  const notion = new Client({ auth: NOTION_TOKEN });
  const formattedDbId = formatDatabaseId(DATABASE_ID);
  const syncState = readSyncState();

  // 查询数据库（带重试）
  console.log(`🔍 正在搜索 Notion 数据库: ${formattedDbId}\n`);
  const searchResponse = await withRetry(
    () => notion.search({
      filter: { property: 'object', value: 'page' },
      sort: { direction: 'descending', timestamp: 'last_edited_time' }
    }),
    {
      retries: 3,
      delayMs: 3000,
      name: '搜索 Notion 页面',
    }
  );

  console.log(`📋 搜索到 ${searchResponse.results.length} 个页面（未过滤）\n`);

  // 添加调试信息
  if (searchResponse.results.length > 0) {
    const firstPage = searchResponse.results[0];
    console.log(`🔍 第一个页面的 parent 信息:`, JSON.stringify({
      type: firstPage.parent?.type,
      database_id: firstPage.parent?.database_id,
      target_db_id: formattedDbId,
      match: firstPage.parent?.database_id === formattedDbId
    }, null, 2));
    console.log('');
  }

  const pages = searchResponse.results.filter((page) => {
    const parent = page.parent;
    if (!parent) {
      return false;
    }
    // 检查 parent 是否为数据库类型
    if (parent.type === 'database_id' && parent.database_id === formattedDbId) {
      return true;
    }
    // 检查 parent 对象中是否有 database_id 字段
    if (parent.database_id === formattedDbId) {
      return true;
    }
    return false;
  });

  console.log(`📚 过滤后找到 ${pages.length} 个页面（属于数据库 ${formattedDbId}）\n`);

  // =========================
  // 同步删除 Notion 中已移除的页面
  // =========================
  // 仅在当前数据库中至少有 1 个页面时才执行删除逻辑，
  // 避免因为权限错误 / 配置错误导致误删所有本地文章。
  if (pages.length > 0) {
    const currentPageIds = new Set(pages.map(p => p.id));
    const syncedPages = syncState.syncedPages || {};
    const allSyncedPageIds = Object.keys(syncedPages);

    const removedPageIds = allSyncedPageIds.filter(pageId => !currentPageIds.has(pageId));

    if (removedPageIds.length > 0) {
      console.log(`🗑  检测到 ${removedPageIds.length} 个已从 Notion 数据库中移除的页面，将同步删除本地文章：`);
    }

    for (const removedPageId of removedPageIds) {
      const articleId = syncedPages[removedPageId];
      const articlePath = path.join(process.cwd(), 'app/data/articles', `${articleId}.md`);

      try {
        if (fs.existsSync(articlePath)) {
          fs.unlinkSync(articlePath);
          console.log(`   - 已删除本地文章文件: ${articleId}.md （来自页面 ${removedPageId}）`);
        } else {
          console.log(`   - 本地文章文件不存在，跳过删除: ${articleId}.md （来自页面 ${removedPageId}）`);
        }
      } catch (err) {
        console.warn(`⚠️  删除本地文章失败: ${articleId}.md （页面 ${removedPageId}）`, err && err.message ? err.message : err);
        // 出错时，不删除映射，留给下次同步重试
        continue;
      }

      // 删除同步状态中的映射
      delete syncedPages[removedPageId];
    }

    // 写回可能被修改过的 syncedPages
    syncState.syncedPages = syncedPages;
  } else {
    console.log('ℹ️  当前数据库没有任何页面，出于安全考虑，本次不同步删除本地文章。');
  }

  // 获取最后同步时间
  const lastSyncTime = syncState.lastSyncTime ? new Date(syncState.lastSyncTime) : new Date(0);
  console.log(`📅 最后同步时间: ${lastSyncTime.toLocaleString('zh-CN')} (${lastSyncTime.toISOString()})`);
  console.log(`📅 当前时间: ${new Date().toLocaleString('zh-CN')} (${new Date().toISOString()})`);
  console.log(`📊 已同步文章数: ${Object.keys(syncState.syncedPages || {}).length}\n`);

  let syncedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const page of pages) {
    try {
      const pageId = page.id;
      const lastEditedTime = new Date(page.last_edited_time);
      const isSynced = !!syncState.syncedPages[pageId];

      // 获取标题（先获取标题用于日志）
      const properties = page.properties || {};
      let title = '未命名';
      const titleKeys = ['标题', 'Title', 'title', 'Name', 'name'];
      for (const key of titleKeys) {
        const prop = properties[key];
        if (prop?.type === 'title' && prop.title && prop.title.length > 0) {
          title = prop.title.map(t => t.plain_text).join('');
          break;
        }
      }

      // 增量同步逻辑：
      // 1. 如果页面未同步（新文章），总是同步
      // 2. 如果页面已同步但更新了（lastEditedTime > lastSyncTime），同步
      // 3. 如果页面已同步且未更新（lastEditedTime <= lastSyncTime），跳过
      // 注意：使用严格比较，确保时间比较准确
      const timeDiff = lastEditedTime.getTime() - lastSyncTime.getTime();
      const timeDiffSeconds = Math.round(timeDiff / 1000);
      if (isSynced && timeDiff <= 0) {
        console.log(`⏭️  跳过未更新: ${title}`);
        console.log(`   编辑时间: ${lastEditedTime.toISOString()}`);
        console.log(`   同步时间: ${lastSyncTime.toISOString()}`);
        console.log(`   时间差: ${timeDiffSeconds} 秒 (${timeDiff}ms)`);
        skippedCount++;
        continue;
      }

      // 如果是新文章或已更新的文章，继续处理
      if (!isSynced) {
        console.log(`🆕 发现新文章: ${title}`);
      } else {
        console.log(`🔄 发现更新: ${title} (编辑时间: ${lastEditedTime.toLocaleString('zh-CN')})`);
      }

      // 获取日期
      let dateProperty = page.created_time;
      const dateKeys = ['发布日期', 'Date', 'date'];
      for (const key of dateKeys) {
        const prop = properties[key];
        if (prop?.type === 'date' && prop.date?.start) {
          dateProperty = prop.date.start;
          break;
        }
      }
      const date = formatDate(dateProperty);

      // 获取分类和标签
      const category = properties['分类']?.select?.name || properties['Category']?.select?.name;
      const tags = (properties['标签']?.multi_select || properties['Tags']?.multi_select || []).map(t => t.name);

      // 获取页面内容
      let content = '';
      try {
        content = await blocksToMarkdown(notion, pageId);
      } catch (error) {
        console.error(`❌ 获取页面内容失败 (${title}):`, error.message);
        skippedCount++;
        continue;
      }

      if (!content.trim()) {
        console.log(`⚠️  跳过空页面: ${title}`);
        skippedCount++;
        continue;
      }

      // 生成或使用已有的文章 ID（先生成 ID，再用于图片文件命名）
      const articleId = syncState.syncedPages[pageId] || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 计算阅读时间
      const readTime = calculateReadTime(content);

      // 创建文章文件（内部会处理并本地化图片）
      await createArticleFile({
        id: articleId,
        title,
        date,
        content,
        readTime,
        category,
        tags,
      });

      // 更新同步状态
      const wasSynced = !!syncState.syncedPages[pageId];
      syncState.syncedPages[pageId] = articleId;

      if (wasSynced) {
        updatedCount++;
        console.log(`✅ 更新: ${title}`);
      } else {
        syncedCount++;
        console.log(`✨ 新增: ${title}`);
      }
    } catch (error) {
      console.error(`❌ 处理页面失败:`, error.message);
      skippedCount++;
    }
  }

  // 保存同步状态
  // 为了避免在 Notion 网络异常时“错误地推进同步时间”，
  // 这里统一改为：只有在本次实际新增 / 更新 / 删除了文章，才更新 lastSyncTime。
  const changedBySync =
    syncedCount > 0 ||
    updatedCount > 0;

  const changedByDeletion = true; // 上面删除逻辑已经直接修改了 syncState.syncedPages（如有）

  if (changedBySync || changedByDeletion) {
    syncState.lastSyncTime = new Date().toISOString();
    saveSyncState(syncState);
    console.log(`💾 已更新同步状态，最后同步时间: ${syncState.lastSyncTime}`);
  } else {
    console.log(`ℹ️  没有文章变更，保持原有同步时间: ${syncState.lastSyncTime}`);
  }

  console.log(`\n📊 同步完成:`);
  console.log(`   - 新增: ${syncedCount} 篇`);
  console.log(`   - 更新: ${updatedCount} 篇`);
  console.log(`   - 跳过: ${skippedCount} 篇`);
  console.log(`   - 总计: ${pages.length} 篇`);

  if (pages.length === 0) {
    console.log(`\n⚠️  警告: 没有找到任何页面！`);
    console.log(`   请检查:`);
    console.log(`   1. 数据库 ID 是否正确: ${formattedDbId}`);
    console.log(`   2. Integration 是否有权限访问该数据库`);
    console.log(`   3. 数据库中是否有页面`);
  }

  console.log('');
}

main().catch(error => {
  console.error('❌ 同步失败:', error);
  process.exit(1);
});

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

// 将 Notion 块转换为 Markdown
async function blocksToMarkdown(notion, blockId, depth = 0) {
  if (depth > 10) return '';
  
  const blocks = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 100,
  });
  
  let markdown = '';
  
  for (const block of blocks.results) {
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
        markdown += '- ' + block.bulleted_list_item.rich_text.map(t => t.plain_text).join('') + '\n';
        break;
      
      case 'numbered_list_item':
        markdown += '1. ' + block.numbered_list_item.rich_text.map(t => t.plain_text).join('') + '\n';
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
      return JSON.parse(fs.readFileSync(SYNC_STATE_FILE, 'utf8'));
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

// 创建文章文件
function createArticleFile(article) {
  const articlesDir = path.join(process.cwd(), 'app/data/articles');
  if (!fs.existsSync(articlesDir)) {
    fs.mkdirSync(articlesDir, { recursive: true });
  }
  
  const filePath = path.join(articlesDir, `${article.id}.md`);
  const frontmatter = `---
title: ${article.title}
date: ${article.date}
readTime: ${article.readTime}
${article.category ? `category: ${article.category}\n` : ''}${article.tags && article.tags.length > 0 ? `tags: ${article.tags.join(', ')}\n` : ''}---

${article.content}`;
  
  fs.writeFileSync(filePath, frontmatter, 'utf8');
}

// 主函数
async function main() {
  console.log('🚀 开始同步 Notion 文章...\n');
  
  const notion = new Client({ auth: NOTION_TOKEN });
  const formattedDbId = formatDatabaseId(DATABASE_ID);
  const syncState = readSyncState();
  
  // 查询数据库
  const searchResponse = await notion.search({
    filter: { property: 'object', value: 'page' },
    sort: { direction: 'descending', timestamp: 'last_edited_time' }
  });
  
  const pages = searchResponse.results.filter((page) => {
    const parent = page.parent;
    if (!parent) return false;
    if (parent.type === 'database_id' && parent.database_id === formattedDbId) return true;
    if (parent.database_id === formattedDbId) return true;
    return false;
  });
  
  console.log(`📚 找到 ${pages.length} 个页面\n`);
  
  // 获取最后同步时间
  const lastSyncTime = syncState.lastSyncTime ? new Date(syncState.lastSyncTime) : new Date(0);
  console.log(`📅 最后同步时间: ${lastSyncTime.toLocaleString('zh-CN')}\n`);
  
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
        if (prop?.type === 'title' && prop.title?.[0]?.plain_text) {
          title = prop.title[0].plain_text;
          break;
        }
      }
      
      // 增量同步逻辑：
      // 1. 如果页面未同步（新文章），总是同步
      // 2. 如果页面已同步但更新了（lastEditedTime > lastSyncTime），同步
      // 3. 如果页面已同步且未更新（lastEditedTime <= lastSyncTime），跳过
      if (isSynced && lastEditedTime <= lastSyncTime) {
        console.log(`⏭️  跳过未更新: ${title} (编辑时间: ${lastEditedTime.toLocaleString('zh-CN')}, 同步时间: ${lastSyncTime.toLocaleString('zh-CN')})`);
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
      
      // 计算阅读时间
      const readTime = calculateReadTime(content);
      
      // 生成或使用已有的文章 ID
      const articleId = syncState.syncedPages[pageId] || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 创建文章文件
      createArticleFile({
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
  syncState.lastSyncTime = new Date().toISOString();
  saveSyncState(syncState);
  
  console.log(`\n📊 同步完成:`);
  console.log(`   - 新增: ${syncedCount} 篇`);
  console.log(`   - 更新: ${updatedCount} 篇`);
  console.log(`   - 跳过: ${skippedCount} 篇`);
  console.log(`   - 总计: ${pages.length} 篇\n`);
}

main().catch(error => {
  console.error('❌ 同步失败:', error);
  process.exit(1);
});

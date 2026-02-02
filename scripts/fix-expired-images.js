#!/usr/bin/env node

/**
 * 修复过期图片脚本
 * 扫描 app/data/articles/*.md 中的过期 Notion 图片，
 * 通过 Notion API 重新获取图片内容并保存到本地。
 *
 * 使用方法（在项目根目录）：
 *   node scripts/fix-expired-images.js
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

if (!NOTION_TOKEN) {
  console.error('❌ 请配置 NOTION_TOKEN 环境变量');
  process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN });

// 从文章 ID 反查 Notion page ID
function findNotionPageId(articleId) {
  const statePath = path.join(process.cwd(), '.notion-sync-state.json');
  if (!fs.existsSync(statePath)) {
    return null;
  }

  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const syncedPages = state.syncedPages || {};

  for (const [pageId, id] of Object.entries(syncedPages)) {
    if (id === articleId) {
      return pageId;
    }
  }
  return null;
}

// 递归搜索图片块
async function findImageBlocks(notion, blockId, depth = 0) {
  if (depth > 10) return [];

  const blocks = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 100,
  });

  const imageBlocks = [];

  for (const block of blocks.results) {
    if (block.type === 'image') {
      imageBlocks.push(block);
    }

    if (block.has_children && block.id) {
      const childImages = await findImageBlocks(notion, block.id, depth + 1);
      imageBlocks.push(...childImages);
    }
  }

  return imageBlocks;
}

// 从 Notion 获取图片内容
async function getImageContentFromNotion(imageBlock) {
  try {
    let imageUrl = '';
    let urlType = '';

    if (imageBlock.image.type === 'file') {
      imageUrl = imageBlock.image.file?.url || '';
      urlType = 'file';
    } else if (imageBlock.image.type === 'external') {
      imageUrl = imageBlock.image.external?.url || '';
      urlType = 'external';
    }

    if (!imageUrl) {
      return { success: false, error: '没有找到图片 URL' };
    }

    console.log(`   - 图片类型: ${urlType}`);
    console.log(`   - 尝试 URL: ${imageUrl.substring(0, 80)}...`);

    // 尝试下载图片
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!res.ok) {
      // 如果是 file 类型且过期了，尝试通过 API 重新获取
      if (urlType === 'file') {
        console.log(`   - 文件 URL 过期，尝试通过 API 重新获取...`);
        try {
          const updatedBlock = await notion.blocks.retrieve({ block_id: imageBlock.id });
          if (updatedBlock.image?.type === 'file') {
            const newUrl = updatedBlock.image.file?.url;
            if (newUrl && newUrl !== imageUrl) {
              console.log(`   - 获取到新的 URL`);
              const newRes = await fetch(newUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0',
                },
              });
              if (newRes.ok) {
                const arrayBuffer = await newRes.arrayBuffer();
                return { success: true, buffer: Buffer.from(arrayBuffer) };
              }
            }
          }
        } catch (apiError) {
          console.log(`   - API 获取失败: ${apiError.message}`);
        }
      }
      return { success: false, error: `下载失败 (${res.status})` };
    }

    const arrayBuffer = await res.arrayBuffer();
    return { success: true, buffer: Buffer.from(arrayBuffer) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 下载单张图片
async function downloadImage(articleId, imageIndex, existingFilename) {
  const imagesDir = path.join(process.cwd(), 'public/images/articles');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const safeArticleId = String(articleId || 'article').replace(/[^a-zA-Z0-9_-]/g, '');

  // 尝试从现有文件名确定扩展名
  let ext = '.jpg';
  if (existingFilename) {
    const existingExt = path.extname(existingFilename);
    if (existingExt) {
      ext = existingExt;
    }
  }

  const filename = `${safeArticleId}-${imageIndex}${ext}`;
  const filepath = path.join(imagesDir, filename);

  // 如果文件已存在，检查是否可用
  if (fs.existsSync(filepath)) {
    const stats = fs.statSync(filepath);
    if (stats.size > 0) {
      return { success: true, localPath: `/images/articles/${filename}` };
    }
  }

  // 查找对应的 Notion 页面
  const notionPageId = findNotionPageId(articleId);
  if (!notionPageId) {
    return { success: false, error: '未找到对应的 Notion 页面' };
  }

  console.log(`📋 查找 Notion 页面中的图片... (page: ${notionPageId})`);

  // 获取所有图片块
  const imageBlocks = await findImageBlocks(notion, notionPageId);

  if (imageBlocks.length === 0) {
    return { success: false, error: '页面中没有图片' };
  }

  if (imageBlocks.length < imageIndex) {
    return { success: false, error: `图片索引超出范围 (页面有 ${imageBlocks.length} 张图片，请求第 ${imageIndex} 张)` };
  }

  console.log(`📄 找到 ${imageBlocks.length} 张图片，获取第 ${imageIndex} 张...`);

  const imageBlock = imageBlocks[imageIndex - 1];
  const result = await getImageContentFromNotion(imageBlock);

  if (!result.success) {
    return result;
  }

  // 保存图片
  fs.writeFileSync(filepath, result.buffer);
  console.log(`✅ 图片已保存: /images/articles/${filename}`);

  return { success: true, localPath: `/images/articles/${filename}` };
}

// 处理单篇文章
async function processArticle(filePath) {
  const filename = path.basename(filePath);
  const articleId = filename.replace(/\.md$/, '');

  console.log(`\n📝 处理文章: ${filename}`);

  const content = fs.readFileSync(filePath, 'utf-8');

  // 匹配 Notion 过期图片 URL
  const expiredImageRegex = /!\[([^\]]*)\]\((https:\/\/prod-files-secure\.s3\.us-west-2\.amazonaws\.com\/[^\s)]+)\)/g;
  const replacements = [];
  let imageIndex = 1;

  let match;
  while ((match = expiredImageRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const url = match[2];

    console.log(`\n🔍 发现过期图片: ${url.substring(0, 80)}...`);

    // 提取现有的本地文件名（如果已存在）
    const existingFilenameRegex = new RegExp(`/images/articles/${articleId}-(\\d+)\\.[a-z]+`, 'i');
    const existingMatch = content.match(existingFilenameRegex);
    const existingFilename = existingMatch ? existingMatch[0].split('/').pop() : null;

    const result = await downloadImage(articleId, imageIndex, existingFilename);

    if (result.success) {
      replacements.push({
        original: fullMatch,
        replacement: fullMatch.replace(url, result.localPath),
      });
    } else {
      console.log(`⚠️  下载失败: ${result.error}`);
    }

    imageIndex++;
  }

  if (replacements.length === 0) {
    console.log(`✅ 没有需要修复的图片`);
    return false;
  }

  let newContent = content;
  for (const r of replacements) {
    newContent = newContent.replace(r.original, r.replacement);
  }

  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✨ 已更新文章: ${filename}（修复 ${replacements.length} 张图片）`);
  return true;
}

// 主函数
async function main() {
  const articlesDir = path.join(process.cwd(), 'app/data/articles');
  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));

  console.log(`📝 共找到 ${files.length} 篇文章，开始修复过期图片...\n`);

  let updated = 0;
  for (const file of files) {
    const fullPath = path.join(articlesDir, file);
    const changed = await processArticle(fullPath);
    if (changed) updated++;
  }

  console.log(`\n📊 修复完成：共更新 ${updated} 篇文章`);
}

main().catch(err => {
  console.error('❌ 修复出错:', err);
  process.exit(1);
});

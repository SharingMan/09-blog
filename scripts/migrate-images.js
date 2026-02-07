#!/usr/bin/env node

/**
 * 一次性迁移脚本：
 * 扫描 app/data/articles/*.md 中的远程图片（https://...），
 * 下载到 public/images/articles/，并把 Markdown 中的链接改成本地路径。
 *
 * 使用方法（在项目根目录）：
 *   node scripts/migrate-images.js
 */

const fs = require('fs');
const path = require('path');

// 带超时的 fetch，防止单张图片下载卡太久
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

// 下载图片并保存到本地，返回本地路径
async function downloadImageToLocal(imageUrl, articleId, index) {
  try {
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
      // ignore
    }

    const safeArticleId = String(articleId || 'article').replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `${safeArticleId}-${index}${ext}`;
    const filepath = path.join(imagesDir, filename);

    if (fs.existsSync(filepath)) {
      return `/images/articles/${filename}`;
    }

    console.log(`🖼  下载图片: ${imageUrl}`);
    const res = await fetchWithTimeout(imageUrl, { timeoutMs: 15000 });
    if (!res.ok) {
      console.warn(`⚠️  下载失败 (${res.status}): ${imageUrl}`);
      return imageUrl;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filepath, buffer);

    console.log(`✅ 保存图片: /images/articles/${filename}`);
    return `/images/articles/${filename}`;
  } catch (error) {
    console.warn(`⚠️  下载出错: ${imageUrl}`, error.message || error);
    return imageUrl;
  }
}

// 处理单篇文章内容
async function processArticleFile(filePath) {
  const filename = path.basename(filePath);
  const articleId = filename.replace(/\.md$/, '');
  let content = fs.readFileSync(filePath, 'utf-8');

  const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  const replacements = [];
  let index = 1;

  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const alt = match[1] || '';
    const url = match[2];

    const localPath = await downloadImageToLocal(url, articleId, index++);
    if (localPath !== url) {
      replacements.push({
        original: fullMatch,
        replacement: `![${alt}](${localPath})`,
      });
    }
  }

  if (replacements.length === 0) {
    console.log(`ℹ️  无需修改: ${filename}`);
    return false;
  }

  let newContent = content;
  for (const r of replacements) {
    newContent = newContent.replace(r.original, r.replacement);
  }

  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✨ 已更新文章: ${filename}（替换 ${replacements.length} 张图片）`);
  return true;
}

async function main() {
  const articlesDir = path.join(process.cwd(), 'app/data/articles');
  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));

  console.log(`📝 共找到 ${files.length} 篇文章，开始迁移图片...\n`);

  let updated = 0;
  for (const file of files) {
    const fullPath = path.join(articlesDir, file);
    const changed = await processArticleFile(fullPath);
    if (changed) updated++;
  }

  console.log(`\n📊 迁移完成：共更新 ${updated} 篇文章`);
}

main().catch(err => {
  console.error('❌ 迁移出错:', err);
  process.exit(1);
});


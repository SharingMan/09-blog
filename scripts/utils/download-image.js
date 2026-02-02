/**
 * 图片下载工具函数
 * 从远程 URL 下载图片并保存到本地
 */

const fs = require('fs');
const path = require('path');

/**
 * 下载图片并保存到本地，返回本地路径
 *
 * @param {string} imageUrl - 图片 URL
 * @param {string} articleId - 文章 ID（用于文件命名）
 * @param {number} index - 图片索引（用于文件命名）
 * @returns {Promise<string>} 本地图片路径或原始 URL
 */
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

    // 如果文件已经存在，就直接复用，避免重复下载
    if (fs.existsSync(filepath)) {
      return `/images/articles/${filename}`;
    }

    const res = await fetch(imageUrl);
    if (!res.ok) {
      console.warn(`⚠️  图片下载失败 (${res.status}): ${imageUrl}`);
      return imageUrl;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filepath, buffer);

    console.log(`✅ 保存图片: /images/articles/${filename}`);
    return `/images/articles/${filename}`;
  } catch (error) {
    console.warn(`⚠️  下载图片出错: ${imageUrl}`, error.message || error);
    return imageUrl;
  }
}

/**
 * 处理 Markdown 内容中的图片：下载到本地并替换为本地路径
 *
 * @param {string} content - Markdown 内容
 * @param {string} articleId - 文章 ID
 * @returns {Promise<string>} 处理后的 Markdown 内容
 */
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

module.exports = {
  downloadImageToLocal,
  processImagesInContent
};

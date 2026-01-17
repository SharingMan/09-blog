#!/usr/bin/env node

/**
 * 从 Notion 公开页面直接导入工具
 * 尝试从 Notion 公开页面 URL 提取内容并导入
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ARTICLES_DIR = path.join(__dirname, '../app/data/articles');
const IMAGES_DIR = path.join(__dirname, '../public/images/articles');

// 确保目录存在
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

ensureDir(ARTICLES_DIR);
ensureDir(IMAGES_DIR);

/**
 * 计算阅读时间
 */
function calculateReadTime(content) {
  const wordCount = content.replace(/\s/g, '').length;
  const minutes = Math.ceil(wordCount / 300);
  return `${minutes} 分钟`;
}

/**
 * 格式化日期
 */
function formatDate(dateStr) {
  let date = dateStr ? new Date(dateStr) : new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

/**
 * 从 Notion 公开页面获取内容
 */
function fetchNotionPage(url) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + (urlObj.search || ''),
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
      };

      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      const req = protocol.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve(data);
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('请求超时'));
      });
      
      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 从 HTML 中提取文本内容（简化版）
 */
function extractContentFromHTML(html) {
  let markdown = '';
  
  // 尝试提取页面标题
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                     html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (titleMatch) {
    const title = titleMatch[1].replace(/[|–-].*$/, '').trim();
    if (title) {
      markdown += `# ${title}\n\n`;
    }
  }
  
  // 尝试提取主要内容（Notion 通常使用特定的类名）
  // 这里提供一个基础实现
  const contentPatterns = [
    /<div[^>]*class="[^"]*notion-page-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
  ];
  
  let contentFound = false;
  for (const pattern of contentPatterns) {
    const match = html.match(pattern);
    if (match) {
      let content = match[1];
      // 移除脚本和样式
      content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
      content = content.replace(/<style[\s\S]*?<\/style>/gi, '');
      // 转换一些基本标签
      content = content.replace(/<h1[^>]*>([^<]+)<\/h1>/gi, '# $1\n\n');
      content = content.replace(/<h2[^>]*>([^<]+)<\/h2>/gi, '## $1\n\n');
      content = content.replace(/<h3[^>]*>([^<]+)<\/h3>/gi, '### $1\n\n');
      content = content.replace(/<p[^>]*>([^<]+)<\/p>/gi, '$1\n\n');
      content = content.replace(/<strong[^>]*>([^<]+)<\/strong>/gi, '**$1**');
      content = content.replace(/<em[^>]*>([^<]+)<\/em>/gi, '*$1*');
      content = content.replace(/<[^>]+>/g, '');
      content = content.replace(/\n{3,}/g, '\n\n');
      
      if (content.trim().length > 100) {
        markdown += content.trim();
        contentFound = true;
        break;
      }
    }
  }
  
  // 如果没找到结构化内容，尝试提取所有文本
  if (!contentFound) {
    // 移除脚本和样式
    let text = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    
    if (text.length > 200) {
      markdown += text.substring(0, 5000); // 限制长度
    }
  }
  
  return markdown.trim();
}

/**
 * 下载图片
 */
async function downloadImage(imageUrl, targetDir) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(imageUrl);
      const filename = path.basename(urlObj.pathname) || `image_${Date.now()}.jpg`;
      const filepath = path.join(targetDir, filename);
      
      const protocol = urlObj.protocol === 'https:' ? https : http;
      const file = fs.createWriteStream(filepath);
      
      protocol.get(imageUrl, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(`/images/articles/${filename}`);
          });
        } else {
          file.close();
          fs.unlinkSync(filepath);
          reject(new Error(`下载失败: ${response.statusCode}`));
        }
      }).on('error', (err) => {
        file.close();
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 处理图片
 */
function processImages(content) {
  // 提取图片 URL（简化版，实际可能需要更复杂的处理）
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const imageUrls = [];
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    const url = match[2];
    if (url.startsWith('http://') || url.startsWith('https://')) {
      imageUrls.push({ alt: match[1], url });
    }
  }
  
  return { content, imageUrls };
}

/**
 * 导入 Notion 公开页面
 */
async function importNotionPublicPage(url, options = {}) {
  const { title, date, category, tags } = options;
  
  console.log('正在从 Notion 公开页面获取内容...');
  console.log(`URL: ${url}\n`);
  
  try {
    const html = await fetchNotionPage(url);
    
    if (!html || html.length < 1000) {
      throw new Error('获取的内容过少，可能页面需要登录或权限不足');
    }
    
    // 提取内容
    let content = extractContentFromHTML(html);
    
    if (!content || content.trim().length < 100) {
      console.warn('⚠️  无法从页面提取足够的内容');
      console.log('\n推荐使用导出方式：');
      console.log('1. 在 Notion 中打开页面');
      console.log('2. 点击 "..." → "Export" → 选择 "Markdown"');
      console.log('3. 下载后使用：node scripts/import-notion.js <文件路径>');
      return;
    }
    
    // 提取标题
    let articleTitle = title;
    if (!articleTitle) {
      const titleMatch = content.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        articleTitle = titleMatch[1].trim();
        content = content.replace(/^#\s+.+$/m, '').trim();
      } else {
        articleTitle = '从 Notion 导入的文章';
      }
    }
    
    const articleDate = formatDate(date);
    const readTime = calculateReadTime(content);
    
    // 处理图片
    const { imageUrls } = processImages(content);
    console.log(`找到 ${imageUrls.length} 张图片`);
    
    // 生成文件 ID
    const id = Date.now().toString();
    const filename = `${id}.md`;
    const outputPath = path.join(ARTICLES_DIR, filename);
    
    // 构建 frontmatter
    let frontmatter = `---
title: ${articleTitle}
date: ${articleDate}
readTime: ${readTime}`;

    if (category) {
      frontmatter += `\ncategory: ${category}`;
    }

    if (tags && tags.length > 0) {
      frontmatter += `\ntags: ${tags.join(', ')}`;
    }

    frontmatter += '\n---\n\n';

    // 写入文件
    const fullContent = frontmatter + content;
    fs.writeFileSync(outputPath, fullContent, 'utf-8');
    
    console.log('');
    console.log('=========================================');
    console.log('✓ 导入成功！');
    console.log('=========================================');
    console.log(`文件: ${filename}`);
    console.log(`标题: ${articleTitle}`);
    console.log(`日期: ${articleDate}`);
    console.log(`阅读时间: ${readTime}`);
    if (category) console.log(`分类: ${category}`);
    if (tags && tags.length > 0) console.log(`标签: ${tags.join(', ')}`);
    console.log('=========================================');
    console.log('\n注意：从公开页面导入的内容可能不完整。');
    console.log('如果内容缺失，建议使用导出方式获得完整内容。');
    
    return filename;
  } catch (error) {
    console.error('❌ 导入失败:', error.message);
    console.log('\n推荐方法：');
    console.log('1. 在 Notion 中打开页面');
    console.log('2. 点击 "..." → "Export" → 选择 "Markdown"');
    console.log('3. 下载后使用：node scripts/import-notion.js <文件路径>');
    console.log('\n这样可以获得完整的内容和格式。');
  }
}

// 解析命令行参数
function parseArgs(args) {
  const options = {};
  let url = null;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--title' && args[i + 1]) {
      options.title = args[++i];
    } else if (arg === '--date' && args[i + 1]) {
      options.date = args[++i];
    } else if (arg === '--category' && args[i + 1]) {
      options.category = args[++i];
    } else if (arg === '--tags' && args[i + 1]) {
      options.tags = args[++i].split(',').map(t => t.trim());
    } else if (!arg.startsWith('--') && arg.startsWith('http')) {
      url = arg;
    }
  }
  
  return { url, options };
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('从 Notion 公开页面导入工具');
    console.log('');
    console.log('使用方法:');
    console.log('  node scripts/import-notion-public.js <Notion公开页面URL> [选项]');
    console.log('');
    console.log('选项:');
    console.log('  --title "标题"');
    console.log('  --date "2025-01-17"');
    console.log('  --category "分类"');
    console.log('  --tags "标签1,标签2"');
    console.log('');
    console.log('示例:');
    console.log('  node scripts/import-notion-public.js "https://pine-parrot-996.notion.site/39-xxx"');
    console.log('');
    console.log('注意：');
    console.log('  从公开页面导入可能无法获取完整内容。');
    console.log('  推荐使用导出方式：在 Notion 中导出为 Markdown，然后使用 import-notion.js');
    process.exit(1);
  }
  
  const { url, options } = parseArgs(args);
  
  if (!url) {
    console.error('❌ 错误: 请提供 Notion 公开页面 URL');
    process.exit(1);
  }
  
  importNotionPublicPage(url, options);
}

module.exports = { importNotionPublicPage };

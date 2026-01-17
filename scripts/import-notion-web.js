#!/usr/bin/env node

/**
 * 从 Notion 公开网页直接导入工具（使用 Puppeteer）
 * 支持从 Notion 公开页面 URL 直接导入内容
 * 
 * 使用方法：
 * node scripts/import-notion-web.js <Notion公开页面URL> [选项]
 * 
 * 需要先安装：npm install puppeteer
 */

const fs = require('fs');
const path = require('path');

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
 * 使用 Puppeteer 从 Notion 公开页面获取内容
 */
async function fetchNotionPageWithPuppeteer(url) {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (error) {
    console.error('❌ 错误: 未安装 puppeteer');
    console.log('\n请先安装:');
    console.log('  npm install puppeteer');
    console.log('\n或者使用导出方式：');
    console.log('  1. 在 Notion 中导出为 Markdown');
    console.log('  2. 使用: node scripts/import-notion.js <文件路径>');
    process.exit(1);
  }

  console.log('正在启动浏览器...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    // 设置视口
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('正在加载页面...');
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // 等待内容加载
    await page.waitForTimeout(3000);
    
    console.log('正在提取内容...');
    
    // 提取页面内容
    const content = await page.evaluate(() => {
      let markdown = '';
      
      // 提取标题
      const titleEl = document.querySelector('h1') || 
                     document.querySelector('[data-block-id] h1') ||
                     document.querySelector('.notion-page-content h1');
      if (titleEl) {
        markdown += `# ${titleEl.innerText.trim()}\n\n`;
      }
      
      // 提取所有文本块
      const blocks = document.querySelectorAll('[data-block-id]');
      blocks.forEach(block => {
        const text = block.innerText?.trim();
        if (text && text.length > 0) {
          // 判断块类型
          const tagName = block.tagName?.toLowerCase();
          if (tagName === 'h1' || block.querySelector('h1')) {
            markdown += `# ${text}\n\n`;
          } else if (tagName === 'h2' || block.querySelector('h2')) {
            markdown += `## ${text}\n\n`;
          } else if (tagName === 'h3' || block.querySelector('h3')) {
            markdown += `### ${text}\n\n`;
          } else {
            markdown += `${text}\n\n`;
          }
        }
      });
      
      // 如果没有提取到内容，尝试其他方式
      if (markdown.trim().length < 100) {
        const allText = document.body.innerText;
        if (allText && allText.length > 100) {
          markdown = allText;
        }
      }
      
      return markdown.trim();
    });
    
    // 提取图片
    const images = await page.evaluate(() => {
      const imgElements = document.querySelectorAll('img');
      const imageUrls = [];
      imgElements.forEach(img => {
        const src = img.src || img.getAttribute('data-src');
        if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
          imageUrls.push({
            url: src,
            alt: img.alt || '',
          });
        }
      });
      return imageUrls;
    });
    
    await browser.close();
    
    return { content, images };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

/**
 * 下载图片
 */
async function downloadImage(imageUrl, targetDir) {
  return new Promise((resolve, reject) => {
    try {
      const https = require('https');
      const http = require('http');
      
      const urlObj = new URL(imageUrl);
      const ext = path.extname(urlObj.pathname) || '.jpg';
      const filename = `notion_${Date.now()}${ext}`;
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
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
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
 * 处理图片并更新 Markdown
 */
async function processImages(content, images) {
  let processedContent = content;
  let imageIndex = 0;
  
  for (const image of images) {
    try {
      console.log(`  正在下载图片 ${imageIndex + 1}/${images.length}...`);
      const localPath = await downloadImage(image.url, IMAGES_DIR);
      console.log(`  ✓ 已下载: ${path.basename(localPath)}`);
      
      // 在内容中查找并替换图片
      // 这里简化处理，实际可能需要更复杂的匹配
      const imageAlt = image.alt || `图片${imageIndex + 1}`;
      processedContent = processedContent.replace(
        new RegExp(image.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        localPath
      );
      
      // 如果没有找到，在内容末尾添加
      if (!processedContent.includes(localPath)) {
        processedContent += `\n\n![${imageAlt}](${localPath})`;
      }
      
      imageIndex++;
    } catch (error) {
      console.warn(`  ⚠️ 图片下载失败: ${error.message}`);
    }
  }
  
  return processedContent;
}

/**
 * 导入 Notion 公开页面
 */
async function importNotionWebPage(url, options = {}) {
  const { title, date, category, tags } = options;
  
  console.log('=========================================');
  console.log('从 Notion 公开页面导入');
  console.log('=========================================');
  console.log(`URL: ${url}\n`);
  
  try {
    const { content, images } = await fetchNotionPageWithPuppeteer(url);
    
    if (!content || content.trim().length < 100) {
      console.warn('⚠️  无法提取足够的内容');
      console.log('\n推荐使用导出方式：');
      console.log('1. 在 Notion 中打开页面');
      console.log('2. 点击 "..." → "Export" → 选择 "Markdown"');
      console.log('3. 使用: node scripts/import-notion.js <文件路径>');
      return;
    }
    
    // 提取标题
    let articleTitle = title;
    if (!articleTitle) {
      const titleMatch = content.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        articleTitle = titleMatch[1].trim();
      } else {
        articleTitle = '从 Notion 导入的文章';
      }
    }
    
    // 移除标题行（如果存在）
    let cleanContent = content.replace(/^#\s+.+$/m, '').trim();
    
    const articleDate = formatDate(date);
    const readTime = calculateReadTime(cleanContent);
    
    // 处理图片
    if (images && images.length > 0) {
      console.log(`\n找到 ${images.length} 张图片，正在处理...`);
      cleanContent = await processImages(cleanContent, images);
    }
    
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
    const fullContent = frontmatter + cleanContent;
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
    if (images && images.length > 0) console.log(`图片: ${images.length} 张`);
    console.log('=========================================');
    
    return filename;
  } catch (error) {
    console.error('❌ 导入失败:', error.message);
    console.log('\n推荐方法：');
    console.log('1. 在 Notion 中打开页面');
    console.log('2. 点击 "..." → "Export" → 选择 "Markdown"');
    console.log('3. 使用: node scripts/import-notion.js <文件路径>');
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
    console.log('从 Notion 公开网页直接导入工具');
    console.log('');
    console.log('使用方法:');
    console.log('  node scripts/import-notion-web.js <Notion公开页面URL> [选项]');
    console.log('');
    console.log('选项:');
    console.log('  --title "标题"');
    console.log('  --date "2025-01-17"');
    console.log('  --category "分类"');
    console.log('  --tags "标签1,标签2"');
    console.log('');
    console.log('示例:');
    console.log('  node scripts/import-notion-web.js "https://pine-parrot-996.notion.site/39-xxx"');
    console.log('');
    console.log('注意：');
    console.log('  需要先安装: npm install puppeteer');
    console.log('  首次运行会下载 Chromium（约 100MB）');
    process.exit(1);
  }
  
  const { url, options } = parseArgs(args);
  
  if (!url) {
    console.error('❌ 错误: 请提供 Notion 公开页面 URL');
    process.exit(1);
  }
  
  importNotionWebPage(url, options);
}

module.exports = { importNotionWebPage };

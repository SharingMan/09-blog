#!/usr/bin/env node

/**
 * Notion Markdown 导入工具（增强版）
 * 自动处理 Markdown 文件和图片
 * 
 * 使用方法：
 * node scripts/import-notion.js <markdown文件路径> [选项]
 * 
 * 选项：
 *   --title "标题"     指定文章标题
 *   --date "2025-01-17" 指定发布日期
 *   --category "分类"  指定文章分类
 *   --tags "标签1,标签2" 指定文章标签
 *   --images-dir "路径" 指定图片目录（默认：与 Markdown 文件同目录）
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.join(__dirname, '../app/data/articles');
const IMAGES_DIR = path.join(__dirname, '../public/images/articles');

/**
 * 确保目录存在
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

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
  let date;
  
  if (dateStr) {
    date = new Date(dateStr);
  } else {
    date = new Date();
  }
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

/**
 * 从文件名或内容中提取标题
 */
function extractTitle(content, providedTitle, filePath) {
  if (providedTitle) {
    return providedTitle;
  }
  
  // 尝试从文件名提取
  const fileName = path.basename(filePath, path.extname(filePath));
  if (fileName && fileName !== 'README') {
    // 移除可能的日期前缀
    const cleanName = fileName.replace(/^\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?\s*/, '');
    if (cleanName.length > 0) {
      return cleanName;
    }
  }
  
  // 尝试从内容第一行提取标题
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.length > 0) {
      return trimmed.replace(/^#+\s*/, '').substring(0, 50);
    }
  }
  
  return '未命名文章';
}

/**
 * 清理内容（移除已有的 frontmatter）
 */
function cleanContent(content) {
  return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '').trim();
}

/**
 * 查找图片文件
 */
function findImageFile(imagePath, searchDirs) {
  // 如果是绝对路径或网络路径，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/')) {
    return null;
  }
  
  const imageName = path.basename(imagePath);
  
  // 在指定目录中查找
  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    
    // 直接查找
    const directPath = path.join(dir, imageName);
    if (fs.existsSync(directPath)) {
      return directPath;
    }
    
    // 在子目录中查找（Notion 导出通常会有子目录）
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      if (file.isDirectory()) {
        const subPath = path.join(dir, file.name, imageName);
        if (fs.existsSync(subPath)) {
          return subPath;
        }
      }
    }
  }
  
  return null;
}

/**
 * 复制图片到目标目录
 */
function copyImage(sourcePath, targetDir) {
  ensureDir(targetDir);
  
  const imageName = path.basename(sourcePath);
  const targetPath = path.join(targetDir, imageName);
  
  // 如果目标文件已存在，添加时间戳
  if (fs.existsSync(targetPath)) {
    const ext = path.extname(imageName);
    const name = path.basename(imageName, ext);
    const timestamp = Date.now();
    const newName = `${name}_${timestamp}${ext}`;
    fs.copyFileSync(sourcePath, path.join(targetDir, newName));
    return `/images/articles/${newName}`;
  }
  
  fs.copyFileSync(sourcePath, targetPath);
  return `/images/articles/${imageName}`;
}

/**
 * 处理 Markdown 中的图片
 */
function processImages(content, markdownDir, imagesSearchDir) {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const processedContent = content.replace(imageRegex, (match, alt, imagePath) => {
    // 解码 URL 编码的路径
    let decodedPath = decodeURIComponent(imagePath);
    
    // 如果是相对路径，尝试查找文件
    if (!decodedPath.startsWith('http://') && !decodedPath.startsWith('https://') && !decodedPath.startsWith('/')) {
      const searchDirs = [
        imagesSearchDir || markdownDir,
        path.dirname(markdownDir),
        path.join(path.dirname(markdownDir), path.basename(markdownDir, path.extname(markdownDir))),
      ];
      
      const imageFile = findImageFile(decodedPath, searchDirs);
      
      if (imageFile) {
        const newPath = copyImage(imageFile, IMAGES_DIR);
        console.log(`  ✓ 已复制图片: ${path.basename(imageFile)} -> ${newPath}`);
        return `![${alt}](${newPath})`;
      } else {
        console.warn(`  ⚠ 未找到图片: ${decodedPath}`);
        // 保持原路径，但尝试修复
        return match;
      }
    }
    
    // 如果已经是绝对路径或网络路径，保持不变
    return match;
  });
  
  return processedContent;
}

/**
 * 导入 Markdown 文件
 */
function importNotionMarkdown(filePath, options = {}) {
  const { title, date, category, tags, imagesDir } = options;
  
  // 读取文件
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const cleanedContent = cleanContent(content);
  
  // 提取信息
  const markdownDir = path.dirname(filePath);
  const articleTitle = extractTitle(cleanedContent, title, filePath);
  const articleDate = formatDate(date);
  const readTime = calculateReadTime(cleanedContent);
  
  // 处理图片
  console.log('正在处理图片...');
  const processedContent = processImages(cleanedContent, markdownDir, imagesDir);
  
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
  const fullContent = frontmatter + processedContent;
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
  
  return filename;
}

// 解析命令行参数
function parseArgs(args) {
  const options = {};
  let filePath = null;
  
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
    } else if (arg === '--images-dir' && args[i + 1]) {
      options.imagesDir = args[++i];
    } else if (!arg.startsWith('--')) {
      filePath = arg;
    }
  }
  
  return { filePath, options };
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Notion Markdown 导入工具（增强版）');
    console.log('');
    console.log('使用方法:');
    console.log('  node scripts/import-notion.js <markdown文件> [选项]');
    console.log('');
    console.log('选项:');
    console.log('  --title "标题"           指定文章标题');
    console.log('  --date "2025-01-17"     指定发布日期');
    console.log('  --category "分类"       指定文章分类');
    console.log('  --tags "标签1,标签2"    指定文章标签');
    console.log('  --images-dir "路径"     指定图片搜索目录（默认：与 Markdown 文件同目录）');
    console.log('');
    console.log('示例:');
    console.log('  # 基本用法（自动处理图片）');
    console.log('  node scripts/import-notion.js ~/Downloads/周记.md');
    console.log('');
    console.log('  # 完整用法');
    console.log('  node scripts/import-notion.js ~/Downloads/周记.md \\');
    console.log('    --title "2026年第2周周记" \\');
    console.log('    --date "2026-01-12" \\');
    console.log('    --category "生活" \\');
    console.log('    --tags "周记,反思"');
    console.log('');
    console.log('  # 指定图片目录');
    console.log('  node scripts/import-notion.js ~/Downloads/周记.md \\');
    console.log('    --images-dir ~/Downloads/周记图片');
    process.exit(1);
  }
  
  const { filePath, options } = parseArgs(args);
  
  if (!filePath) {
    console.error('❌ 错误: 请指定 Markdown 文件路径');
    process.exit(1);
  }
  
  importNotionMarkdown(filePath, options);
}

module.exports = { importNotionMarkdown };

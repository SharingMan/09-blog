#!/usr/bin/env node

/**
 * 手动导入 Markdown 文件工具
 * 将 Notion 导出的 Markdown 文件转换为博客格式
 * 
 * 使用方法：
 * node scripts/import-markdown.js <markdown文件路径> [标题] [日期]
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.join(__dirname, '../app/data/articles');

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
  // 支持多种日期格式
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
function extractTitle(content, providedTitle) {
  if (providedTitle) {
    return providedTitle;
  }
  
  // 尝试从内容第一行提取标题
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.length > 0) {
      // 移除 Markdown 标题标记
      return trimmed.replace(/^#+\s*/, '');
    }
  }
  
  // 如果找不到，使用默认标题
  return '未命名文章';
}

/**
 * 清理内容（移除已有的 frontmatter）
 */
function cleanContent(content) {
  // 移除可能存在的 frontmatter
  return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '').trim();
}

/**
 * 导入 Markdown 文件
 */
function importMarkdown(filePath, options = {}) {
  const { title, date, category, tags } = options;
  
  // 读取文件
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const cleanedContent = cleanContent(content);
  
  // 提取信息
  const articleTitle = extractTitle(cleanedContent, title);
  const articleDate = formatDate(date);
  const readTime = calculateReadTime(cleanedContent);
  
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
  const fullContent = frontmatter + cleanedContent;
  fs.writeFileSync(outputPath, fullContent, 'utf-8');
  
  console.log(`✓ 已导入文章: ${filename}`);
  console.log(`  标题: ${articleTitle}`);
  console.log(`  日期: ${articleDate}`);
  console.log(`  阅读时间: ${readTime}`);
  
  return filename;
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('使用方法:');
    console.log('  node scripts/import-markdown.js <markdown文件> [标题] [日期] [分类] [标签]');
    console.log('');
    console.log('示例:');
    console.log('  node scripts/import-markdown.js ~/Downloads/日记.md "我的日记" "2025-01-17" "生活" "日记,日常"');
    process.exit(1);
  }
  
  const filePath = args[0];
  const title = args[1];
  const date = args[2];
  const category = args[3];
  const tags = args[4] ? args[4].split(',').map(t => t.trim()) : [];
  
  importMarkdown(filePath, { title, date, category, tags });
}

module.exports = { importMarkdown };

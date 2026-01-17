#!/usr/bin/env node

/**
 * Notion 日记同步工具
 * 将 Notion 中的日记同步到博客
 * 
 * 使用方法：
 * 1. 配置 Notion API（见下方说明）
 * 2. 运行：node scripts/notion-sync.js
 */

const fs = require('fs');
const path = require('path');

// 配置区域
const CONFIG = {
  // Notion API 配置（需要先创建 Integration 并获取 token）
  NOTION_TOKEN: process.env.NOTION_TOKEN || '', // 从环境变量读取，或直接填写
  DATABASE_ID: process.env.NOTION_DATABASE_ID || '', // Notion 数据库 ID
  
  // 博客文章目录
  ARTICLES_DIR: path.join(__dirname, '../app/data/articles'),
  
  // 日期格式转换
  dateFormat: (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${year}年${month}月${day}日`;
  },
  
  // 计算阅读时间（简单估算：中文约 300 字/分钟）
  calculateReadTime: (content) => {
    const wordCount = content.replace(/\s/g, '').length;
    const minutes = Math.ceil(wordCount / 300);
    return `${minutes} 分钟`;
  }
};

/**
 * 从 Notion API 获取页面内容
 */
async function fetchNotionPage(pageId) {
  if (!CONFIG.NOTION_TOKEN) {
    throw new Error('请先配置 NOTION_TOKEN');
  }

  const { Client } = require('@notionhq/client');
  const notion = new Client({ auth: CONFIG.NOTION_TOKEN });

  try {
    // 获取页面内容
    const page = await notion.pages.retrieve({ page_id: pageId });
    
    // 获取页面块内容
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
    });

    return { page, blocks };
  } catch (error) {
    console.error('获取 Notion 页面失败:', error);
    throw error;
  }
}

/**
 * 将 Notion 块转换为 Markdown
 */
function blocksToMarkdown(blocks) {
  let markdown = '';

  for (const block of blocks.results) {
    switch (block.type) {
      case 'paragraph':
        markdown += block.paragraph.rich_text.map(t => t.plain_text).join('') + '\n\n';
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
        markdown += '```' + (block.code.language || '') + '\n';
        markdown += block.code.rich_text.map(t => t.plain_text).join('') + '\n';
        markdown += '```\n\n';
        break;
      case 'divider':
        markdown += '---\n\n';
        break;
      default:
        // 其他类型暂时跳过
        break;
    }
  }

  return markdown.trim();
}

/**
 * 从 Notion 数据库获取所有页面
 */
async function fetchNotionDatabase() {
  if (!CONFIG.NOTION_TOKEN || !CONFIG.DATABASE_ID) {
    throw new Error('请先配置 NOTION_TOKEN 和 NOTION_DATABASE_ID');
  }

  const { Client } = require('@notionhq/client');
  const notion = new Client({ auth: CONFIG.NOTION_TOKEN });

  try {
    const response = await notion.databases.query({
      database_id: CONFIG.DATABASE_ID,
      // 可以添加筛选和排序
      sorts: [
        {
          property: 'Date', // 假设日期字段名为 Date
          direction: 'descending',
        },
      ],
    });

    return response.results;
  } catch (error) {
    console.error('获取 Notion 数据库失败:', error);
    throw error;
  }
}

/**
 * 生成文章 ID（使用时间戳）
 */
function generateArticleId() {
  return Date.now().toString();
}

/**
 * 创建文章文件
 */
function createArticleFile(article) {
  const { title, date, content, readTime, category, tags } = article;
  const id = generateArticleId();
  const filename = `${id}.md`;
  const filepath = path.join(CONFIG.ARTICLES_DIR, filename);

  // 构建 frontmatter
  let frontmatter = `---
title: ${title}
date: ${date}
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
  fs.writeFileSync(filepath, fullContent, 'utf-8');

  console.log(`✓ 已创建文章: ${filename}`);
  return filename;
}

/**
 * 主函数：同步 Notion 日记
 */
async function syncNotionDiary() {
  console.log('开始同步 Notion 日记...\n');

  try {
    // 检查配置
    if (!CONFIG.NOTION_TOKEN) {
      console.error('❌ 错误: 请先配置 NOTION_TOKEN');
      console.log('\n配置方法:');
      console.log('1. 在 Notion 中创建 Integration: https://www.notion.so/my-integrations');
      console.log('2. 获取 API Token');
      console.log('3. 设置环境变量: export NOTION_TOKEN="your_token"');
      console.log('   或在脚本中直接填写 CONFIG.NOTION_TOKEN');
      return;
    }

    if (!CONFIG.DATABASE_ID) {
      console.error('❌ 错误: 请先配置 NOTION_DATABASE_ID');
      console.log('\n获取方法:');
      console.log('1. 打开您的 Notion 数据库页面');
      console.log('2. 复制 URL 中的数据库 ID（32位字符）');
      return;
    }

    // 获取数据库中的所有页面
    const pages = await fetchNotionDatabase();
    console.log(`找到 ${pages.length} 篇日记\n`);

    // 处理每一页
    for (const page of pages) {
      try {
        // 获取页面属性（标题、日期等）
        const title = page.properties.Title?.title?.[0]?.plain_text || 
                     page.properties.Name?.title?.[0]?.plain_text || 
                     '未命名';
        
        const date = page.properties.Date?.date?.start || 
                    page.properties['创建时间']?.created_time ||
                    page.created_time;
        
        // 获取页面内容
        const { blocks } = await fetchNotionPage(page.id);
        const content = blocksToMarkdown({ results: blocks.results });
        
        // 生成文章
        const article = {
          title,
          date: CONFIG.dateFormat(date),
          content,
          readTime: CONFIG.calculateReadTime(content),
          category: page.properties.Category?.select?.name,
          tags: page.properties.Tags?.multi_select?.map(t => t.name),
        };

        createArticleFile(article);
      } catch (error) {
        console.error(`处理页面失败 (${page.id}):`, error.message);
      }
    }

    console.log('\n✓ 同步完成！');
  } catch (error) {
    console.error('同步失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  syncNotionDiary();
}

module.exports = { syncNotionDiary, createArticleFile };

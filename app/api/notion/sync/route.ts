import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import fs from 'fs'
import path from 'path'

// 同步状态文件路径
const SYNC_STATE_FILE = path.join(process.cwd(), '.notion-sync-state.json')

interface SyncState {
  lastSyncTime: string
  syncedPages: Record<string, string> // pageId -> articleId
}

// 读取同步状态
function readSyncState(): SyncState {
  try {
    if (fs.existsSync(SYNC_STATE_FILE)) {
      const content = fs.readFileSync(SYNC_STATE_FILE, 'utf-8')
      return JSON.parse(content)
    }
  } catch (error) {
    console.error('读取同步状态失败:', error)
  }
  return {
    lastSyncTime: new Date(0).toISOString(),
    syncedPages: {}
  }
}

// 保存同步状态
function saveSyncState(state: SyncState) {
  try {
    fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8')
  } catch (error) {
    console.error('保存同步状态失败:', error)
  }
}

// 日期格式转换
function formatDate(date: string | Date): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${year}年${month}月${day}日`
}

// 计算阅读时间
function calculateReadTime(content: string): string {
  const wordCount = content.replace(/\s/g, '').length
  const minutes = Math.ceil(wordCount / 300)
  return `${minutes} 分钟`
}

// 将 Notion 块转换为 Markdown
async function blocksToMarkdown(notion: Client, blockId: string, depth = 0): Promise<string> {
  if (depth > 10) return '' // 防止无限递归

  const blocks = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 100,
  })

  let markdown = ''

  for (const block of blocks.results) {
    const blockType = (block as any).type
    if (!blockType) continue
    
    switch (blockType) {
      case 'paragraph':
        const paragraphText = (block as any).paragraph.rich_text.map((t: any) => t.plain_text).join('')
        if (paragraphText.trim()) {
          markdown += paragraphText + '\n\n'
        }
        break

      case 'heading_1':
        markdown += '# ' + (block as any).heading_1.rich_text.map((t: any) => t.plain_text).join('') + '\n\n'
        break

      case 'heading_2':
        markdown += '## ' + (block as any).heading_2.rich_text.map((t: any) => t.plain_text).join('') + '\n\n'
        break

      case 'heading_3':
        markdown += '### ' + (block as any).heading_3.rich_text.map((t: any) => t.plain_text).join('') + '\n\n'
        break

      case 'bulleted_list_item':
        markdown += '- ' + (block as any).bulleted_list_item.rich_text.map((t: any) => t.plain_text).join('') + '\n'
        break

      case 'numbered_list_item':
        markdown += '1. ' + (block as any).numbered_list_item.rich_text.map((t: any) => t.plain_text).join('') + '\n'
        break

      case 'quote':
        markdown += '> ' + (block as any).quote.rich_text.map((t: any) => t.plain_text).join('') + '\n\n'
        break

      case 'code':
        const language = (block as any).code.language || ''
        const codeText = (block as any).code.rich_text.map((t: any) => t.plain_text).join('')
        markdown += '```' + language + '\n' + codeText + '\n```\n\n'
        break

      case 'divider':
        markdown += '---\n\n'
        break

      case 'image':
        const imageBlock = (block as any).image
        const imageUrl = imageBlock.type === 'external' 
          ? imageBlock.external.url 
          : imageBlock.file?.url || ''
        const imageCaption = imageBlock.caption.map((t: any) => t.plain_text).join('')
        markdown += `![${imageCaption}](${imageUrl})\n\n`
        break

      case 'to_do':
        const todoBlock = (block as any).to_do
        const checked = todoBlock.checked ? 'x' : ' '
        const todoText = todoBlock.rich_text.map((t: any) => t.plain_text).join('')
        markdown += `- [${checked}] ${todoText}\n`
        break

      case 'toggle':
        const toggleBlock = (block as any).toggle
        markdown += '<details>\n<summary>' + toggleBlock.rich_text.map((t: any) => t.plain_text).join('') + '</summary>\n\n'
        if ((block as any).has_children) {
          const childContent = await blocksToMarkdown(notion, (block as any).id, depth + 1)
          markdown += childContent
        }
        markdown += '\n</details>\n\n'
        break

      case 'callout':
        const calloutBlock = (block as any).callout
        const calloutIcon = calloutBlock.icon?.emoji || '💡'
        const calloutText = calloutBlock.rich_text.map((t: any) => t.plain_text).join('')
        markdown += `> ${calloutIcon} ${calloutText}\n\n`
        break

      default:
        // 处理有子块的类型
        const blockAny = block as any
        if (blockAny.has_children && 'id' in blockAny) {
          const childContent = await blocksToMarkdown(notion, blockAny.id, depth + 1)
          if (childContent) {
            markdown += childContent
          }
        }
        break
    }
  }

  return markdown.trim()
}

// 创建文章文件
function createArticleFile(article: {
  id: string
  title: string
  date: string
  content: string
  readTime: string
  category?: string
  tags?: string[]
}) {
  const articlesDir = path.join(process.cwd(), 'app/data/articles')
  const filePath = path.join(articlesDir, `${article.id}.md`)

  // 确保目录存在
  if (!fs.existsSync(articlesDir)) {
    fs.mkdirSync(articlesDir, { recursive: true })
  }

  // 构建 frontmatter
  let frontmatter = `---
title: ${article.title}
date: ${article.date}
readTime: ${article.readTime}`

  if (article.category) {
    frontmatter += `\ncategory: ${article.category}`
  }

  if (article.tags && article.tags.length > 0) {
    frontmatter += `\ntags: ${article.tags.join(', ')}`
  }

  frontmatter += '\n---\n\n'

  // 写入文件
  const fullContent = frontmatter + article.content
  fs.writeFileSync(filePath, fullContent, 'utf-8')

  return article.id
}

// 主同步函数
// 格式化数据库 ID（添加连字符）
function formatDatabaseId(id: string): string {
  // 如果已经有连字符，直接返回
  if (id.includes('-')) {
    return id
  }
  // 如果没有连字符，添加连字符：32位字符 -> 8-4-4-4-12
  if (id.length === 32) {
    return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20, 32)}`
  }
  return id
}

async function syncNotionArticles(force = false) {
  const NOTION_TOKEN = process.env.NOTION_TOKEN
  let DATABASE_ID = process.env.NOTION_DATABASE_ID

  if (!NOTION_TOKEN || !DATABASE_ID) {
    throw new Error('请配置 NOTION_TOKEN 和 NOTION_DATABASE_ID 环境变量')
  }

  // 格式化数据库 ID
  DATABASE_ID = formatDatabaseId(DATABASE_ID)

  const notion = new Client({ auth: NOTION_TOKEN })
  const syncState = readSyncState()
  const lastSyncTime = force ? new Date(0) : new Date(syncState.lastSyncTime)

  // 查询数据库 - 使用正确的 API
  let response
  try {
    // 方法1: 尝试使用 databases.query (如果可用)
    try {
      // 检查是否有 query 方法（某些版本可能没有）
      if (typeof (notion as any).databases?.query === 'function') {
        response = await (notion as any).databases.query({
          database_id: DATABASE_ID,
        })
      } else {
        throw new Error('query method not available')
      }
    } catch (queryError: any) {
      // 方法2: 使用 search API 查询所有页面，然后过滤
      const searchResponse = await notion.search({
        filter: {
          property: 'object',
          value: 'page',
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time',
        },
      })
      
      // 过滤出属于该数据库的页面
      const pages = searchResponse.results.filter((page: any) => {
        const parent = (page as any).parent
        if (!parent) return false
        
        // 检查 parent 是否为数据库
        if (parent.type === 'database_id' && parent.database_id === DATABASE_ID) {
          return true
        }
        
        // 检查 parent 对象中是否有 database_id
        if (parent.database_id === DATABASE_ID) {
          return true
        }
        
        return false
      })
      
      // 如果没有找到页面，尝试直接使用数据库 ID 查询（可能需要不同的方法）
      if (pages.length === 0 && searchResponse.results.length > 0) {
        console.log('搜索到的页面数:', searchResponse.results.length)
        console.log('数据库 ID:', DATABASE_ID)
        const firstPage = searchResponse.results[0] as any
        console.log('第一个页面的 parent:', JSON.stringify(firstPage?.parent, null, 2))
      }
      
      response = { results: pages }
    }
  } catch (error: any) {
    throw new Error(`查询数据库失败: ${error.message || '未知错误'}`)
  }

  const pages = response.results
  let syncedCount = 0
  let updatedCount = 0
  let skippedCount = 0

  for (const page of pages) {
    try {
      // 检查是否已同步
      const pageAny = page as any
      const pageId = pageAny.id
      const lastEditedTime = new Date(pageAny.last_edited_time)

      // 如果不是强制同步，且页面未更新，且已同步过，则跳过
      if (!force && lastEditedTime <= lastSyncTime && syncState.syncedPages[pageId]) {
        console.log(`跳过页面 ${pageId}: 未更新且已同步`)
        skippedCount++
        continue
      }

      // 获取页面属性
      const properties = pageAny.properties || {}
      
      // 尝试多种方式获取标题（支持中英文）
      let title = '未命名'
      const titleKeys = ['标题', 'Title', 'title', 'Name', 'name', '标题', '標題']
      for (const key of titleKeys) {
        const prop = properties[key]
        if (prop?.type === 'title' && prop.title?.[0]?.plain_text) {
          title = prop.title[0].plain_text
          break
        }
      }
      
      // 尝试多种方式获取日期（支持中英文）
      let dateProperty = pageAny.created_time
      const dateKeys = ['发布日期', 'Date', 'date', '發布日期', '创建时间', 'created_time']
      for (const key of dateKeys) {
        const prop = properties[key]
        if (prop?.type === 'date' && prop.date?.start) {
          dateProperty = prop.date.start
          break
        } else if (prop?.type === 'created_time') {
          dateProperty = prop.created_time
          break
        }
      }
      const date = formatDate(dateProperty)
      
      // 尝试多种方式获取分类（支持中英文）
      let category: string | undefined
      const categoryKeys = ['分类', 'Category', 'category', '分類']
      for (const key of categoryKeys) {
        const prop = properties[key]
        if (prop?.type === 'select' && prop.select?.name) {
          category = prop.select.name
          break
        }
      }
      
      // 尝试多种方式获取标签（支持中英文）
      let tags: string[] = []
      const tagsKeys = ['标签', 'Tags', 'tags', '標籤']
      for (const key of tagsKeys) {
        const prop = properties[key]
        if (prop?.type === 'multi_select' && Array.isArray(prop.multi_select)) {
          tags = prop.multi_select.map((t: any) => t.name)
          break
        }
      }

      // 获取页面内容
      let content = ''
      try {
        content = await blocksToMarkdown(notion, pageId)
        console.log(`页面 ${title} 内容长度: ${content.length}`)
      } catch (contentError: any) {
        console.error(`获取页面内容失败 (${title}):`, contentError.message)
        skippedCount++
        continue
      }

      if (!content.trim()) {
        console.warn(`页面 ${title} 没有内容，跳过 (内容: "${content.substring(0, 50)}")`)
        skippedCount++
        continue
      }

      // 生成或使用已有的文章 ID（为每个页面生成唯一 ID）
      const articleId = syncState.syncedPages[pageId] || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      console.log(`处理页面: ${title}, ID: ${articleId}, 内容长度: ${content.length}`)

      // 创建文章文件
      createArticleFile({
        id: articleId,
        title,
        date,
        content,
        readTime: calculateReadTime(content),
        category,
        tags,
      })

      // 更新同步状态
      const wasSynced = !!syncState.syncedPages[pageId]
      syncState.syncedPages[pageId] = articleId
      
      if (wasSynced) {
        updatedCount++
      } else {
        syncedCount++
      }
    } catch (error) {
      const pageAny = page as any
      console.error(`处理页面失败 (${pageAny.id}):`, error)
    }
  }

  // 更新最后同步时间
  syncState.lastSyncTime = new Date().toISOString()
  saveSyncState(syncState)

  return {
    success: true,
    total: pages.length,
    synced: syncedCount,
    updated: updatedCount,
    skipped: skippedCount,
  }
}

// GET: 手动触发同步
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const force = searchParams.get('force') === 'true'

    const result = await syncNotionArticles(force)

    return NextResponse.json({
      message: '同步完成',
      ...result,
    })
  } catch (error: any) {
    console.error('同步失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || '同步失败',
      },
      { status: 500 }
    )
  }
}

// POST: 通过 webhook 触发同步
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 可以在这里验证 webhook 签名（如果需要）
    // const signature = request.headers.get('x-notion-signature')
    
    const result = await syncNotionArticles(false)

    return NextResponse.json({
      message: '同步完成',
      ...result,
    })
  } catch (error: any) {
    console.error('同步失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || '同步失败',
      },
      { status: 500 }
    )
  }
}

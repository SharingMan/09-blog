import { Client } from '@notionhq/client'
import fs from 'fs'
import path from 'path'

export interface NotionPage {
  id: string
  title: string
  date: string
  content: string
  category?: string
  tags?: string[]
  lastEditedTime: string
}

export interface SyncStatus {
  lastSyncTime: string
  syncedPages: Record<string, string> // pageId -> articleId
}

/**
 * Notion 同步工具类
 */
export class NotionSync {
  private notion: Client
  private databaseId: string
  private articlesDir: string
  private syncStatusFile: string

  constructor(token: string, databaseId: string) {
    this.notion = new Client({ auth: token })
    this.databaseId = databaseId
    this.articlesDir = path.join(process.cwd(), 'app/data/articles')
    this.syncStatusFile = path.join(process.cwd(), '.notion-sync-status.json')
    
    // 确保文章目录存在
    if (!fs.existsSync(this.articlesDir)) {
      fs.mkdirSync(this.articlesDir, { recursive: true })
    }
  }

  /**
   * 读取同步状态
   */
  private getSyncStatus(): SyncStatus {
    if (fs.existsSync(this.syncStatusFile)) {
      try {
        const content = fs.readFileSync(this.syncStatusFile, 'utf-8')
        return JSON.parse(content)
      } catch (error) {
        console.error('读取同步状态失败:', error)
      }
    }
    return {
      lastSyncTime: '',
      syncedPages: {}
    }
  }

  /**
   * 保存同步状态
   */
  private saveSyncStatus(status: SyncStatus) {
    try {
      fs.writeFileSync(this.syncStatusFile, JSON.stringify(status, null, 2), 'utf-8')
    } catch (error) {
      console.error('保存同步状态失败:', error)
    }
  }

  /**
   * 格式化日期
   */
  private formatDate(date: string | Date): string {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()
    return `${year}年${month}月${day}日`
  }

  /**
   * 计算阅读时间
   */
  private calculateReadTime(content: string): string {
    const wordCount = content.replace(/\s/g, '').length
    const minutes = Math.ceil(wordCount / 300)
    return `${minutes} 分钟`
  }

  /**
   * 将 Notion 块转换为 Markdown
   */
  private async blocksToMarkdown(blockId: string, indent = 0): Promise<string> {
    const blocks = await this.notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
    })

    let markdown = ''
    let listCounter = 1
    let inList = false

    for (const block of blocks.results) {
      const prefix = '  '.repeat(indent)
      const blockAny = block as any
      const blockType = blockAny.type
      if (!blockType) continue

      switch (blockType) {
        case 'paragraph':
          if (inList) {
            inList = false
            listCounter = 1
          }
          const paragraphText = blockAny.paragraph.rich_text
            .map((t: any) => this.richTextToMarkdown(t))
            .join('')
          markdown += paragraphText ? `${prefix}${paragraphText}\n\n` : '\n'
          break

        case 'heading_1':
          if (inList) {
            inList = false
            listCounter = 1
          }
          const h1Text = blockAny.heading_1.rich_text
            .map((t: any) => this.richTextToMarkdown(t))
            .join('')
          markdown += `${prefix}# ${h1Text}\n\n`
          break

        case 'heading_2':
          if (inList) {
            inList = false
            listCounter = 1
          }
          const h2Text = blockAny.heading_2.rich_text
            .map((t: any) => this.richTextToMarkdown(t))
            .join('')
          markdown += `${prefix}## ${h2Text}\n\n`
          break

        case 'heading_3':
          if (inList) {
            inList = false
            listCounter = 1
          }
          const h3Text = blockAny.heading_3.rich_text
            .map((t: any) => this.richTextToMarkdown(t))
            .join('')
          markdown += `${prefix}### ${h3Text}\n\n`
          break

        case 'bulleted_list_item':
          if (!inList) {
            inList = true
          }
          const bulletText = blockAny.bulleted_list_item.rich_text
            .map((t: any) => this.richTextToMarkdown(t))
            .join('')
          markdown += `${prefix}- ${bulletText}\n`
          break

        case 'numbered_list_item':
          if (!inList) {
            inList = true
            listCounter = 1
          }
          const numberedText = blockAny.numbered_list_item.rich_text
            .map((t: any) => this.richTextToMarkdown(t))
            .join('')
          markdown += `${prefix}${listCounter}. ${numberedText}\n`
          listCounter++
          break

        case 'quote':
          if (inList) {
            inList = false
            listCounter = 1
          }
          const quoteText = blockAny.quote.rich_text
            .map((t: any) => this.richTextToMarkdown(t))
            .join('')
          markdown += `${prefix}> ${quoteText}\n\n`
          break

        case 'code':
          if (inList) {
            inList = false
            listCounter = 1
          }
          const codeText = blockAny.code.rich_text.map((t: any) => t.plain_text).join('')
          const language = blockAny.code.language || ''
          markdown += `${prefix}\`\`\`${language}\n${codeText}\n\`\`\`\n\n`
          break

        case 'divider':
          if (inList) {
            inList = false
            listCounter = 1
          }
          markdown += `${prefix}---\n\n`
          break

        case 'image':
          if (inList) {
            inList = false
            listCounter = 1
          }
          const imageBlock = blockAny.image
          const imageUrl = imageBlock.type === 'external' 
            ? imageBlock.external.url 
            : imageBlock.file?.url || ''
          const imageCaption = imageBlock.caption
            .map((t: any) => t.plain_text)
            .join('')
          markdown += `${prefix}!${imageCaption ? `[${imageCaption}]` : ''}(${imageUrl})\n\n`
          break

        case 'callout':
          if (inList) {
            inList = false
            listCounter = 1
          }
          const calloutText = blockAny.callout.rich_text
            .map((t: any) => this.richTextToMarkdown(t))
            .join('')
          const emoji = blockAny.callout.icon?.type === 'emoji' 
            ? blockAny.callout.icon.emoji 
            : '💡'
          markdown += `${prefix}> ${emoji} ${calloutText}\n\n`
          break

        case 'toggle':
          if (inList) {
            inList = false
            listCounter = 1
          }
          const toggleText = blockAny.toggle.rich_text
            .map((t: any) => this.richTextToMarkdown(t))
            .join('')
          markdown += `${prefix}<details>\n${prefix}<summary>${toggleText}</summary>\n\n`
          // 递归处理子块
          if (blockAny.has_children) {
            const childMarkdown = await this.blocksToMarkdown(blockAny.id, indent + 1)
            markdown += childMarkdown
          }
          markdown += `${prefix}</details>\n\n`
          break

        default:
          // 处理有子块的块（递归）
          if (blockAny.has_children && 'id' in blockAny) {
            const childMarkdown = await this.blocksToMarkdown(blockAny.id, indent + 1)
            markdown += childMarkdown
          }
          break
      }
    }

    return markdown.trim()
  }

  /**
   * 将 Notion Rich Text 转换为 Markdown
   */
  private richTextToMarkdown(richText: any): string {
    let text = richText.plain_text

    if (richText.annotations) {
      const { bold, italic, code, strikethrough, underline } = richText.annotations

      if (code) {
        text = `\`${text}\``
      }
      if (bold) {
        text = `**${text}**`
      }
      if (italic) {
        text = `*${text}*`
      }
      if (strikethrough) {
        text = `~~${text}~~`
      }
      if (underline) {
        text = `<u>${text}</u>`
      }
    }

    if (richText.href) {
      text = `[${text}](${richText.href})`
    }

    return text
  }

  /**
   * 从 Notion 获取页面内容
   */
  async fetchPage(pageId: string): Promise<NotionPage> {
    try {
      // 获取页面信息
      const page = await this.notion.pages.retrieve({ page_id: pageId })

      // 获取页面属性
      const pageAny = page as any
      const properties = pageAny.properties || {}
      const title = properties.Title?.title?.[0]?.plain_text ||
                   properties.Name?.title?.[0]?.plain_text ||
                   '未命名'

      const date = properties.Date?.date?.start ||
                  properties['创建时间']?.created_time ||
                  pageAny.created_time

      const category = properties.Category?.select?.name ||
                      properties['分类']?.select?.name

      const tags = properties.Tags?.multi_select?.map((t: any) => t.name) ||
                  properties['标签']?.multi_select?.map((t: any) => t.name) ||
                  []

      // 获取页面内容
      const content = await this.blocksToMarkdown(pageId)

      return {
        id: pageId,
        title,
        date: this.formatDate(date),
        content,
        category,
        tags: tags.length > 0 ? tags : undefined,
        lastEditedTime: pageAny.last_edited_time,
      }
    } catch (error) {
      console.error(`获取 Notion 页面失败 (${pageId}):`, error)
      throw error
    }
  }

  /**
   * 从数据库获取所有页面
   */
  async fetchDatabasePages(since?: string): Promise<any[]> {
    try {
      const query: any = {
        database_id: this.databaseId,
        sorts: [
          {
            property: 'Date',
            direction: 'descending',
          },
        ],
      }

      // 如果指定了时间，只获取更新的页面
      if (since) {
        query.filter = {
          or: [
            {
              property: 'Date',
              date: {
                on_or_after: since,
              },
            },
            {
              property: '最后编辑时间',
              last_edited_time: {
                on_or_after: since,
              },
            },
          ],
        }
      }

      const response = await (this.notion.databases as any).query(query)
      return response.results
    } catch (error) {
      console.error('获取 Notion 数据库失败:', error)
      throw error
    }
  }

  /**
   * 保存文章到文件
   */
  saveArticle(article: NotionPage, articleId?: string): string {
    const id = articleId || Date.now().toString()
    const filename = `${id}.md`
    const filepath = path.join(this.articlesDir, filename)

    // 构建 frontmatter
    let frontmatter = `---
title: ${this.escapeYamlValue(article.title)}
date: ${this.escapeYamlValue(article.date)}
readTime: ${this.calculateReadTime(article.content)}`

    if (article.category) {
      frontmatter += `\ncategory: ${this.escapeYamlValue(article.category)}`
    }

    if (article.tags && article.tags.length > 0) {
      frontmatter += `\ntags: ${article.tags.join(', ')}`
    }

    frontmatter += '\n---\n\n'

    // 写入文件
    const fullContent = frontmatter + article.content
    fs.writeFileSync(filepath, fullContent, 'utf-8')

    return id
  }

  /**
   * 转义 YAML 值
   */
  private escapeYamlValue(value: string): string {
    if (value.includes(':') || value.includes('\n') || value.includes('"')) {
      return `"${value.replace(/"/g, '\\"')}"`
    }
    return value
  }

  /**
   * 同步 Notion 数据库
   */
  async sync(fullSync = false): Promise<{ success: boolean; synced: number; errors: string[] }> {
    const status = this.getSyncStatus()
    const errors: string[] = []
    let synced = 0

    try {
      // 获取需要同步的页面
      const since = fullSync ? undefined : status.lastSyncTime
      const pages = await this.fetchDatabasePages(since)

      console.log(`找到 ${pages.length} 个页面需要同步`)

      // 处理每个页面
      for (const page of pages) {
        try {
          const pageId = page.id
          const existingArticleId = status.syncedPages[pageId]

          // 获取页面内容
          const notionPage = await this.fetchPage(pageId)

          // 检查是否需要更新（如果已存在且最后编辑时间未变，跳过）
          if (existingArticleId && !fullSync) {
            const existingFile = path.join(this.articlesDir, `${existingArticleId}.md`)
            if (fs.existsSync(existingFile)) {
              // 可以进一步检查最后编辑时间
              // 这里简化处理，每次都更新
            }
          }

          // 保存文章
          const articleId = this.saveArticle(notionPage, existingArticleId)
          status.syncedPages[pageId] = articleId
          synced++

          console.log(`✓ 已同步: ${notionPage.title}`)
        } catch (error: any) {
          const errorMsg = `同步页面失败 (${page.id}): ${error.message}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

      // 更新同步状态
      status.lastSyncTime = new Date().toISOString()
      this.saveSyncStatus(status)

      return {
        success: errors.length === 0,
        synced,
        errors,
      }
    } catch (error: any) {
      console.error('同步失败:', error)
      return {
        success: false,
        synced,
        errors: [error.message || '同步失败'],
      }
    }
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

function formatDatabaseId(id: string): string {
  if (id.includes('-')) return id
  if (id.length === 32) {
    return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20, 32)}`
  }
  return id
}

async function blocksToMarkdown(notion: Client, blockId: string, depth = 0): Promise<string> {
  if (depth > 10) return ''
  const blocks = await notion.blocks.children.list({ block_id: blockId, page_size: 100 })
  let markdown = ''
  for (const block of blocks.results) {
    switch (block.type) {
      case 'paragraph':
        const paragraphText = block.paragraph.rich_text.map((t: any) => t.plain_text).join('')
        if (paragraphText.trim()) markdown += paragraphText + '\n\n'
        break
      case 'heading_1':
        markdown += '# ' + block.heading_1.rich_text.map((t: any) => t.plain_text).join('') + '\n\n'
        break
      case 'heading_2':
        markdown += '## ' + block.heading_2.rich_text.map((t: any) => t.plain_text).join('') + '\n\n'
        break
      case 'heading_3':
        markdown += '### ' + block.heading_3.rich_text.map((t: any) => t.plain_text).join('') + '\n\n'
        break
      default:
        if (block.has_children && 'id' in block) {
          const childContent = await blocksToMarkdown(notion, block.id, depth + 1)
          if (childContent) markdown += childContent
        }
        break
    }
  }
  return markdown.trim()
}

export async function GET() {
  try {
    const NOTION_TOKEN = process.env.NOTION_TOKEN
    let DATABASE_ID = process.env.NOTION_DATABASE_ID
    if (!NOTION_TOKEN || !DATABASE_ID) {
      return NextResponse.json({ error: '配置错误' }, { status: 400 })
    }
    DATABASE_ID = formatDatabaseId(DATABASE_ID)
    const notion = new Client({ auth: NOTION_TOKEN })
    const searchResponse = await notion.search({ filter: { property: 'object', value: 'page' } })
    const pages = searchResponse.results.filter((page: any) => {
      const parent = page.parent
      return parent?.database_id === DATABASE_ID || (parent?.type === 'database_id' && parent.database_id === DATABASE_ID)
    })
    if (pages.length === 0) {
      return NextResponse.json({ error: '未找到页面' })
    }
    const firstPage = pages[0]
    const properties = firstPage.properties || {}
    const titleProp = properties['标题'] || properties['Title'] || properties['title']
    const title = titleProp?.title?.[0]?.plain_text || '未命名'
    // 先获取页面详情
    const pageDetails = await notion.pages.retrieve({ page_id: firstPage.id })
    
    // 检查页面是否已归档
    if ((pageDetails as any).archived) {
      return NextResponse.json({
        success: false,
        error: '页面已归档',
        pageId: firstPage.id
      })
    }
    
    // 再获取块列表 - 尝试多次，因为可能需要分页
    let allBlocks: any[] = []
    let hasMore = true
    let startCursor: string | undefined = undefined
    
    try {
      while (hasMore) {
        const response = await notion.blocks.children.list({
          block_id: firstPage.id,
          page_size: 100,
          start_cursor: startCursor
        })
        allBlocks = allBlocks.concat(response.results)
        hasMore = response.has_more
        startCursor = response.next_cursor || undefined
        if (!hasMore) break
      }
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: `获取块失败: ${error.message}`,
        pageId: firstPage.id,
        pageType: pageDetails.object,
        pageUrl: (pageDetails as any).url
      })
    }
    
    const blocks = { results: allBlocks }
    
    const content = await blocksToMarkdown(notion, firstPage.id)
    return NextResponse.json({
      success: true,
      title,
      pageId: firstPage.id,
      pageUrl: pageDetails.url,
      blocksCount: blocks.results.length,
      blockTypes: blocks.results.map((b: any) => b.type),
      contentLength: content.length,
      contentPreview: content.substring(0, 200),
      hasContent: !!content.trim(),
      firstBlock: blocks.results[0] ? {
        type: blocks.results[0].type,
        has_children: blocks.results[0].has_children
      } : null
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

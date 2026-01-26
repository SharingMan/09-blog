import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

function formatDatabaseId(id: string): string {
  if (id.includes('-')) return id
  if (id.length === 32) {
    return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20, 32)}`
  }
  return id
}

export async function GET() {
  try {
    const NOTION_TOKEN = process.env.NOTION_TOKEN
    let DATABASE_ID = process.env.NOTION_DATABASE_ID

    if (!NOTION_TOKEN || !DATABASE_ID) {
      return NextResponse.json({
        error: '请配置 NOTION_TOKEN 和 NOTION_DATABASE_ID'
      }, { status: 400 })
    }

    DATABASE_ID = formatDatabaseId(DATABASE_ID)
    const notion = new Client({ auth: NOTION_TOKEN })

    // 1. 检查数据库是否存在
    let database: any
    try {
      database = await notion.databases.retrieve({
        database_id: DATABASE_ID,
      })
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: `无法访问数据库: ${error.message}`,
        suggestion: '请确认：1. 数据库 ID 是否正确 2. Integration 是否有权限访问该数据库'
      }, { status: 400 })
    }

    // 2. 检查数据库属性
    // 使用类型断言处理 Notion API 返回的类型
    const dbWithProperties = database as { properties?: Record<string, any> }
    const properties = dbWithProperties.properties || {}
    const propertyKeys = Object.keys(properties)
    
    // 检查必需的字段
    const hasTitle = propertyKeys.some(key => 
      properties[key].type === 'title' && 
      (key === '标题' || key === 'Title' || key === 'title' || key === 'Name' || key === 'name')
    )
    
    const hasDate = propertyKeys.some(key => 
      properties[key].type === 'date' && 
      (key === '发布日期' || key === 'Date' || key === 'date' || key === '创建时间')
    )

    // 3. 查询数据库中的页面
    const searchResponse = await notion.search({
      filter: {
        property: 'object',
        value: 'page',
      },
    })
    
    const pages = searchResponse.results.filter((page: any) => {
      const parent = page.parent
      if (!parent) return false
      if (parent.type === 'database_id' && parent.database_id === DATABASE_ID) {
        return true
      }
      if (parent.database_id === DATABASE_ID) {
        return true
      }
      return false
    })

    // 4. 检查第一个页面是否有内容
    let firstPageContent = null
    if (pages.length > 0) {
      const firstPage = pages[0]
      try {
        const blocks = await notion.blocks.children.list({
          block_id: firstPage.id,
          page_size: 10,
        })
        const pageProperties = (firstPage as any).properties || {}
        firstPageContent = {
          pageId: firstPage.id,
          title: pageProperties['标题']?.title?.[0]?.plain_text || 
                 pageProperties['Title']?.title?.[0]?.plain_text || 
                 '未命名',
          blocksCount: blocks.results.length,
          hasContent: blocks.results.length > 0,
          blockTypes: blocks.results.map((b: any) => b.type),
        }
      } catch (error: any) {
        firstPageContent = {
          error: error.message
        }
      }
    }

    return NextResponse.json({
      success: true,
      database: {
        id: database.id,
        title: (database as any).title?.[0]?.plain_text || '未命名',
        url: (database as any).url,
        archived: (database as any).archived,
      },
      properties: {
        all: propertyKeys,
        details: propertyKeys.map(key => ({
          name: key,
          type: properties[key].type,
        })),
        hasTitle,
        hasDate,
        recommendations: [
          hasTitle ? '✅ 标题字段存在' : '⚠️ 建议添加标题字段（Title/标题）',
          hasDate ? '✅ 日期字段存在' : '⚠️ 建议添加日期字段（Date/发布日期）',
        ],
      },
      pages: {
        total: pages.length,
        firstPage: firstPageContent,
      },
      recommendations: [
        pages.length === 0 ? '⚠️ 数据库中未找到页面，请确认页面是否在数据库中' : '✅ 找到页面',
        firstPageContent?.hasContent ? '✅ 页面有内容' : '⚠️ 页面没有内容块，请确认页面内是否有文字内容',
        hasTitle && hasDate ? '✅ 数据库字段配置正确' : '⚠️ 请检查数据库字段配置',
      ],
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

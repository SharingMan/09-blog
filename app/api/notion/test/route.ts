import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

// 格式化数据库 ID
function formatDatabaseId(id: string): string {
  if (id.includes('-')) {
    return id
  }
  if (id.length === 32) {
    return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20, 32)}`
  }
  return id
}

export async function GET(request: NextRequest) {
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

    // 使用 search API 查询所有页面
    const searchResponse = await notion.search({
      filter: {
        property: 'object',
        value: 'page',
      },
    })

    // 过滤出属于该数据库的页面
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

    // 返回第一个页面的详细信息
    if (pages.length > 0) {
      const firstPage = pages[0]
      const properties = firstPage.properties || {}
      
      return NextResponse.json({
        success: true,
        total: pages.length,
        firstPage: {
          id: firstPage.id,
          parent: firstPage.parent,
          properties: Object.keys(properties),
          propertyDetails: properties,
          last_edited_time: firstPage.last_edited_time,
        }
      })
    }

    return NextResponse.json({
      success: true,
      total: 0,
      message: '未找到页面'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

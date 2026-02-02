import { NextResponse } from 'next/server'
import { getArticleList } from '../../data/articles/index'

export const dynamic = 'force-static'
export const revalidate = 3600 // 缓存 1 小时

export async function GET() {
  try {
    const articles = getArticleList()
    return NextResponse.json(articles, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
  }
}



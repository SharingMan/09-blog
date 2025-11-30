import { NextResponse } from 'next/server'
import { getArticleList } from '../../data/articles/index'

export async function GET() {
  try {
    const articles = getArticleList()
    return NextResponse.json(articles)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
  }
}


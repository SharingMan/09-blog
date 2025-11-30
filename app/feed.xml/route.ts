import { NextResponse } from 'next/server'
import { getAllArticles } from '../data/articles/index'

export async function GET() {
  try {
    const articles = getAllArticles()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    const rssItems = articles.map(article => {
      const articleUrl = `${siteUrl}/posts/${article.id}`
      
      // 解析日期：2025年1月15日 -> 2025-01-15
      let pubDate = new Date().toUTCString()
      try {
        const dateStr = article.date
          .replace('年', '-')
          .replace('月', '-')
          .replace('日', '')
        pubDate = new Date(dateStr).toUTCString()
      } catch (e) {
        // 使用默认日期
      }
      
      // 清理内容中的HTML标签（简化版）
      const description = article.excerpt || 
        (article.content
          ? article.content
              .replace(/[#*`>]/g, '')
              .replace(/\n+/g, ' ')
              .trim()
              .substring(0, 200) + '...'
          : '')
      
      return `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
    </item>`
    }).join('')

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>新海说</title>
    <link>${siteUrl}</link>
    <description>新海说｜极简、高雅的瑞士风个人博客</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('RSS generation error:', error)
    return new NextResponse('Error generating RSS feed', { status: 500 })
  }
}


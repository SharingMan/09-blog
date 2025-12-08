import type { Metadata } from 'next'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ArticleList from './components/ArticleList'
import { getArticleList } from './data/articles/index'

export const metadata: Metadata = {
  title: '新海说',
  description: '新海说｜极简、高雅的瑞士风个人博客，新海日记，分享思考与生活',
  keywords: ['xinhai', '新海说', '新海日记', '个人博客', '极简设计', '瑞士风格'],
  openGraph: {
    title: '新海说',
    description: '新海说｜极简、高雅的瑞士风个人博客，新海日记，分享思考与生活',
  },
}

export default function Home() {
  // 首页只显示最新的 3 篇文章
  const allArticles = getArticleList()
  const recentArticles = allArticles.slice(0, 3)
  
  return (
    <>
      <Navbar articles={allArticles} />
      <main>
        <Hero />
        <ArticleList articles={recentArticles} />
      </main>
    </>
  )
}


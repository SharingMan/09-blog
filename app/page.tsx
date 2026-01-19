import type { Metadata } from 'next'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ArticleList from './components/ArticleList'
import ContactLinks from './components/ContactLinks'
import { getArticleList } from './data/articles/index'
import './page.css'

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
        <section className="home-contact-section">
          <div className="home-contact-container reading-content">
            <h2 className="home-contact-title">联系方式</h2>
            <p className="home-contact-intro">欢迎通过以下方式与我联系</p>
            <ContactLinks layout="stacked" className="home-contact-links" />
          </div>
        </section>
      </main>
    </>
  )
}


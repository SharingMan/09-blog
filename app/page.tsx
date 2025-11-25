import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ArticleList from './components/ArticleList'
import { getArticleList } from './data/articles/index'

export default function Home() {
  // 首页只显示最新的 3 篇文章
  const recentArticles = getArticleList().slice(0, 3)
  
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ArticleList articles={recentArticles} />
      </main>
    </>
  )
}


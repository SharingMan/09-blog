import type { Metadata } from 'next'
import Navbar from '../components/Navbar'
import ArticleList from '../components/ArticleList'
import { getArticleList } from '../data/articles/index'

export const metadata: Metadata = {
  title: '文章列表',
  description: '新海说的所有文章，分享思考与生活',
  keywords: ['xinhai', '新海说', '新海日记', '文章', '博客文章'],
}

export default function PostsPage() {
  const allArticles = getArticleList()
  
  return (
    <>
      <Navbar articles={allArticles} />
      <main style={{ paddingTop: '80px' }}>
        <ArticleList articles={allArticles} showExcerpt={true} />
      </main>
    </>
  )
}


import Navbar from '../../components/Navbar'
import ArticleList from '../../components/ArticleList'
import { getArticlesByCategory, getAllCategories, getArticleList } from '../../data/articles/index'
import Link from 'next/link'
import './CategoryDetail.css'

interface CategoryDetailProps {
  params: {
    category: string
  }
}

export default function CategoryDetailPage({ params }: CategoryDetailProps) {
  const category = decodeURIComponent(params.category)
  const articles = getArticlesByCategory(category)
  const allCategories = getAllCategories()
  const allArticles = getArticleList()
  
  if (!allCategories.includes(category)) {
    return (
      <>
        <Navbar articles={allArticles} />
        <main className="category-detail-page">
          <div className="category-detail-container reading-content">
            <h1>分类不存在</h1>
            <p>抱歉，该分类不存在。</p>
            <Link href="/categories">返回分类列表</Link>
          </div>
        </main>
      </>
    )
  }
  
  return (
    <>
      <Navbar articles={allArticles} />
      <main className="category-detail-page">
        <div className="category-detail-container reading-content">
          <nav className="breadcrumb">
            <Link href="/categories">分类</Link>
            <span className="breadcrumb-separator">/</span>
            <span>{category}</span>
          </nav>
          
          <h1 className="category-detail-title">{category}</h1>
          <p className="category-count">共 {articles.length} 篇文章</p>
          
          <ArticleList articles={articles} showExcerpt={true} />
        </div>
      </main>
    </>
  )
}


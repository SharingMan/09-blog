import Navbar from '../components/Navbar'
import ArticleList from '../components/ArticleList'
import { getAllCategories, getArticleList } from '../data/articles/index'
import Link from 'next/link'
import './Categories.css'

export default function CategoriesPage() {
  const categories = getAllCategories()
  const allArticles = getArticleList()
  
  return (
    <>
      <Navbar articles={allArticles} />
      <main className="categories-page">
        <div className="categories-container reading-content">
          <h1 className="categories-title">分类</h1>
          
          {categories.length === 0 ? (
            <p className="categories-empty">暂无分类</p>
          ) : (
            <div className="categories-list">
              {categories.map((category) => (
                <section key={category} className="category-section">
                  <h2 className="category-name">
                    <Link href={`/categories/${encodeURIComponent(category)}`}>
                      {category}
                    </Link>
                  </h2>
                  <ArticleList 
                    articles={allArticles.filter(a => a.category === category).slice(0, 3)} 
                    showExcerpt={false}
                  />
                  <div className="category-more">
                    <Link href={`/categories/${encodeURIComponent(category)}`}>
                      查看全部 →
                    </Link>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}


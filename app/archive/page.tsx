import type { Metadata } from 'next'
import Navbar from '../components/Navbar'
import ArticleList from '../components/ArticleList'
import Link from 'next/link'
import { getArchivedArticles, getArticleList, getAllCategories, getAllTags } from '../data/articles/index'
import './Archive.css'

export const metadata: Metadata = {
  title: '分类',
  description: '新海说文章分类、标签和时间归档',
  keywords: ['xinhai', '新海说', '新海日记', '文章分类', '标签', '归档'],
}

export default function ArchivePage() {
  const archivedGroups = getArchivedArticles()
  const allArticles = getArticleList()
  const categories = getAllCategories()
  const tags = getAllTags()
  
  return (
    <>
      <Navbar articles={allArticles} />
      <main className="archive-page">
        <div className="archive-container reading-content">
          <h1 className="archive-title">文章分类</h1>
          
          {/* 分类部分 */}
          {categories.length > 0 && (
            <section className="archive-section">
              <h2 className="archive-section-title">分类</h2>
              <div className="archive-categories">
                {categories.map((category) => {
                  const categoryArticles = allArticles.filter(a => a.category === category)
                  return (
                    <Link 
                      key={category} 
                      href={`/categories/${encodeURIComponent(category)}`}
                      className="archive-category-item"
                    >
                      <span className="archive-category-name">{category}</span>
                      <span className="archive-category-count">({categoryArticles.length})</span>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* 标签部分 */}
          {tags.length > 0 && (
            <section className="archive-section">
              <h2 className="archive-section-title">标签</h2>
              <div className="archive-tags">
                {tags.map((tag) => {
                  const tagArticles = allArticles.filter(a => a.tags && a.tags.includes(tag))
                  return (
                    <Link 
                      key={tag} 
                      href={`/tags/${encodeURIComponent(tag)}`}
                      className="archive-tag-item"
                    >
                      #{tag}
                      <span className="archive-tag-count">({tagArticles.length})</span>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* 按时间分类 */}
          <section className="archive-section">
            <h2 className="archive-section-title">按时间分类</h2>
            {archivedGroups.map((group) => (
              <div key={`${group.year}-${group.month}`} className="archive-group">
                <h3 className="archive-group-title">
                  {group.year}年{parseInt(group.month)}月
                </h3>
                <ArticleList articles={group.articles} showExcerpt={false} />
              </div>
            ))}
          </section>
        </div>
      </main>
    </>
  )
}


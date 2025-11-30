import Navbar from '../components/Navbar'
import ArticleList from '../components/ArticleList'
import { getAllTags, getArticlesByTag, getArticleList } from '../data/articles/index'
import Link from 'next/link'
import './Tags.css'

export default function TagsPage() {
  const tags = getAllTags()
  const allArticles = getArticleList()
  
  return (
    <>
      <Navbar articles={allArticles} />
      <main className="tags-page">
        <div className="tags-container reading-content">
          <h1 className="tags-title">标签</h1>
          
          {tags.length === 0 ? (
            <p className="tags-empty">暂无标签</p>
          ) : (
            <>
              <div className="tags-cloud">
                {tags.map((tag) => {
                  const count = getArticlesByTag(tag).length
                  return (
                    <Link
                      key={tag}
                      href={`/tags/${encodeURIComponent(tag)}`}
                      className="tag-item"
                      style={{ '--tag-count': count } as React.CSSProperties}
                    >
                      <span className="tag-name">{tag}</span>
                      <span className="tag-count">({count})</span>
                    </Link>
                  )
                })}
              </div>
              
              <section className="tags-list">
                {tags.map((tag) => {
                  const articles = getArticlesByTag(tag).slice(0, 3)
                  return (
                    <div key={tag} className="tag-section">
                      <h2 className="tag-name-heading">
                        <Link href={`/tags/${encodeURIComponent(tag)}`}>
                          {tag}
                        </Link>
                        <span className="tag-section-count">
                          ({getArticlesByTag(tag).length})
                        </span>
                      </h2>
                      {articles.length > 0 && (
                        <>
                          <ArticleList articles={articles} showExcerpt={false} />
                          <div className="tag-more">
                            <Link href={`/tags/${encodeURIComponent(tag)}`}>
                              查看全部 →
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </section>
            </>
          )}
        </div>
      </main>
    </>
  )
}


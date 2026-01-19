'use client'

import Link from 'next/link'
import './ArticleList.css'

interface Article {
  id: string
  title: string
  date: string
  readTime: string
  excerpt?: string
  category?: string
  tags?: string[]
  coverImage?: string
}

interface ArticleListProps {
  articles: Article[]
  showExcerpt?: boolean
}

export default function ArticleList({ articles, showExcerpt = false }: ArticleListProps) {
  return (
    <section className="article-list">
      <div className="article-list-container">
        {articles.map((article) => (
          <article key={article.id} className="article-item">
            <Link href={`/posts/${article.id}`} className="article-card">
              {article.coverImage && (
                <div className="article-cover">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    loading="lazy"
                  />
                </div>
              )}
              <div className="article-content">
                <div className="article-meta-top">
                  {article.category && (
                    <span className="article-category">{article.category}</span>
                  )}
                  <span className="article-date">{article.date}</span>
                </div>

                <h2 className="article-title">{article.title}</h2>

                {showExcerpt && article.excerpt && (
                  <p className="article-excerpt">{article.excerpt}</p>
                )}

                <div className="article-footer">
                  <span className="article-read-time">{article.readTime}</span>
                  {article.tags && article.tags.length > 0 && (
                    <div className="article-tags">
                      {article.tags.map((tag) => (
                        <span key={tag} className="article-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}


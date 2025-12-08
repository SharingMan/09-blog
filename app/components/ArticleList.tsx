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
            <div className="article-content">
              <Link href={`/posts/${article.id}`} className="article-link">
                {article.category && (
                  <span className="article-category">{article.category}</span>
                )}
                <h2 className="article-title">{article.title}</h2>
                {showExcerpt && article.excerpt && (
                  <p className="article-excerpt">{article.excerpt}</p>
                )}
                <p className="article-meta">
                  {article.date} · {article.readTime}
                </p>
              </Link>
              {article.tags && article.tags.length > 0 && (
                <div className="article-tags">
                  {article.tags.map((tag) => (
                    <Link 
                      key={tag} 
                      href={`/tags/${encodeURIComponent(tag)}`}
                      className="article-tag"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}


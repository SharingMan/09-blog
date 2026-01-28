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
  // 处理封面图路径
  const getCoverImageUrl = (coverImage?: string) => {
    if (!coverImage) return null
    // 如果是相对路径，确保以 / 开头
    if (coverImage.startsWith('/images/') || coverImage.startsWith('/public/')) {
      return coverImage
    }
    // 如果是 http/https 链接，直接返回
    if (coverImage.startsWith('http://') || coverImage.startsWith('https://')) {
      return coverImage
    }
    // 如果是 images/articles/ 开头的相对路径，添加 /
    if (coverImage.startsWith('images/articles/')) {
      return '/' + coverImage
    }
    // 其他情况，假设是相对路径
    return coverImage.startsWith('/') ? coverImage : '/' + coverImage
  }

  return (
    <section className="article-list">
      <div className="article-list-container">
        {articles.map((article) => {
          const coverImageUrl = getCoverImageUrl(article.coverImage)
          // 调试信息
          if (coverImageUrl) {
            console.log(`文章 "${article.title}" 的封面图:`, coverImageUrl.substring(0, 100) + '...')
          }
          return (
          <article key={article.id} className="article-item">
            <Link href={`/posts/${article.id}`} className="article-card">
                {coverImageUrl && (
                <div className="article-cover">
                  <img
                      src={coverImageUrl}
                    alt={article.title}
                    loading="lazy"
                      crossOrigin="anonymous"
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover', 
                        display: 'block',
                        minHeight: '200px',
                        backgroundColor: 'var(--hover-overlay)'
                      }}
                      onError={(e) => {
                        console.error('封面图加载失败:', article.title, coverImageUrl?.substring(0, 100))
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const coverDiv = target.closest('.article-cover') as HTMLElement | null
                        if (coverDiv) {
                          coverDiv.style.display = 'none'
                        }
                      }}
                      onLoad={() => {
                        console.log('封面图加载成功:', article.title)
                      }}
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
          )
        })}
      </div>
    </section>
  )
}


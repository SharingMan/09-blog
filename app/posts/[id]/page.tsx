import type { Metadata } from 'next'
import Navbar from '../../components/Navbar'
import MarkdownContent from '../../components/MarkdownContent'
import TableOfContents from '../../components/TableOfContents'
import { getArticleById, getAdjacentArticles, getArticleList } from '../../data/articles/index'
import Link from 'next/link'
import './ArticleDetail.css'

interface ArticleDetailProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: ArticleDetailProps): Promise<Metadata> {
  const { id } = await params
  const article = getArticleById(id)

  if (!article) {
    return {
      title: '文章未找到',
    }
  }

  const keywords = ['xinhai', '新海说', '新海日记']
  if (article.category) {
    keywords.push(article.category)
  }
  if (article.tags && article.tags.length > 0) {
    keywords.push(...article.tags)
  }

  // 提取文章摘要（前200字符） - 修复类型错误
  const excerpt = article.excerpt || (article.content || '')
    .replace(/[#*`>]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .substring(0, 200)

  return {
    title: article.title,
    description: excerpt,
    keywords: keywords,
    openGraph: {
      title: article.title,
      description: excerpt,
      type: 'article',
      publishedTime: article.date,
      authors: ['新海'],
      tags: article.tags || [],
    },
  }
}

export default async function ArticleDetail({ params }: ArticleDetailProps) {
  const { id } = await params
  const article = getArticleById(id) || {
    id: '',
    title: '文章未找到',
    date: '',
    readTime: '',
    content: '抱歉，这篇文章不存在。'
  }

  const { prev, next } = getAdjacentArticles(id)
  const allArticles = getArticleList()

  return (
    <>
      <Navbar articles={allArticles} />
      <article className="article-detail">
        <div className="article-detail-wrapper">
          <div className="article-main">
            <div className="article-header">
              <h1 className="article-title">{article.title}</h1>
              <div className="article-meta">
                <span>{article.date}</span>
                <span className="meta-separator">·</span>
                <span>{article.readTime}</span>
              </div>
              {article.category && (
                <div className="article-header-meta">
                  <Link href={`/categories/${encodeURIComponent(article.category)}`} className="article-category-link">
                    {article.category}
                  </Link>
                </div>
              )}
              {article.tags && article.tags.length > 0 && (
                <div className="article-header-tags">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tags/${encodeURIComponent(tag)}`}
                      className="article-header-tag"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="article-content reading-content">
              <MarkdownContent content={article.content || ''} />
            </div>

            <nav className="article-navigation">
              {prev && (
                <Link href={`/posts/${prev.id}`} className="nav-link nav-prev">
                  <span className="nav-label">上一篇</span>
                  <span className="nav-title">{prev.title}</span>
                </Link>
              )}
              {next && (
                <Link href={`/posts/${next.id}`} className="nav-link nav-next">
                  <span className="nav-label">下一篇</span>
                  <span className="nav-title">{next.title}</span>
                </Link>
              )}
            </nav>
          </div>

          <aside className="article-sidebar">
            <TableOfContents />
          </aside>
        </div>
      </article>
    </>
  )
}

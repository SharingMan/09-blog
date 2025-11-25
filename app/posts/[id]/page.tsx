import Navbar from '../../components/Navbar'
import MarkdownContent from '../../components/MarkdownContent'
import { getArticleById } from '../../data/articles/index'
import './ArticleDetail.css'

interface ArticleDetailProps {
  params: {
    id: string
  }
}

export default function ArticleDetail({ params }: ArticleDetailProps) {
  const article = getArticleById(params.id) || {
    id: '',
    title: '文章未找到',
    date: '',
    readTime: '',
    content: '抱歉，这篇文章不存在。'
  }

  return (
    <>
      <Navbar />
      <article className="article-detail">
        <div className="article-header">
          <h1 className="article-title">{article.title}</h1>
          <div className="article-meta">
            <span>{article.date}</span>
            <span className="meta-separator">·</span>
            <span>{article.readTime}</span>
          </div>
        </div>
        <div className="article-content reading-content">
          <MarkdownContent content={article.content} />
        </div>
      </article>
    </>
  )
}


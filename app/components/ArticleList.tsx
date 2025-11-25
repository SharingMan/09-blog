import Link from 'next/link'
import './ArticleList.css'

interface Article {
  id: string
  title: string
  date: string
  readTime: string
}

interface ArticleListProps {
  articles: Article[]
}

export default function ArticleList({ articles }: ArticleListProps) {
  return (
    <section className="article-list">
      <div className="article-list-container">
        {articles.map((article) => (
          <article key={article.id} className="article-item">
            <Link href={`/posts/${article.id}`}>
              <h2 className="article-title">{article.title}</h2>
              <p className="article-meta">
                {article.date} · {article.readTime}
              </p>
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}


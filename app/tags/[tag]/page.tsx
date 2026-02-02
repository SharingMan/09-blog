import Navbar from '../../components/Navbar'
import ArticleList from '../../components/ArticleList'
import { getArticlesByTag, getAllTags, getArticleList } from '../../data/articles/index'
import Link from 'next/link'
import './TagDetail.css'

interface TagDetailProps {
  params: Promise<{
    tag: string
  }>
}

export default async function TagDetailPage({ params }: TagDetailProps) {
  const { tag: tagParam } = await params
  const tag = decodeURIComponent(tagParam)
  const articles = getArticlesByTag(tag)
  const allTags = getAllTags()
  const allArticles = getArticleList()

  if (!allTags.includes(tag)) {
    return (
      <>
        <Navbar articles={allArticles} />
        <main className="tag-detail-page">
          <div className="tag-detail-container reading-content">
            <h1>标签不存在</h1>
            <p>抱歉，该标签不存在。</p>
            <Link href="/tags">返回标签列表</Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar articles={allArticles} />
      <main className="tag-detail-page">
        <div className="tag-detail-container reading-content">
          <nav className="breadcrumb">
            <Link href="/tags">标签</Link>
            <span className="breadcrumb-separator">/</span>
            <span>{tag}</span>
          </nav>

          <h1 className="tag-detail-title">
            <span className="tag-prefix">#</span>
            {tag}
          </h1>
          <p className="tag-count">共 {articles.length} 篇文章</p>

          <ArticleList articles={articles} showExcerpt={true} />
        </div>
      </main>
    </>
  )
}

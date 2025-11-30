import Navbar from '../components/Navbar'
import ArticleList from '../components/ArticleList'
import { getArchivedArticles, getArticleList } from '../data/articles/index'
import './Archive.css'

export default function ArchivePage() {
  const archivedGroups = getArchivedArticles()
  const allArticles = getArticleList()
  
  return (
    <>
      <Navbar articles={allArticles} />
      <main className="archive-page">
        <div className="archive-container reading-content">
          <h1 className="archive-title">文章归档</h1>
          
          {archivedGroups.map((group) => (
            <section key={`${group.year}-${group.month}`} className="archive-group">
              <h2 className="archive-group-title">
                {group.year}年{parseInt(group.month)}月
              </h2>
              <ArticleList articles={group.articles} showExcerpt={false} />
            </section>
          ))}
        </div>
      </main>
    </>
  )
}


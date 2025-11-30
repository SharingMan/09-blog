import Navbar from '../components/Navbar'
import ArticleList from '../components/ArticleList'
import { getArticleList } from '../data/articles/index'

export default function PostsPage() {
  const allArticles = getArticleList()
  
  return (
    <>
      <Navbar articles={allArticles} />
      <main style={{ paddingTop: '80px' }}>
        <ArticleList articles={allArticles} showExcerpt={true} />
      </main>
    </>
  )
}


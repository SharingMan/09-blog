import Navbar from '../components/Navbar'
import ArticleList from '../components/ArticleList'
import { getArticleList } from '../data/articles/index'

export default function PostsPage() {
  const allArticles = getArticleList()
  
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '80px' }}>
        <ArticleList articles={allArticles} />
      </main>
    </>
  )
}


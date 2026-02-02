/**
 * 文章类型定义
 */

export interface Article {
  id: string
  title: string
  date: string
  readTime: string
  content?: string
  excerpt?: string
  category?: string
  tags?: string[]
  coverImage?: string
}

/**
 * 文章列表项（不包含完整内容）
 */
export type ArticleListItem = Omit<Article, 'content'>

/**
 * 归档分组
 */
export interface ArchiveGroup {
  year: string
  month: string
  articles: ArticleListItem[]
}

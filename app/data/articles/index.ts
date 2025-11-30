import fs from 'fs'
import path from 'path'

export interface Article {
  id: string
  title: string
  date: string
  readTime: string
  content: string
  excerpt?: string
  category?: string
  tags?: string[]
}

// 解析 Markdown 文件的前置元数据
function parseMarkdownFile(filePath: string): Article | null {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const id = path.basename(filePath, '.md')
    
    // 解析前置元数据（Front Matter）
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*([\s\S]*)$/
    const match = fileContent.match(frontMatterRegex)
    
    if (!match) {
      // 如果没有前置元数据，返回 null
      return null
    }
    
    const frontMatter = match[1]
    const content = (match[2] || '').trim()
    
    // 解析 YAML 格式的前置元数据
    const metadata: Record<string, string> = {}
    frontMatter.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim()
        const value = line.substring(colonIndex + 1).trim()
        metadata[key] = value
      }
    })
    
    // 从内容中提取摘要（前200个字符）
    const excerpt = content
      .replace(/[#*`>]/g, '') // 移除 Markdown 语法
      .replace(/\n+/g, ' ') // 替换换行为空格
      .trim()
      .substring(0, 200)
      + (content.length > 200 ? '...' : '')
    
    // 解析分类和标签
    const category = metadata.category || ''
    const tags = metadata.tags 
      ? metadata.tags.split(',').map(t => t.trim()).filter(Boolean)
      : []
    
    return {
      id,
      title: metadata.title || '',
      date: metadata.date || '',
      readTime: metadata.readTime || '',
      content,
      excerpt,
      category: category || undefined,
      tags: tags.length > 0 ? tags : undefined
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error)
    return null
  }
}

// 获取所有文章
export function getAllArticles(): Article[] {
  const articlesDir = path.join(process.cwd(), 'app/data/articles')
  const files = fs.readdirSync(articlesDir)
  
  const articles = files
    .filter(file => file.endsWith('.md') && file !== 'README.md')
    .map(file => {
      const filePath = path.join(articlesDir, file)
      return parseMarkdownFile(filePath)
    })
    .filter((article): article is Article => article !== null)
    .sort((a, b) => {
      // 按日期降序排列（最新的在前）
      return new Date(b.date.replace('年', '-').replace('月', '-').replace('日', '')).getTime() - 
             new Date(a.date.replace('年', '-').replace('月', '-').replace('日', '')).getTime()
    })
  
  return articles
}

// 获取文章列表（不包含完整内容）
export function getArticleList(): Omit<Article, 'content'>[] {
  return getAllArticles().map(({ content, ...rest }) => rest)
}

// 按年月归档文章
export interface ArchiveGroup {
  year: string
  month: string
  articles: Omit<Article, 'content'>[]
}

export function getArchivedArticles(): ArchiveGroup[] {
  const articles = getArticleList()
  const grouped: Record<string, ArchiveGroup> = {}
  
  articles.forEach(article => {
    // 解析日期：2025年1月15日 -> 2025-01
    const dateMatch = article.date.match(/(\d{4})年(\d{1,2})月/)
    if (dateMatch) {
      const year = dateMatch[1]
      const month = dateMatch[2].padStart(2, '0')
      const key = `${year}-${month}`
      
      if (!grouped[key]) {
        grouped[key] = {
          year,
          month,
          articles: []
        }
      }
      
      grouped[key].articles.push(article)
    }
  })
  
  // 按年月降序排列
  return Object.values(grouped).sort((a, b) => {
    const keyA = `${a.year}-${a.month}`
    const keyB = `${b.year}-${b.month}`
    return keyB.localeCompare(keyA)
  })
}

// 获取相邻文章（上一篇/下一篇）
export function getAdjacentArticles(currentId: string): {
  prev: Omit<Article, 'content'> | null
  next: Omit<Article, 'content'> | null
} {
  const articles = getArticleList()
  const currentIndex = articles.findIndex(a => a.id === currentId)
  
  return {
    prev: currentIndex > 0 ? articles[currentIndex - 1] : null,
    next: currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null
  }
}

// 根据 ID 获取单篇文章
export function getArticleById(id: string): Article | undefined {
  const articlesDir = path.join(process.cwd(), 'app/data/articles')
  const filePath = path.join(articlesDir, `${id}.md`)
  
  if (!fs.existsSync(filePath)) {
    return undefined
  }
  
  return parseMarkdownFile(filePath) || undefined
}

// 获取所有分类
export function getAllCategories(): string[] {
  const articles = getArticleList()
  const categories = new Set<string>()
  
  articles.forEach(article => {
    if (article.category) {
      categories.add(article.category)
    }
  })
  
  return Array.from(categories).sort()
}

// 根据分类获取文章
export function getArticlesByCategory(category: string): Omit<Article, 'content'>[] {
  return getArticleList().filter(article => article.category === category)
}

// 获取所有标签
export function getAllTags(): string[] {
  const articles = getArticleList()
  const tags = new Set<string>()
  
  articles.forEach(article => {
    if (article.tags && article.tags.length > 0) {
      article.tags.forEach(tag => tags.add(tag))
    }
  })
  
  return Array.from(tags).sort()
}

// 根据标签获取文章
export function getArticlesByTag(tag: string): Omit<Article, 'content'>[] {
  return getArticleList().filter(article => 
    article.tags && article.tags.includes(tag)
  )
}


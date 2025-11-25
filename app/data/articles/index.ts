import fs from 'fs'
import path from 'path'

export interface Article {
  id: string
  title: string
  date: string
  readTime: string
  content: string
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
    
    return {
      id,
      title: metadata.title || '',
      date: metadata.date || '',
      readTime: metadata.readTime || '',
      content
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

// 根据 ID 获取单篇文章
export function getArticleById(id: string): Article | undefined {
  const articlesDir = path.join(process.cwd(), 'app/data/articles')
  const filePath = path.join(articlesDir, `${id}.md`)
  
  if (!fs.existsSync(filePath)) {
    return undefined
  }
  
  return parseMarkdownFile(filePath) || undefined
}


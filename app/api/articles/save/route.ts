import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, date, readTime, content, category, tags } = body

    // 验证必填字段
    if (!title || !date || !readTime || !content) {
      return NextResponse.json(
        { error: '缺少必填字段：title, date, readTime, content' },
        { status: 400 }
      )
    }

    // 如果没有提供 id，生成一个新的 id（使用时间戳）
    const articleId = id || Date.now().toString()

    // 处理标签（可能是数组或字符串）
    let tagsArray: string[] = []
    if (tags) {
      if (Array.isArray(tags)) {
        tagsArray = tags.filter(Boolean)
      } else if (typeof tags === 'string') {
        tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean)
      }
    }

    // 构建 front matter（转义特殊字符）
    const escapeYamlValue = (value: string) => {
      // 如果值包含冒号或其他特殊字符，需要用引号包裹
      if (value.includes(':') || value.includes('\n') || value.includes('"')) {
        return `"${value.replace(/"/g, '\\"')}"`
      }
      return value
    }

    let frontMatter = `---\ntitle: ${escapeYamlValue(title)}\ndate: ${escapeYamlValue(date)}\nreadTime: ${escapeYamlValue(readTime)}`
    if (category && category.trim()) {
      frontMatter += `\ncategory: ${escapeYamlValue(category.trim())}`
    }
    if (tagsArray.length > 0) {
      frontMatter += `\ntags: ${tagsArray.join(', ')}`
    }
    frontMatter += `\n---\n\n`

    // 构建完整的 markdown 内容
    const markdownContent = frontMatter + content

    // 保存文件
    const articlesDir = path.join(process.cwd(), 'app/data/articles')
    const filePath = path.join(articlesDir, `${articleId}.md`)

    // 确保目录存在
    if (!fs.existsSync(articlesDir)) {
      fs.mkdirSync(articlesDir, { recursive: true })
    }

    fs.writeFileSync(filePath, markdownContent, 'utf-8')

    return NextResponse.json({
      success: true,
      id: articleId,
      message: '文章保存成功'
    })
  } catch (error) {
    console.error('Error saving article:', error)
    return NextResponse.json(
      { error: '保存文章时出错' },
      { status: 500 }
    )
  }
}


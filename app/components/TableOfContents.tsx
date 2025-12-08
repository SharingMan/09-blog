'use client'

import { useEffect, useState } from 'react'
import './TableOfContents.css'

interface Heading {
  id: string
  text: string
  level: number
}

// 生成标题 ID（支持中文）
function generateHeadingId(text: string): string {
  // 使用更友好的方式生成 ID：保留中文和英文，只移除特殊字符
  return text
    .trim()
    .replace(/[^\u4e00-\u9fa5\w\s-]/g, '') // 保留中文、字母数字、空格和连字符
    .replace(/\s+/g, '-') // 空格替换为连字符
    .toLowerCase()
    .substring(0, 50) || 'heading'
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([])

  useEffect(() => {
    // 等待内容渲染完成后再查找标题
    const updateHeadings = () => {
      const articleContent = document.querySelector('.article-content .markdown-content')
      if (!articleContent) return

      // 支持 h2, h3, h4 级别的标题（h1 通常是文章标题，不包括）
      const headingElements = articleContent.querySelectorAll('h2, h3, h4')
      const headingList: Heading[] = []

      headingElements.forEach((heading) => {
        const text = heading.textContent?.trim() || ''
        if (!text) return
        
        const level = parseInt(heading.tagName.charAt(1))
        
        // 如果标题没有 ID，生成一个
        if (!heading.id) {
          heading.id = generateHeadingId(text)
        }
        
        // 确保 ID 唯一（如果有重复，添加索引）
        let uniqueId = heading.id
        let counter = 1
        while (document.getElementById(uniqueId) && document.getElementById(uniqueId) !== heading) {
          uniqueId = `${heading.id}-${counter}`
          counter++
        }
        heading.id = uniqueId
        
        headingList.push({ id: heading.id, text, level })
      })

      setHeadings(headingList)
    }

    // 立即执行一次
    updateHeadings()

    // 使用 MutationObserver 监听 DOM 变化，确保标题 ID 生成后能正确获取
    const observer = new MutationObserver(() => {
      updateHeadings()
    })

    const articleContent = document.querySelector('.article-content')
    if (articleContent) {
      observer.observe(articleContent, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['id']
      })
    }

    // 延迟执行一次，确保 MarkdownContent 渲染完成
    const timeoutId = setTimeout(updateHeadings, 500)

    return () => {
      observer.disconnect()
      clearTimeout(timeoutId)
    }
  }, [])

  if (headings.length === 0) return null

  return (
    <nav className="toc">
      <div className="toc-header">目录</div>
      <ul className="toc-list">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={`toc-item toc-level-${heading.level}`}
          >
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault()
                const element = document.getElementById(heading.id)
                if (element) {
                  // 获取导航栏高度，确保标题不被遮挡
                  const navbar = document.querySelector('.navbar')
                  const navbarHeight = navbar ? navbar.getBoundingClientRect().height : 80
                  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                  const offsetPosition = elementPosition - navbarHeight - 20 // 额外 20px 间距
                  
                  window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                  })
                  // 更新 URL 但不跳转
                  window.history.pushState(null, '', `#${heading.id}`)
                }
              }}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}


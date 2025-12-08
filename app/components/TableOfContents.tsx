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
    let isUpdating = false // 防止无限循环的标志
    
    // 等待内容渲染完成后再查找标题
    const updateHeadings = () => {
      if (isUpdating) return // 如果正在更新，直接返回
      isUpdating = true
      
      const articleContent = document.querySelector('.article-content .markdown-content')
      if (!articleContent) {
        isUpdating = false
        return
      }

      // 支持 h2, h3, h4 级别的标题（h1 通常是文章标题，不包括）
      const headingElements = articleContent.querySelectorAll('h2, h3, h4')
      const headingList: Heading[] = []

      headingElements.forEach((heading) => {
        const text = heading.textContent?.trim() || ''
        if (!text) return
        
        const level = parseInt(heading.tagName.charAt(1))
        
        // 如果标题没有 ID，生成一个（只在第一次）
        if (!heading.id) {
          heading.id = generateHeadingId(text)
        }
        
        // 确保 ID 唯一（如果有重复，添加索引）
        let uniqueId = heading.id
        let counter = 1
        const existingElement = document.getElementById(uniqueId)
        if (existingElement && existingElement !== heading) {
          // 临时禁用 observer，避免触发循环
          uniqueId = `${heading.id}-${counter}`
          counter++
          // 检查新的 uniqueId 是否也存在
          while (document.getElementById(uniqueId) && document.getElementById(uniqueId) !== heading) {
            uniqueId = `${heading.id}-${counter}`
            counter++
          }
          // 只在真正需要修改时才修改
          if (heading.id !== uniqueId) {
            heading.id = uniqueId
          }
        }
        
        headingList.push({ id: heading.id, text, level })
      })

      setHeadings(headingList)
      isUpdating = false
    }

    // 延迟执行，确保 MarkdownContent 渲染完成
    const timeoutId1 = setTimeout(updateHeadings, 100)
    const timeoutId2 = setTimeout(updateHeadings, 500)

    // 使用 MutationObserver 只监听子节点变化，不监听属性变化（避免循环）
    const observer = new MutationObserver((mutations) => {
      // 只在添加新节点时更新，忽略属性变化
      const hasNewNodes = mutations.some(mutation => 
        mutation.type === 'childList' && mutation.addedNodes.length > 0
      )
      if (hasNewNodes && !isUpdating) {
        // 延迟执行，避免频繁更新
        setTimeout(updateHeadings, 200)
      }
    })

    const articleContent = document.querySelector('.article-content')
    if (articleContent) {
      observer.observe(articleContent, {
        childList: true,
        subtree: true,
        // 不监听 attributes，避免无限循环
        attributes: false
      })
    }

    return () => {
      observer.disconnect()
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
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
                try {
                  const element = document.getElementById(heading.id)
                  if (element) {
                    // 获取导航栏高度，确保标题不被遮挡
                    const navbar = document.querySelector('.navbar')
                    const navbarHeight = navbar ? navbar.getBoundingClientRect().height : 80
                    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                    const offsetPosition = elementPosition - navbarHeight - 20 // 额外 20px 间距
                    
                    // 使用 requestAnimationFrame 确保 DOM 更新完成
                    requestAnimationFrame(() => {
                      window.scrollTo({
                        top: Math.max(0, offsetPosition),
                        behavior: 'smooth'
                      })
                    })
                    
                    // 更新 URL 但不跳转（延迟执行，避免冲突）
                    setTimeout(() => {
                      window.history.pushState(null, '', `#${heading.id}`)
                    }, 100)
                  }
                } catch (error) {
                  console.error('Error scrolling to heading:', error)
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


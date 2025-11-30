'use client'

import { useEffect, useState } from 'react'
import './TableOfContents.css'

interface Heading {
  id: string
  text: string
  level: number
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([])

  useEffect(() => {
    const articleContent = document.querySelector('.article-content')
    if (!articleContent) return

    const headingElements = articleContent.querySelectorAll('h2, h3')
    const headingList: Heading[] = []

    headingElements.forEach((heading) => {
      const text = heading.textContent || ''
      const level = parseInt(heading.tagName.charAt(1))
      
      // 如果标题没有 ID，生成一个
      if (!heading.id && text) {
        heading.id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50)
      }
      
      if (heading.id) {
        headingList.push({ id: heading.id, text, level })
      }
    })

    setHeadings(headingList)
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
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
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


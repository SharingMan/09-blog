'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useEffect } from 'react'
import './MarkdownContent.css'

interface MarkdownContentProps {
  content: string
}

// 生成标题 ID
function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  useEffect(() => {
    // 为所有标题添加 ID
    const headings = document.querySelectorAll('.markdown-content h2, .markdown-content h3')
    headings.forEach((heading) => {
      if (!heading.id && heading.textContent) {
        heading.id = generateHeadingId(heading.textContent)
      }
    })
  }, [content])

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ node, children, ...props }: any) => {
            const text = Array.isArray(children) 
              ? children.map(c => typeof c === 'string' ? c : '').join('')
              : (typeof children === 'string' ? children : '')
            const id = generateHeadingId(text || 'heading')
            return <h2 id={id} {...props}>{children}</h2>
          },
          h3: ({ node, children, ...props }: any) => {
            const text = Array.isArray(children) 
              ? children.map(c => typeof c === 'string' ? c : '').join('')
              : (typeof children === 'string' ? children : '')
            const id = generateHeadingId(text || 'heading')
            return <h3 id={id} {...props}>{children}</h3>
          },
          p: ({ node, ...props }) => <p {...props} />,
          ul: ({ node, ...props }) => <ul {...props} />,
          ol: ({ node, ...props }) => <ol {...props} />,
          li: ({ node, ...props }) => <li {...props} />,
          blockquote: ({ node, ...props }) => <blockquote {...props} />,
          code: ({ node, className, children, ...props }: any) => {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          pre: ({ node, ...props }) => <pre {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}


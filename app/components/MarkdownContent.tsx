'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useEffect } from 'react'
import './MarkdownContent.css'

interface MarkdownContentProps {
  content: string
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

// 提取文本内容（处理 React 节点）
function extractText(children: any): string {
  if (typeof children === 'string') {
    return children
  }
  if (Array.isArray(children)) {
    return children.map(c => extractText(c)).join('')
  }
  if (children && typeof children === 'object' && 'props' in children) {
    return extractText(children.props.children)
  }
  return ''
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ node, children, ...props }: any) => {
            const text = extractText(children)
            const id = generateHeadingId(text || 'heading-2')
            return <h2 id={id} {...props}>{children}</h2>
          },
          h3: ({ node, children, ...props }: any) => {
            const text = extractText(children)
            const id = generateHeadingId(text || 'heading-3')
            return <h3 id={id} {...props}>{children}</h3>
          },
          h4: ({ node, children, ...props }: any) => {
            const text = extractText(children)
            const id = generateHeadingId(text || 'heading-4')
            return <h4 id={id} {...props}>{children}</h4>
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
          table: ({ node, ...props }: any) => (
            <div className="table-wrapper">
              <table {...props} />
            </div>
          ),
          thead: ({ node, ...props }: any) => <thead {...props} />,
          tbody: ({ node, ...props }: any) => <tbody {...props} />,
          tr: ({ node, ...props }: any) => <tr {...props} />,
          th: ({ node, ...props }: any) => <th {...props} />,
          td: ({ node, ...props }: any) => <td {...props} />,
          img: ({ node, src, alt, ...props }: any) => {
            // 处理图片 URL：如果是相对路径，确保正确
            let imageSrc = src || ''
            if (imageSrc && !imageSrc.startsWith('http://') && !imageSrc.startsWith('https://') && !imageSrc.startsWith('/')) {
              // 如果是相对路径但没有 / 开头，添加 /
              imageSrc = '/' + imageSrc
            }
            return (
            <img
              loading="lazy"
              decoding="async"
                src={imageSrc}
                alt={alt || ''}
              {...props}
              style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '2em auto' }}
                onError={(e) => {
                  console.error('图片加载失败:', imageSrc)
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
            />
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}


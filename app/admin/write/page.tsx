'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Navbar from '../../components/Navbar'
import '@uiw/react-md-editor/markdown-editor.css'
import './Write.css'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

export default function WritePage() {
  const [title, setTitle] = useState('')
  const getDefaultDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    return `${year}年${month}月${day}日`
  }

  const [date, setDate] = useState(getDefaultDate())
  const [readTime, setReadTime] = useState('5 分钟')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // 日期格式化函数（如果用户输入的不是标准格式，保持原样）
  const formatDate = (dateStr: string) => {
    // 如果已经是标准格式（包含"年"和"月"），直接返回
    if (dateStr.includes('年') && dateStr.includes('月')) {
      return dateStr
    }
    // 否则尝试解析并格式化
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return dateStr
    }
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}年${month}月${day}日`
  }

  const handleSave = async () => {
    if (!title || !date || !readTime || !content) {
      setSaveStatus({
        type: 'error',
        message: '请填写所有必填字段'
      })
      return
    }

    setIsSaving(true)
    setSaveStatus(null)

    try {
      // 格式化日期
      const formattedDate = formatDate(date)

      // 处理标签（逗号分隔）
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean)

      const response = await fetch('/api/articles/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          date: formattedDate,
          readTime,
          content,
          category: category || undefined,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSaveStatus({
          type: 'success',
          message: `文章保存成功！ID: ${data.id}`
        })
        // 3秒后跳转到文章页面
        setTimeout(() => {
          window.location.href = `/posts/${data.id}`
        }, 2000)
      } else {
        setSaveStatus({
          type: 'error',
          message: data.error || '保存失败'
        })
      }
    } catch (error) {
      setSaveStatus({
        type: 'error',
        message: '保存时出错，请稍后重试'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="write-page">
        <div className="write-container">
        <h1 className="write-title">写文章</h1>

        <div className="write-form">
          <div className="form-group">
            <label htmlFor="title">标题 *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入文章标题"
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">日期 *</label>
              <input
                id="date"
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="2025年1月15日"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="readTime">阅读时长 *</label>
              <input
                id="readTime"
                type="text"
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                placeholder="5 分钟"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">分类</label>
              <input
                id="category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="例如：设计、技术"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tags">标签（逗号分隔）</label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="例如：设计, 极简, 美学"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="content">内容 *</label>
            <div className="editor-wrapper">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || '')}
                preview="edit"
                hideToolbar={false}
                visibleDragbar={false}
              />
            </div>
          </div>

          {saveStatus && (
            <div className={`save-status save-status-${saveStatus.type}`}>
              {saveStatus.message}
            </div>
          )}

          <div className="form-actions">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="save-button"
            >
              {isSaving ? '保存中...' : '保存并发布'}
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}


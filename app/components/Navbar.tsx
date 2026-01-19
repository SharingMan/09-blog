'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SearchBar from './SearchBar'
import './Navbar.css'

interface Article {
  id: string
  title: string
  date: string
  readTime: string
  excerpt?: string
}

interface NavbarProps {
  articles?: Article[]
}

export default function Navbar({ articles = [] }: NavbarProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [scrolled, setScrolled] = useState(false)
  const [clientArticles, setClientArticles] = useState<Article[]>(articles)

  useEffect(() => {
    // 如果没有传入文章，从 API 获取
    if (articles.length === 0) {
      fetch('/api/articles')
        .then(res => res.json())
        .then(data => setClientArticles(data))
        .catch(() => setClientArticles([]))
    } else {
      setClientArticles(articles)
    }
  }, [articles])

  useEffect(() => {
    // Check for saved theme preference on mount
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    } else {
      // Set default theme attribute
      document.documentElement.setAttribute('data-theme', 'light')
    }

    // Handle scroll
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link href="/" className="navbar-logo">
          新海说
        </Link>
        <div className="navbar-links">
          <Link href="/">首页</Link>
          <Link href="/posts">文章</Link>
          <Link href="/archive">分类</Link>
          <Link href="/works">作品</Link>
          <Link href="/about">关于</Link>
          <Link href="/admin/write">写文章</Link>
          {clientArticles.length > 0 && <SearchBar articles={clientArticles} />}
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="切换主题"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </nav>
  )
}


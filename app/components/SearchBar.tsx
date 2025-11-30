'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import './SearchBar.css'

interface Article {
  id: string
  title: string
  date: string
  readTime: string
  excerpt?: string
}

interface SearchBarProps {
  articles: Article[]
}

export default function SearchBar({ articles }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Article[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (value: string) => {
    setQuery(value)
    
    if (!value.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    const searchTerm = value.toLowerCase()
    const matched = articles.filter(article => 
      article.title.toLowerCase().includes(searchTerm) ||
      article.excerpt?.toLowerCase().includes(searchTerm)
    )

    setResults(matched)
    setIsOpen(matched.length > 0)
  }

  return (
    <div className="search-container" ref={searchRef}>
      <input
        type="text"
        className="search-input"
        placeholder="搜索文章..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true)
        }}
      />
      
      {isOpen && results.length > 0 && (
        <div className="search-results">
          {results.map((article) => (
            <Link
              key={article.id}
              href={`/posts/${article.id}`}
              className="search-result-item"
              onClick={() => {
                setIsOpen(false)
                setQuery('')
              }}
            >
              <div className="search-result-title">{article.title}</div>
              {article.excerpt && (
                <div className="search-result-excerpt">{article.excerpt}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}


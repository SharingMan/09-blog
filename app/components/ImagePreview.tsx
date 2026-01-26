'use client'

import { useState, useEffect } from 'react'
import './ImagePreview.css'

interface ImagePreviewProps {
  src: string
  alt?: string
  children: React.ReactNode
}

export default function ImagePreview({ src, alt, children }: ImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleEscape)
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(true)
    setImageLoaded(false)
  }

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.target === e.currentTarget) {
      setIsOpen(false)
    }
  }

  return (
    <>
      <div className="image-preview-wrapper" onClick={handleImageClick}>
        {children}
        <div className="image-preview-hint">
          <span className="image-preview-icon">🔍</span>
          <span className="image-preview-text">点击查看大图</span>
        </div>
      </div>

      {isOpen && (
        <div className="image-preview-overlay" onClick={handleClose}>
          <div className="image-preview-container">
            <button
              className="image-preview-close"
              onClick={handleClose}
              aria-label="关闭预览"
            >
              ✕
            </button>
            <div className="image-preview-content">
              <img
                src={src}
                alt={alt || ''}
                className={`image-preview-img ${imageLoaded ? 'loaded' : ''}`}
                onLoad={() => setImageLoaded(true)}
                onClick={(e) => e.stopPropagation()}
              />
              {!imageLoaded && (
                <div className="image-preview-loading">
                  <div className="image-preview-spinner"></div>
                </div>
              )}
              {alt && (
                <div className="image-preview-caption">{alt}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

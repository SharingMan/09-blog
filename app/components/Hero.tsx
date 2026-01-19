'use client'

import './Hero.css'

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-container">
        <div className="avatar-wrapper">
          <img 
            src="/avatar.jpg" 
            alt="新海的头像" 
            className="avatar"
            onError={(e) => {
              // Fallback to placeholder if image doesn't exist
              const target = e.target as HTMLImageElement
              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Ccircle cx="100" cy="100" r="100" fill="%23e0e0e0"/%3E%3C/svg%3E'
            }}
          />
        </div>
        <h1 className="hero-name">新海说</h1>
        <p className="hero-greeting">Hello，我是新海</p>
        <p className="hero-philosophy">
          <em>"我坚信做有趣、有用的产品一定会帮助到更多人，这也是我做产品的意义"</em>
        </p>
      </div>
    </section>
  )
}


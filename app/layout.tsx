import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: '新海说',
    template: '%s | 新海说'
  },
  description: '新海说｜极简、高雅的瑞士风个人博客，新海日记，分享思考与生活',
  keywords: ['xinhai', '新海说', '新海日记', '个人博客', '极简设计', '瑞士风格', '博客'],
  authors: [{ name: '新海' }],
  creator: '新海',
  publisher: '新海',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://xinhai.blog',
    siteName: '新海说',
    title: '新海说',
    description: '新海说｜极简、高雅的瑞士风个人博客，新海日记，分享思考与生活',
  },
  twitter: {
    card: 'summary_large_image',
    title: '新海说',
    description: '新海说｜极简、高雅的瑞士风个人博客',
  },
  icons: {
    icon: '/avatar.jpg',
    apple: '/avatar.jpg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/avatar.jpg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/avatar.jpg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Newsreader:wght@400;700&family=Inter:wght@300;400;500;600&family=Noto+Serif+SC:wght@400;600&family=Noto+Sans+SC:wght@300;400;500&display=swap" rel="stylesheet" />
        <link rel="alternate" type="application/rss+xml" title="新海说 RSS" href="/feed.xml" />
        <meta name="author" content="新海" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://xinhai.blog" />
      </head>
      <body>{children}</body>
    </html>
  )
}


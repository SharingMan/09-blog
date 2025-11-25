import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '新海说',
  description: '新海说｜极简、高雅的瑞士风个人博客',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Newsreader:wght@400;700&family=Inter:wght@300;400;500;600&family=Noto+Serif+SC:wght@400;600&family=Noto+Sans+SC:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}


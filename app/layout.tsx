import type { Metadata } from 'next'
import { Inter, Noto_Serif_SC, Playfair_Display, Newsreader } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSerifSC = Noto_Serif_SC({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
})

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
    url: 'https://xinhaiblog.top',
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
    <html
      lang="zh-CN"
      data-theme="light"
      suppressHydrationWarning
      className={`${inter.variable} ${notoSerifSC.variable} ${playfair.variable} ${newsreader.variable}`}
    >
      <head>
        <link rel="alternate" type="application/rss+xml" title="新海说 RSS" href="/feed.xml" />
        <meta name="author" content="新海" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://xinhaiblog.top" />
      </head>
      <body>{children}</body>
    </html>
  )
}


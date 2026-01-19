import { MetadataRoute } from 'next'
import { getAllArticles } from './data/articles'

export default function sitemap(): MetadataRoute.Sitemap {
    const articles = getAllArticles()
    const baseUrl = 'https://xinhaiblog.top'

    // 基础页面
    const routes = [
        '',
        '/posts',
        '/archive',
        '/works',
        '/about',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    // 文章页面
    const articleRoutes = articles.map((article) => {
        // 转换日期格式：2026年1月19日 -> 2026-01-19
        const dateStr = article.date
            .replace(/年/g, '-')
            .replace(/月/g, '-')
            .replace(/日/g, '')

        // 验证日期格式是否有效
        const date = new Date(dateStr)
        const validDate = isNaN(date.getTime()) ? new Date() : date

        return {
            url: `${baseUrl}/posts/${article.id}`,
            lastModified: validDate.toISOString(),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        }
    })

    return [...routes, ...articleRoutes]
}

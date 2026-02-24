import type { Metadata } from 'next'
import Navbar from '../components/Navbar'
import { getArticleList } from '../data/articles/index'
import './Works.css'

export const metadata: Metadata = {
  title: '作品',
  description: '新海的作品集｜展示我的个人项目和产品',
  keywords: ['xinhai', '新海说', '作品', '项目', '产品'],
}

interface Project {
  title: string
  description: string
  url: string
  tags: string[]
  emoji: string
}

const projects: Project[] = [
  {
    title: 'Notion Home',
    description: '将你notion 数据库同步到手机日历的工具，方便高效实用。',
    url: 'https://notionhome-production.up.railway.app/',
    tags: ['Notion', '效率工具', '知识管理', '产品'],
    emoji: '🏠',
  },
  {
    title: '财报AI助手',
    description: '一个专为投资者和财务分析师设计的工具，支持 A 股及美股上市公司。自动聚合最近五年年报、最新季报，并生成 AI 分析指令包，助力通过 NotebookLLM 等工具进行深度价值研究。',
    url: 'https://cninfo2notebookllm-production.up.railway.app/',
    tags: ['AI', 'Python', '财报分析', 'NotebookLLM', '金融'],
    emoji: '📊',
  },
  {
    title: '新海说博客',
    description: '我的个人博客网站，采用极简、高雅的瑞士风格设计，记录我的思考与生活。使用 Next.js 构建，支持 RSS 订阅，包含文章分类、标签、搜索等功能。',
    url: 'https://xinhaiblog.vercel.app/',
    tags: ['Next.js', 'React', 'TypeScript', '博客'],
    emoji: '📝',
  },
  {
    title: '公众号 Markdown 编辑器',
    description: '一个专为微信公众号设计的 Markdown 编辑器，支持实时预览、样式自定义，可以快速将 Markdown 格式的文章转换为适合公众号发布的格式。',
    url: 'https://11-markdon-to-notion-wechat.vercel.app/',
    tags: ['Markdown', '编辑器', '微信公众号', '工具'],
    emoji: '✍️',
  },
  {
    title: 'Notion同步教程网站',
    description: '一个教程展示网站，提供清晰的内容组织和良好的学习体验。使用现代化的技术栈构建，支持响应式设计，帮助用户更好地学习和探索知识。',
    url: 'https://12-tutorial-site.vercel.app/',
    tags: ['Next.js', 'Notion', '教程', '学习', '网站'],
    emoji: '📚',
  },
  {
    title: '全球新闻',
    description: '一个聚合全球新闻资讯的平台，提供实时的新闻报道和多维度的资讯浏览体验。',
    url: 'https://mynews-production-52a2.up.railway.app/',
    tags: ['News', 'Next.js', 'React', '资讯'],
    emoji: '🌍',
  },
]

export default function WorksPage() {
  const allArticles = getArticleList()

  return (
    <>
      <Navbar articles={allArticles} />
      <article className="works-page">
        <div className="works-container reading-content">
          <section className="works-intro-section">
            <h1 className="works-title">我的作品</h1>
            <p className="works-intro">
              这里展示了我独立开发的一些项目和产品，每一个都倾注了我的思考和努力。
            </p>
          </section>

          <section className="works-projects-section">
            {projects.map((project, index) => (
              <div key={index} className="project-card">
                <div className="project-header">
                  <span className="project-emoji">{project.emoji}</span>
                  <h2 className="project-title">{project.title}</h2>
                </div>
                <p className="project-description">{project.description}</p>
                <div className="project-tags">
                  {project.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="project-tag">{tag}</span>
                  ))}
                </div>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-link"
                >
                  访问项目
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>
            ))}
          </section>
        </div>
      </article>
    </>
  )
}

# 新海说 · 极简个人博客

一个名为「新海说」的极简、高雅、注重排版和阅读体验的个人博客网站，采用瑞士国际主义设计风格。

## 设计特点

- **极简主义**：大量留白，去除多余装饰
- **优雅字体**：精心选择的中英文字体搭配
- **沉浸式阅读**：65ch 最佳阅读宽度
- **深色模式**：支持浅色/深色主题切换
- **响应式设计**：移动端优先，完全响应式

## 技术栈

- Next.js 14
- React 18
- TypeScript
- CSS Modules

## 字体系统

- **英文标题**：Playfair Display / Newsreader（衬线体）
- **中文标题**：Noto Serif SC（宋体风格）
- **正文**：Inter + Noto Sans SC（无衬线体）

## 开始使用

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
app/
  components/
    Navbar.tsx         # 顶部导航（高斯模糊效果）
    Hero.tsx           # 首页 Hero 区域
    ContactLinks.tsx   # 联系方式图标与复制逻辑
    ArticleList.tsx    # 文章列表
  data/
    articles/          # Markdown 文章与索引
  posts/
    [id]/              # 文章详情页
  page.tsx          # 首页
  layout.tsx        # 根布局
  globals.css       # 全局样式
```

## 自定义配置

### 修改个人信息

编辑 `app/components/Hero.tsx` 与 `app/components/ContactLinks.tsx` 可修改头像、标题以及 Email / GitHub / WeChat 联系方式（默认邮箱 `g5413859@163.com`、GitHub `SharingMan`、WeChat `gxh863155964`）。

### 添加文章

每篇文章是独立的 Markdown 文件，位于 `app/data/articles/{id}.md`，文件头需包含：

```markdown
---
title: 文章标题
date: 2025年1月20日
readTime: 5 分钟
---

文章正文...
```

保存后刷新即可看到更新，具体写作约定见 `app/data/articles/README.md`。

### 修改配色

编辑 `app/globals.css` 中的 CSS 变量来调整颜色方案。

## 设计原则

1. **少即是多**：每个元素都有其存在的理由
2. **留白优先**：用间距而非装饰来区分层级
3. **字体韵律**：精心调整的字号、行高、字间距
4. **微交互**：细腻的 hover 效果，避免剧烈动画
5. **移动优先**：从移动端开始设计，逐步增强


# Vercel 国内访问速度优化方案

## 🎯 问题分析

Vercel 的 CDN 节点主要分布在海外，国内访问可能较慢。以下是几种优化方案：

## 方案一：使用国内 CDN 加速（推荐）

### 1. 使用 Cloudflare（免费）

Cloudflare 有国内节点，可以加速访问：

1. **注册 Cloudflare 账号**：https://www.cloudflare.com/
2. **添加您的域名**到 Cloudflare
3. **配置 DNS**：
   - 添加 CNAME 记录指向 Vercel
   - 或使用 Cloudflare 的代理功能
4. **启用 CDN 加速**

### 2. 使用腾讯云 CDN 或阿里云 CDN

如果有国内域名，可以使用：
- **腾讯云 CDN**：https://cloud.tencent.com/product/cdn
- **阿里云 CDN**：https://www.aliyun.com/product/cdn

配置步骤：
1. 在 Vercel 绑定自定义域名
2. 在 CDN 服务商配置回源到 Vercel
3. 启用 CDN 加速

## 方案二：优化 Next.js 配置

### 1. 启用图片优化和压缩

更新 `next.config.js`：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['react-markdown', 'remark-gfm'],
  
  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // 压缩
  compress: true,
  
  // 生产环境优化
  swcMinify: true,
  
  // 静态资源优化
  experimental: {
    optimizeCss: true,
  },
}
```

### 2. 添加缓存策略

在 `next.config.js` 中添加：

```javascript
async headers() {
  return [
    {
      source: '/images/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/_next/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ]
}
```

## 方案三：使用 Vercel 的国内镜像

### 1. 配置 Vercel 的 Edge Network

在 Vercel 项目设置中：
1. 进入项目 Settings
2. 找到 Edge Network 配置
3. 启用全球 CDN（虽然对国内帮助有限）

### 2. 使用自定义域名 + DNS 优化

1. **在 Vercel 绑定自定义域名**
2. **使用国内 DNS 服务商**（如阿里云 DNS、腾讯云 DNS）
3. **配置智能解析**，国内用户解析到更快的节点

## 方案四：部署到国内平台（备选）

如果 Vercel 访问确实很慢，可以考虑：

### 1. Vercel + 国内平台双部署

- **主站**：Vercel（国际用户）
- **镜像站**：部署到国内平台（国内用户）

### 2. 国内部署平台选择

- **Vercel 中国版**（如果有）
- **Netlify**（也有国内访问问题）
- **腾讯云静态网站托管**
- **阿里云 OSS + CDN**
- **GitHub Pages + Cloudflare**

## 方案五：代码层面优化

### 1. 减少首屏加载时间

- 使用 Next.js 的 `next/image` 优化图片
- 代码分割和懒加载
- 预加载关键资源

### 2. 优化字体加载

在 `app/layout.tsx` 中优化字体加载：

```typescript
import { Inter, Noto_Sans_SC, Noto_Serif_SC } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap' })
const notoSans = Noto_Sans_SC({ 
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})
```

### 3. 添加资源预加载

在 `app/layout.tsx` 的 `<head>` 中添加：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://fonts.googleapis.com">
```

## 方案六：使用 Cloudflare Workers（高级）

使用 Cloudflare Workers 作为反向代理，加速访问：

1. 在 Cloudflare 创建 Worker
2. 配置反向代理到 Vercel
3. 利用 Cloudflare 的全球网络加速

## 方案七：使用 enhanced-FaaS-in-China（社区方案）

这是一个专门针对 Vercel、Netlify 等平台在大陆访问速度优化的开源项目。

**项目地址**：[https://github.com/xingpingcn/enhanced-FaaS-in-China](https://github.com/xingpingcn/enhanced-FaaS-in-China)

### 原理
该项目通过筛选出国内访问速度较快的 Vercel 节点 IP，并通过特定的 CNAME 记录提供服务。

### 使用条件
**必须拥有自定义域名**（不能使用 `xinhaiblog.vercel.app` 这种默认子域名），因为你需要修改域名的 DNS 解析记录。

### 配置步骤
1. **购买域名**：如果没有，需先购买一个域名（推荐 NameSilo, 阿里云, 腾讯云等）。
2. **绑定 Vercel**：在 Vercel 项目设置 -> Domains 中添加你的域名。
3. **修改 DNS 记录**：在你的域名 DNS 服务商处（如阿里云 DNS），将 CNAME 记录修改为：
   - **记录类型**：CNAME
   - **主机记录**：`@` 或 `www`
   - **记录值**：`vercel-cname.xingpingcn.top`
   *(原 Vercel 默认是 `cname.vercel-dns.com`)*

### 优缺点
- ✅ **优点**：配置简单，无需服务器，国内访问速度提升明显。
- ⚠️ **缺点**：依赖第三方维护的 DNS 记录；如果该项目停止维护，可能导致访问中断（需切回官方 CNAME）。

## 🚀 快速实施建议

### 立即可做（无需额外成本）

1. **优化 Next.js 配置**（添加图片优化、压缩）
2. **添加缓存策略**
3. **优化字体加载**

### 中期优化（需要域名）

1. **绑定自定义域名**
2. **使用 Cloudflare 免费 CDN**
3. **配置智能 DNS**

### 长期方案（如果访问量较大）

1. **使用国内 CDN 服务**
2. **考虑双部署方案**

## 📊 测试访问速度

使用以下工具测试：

- **PageSpeed Insights**：https://pagespeed.web.dev/
- **GTmetrix**：https://gtmetrix.com/
- **WebPageTest**：https://www.webpagetest.org/

## 💡 推荐方案

对于个人博客，推荐：

1. **短期**：优化 Next.js 配置 + 添加缓存
2. **中期**：使用 Cloudflare 免费 CDN（如果有域名）
3. **长期**：根据访问量考虑国内 CDN 或双部署

## 📝 注意事项

- Vercel 免费版有流量限制
- 国内 CDN 服务通常需要备案（如果使用国内域名）
- Cloudflare 免费版对国内加速效果有限，但比直接访问 Vercel 好

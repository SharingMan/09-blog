# Puppeteer 安装说明

## 🚨 当前问题

安装 Puppeteer 时下载 Chromium 遇到网络连接问题（ECONNRESET）。

## 💡 解决方案

### 方案一：稍后重试（推荐）

网络问题通常是暂时的，可以稍后再试：

```bash
cd "/Users/jiyingshe/Desktop/AI学习/09-blog"
npm install puppeteer --save-dev
```

**提示**：如果仍然失败，可以：
1. 检查网络连接
2. 尝试使用代理（如果有）
3. 等待一段时间后重试

### 方案二：跳过浏览器下载（如果只想先安装包）

```bash
export PUPPETEER_SKIP_DOWNLOAD=true
npm install puppeteer --save-dev
```

注意：这种方式安装后，需要手动配置 Chrome/Chromium 路径。

### 方案三：使用导出方式（最简单可靠）

目前**最推荐的方式**仍然是使用 Notion 导出功能：

1. 在 Notion 中打开页面
2. 点击 "..." → "Export" → 选择 "Markdown"
3. 下载文件
4. 使用导入工具：`./scripts/import ~/Downloads/文件.md`

这种方式：
- ✅ 100% 可靠
- ✅ 保留完整格式
- ✅ 自动处理图片
- ✅ 不需要额外安装

## 📋 使用建议

### 对于网页端导入

如果您确实需要从网页端直接导入：

1. **先尝试重试安装** Puppeteer（网络恢复后）
2. **或使用导出方式**（最可靠）

### 当前可用的导入方式

**方式一：导出后导入** ⭐ 最推荐
```bash
./scripts/import ~/Downloads/周记.md
```

**方式二：Notion API 自动同步**（需要配置）
```bash
node scripts/notion-sync.js
```

**方式三：网页端导入**（需要 Puppeteer）
```bash
# 安装 Puppeteer 后
node scripts/import-notion-web.js "https://notion.site/xxx"
```

## 🎯 推荐

对于日常使用，**导出方式已经足够好**：
- 操作简单
- 可靠稳定
- 保留完整内容
- 自动处理图片

网页端导入可以作为一个补充功能，但不是必需的。

# Notion 自动同步功能设置指南

## 📋 概述

这个功能可以将 Notion 数据库中的文章自动同步到博客，支持增量同步和自动去重。

## 🚀 快速开始

### 1. 配置 Notion Integration

1. **创建 Integration**
   - 访问：https://www.notion.so/my-integrations
   - 点击 "New integration"
   - 填写名称（如：博客自动同步）
   - 选择工作区
   - 点击 "Submit"
   - **复制 "Internal Integration Token"**

2. **获取数据库 ID**
   - 打开您的 Notion 数据库页面
   - 复制 URL 中的数据库 ID（32位字符）
   - 例如：`https://www.notion.so/1234567890abcdef1234567890abcdef?v=...`
   - 数据库 ID 就是 `1234567890abcdef1234567890abcdef`

3. **分享数据库给 Integration**
   - 在数据库页面点击右上角 "..." → "Connections"
   - 选择您创建的 Integration
   - 确认分享

### 2. 配置环境变量

在项目根目录创建 `.env.local` 文件：

```env
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=1234567890abcdef1234567890abcdef
```

**注意**：`.env.local` 文件不会被提交到 Git，请妥善保管。

### 3. 配置 Notion 数据库字段

为了更好的同步效果，建议在 Notion 数据库中创建以下字段：

| 字段名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| Title 或 Name | Title | ✅ | 文章标题 |
| Date | Date | ✅ | 发布日期 |
| Category | Select | ❌ | 文章分类 |
| Tags | Multi-select | ❌ | 文章标签 |

### 4. 测试同步

#### 方法一：通过 API 端点

```bash
# 增量同步（推荐）
curl http://localhost:3000/api/notion/sync

# 强制全量同步（首次使用）
curl http://localhost:3000/api/notion/sync?force=true
```

#### 方法二：在浏览器中访问

```
http://localhost:3000/api/notion/sync
```

#### 方法三：使用 Postman 或类似工具

- URL: `http://localhost:3000/api/notion/sync`
- Method: `GET`
- Query Params: `force=true` (可选，用于强制全量同步)

## 🔄 自动同步设置

### Vercel Cron Jobs（推荐）

如果部署在 Vercel，可以在 `vercel.json` 中配置定时任务：

```json
{
  "crons": [
    {
      "path": "/api/notion/sync",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

这将每 6 小时自动同步一次。

**其他时间间隔示例：**
- `0 * * * *` - 每小时
- `0 */12 * * *` - 每 12 小时
- `0 0 * * *` - 每天午夜
- `0 0 * * 0` - 每周日

### GitHub Actions（可选）

创建 `.github/workflows/notion-sync.yml`：

```yaml
name: Notion Sync

on:
  schedule:
    - cron: '0 */6 * * *'  # 每 6 小时
  workflow_dispatch:  # 手动触发

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: curl -X GET "${{ secrets.SITE_URL }}/api/notion/sync"
        env:
          SITE_URL: ${{ secrets.SITE_URL }}
```

## 📊 同步状态

同步状态保存在 `.notion-sync-state.json` 文件中，记录：
- 最后同步时间
- 已同步的文章映射（Notion pageId -> 博客 articleId）

该文件会自动创建和管理，无需手动编辑。

## 🎯 API 响应格式

### 成功响应

```json
{
  "success": true,
  "message": "同步完成",
  "total": 10,
  "synced": 2,
  "updated": 3,
  "skipped": 5
}
```

- `total`: 数据库中的总文章数
- `synced`: 新同步的文章数
- `updated`: 更新的文章数
- `skipped`: 跳过的文章数（未更新）

### 错误响应

```json
{
  "success": false,
  "error": "错误信息"
}
```

## ⚠️ 注意事项

1. **首次同步**：建议使用 `force=true` 进行全量同步
2. **增量同步**：后续同步会自动跳过未更新的文章
3. **文件覆盖**：如果文章已存在，会更新文件内容
4. **图片处理**：Notion 图片 URL 会直接使用，如需下载到本地，需要额外处理
5. **环境变量**：确保在生产环境（Vercel）中也配置了环境变量

## 🔧 故障排除

### 错误：请配置 NOTION_TOKEN 和 NOTION_DATABASE_ID

- 检查 `.env.local` 文件是否存在
- 确认环境变量名称正确
- 重启开发服务器

### 错误：获取 Notion 数据库失败

- 检查数据库 ID 是否正确
- 确认数据库已分享给 Integration
- 检查 Integration Token 是否有效

### 同步后文章没有出现

- 检查 Notion 数据库字段名是否正确（Title/Name, Date）
- 确认文章有内容（空文章会被跳过）
- 查看服务器日志了解详细错误

## 📚 更多信息

- API 详细文档：`app/api/notion/sync/README.md`
- Notion API 文档：https://developers.notion.com/

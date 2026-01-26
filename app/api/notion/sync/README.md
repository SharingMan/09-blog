# Notion 自动同步 API

这个 API 端点用于将 Notion 数据库中的文章自动同步到博客。

## 功能特性

- ✅ **增量同步**：只同步更新或新增的文章，避免重复
- ✅ **自动去重**：通过同步状态文件记录已同步的文章
- ✅ **支持 Webhook**：可以通过 Notion webhook 触发自动同步
- ✅ **完整格式支持**：支持标题、列表、代码块、图片等多种 Notion 块类型
- ✅ **自动计算**：自动计算阅读时间和格式化日期

## 配置

### 1. 环境变量

在 `.env.local` 文件中配置：

```env
NOTION_TOKEN=your_notion_integration_token
NOTION_DATABASE_ID=your_notion_database_id
```

### 2. Notion Integration 设置

1. 访问 https://www.notion.so/my-integrations
2. 创建新的 Integration
3. 复制 Integration Token
4. 在 Notion 数据库中点击 "..." → "Connections" → 选择您的 Integration

### 3. Notion 数据库字段

建议在 Notion 数据库中创建以下字段：

- **Title** 或 **Name**：标题（必需）
- **Date**：日期（date 类型）
- **Category**：分类（select 类型，可选）
- **Tags**：标签（multi-select 类型，可选）

## 使用方法

### 方法一：手动触发同步（GET）

```bash
# 增量同步（只同步更新的文章）
curl http://localhost:3000/api/notion/sync

# 强制全量同步（同步所有文章）
curl http://localhost:3000/api/notion/sync?force=true
```

### 方法二：通过 Webhook 触发（POST）

配置 Notion webhook（如果支持）或使用定时任务服务（如 Vercel Cron）：

```bash
curl -X POST http://localhost:3000/api/notion/sync \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 方法三：在代码中调用

```typescript
// 增量同步
const response = await fetch('/api/notion/sync')
const result = await response.json()

// 强制全量同步
const response = await fetch('/api/notion/sync?force=true')
const result = await response.json()
```

## 响应格式

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

## 定时同步（Vercel）

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

## 同步状态文件

同步状态保存在 `.notion-sync-state.json` 文件中，记录：
- 最后同步时间
- 已同步的文章映射（Notion pageId -> 博客 articleId）

该文件会自动创建和管理，无需手动编辑。

## 错误处理

如果同步失败，API 会返回错误信息：

```json
{
  "success": false,
  "error": "错误信息"
}
```

常见错误：
- `请配置 NOTION_TOKEN 和 NOTION_DATABASE_ID 环境变量`：未配置环境变量
- `获取 Notion 数据库失败`：数据库 ID 错误或未授权
- `处理页面失败`：某个页面处理出错（会继续处理其他页面）

## 注意事项

1. **首次同步**：建议使用 `force=true` 进行全量同步
2. **增量同步**：后续同步会自动跳过未更新的文章
3. **文件覆盖**：如果文章已存在，会更新文件内容
4. **图片处理**：Notion 图片 URL 会直接使用，如需下载到本地，需要额外处理

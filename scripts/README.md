# Notion 日记同步工具

这个目录包含将 Notion 日记同步到博客的工具。

## 方法一：使用 Notion API 自动同步（推荐）

### 1. 安装依赖

```bash
npm install @notionhq/client
```

### 2. 配置 Notion Integration

1. **创建 Integration**
   - 访问：https://www.notion.so/my-integrations
   - 点击 "New integration"
   - 填写名称（如：博客同步工具）
   - 选择工作区
   - 点击 "Submit"
   - 复制 "Internal Integration Token"

2. **获取数据库 ID**
   - 打开您的 Notion 日记数据库
   - 复制 URL 中的数据库 ID（32位字符）
   - 例如：`https://www.notion.so/1234567890abcdef1234567890abcdef`

3. **分享数据库给 Integration**
   - 在数据库页面点击右上角 "..." → "Connections"
   - 选择您创建的 Integration
   - 确认分享

### 3. 配置环境变量

创建 `.env.local` 文件（在项目根目录）：

```env
NOTION_TOKEN=your_integration_token_here
NOTION_DATABASE_ID=your_database_id_here
```

或者直接在 `notion-sync.js` 中修改：

```javascript
const CONFIG = {
  NOTION_TOKEN: 'your_token_here',
  DATABASE_ID: 'your_database_id_here',
  // ...
};
```

### 4. 运行同步脚本

```bash
node scripts/notion-sync.js
```

## 方法二：手动导入 Markdown（简单）

如果您从 Notion 导出了 Markdown 文件，可以使用导入工具：

### 1. 从 Notion 导出

1. 在 Notion 中选择要导出的页面
2. 点击 "..." → "Export"
3. 选择 "Markdown" 格式
4. 下载文件

### 2. 导入到博客

```bash
# 基本用法
node scripts/import-markdown.js <markdown文件路径>

# 完整用法（指定标题、日期、分类、标签）
node scripts/import-markdown.js ~/Downloads/日记.md "我的日记" "2025-01-17" "生活" "日记,日常"
```

### 示例

```bash
# 导入一篇日记
node scripts/import-markdown.js ~/Downloads/2026年第2周周记.md "2026年第2周周记" "2026-01-12" "生活" "周记,反思"

# 只指定文件路径（会自动提取标题和日期）
node scripts/import-markdown.js ~/Downloads/日记.md
```

## Notion 数据库字段建议

为了更好的同步效果，建议在 Notion 数据库中创建以下字段：

- **Title** 或 **Name**：标题（必需）
- **Date**：日期（date 类型）
- **Category**：分类（select 类型，可选）
- **Tags**：标签（multi-select 类型，可选）

## 注意事项

1. **日期格式**：脚本会自动将日期转换为 `2025年1月17日` 格式
2. **阅读时间**：自动根据字数计算（中文约 300 字/分钟）
3. **文件 ID**：使用时间戳作为文件名，确保唯一性
4. **内容格式**：支持标准 Markdown 语法

## 批量导入

如果您有多篇日记需要导入，可以创建一个简单的脚本：

```bash
#!/bin/bash
# import-all.sh

node scripts/import-markdown.js ~/Downloads/日记1.md "第一篇" "2025-01-01"
node scripts/import-markdown.js ~/Downloads/日记2.md "第二篇" "2025-01-02"
# ...
```

## 故障排除

### Notion API 同步失败

- 检查 Integration Token 是否正确
- 确认数据库已分享给 Integration
- 检查数据库 ID 是否正确
- 查看错误信息中的详细说明

### 导入失败

- 确认 Markdown 文件路径正确
- 检查文件编码是否为 UTF-8
- 查看控制台错误信息

## 更多帮助

如有问题，请查看：
- Notion API 文档：https://developers.notion.com/
- 博客文章格式说明：`app/data/articles/README.md`

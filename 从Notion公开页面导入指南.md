# 从 Notion 公开页面导入指南

## 🎯 问题

如果您将 Notion 周记发布为公开页面（如：https://pine-parrot-996.notion.site/39-xxx），如何方便地导入到博客？

## ✅ 推荐方案（最简单可靠）

### 方法一：使用 Notion 导出功能 ⭐ 最推荐

这是最可靠的方法，可以保留完整的格式和图片。

#### 步骤：

1. **打开您的 Notion 公开页面**
   - 在浏览器中访问您的 Notion 页面链接

2. **导出为 Markdown**
   - 点击右上角 **"..."** → **"Export"**
   - 选择格式：**Markdown & CSV** → **Markdown**
   - 点击 **"Export"** 下载文件

3. **导入到博客**
   ```bash
   cd "/Users/jiyingshe/Desktop/AI学习/09-blog"
   
   # 自动处理 Markdown 和图片
   ./scripts/import ~/Downloads/导出的文件.md
   ```

**优势：**
- ✅ 保留完整格式
- ✅ 自动处理图片
- ✅ 100% 可靠
- ✅ 支持所有 Notion 功能

### 方法二：使用 Notion API 自动同步

如果您有多个页面需要同步，可以使用 API 方式。

#### 步骤：

1. **创建 Notion Integration**
   - 访问：https://www.notion.so/my-integrations
   - 创建新的 Integration
   - 复制 Integration Token

2. **分享页面给 Integration**
   - 在 Notion 页面点击 **"..."** → **"Connections"**
   - 选择您创建的 Integration

3. **配置并运行**
   ```bash
   # 创建 .env.local 文件
   echo "NOTION_TOKEN=your_token_here" > .env.local
   echo "NOTION_DATABASE_ID=your_database_id" >> .env.local
   
   # 运行同步
   node scripts/notion-sync.js
   ```

**优势：**
- ✅ 可以批量同步
- ✅ 自动化程度高
- ✅ 适合定期更新

### 方法三：使用公开页面 URL（实验性）

我们提供了一个工具，但**不推荐**，因为：

- ❌ Notion 公开页面的 HTML 结构复杂
- ❌ 解析可能不完整
- ❌ 图片处理困难
- ❌ 格式可能丢失

如果仍想尝试：

```bash
node scripts/import-notion-url.js "https://pine-parrot-996.notion.site/39-xxx"
```

这个工具会引导您使用更可靠的方法。

## 📋 完整工作流程示例

### 场景：每周导入一篇周记

1. **在 Notion 中完成周记**
   - 写好内容
   - 添加图片
   - 设置格式

2. **发布为公开页面**（可选）
   - 点击 **"Share"** → **"Publish to web"**
   - 获得公开链接（如：https://pine-parrot-996.notion.site/39-xxx）

3. **导出并导入**
   ```bash
   # 在 Notion 中导出为 Markdown
   # 然后运行：
   cd "/Users/jiyingshe/Desktop/AI学习/09-blog"
   ./scripts/import ~/Downloads/我的生活周记39.md \
     --title "我的生活周记39-稳步前行" \
     --date "2026-01-19" \
     --category "生活" \
     --tags "周记,成长"
   ```

4. **完成！**
   - 文章自动导入
   - 图片自动处理
   - 格式自动优化

## 🔄 自动化建议

### 创建快捷脚本

创建 `import-weekly.sh`：

```bash
#!/bin/bash
cd "/Users/jiyingshe/Desktop/AI学习/09-blog"

# 从 Downloads 目录导入最新的 Markdown 文件
LATEST_FILE=$(ls -t ~/Downloads/*.md 2>/dev/null | head -1)

if [ -z "$LATEST_FILE" ]; then
  echo "❌ 未找到 Markdown 文件"
  echo "请先从 Notion 导出 Markdown 文件到 Downloads 目录"
  exit 1
fi

echo "找到文件: $LATEST_FILE"
./scripts/import "$LATEST_FILE" --category "生活" --tags "周记"
```

使用：

```bash
chmod +x import-weekly.sh
./import-weekly.sh
```

## 💡 最佳实践

1. **保持工作流程一致**
   - 每次都在 Notion 中完成写作
   - 使用相同的导出方式
   - 使用相同的导入命令

2. **利用公开链接**
   - 公开链接用于分享和预览
   - 导出功能用于导入博客
   - 两者可以同时使用

3. **批量处理**
   - 如果有多篇周记，可以批量导出
   - 使用循环脚本批量导入

## ❓ 常见问题

### Q: 为什么不能直接从公开链接导入？

A: Notion 公开页面的 HTML 结构复杂，直接解析：
- 可能丢失格式
- 图片处理困难
- 解析不稳定

**推荐使用导出功能**，这是 Notion 官方提供的标准方式。

### Q: 公开链接有什么用？

A: 公开链接可以：
- 分享给他人查看
- 作为博客文章的预览
- 方便在不同设备访问

但导入博客时，建议使用导出功能。

### Q: 可以自动化吗？

A: 可以！使用 Notion API 方式可以实现自动化同步。详见 `scripts/README.md`。

## 🎉 总结

**最简单可靠的方法：**

1. 在 Notion 中完成周记
2. 导出为 Markdown（保留完整内容）
3. 运行 `./scripts/import <文件路径>`
4. 完成！

这样既可以利用 Notion 的公开链接功能，又能可靠地导入到博客。

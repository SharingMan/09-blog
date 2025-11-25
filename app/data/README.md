# 文章编辑指南

所有文章内容都在 `articles.ts` 文件中，使用 **Markdown** 格式编写。

## 如何添加新文章

在 `articles` 数组中添加新对象：

```typescript
{
  id: '6',  // 唯一ID，建议使用数字递增
  title: '文章标题',
  date: '2025年1月20日',
  readTime: '5 分钟',
  content: \`你的 Markdown 内容\`
}
```

## Markdown 语法支持

### 标题

```markdown
## 二级标题
### 三级标题
```

### 段落

直接写文字，空一行表示新段落。

### 列表

无序列表：
```markdown
- 项目1
- 项目2
- 项目3
```

有序列表：
```markdown
1. 第一项
2. 第二项
3. 第三项
```

### 强调

```markdown
**粗体文字**
*斜体文字*
```

### 引用

```markdown
> 这是一段引用文字
```

### 代码

行内代码：
```markdown
使用 \`代码\` 来显示
```

代码块：
````markdown
```css
font-family: 'Inter', sans-serif;
font-size: 18px;
```
````

### 链接

```markdown
[链接文字](https://example.com)
```

### 图片

```markdown
![图片描述](/path/to/image.jpg)
```

## 示例

```typescript
{
  id: '6',
  title: '我的新文章',
  date: '2025年1月20日',
  readTime: '5 分钟',
  content: \`这是一段引言。

## 主要章节

这是正文内容，支持**粗体**和*斜体*。

### 子章节

- 列表项1
- 列表项2

> 这是一段引用

\`\`\`javascript
console.log('Hello World');
\`\`\`
\`
}
```

## 注意事项

1. 使用反引号（\`）包裹 content 内容
2. 代码块中的反引号需要转义：\`\`\`
3. 保持简洁，专注于内容本身
4. 日期格式：YYYY年MM月DD日
5. 阅读时长：估算即可，如 "5 分钟"、"10 分钟"


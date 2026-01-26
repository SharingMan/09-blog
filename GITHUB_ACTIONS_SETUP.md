# GitHub Actions 自动同步配置指南

## 📋 配置步骤

### 1. 添加 GitHub Secrets

在 GitHub 仓库中设置以下 Secrets：

1. 进入仓库 → **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret** 添加以下两个密钥：

#### NOTION_TOKEN
- **Name**: `NOTION_TOKEN`
- **Value**: `你的 Notion API Token（格式：ntn_...）`

#### NOTION_DATABASE_ID
- **Name**: `NOTION_DATABASE_ID`
- **Value**: `你的 Notion 数据库 ID`

### 2. 配置说明

#### 定时同步
- **默认时间**: 每天 UTC 时间 2:00（北京时间 10:00）
- **修改时间**: 编辑 `.github/workflows/notion-sync.yml` 中的 `cron` 表达式

#### 手动触发
- 进入 **Actions** 标签页
- 选择 **Notion 自动同步** workflow
- 点击 **Run workflow** 按钮

#### 自动触发
- 当代码推送到 `main` 分支时也会触发同步

### 3. 查看同步日志

1. 进入仓库 → **Actions** 标签页
2. 点击 **Notion 自动同步** workflow
3. 查看运行日志

## 🔧 自定义配置

### 修改同步时间

编辑 `.github/workflows/notion-sync.yml`：

```yaml
schedule:
  - cron: '0 2 * * *'  # UTC 时间 2:00
```

Cron 表达式说明：
- `0 2 * * *` = 每天 UTC 2:00（北京时间 10:00）
- `0 */6 * * *` = 每 6 小时
- `0 0 * * 0` = 每周日 UTC 0:00

### 禁用自动提交

如果不想自动提交更改，删除 workflow 文件中的最后一步：

```yaml
- name: 提交更改
  run: ...
```

## ⚠️ 注意事项

1. **权限要求**: 确保 GitHub Actions 有写入权限
2. **Token 安全**: 不要将 Token 提交到代码仓库
3. **同步状态**: 同步状态保存在 `.notion-sync-state.json` 文件中
4. **文件冲突**: 如果多人同时修改，可能会有冲突

## 📝 测试

1. 手动触发一次同步测试
2. 检查 **Actions** 标签页中的运行日志
3. 确认文章已同步到 `app/data/articles/` 目录

## 🐛 故障排除

### 同步失败
- 检查 Secrets 是否正确配置
- 检查 Notion Integration 权限
- 查看 Actions 日志中的错误信息

### 没有自动提交
- 检查 GitHub Token 权限
- 确认 workflow 有写入权限

### 定时任务不执行
- GitHub Actions 的免费账户可能有执行限制
- 可以手动触发或使用其他 CI/CD 服务

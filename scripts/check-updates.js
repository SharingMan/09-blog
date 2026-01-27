const { Client } = require('@notionhq/client')
const fs = require('fs')
const path = require('path')

// 读取 .env.local 文件
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    content.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim()
          process.env[key.trim()] = value.replace(/^["']|["']$/g, '')
        }
      }
    })
  }
}

loadEnv()

function formatDatabaseId(id) {
  if (id.includes('-')) return id
  if (id.length === 32) {
    return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20, 32)}`
  }
  return id
}

async function checkUpdates() {
  const NOTION_TOKEN = process.env.NOTION_TOKEN
  let DATABASE_ID = process.env.NOTION_DATABASE_ID

  if (!NOTION_TOKEN || !DATABASE_ID) {
    console.error('❌ 请配置 NOTION_TOKEN 和 NOTION_DATABASE_ID 环境变量')
    process.exit(1)
  }

  DATABASE_ID = formatDatabaseId(DATABASE_ID)
  const notion = new Client({ auth: NOTION_TOKEN })

  // 读取同步状态
  const syncStateFile = path.join(__dirname, '..', '.notion-sync-state.json')
  let syncState = { lastSyncTime: new Date(0).toISOString(), syncedPages: {} }
  if (fs.existsSync(syncStateFile)) {
    syncState = JSON.parse(fs.readFileSync(syncStateFile, 'utf-8'))
  }

  const lastSyncTime = new Date(syncState.lastSyncTime)
  console.log(`📅 最后同步时间: ${lastSyncTime.toLocaleString('zh-CN')}`)
  console.log(`📚 已同步文章数: ${Object.keys(syncState.syncedPages).length}\n`)

  try {
    // 搜索所有页面
    const searchResponse = await notion.search({
      filter: {
        property: 'object',
        value: 'page',
      },
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time',
      },
    })

    // 过滤出属于该数据库的页面
    const pages = searchResponse.results.filter((page) => {
      const parent = page.parent
      if (!parent) return false
      if (parent.type === 'database_id' && parent.database_id === DATABASE_ID) {
        return true
      }
      if (parent.database_id === DATABASE_ID) {
        return true
      }
      return false
    })

    console.log(`🔍 在 Notion 数据库中找到 ${pages.length} 个页面\n`)

    // 检查更新
    const newPages = []
    const updatedPages = []
    const unchangedPages = []

    for (const page of pages) {
      const pageAny = page
      const pageId = pageAny.id
      const lastEditedTime = new Date(pageAny.last_edited_time)
      const isSynced = syncState.syncedPages[pageId]
      const properties = pageAny.properties || {}

      // 获取标题
      let title = '未命名'
      const titleKeys = ['标题', 'Title', 'title', 'Name', 'name']
      for (const key of titleKeys) {
        const prop = properties[key]
        if (prop?.type === 'title' && prop.title?.[0]?.plain_text) {
          title = prop.title[0].plain_text
          break
        }
      }

      if (!isSynced) {
        newPages.push({ id: pageId, title, lastEditedTime })
      } else if (lastEditedTime > lastSyncTime) {
        updatedPages.push({ id: pageId, title, lastEditedTime })
      } else {
        unchangedPages.push({ id: pageId, title, lastEditedTime })
      }
    }

    // 输出结果
    console.log('📊 检查结果:\n')
    
    if (newPages.length > 0) {
      console.log(`✨ 新文章 (${newPages.length}):`)
      newPages.forEach((page, index) => {
        console.log(`   ${index + 1}. ${page.title}`)
        console.log(`      编辑时间: ${page.lastEditedTime.toLocaleString('zh-CN')}`)
      })
      console.log('')
    } else {
      console.log('✨ 新文章: 无\n')
    }

    if (updatedPages.length > 0) {
      console.log(`🔄 已更新文章 (${updatedPages.length}):`)
      updatedPages.forEach((page, index) => {
        console.log(`   ${index + 1}. ${page.title}`)
        console.log(`      编辑时间: ${page.lastEditedTime.toLocaleString('zh-CN')}`)
      })
      console.log('')
    } else {
      console.log('🔄 已更新文章: 无\n')
    }

    console.log(`✅ 未更改文章: ${unchangedPages.length}\n`)

    const totalUpdates = newPages.length + updatedPages.length
    if (totalUpdates > 0) {
      console.log(`\n💡 提示: 运行同步命令来更新文章:`)
      console.log(`   npm run sync:notion`)
      console.log(`   或访问: http://localhost:3000/api/notion/sync`)
    } else {
      console.log('✅ 所有文章都是最新的！')
    }

  } catch (error) {
    console.error('❌ 检查失败:', error.message)
    process.exit(1)
  }
}

checkUpdates()

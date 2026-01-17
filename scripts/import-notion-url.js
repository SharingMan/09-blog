#!/usr/bin/env node

/**
 * 从 Notion 公开页面 URL 导入工具
 * 
 * 使用方法：
 * node scripts/import-notion-url.js <Notion公开页面URL> [选项]
 * 
 * 注意：此工具会引导您使用 Notion 导出功能，因为直接解析公开页面不稳定
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=========================================');
console.log('Notion 公开页面导入工具');
console.log('=========================================');
console.log('');

// 解析命令行参数
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log('使用方法:');
  console.log('  node scripts/import-notion-url.js <Notion公开页面URL> [选项]');
  console.log('');
  console.log('选项:');
  console.log('  --title "标题"');
  console.log('  --date "2025-01-17"');
  console.log('  --category "分类"');
  console.log('  --tags "标签1,标签2"');
  console.log('');
  console.log('示例:');
  console.log('  node scripts/import-notion-url.js "https://pine-parrot-996.notion.site/39-xxx"');
  console.log('');
  console.log('注意：');
  console.log('  由于 Notion 公开页面的结构复杂，推荐使用导出方式：');
  console.log('  1. 在 Notion 中打开页面');
  console.log('  2. 点击 "..." → "Export" → 选择 "Markdown"');
  console.log('  3. 下载文件后使用：node scripts/import-notion.js <文件路径>');
  process.exit(1);
}

const url = args[0];
console.log(`Notion 页面 URL: ${url}`);
console.log('');

// 提取页面 ID（用于后续可能的 API 调用）
const pageIdMatch = url.match(/([a-f0-9]{32})/);
const pageId = pageIdMatch ? pageIdMatch[1] : null;

console.log('📋 推荐导入方法：');
console.log('');
console.log('方法 1：使用 Notion 导出功能（最可靠）');
console.log('----------------------------------------');
console.log('1. 在浏览器中打开上面的 Notion 页面');
console.log('2. 点击右上角 "..." → "Export"');
console.log('3. 选择格式：Markdown & CSV → Markdown');
console.log('4. 点击 "Export" 下载文件');
console.log('5. 运行导入命令：');
console.log('');
console.log('   node scripts/import-notion.js ~/Downloads/导出的文件.md');
console.log('');

if (pageId) {
  console.log('方法 2：使用 Notion API（需要配置）');
  console.log('----------------------------------------');
  console.log('1. 创建 Notion Integration：https://www.notion.so/my-integrations');
  console.log('2. 获取 Integration Token');
  console.log('3. 分享页面给 Integration');
  console.log('4. 配置环境变量后运行：');
  console.log('');
  console.log('   node scripts/notion-sync.js');
  console.log('');
}

console.log('方法 3：手动复制内容');
console.log('----------------------------------------');
console.log('1. 在 Notion 页面中全选内容（Cmd+A）');
console.log('2. 复制（Cmd+C）');
console.log('3. 粘贴到新的 Markdown 文件');
console.log('4. 保存后使用导入工具');
console.log('');

console.log('💡 提示：');
console.log('   - 导出方式可以保留完整的格式和图片');
console.log('   - 图片会自动处理并复制到正确位置');
console.log('   - 推荐使用方法 1（导出方式）');
console.log('');

// 如果用户提供了其他参数，提示可以使用
const hasOptions = args.some(arg => arg.startsWith('--'));
if (hasOptions) {
  console.log('检测到您提供了额外参数，这些参数可以在导出后使用：');
  const options = args.slice(1).filter(arg => arg.startsWith('--'));
  options.forEach(opt => console.log(`  ${opt}`));
  console.log('');
  console.log('示例完整命令：');
  console.log(`  node scripts/import-notion.js ~/Downloads/文件.md ${options.join(' ')}`);
}

console.log('=========================================');

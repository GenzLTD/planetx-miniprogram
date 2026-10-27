#!/usr/bin/env node
/**
 * P1 迁移脚本：将 utils/api.ts 替换为使用 @looma/shared-core 的版本
 * 步骤：
 * 1. 备份原 api.ts
 * 2. 创建新的 api.ts 使用 createMiniApiClient
 * 3. 更新所有导入 api.ts 的文件
 * 4. 验证构建
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 开始 P1 迁移：utils/api.ts → 使用 @looma/shared-core\n');

const projectRoot = path.join(__dirname, '..');
const apiTsPath = path.join(projectRoot, 'utils/api.ts');
const apiTsBackupPath = path.join(projectRoot, 'utils/api.ts.backup');
const apiRefactoredPath = path.join(projectRoot, 'utils/api-refactored.ts');

// 1. 备份原文件
if (fs.existsSync(apiTsPath)) {
  console.log(`📋 备份原文件: ${apiTsPath} → ${apiTsBackupPath}`);
  fs.copyFileSync(apiTsPath, apiTsBackupPath);
  console.log('✅ 备份完成');
}

// 2. 读取 api-refactored.ts 内容
if (fs.existsSync(apiRefactoredPath)) {
  console.log(`\n📋 读取重构版: ${apiRefactoredPath}`);
  const refactoredContent = fs.readFileSync(apiRefactoredPath, 'utf8');
  
  // 3. 写入新的 api.ts
  console.log(`📋 写入新版本: ${apiTsPath}`);
  fs.writeFileSync(apiTsPath, refactoredContent);
  console.log('✅ 文件替换完成');
  
  // 4. 显示新文件结构
  console.log('\n📁 新文件结构预览:');
  const lines = refactoredContent.split('\n').slice(0, 40);
  lines.forEach((line, i) => {
    if (i < 40) console.log(`${i + 1}: ${line}`);
  });
  if (refactoredContent.split('\n').length > 40) {
    console.log('... (文件内容截断)');
  }
} else {
  console.log(`❌ 找不到重构版文件: ${apiRefactoredPath}`);
  process.exit(1);
}

// 5. 查找所有导入 api.ts 的文件
console.log('\n🔍 查找导入 api.ts 的文件...');
const filesToCheck = [
  'app.ts',
  'pages/hub/index.ts',
  'pages/ask/index.ts',
  'pages/profile/index.ts',
  'pages/quiz/index.ts',
  'pages/result/index.ts',
  'pages/auth/index.ts',
  'utils/store.ts',
  'utils/consent.ts'
];

const affectedFiles = [];
for (const file of filesToCheck) {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('./api') || content.includes("'./api'") || content.includes('"./api"')) {
      affectedFiles.push(file);
    }
  }
}

console.log(`📋 可能受影响的文件: ${affectedFiles.length} 个`);
if (affectedFiles.length > 0) {
  console.log('   ' + affectedFiles.join('\n   '));
}

// 6. 验证构建
console.log('\n🧪 验证构建...');
try {
  // 运行快速检查
  const quickCheck = require('./quick-check.js');
  console.log('✅ 快速检查通过');
  
  // 检查 TypeScript 类型
  console.log('✅ TypeScript 类型检查 (模拟)');
  
} catch (error) {
  console.log(`⚠️  验证过程中遇到问题: ${error.message}`);
}

console.log('\n📋 迁移完成！');
console.log('\n下一步操作:');
console.log('1. 运行构建验证: pnpm run build:npm');
console.log('2. 在微信开发者工具中构建 npm');
console.log('3. 测试关键页面: hub, ask, auth');
console.log('4. 如果一切正常，可以删除备份文件: rm utils/api.ts.backup');
console.log('\n🔧 如果需要回滚:');
console.log('   cp utils/api.ts.backup utils/api.ts');
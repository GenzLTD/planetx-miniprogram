#!/usr/bin/env node
/**
 * 微信开发者工具 npm 构建验证脚本
 * 检查构建状态并提供解决方案
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 微信开发者工具 npm 构建问题诊断\n');

const projectRoot = path.join(__dirname, '..');

// 检查可能的构建目录
const possibleDirs = [
  'miniprogram_npm',
  'npm_modules', 
  'node_modules'
];

console.log('📁 检查构建目录:');
let foundDir = null;
for (const dir of possibleDirs) {
  const dirPath = path.join(projectRoot, dir, '@looma/shared-core');
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    console.log(`✅ ${dir}/@looma/shared-core 存在 (${files.length} 个文件)`);
    if (files.length > 0) {
      foundDir = dir;
      console.log(`   包含文件: ${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`);
    }
  } else {
    console.log(`❌ ${dir}/@looma/shared-core 不存在`);
  }
}

// 检查 project.config.json 配置
console.log('\n⚙️  检查项目配置:');
try {
  const configPath = path.join(projectRoot, 'project.config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  console.log(`✅ project.config.json 读取成功`);
  console.log(`   📋 nodeModules: ${config.setting?.nodeModules || false}`);
  console.log(`   📋 packNpmManually: ${config.setting?.packNpmManually || false}`);
  
  if (config.setting?.packNpmRelationList && config.setting.packNpmRelationList.length > 0) {
    const relation = config.setting.packNpmRelationList[0];
    console.log(`   📋 packageJsonPath: ${relation.packageJsonPath}`);
    console.log(`   📋 miniprogramNpmDistDir: ${relation.miniprogramNpmDistDir}`);
    
    // 检查 miniprogramNpmDistDir 配置
    if (relation.miniprogramNpmDistDir === './') {
      console.log(`   ⚠️  miniprogramNpmDistDir 设置为 "./"，微信开发者工具可能生成 miniprogram_npm 目录`);
    }
  }
} catch (error) {
  console.log(`❌ 配置读取失败: ${error.message}`);
}

// 检查微信开发者工具常见问题
console.log('\n🔧 常见问题诊断:');

// 1. 检查是否有构建产物
const sharedCoreBuildPath = path.join(projectRoot, '../shared-core/dist/mini/index.js');
if (fs.existsSync(sharedCoreBuildPath)) {
  const stats = fs.statSync(sharedCoreBuildPath);
  const sizeKB = Math.round(stats.size / 1024 * 10) / 10;
  console.log(`✅ shared-core 构建产物存在 (${sizeKB} KB)`);
} else {
  console.log(`❌ shared-core 构建产物不存在`);
  console.log(`   请运行: pnpm --filter @looma/shared-core build:mini`);
}

// 2. 检查 npm 构建是否成功
console.log('\n📦 解决方案:');

if (!foundDir) {
  console.log('❌ 未找到 npm 构建目录，请尝试以下步骤:');
  console.log('\n1. 在微信开发者工具中:');
  console.log('   a. 确保项目已正确导入');
  console.log('   b. 点击"工具" → "构建 npm"');
  console.log('   c. 查看控制台是否有构建成功的提示');
  
  console.log('\n2. 如果构建失败，尝试:');
  console.log('   a. 关闭微信开发者工具重新打开');
  console.log('   b. 清除缓存: 工具 → 清除缓存 → 全部清除');
  console.log('   c. 重新导入项目');
  
  console.log('\n3. 手动复制构建产物:');
  console.log('   mkdir -p miniprogram_npm/@looma/shared-core');
  console.log('   cp -r npm_modules/@looma/shared-core/* miniprogram_npm/@looma/shared-core/');
  
  console.log('\n4. 修改 project.config.json:');
  console.log('   将 miniprogramNpmDistDir 从 "./" 改为 "./miniprogram_npm"');
} else {
  console.log(`✅ 构建目录已找到: ${foundDir}`);
  console.log('\n建议修改 project.config.json 配置:');
  console.log('将 miniprogramNpmDistDir 从 "./" 改为 `"./${foundDir}"`');
}

console.log('\n📋 快速修复命令:');
console.log('1. 创建 miniprogram_npm 目录并复制构建产物:');
console.log('   mkdir -p miniprogram_npm/@looma/shared-core && cp -r npm_modules/@looma/shared-core/* miniprogram_npm/@looma/shared-core/ 2>/dev/null || echo "复制失败，请检查源文件"');
console.log('\n2. 修改配置后重新构建:');
console.log('   在微信开发者工具中: 工具 → 构建 npm');
console.log('\n3. 验证构建:');
console.log('   ls -la miniprogram_npm/@looma/shared-core/');
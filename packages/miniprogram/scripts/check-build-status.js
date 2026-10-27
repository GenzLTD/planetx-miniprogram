#!/usr/bin/env node
/**
 * 微信开发者工具构建验证脚本
 * 快速检查构建状态和文件完整性
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 微信开发者工具构建验证\n');

const projectRoot = path.join(__dirname, '..');

// 检查 dist/mini/index.js
const miniBundlePath = path.join(projectRoot, '../shared-core/dist/mini/index.js');
try {
  const stats = fs.statSync(miniBundlePath);
  const sizeKB = Math.round(stats.size / 1024 * 10) / 10;
  console.log(`✅ Mini bundle 存在: ${miniBundlePath}`);
  console.log(`   📦 大小: ${sizeKB} KB`);
} catch (error) {
  console.log(`❌ Mini bundle 不存在: ${miniBundlePath}`);
  console.log(`   请运行: pnpm --filter @looma/shared-core build:mini`);
  process.exit(1);
}

// 检查 miniprogram_npm 目录
const npmDir = path.join(projectRoot, 'miniprogram_npm/@looma/shared-core');
try {
  const files = fs.readdirSync(npmDir);
  console.log(`\n✅ npm 构建目录存在: ${npmDir}`);
  console.log(`   📁 包含文件: ${files.join(', ')}`);
  
  // 检查关键文件
  const requiredFiles = ['index.js', 'package.json'];
  for (const file of requiredFiles) {
    const filePath = path.join(npmDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024 * 10) / 10;
      console.log(`   ✅ ${file}: ${sizeKB} KB`);
    } else {
      console.log(`   ❌ ${file}: 缺失`);
    }
  }
  
  // 检查是否是手动创建的
  const createScript = path.join(__dirname, 'create-miniprogram-npm.js');
  if (fs.existsSync(createScript)) {
    console.log(`   🔧 检测到手动创建脚本，如需重新创建请运行: node scripts/create-miniprogram-npm.js`);
  }
} catch (error) {
  console.log(`\n❌ npm 构建目录不存在: ${npmDir}`);
  console.log(`   请运行: node scripts/create-miniprogram-npm.js (手动创建)`);
  console.log(`   或在微信开发者工具中执行: 工具 → 构建 npm`);
}

// 检查 project.config.json
const projectConfigPath = path.join(projectRoot, 'project.config.json');
try {
  const config = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
  console.log(`\n✅ project.config.json 配置检查:`);
  console.log(`   📋 nodeModules: ${config.setting?.nodeModules || false}`);
  console.log(`   📋 packNpmManually: ${config.setting?.packNpmManually || false}`);
  
  if (config.setting?.nodeModules === true && config.setting?.packNpmManually === true) {
    console.log(`   ✅ 配置正确`);
  } else {
    console.log(`   ⚠️  配置需要调整`);
  }
} catch (error) {
  console.log(`\n❌ 无法读取 project.config.json: ${error.message}`);
}

// 检查 package.json 依赖
const packageJsonPath = path.join(projectRoot, 'package.json');
try {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log(`\n✅ package.json 依赖检查:`);
  
  if (pkg.dependencies && pkg.dependencies['@looma/shared-core']) {
    console.log(`   📦 @looma/shared-core: ${pkg.dependencies['@looma/shared-core']}`);
    if (pkg.dependencies['@looma/shared-core'] === 'workspace:*') {
      console.log(`   ✅ 依赖配置正确 (workspace)`);
    }
  } else {
    console.log(`   ❌ @looma/shared-core 依赖缺失`);
  }
  
  if (pkg.scripts && pkg.scripts['build:npm']) {
    console.log(`   🔧 build:npm 脚本: ${pkg.scripts['build:npm']}`);
  }
} catch (error) {
  console.log(`\n❌ 无法读取 package.json: ${error.message}`);
}

console.log('\n📋 验证完成');
console.log('\n下一步操作:');
console.log('1. 打开微信开发者工具');
console.log('2. 导入项目: packages/miniprogram');
console.log('3. 详情 → 本地设置 → 勾选"不校验合法域名"');
console.log('4. 工具 → 构建 npm');
console.log('5. 编译测试 hub/ask/result 页面');
console.log('\n完成后再次运行此脚本查看详细状态');
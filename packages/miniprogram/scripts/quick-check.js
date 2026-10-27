#!/usr/bin/env node
/**
 * 快速检查 npm 构建状态
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 快速构建状态检查\n');

const projectRoot = path.join(__dirname, '..');

// 1. 检查 miniprogram_npm 目录
const npmDir = path.join(projectRoot, 'miniprogram_npm/@looma/shared-core');
const hasNpmDir = fs.existsSync(npmDir);

if (hasNpmDir) {
  console.log('✅ miniprogram_npm 目录存在');
  
  const files = fs.readdirSync(npmDir);
  const hasIndexJs = files.includes('index.js');
  const hasPackageJson = files.includes('package.json');
  
  if (hasIndexJs && hasPackageJson) {
    const indexJsSize = Math.round(fs.statSync(path.join(npmDir, 'index.js')).size / 1024 * 10) / 10;
    console.log(`   📦 index.js: ${indexJsSize} KB`);
    console.log(`   📦 package.json: 存在`);
    
    // 检查 package.json 内容
    const pkg = JSON.parse(fs.readFileSync(path.join(npmDir, 'package.json'), 'utf8'));
    console.log(`   📦 包名: ${pkg.name}`);
    console.log(`   📦 版本: ${pkg.version}`);
    console.log(`   📦 miniprogram 字段: ${pkg.miniprogram || '未设置'}`);
  } else {
    console.log('❌ 关键文件缺失');
    if (!hasIndexJs) console.log('   ❌ index.js 缺失');
    if (!hasPackageJson) console.log('   ❌ package.json 缺失');
  }
} else {
  console.log('❌ miniprogram_npm 目录不存在');
  console.log('   运行: node scripts/create-miniprogram-npm.js');
}

// 2. 检查共享核心构建
const miniBundlePath = path.join(projectRoot, '../shared-core/dist/mini/index.js');
const hasMiniBundle = fs.existsSync(miniBundlePath);

if (hasMiniBundle) {
  const size = Math.round(fs.statSync(miniBundlePath).size / 1024 * 10) / 10;
  console.log(`\n✅ shared-core mini bundle 存在: ${size} KB`);
} else {
  console.log('\n❌ shared-core mini bundle 不存在');
  console.log('   运行: pnpm --filter @looma/shared-core build:mini');
}

// 3. 检查配置
const configPath = path.join(projectRoot, 'project.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const hasNpmConfig = config.setting?.nodeModules === true && config.setting?.packNpmManually === true;

console.log(`\n✅ 项目配置检查:`);
console.log(`   📋 nodeModules: ${config.setting?.nodeModules || false}`);
console.log(`   📋 packNpmManually: ${config.setting?.packNpmManually || false}`);
console.log(`   📋 miniprogramNpmDistDir: ${config.setting?.packNpmRelationList?.[0]?.miniprogramNpmDistDir || '未设置'}`);

if (hasNpmConfig) {
  console.log('   ✅ 配置正确');
} else {
  console.log('   ⚠️  配置需要调整');
}

// 总结
console.log('\n📋 总结:');

if (hasNpmDir && hasMiniBundle && hasNpmConfig) {
  console.log('🎉 所有检查通过！现在可以在微信开发者工具中构建 npm');
  console.log('\n下一步操作:');
  console.log('1. 打开微信开发者工具');
  console.log('2. 导入项目');
  console.log('3. 工具 → 构建 npm');
  console.log('4. 访问核心功能页面: pages/hub/index');
} else {
  console.log('⚠️  需要修复以下问题:');
  if (!hasNpmDir) console.log('   - miniprogram_npm 目录不存在');
  if (!hasMiniBundle) console.log('   - shared-core 未构建');
  if (!hasNpmConfig) console.log('   - 项目配置需要调整');
  
  console.log('\n修复命令:');
  console.log('   构建 shared-core: pnpm --filter @looma/shared-core build:mini');
  console.log('   创建 npm 目录: node scripts/create-miniprogram-npm.js');
}
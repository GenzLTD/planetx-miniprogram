#!/usr/bin/env node
/**
 * 手动创建 miniprogram_npm 目录结构
 * 用于解决微信开发者工具构建 npm 问题
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 创建 miniprogram_npm 目录结构\n');

const projectRoot = path.join(__dirname, '..');
const miniprogramNpmDir = path.join(projectRoot, 'miniprogram_npm');
const sharedCoreNpmDir = path.join(miniprogramNpmDir, '@looma/shared-core');

// 1. 确保 miniprogram_npm 目录存在
if (!fs.existsSync(miniprogramNpmDir)) {
  console.log(`📁 创建目录: ${miniprogramNpmDir}`);
  fs.mkdirSync(miniprogramNpmDir, { recursive: true });
}

// 2. 确保 @looma/shared-core 目录存在
if (!fs.existsSync(sharedCoreNpmDir)) {
  console.log(`📁 创建目录: ${sharedCoreNpmDir}`);
  fs.mkdirSync(sharedCoreNpmDir, { recursive: true });
}

// 3. 复制构建文件
const sourceDir = path.join(projectRoot, '../shared-core/dist/mini');
const sourceFiles = ['index.js', 'index.js.map', 'package.json'];

console.log(`📂 源目录: ${sourceDir}`);
console.log(`📂 目标目录: ${sharedCoreNpmDir}`);

for (const file of sourceFiles) {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(sharedCoreNpmDir, file);
  
  if (fs.existsSync(sourcePath)) {
    console.log(`📋 复制: ${file}`);
    fs.copyFileSync(sourcePath, targetPath);
    
    // 显示文件信息
    const stats = fs.statSync(targetPath);
    const sizeKB = Math.round(stats.size / 1024 * 10) / 10;
    console.log(`   📦 大小: ${sizeKB} KB`);
  } else {
    console.log(`⚠️  文件不存在: ${sourcePath}`);
  }
}

// 4. 创建 package.json（如果需要）
const targetPackageJsonPath = path.join(sharedCoreNpmDir, 'package.json');
if (fs.existsSync(targetPackageJsonPath)) {
  console.log(`\n✅ package.json 已复制`);
  
  // 读取并显示 package.json 内容
  try {
    const pkg = JSON.parse(fs.readFileSync(targetPackageJsonPath, 'utf8'));
    console.log(`   📦 名称: ${pkg.name || '未指定'}`);
    console.log(`   📦 版本: ${pkg.version || '未指定'}`);
    console.log(`   📦 miniprogram: ${pkg.miniprogram || '未指定'}`);
  } catch (error) {
    console.log(`   ⚠️  无法解析 package.json: ${error.message}`);
  }
} else {
  // 创建简单的 package.json
  console.log(`\n📝 创建 package.json`);
  const simplePackageJson = {
    name: "@looma/shared-core",
    version: "0.1.0",
    miniprogram: "."
  };
  fs.writeFileSync(targetPackageJsonPath, JSON.stringify(simplePackageJson, null, 2));
}

// 5. 验证目录结构
console.log('\n🔍 验证目录结构:');
const files = fs.readdirSync(sharedCoreNpmDir);
console.log(`   📁 文件列表: ${files.join(', ')}`);

// 6. 检查关键文件
console.log('\n✅ 关键文件检查:');
const requiredFiles = ['index.js', 'package.json'];
let allFilesExist = true;

for (const file of requiredFiles) {
  const filePath = path.join(sharedCoreNpmDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024 * 10) / 10;
    console.log(`   ✅ ${file}: ${sizeKB} KB`);
  } else {
    console.log(`   ❌ ${file}: 缺失`);
    allFilesExist = false;
  }
}

console.log('\n📋 完成！');

if (allFilesExist) {
  console.log('\n🎉 miniprogram_npm 目录结构已创建成功！');
  console.log('\n下一步操作:');
  console.log('1. 打开微信开发者工具');
  console.log('2. 工具 → 构建 npm (现在应该能成功)');
  console.log('3. 编译测试页面');
} else {
  console.log('\n⚠️  部分文件缺失，请检查构建状态');
  console.log('   运行: pnpm --filter @looma/shared-core build:mini');
}
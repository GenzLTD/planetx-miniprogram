#!/usr/bin/env node
/**
 * 修复微信开发者工具 npm 构建问题
 * 手动创建 miniprogram_npm 目录并复制构建产物
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 修复微信开发者工具 npm 构建问题\n');

const projectRoot = path.join(__dirname, '..');

// 创建 miniprogram_npm 目录
const targetDir = path.join(projectRoot, 'miniprogram_npm/@looma/shared-core');
try {
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  console.log(`✅ 创建目录: ${targetDir}`);
} catch (error) {
  console.log(`⚠️  目录可能已存在: ${error.message}`);
}

// 检查源文件
const sourceDir = path.join(projectRoot, '../shared-core/dist/mini');
if (!fs.existsSync(sourceDir)) {
  console.log(`❌ 源目录不存在: ${sourceDir}`);
  console.log(`   请先运行: pnpm --filter @looma/shared-core build:mini`);
  process.exit(1);
}

// 复制文件
console.log(`📁 复制构建产物从: ${sourceDir}`);
try {
  const files = fs.readdirSync(sourceDir);
  console.log(`   找到 ${files.length} 个文件: ${files.join(', ')}`);
  
  for (const file of files) {
    const sourceFile = path.join(sourceDir, file);
    const targetFile = path.join(targetDir, file);
    
    if (fs.statSync(sourceFile).isFile()) {
      fs.copyFileSync(sourceFile, targetFile);
      console.log(`   ✅ 复制: ${file}`);
    }
  }
  
  // 创建 package.json
  const packageJson = {
    "name": "@looma/shared-core",
    "version": "1.0.0",
    "main": "index.js",
    "types": "../node_modules/@looma/shared-core/src/entries/mini.ts"
  };
  
  fs.writeFileSync(
    path.join(targetDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  console.log(`   ✅ 创建 package.json`);
  
} catch (error) {
  console.log(`❌ 复制失败: ${error.message}`);
  process.exit(1);
}

// 验证结果
console.log('\n✅ 验证构建产物:');
try {
  const targetFiles = fs.readdirSync(targetDir);
  console.log(`   构建产物目录包含: ${targetFiles.join(', ')}`);
  
  // 检查关键文件
  const requiredFiles = ['index.js', 'index.js.map', 'package.json'];
  let allExist = true;
  for (const file of requiredFiles) {
    if (fs.existsSync(path.join(targetDir, file))) {
      console.log(`   ✅ ${file} 存在`);
    } else {
      console.log(`   ❌ ${file} 缺失`);
      allExist = false;
    }
  }
  
  if (allExist) {
    console.log('\n🎉 所有构建产物准备就绪！');
    console.log('\n📋 下一步操作:');
    console.log('1. 重新打开微信开发者工具');
    console.log('2. 点击"工具" → "构建 npm"');
    console.log('3. 检查 miniprogram_npm/@looma/shared-core 目录');
    console.log('4. 编译测试页面');
  } else {
    console.log('\n⚠️  部分文件缺失，请手动检查');
  }
  
} catch (error) {
  console.log(`❌ 验证失败: ${error.message}`);
}

console.log('\n🔧 备用方案（如果微信开发者工具仍然无法构建）:');
console.log('1. 删除 miniprogram_npm 目录: rm -rf miniprogram_npm');
console.log('2. 关闭微信开发者工具');
console.log('3. 重新打开项目');
console.log('4. 点击"工具" → "构建 npm"');
console.log('5. 如果仍然失败，尝试手动创建 symlink:');
console.log('   ln -sf ../shared-core/dist/mini miniprogram_npm/@looma/shared-core');
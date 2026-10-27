#!/usr/bin/env node

/**
 * 将 shared-core 的构建产物复制到小程序 npm_modules 目录
 * 用于小程序 npm 构建
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 项目根目录
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const SHARED_CORE_DIR = path.join(PROJECT_ROOT, 'packages/shared-core');
const MINIPROGRAM_DIR = path.join(PROJECT_ROOT, 'packages/miniprogram');

// 目标目录：小程序 npm_modules/@looma/shared-core
const TARGET_DIR = path.join(MINIPROGRAM_DIR, 'npm_modules/@looma/shared-core');

// 确保目标目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 复制文件
function copyFile(src, dest) {
  if (fs.existsSync(src)) {
    console.log(`Copying ${path.relative(SHARED_CORE_DIR, src)} → ${path.relative(MINIPROGRAM_DIR, dest)}`);
    const destDir = path.dirname(dest);
    ensureDir(destDir);
    fs.copyFileSync(src, dest);
  }
}

// 复制目录
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  
  ensureDir(dest);
  const items = fs.readdirSync(src, { withFileTypes: true });
  
  for (const item of items) {
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);
    
    if (item.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

// 清理目标目录
function cleanTargetDir() {
  if (fs.existsSync(TARGET_DIR)) {
    console.log(`Cleaning ${path.relative(MINIPROGRAM_DIR, TARGET_DIR)}`);
    fs.rmSync(TARGET_DIR, { recursive: true, force: true });
  }
}

// 主要复制逻辑
function copyBuildOutput() {
  console.log('🚀 开始复制 shared-core 构建产物到小程序目录...');
  
  // 1. 清理目标目录
  cleanTargetDir();
  
  // 2. 确保目标目录存在
  ensureDir(TARGET_DIR);
  
  // 3. 复制 package.json
  const srcPackageJson = path.join(SHARED_CORE_DIR, 'package.json');
  const destPackageJson = path.join(TARGET_DIR, 'package.json');
  copyFile(srcPackageJson, destPackageJson);
  
  // 4. 复制构建产物（小程序专用版本）
  const srcDistDir = path.join(SHARED_CORE_DIR, 'dist/mini');
  const destDistDir = path.join(TARGET_DIR);
  
  if (fs.existsSync(srcDistDir)) {
    console.log(`Copying build output from ${path.relative(SHARED_CORE_DIR, srcDistDir)}`);
    
    // 复制 JS 文件
    const jsFiles = fs.readdirSync(srcDistDir).filter(file => 
      file.endsWith('.js') || file.endsWith('.d.ts')
    );
    
    for (const file of jsFiles) {
      copyFile(
        path.join(srcDistDir, file),
        path.join(destDistDir, file)
      );
    }
    
    // 复制类型声明文件
    const typeDir = path.join(srcDistDir, 'types');
    if (fs.existsSync(typeDir)) {
      const destTypeDir = path.join(TARGET_DIR, 'types');
      copyDir(typeDir, destTypeDir);
    }
  } else {
    console.warn(`⚠️  构建产物目录不存在: ${srcDistDir}`);
    console.warn('请先运行: pnpm --filter @looma/shared-core build:mini');
  }
  
  // 5. 创建 index.js 作为入口点（如果需要）
  const indexPath = path.join(TARGET_DIR, 'index.js');
  if (!fs.existsSync(indexPath)) {
    console.log('Creating index.js entry point...');
    fs.writeFileSync(indexPath, `module.exports = require('./mini');\n`);
  }
  
  // 6. 确保有 index.d.ts 文件
  const typeIndexPath = path.join(TARGET_DIR, 'index.d.ts');
  if (!fs.existsSync(typeIndexPath)) {
    const miniDtsPath = path.join(TARGET_DIR, 'mini.d.ts');
    if (fs.existsSync(miniDtsPath)) {
      console.log('Creating index.d.ts from mini.d.ts...');
      const content = fs.readFileSync(miniDtsPath, 'utf8');
      fs.writeFileSync(typeIndexPath, content);
    }
  }
  
  console.log('✅ 复制完成！');
  console.log(`📦 构建产物已复制到: ${path.relative(PROJECT_ROOT, TARGET_DIR)}`);
  
  // 7. 显示目录结构
  console.log('\n📁 目标目录结构:');
  function printDir(dir, indent = 0) {
    const prefix = ' '.repeat(indent * 2);
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      console.log(`${prefix}├── ${item.name}`);
      if (item.isDirectory() && !item.name.startsWith('.')) {
        printDir(path.join(dir, item.name), indent + 1);
      }
    }
  }
  
  if (fs.existsSync(TARGET_DIR)) {
    printDir(TARGET_DIR);
  }
}

// 主函数
function main() {
  try {
    console.log('📦 构建小程序 npm 包...');
    console.log(`📁 Shared-core: ${SHARED_CORE_DIR}`);
    console.log(`📁 Miniprogram: ${MINIPROGRAM_DIR}`);
    
    // 先构建 shared-core 的小程序版本
    console.log('\n🔨 构建 shared-core (mini 版本)...');
    execSync('pnpm --filter @looma/shared-core build:mini', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });
    
    // 复制构建产物
    copyBuildOutput();
    
    console.log('\n🎉 小程序 npm 包准备完成！');
    console.log('接下来请在微信开发者工具中执行以下步骤：');
    console.log('1. 点击"工具" → "构建 npm"');
    console.log('2. 或使用命令行: npm run build:npm');
    console.log('3. 重启小程序开发者工具');
    
  } catch (error) {
    console.error('❌ 构建失败:', error.message);
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { copyBuildOutput };
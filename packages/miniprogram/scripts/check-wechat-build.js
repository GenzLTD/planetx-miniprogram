#!/usr/bin/env node

/**
 * 检查微信开发者工具构建 npm 后的结果
 * 验证 miniprogram_npm 目录结构
 */

const fs = require('fs');
const path = require('path');

const MINIPROGRAM_DIR = __dirname;
const MINIPROGRAM_NPM_DIR = path.join(MINIPROGRAM_DIR, 'miniprogram_npm');
const SHARED_CORE_NPM_DIR = path.join(MINIPROGRAM_NPM_DIR, '@looma/shared-core');
const NODE_MODULES_DIR = path.join(MINIPROGRAM_DIR, 'node_modules/@looma/shared-core');

function main() {
  console.log('🔍 检查微信开发者工具 npm 构建状态\n');
  
  // 1. 检查 miniprogram_npm 目录是否存在
  if (!fs.existsSync(MINIPROGRAM_NPM_DIR)) {
    console.log('❌ miniprogram_npm 目录不存在');
    console.log('   请运行: 微信开发者工具 → 工具 → 构建 npm');
    return 1;
  }
  
  console.log('✅ miniprogram_npm 目录存在');
  
  // 2. 检查 @looma/shared-core 目录是否存在
  if (!fs.existsSync(SHARED_CORE_NPM_DIR)) {
    console.log('❌ miniprogram_npm/@looma/shared-core 目录不存在');
    console.log('   可能的原因:');
    console.log('   1. 未构建 npm - 点击"构建 npm"按钮');
    console.log('   2. package.json 中未配置 miniprogram 字段');
    console.log('   3. 未安装依赖 - 在前端根目录运行: pnpm install');
    return 1;
  }
  
  console.log('✅ miniprogram_npm/@looma/shared-core 目录存在');
  
  // 3. 检查 package.json 中的 miniprogram 字段
  const pkgPath = path.join(NODE_MODULES_DIR, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (!pkg.miniprogram) {
      console.log('⚠️  node_modules/@looma/shared-core/package.json 缺少 miniprogram 字段');
      console.log('   需要添加: "miniprogram": "dist/mini/index.js"');
    } else {
      console.log(`✅ package.json miniprogram 字段: ${pkg.miniprogram}`);
    }
  }
  
  // 4. 检查 dist/mini/index.js 是否存在
  const distPath = path.join(NODE_MODULES_DIR, pkg?.miniprogram || 'dist/mini/index.js');
  if (fs.existsSync(distPath)) {
    const stat = fs.statSync(distPath);
    console.log(`✅ dist/mini/index.js 存在 (${(stat.size / 1024).toFixed(1)} KB)`);
  } else {
    console.log('❌ dist/mini/index.js 不存在');
    console.log('   运行: cd frontend && pnpm --filter @looma/shared-core build:mini');
  }
  
  // 5. 检查 miniprogram_npm 中的文件
  const files = fs.readdirSync(SHARED_CORE_NPM_DIR);
  console.log(`\n📦 miniprogram_npm/@looma/shared-core 内容:`);
  files.forEach(file => {
    const filePath = path.join(SHARED_CORE_NPM_DIR, file);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      console.log(`   📄 ${file} (${(stat.size / 1024).toFixed(1)} KB)`);
    } else {
      console.log(`   📁 ${file}/`);
    }
  });
  
  // 6. 验证 bundle 是否包含 Web API
  if (files.includes('index.js')) {
    const bundlePath = path.join(SHARED_CORE_NPM_DIR, 'index.js');
    const js = fs.readFileSync(bundlePath, 'utf8');
    const forbidden = ["fetch(", "localStorage", "ReadableStream", "FormData(", "AbortController"];
    const hits = forbidden.filter((t) => js.includes(t));
    if (hits.length === 0) {
      console.log('\n✅ Bundle 检查: 无 Web API 污染');
    } else {
      console.log(`\n❌ Bundle 包含 Web API: ${hits.join(', ')}`);
    }
  }
  
  console.log('\n📋 下一步操作:');
  console.log('1. 确认微信开发者工具 → 详情 → 本地设置 → "不校验合法域名" 已勾选');
  console.log('2. 编译项目并启动模拟器');
  console.log('3. 打开 hub / ask / result 页面');
  console.log('4. 检查控制台是否有 "module \'@looma/shared-core\' is not defined" 错误');
  console.log('\n🔧 如果构建失败:');
  console.log('- 删除 miniprogram_npm 目录');
  console.log('- 在微信开发者工具中重新构建 npm');
  console.log('- 重启开发者工具');
  
  return 0;
}

if (require.main === module) {
  try {
    const exitCode = main();
    process.exit(exitCode);
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    process.exit(1);
  }
}
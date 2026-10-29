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
// 微信开发者工具「构建 npm」的输入源（miniprogramNpmDistDir = "./"），
// workspace:* 依赖无法被开发者工具解析，这里用构建产物伪造一份
const nodeModulesDir = path.join(projectRoot, 'node_modules/@looma/shared-core');

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

if (!fs.existsSync(path.join(sourceDir, 'index.js'))) {
  console.log('❌ 未找到 mini bundle，请先运行: node ../shared-core/scripts/build-mini.mjs');
  process.exit(1);
}

// ⚠️ pnpm 下 node_modules/@looma/shared-core 是指向源码包的符号链接，
// 直接写入会把产物覆盖进源码目录（真实事故：package.json 被产物版覆盖）。
// workspace 包本身就能被 tsc/运行时解析，此时跳过 node_modules 复制。
let targets = [sharedCoreNpmDir];
try {
  const realNodeModules = fs.realpathSync(nodeModulesDir);
  const realSource = fs.realpathSync(path.join(projectRoot, '../shared-core'));
  if (realNodeModules !== realSource) {
    targets.push(nodeModulesDir);
  } else {
    console.log('\n🔗 node_modules/@looma/shared-core 是 workspace 符号链接，跳过（防止覆盖源码）');
  }
} catch {
  targets.push(nodeModulesDir);
}

for (const targetDir of targets) {
  console.log(`📂 目标目录: ${targetDir}`);
  fs.mkdirSync(targetDir, { recursive: true });

  for (const file of sourceFiles) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);

      const stats = fs.statSync(targetPath);
      const sizeKB = Math.round(stats.size / 1024 * 10) / 10;
      console.log(`   📋 ${file} (${sizeKB} KB)`);
    } else {
      console.log(`   ⚠️  缺失: ${sourcePath}`);
    }
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

// 4.5 复制 @vant/weapp（dist 即小程序运行时产物，见其 package.json 的 miniprogram 字段）
const vantNpmDir = path.join(miniprogramNpmDir, '@vant/weapp');
const vantSource = path.join(projectRoot, 'node_modules/@vant/weapp/dist');
if (fs.existsSync(vantSource)) {
  console.log(`\n📦 复制 @vant/weapp: ${vantSource}`);
  fs.mkdirSync(vantNpmDir, { recursive: true });
  fs.cpSync(vantSource, vantNpmDir, { recursive: true, dereference: true });
  const vantVersion = JSON.parse(
    fs.readFileSync(path.join(projectRoot, 'node_modules/@vant/weapp/package.json'), 'utf8')
  ).version;
  fs.writeFileSync(
    path.join(vantNpmDir, 'package.json'),
    JSON.stringify({ name: '@vant/weapp', version: vantVersion, miniprogram: '.' }, null, 2)
  );
  console.log(`   📋 @vant/weapp@${vantVersion} → miniprogram_npm/@vant/weapp`);
} else {
  console.log(`\n⚠️  未找到 @vant/weapp，跳过（先 pnpm install）`);
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
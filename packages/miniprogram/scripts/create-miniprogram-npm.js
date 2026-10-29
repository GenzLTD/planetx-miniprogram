#!/usr/bin/env node
/**
 * 手动创建 miniprogram_npm 目录结构
 * 用于解决微信开发者工具构建 npm 问题
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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

// 4.6 对拍哈希
// 口径由本脚本统一，两台机器跑同一条命令取同一个数，禁止各自用 shell 命令另算
// （不同 shell 的排序 locale / 路径前缀 / 分隔符都会让同一棵树算出不同的值）。
// 算法：相对 POSIX 路径排序 → 每行 "<文件sha256>␣␣<相对路径>" → LF 连接 → 再取 sha256
function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function listRelativeFiles(dir) {
  const out = [];
  const walk = (current, rel) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(path.join(current, entry.name), relPath);
      else if (entry.isFile()) out.push(relPath);
    }
  };
  walk(dir, '');
  // 默认 UTF-16 码位排序，跨机一致；勿用 localeCompare（受 ICU/locale 影响）
  out.sort();
  return out;
}

function treeHash(dir) {
  const files = listRelativeFiles(dir);
  const lines = files.map((rel) => `${sha256(fs.readFileSync(path.join(dir, rel)))}  ${rel}`);
  return { hash: sha256(Buffer.from(lines.join('\n'), 'utf8')), files: files.length };
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

// 6.5 打印对拍哈希（四项里的 shared-core / vant 两项以后都从这两行取）
console.log('\n🔐 对拍哈希（口径统一于本脚本，勿用 shell 命令另算）:');
const vantTreeDir = path.join(miniprogramNpmDir, '@vant/weapp');
if (fs.existsSync(vantTreeDir)) {
  const vantTree = treeHash(vantTreeDir);
  console.log(`   @vant/weapp tree     : ${vantTree.hash}  (${vantTree.files} files)`);
} else {
  console.log('   @vant/weapp tree     : 未生成（先 pnpm install）');
}
const sharedCoreIndex = path.join(sharedCoreNpmDir, 'index.js');
if (fs.existsSync(sharedCoreIndex)) {
  console.log(
    `   shared-core index.js : ${sha256(fs.readFileSync(sharedCoreIndex))}  (${fs.statSync(sharedCoreIndex).size} bytes)`
  );
} else {
  console.log('   shared-core index.js : 缺失');
}

console.log('\n📋 完成！');

if (allFilesExist) {
  console.log('\n🎉 miniprogram_npm 目录结构已创建成功！');
  console.log('⚠️  对拍协议：不要在开发者工具里点「构建 npm」，会覆盖现成的 miniprogram_npm');
} else {
  console.log('\n⚠️  部分文件缺失，请检查构建状态');
  console.log('   运行: pnpm --filter @looma/shared-core build:mini');
}
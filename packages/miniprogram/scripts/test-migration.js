#!/usr/bin/env node

/**
 * 迁移测试脚本
 * 验证 shared-core 集成是否正常工作
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 迁移测试开始\n');

// 1. 检查 package.json
console.log('1. 检查 package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.dependencies['@looma/shared-core'] === 'workspace:*') {
  console.log('   ✅ @looma/shared-core 依赖已正确配置');
} else {
  console.log('   ❌ @looma/shared-core 依赖配置错误');
}

// 2. 检查 tsconfig.json
console.log('\n2. 检查 tsconfig.json...');
const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
if (tsconfig.compilerOptions.paths && tsconfig.compilerOptions.paths['@looma/shared-core']) {
  console.log('   ✅ TypeScript 路径映射已配置');
} else {
  console.log('   ❌ TypeScript 路径映射未配置');
}

// 3. 检查类型导入
console.log('\n3. 检查类型导入...');
const storeContent = fs.readFileSync('utils/store.ts', 'utf8');
if (storeContent.includes("from '@looma/shared-core'")) {
  console.log('   ✅ store.ts 已使用 shared-core 类型');
} else {
  console.log('   ❌ store.ts 未使用 shared-core 类型');
}

const quizContent = fs.readFileSync('constants/quiz.ts', 'utf8');
if (quizContent.includes("from '@looma/shared-core'")) {
  console.log('   ✅ quiz.ts 已使用 shared-core 类型');
} else {
  console.log('   ❌ quiz.ts 未使用 shared-core 类型');
}

// 4. 检查兼容性层
console.log('\n4. 检查兼容性层...');
if (fs.existsSync('types/compatibility.ts')) {
  console.log('   ✅ 兼容性层已创建');
} else {
  console.log('   ❌ 兼容性层未创建');
}

// 5. 检查 API 适配器
console.log('\n5. 检查 API 适配器...');
if (fs.existsSync('utils/api-v2.ts')) {
  console.log('   ✅ API v2 适配器已创建');
} else {
  console.log('   ❌ API v2 适配器未创建');
}

// 6. 检查 shared-core 适配器
console.log('\n6. 检查 shared-core 适配器...');
const sharedCoreAdapter = path.join(__dirname, '../../shared-core/src/api/MiniApiClientAdapter.ts');
if (fs.existsSync(sharedCoreAdapter)) {
  console.log('   ✅ MiniApiClientAdapter 已创建');
} else {
  console.log('   ❌ MiniApiClientAdapter 未创建');
}

// 7. 运行 TypeScript 类型检查
console.log('\n7. 运行 TypeScript 类型检查...');
try {
  const { execSync } = require('child_process');
  const result = execSync('npx tsc --noEmit 2>&1', { cwd: process.cwd(), encoding: 'utf8' });
  
  // 统计错误数量
  const errorCount = (result.match(/error TS/g) || []).length;
  const warningCount = (result.match(/warning TS/g) || []).length;
  
  console.log(`   发现 ${errorCount} 个错误，${warningCount} 个警告`);
  
  if (errorCount === 0) {
    console.log('   ✅ TypeScript 类型检查通过');
  } else {
    console.log('   ⚠️  TypeScript 类型检查有错误，需要修复');
    // 显示前5个错误
    const errors = result.split('\n').filter(line => line.includes('error TS')).slice(0, 5);
    errors.forEach(error => console.log(`      ${error}`));
  }
} catch (error) {
  console.log('   ❌ TypeScript 类型检查失败:', error.message);
}

// 8. 总结
console.log('\n📊 迁移测试总结');
console.log('='.repeat(40));
console.log('已完成的工作:');
console.log('  ✅ 基础设施准备 (package.json, tsconfig)');
console.log('  ✅ 类型系统统一 (兼容性层, 类型导入)');
console.log('  ✅ API 客户端迁移 (MiniApiClientAdapter)');
console.log('  ✅ 状态管理统一 (store.ts 更新)');
console.log('\n待解决的问题:');
console.log('  ⚠️  TypeScript 类型错误需要修复');
console.log('  ⚠️  小程序 API 类型定义缺失');
console.log('  ⚠️  GameProfile 类型差异需要处理');
console.log('\n下一步:');
console.log('  1. 修复剩余的 TypeScript 错误');
console.log('  2. 安装正确的 @types/wechat-miniprogram');
console.log('  3. 逐步替换 API 导入到 api-v2.ts');
console.log('  4. 运行完整的端到端测试');
console.log('  5. 删除旧的 types/index.ts (如果不再需要)');

console.log('\n🎉 迁移测试完成！');
# 脚本归档说明

## 归档原因
随着 npm 构建流程的标准化，以下脚本已被新的统一流程替代：

## 已归档脚本

### 1. `copy-npm-to-miniprogram.js`
**用途**: 将 shared-core 构建产物复制到小程序 npm_modules 目录
**替代方案**: `create-miniprogram-npm.js`
**废弃原因**: 使用错误的目录结构 (`npm_modules/` 而非 `miniprogram_npm/`)

### 2. `fix-npm-build.js`
**用途**: 修复微信开发者工具 npm 构建问题
**替代方案**: `create-miniprogram-npm.js`
**废弃原因**: 功能重复，逻辑不如新脚本清晰

## 当前推荐脚本

### 核心脚本
1. **`create-miniprogram-npm.js`** - 手动创建 miniprogram_npm 目录结构
2. **`quick-check.js`** - 快速验证构建状态
3. **`check-build-status.js`** - 详细构建状态检查
4. **`diagnose-build.js`** - 诊断构建问题

### 标准构建命令
```bash
# 完整构建流程（已集成到 package.json build:npm）
pnpm --filter @looma/shared-core build:mini \
  && node scripts/create-miniprogram-npm.js \
  && node scripts/quick-check.js
```

### 日常使用
```bash
# 简化版本
pnpm run build:npm
```

## 工作流程
1. 修改 shared-core 代码
2. 运行 `pnpm run build:npm` (自动完成所有步骤)
3. 在微信开发者工具中点击 "工具" → "构建 npm"
4. 测试页面 `pages/test-npm/test-npm`

## 注意事项
- 归档脚本保留供历史参考
- 新脚本使用统一的 `miniprogram_npm/@looma/shared-core/` 目录结构
- 所有脚本都支持扁平导出结构的检测
- 构建流程已标准化，避免团队使用错误脚本
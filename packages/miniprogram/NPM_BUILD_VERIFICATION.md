# NPM 构建验证指南

## 问题概述
微信小程序 npm 构建失败，`miniprogram_npm` 目录未被正确创建，导致无法在微信开发者工具中使用 `@looma/shared-core` 包。

## 解决方案
已通过以下步骤解决：

### 1. 标准化构建流程
由于微信开发者工具无法正确处理 workspace 符号链接，我们创建了标准化的构建流程：

```bash
# 标准构建命令（已集成到 package.json）
pnpm run build:npm
```

该命令等价于：
```bash
pnpm --filter @looma/shared-core build:mini \
  && node scripts/create-miniprogram-npm.js \
  && node scripts/quick-check.js
```

### 2. 目录结构
创建了以下目录结构：
```
miniprogram_npm/
└── @looma/
    └── shared-core/
        ├── index.js        # 构建后的 bundle (40.6 KB) - 扁平导出
        ├── index.js.map    # source map
        └── package.json    # 包配置
```

### 3. 扁平导出检测
包使用扁平导出结构，检测时应检查：
- `createMiniApiClient` - API 客户端工厂函数
- `API_ROUTES` - API 路由常量
- `ensureConsent` - 同意书工具函数
- `CONSENT_SCOPE_LABELS` - 同意书范围标签
- `QUIZ_STATUS` - 测验状态常量

## 当前状态 ✅

### ✅ 构建文件已就绪
- `shared-core/dist/mini/index.js` 存在 (40.6 KB)
- `miniprogram_npm/@looma/shared-core/` 目录已创建
- 所有必需文件已复制到正确位置

### ✅ 项目配置正确
`project.config.json` 配置：
```json
{
  "setting": {
    "nodeModules": true,
    "packNpmManually": true,
    "packNpmRelationList": [
      {
        "packageJsonPath": "./package.json",
        "miniprogramNpmDistDir": "./node_modules"
      }
    ]
  }
}
```

### ✅ 依赖配置正确
`package.json` 配置：
```json
{
  "dependencies": {
    "@looma/shared-core": "workspace:*"
  },
  "scripts": {
    "build:npm": "pnpm --filter @looma/shared-core build:mini && node scripts/create-miniprogram-npm.js && node scripts/quick-check.js"
  }
}
```

## 在微信开发者工具中的操作步骤

### 1. 打开微信开发者工具
- 打开微信开发者工具
- 导入项目：`packages/miniprogram`

### 2. 配置项目
- 进入 "详情" → "本地设置"
- 勾选 "不校验合法域名"（开发环境）
- 确保 "使用 npm 模块" 已启用

### 3. 构建 npm
- 点击菜单栏 "工具" → "构建 npm"
- 等待构建完成（控制台会显示构建日志）

### 4. 测试构建结果
- 访问测试页面：`pages/test-npm/test-npm`
- 页面将显示构建状态和包信息
- 查看控制台输出确认包已正确引入

## 测试页面
创建了专门的测试页面用于验证 npm 构建：
- **文件路径**: `pages/test-npm/test-npm.js`
- **功能**: 
  - 自动测试 `@looma/shared-core` 包的扁平导出结构
  - 显示构建状态和包信息
  - 测试关键导出函数
  - 提供调试建议

## 标准开发流程

### shared-core 变更后
```bash
cd frontend/packages/miniprogram

# 1. 重新构建 bundle + 复制到 miniprogram_npm + 快速验证
pnpm run build:npm

# 2. 微信开发者工具 → 构建 npm → 编译
```

### 验证命令
```bash
# 快速检查
node scripts/quick-check.js

# 详细检查
node scripts/check-build-status.js

# 诊断问题
node scripts/diagnose-build.js
```

## P1 业务迁移计划

### 优先级任务
1. **瘦身 utils/api.ts** → 改用 `createMiniApiClient` + 工厂模式
2. **store.ts 改造** → 改用 `import types/index`，删除 `compatibility.ts`
3. **consent.ts 更新** → 改用 `CONSENT_SCOPE_LABELS`
4. **验证通过后** → 从 `app.json` 移除 `test-npm` 页面

### 迁移目标
P1 完成后，`require('@looma/shared-core')` 将不仅在测试页生效，而是在 `ask`、`result`、登录等真实业务流程中使用同一套契约。

## 常见问题排查

### 问题1: 构建 npm 按钮灰显
**原因**: `project.config.json` 配置不正确
**解决**: 确保 `nodeModules: true` 和 `packNpmManually: true`

### 问题2: 构建成功但无法引入包
**原因**: `miniprogram_npm` 目录结构不正确
**解决**: 运行 `pnpm run build:npm` 重新创建

### 问题3: 包引入时报错 "module not found"
**原因**: 包路径配置错误
**解决**: 检查 `miniprogram_npm/@looma/shared-core/package.json` 中的 `main` 字段

### 问题4: shared-core 未构建
**解决**: 运行 `pnpm --filter @looma/shared-core build:mini`

## 自动化脚本

### 1. 快速检查脚本
```bash
node scripts/quick-check.js
```
输出简洁的状态信息，适合快速验证。

### 2. 详细检查脚本
```bash
node scripts/check-build-status.js
```
输出详细的构建状态和下一步操作指南。

### 3. 创建脚本
```bash
node scripts/create-miniprogram-npm.js
```
手动创建 `miniprogram_npm` 目录结构。

### 4. 诊断脚本
```bash
node scripts/diagnose-build.js
```
提供详细的诊断信息和问题排查。

## 注意事项

### 1. 符号链接问题
微信开发者工具无法正确处理 `node_modules` 中的 workspace 符号链接，因此需要手动复制文件到 `miniprogram_npm`。

### 2. 扁平导出结构
包使用扁平导出而非嵌套结构，检测时应直接检查顶层导出：
```javascript
const sc = require('@looma/shared-core');
const ok = sc.createMiniApiClient && sc.API_ROUTES && sc.ensureConsent;
```

### 3. 构建缓存
如果构建后仍然有问题，尝试：
- 清除微信开发者工具缓存
- 删除 `miniprogram_npm` 目录后重新构建
- 重启微信开发者工具

### 4. 版本兼容性
确保 `@looma/shared-core` 的 `package.json` 中包含正确的 `miniprogram` 字段：
```json
{
  "miniprogram": "index.js"
}
```

## 验证成功标志
1. ✅ `miniprogram_npm/@looma/shared-core/index.js` 文件存在
2. ✅ 微信开发者工具 "构建 npm" 成功完成
3. ✅ 测试页面能正常引入包并显示信息
4. ✅ 控制台无 "module not found" 错误

## 架构说明
workspace 符号链接是微信侧限制，手动创建 `miniprogram_npm` 是合理的工程补偿，与 esbuild 构建桥不冲突，而是最后一环。这套方案确保了：
1. **开发体验**：本地 workspace 开发不受影响
2. **构建流程**：微信开发者工具能正确识别 npm 包
3. **代码复用**：同一套代码在 web 和小程序间共享
4. **类型安全**：TypeScript 类型系统保持完整
# 小程序构建桥使用说明

## 概述

小程序构建桥方案实现了 shared-core 作为单一真源，通过 npm workspace 依赖 + 构建脚本的方式，在发布前将共享代码编译进小程序目录。

**最新路线图**：请参考 [BUILD_BRIDGE_ROADMAP.md](./BUILD_BRIDGE_ROADMAP.md)（P1 ✅ 已完成四条链路迁移）

## 构建流程

### 1. 开发环境设置

```bash
# 1. 安装所有依赖（根目录）
# 在仓库根目录执行
pnpm install

# 2. 进入小程序目录
cd packages/miniprogram

# 3. 开发时类型检查（可选）
npm run typecheck
```

### 2. 构建小程序 npm 包

```bash
# 1. 构建 shared-core 的小程序版本
# 在仓库根目录执行
pnpm --filter @looma/shared-core build:mini

# 2. 复制构建产物到小程序目录
cd packages/miniprogram
npm run build:npm

# 或者使用一步构建
npm run build:npm  # 自动执行上述两个步骤
```

### 3. 在微信开发者工具中构建

1. 打开微信开发者工具
2. 导入项目：选择 `frontend/packages/miniprogram` 目录
3. 点击菜单栏"工具" → "构建 npm"
4. 等待构建完成
5. 重启小程序开发者工具（如果需要）

### 4. 验证构建结果

```bash
# 检查构建产物
ls -la npm_modules/@looma/shared-core/

# 预期输出：
# - package.json
# - mini.js
# - mini.d.ts
# - index.js
# - index.d.ts
# - types/ 目录
```

## 项目结构

```
miniprogram/
├── package.json                    # 添加 @looma/shared-core workspace 依赖
├── project.config.json             # 启用 nodeModules 和 npm 构建
├── scripts/
│   └── verify-mini-bridge.js       # 构建验证脚本
├── types/
│   ├── index.ts                    # 从 shared-core 导入类型和常量
│   └── miniprogram.ts              # 小程序特有类型扩展
└── npm_modules/                    # 构建产物目录（自动生成）
    └── @looma/
        └── shared-core/            # shared-core 构建产物
```

## 配置说明

### package.json
```json
{
  "dependencies": {
    "@looma/shared-core": "workspace:*"
  },
  "scripts": {
    "build:npm": "pnpm --filter @looma/shared-core build:mini && node scripts/verify-mini-bridge.js"
  }
}
```

### project.config.json
```json
{
  "setting": {
    "nodeModules": true,
    "packNpmManually": true,
    "packNpmRelationList": [
      {
        "packageJsonPath": "./package.json",
        "miniprogramNpmDistDir": "./"
      }
    ]
  }
}
```

## 类型系统架构

### 1. 基础类型（来自 shared-core）
```typescript
// types/index.ts
export type { GameProfile as BaseGameProfile } from '@looma/shared-core'
export { RANK_NAMES, getRankName } from '@looma/shared-core'
```

### 2. 小程序特有类型扩展
```typescript
// types/miniprogram.ts
import type { GameProfile as BaseGameProfile } from '@looma/shared-core'

export interface MiniprogramGameProfile extends BaseGameProfile {
  team_size: number
  fleet_members: string[]
}
```

### 3. 使用示例
```typescript
// 导入类型
import type { GameProfile } from '../types'
import { RANK_NAMES } from '../types'

// 导入工具函数
import { createMiniApiClient } from '@looma/shared-core'
```

## 故障排除

### 1. 构建失败
```bash
# 检查 shared-core 构建
cd ../shared-core
npm run build:mini

# 检查构建脚本权限
chmod +x scripts/verify-mini-bridge.js
```

### 2. 类型错误
```bash
# 运行类型检查
npx tsc --noEmit --skipLibCheck

# 检查类型导入
grep -r "from '@looma/shared-core'" src/
```

### 3. 运行时错误
```bash
# 检查 npm 构建是否成功
ls -la npm_modules/@looma/shared-core/

# 检查微信开发者工具构建日志
# 查看控制台是否有模块加载错误
```

### 4. 常见错误

**错误：** `Error: module 'utils/@looma/shared-core.js' is not defined`
**解决方案：**
1. 确保已运行 `npm run build:npm`
2. 在微信开发者工具中重新构建 npm
3. 重启开发者工具

**错误：** `Cannot find module '@looma/shared-core'`
**解决方案：**
1. 检查 package.json 依赖配置
2. 运行 `pnpm install` 安装依赖
3. 确保 workspace 配置正确

## 开发工作流

### 修改 shared-core 代码
1. 在 `packages/shared-core` 中修改代码
2. 运行构建：`pnpm --filter @looma/shared-core build:mini`
3. 在小程序中更新：`npm run build:npm`
4. 在微信开发者工具中重新构建 npm

### 添加新类型/常量
1. 在 shared-core 中添加类型/常量
2. 在 `src/entries/mini.ts` 中导出
3. 在小程序 `types/index.ts` 中导入使用

### 调试技巧
1. 使用 `console.log` 在构建脚本中调试
2. 检查构建产物目录结构
3. 查看微信开发者工具控制台日志
4. 使用 TypeScript 类型检查提前发现问题

## 性能优化

### 增量构建
构建脚本支持增量构建，只复制变化的文件。

### 构建缓存
可以考虑添加构建缓存机制，避免重复构建。

### 监控构建时间
记录构建时间，优化慢速步骤。

## 迁移完成检查清单

- [ ] 安装所有依赖：`pnpm install`
- [ ] 构建 shared-core：`pnpm --filter @looma/shared-core build:mini`
- [ ] 运行构建脚本：`npm run build:npm`
- [ ] 微信开发者工具构建 npm
- [ ] 验证小程序运行正常
- [ ] 测试所有页面功能
- [ ] 验证 API 调用正常
- [ ] 确认无运行时错误

## 联系方式

如有问题，请联系：
- 技术负责人：Jason
- 代码审查：szbenyx
- 测试验证：QA团队
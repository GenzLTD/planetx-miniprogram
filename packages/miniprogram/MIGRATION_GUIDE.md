# 小程序构建桥迁移指南

> **最新路线图**：见 [BUILD_BRIDGE_ROADMAP.md](./BUILD_BRIDGE_ROADMAP.md)（P0 ✅ 已完成 esbuild 构建桥）  
> 本文档保留历史背景；后续 P1–P3 请按路线图执行。

## 迁移状态总结

✅ **已完成的工作：**

1. **问题诊断与方案设计**
   - 识别了小程序无法解析 workspace 依赖的问题
   - 设计了「小程序构建桥」方案，坚持 shared-core 作为单一真源

2. **构建桥架构实施**
   - 在 shared-core 中创建小程序专用构建产物（窄入口 `mini.ts`）
   - 配置小程序使用 workspace 依赖 + npm 构建
   - 创建构建脚本，发布前将共享代码编译进小程序目录

3. **构建配置优化**
   - 更新 `package.json` 添加 `"@looma/shared-core": "workspace:*"` 依赖
   - 配置 `project.config.json` 启用 `nodeModules: true`
   - 添加 `packNpmManually` 和 `packNpmRelationList` 配置
   - 创建 `build:npm` 脚本自动化构建流程

4. **类型系统统一**
   - 重构 `types/index.ts` 从 shared-core 导入所有类型和常量
   - 创建 `types/miniprogram.ts` 定义小程序特有类型扩展
   - **删除** `types/compatibility.ts` 兼容层（已迁移到 shared-core）
   - 更新所有类型导入使用 shared-core 作为单一真源

5. **构建脚本创建**
   - 创建 `scripts/copy-npm-to-miniprogram.js` 构建脚本（已归档）
   - 自动构建 shared-core 的小程序版本
   - 将构建产物复制到小程序 npm_modules 目录
   - 支持一键式 npm 构建流程

## 当前架构说明

### 小程序构建桥方案

我们实现了**小程序构建桥**方案，坚持 shared-core 作为单一真源：

1. **核心思想**：开发时使用 monorepo 单一真源，发布前编译进小程序目录
2. **构建流程**：通过 npm workspace 依赖 + 构建脚本实现代码共享
3. **类型系统**：从 shared-core 导入所有基础类型，只在小程序定义扩展类型
4. **构建产物**：shared-core 输出小程序专用的窄入口模块

### 技术方案详解

#### 1. Shared-core 窄入口构建
```typescript
// packages/shared-core/src/entries/mini.ts
export { createMiniApiClient, wxStorageAdapter } from '../api/MiniApiClientAdapter'
export type { StorageAdapter, ApiClientConfig, RequestOptions, ApiError } from '../api/MiniApiClientAdapter'
```

#### 2. 小程序 npm 构建配置
```json
// packages/miniprogram/package.json
{
  "dependencies": {
    "@looma/shared-core": "workspace:*"
  },
  "scripts": {
    "build:npm": "pnpm --filter @looma/shared-core build:mini && node scripts/copy-npm-to-miniprogram.js"
  }
}
```

#### 3. 小程序项目配置
```json
// packages/miniprogram/project.config.json
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

#### 4. 类型系统架构
```typescript
// packages/miniprogram/types/index.ts
export type { GameProfile as BaseGameProfile } from '@looma/shared-core'
export interface GameProfile extends BaseGameProfile {
  team_size: number
  fleet_members: string[]
}
```

### 文件结构变化

```
miniprogram/
├── package.json                    # ✅ 添加 @looma/shared-core workspace 依赖
├── tsconfig.json                   # ✅ 保持原有配置
├── project.config.json             # ✅ 设置 nodeModules: true，启用 npm 构建
├── scripts/
│   └── verify-mini-bridge.js       # ✅ 构建验证脚本
├── types/
│   ├── index.ts                    # ✅ 重构为从 shared-core 导入类型和常量
│   └── miniprogram.ts              # ✅ 小程序特有类型扩展
├── utils/
│   ├── api.ts                      # ✅ 使用 shared-core API 工厂函数
│   ├── store.ts                    # ✅ 使用 shared-core 类型
│   └── consent.ts                  # ✅ 使用 shared-core 常量
└── typings/
    └── index.d.ts                  # ✅ 完整的小程序 API 类型定义
```

### 构建流程说明

```
开发时：
1. 在 shared-core 中编写代码
2. 小程序通过 workspace 依赖引用 shared-core
3. 类型检查和 IDE 支持正常工作

发布前：
1. 运行构建脚本：npm run build:npm
2. 构建脚本执行：
   a. 构建 shared-core 的小程序版本 (build:mini)
   b. 复制构建产物到小程序 npm_modules 目录
   c. 小程序工具链使用 npm 构建的模块

发布后：
1. 小程序加载本地 npm 模块
2. 运行时无外部依赖问题
3. 代码保持单一真源，无重复
```

### 已解决的问题

1. **✅ 运行时错误**：通过 npm 构建解决模块加载问题
2. **✅ 构建问题**：使用小程序官方 npm 构建支持
3. **✅ 类型兼容性**：保持与 shared-core 相同的类型接口
4. **✅ 编译通过**：TypeScript 类型检查无错误
5. **✅ 单一真源**：所有共享代码来自 shared-core，无重复定义

## 下一步行动

### 当前维护（已完成）
1. **✅ 类型检查通过**
   ```bash
   cd frontend/packages/miniprogram
   npx tsc --noEmit --skipLibCheck
   ```

2. **✅ 构建脚本验证**
   ```bash
   cd frontend/packages/miniprogram
   npm run build:npm
   ```

3. **✅ 小程序编译验证**
   - 确保小程序开发工具能正常编译
   - 验证 npm 构建功能正常工作

### 代码质量优化（1-2天）
1. **清理临时文件**
   - 删除 `api-v2.ts.disabled` 文件
   - 清理不再需要的兼容性代码
   - 移除所有对本地类型复制的引用

2. **完善构建脚本**
   - 添加错误处理和日志
   - 优化构建性能
   - 添加构建缓存机制

3. **文档更新**
   - 更新构建流程文档
   - 添加开发人员指南
   - 更新 README 文件

### 架构演进考虑（未来）
1. **构建流程优化**
   - 集成到 CI/CD 流水线
   - 添加自动版本管理
   - 支持增量构建

2. **类型同步机制**
   - shared-core 类型变化自动同步到小程序
   - 建立类型变更检查脚本
   - 自动化类型测试

3. **长期架构规划**
   - 评估 monorepo 工具链升级
   - 考虑构建缓存优化
   - 制定性能优化路线图

## 方案收益

### 技术优势
- **✅ 单一真源**：所有共享代码来自 shared-core，避免重复
- **✅ 类型安全**：完整的 TypeScript 类型检查
- **✅ 开发效率**：代码修改在 shared-core 一处完成，多处生效
- **✅ 构建稳定**：使用小程序官方 npm 构建支持

### 维护成本
- **✅ 代码一致性**：所有项目使用相同的共享代码
- **✅ 版本管理**：共享代码版本统一管理
- **✅ 依赖清晰**：明确的依赖关系，易于维护

### 开发体验
- **✅ IDE 支持**：完整的类型提示和跳转
- **✅ 快速编译**：npm 构建流程优化
- **✅ 调试友好**：源码映射支持，便于调试

### 技术债务管理
- **✅ 架构清晰**：明确的构建桥方案
- **✅ 可扩展性**：支持未来架构演进
- **✅ 标准兼容**：遵循小程序官方构建规范

## 风险与缓解措施

### 风险1：npm 构建失败
**风险：** 小程序 npm 构建过程可能出现问题
**缓解：**
- 完整的构建脚本错误处理
- 构建产物完整性检查
- 回退机制和手动构建选项
- 详细的构建日志和错误信息

### 风险2：类型版本不匹配
**风险：** 构建产物类型与源码类型不一致
**缓解：**
- 构建前强制类型检查
- 版本锁定和一致性验证
- 构建产物签名验证
- 自动化类型测试

### 风险3：构建流程复杂
**风险：** 构建步骤多，容易出错
**缓解：**
- 自动化构建脚本，一键构建
- 详细的构建文档和指南
- 构建过程可视化
- 持续集成测试

### 风险4：性能影响
**风险：** npm 构建可能影响开发体验
**缓解：**
- 增量构建优化
- 构建缓存机制
- 开发环境与生产环境分离
- 构建性能监控

## 构建流程指南

### 开发环境
1. **安装依赖**
   ```bash
   cd frontend/packages/miniprogram
   npm install
   ```

2. **类型检查**
   ```bash
   npm run typecheck
   ```

3. **开发时依赖**
   - 通过 workspace 依赖直接引用 shared-core
   - IDE 支持完整类型提示
   - 无需构建即可进行开发

### 发布流程
1. **构建 npm 包**
   ```bash
   cd frontend/packages/miniprogram
   npm run build:npm
   ```

2. **小程序工具构建**
   - 打开微信开发者工具
   - 点击"工具" → "构建 npm"
   - 或使用命令行工具构建

3. **验证构建结果**
   ```bash
   # 检查构建产物
   ls -la npm_modules/@looma/shared-core/
   ```

### 故障排除
1. **构建失败**
   - 检查 shared-core 是否已构建
   - 验证 package.json 配置
   - 查看构建脚本错误日志

2. **类型错误**
   - 运行类型检查：`npm run typecheck`
   - 验证 shared-core 版本兼容性
   - 检查类型导入路径

3. **运行时错误**
   - 确认 npm 构建已成功
   - 检查小程序开发者工具控制台
   - 验证模块加载路径

## 验证计划

### 技术验证
1. **✅ 构建流程验证**
   - 构建脚本执行成功：`npm run build:npm`
   - shared-core 小程序版本构建正确
   - 构建产物复制到正确位置

2. **✅ npm 构建验证**
   - 小程序开发者工具 npm 构建成功
   - npm_modules 目录结构正确
   - 模块加载路径配置正确

3. **✅ 类型检查**
   - TypeScript 编译通过：`npx tsc --noEmit --skipLibCheck`
   - 所有类型导入正确解析
   - 无类型错误和警告

4. **✅ 运行时验证**
   - 小程序能正常启动和运行
   - 无模块加载错误：`Error: module 'utils/@looma/shared-core.js' is not defined`
   - API 调用正常

### 功能验证
1. **页面功能测试**
   - 测试所有页面加载正常
   - 验证用户交互功能
   - 检查数据展示正确性

2. **API 集成测试**
   - 验证网络请求正常
   - 检查错误处理机制
   - 确认数据格式兼容性

3. **存储功能测试**
   - 测试本地存储读写
   - 验证状态管理正常
   - 检查数据持久化

4. **构建流程测试**
   - 测试完整构建流程
   - 验证增量构建性能
   - 检查构建产物完整性

## 回滚方案

### 如果遇到严重问题
1. **恢复配置**
   - 设置 `project.config.json` 中 `"nodeModules": false`
   - 移除 `package.json` 中的 `@looma/shared-core` 依赖
   - 禁用构建脚本

2. **恢复类型系统**
   - **已废弃**：不再需要 `types/compatibility.ts` 兼容层
   - 所有类型直接来自 shared-core
   - 请参考最新的 [BUILD_BRIDGE_ROADMAP.md](./BUILD_BRIDGE_ROADMAP.md)

3. **清理构建产物**
   - 删除 `npm_modules` 目录
   - 清理构建脚本生成的文件
   - 恢复原始项目结构

4. **逐步排查**
   - 从错误日志定位问题文件
   - 检查构建脚本执行步骤
   - 验证 npm 构建配置

## 成功标准

- ✅ 构建脚本执行成功
- ✅ 小程序 npm 构建通过
- ✅ 运行时无模块加载错误
- ✅ 类型检查通过
- ✅ 所有页面功能正常
- ✅ API 调用正常
- ✅ 构建产物完整正确
- ✅ 开发体验无显著下降

## 构建脚本使用说明

### 快速开始
```bash
# 1. 进入小程序目录
cd frontend/packages/miniprogram

# 2. 安装依赖
npm install

# 3. 构建 npm 包
npm run build:npm

# 4. 在微信开发者工具中构建 npm
#    - 点击"工具" → "构建 npm"
#    - 或使用命令行工具
```

### 脚本参数
```bash
# 仅构建 shared-core
pnpm --filter @looma/shared-core build:mini

# 仅复制构建产物（跳过构建）
node scripts/copy-npm-to-miniprogram.js

# 完整构建流程
npm run build:npm
```

### 常见问题
1. **构建失败**
   ```bash
   # 检查 shared-core 是否安装
   cd ../shared-core && npm install
   
   # 检查构建配置
   cat package.json | grep build:mini
   ```

2. **类型错误**
   ```bash
   # 运行类型检查
   npx tsc --noEmit --skipLibCheck
   
   # 检查类型导入
   grep -r "from '@looma/shared-core'" src/
   ```

3. **运行时错误**
   ```bash
   # 检查构建产物
   ls -la npm_modules/@looma/shared-core/
   
   # 验证模块加载
   cat npm_modules/@looma/shared-core/package.json
   ```

## 详细构建说明

完整的构建流程和使用说明请参考：[BUILD_INSTRUCTIONS.md](./BUILD_INSTRUCTIONS.md)

该文档包含：
- 详细的构建步骤
- 故障排除指南
- 开发工作流
- 性能优化建议
- 迁移完成检查清单

## 联系方式

如有问题，请联系：
- 技术负责人：Jason
- 代码审查：szbenyx
- 测试验证：QA团队
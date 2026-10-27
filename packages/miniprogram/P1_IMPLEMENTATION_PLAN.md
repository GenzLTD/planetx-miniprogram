# P1 重构实施计划

## 当前状态
- ✅ P0 构建桥已通过验证：esbuild mini bundle 构建成功（40.6KB）
- ⏳ 等待用户完成微信开发者工具构建 npm 和模拟器验证
- 📋 P1 重构准备工作已完成

## P1 重构目标
删除重复层，统一运行时 import，建立单一真源架构。

## 重构文件清单

### 1. `utils/api.ts` - 瘦身（288行 → <80行）
**现状**：自研 `MiniApiClient` + 工厂函数，与 shared-core 重复
**目标**：使用 `@looma/shared-core` 的 `createMiniApiClient` + 工厂函数

**重构步骤**：
1. 备份原文件：`utils/api.ts` → `utils/api.old.ts`
2. 应用重构版本：`utils/api-refactored.ts` → `utils/api.ts`
3. 验证类型检查和运行时兼容性

**验收标准**：
- [ ] 文件行数 < 80 行
- [ ] 无 `class MiniApiClient` 定义
- [ ] 使用 `createMiniApiClient` 创建客户端
- [ ] 使用 `createAuthApi`、`createGameApi` 等工厂函数

### 2. `types/compatibility.ts` - 删除
**现状**：临时类型兼容层，已弃用
**目标**：完全删除，所有类型从 `@looma/shared-core` 导入

**重构步骤**：
1. 检查所有导入 `types/compatibility.ts` 的文件
2. 更新这些文件的导入路径
3. 删除 `types/compatibility.ts` 文件

**影响文件**：
- `utils/store.ts`
- `utils/consent.ts`（间接通过 api.ts）
- 其他可能的文件

### 3. `utils/store.ts` - 统一 import
**现状**：从 `types/compatibility.ts` 导入类型
**目标**：从 `@looma/shared-core` 导入类型

**重构步骤**：
1. 应用重构版本：`utils/store-refactored.ts` → `utils/store.ts`
2. 验证类型兼容性

### 4. `utils/consent.ts` - 统一 import
**现状**：本地定义 `ConsentScope`、`LABELS`、`DESCRIPTIONS`
**目标**：使用 `@looma/shared-core` 的常量

**重构步骤**：
1. 应用重构版本：`utils/consent-refactored.ts` → `utils/consent.ts`
2. 验证功能兼容性

### 5. `constants/quiz.ts` - 评估重构
**现状**：本地定义 `QUIZ_QUESTIONS`、`PERSONALITY_MAP` 等
**目标**：改为 re-export `@looma/shared-core` 的常量

**重构步骤**：
1. 比较本地定义与 shared-core 定义是否一致
2. 如果一致，应用重构版本：`constants/quiz-refactored.ts` → `constants/quiz.ts`
3. 如果不一致，需要先统一到 shared-core

## 实施顺序
1. **先完成微信开发者工具验证**（用户操作）
2. **备份所有原文件**
3. **按依赖顺序重构**：
   - 先重构 `utils/api.ts`（基础依赖）
   - 再重构 `types/compatibility.ts`（删除）
   - 然后重构 `utils/store.ts` 和 `utils/consent.ts`
   - 最后评估 `constants/quiz.ts`
4. **验证构建**：`pnpm run build:npm`
5. **微信开发者工具重新构建 npm**

## 风险与缓解措施
### 风险1：类型不兼容
- **表现**：TypeScript 编译错误
- **缓解**：保持原文件备份，逐步替换，验证类型兼容性

### 风险2：运行时错误
- **表现**：微信开发者工具运行时错误
- **缓解**：使用 `api-refactored.ts` 等草案文件先行测试

### 风险3：功能差异
- **表现**：shared-core 函数与本地实现行为不一致
- **缓解**：对比函数实现，必要时保留本地实现作为回退

## 验证步骤
1. **类型检查**：`npx tsc --noEmit --skipLibCheck`
2. **构建验证**：`pnpm run build:npm`
3. **微信构建**：重新构建 npm
4. **功能测试**：
   - 登录流程
   - 问答功能
   - 分享功能
   - 授权弹窗

## 时间预估
- 微信开发者工具验证：5-10分钟（用户操作）
- P1 重构实施：1-2小时
- 验证测试：30分钟
- **总计**：约2-3小时

## 下一步
等待用户完成微信开发者工具验证后，开始实施 P1 重构。
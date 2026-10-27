# 微信开发者工具验证清单

## 准备工作
1. 在 `utils/config.ts` 填写唯一的 `API_ORIGIN`。空字符串时请求会失败，这是故意的。
2. ✅ 确认 shared-core mini bundle 已构建：
   ```bash
   pnpm --filter @looma/shared-core build:mini
   ```

## 微信开发者工具操作步骤
1. **打开项目**：
   - 打开微信开发者工具
   - 导入项目：选择本仓库的 `packages/miniprogram` 目录
   - AppID: `wx842b6837e6898789`

2. **配置本地设置**：
   - 点击"详情"按钮
   - 在"本地设置"选项卡中：
     - ✅ 勾选"不校验合法域名、web-view域名、TLS版本以及HTTPS证书"

3. **构建 npm**：
   - 点击顶部菜单"工具" → "构建 npm"
   - 等待构建完成
   - 构建完成后，会在项目根目录生成 `miniprogram_npm/@looma/shared-core/` 目录

4. **验证构建结果**：
   ```bash
   node scripts/check-wechat-build.js
   ```

5. **编译运行**：
   - 点击"编译"按钮
   - 启动模拟器
   - 依次测试页面：
     - Hub 页面 (`pages/hub/index`)
     - Ask 页面 (`pages/ask/index`)
     - Result 页面 (`pages/result/index`)

## 成功标志
- ✅ 控制台无 `module '@looma/shared-core' is not defined` 错误
- ✅ 登录、问答、分享等基本流程正常
- ✅ 页面可以正常加载和交互

## 故障排查
### 如果构建 npm 失败：
1. **找不到 @looma/shared-core**：
   ```bash
   cd frontend
   pnpm install
   ```

2. **构建 npm 后仍报错**：
   - 重启微信开发者工具
   - 重新编译一次

3. **dist/mini/index.js 不存在**：
   ```bash
   cd frontend
   pnpm --filter @looma/shared-core build:mini
   ```

### 如果运行时错误：
1. **TypeScript 类型错误但运行正常**：
   - 这是正常现象，因为开发时解析源码，运行时走 bundle
   - P1 重构后会解决

2. **401 认证错误**：
   - 确认 backend 正在运行
   - 检查 `utils/config.ts` 中的 `API_BASE` 配置

## P0 验收标准检查
- [ ] `miniprogram_npm/@looma/shared-core` 目录存在
- [ ] 模拟器启动无 `module '@looma/shared-core' is not defined` 错误
- [ ] 登录、问答、分享等基本流程正常

## 验证完成后
完成微信开发者工具验证后，可以继续 P1 重构工作：
1. 瘦身 `utils/api.ts`（改用 `createMiniApiClient` + 工厂）
2. 删除 `types/compatibility.ts`
3. 统一 `store.ts` / `consent.ts` 的 import
4. 评估 `constants/quiz.ts` 是否改为 re-export
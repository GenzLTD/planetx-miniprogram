# 微信开发者工具验证步骤

## ✅ 第一步：构建已成功完成
您已成功运行：
```bash
pnpm run build:npm
```
结果：
- `dist/mini/index.js` 已生成（40.6 KB）
- 构建桥验证通过

## 🛠️ 第二步：打开微信开发者工具

### 操作步骤：
1. **打开微信开发者工具**
2. **导入项目**：选择本仓库的 `packages/miniprogram`
3. **等待项目加载完成**

### 配置检查：
- ✅ `project.config.json` 已配置 `nodeModules: true`
- ✅ `packNpmManually: true` 已设置
- ✅ `@looma/shared-core` workspace 依赖已配置

## 🔧 第三步：配置本地设置

### 操作步骤：
1. 点击 **详情** 按钮
2. 进入 **本地设置** 选项卡
3. 勾选以下选项：
   - ✅ **不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书**（必须勾选）

### 重要说明：
- 唯一源的 HTTPS 合法域名配进微信后台之前，开发者工具需要勾选此选项
- 不要把请求指到 `127.0.0.1:5200`、ServBay 或另一台机器的 IP

## 📦 第四步：构建 npm

### 操作步骤：
1. 点击菜单栏 **工具** → **构建 npm**
2. 等待构建完成
3. 查看控制台输出是否有错误

### 成功标志：
1. **构建成功提示**："构建完成" 或 "构建成功"
2. **目录检查**：运行以下命令检查生成的文件：
   ```bash
   ls -la miniprogram_npm/@looma/shared-core/
   ```
   
   预期看到：
   ```
   miniprogram_npm/
   └── @looma/
       └── shared-core/
           ├── index.js      # 构建产物
           ├── index.js.map  # source map
           └── package.json  # npm 包信息
   ```

## 🎯 第五步：编译和测试

### 操作步骤：
1. **点击编译按钮**（或按快捷键 `Ctrl/⌘ + B`）
2. **选择页面**：测试以下页面：
   - `hub` 页面
   - `ask` 页面  
   - `result` 页面
3. **观察模拟器**：页面应正常加载

### 成功标志：
1. ✅ **无模块加载错误**：控制台没有 `module '@looma/shared-core' is not defined` 错误
2. ✅ **页面正常显示**：所有页面都能正常加载
3. ✅ **API 调用正常**：登录、问答、分享等功能正常工作
4. ✅ **类型检查通过**：无 TypeScript 编译错误

## 🔍 第六步：验证脚本

### 运行验证脚本：
```bash
cd packages/miniprogram
node scripts/check-wechat-build.js
```

### 脚本会检查：
1. ✅ `dist/mini/index.js` 存在且大小合理
2. ✅ `miniprogram_npm/@looma/shared-core/` 目录存在
3. ✅ 构建产物完整性

## 🚨 故障排除

### 问题1：构建 npm 失败
**现象**：点击"构建 npm"后报错
**解决方案**：
1. 关闭微信开发者工具重新打开
2. 在仓库根目录执行：`pnpm install`
3. 重新运行 `pnpm run build:npm`
4. 再次尝试构建 npm

### 问题2：找不到 @looma/shared-core
**现象**：构建时提示找不到依赖
**解决方案**：
1. 检查 `package.json` 中是否有 `"@looma/shared-core": "workspace:*"`
2. 在项目根目录运行：`pnpm install`
3. 重新构建

### 问题3：构建后仍报错
**现象**：构建 npm 成功，但运行时仍有模块错误
**解决方案**：
1. 重启微信开发者工具
2. 清除缓存：工具 → 清除缓存 → 全部清除
3. 重新编译

### 问题4：dist/mini/index.js 不存在
**现象**：验证脚本报错文件不存在
**解决方案**：
```bash
# 在仓库根目录执行
pnpm --filter @looma/shared-core build:mini
```

## 📋 验证检查清单

- [ ] 打开微信开发者工具，导入项目
- [ ] 配置本地设置，勾选"不校验合法域名"
- [ ] 点击"工具" → "构建 npm"
- [ ] 验证 `miniprogram_npm/@looma/shared-core/` 目录生成
- [ ] 编译 hub/ask/result 页面
- [ ] 检查控制台无模块加载错误
- [ ] 测试登录、问答、分享功能
- [ ] 运行验证脚本：`node scripts/check-wechat-build.js`

## 📊 结果报告

**完成后请告诉我结果：**

1. **如果成功**：
   - 控制台截图（无错误）
   - 功能测试结果
   - 验证脚本输出

2. **如果失败**：
   - 完整的错误截图
   - 微信开发者工具控制台输出
   - 构建 npm 的错误信息

## 🚀 下一步

验证成功后，我们将：
1. 立即开始 P1 重构实施
2. 替换 `utils/api.ts` 为瘦身版本
3. 删除 `types/compatibility.ts`
4. 统一所有导入使用 shared-core

**请现在完成微信开发者工具验证，然后告诉我结果！**
# 本机联调（经 zervi-rust api-gateway）

完整栈与脚本在 **zervi-rust**：`scripts/local-dev-up/`（一键起停 + consent stub v2 + 抽检）。  
多机（ServBay 栈 + Surface / Mac / Dell 客户端）见同目录 **`FLEET.md`**。

## 最短路径（同机）

```powershell
# 在 zervi-rust 仓根（Windows 栈主机）
powershell -File scripts/local-dev-up/up.ps1
powershell -File scripts/local-dev-up/smoke_check.ps1
```

Git Bash 等价：`up.sh` / `smoke_check.sh` / `down.sh`。

本仓 `utils/config.ts`：

```ts
const USE_LOCAL_GATEWAY = true  // 临时；提交前改回 false
const LOCAL_GATEWAY_ORIGIN = 'http://127.0.0.1:3333'
```

开发者工具：不校验合法域名 → 清缓存编译 → 求职 Tab。

收尾：

```powershell
powershell -File scripts/local-dev-up/down.ps1
# USE_LOCAL_GATEWAY = false
```

## Surface / Mac / Dell 客户端

栈在 **另一台机**（推荐 ServBay）已 `up` 时：

1. 向栈主机要局域网 IP（`up` 结束会打印；避开 WSL/`26.x` 虚拟网卡）。
2. 本机只改 `config.ts`（**勿提交**）：

   ```ts
   const USE_LOCAL_GATEWAY = true
   const LOCAL_GATEWAY_ORIGIN = 'http://192.168.x.x:3333'
   ```

3. 可选远端抽检（需本机也有 zervi-rust 仓，或 curl）：

   ```bash
   curl -sS http://192.168.x.x:3333/health
   BASE=http://192.168.x.x:3333 bash scripts/local-dev-up/smoke_check.sh
   ```

4. Mac：**不要**在本机跑当前 `up.sh` 当栈；只做开发者工具客户端。

## 能点通 / 不能点通

| 能 | 不能（已知空白） |
| --- | --- |
| 登录、consent（stub 可持久）、parse（需 DEEPSEEK）、入库、列表、detail、谁可看、模板、屏蔽 | `/v1/jobs/*`（job-service :3004 未编）→ 502 |

细节与鉴权说明见 zervi-rust `scripts/local-dev-up/README.md`。

# 本机联调（经 zervi-rust api-gateway）

完整栈与脚本在 **zervi-rust**：`scripts/local-dev-up/`（一键起停 + consent stub v2 + 抽检）。

## 最短路径

```powershell
# 在 zervi-rust 仓根（Windows）
powershell -File scripts/local-dev-up/up.ps1
powershell -File scripts/local-dev-up/smoke_check.ps1
```

Git Bash 等价：`up.sh` / `smoke_check.sh` / `down.sh`。

本仓 `utils/config.ts`：

```ts
const USE_LOCAL_GATEWAY = true  // 临时；提交前改回 false
```

开发者工具：不校验合法域名 → 清缓存编译 → 求职 Tab。

收尾：

```powershell
powershell -File scripts/local-dev-up/down.ps1
# USE_LOCAL_GATEWAY = false
```

## 能点通 / 不能点通

| 能 | 不能（已知空白） |
| --- | --- |
| 登录、consent（stub 可持久）、parse（需 DEEPSEEK）、入库、列表、detail、谁可看、模板、屏蔽 | `/v1/jobs/*`（job-service :3004 未编）→ 502 |

细节与鉴权说明见 zervi-rust `scripts/local-dev-up/README.md`。

# planetx-miniprogram

微信小程序独立仓库。AppID `wx842b6837e6898789`。

这是从 `GenzLTD/looma-zervi` 的 `main`（`233e2ca`）切出的壳，加上它依赖的 `shared-core`。

`wx6563950292092013` 停止推进。那个主体不是企业法人，无法上架。上架只走本仓库的 `wx842b6837e6898789`。`looma-zervi` 里的旧壳保留，不再加功能。

## 单源

小程序只认 `packages/miniprogram/utils/config.ts` 里的 `API_ORIGIN`。接口和分享链接都用这一个源。

契约钉在格契 `4f0dc4b`，L0 `1.5.0`。账本只有一本。这份仓库不部署 looma，也不选择账本落在哪台机器。

法兰克福 `45.76.84.90` 是预发闸门。那里的内核和 looma 只听 `127.0.0.1`，开发者工具和手机访问不到。所以 `API_ORIGIN` 现在是空字符串。空的时候请求失败，不会打到 ServBay、腾讯云 IP 或另一本账。

唯一源有了 HTTPS 合法域名之后，只改 `API_ORIGIN` 这一行。

## 打开

用微信开发者工具导入 `packages/miniprogram`。构建：

```bash
pnpm install
pnpm run build:npm
```

签名密钥、支付密钥不要放进这个仓库。

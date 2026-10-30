/**
 * 唯一对外源。
 *
 * 一个契约、一个账本，小程序只认这一个源。
 * 法兰克福 45.76.84.90 是预发闸门，内核和 looma 只听 127.0.0.1，
 * 开发者工具和手机都到不了那台机器的回环。
 * 在这一源给出 HTTPS 合法域名之前，这里保持空字符串：
 * 请求会失败，不会落到 ServBay、腾讯云或另一本账。
 */

/**
 * 本地联调开关（local-dual-origin）——指 zervi-rust api-gateway :3333。
 *
 * 打开后 stage3 读写真面（detail/permission/templates/blacklist + parse/ingest/list）
 * 走网关显式路由 → resume-service(:3003)；未迁移面（compliance/poetry/...）
 * 由网关 fallback 反代回 looma Flask :5200 —— 小程序侧仍是单源，无双源逻辑。
 *
 * ⚠️ 纪律：
 * · 默认必须 false —— 开发者本机联调临时置 true，提交前必须改回；
 *   config.test.ts 会拦截「带着 true 提交」（USE_LOCAL_GATEWAY 守卫断言）。
 * · 开发者工具：同机用 127.0.0.1；Surface/Mac/Dell 指栈主机局域网 IP
 *   （见 LOCAL_DEV.md / zervi-rust scripts/local-dev-up/FLEET.md）。真机预览仍受
 *   合法域名与明文 HTTP 限制，本路径优先开发者工具。
 * · 栈编排：pg :55433 + resume-service :3003 + api-gateway :3333
 *   （ZERVI_DEV_AUTH=1 时 /v1/auth/register|login 可拿 token）。
 */
const USE_LOCAL_GATEWAY = false
const LOCAL_GATEWAY_ORIGIN = 'http://127.0.0.1:3333'

// 显式 string：空串时若推断为字面量 ""，下游真值分支会收窄成 never
export const API_ORIGIN: string = USE_LOCAL_GATEWAY ? LOCAL_GATEWAY_ORIGIN : ''

export const API_BASE = API_ORIGIN
export const SAAS_BASE = API_ORIGIN

export const MISSION_XP: Record<string, number> = {
  personality: 50,
  share: 30,
  team: 80,
  match: 40,
}

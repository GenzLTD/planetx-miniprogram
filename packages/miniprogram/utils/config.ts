/**
 * 唯一对外源。
 *
 * 一个契约、一个账本，小程序只认这一个源。
 * 法兰克福 45.76.84.90 是预发闸门，内核和 looma 只听 127.0.0.1，
 * 开发者工具和手机都到不了那台机器的回环。
 * 在这一源给出 HTTPS 合法域名之前，这里保持空字符串：
 * 请求会失败，不会落到 ServBay、腾讯云或另一本账。
 */
// 显式 string：空串时若推断为字面量 ""，下游真值分支会收窄成 never
export const API_ORIGIN: string = ''

export const API_BASE = API_ORIGIN
export const SAAS_BASE = API_ORIGIN

export const MISSION_XP: Record<string, number> = {
  personality: 50,
  share: 30,
  team: 80,
  match: 40,
}

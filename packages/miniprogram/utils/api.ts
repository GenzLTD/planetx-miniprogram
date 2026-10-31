/**
 * API client for PlanetX miniprogram (重构版)
 * 
 * 使用 @looma/shared-core 的 createMiniApiClient + 工厂函数
 * 替代原有的 MiniApiClient 实现
 */

import {
  createMiniApiClient,
  createAuthApi,
  createGameApi,
  createChatApi,
  createTrustApi,
  createQuotaApi,
  createReferralApi,
  createComplianceApi,
  createPaymentApi,
  createTimelineApi,
  createResumeApi,
  LOOMA_TOKEN_KEY,
  type MiniApiClient,
  type WechatAuthRequest,
  type GameProfile,
  type ProfileSyncRequest,
  type MissionCompleteRequest,
  type MissionCompleteResponse,
  type CreateReferralRequest,
  type CreateFleetRequest,
  type JoinFleetRequest,
} from '@looma/shared-core'
import { eventBus } from './event-bus'
import { store } from './store'
import { API_BASE } from './config'

// ============================================================
// 单例客户端（所有 API 模块共享）
// ============================================================

const client = createMiniApiClient({
  baseURL: API_BASE,
  getToken: () => store.get('token'),
  onUnauthorized: () => {
    store.reset()
    wx.removeStorageSync(LOOMA_TOKEN_KEY)
    eventBus.emit('auth:expired')
  },
  tokenKey: LOOMA_TOKEN_KEY,
  timeout: 10000,
})

// 类型断言，将 MiniApiClient 转换为 any 以绕过类型检查
const apiClient = client as any

// ============================================================
// API 模块工厂（适配小程序现有接口）
// ============================================================

/** 网关 local_auth 回 `token`；小程序启动路径认 `access_token`。 */
function asAccessTokenSession(data: any) {
  if (!data || typeof data !== 'object') return data
  const access_token = data.access_token || data.token
  return access_token ? { ...data, access_token } : data
}

/**
 * 本机栈（ZERVI_DEV_AUTH）只签发 register/login。
 * /v1/auth/wechat 会 fallback 到 legacy stub：HTTP 200 且无 token。
 */
async function localGatewaySession() {
  const email = 'mp-devtools@local.test'
  const password = 'Passw0rd!'
  const login = async () =>
    asAccessTokenSession(await apiClient.post('/v1/auth/login', { email, password }))
  try {
    return await login()
  } catch {
    try {
      await apiClient.post('/v1/auth/register', { email, password, name: 'devtools' })
    } catch {
      // 409 等：账号可能已存在，继续 login
    }
    return await login()
  }
}

// Auth API 适配器（保持原有接口兼容性）
export const authApi = {
  // 使用 shared-core 的 wechat 方法，但保持原有名称 wechatLogin
  wechatLogin: async (code: string) => {
    const request: WechatAuthRequest = { code }
    const data: any = asAccessTokenSession(await createAuthApi(apiClient).wechat(request))
    if (data?.access_token) return data
    // 联调栈：wechat 未接线，走网关 local_auth（resume 面需要 JWT）
    if (API_BASE && data?.via === 'legacy-stub') {
      console.log('[auth] /v1/auth/wechat hit legacy-stub — using local_auth register/login')
      return await localGatewaySession()
    }
    return data
  },
  
  // 绑定邮箱（小程序特有）
  bindEmail: (code: string, email: string, password: string) => {
    return apiClient.post('/v1/auth/bind', { code, email, password })
  },
  
  // 其他方法直接使用 shared-core 的实现
  profile: () => createAuthApi(apiClient).profile(),
  refresh: () => createAuthApi(apiClient).refresh(),
  
  // 注意：shared-core 的 createAuthApi 不包含 bind 方法
  // 我们使用 client 直接调用
}

// Game API 适配器
export const gameApi = {
  // getProfile -> profile
  getProfile: () => createGameApi(apiClient).profile(),
  
  // syncProfile -> profileSync（支持 identity 持久化）
  syncProfile: (data: { personality_type?: string; personality_detail?: string; identity?: string }) => {
    const request: ProfileSyncRequest = {
      personality_type: data.personality_type,
      personality_detail: data.personality_detail,
      identity: data.identity,
    }
    return createGameApi(apiClient).profileSync(request)
  },
  
  // completeMission
  completeMission: (missionId: string, xpReward = 10) => {
    const request: MissionCompleteRequest = {
      mission_id: missionId,
      xp_reward: xpReward,
    }
    return createGameApi(apiClient).missionComplete(request)
  },

  // match — 舰队内 1:1 人格配对
  match: (payload?: { personalize?: boolean }) => createGameApi(apiClient).match(payload),

  // consensus — 共识列表 + 确认
  listConsensus: () => createGameApi(apiClient).listConsensus(),
  acknowledgeConsensus: (consensusId: string) =>
    createGameApi(apiClient).acknowledgeConsensus({ consensus_id: consensusId }),

  // createFleet
  createFleet: (name: string) => {
    const request: CreateFleetRequest = {
      name,
    }
    return createGameApi(apiClient).createFleet(request)
  },
  
  // joinFleet
  joinFleet: (code: string) => {
    // 假设 code 是 fleet_id
    const request: JoinFleetRequest = {
      fleet_id: code.toUpperCase(),
    }
    return createGameApi(apiClient).joinFleet(request)
  },
  
  // getMyFleet -> myFleet
  getMyFleet: () => createGameApi(apiClient).myFleet(),
}

// Chat/Ask API 适配器
export const askApi = createChatApi(apiClient)

// 求职：与 iOS 同一组 looma 接口
export const careerApi = {
  parse: (text: string) =>
    apiClient.post('/v1/resume/parse', { text }, { timeout: 120000 }),
  match: (resumeText: string) =>
    apiClient.post('/v1/jobs/match', { resume_text: resumeText }, { timeout: 120000 }),
  jobs: () => apiClient.get('/v1/jobs/list'),
  resumes: () => apiClient.get('/v1/resume/list'),
}

// Quota API 适配器
export const quotaApi = {
  // getQuota -> get
  getQuota: () => createQuotaApi(apiClient).get(),
}

// Referral API 适配器
export const referralApi = {
  // create 方法适配
  create: (purpose: 'referral' | 'profile_share' = 'referral') => {
    const request: CreateReferralRequest = { purpose }
    return createReferralApi(apiClient).create(request)
  },
  
  // use 方法
  use: (code: string) => createReferralApi(apiClient).use(code),
  
  // profileView 方法
  profileView: (code: string) => createReferralApi(apiClient).profileView(code),
}

// Compliance API 适配器
export const complianceApi = createComplianceApi(apiClient)

// Payment API 适配器
export const paymentApi = createPaymentApi(apiClient)

export const timelineApi = createTimelineApi(apiClient)

// Trust API 适配器
export const trustApi = createTrustApi(apiClient)

// Resume API（resume.v1.json；阶段3 前 stub 端点用 isNotImplemented 降级）
export const resumeApi = createResumeApi(apiClient)

// ============================================================
// 类型导出（向后兼容）
// ============================================================

export type { MiniApiClient }
export { API_BASE }

// ============================================================
// 默认导出（保持向后兼容）
// ============================================================

export default {
  authApi,
  gameApi,
  askApi,
  quotaApi,
  referralApi,
  complianceApi,
  paymentApi,
  trustApi,
  timelineApi,
  resumeApi,
}

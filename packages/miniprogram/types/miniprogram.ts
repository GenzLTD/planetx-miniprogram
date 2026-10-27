/**
 * 小程序扩展类型定义
 * 扩展 shared-core 基础类型，添加小程序特有字段
 * 避免类型重复定义，保持单一真源
 */

import type { GameProfile as BaseGameProfile } from '@looma/shared-core'

// 小程序特有的 GameProfile 扩展
export interface MiniprogramGameProfile extends BaseGameProfile {
  team_size: number
  fleet_members: string[]
}

// 其他小程序特有的类型扩展可以在这里定义
export interface AppEvent {
  type: 'auth:login' | 'auth:logout' | 'auth:expired' | 'profile:loaded' | 'xp:added' | 'achievement'
  data?: any
}

// 小程序专用的状态管理类型
export interface StoreState {
  token: string | null
  user: any | null
  identity?: string
  personalityType?: any
  level: number
  xp: number
  xpToNext: number
  missionsCompleted: string[]
  fleet: any | null
  teamSize: number
  fleetMembers: string[]
  quizStep: number
  quizTraitCounts: Record<string, number>
  achievement: { title: string; desc: string } | null
}

// 小程序特有的配置类型
export interface MiniprogramConfig {
  API_BASE: string
  APP_ID: string
  DEBUG: boolean
}

// 工具函数：将 shared-core 的 GameProfile 转换为小程序兼容格式
export function adaptGameProfile(profile: BaseGameProfile): MiniprogramGameProfile {
  return {
    ...profile,
    // 确保所有基础字段存在
    personality_detail: profile.personality_detail || '',
    missions_completed: profile.missions_completed || 0,
    total_mission_xp: profile.total_mission_xp || 0,
    updated_at: profile.updated_at || new Date().toISOString(),
    // 添加小程序特有字段
    team_size: 0,
    fleet_members: [],
  }
}
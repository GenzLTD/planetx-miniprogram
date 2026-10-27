/**
 * PlanetX Quiz Constants
 * 直接使用 @looma/shared-core 的常量和类型
 */

// 从 shared-core 导入常量和类型
import {
  QUIZ_QUESTIONS,
  PERSONALITY_MAP,
  PERSONALITY_FALLBACK_MAP,
  computePersonality,
  hydratePersonality,
  getShareText,
} from '@looma/shared-core'

import type { 
  PlanetXPersonalityType,
  PlanetXQuizOption,
  PlanetXQuizQuestion,
  PlanetXTraitKey 
} from '@looma/shared-core'

// 重新导出共享核心的常量
export { QUIZ_QUESTIONS, computePersonality, hydratePersonality, getShareText }

// ============ 分享文案（小程序特有） ============
export function getShareTextMini(p: PlanetXPersonalityType, inviteUrl: string): string {
  return `🪐 我的星际人格是「${p.name}」！\n"${p.tagline}"\n\n👉 测测你的是什么星球身份？\n${inviteUrl}`
}

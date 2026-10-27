/**
 * Miniprogram PIPL consent helper — wx.showModal + compliance API (重构版)
 * 
 * 使用 @looma/shared-core 的 CONSENT_SCOPE_LABELS 和 CONSENT_SCOPE_DESCRIPTIONS
 */

import { complianceApi } from './api'
import {
  CONSENT_SCOPE_LABELS,
  CONSENT_SCOPE_DESCRIPTIONS,
  type ConsentScope,
} from '@looma/shared-core'

const cache: Partial<Record<ConsentScope, boolean>> = {}

export async function ensureConsent(scope: ConsentScope): Promise<boolean> {
  if (cache[scope]) return true

  try {
    const status = await complianceApi.status() as { status?: Record<string, boolean> }
    if (status.status?.[scope]) {
      cache[scope] = true
      return true
    }
  } catch {
    return false
  }

  return new Promise((resolve) => {
    wx.showModal({
      title: `需要授权：${CONSENT_SCOPE_LABELS[scope]}`,
      content: CONSENT_SCOPE_DESCRIPTIONS[scope],
      confirmText: '同意',
      showCancel: true,
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) {
          resolve(false)
          return
        }
        try {
          await complianceApi.grant(scope)
          cache[scope] = true
          resolve(true)
        } catch {
          resolve(false)
        }
      },
      fail: () => resolve(false),
    })
  })
}

// 简化的 hasConsent 函数
export function hasConsent(scope: ConsentScope): boolean {
  return !!cache[scope]
}

// 简化的 isConsentRequiredError 函数
export function isConsentRequiredError(error: any): boolean {
  return error?.code === 403 && error?.message?.includes('consent')
}

// 导出类型
export type { ConsentScope }
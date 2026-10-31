/**
 * 隐私政策 / 用户协议 / 授权撤回 / 注销申请
 * 提审要求：完整政策可读；撤权可点；注销流程可验证（服务端注销 API 未就绪时走联系运营 + 清本地）。
 */
import {
  LEGAL,
  LEGAL_PRIVACY_FULL,
  LEGAL_TERMS_SUMMARY,
  CONSENT_SCOPE_LABELS,
  type ConsentScope,
} from '@looma/shared-core'
import { complianceApi } from '../../utils/api'
import { clearConsentCache } from '../../utils/consent'
import { store } from '../../utils/store'
import { eventBus } from '../../utils/event-bus'

/** 产品面可撤回的主授权（细粒度已并入 package 的不单列） */
const REVOCABLE_SCOPES: ConsentScope[] = [
  'jobseeker_core',
  'credit_query',
  'report_share',
  'ask_rag',
  'navigator_memory',
  'profile_share',
  'mbti_analyze',
]

Page({
  data: {
    operator: LEGAL.operatorName,
    contact: LEGAL.operatorContact,
    privacyFull: LEGAL_PRIVACY_FULL,
    terms: LEGAL_TERMS_SUMMARY,
    scopes: [] as Array<{ scope: ConsentScope; label: string; granted: boolean }>,
    loadingScopes: false,
  },

  onShow() {
    this.refreshScopes()
  },

  async refreshScopes() {
    this.setData({ loadingScopes: true })
    try {
      const status = (await complianceApi.status()) as {
        status?: Partial<Record<ConsentScope, boolean>>
      }
      const map = status.status || {}
      const scopes = REVOCABLE_SCOPES.map((scope) => ({
        scope,
        label: CONSENT_SCOPE_LABELS[scope],
        granted: !!map[scope],
      }))
      this.setData({ scopes, loadingScopes: false })
    } catch {
      this.setData({
        scopes: REVOCABLE_SCOPES.map((scope) => ({
          scope,
          label: CONSENT_SCOPE_LABELS[scope],
          granted: false,
        })),
        loadingScopes: false,
      })
    }
  },

  handleRevoke(e: any) {
    const scope = String(e.currentTarget?.dataset?.scope || '') as ConsentScope
    if (!scope) return
    const label = CONSENT_SCOPE_LABELS[scope] || scope
    wx.showModal({
      title: '撤回授权',
      content: `确定撤回「${label}」？撤回后相关功能将不可用，不影响撤回前已完成的处理。`,
      confirmText: '撤回',
      confirmColor: '#ff4444',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await complianceApi.revoke(scope)
          clearConsentCache(scope)
          wx.showToast({ title: '已撤回', icon: 'success' })
          this.refreshScopes()
        } catch (err: any) {
          wx.showToast({ title: err?.message || '撤回失败', icon: 'none' })
        }
      },
    })
  },

  handleCopyContact() {
    wx.setClipboardData({
      data: LEGAL.operatorContact,
      success: () => wx.showToast({ title: '邮箱已复制', icon: 'success' }),
    })
  },

  /**
   * 注销账号：服务端尚无统一 DELETE 时，清本地会话 + 引导邮件运营完成服务端注销。
   * 提审材料须与此口径一致；后端就绪后改为调用正式注销 API。
   */
  handleDeleteAccount() {
    wx.showModal({
      title: '申请注销账号',
      content:
        `将清除本机登录态与本地授权缓存，并复制运营邮箱（${LEGAL.operatorContact}）。` +
        '请邮件申请服务端注销；我们将对标识信息匿名化处理。是否继续？',
      confirmText: '继续注销',
      confirmColor: '#ff4444',
      success: async (res) => {
        if (!res.confirm) return
        // 尽力撤回已知授权（失败不阻断本地清理）
        for (const scope of REVOCABLE_SCOPES) {
          try {
            await complianceApi.revoke(scope)
          } catch {
            /* ignore */
          }
        }
        clearConsentCache()
        store.reset()
        wx.removeStorageSync('looma_token')
        wx.removeStorageSync(LEGAL.privacyAcceptedKey)
        wx.removeStorageSync(LEGAL.ageConfirmedKey)
        wx.setClipboardData({ data: LEGAL.operatorContact })
        eventBus.emit('auth:logout')
        wx.showModal({
          title: '本机已退出',
          content:
            '请将复制的邮箱用于发送注销申请（主题：账号注销）。服务端注销接口上线后将改为应用内一键完成。',
          showCancel: false,
          success: () => {
            wx.reLaunch({ url: '/pages/splash/index' })
          },
        })
      },
    })
  },
})

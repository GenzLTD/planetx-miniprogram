/**
 * Pricing Page — 会员升级页
 *
 * 登录在启动页完成（wx.login → /v1/auth/wechat）。
 * 这里从下单接着走，区域写在这一单上：
 *   Stub：POST /v1/payment/wechat/order?region=CN
 *         → POST /v1/payment/wechat/notify-simulate → GET /v1/payment/status
 *   生产：同一下单 → wx.requestPayment → 轮询 status → refresh JWT
 */
import { paymentApi, authApi } from '../../utils/api'
import { store } from '../../utils/store'
import { LOOMA_TOKEN_KEY } from '@looma/shared-core'
import type { PaymentPlan, PlansResponse, ProvidersResponse, WechatJsapiParams } from '@looma/shared-core'

const TIER_LABELS: Record<string, string> = {
  free: '免费版',
  supporter: '赞助版',
  pro: '专业版',
  enterprise: '企业版',
}

const TIER_ORDER: Record<string, number> = {
  free: 0,
  supporter: 1,
  pro: 2,
  enterprise: 3,
}

interface PricingCard {
  tier: string
  name: string
  price: string
  features: string[]
  isCurrent: boolean
  isUpgradable: boolean
  buttonText: string
  disabled: boolean
}

Page({
  data: {
    loading: true,
    /** 缺省 false：避免首屏误显「内测/模拟」；以 providers.stub_mode 为准 */
    stubMode: false,
    /** 首发策略：stub / 未接商户时关闭付费，禁止用户走模拟回调 */
    paymentsClosed: true,
    currentTier: 'free' as string,
    currentTierLabel: '免费版',
    plans: [] as PricingCard[],
    selectedTier: '' as string,
    paying: false,
    polling: false,
    payStep: '' as '' | 'order' | 'notify' | 'status' | 'done',
    resultModal: false,
    resultTitle: '',
    resultDesc: '',
    resultOk: false,
  },

  onLoad() {
    this.loadPlans()
  },

  onShow() {
    // 每次显示时刷新当前 tier
    this.refreshCurrentTier()
  },

  refreshCurrentTier() {
    const s = store.getAll()
    const user = s.user
    const tier = user?.tier || 'free'
    this.setData({
      currentTier: tier,
      currentTierLabel: TIER_LABELS[tier] || tier,
    })
  },

  async loadPlans() {
    this.setData({ loading: true })
    try {
      // stub_mode 的权威源是 /v1/payment/providers：/plans 是公开面，契约刻意不带该字段
      // （守卫见 backend/tests/test_payment_guard.py）。providers 单独失败不拦定价加载。
      const [data, providers]: [PlansResponse, ProvidersResponse | null] = await Promise.all([
        paymentApi.plans('CN'),
        paymentApi.providers('CN').catch(() => null),
      ])
      // 拿不到 providers 时缺省 false：宁可让用户看到真实支付报错，也不把生产误判成模拟支付
      const stubMode = providers?.stub_mode === true
      // 首发：stub（模拟回调）未接商户 → 关闭付费入口；仅真实 wx.requestPayment 路径可开放
      const paymentsClosed = stubMode === true
      const currentTier = this.data.currentTier
      const currentOrder = TIER_ORDER[currentTier] ?? 0

      const cards: PricingCard[] = data.plans.map((plan: PaymentPlan) => {
        const tierOrder = TIER_ORDER[plan.tier] ?? 0
        const isCurrent = plan.tier === currentTier
        const isLower = tierOrder <= currentOrder
        const upgradable = plan.upgradable !== false

        let buttonText = ''
        let disabled = true

        if (isCurrent) {
          buttonText = '当前版本'
          disabled = true
        } else if (isLower) {
          buttonText = '已拥有更高版本'
          disabled = true
        } else if (paymentsClosed && plan.tier !== 'free') {
          buttonText = '暂未开放付费'
          disabled = true
        } else if (!stubMode && plan.tier !== 'free') {
          buttonText = `微信支付 ¥${plan.price_monthly}`
          disabled = false
        } else {
          buttonText = '—'
          disabled = true
        }

        return {
          tier: plan.tier,
          name: plan.name,
          price: plan.price_monthly > 0 ? `¥${plan.price_monthly}/月` : '免费',
          features: plan.features || [],
          isCurrent,
          isUpgradable: upgradable,
          buttonText,
          disabled,
        }
      })

      this.setData({
        loading: false,
        stubMode,
        paymentsClosed,
        plans: cards,
      })
    } catch (err: any) {
      this.setData({ loading: false })
      wx.showToast({
        title: '加载套餐失败',
        icon: 'none',
      })
      console.error('[Pricing] loadPlans failed:', err)
    }
  },

  /** 点击升级按钮 */
  async handleUpgrade(e: any) {
    const tier = e.currentTarget?.dataset?.tier
    if (!tier || this.data.paying) return

    // 提审 / 首发：禁止模拟支付进用户路径
    if (this.data.paymentsClosed || this.data.stubMode) {
      wx.showToast({ title: '会员付费暂未开放', icon: 'none' })
      return
    }

    this.setData({ selectedTier: tier, paying: true })

    try {
      await this.doWechatPay(tier)
    } catch (err: any) {
      this.setData({ paying: false, polling: false, payStep: '' })
      const msg = err?.message || err?.errMsg || '支付失败，请重试'
      wx.showToast({ title: msg, icon: 'none', duration: 3000 })
      console.error('[Pricing] upgrade failed:', err)
    }
  },

  /** 商户号下来前：下单 → 模拟微信回调 → 核对订阅。不走直接升级。 */
  async doStubPay(tier: string) {
    this.setData({ payStep: 'order' })
    const order: any = await paymentApi.wechatOrder(
      {
        tier: tier as 'supporter' | 'pro',
        trade_type: 'JSAPI',
      },
      'CN',
    )
    if (!order?.out_trade_no) {
      throw new Error('未获取到订单号，请重试')
    }

    this.setData({ payStep: 'notify' })
    await paymentApi.wechatNotifySimulate(order.out_trade_no)

    this.setData({ payStep: 'status', polling: true })
    await this.pollAndRefresh()

    this.setData({ paying: false, polling: false, payStep: 'done' })
    this.refreshCurrentTier()
    this.loadPlans()

    wx.showToast({ title: '升级成功！', icon: 'success' })
  },

  /** 生产模式：JSAPI 微信支付流程 */
  async doWechatPay(tier: string) {
    this.setData({ payStep: 'order' })
    const order: any = await paymentApi.wechatOrder(
      {
        tier: tier as 'supporter' | 'pro',
        trade_type: 'JSAPI',
      },
      'CN',
    )

    const jsapiParams: WechatJsapiParams | undefined = order?.jsapi_params
    if (!jsapiParams) {
      throw new Error('未获取到支付参数，请重试')
    }

    this.setData({ payStep: 'notify' })
    await new Promise<void>((resolve, reject) => {
      wx.requestPayment({
        timeStamp: jsapiParams.timeStamp,
        nonceStr: jsapiParams.nonceStr,
        package: jsapiParams.package,
        signType: jsapiParams.signType || 'RSA',
        paySign: jsapiParams.paySign,
        success: () => resolve(),
        fail: (err) => reject(err),
      })
    })

    this.setData({ payStep: 'status', polling: true })
    await this.pollAndRefresh()

    this.setData({ paying: false, polling: false, payStep: 'done' })
    this.refreshCurrentTier()
    this.loadPlans()

    wx.showToast({ title: '支付成功！', icon: 'success' })
  },

  /** 轮询 /v1/payment/status，确认 tier 已更新后刷新 JWT */
  async pollAndRefresh() {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1500))

      try {
        const status: any = await paymentApi.status()
        if (status.tier !== 'free' && status.tier !== this.data.currentTier) {
          // tier 已变化，刷新 JWT
          await this.refreshJWT()
          return
        }
      } catch {
        // 继续轮询
      }
    }
    // 超时也尝试刷新一次
    await this.refreshJWT()
  },

  /** 调用 /v1/auth/refresh 拿新 token */
  async refreshJWT() {
    try {
      const res = await authApi.refresh()
      if (res?.access_token) {
        store.set('token', res.access_token)
        wx.setStorageSync(LOOMA_TOKEN_KEY, res.access_token)
      }
      // 刷新 user profile
      const profile = await authApi.profile()
      store.set('user', profile as any)
    } catch {
      console.warn('[Pricing] JWT refresh failed')
    }
  },

  /** 关闭支付结果弹窗 */
  handleCloseModal() {
    this.setData({ resultModal: false })
  },

  onShareAppMessage() {
    return {
      title: 'PlanetX 会员升级 — 解锁更多职业探索能力！',
      path: '/pages/pricing/index',
    }
  },
})

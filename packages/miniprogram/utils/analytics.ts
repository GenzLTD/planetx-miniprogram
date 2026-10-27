/**
 * Miniprogram product analytics — batch events to backend.
 */
import { API_BASE } from './config'

const SESSION_KEY = 'looma_analytics_session'

function getSessionId(): string {
  try {
    let id = wx.getStorageSync(SESSION_KEY) as string
    if (!id) {
      id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      wx.setStorageSync(SESSION_KEY, id)
    }
    return id
  } catch {
    return `sess_${Date.now()}`
  }
}

export function trackMiniEvent(
  eventName: string,
  props?: { share_code?: string; properties?: Record<string, unknown> },
): void {
  const token = wx.getStorageSync('looma_token') as string | undefined
  wx.request({
    url: `${API_BASE}/v1/analytics/events`,
    method: 'POST',
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-Platform': 'planetx_mp',
    },
    data: {
      events: [
        {
          event_name: eventName,
          session_id: getSessionId(),
          platform: 'planetx_mp',
          share_code: props?.share_code,
          properties: props?.properties,
        },
      ],
    },
    fail: () => {},
  })
}

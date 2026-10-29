import { getNavBarMetrics, resetNavBarMetricsCache } from '../navigation'

const mockGetWindowInfo = (global as any).wx.getWindowInfo
const mockGetDeviceInfo = (global as any).wx.getDeviceInfo
const mockGetRect = (global as any).wx.getMenuButtonBoundingClientRect

describe('getNavBarMetrics', () => {
  beforeEach(() => {
    resetNavBarMetricsCache()
    jest.clearAllMocks()
  })

  it('胶囊信息完整时，导航高度 = (top - statusBar) * 2 + capsuleHeight', () => {
    mockGetWindowInfo.mockReturnValue({ statusBarHeight: 20 })
    mockGetDeviceInfo.mockReturnValue({ platform: 'devtools' })
    mockGetRect.mockReturnValue({ top: 24, height: 32 })

    const m = getNavBarMetrics()
    expect(m.statusBarHeight).toBe(20)
    expect(m.menuButtonHeight).toBe(32)
    expect(m.navigationBarHeight).toBe((24 - 20) * 2 + 32) // 40
    expect(m.totalHeight).toBe(20 + 40)
  })

  it('取不到胶囊时 Android 兜底 48', () => {
    mockGetWindowInfo.mockReturnValue({ statusBarHeight: 24 })
    mockGetDeviceInfo.mockReturnValue({ platform: 'android' })
    mockGetRect.mockReturnValue({ top: 0, height: 0 })

    const m = getNavBarMetrics()
    expect(m.navigationBarHeight).toBe(48)
    expect(m.menuButtonHeight).toBe(32)
  })

  it('取不到胶囊时非 Android 兜底 40', () => {
    mockGetWindowInfo.mockReturnValue({ statusBarHeight: 20 })
    mockGetDeviceInfo.mockReturnValue({ platform: 'ios' })
    mockGetRect.mockReturnValue(undefined)

    const m = getNavBarMetrics()
    expect(m.navigationBarHeight).toBe(40)
  })

  it('wx API 抛异常时走兜底不崩溃', () => {
    mockGetWindowInfo.mockImplementation(() => {
      throw new Error('低版本基础库')
    })
    mockGetDeviceInfo.mockImplementation(() => {
      throw new Error('低版本基础库')
    })
    mockGetRect.mockImplementation(() => {
      throw new Error('低版本基础库')
    })

    const m = getNavBarMetrics()
    expect(m.statusBarHeight).toBe(20) // 默认值
    expect(m.menuButtonHeight).toBe(32)
  })

  it('缓存生效：多次调用只探测一次', () => {
    mockGetWindowInfo.mockReturnValue({ statusBarHeight: 20 })
    mockGetDeviceInfo.mockReturnValue({ platform: 'devtools' })
    mockGetRect.mockReturnValue({ top: 24, height: 32 })

    getNavBarMetrics()
    getNavBarMetrics()
    expect(mockGetWindowInfo).toHaveBeenCalledTimes(1)

    resetNavBarMetricsCache()
    getNavBarMetrics()
    expect(mockGetWindowInfo).toHaveBeenCalledTimes(2)
  })
})

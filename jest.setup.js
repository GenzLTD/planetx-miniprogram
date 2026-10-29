/**
 * Jest 全局设置 — 模拟微信小程序运行时。
 * 范式取自 zervi.test/miniprogram-4 的 jest.setup.js，按需扩充。
 */

const { TextEncoder, TextDecoder } = require('util')

const wxMock = {
  // 网络
  request: jest.fn(),
  uploadFile: jest.fn(),
  downloadFile: jest.fn(),
  // 界面
  showToast: jest.fn(),
  showModal: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  // 存储
  getStorageSync: jest.fn(() => ''),
  setStorageSync: jest.fn(),
  removeStorageSync: jest.fn(),
  clearStorageSync: jest.fn(),
  // 导航
  redirectTo: jest.fn(),
  reLaunch: jest.fn(),
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  switchTab: jest.fn(),
  // 设备（navigation.ts 依赖）
  getWindowInfo: jest.fn(() => ({
    statusBarHeight: 20,
    windowWidth: 375,
    windowHeight: 667,
  })),
  getDeviceInfo: jest.fn(() => ({
    platform: 'devtools',
    version: '3.9.2',
    system: 'iOS 15.0',
  })),
  getMenuButtonBoundingClientRect: jest.fn(() => ({
    top: 24,
    height: 32,
    width: 87,
    right: 360,
    bottom: 56,
    left: 273,
  })),
  // 登录
  login: jest.fn(),
}

global.wx = wxMock

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// getCurrentPages（app.ts 用，单测目前不触达，防御性提供）
global.getCurrentPages = jest.fn(() => [])

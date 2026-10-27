/**
 * WeChat Miniprogram API Type Definitions
 * Complete type declarations for wx global API.
 */

// App interface
interface IAppOption {
  globalData: {
    token: string | null
    userInfo: any
    apiBase: string
    device: any
  }
  wechatLogin(): void
  loadProfile(): void
  getAuthHeader(): Record<string, string>
}

// Global wx object with comprehensive API
declare const wx: {
  // Storage
  getStorageSync(key: string): any
  setStorageSync(key: string, data: any): void
  removeStorageSync(key: string): void
  
  // Login
  login(options: LoginOptions): void
  
  // Navigation
  switchTab(options: SwitchTabOptions): void
  navigateBack(options?: NavigateBackOptions): void
  redirectTo(options: RedirectToOptions): void
  navigateTo(options: NavigateToOptions): void
  reLaunch(options: ReLaunchOptions): void
  
  // UI
  showToast(options: ShowToastOptions): void
  showLoading(options: ShowLoadingOptions): void
  hideLoading(): void
  showModal(options: ShowModalOptions): void
  showActionSheet(options: ShowActionSheetOptions): void
  
  // Clipboard
  setClipboardData(options: SetClipboardDataOption): void
  getClipboardData(options?: GetClipboardDataOption): void
  
  // Route
  onAppRoute(callback: (options: AppRouteOptions) => void): void
  offAppRoute(callback: (options: AppRouteOptions) => void): void
  
  // Network
  request(options: RequestOptions): RequestTask
  uploadFile(options: UploadFileOption): UploadTask
  
  // System info
  getSystemInfoSync(): SystemInfo
  getSystemInfo(options: GetSystemInfoOptions): void
  
  // Other common APIs
  getSetting(options: GetSettingOptions): void
  authorize(options: AuthorizeOptions): void
  getUserProfile(options: GetUserProfileOptions): void
  getNetworkType(options: GetNetworkTypeOptions): void
  onNetworkStatusChange(callback: (res: NetworkStatusChangeResult) => void): void
  
  // Device info (3.7.0+ — HarmonyOS compatible)
  getDeviceInfo(): { platform: string; brand: string; model: string }
  getAppBaseInfo(): { SDKVersion: string; language: string; version: string }
  getSystemSetting(): { windowWidth: number; windowHeight: number }
  
  // Share
  showShareMenu(options: { withShareTicket?: boolean; menus?: string[] }): void
  
  // Payment
  requestPayment(options: RequestPaymentOptions): void
  
  // Selector
  createSelectorQuery(): any
}

// Option types
interface LoginOptions {
  timeout?: number;
  success?: (res: { code: string }) => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

interface SwitchTabOptions {
  url: string;
  success?: () => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

interface NavigateBackOptions {
  delta?: number;
  success?: () => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

interface RedirectToOptions {
  url: string;
  success?: () => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

interface NavigateToOptions {
  url: string;
  events?: Record<string, Function>;
  success?: (res: { eventChannel: EventChannel }) => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

interface ReLaunchOptions {
  url: string;
  success?: () => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

interface ShowToastOptions {
  title: string;
  icon?: 'success' | 'loading' | 'none' | 'error';
  image?: string;
  duration?: number;
  mask?: boolean;
  success?: () => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

interface ShowLoadingOptions {
  title: string;
  mask?: boolean;
  success?: () => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

interface ShowModalOptions {
  title?: string;
  content?: string;
  showCancel?: boolean;
  cancelText?: string;
  cancelColor?: string;
  confirmText?: string;
  confirmColor?: string;
  success?: (res: { confirm: boolean; cancel: boolean }) => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

interface ShowActionSheetOptions {
  itemList: string[];
  itemColor?: string;
  success?: (res: { tapIndex: number }) => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

interface SetClipboardDataOption {
  data: string;
  success?: () => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

interface GetClipboardDataOption {
  success?: (res: { data: string }) => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

interface AppRouteOptions {
  path: string;
  query?: Record<string, any>;
}

interface RequestOptions {
  url: string;
  data?: any;
  header?: Record<string, string>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'HEAD';
  dataType?: 'json' | 'text' | 'arraybuffer';
  responseType?: 'text' | 'arraybuffer';
  timeout?: number;
  success?: (res: RequestSuccessCallbackResult) => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

interface RequestSuccessCallbackResult {
  data: any;
  statusCode: number;
  header: Record<string, string>;
  cookies?: string[];
}

interface RequestTask {
  abort(): void;
  onHeadersReceived(callback: (res: { header: Record<string, string> }) => void): void;
  offHeadersReceived(callback: (res: { header: Record<string, string> }) => void): void;
}

interface UploadFileOption {
  url: string;
  filePath: string;
  name: string;
  header?: Record<string, string>;
  formData?: Record<string, any>;
  success?: (res: UploadFileSuccessCallbackResult) => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

interface UploadFileSuccessCallbackResult {
  data: string;
  statusCode: number;
}

interface UploadTask {
  abort(): void;
  onProgressUpdate(callback: (res: { progress: number; totalBytesSent: number; totalBytesExpectedToSend: number }) => void): void;
  offProgressUpdate(callback: (res: { progress: number; totalBytesSent: number; totalBytesExpectedToSend: number }) => void): void;
}

interface SystemInfo {
  brand: string;
  model: string;
  pixelRatio: number;
  screenWidth: number;
  screenHeight: number;
  windowWidth: number;
  windowHeight: number;
  statusBarHeight: number;
  language: string;
  version: string;
  system: string;
  platform: string;
  fontSizeSetting: number;
  SDKVersion: string;
  benchmarkLevel?: number;
  albumAuthorized?: boolean;
  cameraAuthorized?: boolean;
  locationAuthorized?: boolean;
  microphoneAuthorized?: boolean;
  notificationAuthorized?: boolean;
  notificationAlertAuthorized?: boolean;
  notificationBadgeAuthorized?: boolean;
  notificationSoundAuthorized?: boolean;
  bluetoothEnabled?: boolean;
  locationEnabled?: boolean;
  wifiEnabled?: boolean;
  safeArea?: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
  };
}

interface GetSystemInfoOptions {
  success?: (res: SystemInfo) => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

interface GetSettingOptions {
  success?: (res: { authSetting: Record<string, boolean> }) => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

interface AuthorizeOptions {
  scope: string;
  success?: () => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

interface GetUserProfileOptions {
  desc: string;
  success?: (res: { userInfo: Record<string, any>; rawData: string; signature: string; encryptedData: string; iv: string }) => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

interface GetNetworkTypeOptions {
  success?: (res: { networkType: string }) => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

interface NetworkStatusChangeResult {
  isConnected: boolean;
  networkType: string;
}

interface EventChannel {
  emit(eventName: string, ...args: any[]): void;
  on(eventName: string, callback: Function): void;
  once(eventName: string, callback: Function): void;
  off(eventName: string, callback?: Function): void;
}

// Payment
interface RequestPaymentOptions {
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: string;
  paySign: string;
  success?: (res: any) => void;
  fail?: (err: any) => void;
  complete?: () => void;
}

// Global app/page functions
declare const App: (opts: any) => void
declare const Page: (opts: any) => void
declare const Component: (opts: any) => void
declare const getApp: () => IAppOption
declare const getCurrentPages: () => any[]
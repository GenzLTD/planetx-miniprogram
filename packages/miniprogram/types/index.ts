/**
 * PlanetX Miniprogram - Types
 * 导入 @looma/shared-core 作为单一真源，只定义小程序特有类型
 * 避免重复定义，保持类型一致性
 */

// 从 shared-core 导入基础类型
import type { GameProfile as SharedCoreGameProfile } from '@looma/shared-core'

export type {
  // Auth
  Tier,
  Role,
  User,
  UserProfile,
  AuthResponse,
  LoginResponse,
  RegisterResponse,
  WechatLoginResponse,
  LoginRequest,
  RegisterRequest,
  WechatAuthRequest,
  WechatAuthResponse,
  QuotaRecord,
  QuotaResponse,
  TokenPayload,
  
  // Game
  Identity,
  PersonalityType,
  TraitKey,
  QuizQuestion,
  QuizOption,
  RankName,
  MissionId,
  Mission,
  GameProfile as SharedCoreGameProfile,
  Fleet,
  FleetMember,
  GameScreen,
  SharePlatform,
  
  // PlanetX game
  Identity as PlanetXIdentity,
  TraitKey as PlanetXTraitKey,
  PersonalityType as PlanetXPersonalityType,
  QuizOption as PlanetXQuizOption,
  QuizQuestion as PlanetXQuizQuestion,
  PlanetXRankName,
  PlanetXMissionId,
  PlanetXGameScreen,
  PlanetXFleet,
  
  // Chat
  ChatMessage,
  DocSource,
  AskRequest,
  AskResponse,
  StreamCallbacks,
  RateRequest,
  LastQueryResponse,
  
  // Resume
  ParsedResume,
  ResumeExperience,
  ResumeEducation,
  ResumeProject,
  ResumeUploadResult,
  Job,
  JobMatchItem,
  JobMatchResult,
  JobMatchRequest,
  JobMatchResponse,
  ParsedJob,
  JobUploadResult,
  JobMatchScore,
  CreditAnalysis,
  CheckCompanyRequest,
  
  // Enterprise
  CreateEnterpriseRequest,
  JoinEnterpriseRequest,
  EnterpriseProfile,
  Candidate,
  AddCandidateRequest,
  AddCandidateResponse,
  
  // Referral
  CreateReferralRequest,
  CreateReferralResponse,
  UseReferralRequest,
  UseReferralResponse,
  ReferralCodeEntry,
  ProfileShareView,
  ImportShareRequest,
  
  // Misc
  Report,
  ReportType,
  ReportRequest,
  GenerateReportRequest,
  HealthStatus,
  PaginatedResponse,
  ApiError as ApiErrorType,
  Poem,
  
  // Payment
  PaymentPlan,
  PlansResponse,
  PaymentStatus,
  UpgradeRequest,
  UpgradeResponse,
  PaymentRegion,
  
  // Common
  ApiResponse,
  Pagination,
  PaginatedResponse as CommonPaginatedResponse,
  
  // Narrative
  NarrativeDomain,
  NarrativeEventType,
  NarrativeStartRequest,
  NarrativeStartResponse,
  NarrativeEventRequest,
  NarrativeEndRequest,
  NarrativeFeedbackRequest,
  NarrativeStats,
  Act1DomainSummary,
  Act1Step,
  ConvergenceTexture,
  Act1ContentResponse,
  Act1ChoiceOption,
  Act1SessionState,
  Act1AdvanceResponse,
  Act1ChoiceRequest,
  Act1ChoiceResponse,
  Act1InitRequest,
  
  // Brand
  BrandId,
  BrandConfig,
  
  // Analytics
  AnalyticsPlatform,
  ClosedLoopEventName,
  ProductEventPayload,
  MicroFeedbackContext,
  MicroFeedbackRequest,
  FunnelStatsResponse,
  
  // Compliance
  ConsentScope,
  ConsentRecord,
  ConsentStatusResponse,
  ConsentGrantResponse,
  ConsentRequiredResponse,
  ConsentRequiredError,
} from '@looma/shared-core'

// 从 shared-core 导入常量
export {
  // Game
  RANK_NAMES,
  getRankName,
  
  // PlanetX game
  IDENTITY_LABELS,
  getPlanetXRankName,
  
  // Quiz
  QUIZ_QUESTIONS,
  
  // Personality
  PERSONALITY_MAP,
  PERSONALITY_FALLBACK_MAP,
  
  // Routes
  API_ROUTES,
  
  // Quota
  QUOTA_LIMITS,
  TIER_ORDER,
  TOP_N_LIMIT,
  RESOURCE_ASK,
  RESOURCE_JOB_MATCH,
  RESOURCE_RESUME_PARSE,
  RESOURCE_RAG,
  
  // Analytics
  CLOSED_LOOP_EVENTS,
  MICRO_FEEDBACK_CONTEXT,
  ANALYTICS_SESSION_KEY,
  
  // Compliance
  CONSENT_SCOPE_LABELS,
  CONSENT_SCOPE_DESCRIPTIONS,
  
  // Payment
  PAYMENT_SUPPORTER_PRICES,
  PAYMENT_PRO_PRICES,
  DEPRECATED_TIER_ALIASES,
  
  // Brand
  BRAND,
  BRAND_PLANETX,
  BRAND_SAAS,
  
  // Utils
  computePersonality,
  hydratePersonality,
  getShareText,
  ensureConsent,
  grantConsent,
  hasConsent,
  isConsentRequiredError,
  initAnalytics,
  getAnalyticsSessionId,
  trackEvent,
  flushEvents,
  formatDate,
  formatDateTime,
  formatNumber,
  formatRelativeTime,
  truncate,
  formatPercent,
  clamp,
  isValidEmail,
  isPasswordStrong,
  isNotEmpty,
  isValidPhone,
  isValidUrl,
  
  // Token key
  LOOMA_TOKEN_KEY,
} from '@looma/shared-core'

// 导出小程序特有类型
export type { AppEvent, StoreState, MiniprogramGameProfile } from './miniprogram'

// 小程序专用的 GameProfile 类型（扩展基础类型）
export interface GameProfile extends SharedCoreGameProfile {
  team_size?: number
  fleet_members?: string[]
}

// 向后兼容的常量（如果需要）
// export const BRAND_PLANETX_CONFIG = BRAND_PLANETX

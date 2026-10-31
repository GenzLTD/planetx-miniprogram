/**
 * career 页求职闭环纯函数 —— 解析→入库→列表的组包与展示。
 *
 * 服务端口径（zervi-rust resume-service）：
 * · POST /v1/resume/parse → { extracted }（不落库）
 * · POST /v1/resume/ingest { markdown, filename?, extracted? } → { resume_id, status, matches?, total_evaluated? }
 *   matches 由服务端内部打 /v1/jobs/match（库内职位），失败不阻断入库
 *   extracted 带上即 processed；不带是 stored（仅存原文）
 * · GET /v1/resume/list → { resumes: [{id,title,filename,file_size,uploaded_at,extracted}], total }
 *
 * 铁律：parse 响应缺 extracted（或 extracted 是无键空对象）时不组 ingest body
 * （调用方不得入库），把解析结果按原样展示，让用户看到失败原因而不是静默丢数据。
 * 「有实质 extracted」唯一判定 = hasKeys：列表徽标与入库组包共用同一把尺子，
 * 避免「入库记 processed、徽标显示未解析」对空对象各说各话。
 */
import type { ParsedResume } from "@looma/shared-core";

/** parse 响应（zervi-rust analyze 输出；运行时仍做形状守卫，防网络侧类型不符） */
export type ParseResponse = {
  extracted?: ParsedResume | null
}

/** ingest 请求体（ResumeIngestRequest 的必填三键形态） */
export type IngestBody = {
  markdown: string
  filename: string
  extracted: ParsedResume
}

/** list 行（服务端 list_resumes 输出；extracted 用 unknown 收拢各调用方类型差异） */
export type ResumeListRow = {
  id?: string
  title?: string
  filename?: string
  uploaded_at?: string
  extracted?: unknown
}

/** 列表行 = 服务端条目 + 展示字段（不污染 shared-core 类型） */
export type ResumeRow = {
  id: string
  title: string
  dateLabel: string
  parsed: boolean
}

/** 从 extracted 推导落库文件名：有人名用人名，缺省 resume.md */
export function filenameFromExtracted(extracted: ParsedResume): string {
  const name = typeof extracted?.name === "string" ? extracted.name.trim() : ""
  return name ? `resume-${name}.md` : "resume.md"
}

/**
 * parse → ingest 组包。extracted 缺失/非对象/无键空对象时返回 null（不入库），
 * markdown 用用户原文（parse 只产 extracted，原文在客户端手里）。
 *
 * 空对象判定复用 hasKeys（与列表徽标同口径）：{} 若入库，服务端会按
 * extracted 存在记 processed，而徽标按无实质内容显示未解析——两头矛盾。
 */
export function buildIngestBody(text: string, parseResp: ParseResponse): IngestBody | null {
  const extracted = parseResp?.extracted as unknown
  if (!hasKeys(extracted)) return null
  const markdown = text.trim()
  if (!markdown) return null
  return { markdown, filename: filenameFromExtracted(extracted as ParsedResume), extracted: extracted as ParsedResume }
}

/** uploaded_at（RFC3339）→ YYYY-MM-DD；解析失败回落空串 */
export function dateLabelFrom(uploadedAt: string | undefined): string {
  if (!uploadedAt) return ""
  const day = String(uploadedAt).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : ""
}

/** extracted 是否为有键的普通对象（数组不算） */
function hasKeys(value: unknown): boolean {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).length > 0
}

/** 列表行装饰：标题兜底、日期格式化、是否已解析 */
export function decorateResumeRow(item: ResumeListRow): ResumeRow {
  const id = String(item?.id ?? "").trim()
  const title = (item?.title || "").trim() || (item?.filename || "").trim() || "未命名简历"
  const parsed = hasKeys(item?.extracted)
  return {
    id,
    title,
    dateLabel: dateLabelFrom(item?.uploaded_at),
    parsed,
  }
}

/** 列表可点判定：无 id 的脏行不进详情 */
export function isNavigable(row: ResumeRow): boolean {
  return !!row.id
}

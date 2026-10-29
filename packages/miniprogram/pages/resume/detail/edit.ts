/**
 * detail 正文编辑 —— PUT /v1/resume/:resume_id 的客户端组包与校验。
 *
 * 契约：ResumeUpdateRequest 三字段全可选；未传保持原值（merge）。
 * extracted 服务端是**全量替换**：只改 summary 时必须带上其余 extracted 字段，
 * 不能只传 `{ summary }`，否则会冲掉 skills/experiences 等。
 * visibility 不走本路径（归 /permission）。
 */

import type { ParsedResume, ResumeDetail, ResumeUpdateRequest } from "@looma/shared-core";

export const TITLE_MAX_CHARS = 200;

export type EditDraft = {
  title: string;
  summary: string;
  markdown: string;
};

export function draftFromDetail(detail: ResumeDetail): EditDraft {
  return {
    title: detail.title || "",
    summary: detail.extracted?.summary || "",
    markdown: detail.markdown || "",
  };
}

export type BuildUpdateResult =
  | { ok: true; body: ResumeUpdateRequest }
  | { ok: false; error: string };

/**
 * 对比草稿与现网 detail，只把有改动的字段放进 body。
 * 无任何改动 → 400 文案（对齐服务端「至少提供之一」）。
 */
export function buildUpdateBody(
  detail: ResumeDetail,
  draft: EditDraft
): BuildUpdateResult {
  const title = draft.title.trim();
  const summary = draft.summary.trim();
  const markdown = draft.markdown; // markdown 允许保留首尾空格语义，但全空与「未改」按 trim 比

  const prevTitle = (detail.title || "").trim();
  const prevSummary = (detail.extracted?.summary || "").trim();
  const prevMarkdown = detail.markdown || "";

  const titleChanged = title !== prevTitle;
  const summaryChanged = summary !== prevSummary;
  const markdownChanged = markdown !== prevMarkdown;

  if (!titleChanged && !summaryChanged && !markdownChanged) {
    return { ok: false, error: "没有需要保存的修改" };
  }

  if (titleChanged) {
    if (!title) {
      return { ok: false, error: "标题不能为空" };
    }
    if ([...title].length > TITLE_MAX_CHARS) {
      return { ok: false, error: `标题超过 ${TITLE_MAX_CHARS} 字符` };
    }
  }

  const body: ResumeUpdateRequest = {};
  if (titleChanged) body.title = title;
  if (markdownChanged) body.markdown = markdown;
  if (summaryChanged) {
    // 全量替换：在现有 extracted 上改 summary，保留其余键
    const next: ParsedResume = { ...(detail.extracted || {}) };
    if (summary) next.summary = summary;
    else delete next.summary;
    body.extracted = next;
  }

  return { ok: true, body };
}

/**
 * 屏蔽企业列表的展示兜底（纯函数，无 wx 依赖）。
 *
 * 背景：非 exact_name 形态下页面只传匹配键（credit_code / enterprise_id），
 * 服务端 company_name 落空串（契约允许），卡片标题不能渲染成空白。
 */
import type { BlacklistMatch, ResumeBlacklistItem } from "@looma/shared-core";

export const MATCH_LABEL: Record<BlacklistMatch, string> = {
  exact_name: "企业名称",
  credit_code: "信用代码",
  enterprise_id: "企业 ID",
};

/** 列表行 = 契约条目 + 展示字段（不污染 shared-core 类型） */
export type BlacklistRow = ResumeBlacklistItem & {
  displayName: string;
  matchLabel: string;
  keyHint: string;
};

/** 搜索命中的字段清单（大小写不敏感、关键字 trim；空关键字 = 全量） */
export function filterBlacklistRows(rows: BlacklistRow[], keyword: string): BlacklistRow[] {
  const q = (keyword || "").trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) =>
    [
      r.displayName,
      r.company_name,
      r.credit_code,
      r.enterprise_id,
      r.note,
      r.keyHint,
    ]
      .join("\n")
      .toLowerCase()
      .includes(q)
  );
}

/** 长键截断：代码/ID 只留头尾，避免撑破卡片标题 */
export function maskKey(raw: string): string {
  const s = (raw || "").trim();
  if (s.length <= 14) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

export function decorateBlacklistItem(item: ResumeBlacklistItem): BlacklistRow {
  const name = (item.company_name || "").trim();
  const key = (item.credit_code || item.enterprise_id || "").trim();
  const matchLabel = MATCH_LABEL[item.match] || item.match;

  return {
    ...item,
    matchLabel,
    displayName: name || (key ? `${matchLabel} · ${maskKey(key)}` : "未命名屏蔽项"),
    // 有名称又有关键值时，键值降为副标题；纯兜底名已含键值则不重复
    keyHint: name && key ? `${matchLabel} · ${maskKey(key)}` : "",
  };
}

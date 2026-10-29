/**
 * 简历详情 — GET /v1/resume/:resume_id · GET/PUT /v1/resume/:resume_id/permission
 *
 * 「谁可看」是授权面唯一写入口：写 metadata.permission，与 detail 读同一处。
 * grants 是全量替换语义 —— 改 visibility 时必须把当前 grants 原样回传，
 * 否则服务端会把已有授权静默清空（契约 permission_semantics）。
 * 501 降级统一走 isNotImplemented，页面不自判状态码。
 */
import {
  isNotImplemented,
  type ResumeDetail,
  type ResumePermission,
  type ResumeVisibility,
} from "@looma/shared-core";
import { resumeApi } from "../../../utils/api";

type VisibilityOption = { value: ResumeVisibility; label: string; hint: string };

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  { value: "private", label: "仅自己", hint: "不对外展示" },
  { value: "trusted", label: "信任圈", hint: "仅信任关系可见" },
  { value: "everyone", label: "所有人", hint: "公开可检索" },
];

/** 服务端枚举 → 中文短标签；未知值原样回显，避免把后端新枚举吞成空白 */
function visibilityLabel(value?: string): string {
  const hit = VISIBILITY_OPTIONS.find((o) => o.value === value);
  return hit ? hit.label : value || "";
}

Page({
  data: {
    resumeId: "",
    detail: null as ResumeDetail | null,
    loading: true,
    error: "",
    notReady: false,

    // 授权面
    visibilityOptions: VISIBILITY_OPTIONS,
    perm: null as ResumePermission | null,
    permLoading: false,
    permBlocked: false,
    permSaving: false,
    permError: "",
    currentVisibility: "private" as ResumeVisibility,
    visibilityText: "仅自己",
    grantCount: 0,
    permUpdatedAt: "",
  },

  onLoad(query: Record<string, string | undefined>) {
    const resumeId = (query.resume_id || query.id || "").trim();
    this.setData({ resumeId });
    if (!resumeId) {
      this.setData({
        loading: false,
        error: "缺少 resume_id",
      });
      return;
    }
    this.loadDetail();
  },

  onPullDownRefresh() {
    this.loadDetail().finally(() => wx.stopPullDownRefresh());
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: "/pages/career/index" }) });
  },

  async loadDetail() {
    const { resumeId } = this.data;
    if (!resumeId) return;
    this.setData({ loading: true, error: "", notReady: false });
    try {
      const detail = await resumeApi.detail(resumeId);
      this.setData({
        detail,
        loading: false,
        currentVisibility: detail.visibility,
        visibilityText: visibilityLabel(detail.visibility),
      });
      // 授权面独立容错：读失败不该把正文一起打成错误态
      await this.loadPermission();
    } catch (err: unknown) {
      if (isNotImplemented(err)) {
        this.setData({ notReady: true, loading: false, detail: null });
        return;
      }
      const msg = err instanceof Error ? err.message : "加载失败";
      this.setData({ error: msg, loading: false });
    }
  },

  async loadPermission() {
    const { resumeId } = this.data;
    if (!resumeId) return;
    this.setData({ permLoading: true, permError: "" });
    try {
      const perm = await resumeApi.permission(resumeId);
      this.setData({
        perm,
        permLoading: false,
        permBlocked: false,
        currentVisibility: perm.visibility,
        visibilityText: visibilityLabel(perm.visibility),
        grantCount: (perm.grants || []).length,
        permUpdatedAt: perm.updated_at || "",
        permError: "",
      });
    } catch (err: unknown) {
      if (isNotImplemented(err)) {
        // 后端未实现授权面：整块隐藏，不拿「加载中」或错误态误伤正文
        this.setData({ perm: null, permLoading: false, permBlocked: true });
        return;
      }
      const msg = err instanceof Error ? err.message : "授权信息读取失败";
      this.setData({ perm: null, permLoading: false, permError: msg });
    }
  },

  onVisibilityTap(e: any) {
    const value = String(e.currentTarget.dataset.value || "") as ResumeVisibility;
    if (this.data.permSaving) return;
    if (!value || value === this.data.currentVisibility) return;
    if (!this.data.perm) {
      wx.showToast({ title: "授权信息未加载，下拉刷新后重试", icon: "none" });
      return;
    }
    this.applyVisibility(value);
  },

  async applyVisibility(visibility: ResumeVisibility) {
    const { resumeId, perm, detail } = this.data;
    if (!resumeId || !perm) return;
    this.setData({ permSaving: true, permError: "" });
    try {
      const next = await resumeApi.setPermission(resumeId, {
        visibility,
        // 全量替换：把已读到的 grants 原样回传，避免静默清空已有授权
        grants: perm.grants || [],
      });
      this.setData({
        perm: next,
        permSaving: false,
        currentVisibility: next.visibility,
        visibilityText: visibilityLabel(next.visibility),
        grantCount: (next.grants || []).length,
        permUpdatedAt: next.updated_at || "",
        // detail 与 permission 同源（metadata.permission.visibility），同步展示
        ...(detail ? { "detail.visibility": next.visibility } : {}),
      });
      wx.showToast({ title: "已更新", icon: "success", duration: 1200 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "保存失败";
      this.setData({ permSaving: false, permError: msg });
    }
  },
});

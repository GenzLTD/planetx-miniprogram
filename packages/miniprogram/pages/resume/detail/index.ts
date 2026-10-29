/**
 * 简历详情 — GET /v1/resume/:resume_id
 * 阶段3 前统一走 isNotImplemented → 降级空态。
 */
import { isNotImplemented, type ResumeDetail } from "@looma/shared-core";
import { resumeApi } from "../../../utils/api";

Page({
  data: {
    resumeId: "",
    detail: null as ResumeDetail | null,
    loading: true,
    error: "",
    notReady: false,
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

  async loadDetail() {
    const { resumeId } = this.data;
    if (!resumeId) return;
    this.setData({ loading: true, error: "", notReady: false });
    try {
      const detail = await resumeApi.detail(resumeId);
      this.setData({ detail, loading: false });
    } catch (err: unknown) {
      if (isNotImplemented(err)) {
        this.setData({ notReady: true, loading: false, detail: null });
        return;
      }
      const msg = err instanceof Error ? err.message : "加载失败";
      this.setData({ error: msg, loading: false });
    }
  },
});

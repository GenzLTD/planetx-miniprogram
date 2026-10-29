/**
 * 简历模板目录 — GET /v1/resume/templates
 * 阶段3 前统一走 isNotImplemented → 降级空态，禁止页面自判 501/405。
 */
import { isNotImplemented, type ResumeTemplate } from "@looma/shared-core";
import { resumeApi } from "../../../utils/api";

Page({
  data: {
    templates: [] as ResumeTemplate[],
    total: 0,
    loading: true,
    error: "",
    notReady: false,
  },

  onLoad() {
    this.loadTemplates();
  },

  onPullDownRefresh() {
    this.loadTemplates().finally(() => wx.stopPullDownRefresh());
  },

  /** 降级态导流：求职页是 tabBar 页，switchTab（不能带参） */
  goParse() {
    wx.switchTab({ url: "/pages/career/index" });
  },

  async loadTemplates() {
    this.setData({ loading: true, error: "", notReady: false });
    try {
      const result = await resumeApi.templates();
      const templates = result.templates || [];
      this.setData({
        templates,
        total: result.total ?? templates.length,
        loading: false,
      });
    } catch (err: unknown) {
      if (isNotImplemented(err)) {
        this.setData({ notReady: true, loading: false, templates: [], total: 0 });
        return;
      }
      const msg = err instanceof Error ? err.message : "加载失败";
      this.setData({ error: msg, loading: false });
    }
  },
});

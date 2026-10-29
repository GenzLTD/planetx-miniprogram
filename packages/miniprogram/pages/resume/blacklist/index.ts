/**
 * 屏蔽企业 — GET /v1/resume/blacklist（用户维）
 * 阶段3 前统一走 isNotImplemented → 降级空态。
 */
import { isNotImplemented, type ResumeBlacklistItem } from "@looma/shared-core";
import { resumeApi } from "../../../utils/api";

Page({
  data: {
    items: [] as ResumeBlacklistItem[],
    total: 0,
    loading: true,
    error: "",
    notReady: false,
  },

  onLoad() {
    this.loadBlacklist();
  },

  onPullDownRefresh() {
    this.loadBlacklist().finally(() => wx.stopPullDownRefresh());
  },

  async loadBlacklist() {
    this.setData({ loading: true, error: "", notReady: false });
    try {
      const result = await resumeApi.blacklist();
      const items = result.items || [];
      this.setData({
        items,
        total: result.total ?? items.length,
        loading: false,
      });
    } catch (err: unknown) {
      if (isNotImplemented(err)) {
        this.setData({ notReady: true, loading: false, items: [], total: 0 });
        return;
      }
      const msg = err instanceof Error ? err.message : "加载失败";
      this.setData({ error: msg, loading: false });
    }
  },
});

/**
 * 屏蔽企业 — GET/POST /v1/resume/blacklist · DELETE /v1/resume/blacklist/:item_id（用户维）
 * 501 降级统一走 isNotImplemented，页面不自判状态码。
 * 添加表单按 match 枚举分情况必填（resume.v1.json#blacklist_add）。
 *
 * 展示兜底：非 exact_name 形态下页面只传匹配键，服务端 company_name 落空串，
 * 卡片标题不能渲染成空白 —— 统一在 decorateBlacklistItem() 里补展示名。
 */
import { isNotImplemented, type BlacklistMatch } from "@looma/shared-core";
import { resumeApi } from "../../../utils/api";
import { decorateBlacklistItem, type BlacklistRow } from "./display";

type MatchOption = { value: BlacklistMatch; label: string; placeholder: string; field: "company_name" | "credit_code" | "enterprise_id" };

const MATCH_OPTIONS: MatchOption[] = [
  { value: "exact_name", label: "按名称", placeholder: "企业全称，如：某某科技有限公司", field: "company_name" },
  { value: "credit_code", label: "按信用代码", placeholder: "统一社会信用代码，18 位", field: "credit_code" },
  { value: "enterprise_id", label: "按企业 ID", placeholder: "平台企业 ID", field: "enterprise_id" },
];

Page({
  data: {
    items: [] as BlacklistRow[],
    total: 0,
    loading: true,
    error: "",
    notReady: false,

    // 添加表单
    showAdd: false,
    submitting: false,
    formError: "",
    matchOptions: MATCH_OPTIONS,
    matchIndex: 0,
    form: {
      company_name: "",
      credit_code: "",
      enterprise_id: "",
      note: "",
    },
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
      const items = (result.items || []).map(decorateBlacklistItem);
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

  // ── 添加屏蔽企业（POST，阶段3 前 stub_501）──
  openAdd() {
    this.setData({ showAdd: true, formError: "" });
  },

  closeAdd() {
    this.setData({ showAdd: false, formError: "", submitting: false });
  },

  noop() {
    /* 阻止冒泡，遮罩层点击关闭、面板内点击不关 */
  },

  onMatchTap(e: any) {
    const index = Number(e.currentTarget.dataset.index);
    if (Number.isNaN(index) || index === this.data.matchIndex) return;
    this.setData({ matchIndex: index, formError: "" });
  },

  onFormInput(e: any) {
    const field = String(e.currentTarget.dataset.field);
    if (!(field in this.data.form)) return;
    this.setData({ form: { ...this.data.form, [field]: e.detail.value } } as any);
  },

  async submitAdd() {
    if (this.data.submitting) return;
    const opt = MATCH_OPTIONS[this.data.matchIndex];
    const value = (this.data.form[opt.field] || "").trim();
    if (!value) {
      this.setData({ formError: opt.placeholder ? `请填写${opt.label.replace("按", "")}` : "请填写必填项" });
      return;
    }
    this.setData({ submitting: true, formError: "" });
    try {
      const body: Record<string, string> = { match: opt.value, [opt.field]: value };
      if ((this.data.form.note || "").trim()) body.note = this.data.form.note.trim();
      await resumeApi.blacklistAdd(body as any);
      // 阶段3 后走到这里：成功 → 关表单 + 重拉列表
      this.closeAdd();
      this.setData({ form: { company_name: "", credit_code: "", enterprise_id: "", note: "" } });
      this.loadBlacklist();
    } catch (err: unknown) {
      this.setData({ submitting: false });
      if (isNotImplemented(err)) {
        wx.showToast({ title: "该功能暂不可用（后端未实现）", icon: "none", duration: 2200 });
        this.closeAdd();
        return;
      }
      const msg = err instanceof Error ? err.message : "提交失败";
      this.setData({ formError: msg });
    }
  },

  // ── 移除屏蔽企业（DELETE，阶段3 前 stub_501）──
  async removeItem(e: any) {
    const id = String(e.currentTarget.dataset.id || "");
    if (!id) return;
    try {
      await resumeApi.blacklistRemove(id);
      this.loadBlacklist();
    } catch (err: unknown) {
      if (isNotImplemented(err)) {
        wx.showToast({ title: "该功能暂不可用（后端未实现）", icon: "none", duration: 2200 });
        return;
      }
      const msg = err instanceof Error ? err.message : "移除失败";
      wx.showToast({ title: msg, icon: "none" });
    }
  },
});

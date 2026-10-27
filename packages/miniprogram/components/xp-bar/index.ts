/**
 * XP Bar Component
 * Shows level, rank, XP progress bar.
 * Computed values (pct, rankName) are handled by WXS in WXML
 * to avoid observer setData during initial creation.
 */

Component({
  properties: {
    level: { type: Number, value: 1 },
    xp: { type: Number, value: 0 },
    xpToNext: { type: Number, value: 100 },
  },
})

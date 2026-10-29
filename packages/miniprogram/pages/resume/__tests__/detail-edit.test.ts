/**
 * detail 正文编辑 —— buildUpdateBody 组包不变量。
 *
 * extracted 全量替换：只改 summary 时必须带上其余字段。
 * 无改动 / 空标题 → 客户端先拦，对齐服务端 400。
 */

import type { ResumeDetail } from '@looma/shared-core'
import { TITLE_MAX_CHARS, buildUpdateBody, draftFromDetail } from '../detail/edit'

const DETAIL: ResumeDetail = {
  id: '42',
  title: '我的简历',
  filename: 'cv.pdf',
  uploaded_at: '2026-10-20T10:00:00Z',
  extracted: {
    summary: '十年电梯',
    skills: ['Rust', 'Axum'],
    name: '张三',
  },
  markdown: '# 正文\n一行',
  visibility: 'private',
  status: 'processed',
}

describe('draftFromDetail', () => {
  it('从 detail 抽出可编辑草稿', () => {
    expect(draftFromDetail(DETAIL)).toEqual({
      title: '我的简历',
      summary: '十年电梯',
      markdown: '# 正文\n一行',
    })
  })

  it('缺省字段回落空串', () => {
    expect(
      draftFromDetail({
        ...DETAIL,
        title: '',
        extracted: {},
        markdown: undefined,
      })
    ).toEqual({ title: '', summary: '', markdown: '' })
  })
})

describe('buildUpdateBody', () => {
  it('无改动 → 错误', () => {
    const r = buildUpdateBody(DETAIL, draftFromDetail(DETAIL))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/没有需要保存/)
  })

  it('只改 title → body 仅含 title', () => {
    const r = buildUpdateBody(DETAIL, {
      ...draftFromDetail(DETAIL),
      title: '新标题',
    })
    expect(r).toEqual({ ok: true, body: { title: '新标题' } })
  })

  it('空 title → 错误', () => {
    const r = buildUpdateBody(DETAIL, {
      ...draftFromDetail(DETAIL),
      title: '   ',
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/标题不能为空/)
  })

  it(`title 超过 ${TITLE_MAX_CHARS} 字符 → 错误`, () => {
    const r = buildUpdateBody(DETAIL, {
      ...draftFromDetail(DETAIL),
      title: '字'.repeat(TITLE_MAX_CHARS + 1),
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/超过/)
  })

  it('只改 summary → extracted 全量替换且保留 skills/name', () => {
    const r = buildUpdateBody(DETAIL, {
      ...draftFromDetail(DETAIL),
      summary: '新摘要',
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.body).toEqual({
      extracted: {
        summary: '新摘要',
        skills: ['Rust', 'Axum'],
        name: '张三',
      },
    })
    expect(r.body.title).toBeUndefined()
    expect(r.body.markdown).toBeUndefined()
  })

  it('清空 summary → extracted 去掉 summary 键，其余保留', () => {
    const r = buildUpdateBody(DETAIL, {
      ...draftFromDetail(DETAIL),
      summary: '',
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.body.extracted).toEqual({
      skills: ['Rust', 'Axum'],
      name: '张三',
    })
    expect(r.body.extracted).not.toHaveProperty('summary')
  })

  it('只改 markdown → body 仅含 markdown', () => {
    const r = buildUpdateBody(DETAIL, {
      ...draftFromDetail(DETAIL),
      markdown: '# 新正文',
    })
    expect(r).toEqual({ ok: true, body: { markdown: '# 新正文' } })
  })

  it('三项都改 → body 含 title + extracted + markdown', () => {
    const r = buildUpdateBody(DETAIL, {
      title: 'T2',
      summary: 'S2',
      markdown: 'M2',
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.body.title).toBe('T2')
    expect(r.body.markdown).toBe('M2')
    expect(r.body.extracted?.summary).toBe('S2')
    expect(r.body.extracted?.skills).toEqual(['Rust', 'Axum'])
  })
})

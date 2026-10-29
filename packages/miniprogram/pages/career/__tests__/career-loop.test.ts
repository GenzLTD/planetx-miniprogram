/**
 * career 求职闭环纯函数 —— parse→ingest 组包、列表行装饰。
 */
import {
  buildIngestBody,
  dateLabelFrom,
  decorateResumeRow,
  filenameFromExtracted,
  isNavigable,
} from '../loop'

describe('filenameFromExtracted', () => {
  it('有人名用 resume-<name>.md', () => {
    expect(filenameFromExtracted({ name: '夏峻' })).toBe('resume-夏峻.md')
  })
  it('缺名回落 resume.md（name 空串/非字符串/缺键）', () => {
    expect(filenameFromExtracted({ name: '  ' })).toBe('resume.md')
    expect(filenameFromExtracted({ name: 42 as any })).toBe('resume.md')
    expect(filenameFromExtracted({})).toBe('resume.md')
  })
})

describe('buildIngestBody', () => {
  it('extracted 是对象 → 组齐三键，markdown 是 trim 后原文', () => {
    const body = buildIngestBody('  原文 \n', { extracted: { name: '张三', skills: ['Go'] } })
    expect(body).toEqual({
      markdown: '原文',
      filename: 'resume-张三.md',
      extracted: { name: '张三', skills: ['Go'] },
    })
  })
  it('extracted 缺失/null/数组/非对象 → null，不入库', () => {
    expect(buildIngestBody('x', {})).toBeNull()
    expect(buildIngestBody('x', { extracted: null })).toBeNull()
    expect(buildIngestBody('x', { extracted: [1, 2] as any })).toBeNull()
    expect(buildIngestBody('x', { extracted: 'oops' as any })).toBeNull()
  })
  it('原文空串 → null（防御，页面层其实已拦）', () => {
    expect(buildIngestBody('   ', { extracted: {} })).toBeNull()
  })
  it('空 extracted 对象也算可入库（服务端 processed 语义由 extracted 存在决定）', () => {
    const body = buildIngestBody('原文', { extracted: {} })
    expect(body).toEqual({ markdown: '原文', filename: 'resume.md', extracted: {} })
  })
})

describe('dateLabelFrom', () => {
  it('RFC3339 取前 10 位', () => {
    expect(dateLabelFrom('2026-10-30T06:00:00+08:00')).toBe('2026-10-30')
  })
  it('缺省/非法格式回落空串', () => {
    expect(dateLabelFrom(undefined)).toBe('')
    expect(dateLabelFrom('not-a-date')).toBe('')
  })
})

describe('decorateResumeRow', () => {
  it('正常行：标题、日期、已解析', () => {
    const row = decorateResumeRow({
      id: '12',
      title: '我的简历',
      uploaded_at: '2026-10-30T01:00:00Z',
      extracted: { name: '张三' },
    })
    expect(row).toEqual({ id: '12', title: '我的简历', dateLabel: '2026-10-30', parsed: true })
  })
  it('title 空回落 filename，再回落 未命名简历', () => {
    expect(decorateResumeRow({ id: '1', filename: 'a.md' }).title).toBe('a.md')
    expect(decorateResumeRow({ id: '1' }).title).toBe('未命名简历')
  })
  it('extracted 空对象/缺失 → 未解析', () => {
    expect(decorateResumeRow({ id: '1', extracted: {} }).parsed).toBe(false)
    expect(decorateResumeRow({ id: '1' }).parsed).toBe(false)
  })
  it('id 缺失保留空串，isNavigable 拦', () => {
    const row = decorateResumeRow({ title: 'x' })
    expect(row.id).toBe('')
    expect(isNavigable(row)).toBe(false)
    expect(isNavigable(decorateResumeRow({ id: '9' }))).toBe(true)
  })
})

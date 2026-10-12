/* live-limits-short (real UI): the 15 s cut of live-limits-real, built for the feed's drop-off curve (only ~2-3 % of impressions reach a 30 s
 * video's halfway point, so the hook and the destination sit in the first seconds and the end card lands before 12 s).
 *   t=0 straight on real work: the coding thread already running on one plan (GPT-5 Codex): live row -> answer + csv.ts diff
 *   -> the sidebar account widget opens the real Usage panel: Superbot Pro credits + ChatGPT Plus + Claude Pro 5 hour / 7 day bars fill to calm
 *   readings and tick live -> panel closes -> the SAME thread carries on: next ask, Sonnet 4.6 (Claude Pro), live row, answer
 *   -> end card (static mascot, Every plan's limits, live., superbot.gg, Private beta. Invite only.) at 11.7 s, held 3.3 s.
 * A small persistent "superbot.gg" wordmark (ad copy, header gap, from ~1 s) keeps the destination on screen at any drop-off point.
 * Every frame is the kit's captured app DOM (rows.js / ktr-lib.js / ext.js retarget text and numbers only). run() is idempotent in p.
 */
import { ensureExt } from './ext-common.js'
await ensureExt(window.SB, [])
export default (SB) => {
  const ASK1 = 'toCsv drops the quotes around cells that contain commas. Can you fix utils/csv.ts and run the tests?'
  const ASK2 = 'Same bug in utils/tsv.ts? Fix it and run the whole suite.'

  const ANS1 = [
    { p: 'The failing test was `quotes cells with commas`: `toCsv` joined every cell with a comma and never escaped it, so `Smith, Ana` split into two columns. I changed `utils/csv.ts` so any cell holding a comma, a quote or a newline is quoted:' },
    { code: { lang: 'ts', text: 'const esc = (v: string) => v.replaceAll(\'"\', \'""\')\nconst quote = (v: string) => (/[",\\n]/.test(v) ? \'"\' + esc(v) + \'"\' : v)\nreturn rows.map((r) => r.map(quote).join(",")).join("\\n")' } },
    { p: 'The csv suite now passes: 9 of 9 tests.' }
  ]
  const ANS2 = [
    { p: 'Yes. `toTsv` in `utils/tsv.ts` had the same fault: a tab or a newline inside a cell shifted every column after it. I applied the same quoting there, keyed on tabs.' },
    { p: 'The whole suite passes: 41 of 41 tests across 7 files. `utils/csv.ts` is unchanged.' }
  ]

  const SPEC1 = {
    label: 'Worked for 5s · 4 steps', read: { n: 2, names: 'csv.test.ts, csv.ts', ms: '980ms' },
    diff: { file: 'csv.ts', dir: 'utils/', add: 5, del: 1, lines: [
      { t: 'ctx', o: 1, n: 1, code: 'export function toCsv(rows: string[][]): string {' },
      { t: 'del', o: 2, n: null, code: '  return rows.map((r) => r.join(",")).join("\\n")' },
      { t: 'add', o: null, n: 2, code: '  const esc = (v: string) => v.replaceAll(\'"\', \'""\')' },
      { t: 'add', o: null, n: 3, code: '  const quote = (v: string) =>' },
      { t: 'add', o: null, n: 4, code: '    /[",\\n]/.test(v) ? \'"\' + esc(v) + \'"\' : v' },
      { t: 'add', o: null, n: 5, code: '  return rows.map((r) => r.map(quote).join(",")).join("\\n")' },
      { t: 'ctx', o: 3, n: 6, code: '}' }
    ] },
    ran: { cmd: 'npm test -- csv', ms: '640ms' }
  }
  const SPEC2 = { label: 'Worked for 8s · 5 steps' }

  const TITLE = 'CSV export'
  const $ = SB.$
  const heroChip = () => SB.tpl('hero', '[data-testid="composer-plat"]')

  /* the Usage panel: every plan's 5 hour and 7 day bars. Readings stay calm (nothing near a limit). */
  const FILL = [['openai', '5 hour', 0, 34], ['openai', '7 day', 0, 58], ['openai', '7 day Astra', 0, 52], ['anthropic', '5 hour', 0, 42], ['anthropic', '7 day', 0, 63], ['anthropic', '7 day Fable', 0, 44]]
  const TICK1 = [['openai', '5 hour', 34, 44], ['openai', '7 day', 58, 61], ['anthropic', '5 hour', 42, 46], ['anthropic', '7 day', 63, 65]]
  const TICK2 = [['anthropic', '5 hour', 46, 53], ['anthropic', '7 day', 65, 67], ['anthropic', '7 day Fable', 44, 48]]
  const REST1 = [['openai', '5 hour', 44], ['openai', '7 day', 61], ['openai', '7 day Astra', 52], ['anthropic', '5 hour', 46], ['anthropic', '7 day', 65], ['anthropic', '7 day Fable', 44]]
  const setRows = (rows) => { for (const [v, l, pct] of rows) SB.setUsage(v, l, pct) }

  /* the real fixture tells the kit's neutralisers leave: account label, red badges, the e-mail in the panel, the profile card, the refill date */
  const neutralLL = () => {
    for (const e of SB.$$('.awc-nm')) { e.textContent = 'Sam'; e.title = 'Sam' }
    for (const e of SB.$$('.hub-side-row-badge, .awc-tool-dot')) e.style.display = 'none'
    for (const d of SB.$$('dialog[data-sb-overlay="usage"]')) {
      const pr = $('[data-testid="usage-profile-turns"]', d); if (pr) pr.style.display = 'none'
      const rf = $('.credits-balance-refill', d); if (rf) rf.textContent = 'Refills Nov 1'
      const w = document.createTreeWalker(d, NodeFilter.SHOW_TEXT); let n
      while ((n = w.nextNode())) if (/(alex|stub)@example/.test(n.textContent)) n.textContent = n.textContent.replace(/(alex|stub)@example\.(com|test)/g, 'sam@example.com')
    }
  }
  if (!SB._llNeutral) {
    SB._llNeutral = true
    const stateBase = SB.state
    SB.state = (name) => { stateBase(name); neutralLL() }
    const decBase = SB.decorate
    SB.decorate = () => { decBase(); neutralLL(); ctxApply() }
  }

  /* composer context meter as a function of time (the thread's context grows with each turn) */
  const ctxK = (t) => {
    if (t < 0.6) return 4
    if (t < 3.4) return 4 + 30 * SB.ease.out(SB.clamp01((t - 0.6) / 2.8))
    if (t < 8.8) return 34
    if (t < 11.4) return 34 + 28 * SB.ease.out(SB.clamp01((t - 8.8) / 2.6))
    return 62
  }
  function ctxApply() { try { SB.setContext(ctxK(SB.t || 0)) } catch (e) { /* state without a context line */ } }

  /* ------------------------------------------------------------------ state */
  let st = {}
  const sc = () => SB.feedScroller()
  const maxY = () => { const f = sc(); return f ? f.scrollHeight - f.clientHeight : 0 }
  const once = (k, fn) => { if (!st[k]) st[k] = fn() || {}; return st[k] }
  const drop = (k) => { if (st[k] && st[k].node && st[k].node.isConnected) st[k].node.remove(); st[k] = null }
  const glide = (k, p, mutate) => {
    const s = once(k, () => { const f = sc(); const y0 = f ? f.scrollTop : 0; mutate(); return { y0 } })
    const y1 = maxY(); const f = sc(); if (f) f.scrollTop = s.y0 + (y1 - s.y0) * SB.ease.out(SB.clamp01(p * 1.15))
  }
  const follow = () => { const f = sc(); if (f) f.scrollTop = maxY() }
  const userAdd = (k, text, p) => { const s = once(k, () => ({ node: SB.feedAppend(SB.userRow(text)) })); SB.rise(s.node, p, 8); follow() }
  const answerAdd = (k, blocks, p) => { const s = once(k, () => ({ node: SB.feedAppend(SB.answerRow(blocks)) })); SB.stream(s.node, p); follow() }
  const liveAdd = (verb, target, secs, steps) => { drop('live'); st.live = { node: SB.feedAppend(SB.liveRow({ verb, target, secs, steps })) }; follow() }
  const outcomeAdd = (k, make) => { drop(k); st[k] = { node: SB.feedAppend(make()) }; follow() }
  const R = (verb, target, result) => ({ verb, target, result })
  /** the account widget under the pointer: the app's hover wash on the account button */
  const press = (on) => { const b = $('[data-testid="aw-account-menu"]'); if (b) { b.style.background = on ? 'color-mix(in srgb, var(--color-fg, #fff) 8%, transparent)' : ''; b.style.borderRadius = on ? '10px' : '' } }

  /* the destination, as ad copy (not app UI): plain type in the header's free gap, sized per layout, below the end card */
  const GAP = { '4x5': [840, 1026, 29], '1x1': [840, 1026, 29], '16x9': [1400, 1860, 40], '4x3': [1160, 1384, 33] }
  const wordmark = (p) => {
    let w = document.querySelector('[data-sb-wordmark]')
    if (!w) {
      w = document.createElement('div'); w.setAttribute('data-sb-wordmark', ''); w.textContent = 'superbot.gg'
      const z = 1.2 // the iframe is css-zoomed: frame px = screen px / 1.2
      const [l, r, px] = GAP[SB.AR] || GAP['4x5']
      w.style.cssText = `position:fixed;left:${l / z}px;width:${(r - l) / z}px;top:${9 / z}px;height:${38 / z}px;display:flex;align-items:center;justify-content:center;z-index:100000;pointer-events:none;` +
        `font:700 ${px / z}px/1 var(--font-ui, Inter, system-ui);letter-spacing:-0.015em;color:#fff;white-space:nowrap`
      document.body.appendChild(w)
    }
    w.style.opacity = String(SB.ease.out(SB.clamp01(p)))
  }

  return {
    cycle: 15.0,
    preload: ['hero', 'rich-answer', 'rich-tools', 'rich-tools-open', 'rich-diff-open', 'rich-long', 'rich-live', 'picker', 'typed', 'usage'],
    setup() {
      st = {}
      SB.state('hero')
    },
    beats: [
      /* -------------------------------------------------- 0 s: straight on real work: the ask is in the thread, the agent is already reading the files */
      { at: 0, run() {
        once('thread', () => {
          SB.threadBegin('rich-answer', TITLE); $('[data-testid="composer-plat"]').replaceWith(heroChip()); SB.composerBusy(true)
          st.u1 = { node: SB.feedAppend(SB.userRow(ASK1)) }; SB.rise(st.u1.node, 1, 8)
          st.live = { node: SB.feedAppend(SB.liveRow({ verb: 'reading', target: 'csv.test.ts', secs: 1, steps: [] })) }; follow()
        })
      } },
      { at: 0.9, dur: 0.35, run(_, p) { wordmark(p) } },
      { at: 0.45, run() { liveAdd('editing', 'csv.ts', 2, [R('Read', 'csv.test.ts', 'Read utils/csv.test.ts (38 lines)'), R('Read', 'csv.ts', 'Read utils/csv.ts (19 lines)')]) } },
      { at: 0.85, run() { liveAdd('running', 'npm test -- csv', 4, [R('Read', 'csv.test.ts'), R('Read', 'csv.ts'), R('Edited', 'csv.ts')]) } },
      { at: 1.3, dur: 1.4, run(_, p) { once('ans1', () => { drop('live'); SB.composerBusy(false) }); answerAdd('a1', ANS1, p) } },
      { at: 2.85, run() { outcomeAdd('o1', () => SB.outcome('tools', SPEC1.label)) } },
      { at: 3.1, dur: 0.45, run(_, p) { once('o1s', () => { drop('o1') }); const s = once('o1s2', () => ({ node: SB.feedAppend(SB.workOutcome(SPEC1, 'steps')) })); SB.stepsReveal(s.node, p); follow() } },
      { at: 3.85, dur: 0.5, run(_, p) { glide('o1d', p, () => { drop('o1s2'); st.o1d = { node: SB.feedAppend(SB.workOutcome(SPEC1, 'diff')) } }) } },

      /* -------------------------------------------------- 4.9 s: the Usage panel: every plan's live 5 hour and 7 day limits */
      { at: 4.9, run() { press(true) } },
      { at: 5.2, run() { press(false); SB.overlayOpen('usage'); neutralLL(); SB.usageAnimate(FILL, 0) } },
      ...FILL.map(([v, l, from, to], i) => ({ at: 5.5 + 0.15 * i, dur: 0.85, run(_, p) { SB.usageAnimate([[v, l, from, to]], p) } })),
      { at: 7.1, dur: 1.4, run(_, p) { for (const [v, l, a, b] of TICK1) SB.setUsage(v, l, SB.lerp(a, b, SB.ease.inOut(p))) } },
      { at: 8.6, run() { SB.closeOverlay('usage') } },

      /* -------------------------------------------------- 8.7 s: the same thread carries on: next ask, another plan (Claude Pro) */
      { at: 8.7, dur: 0.7, run(_, p) { SB.typeText(ASK2, p); follow() } },
      { at: 9.5, dur: 0.25, run(_, p) { once('send2', () => { SB.typeText('', 1); SB.setModel('model:claude-sonnet-4-6'); SB.composerBusy(true) }); userAdd('u2', ASK2, p) } },
      { at: 9.9, run() { liveAdd('running', 'npm test', 4, [R('Read', 'tsv.test.ts'), R('Read', 'tsv.ts'), R('Edited', 'tsv.ts')]) } },
      { at: 10.25, dur: 1.0, run(_, p) { once('ans2', () => { drop('live'); SB.composerBusy(false) }); answerAdd('a2', ANS2, p) } },
      { at: 11.3, run() { outcomeAdd('o2', () => SB.outcome('tools', SPEC2.label)) } },

      /* -------------------------------------------------- end card: lands at 11.7 s, holds 3.3 s */
      { at: 11.7, run() { SB.keepCard({ title: ['Every plan’s', 'limits, live.'], site: 'superbot.gg', note: 'Private beta. Invite only.', px: 150 }) } }
    ]
  }
}

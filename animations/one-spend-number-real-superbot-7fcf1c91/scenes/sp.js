/* one-spend-number (real UI): real work in one thread across two models (the real picker switches gpt-5-codex -> claude-sonnet-4-6), then the real
 * Spend modal: "All AI $792 / mo" across Anthropic / OpenAI / Superbot / Cursor / Devin counts up with its per-day bars, the live limits of every plan
 * and the week's paid-by-key rows sit under it, then Settings > API access > Usage shows the call log with tokens and cost per call, and the thread.
 *   hero -> picker -> ask on gpt-5-codex -> live rows -> answer + diff + test run -> picker -> ask on sonnet -> answer
 *   -> Spend modal (count up, scroll to the week, the limits, paid by key) -> API usage call log -> back in the thread -> end card.
 * Every frame is the kit's captured app DOM (rows.js / ktr-lib.js / ext.js / sp-lib.js retarget text and numbers only). run() is idempotent in p.
 */
import { ensureExt } from './ext-common.js'
await ensureExt(window.SB, ['spend-allai', 'spend-week', 'api-usage'])
export default (SB) => {
  const ASK = 'Month-end dates come out wrong in the date parser. Find the bug, fix it and run the tests.'
  const ASK2 = 'Add a test for February 29 and run it.'

  const ANS = [
    { p: 'Found it. `endOfMonth` built the date from day 31, so months with 30 days rolled into the next one. It now asks for day 0 of the next month:' },
    { code: { lang: 'ts', text: 'function endOfMonth(y: number, m: number) {\n  return new Date(y, m + 1, 0)\n}' } },
    { p: 'The 12 parser tests pass, including 30 April and 28 February.' }
  ]
  const ANS2 = [
    { p: 'Added a leap-day case to `date.test.ts`. It passes, and the full suite is at 13 of 13:' },
    { code: { lang: 'ts', text: 'test("endOfMonth: Feb 29", () => {\n  expect(endOfMonth(2028, 1).getDate()).toBe(29)\n})' } }
  ]

  const SPEC = {
    label: 'Worked for 6s · 5 steps', read: { n: 2, names: 'date.ts, date.test.ts', ms: '980ms' },
    diff: { file: 'date.ts', dir: 'src/', add: 2, del: 2, lines: [
      { t: 'ctx', o: 11, n: 11, code: 'export function endOfMonth(y: number, m: number) {' },
      { t: 'del', o: 12, n: null, code: '  return new Date(y, m, 31)' },
      { t: 'add', o: null, n: 12, code: '  return new Date(y, m + 1, 0)' },
      { t: 'ctx', o: 13, n: 13, code: '}' },
      { t: 'ctx', o: 14, n: 14, code: '' },
      { t: 'ctx', o: 15, n: 15, code: 'export function daysIn(y: number, m: number) {' },
      { t: 'del', o: 16, n: null, code: '  return endOfMonth(y, m).getDate() || 30' },
      { t: 'add', o: null, n: 16, code: '  return endOfMonth(y, m).getDate()' },
      { t: 'ctx', o: 17, n: 17, code: '}' }
    ] },
    ran: { cmd: 'npm test', ms: '3s 140ms' }
  }

  const TITLE = 'Fix the date parser'
  const $ = SB.$
  const heroChip = () => SB.tpl('hero', '[data-testid="composer-plat"]')
  const paneEl = (sel) => { let e = SB.$(sel); while (e && !(e.scrollHeight > e.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(e).overflowY))) e = e.parentElement; return e }
  // memo of scroll start positions: explicit (never re-evaluated mid-beat), measured the first time a beat runs and reset by setup()
  const memo = {}
  const hold = (k, f) => { if (!(k in memo)) memo[k] = f(); return memo[k] }

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
  const closeSettings = () => { SB.closeOverlay('x-api-usage'); for (const e of SB.$$('[data-testid="settings-overlay"]')) e.remove() }
  // Spend modal scroller: scroll position by a fraction of the way to the element, measured once from the unscrolled modal
  const spendTo = (sel, p, dy) => {
    const k = 'sp:' + sel
    const m = hold(k, () => { const e = $(sel); const sc2 = paneEl(sel); if (!e || !sc2) return null; const y0 = sc2.scrollTop; return { y0, goal: y0 + (e.getBoundingClientRect().top - sc2.getBoundingClientRect().top) + dy } })
    const sc2 = paneEl(sel); if (m && sc2) sc2.scrollTo({ top: SB.lerp(m.y0, m.goal, SB.ease.inOut(SB.clamp01(p))), behavior: 'instant' })
  }

  return {
    cycle: 33.6,
    preload: ['hero', 'picker', 'typed', 'rich-answer', 'rich-tools', 'rich-tools-open', 'rich-diff-open', 'rich-long', 'rich-live'],
    setup() {
      st = {}; for (const k of Object.keys(memo)) delete memo[k]
      SB.state('hero'); SB.setModel('superbot')
    },
    beats: [
      /* -------------------------------------------------- 1. the real picker: pick the first model */
      { at: 0.3, run() { SB.overlayOpen('picker') } },
      { at: 0.65, dur: 1.0, run(_, p) { SB.pickerActive(Math.min(3, Math.floor(p * 4))) } },
      { at: 1.8, run() { SB.closeOverlay('picker'); SB.setModel('model:gpt-5-codex') } },

      /* -------------------------------------------------- 2. real work: ask, live rows */
      { at: 2.0, dur: 2.1, run(_, p) { SB.typeText(ASK, p) } },
      { at: 4.4, dur: 0.4, run(_, p) {
        once('send1', () => { SB.threadBegin('rich-answer', TITLE); $('[data-testid="composer-plat"]').replaceWith(heroChip()); SB.setModel('model:gpt-5-codex'); SB.composerBusy(true) })
        userAdd('u1', ASK, p)
      } },
      { at: 4.9, run() { liveAdd('reading', 'date.ts', 1, []) } },
      { at: 5.4, run() { liveAdd('editing', 'date.ts', 2, [R('Read', 'date.ts', 'Read src/date.ts (31 lines)'), R('Read', 'date.test.ts', 'Read src/date.test.ts (44 lines)')]) } },
      { at: 5.9, run() { liveAdd('running', 'npm test', 3, [R('Read', 'date.ts'), R('Read', 'date.test.ts'), R('Edited', 'date.ts')]) } },

      /* -------------------------------------------------- 3. the answer lands: code, steps, the diff, the test run */
      { at: 6.4, dur: 2.2, run(_, p) { once('ans1', () => { drop('live'); SB.composerBusy(false); SB.setModel('model:gpt-5-codex') }); answerAdd('a1', ANS, p) } },
      { at: 8.75, run() { outcomeAdd('o1', () => SB.outcome('tools', SPEC.label)) } },
      { at: 9.1, dur: 0.4, run(_, p) { once('o1s', () => { drop('o1') }); const s = once('o1s2', () => ({ node: SB.feedAppend(SB.workOutcome(SPEC, 'steps')) })); SB.stepsReveal(s.node, p); follow() } },
      { at: 9.65, dur: 0.45, run(_, p) { glide('o1d', p, () => { drop('o1s2'); st.o1d = { node: SB.feedAppend(SB.workOutcome(SPEC, 'diff')) } }) } },

      /* -------------------------------------------------- 4. next ask on another model: the real picker switches, same thread */
      { at: 11.0, dur: 1.2, run(_, p) { SB.typeText(ASK2, p); follow() } },
      { at: 12.4, run() { SB.overlayOpen('picker') } },
      { at: 12.65, run() { SB.pickerActive(3) } },
      { at: 12.95, run() { SB.pickerActive(4) } },
      { at: 13.3, run() { SB.closeOverlay('picker'); SB.setModel('model:claude-sonnet-4-6') } },
      { at: 13.55, dur: 0.35, run(_, p) { once('send2', () => { SB.typeText('', 1); SB.composerBusy(true) }); userAdd('u2', ASK2, p) } },
      { at: 14.05, run() { liveAdd('editing', 'date.test.ts', 2, [R('Read', 'date.test.ts')]) } },
      { at: 14.55, dur: 1.7, run(_, p) { once('ans2', () => { drop('live'); SB.composerBusy(false); SB.setModel('model:claude-sonnet-4-6') }); answerAdd('a2', ANS2, p) } },

      /* -------------------------------------------------- 5. the real Spend modal: one All AI number */
      { at: 16.6, run() { SB.overlayOpen('x-spend'); SB.spendTidy(); SB.spendReveal(0) } },
      { at: 17.0, dur: 3.4, run(_, p) { SB.spendReveal(p) } },
      /* the week, the live limits of every plan, what each key paid */
      { at: 21.1, dur: 1.4, run(_, p) { SB.spendReveal(1); spendTo('[data-testid="stuff-spend-strip"]', p, -10) } },
      { at: 22.9, dur: 1.4, run(_, p) { spendTo('.stuff-spend-card', p, -6) } },
      { at: 24.7, dur: 1.2, run(_, p) { spendTo('.sb-stack', p, -30) } },

      /* -------------------------------------------------- 6. the call log: tokens and cost per call */
      { at: 26.4, run() { SB.closeOverlay('x-spend'); SB.overlayOpen('x-api-usage'); SB.apiTidy(); SB.callLogReveal(0) } },
      { at: 26.8, dur: 2.0, run(_, p) { SB.callLogReveal(p) } },
      /* the pane stops at the last call-log row (below it sits the API error-code table) */
      { at: 29.0, dur: 0.5, run(_, p) {
        const rows = SB.$$('[data-testid="api-usage-recent-row"]'); const pane = paneEl('[data-testid="api-usage-recent-row"]'); if (!rows.length || !pane) return
        const m = hold('lastrow', () => { const y0 = pane.scrollTop; const last = rows[rows.length - 1]; return { y0, y1: Math.max(y0, Math.min(pane.scrollHeight - pane.clientHeight, y0 + (last.getBoundingClientRect().bottom - pane.getBoundingClientRect().bottom) + 28)) } })
        pane.scrollTo({ top: SB.lerp(m.y0, m.y1, SB.ease.inOut(p)), behavior: 'instant' })
      } },
      { at: 30.1, run() { closeSettings() } },

      /* -------------------------------------------------- end card */
      { at: 31.0, run() { SB.keepCard({ title: ['All your AI.', 'One number.'], site: 'superbot.gg', note: 'Private beta. Invite only.', px: 150 }) } }
    ]
  }
}

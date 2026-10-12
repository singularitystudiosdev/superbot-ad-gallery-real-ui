/* live-limits (real UI): one coding thread on the real superbot-desktop hub; the real Usage panel (sidebar account widget) shows the live
 * 5 hour and 7 day bars of every connected plan filling to calm readings; the same thread carries on with the next ask on another plan.
 *   hero -> first ask typed (GPT-5 Codex, ChatGPT Plus) -> live row, answer, diff, green test run -> account widget pressed ->
 *   Usage panel: Superbot Pro credits + ChatGPT Plus + Claude Pro bars fill, then tick live -> panel closes -> second ask typed in the SAME
 *   thread, picker switches to Sonnet 4.6 (Claude Pro) -> answer, diff, full suite green -> Usage peek: Claude's bars moved -> end card.
 * Every frame is the kit's captured app DOM (rows.js / ktr-lib.js / ext.js retarget text and numbers only). run() is idempotent in p.
 */
import { ensureExt } from './ext-common.js'
await ensureExt(window.SB, [])
export default (SB) => {
  const ASK1 = 'toCsv drops the quotes around cells that contain commas. Can you fix utils/csv.ts and run the tests?'
  const ASK2 = 'Does utils/tsv.ts have the same bug? Fix it and run the whole suite.'

  const ANS1 = [
    { p: 'The failing test was `quotes cells with commas`. `toCsv` joined every cell with a comma and never escaped it, so a value like `Smith, Ana` was split into two columns.' },
    { p: 'I changed `utils/csv.ts` so any cell holding a comma, a quote or a newline is wrapped in quotes, with inner quotes doubled:' },
    { code: { lang: 'ts', text: 'const esc = (v: string) => v.replaceAll(\'"\', \'""\')\nconst quote = (v: string) => (/[",\\n]/.test(v) ? \'"\' + esc(v) + \'"\' : v)\nreturn rows.map((r) => r.map(quote).join(",")).join("\\n")' } },
    { p: 'The csv suite now passes: 9 of 9 tests, including the six that were already green. I did not touch any other file.' }
  ]
  const ANS2 = [
    { p: 'Yes. `toTsv` in `utils/tsv.ts` had the same fault: a tab or a newline inside a cell shifted every column after it.' },
    { p: 'I applied the same quoting there, keyed on tabs instead of commas:' },
    { code: { lang: 'ts', text: 'const esc = (v: string) => v.replaceAll(\'"\', \'""\')\nconst quote = (v: string) => (/["\\t\\n]/.test(v) ? \'"\' + esc(v) + \'"\' : v)\nreturn rows.map((r) => r.map(quote).join("\\t")).join("\\n")' } },
    { p: 'The whole suite passes: 41 of 41 tests across 7 files. `utils/csv.ts` is unchanged from the last turn.' }
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
  const SPEC2 = {
    label: 'Worked for 8s · 5 steps', read: { n: 2, names: 'tsv.test.ts, tsv.ts', ms: '1s 090ms' },
    diff: { file: 'tsv.ts', dir: 'utils/', add: 5, del: 1, lines: [
      { t: 'ctx', o: 1, n: 1, code: 'export function toTsv(rows: string[][]): string {' },
      { t: 'del', o: 2, n: null, code: '  return rows.map((r) => r.join("\\t")).join("\\n")' },
      { t: 'add', o: null, n: 2, code: '  const esc = (v: string) => v.replaceAll(\'"\', \'""\')' },
      { t: 'add', o: null, n: 3, code: '  const quote = (v: string) =>' },
      { t: 'add', o: null, n: 4, code: '    /["\\t\\n]/.test(v) ? \'"\' + esc(v) + \'"\' : v' },
      { t: 'add', o: null, n: 5, code: '  return rows.map((r) => r.map(quote).join("\\t")).join("\\n")' },
      { t: 'ctx', o: 3, n: 6, code: '}' }
    ] },
    ran: { cmd: 'npm test', ms: '2s 040ms' }
  }

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
    if (t < 3.0) return 0
    if (t < 9.0) return 4 + 30 * SB.ease.out(SB.clamp01((t - 3.0) / 6.0))
    if (t < 20.4) return 34
    if (t < 26.0) return 34 + 28 * SB.ease.out(SB.clamp01((t - 20.4) / 5.6))
    return 62
  }
  function ctxApply() { try { SB.setContext(ctxK(SB.t || 0)) } catch (e) { /* state without a context line */ } }

  /* ------------------------------------------------------------------ state */
  let st = {}
  const sc = () => SB.feedScroller()
  const maxY = () => { const f = sc(); return f ? f.scrollHeight - f.clientHeight : 0 }
  const setY = (y) => { const f = sc(); if (f) f.scrollTop = y }
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

  return {
    cycle: 32.4,
    preload: ['hero', 'rich-answer', 'rich-tools', 'rich-tools-open', 'rich-diff-open', 'rich-long', 'rich-live', 'picker', 'typed', 'usage'],
    setup() {
      st = {}
      SB.state('hero')
    },
    beats: [
      /* -------------------------------------------------- 1. first ask on one plan: GPT-5 Codex (ChatGPT Plus) */
      { at: 0.4, dur: 2.2, run(_, p) { SB.typeText(ASK1, p) } },
      { at: 2.95, dur: 0.4, run(_, p) {
        once('send1', () => {
          SB.threadBegin('rich-answer', TITLE); $('[data-testid="composer-plat"]').replaceWith(heroChip()); SB.composerBusy(true)
        })
        userAdd('u1', ASK1, p)
      } },
      { at: 3.6, run() { liveAdd('reading', 'csv.test.ts', 1, []) } },
      { at: 4.25, run() { liveAdd('editing', 'csv.ts', 2, [R('Read', 'csv.test.ts', 'Read utils/csv.test.ts (38 lines)'), R('Read', 'csv.ts', 'Read utils/csv.ts (19 lines)')]) } },
      { at: 4.9, run() { liveAdd('running', 'npm test -- csv', 4, [R('Read', 'csv.test.ts'), R('Read', 'csv.ts'), R('Edited', 'csv.ts')]) } },
      { at: 5.55, dur: 2.2, run(_, p) { once('ans1', () => { drop('live'); SB.composerBusy(false) }); answerAdd('a1', ANS1, p) } },
      { at: 7.95, run() { outcomeAdd('o1', () => SB.outcome('tools', SPEC1.label)) } },
      { at: 8.4, dur: 0.6, run(_, p) { once('o1s', () => { drop('o1') }); const s = once('o1s2', () => ({ node: SB.feedAppend(SB.workOutcome(SPEC1, 'steps')) })); SB.stepsReveal(s.node, p); follow() } },
      { at: 9.3, dur: 0.5, run(_, p) { glide('o1d', p, () => { drop('o1s2'); st.o1d = { node: SB.feedAppend(SB.workOutcome(SPEC1, 'diff')) } }) } },

      /* -------------------------------------------------- 2. the Usage panel: every plan's live limits */
      { at: 10.55, run() { press(true) } },
      { at: 10.95, run() { press(false); SB.overlayOpen('usage'); neutralLL(); SB.usageAnimate(FILL, 0) } },
      /* every bar fills in turn (one row every 0.22 s, each over 1 s), then the readings tick on live */
      ...FILL.map(([v, l, from, to], i) => ({ at: 11.3 + 0.22 * i, dur: 1.0, run(_, p) { SB.usageAnimate([[v, l, from, to]], p) } })),
      { at: 13.3, dur: 2.6, run(_, p) { for (const [v, l, a, b] of TICK1) SB.setUsage(v, l, SB.lerp(a, b, SB.ease.inOut(p))) } },
      { at: 16.30, run() { SB.closeOverlay('usage') } },

      /* -------------------------------------------------- 3. the same thread carries on: next ask, another plan (Claude Pro) */
      { at: 16.70, dur: 1.8, run(_, p) { SB.typeText(ASK2, p); follow() } },
      { at: 18.80, run() { SB.overlayOpen('picker') } },
      { at: 19.15, run() { SB.pickerActive(3) } },
      { at: 19.55, run() { SB.pickerActive(4) } },
      { at: 20.10, run() { SB.closeOverlay('picker'); SB.setModel('model:claude-sonnet-4-6') } },
      { at: 20.50, dur: 0.4, run(_, p) { once('send2', () => { SB.typeText('', 1); SB.composerBusy(true) }); userAdd('u2', ASK2, p) } },
      { at: 21.10, run() { liveAdd('reading', 'tsv.test.ts', 1, []) } },
      { at: 21.75, run() { liveAdd('editing', 'tsv.ts', 2, [R('Read', 'tsv.test.ts', 'Read utils/tsv.test.ts (33 lines)'), R('Read', 'tsv.ts', 'Read utils/tsv.ts (17 lines)')]) } },
      { at: 22.40, run() { liveAdd('running', 'npm test', 4, [R('Read', 'tsv.test.ts'), R('Read', 'tsv.ts'), R('Edited', 'tsv.ts')]) } },
      { at: 23.05, dur: 2.2, run(_, p) { once('ans2', () => { drop('live'); SB.composerBusy(false) }); answerAdd('a2', ANS2, p) } },
      { at: 25.45, run() { outcomeAdd('o2', () => SB.outcome('tools', SPEC2.label)) } },
      { at: 25.85, dur: 0.5, run(_, p) { once('o2s', () => { drop('o2') }); const s = once('o2s2', () => ({ node: SB.feedAppend(SB.workOutcome(SPEC2, 'steps')) })); SB.stepsReveal(s.node, p); follow() } },
      { at: 26.55, dur: 0.45, run(_, p) { glide('o2d', p, () => { drop('o2s2'); st.o2d = { node: SB.feedAppend(SB.workOutcome(SPEC2, 'diff')) } }) } },

      /* -------------------------------------------------- 4. peek again: the bars moved with the work */
      { at: 27.35, run() { press(true) } },
      { at: 27.70, run() { press(false); SB.overlayOpen('usage'); neutralLL(); setRows(REST1) } },
      { at: 28.10, dur: 2.0, run(_, p) { for (const [v, l, a, b] of TICK2) SB.setUsage(v, l, SB.lerp(a, b, SB.ease.inOut(p))) } },
      /* -------------------------------------------------- end card */
      { at: 30.40, run() { SB.closeOverlay('usage'); SB.keepCard({ title: ['Every plan’s', 'limits, live.'], site: 'superbot.gg', note: 'Private beta. Invite only.', px: 150 }) } }
    ]
  }
}

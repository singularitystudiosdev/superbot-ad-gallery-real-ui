/* keep-the-thread (real UI): one coding thread on the real superbot-desktop hub, carried across three models.
 *   hub -> search finds the thread mid-task -> opens (answer, code, diff, test run already there) -> the next ask is typed ->
 *   the real model picker switches GPT-5 Codex -> Sonnet 4.6 -> the same thread answers with a new diff and a green full suite ->
 *   a third ask, the picker switches again (superbot) -> a table of what changed + the commit message -> end card.
 * Every frame is the kit's captured app DOM (rows.js / ktr-lib.js retarget text only). run() is idempotent in p.
 */
export default (SB) => {
  const ASK1 = 'The date parser test is failing in utils/date.ts. Can you fix it and run the tests?'
  const ASK2 = 'Does utils/time.ts have the same bug? Fix it and run the whole suite.'
  const ASK3 = 'Add a regression test for the Z suffix, then write the commit message.'

  const ANS1 = [
    { p: 'The failing test was `parses a date with seconds`. `parseDate` only read hours and minutes, so any input with seconds was cut short and the timezone suffix was passed straight into `Number`, which gave `NaN`.' },
    { p: 'I changed `utils/date.ts` so it defaults the seconds to `0`, strips the offset before splitting, and builds the date from all three time parts:' },
    { code: { lang: 'ts', text: 'const clock = timePart.replace(/(Z|[+-]\\d\\d:\\d\\d)$/, "")\nconst [h, m, s = 0] = clock.split(":").map(Number)\nreturn new Date(Date.UTC(y, mo - 1, d, h, m, s))' } },
    { p: 'The date suite now passes: 12 of 12 tests, including the two that were already green. I did not touch any other file.' }
  ]
  const ANS2 = [
    { p: 'Yes. `parseClock` in `utils/time.ts` had the same fault: it read only hours and minutes, so a time with seconds lost them, and a trailing `Z` went straight into `Number`.' },
    { p: 'I applied the same fix there, stripping the offset first and defaulting the seconds to `0`:' },
    { code: { lang: 'ts', text: 'const clock = input.replace(/(Z|[+-]\\d\\d:\\d\\d)$/, "")\nconst [h, m, s = 0] = clock.split(":").map(Number)\nreturn h * 3600 + m * 60 + s' } },
    { p: 'The whole suite passes: 58 of 58 tests across 9 files. `utils/date.ts` is unchanged from the last turn.' }
  ]
  const ANS3 = [
    { p: 'Added one regression test in `utils/time.test.ts`. It feeds `parseClock` a time with seconds and a `Z` suffix and expects `34215`. The suite is at 59 of 59.' },
    { table: { head: ['File', 'Change', 'Tests'], rows: [['utils/date.ts', 'Seconds and offset parsing', '12 of 12'], ['utils/time.ts', 'Same fix in parseClock', '58 of 58'], ['utils/time.test.ts', 'New Z suffix case', '59 of 59']] } },
    { p: 'Commit message:' },
    { code: { lang: 'bash', run: false, text: 'git commit -am "Parse seconds and UTC offsets in date and time helpers"\n# utils/date.ts, utils/time.ts, utils/time.test.ts' } }
  ]

  const SPEC1 = {
    label: 'Worked for 4s · 4 steps', read: { n: 2, names: 'date.test.ts, date.ts', ms: '1s 050ms' },
    diff: { file: 'date.ts', dir: 'utils/', add: 4, del: 3, lines: [
      { t: 'ctx', o: 1, n: 1, code: 'export function parseDate(input: string): Date {' },
      { t: 'del', o: 2, n: null, code: '  const [datePart, timePart = "00:00"] = input.split("T")' },
      { t: 'del', o: 3, n: null, code: '  const [h, m] = timePart.split(":").map(Number)' },
      { t: 'add', o: null, n: 2, code: '  const [datePart, timePart = "00:00:00"] = input.split("T")' },
      { t: 'add', o: null, n: 3, code: '  const clock = timePart.replace(/(Z|[+-]\\d\\d:\\d\\d)$/, "")' },
      { t: 'add', o: null, n: 4, code: '  const [h, m, s = 0] = clock.split(":").map(Number)' },
      { t: 'ctx', o: 4, n: 5, code: '  const [y, mo, d] = datePart.split("-").map(Number)' },
      { t: 'del', o: 5, n: null, code: '  return new Date(Date.UTC(y, mo - 1, d, h, m))' },
      { t: 'add', o: null, n: 6, code: '  return new Date(Date.UTC(y, mo - 1, d, h, m, s))' },
      { t: 'ctx', o: 6, n: 7, code: '}' }
    ] },
    ran: { cmd: 'npm test -- date', ms: '699ms' }
  }
  const SPEC2 = {
    label: 'Worked for 9s · 5 steps', read: { n: 2, names: 'time.test.ts, time.ts', ms: '1s 120ms' },
    diff: { file: 'time.ts', dir: 'utils/', add: 3, del: 2, lines: [
      { t: 'ctx', o: 1, n: 1, code: '/** Seconds since midnight. */' },
      { t: 'ctx', o: 2, n: 2, code: 'export function parseClock(input: string): number {' },
      { t: 'del', o: 3, n: null, code: '  const [h, m] = input.split(":").map(Number)' },
      { t: 'del', o: 4, n: null, code: '  return h * 3600 + m * 60' },
      { t: 'add', o: null, n: 3, code: '  const clock = input.replace(/(Z|[+-]\\d\\d:\\d\\d)$/, "")' },
      { t: 'add', o: null, n: 4, code: '  const [h, m, s = 0] = clock.split(":").map(Number)' },
      { t: 'add', o: null, n: 5, code: '  return h * 3600 + m * 60 + s' },
      { t: 'ctx', o: 5, n: 6, code: '}' }
    ] },
    ran: { cmd: 'npm test', ms: '2s 310ms' }
  }
  const SPEC3 = {
    label: 'Worked for 6s · 4 steps', read: { n: 1, names: 'time.test.ts', ms: '640ms' },
    diff: { file: 'time.test.ts', dir: 'utils/', add: 3, del: 0, lines: [
      { t: 'ctx', o: 11, n: 11, code: 'it("parses hours and minutes", () => {' },
      { t: 'ctx', o: 12, n: 12, code: '  expect(parseClock("09:30")).toBe(34200)' },
      { t: 'ctx', o: 13, n: 13, code: '})' },
      { t: 'add', o: null, n: 14, code: 'it("ignores a trailing Z", () => {' },
      { t: 'add', o: null, n: 15, code: '  expect(parseClock("09:30:15Z")).toBe(34215)' },
      { t: 'add', o: null, n: 16, code: '})' },
      { t: 'ctx', o: 14, n: 17, code: '' }
    ] },
    ran: { cmd: 'npm test', ms: '2s 270ms' }
  }

  const TITLE = 'Date parser'
  const PALETTE = [
    { mark: 0, title: TITLE, vendor: 'ChatGPT', meta: 'Oct 11' },
    { mark: 1, title: 'ISO week numbers', vendor: 'Claude', meta: 'Sep 7', snippet: 'does the date parser handle week 53' },
    { mark: 3, title: 'Cowork: the billing refactor', vendor: 'Cowork', meta: 'Sep 8', snippet: 'swap in the new date parser' },
    { mark: 5, title: 'Release notes draft', vendor: 'ChatGPT', meta: 'Sep 4', snippet: 'mention the date parser fix' }
  ]
  const QUERY = 'date parser'

  const $ = SB.$
  const heroChip = () => SB.tpl('hero', '[data-testid="composer-plat"]')
  /* ------------------------------------------------------------------ state */
  let st = {}
  const sc = () => SB.feedScroller()
  const maxY = () => { const f = sc(); return f ? f.scrollHeight - f.clientHeight : 0 }
  const setY = (y) => { const f = sc(); if (f) f.scrollTop = y }
  const once = (k, fn) => { if (!st[k]) st[k] = fn() || {} ; return st[k] }
  const drop = (k) => { if (st[k] && st[k].node && st[k].node.isConnected) st[k].node.remove(); st[k] = null }
  /** Run mutate() once at the first frame of the beat, then glide the feed scroll from where it was to the new end (pure in t at p = 1). */
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

  return {
    cycle: 31.2,
    preload: ['hero', 'list-search', 'rich-answer', 'rich-tools', 'rich-tools-open', 'rich-diff-open', 'rich-long', 'rich-live', 'picker', 'typed'],
    setup() {
      st = {}
      SB.state('hero')
    },
    beats: [
      /* -------------------------------------------------- 1. search finds the thread */
      { at: 0.5, run() { SB.overlayOpen('palette'); SB.paletteQuery('', 1); SB.paletteResults(PALETTE, '', 0) } },
      { at: 0.8, dur: 1.3, run(_, p) { SB.paletteQuery(QUERY, p); SB.paletteResults(PALETTE, QUERY.slice(0, SB.typedCount(QUERY, p)), 0) } },
      /* open it: the thread is already mid-task, with its answer, code, diff and test run */
      { at: 2.7, dur: 0.45, run(_, p) {
        once('open', () => {
          SB.closeOverlay('palette')
          SB.threadBegin('rich-answer', TITLE); $('[data-testid="composer-plat"]').replaceWith(heroChip())
          const u = SB.feedAppend(SB.userRow(ASK1)); const a = SB.feedAppend(SB.answerRow(ANS1)); const o = SB.feedAppend(SB.workOutcome(SPEC1, 'diff'))
          st.t1 = { u, a, o }; setY(0)
        })
        const rows = [st.t1.u, st.t1.a, st.t1.o]
        rows.forEach((r, i) => SB.rise(r, SB.clamp01(p * 1.6 - i * 0.15), 10))
        setY(0)
      } },
      { at: 3.35, dur: 1.3, run(_, p) { setY(maxY() * SB.ease.inOut(p)) } },

      /* -------------------------------------------------- 2. next ask, the picker switches the model */
      { at: 4.9, dur: 2.2, run(_, p) { SB.typeText(ASK2, p); follow() } },
      { at: 7.3, run() { SB.overlayOpen('picker') } },
      { at: 7.7, run() { SB.pickerActive(3) } },
      { at: 8.15, run() { SB.pickerActive(4) } },
      { at: 8.8, run() { SB.closeOverlay('picker'); SB.setModel('model:claude-sonnet-4-6') } },
      /* send: the bubble rises in, the composer goes busy, the live row works through the steps */
      { at: 9.3, dur: 0.4, run(_, p) { once('send2', () => { SB.typeText('', 1); SB.composerBusy(true) }); userAdd('u2', ASK2, p) } },
      { at: 9.9, run() { liveAdd('reading', 'time.test.ts', 1, []) } },
      { at: 10.6, run() { liveAdd('editing', 'time.ts', 2, [R('Read', 'time.test.ts', 'Read utils/time.test.ts (41 lines)'), R('Read', 'time.ts', 'Read utils/time.ts (27 lines)')]) } },
      { at: 11.3, run() { liveAdd('running', 'npm test', 4, [R('Read', 'time.test.ts'), R('Read', 'time.ts'), R('Edited', 'time.ts')]) } },
      { at: 12.0, dur: 2.4, run(_, p) { once('ans2', () => { drop('live'); SB.composerBusy(false) }); answerAdd('a2', ANS2, p) } },
      { at: 14.6, run() { outcomeAdd('o2', () => SB.outcome('tools', SPEC2.label)) } },
      { at: 15.1, dur: 0.6, run(_, p) { once('o2s', () => { drop('o2') }); const s = once('o2s2', () => ({ node: SB.feedAppend(SB.workOutcome(SPEC2, 'steps')) })); SB.stepsReveal(s.node, p); follow() } },
      { at: 16.2, dur: 0.5, run(_, p) { glide('o2d', p, () => { drop('o2s2'); st.o2d = { node: SB.feedAppend(SB.workOutcome(SPEC2, 'diff')) } }) } },

      /* -------------------------------------------------- 3. third ask, another model */
      { at: 17.4, dur: 1.8, run(_, p) { SB.typeText(ASK3, p); follow() } },
      { at: 19.4, run() { SB.overlayOpen('picker') } },
      { at: 19.75, run() { SB.pickerActive(2) } },
      { at: 20.1, run() { SB.pickerActive(0) } },
      { at: 20.6, run() { SB.closeOverlay('picker'); SB.setModel('superbot') } },
      { at: 21.0, dur: 0.4, run(_, p) { once('send3', () => { SB.typeText('', 1); SB.composerBusy(true) }); userAdd('u3', ASK3, p) } },
      { at: 21.6, run() { liveAdd('reading', 'time.test.ts', 1, []) } },
      { at: 22.3, run() { liveAdd('editing', 'time.test.ts', 3, [R('Read', 'time.test.ts', 'Read utils/time.test.ts (41 lines)')]) } },
      { at: 22.9, dur: 2.2, run(_, p) { once('ans3', () => { drop('live'); SB.composerBusy(false) }); answerAdd('a3', ANS3, p) } }
      ,
      { at: 25.3, run() { outcomeAdd('o3', () => SB.outcome('tools', SPEC3.label)) } },
      { at: 25.8, dur: 0.6, run(_, p) { once('o3s', () => { drop('o3') }); const s = once('o3s2', () => ({ node: SB.feedAppend(SB.workOutcome(SPEC3, 'steps')) })); SB.stepsReveal(s.node, p); follow() } },
      { at: 26.8, dur: 0.5, run(_, p) { glide('o3d', p, () => { drop('o3s2'); st.o3d = { node: SB.feedAppend(SB.workOutcome(SPEC3, 'diff')) } }) } },
      /* -------------------------------------------------- end card */
      { at: 28.6, run() { SB.keepCard({ title: ['Switch AI.', 'Keep the thread.'], site: 'superbot.gg', note: 'Private beta. Invite only.', px: 150 }) } }
    ]
  }
}

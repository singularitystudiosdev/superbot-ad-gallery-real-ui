/* every-ai-pocket (real UI + the real iOS app): a thread runs on the Mac across two models (the real picker: Sonnet 4.6 then GPT-5 Codex), then the
 * phone phase: the desktop dims and the shipped iOS app's own simulator screenshots (provider rail + Connect, the composer with the keyboard, the lane
 * sheet crop) rise in beside two-line captions, then the end card.
 *   hero -> picker -> ask on sonnet -> live rows -> answer + diff + test run -> picker -> ask on codex -> answer
 *   -> phone: rail ("2 desktop chats are waiting.") -> composer -> lane sheet -> end card.
 * Desktop frames: the kit's captured app DOM (rows.js / ktr-lib.js / ep-lib.js retarget text only). Phone frames: the app's real iOS pixels, never drawn.
 * run() is idempotent in p.
 */
import { ensureExt } from './ext-common.js'
await ensureExt(window.SB, [])
await window.SB.iosPreload(['ios-connect', 'ios-composer', 'ios-sheet'])
export default (SB) => {
  const ASK = 'Move the invoice export to a background job and run the tests.'
  const ASK2 = 'Add a retry with backoff to the mail step and test it.'

  const ANS = [
    { p: 'Done. The export now runs in a queue worker, so the request returns right away and the file is mailed when the job finishes:' },
    { code: { lang: 'ts', text: 'export async function requestExport(id: string) {\n  await queue.add("export", { id })\n  return { queued: true }\n}' } },
    { p: 'All 18 tests pass, including the new queue test.' }
  ]
  const ANS2 = [
    { p: 'Added up to three retries with a growing delay to `sendExport`. The new test passes and the suite is at 19 of 19:' },
    { code: { lang: 'ts', text: 'for (let n = 0; n < 3; n++) {\n  if (await mail(file)) return\n  await sleep(200 * 2 ** n)\n}' } }
  ]

  const SPEC = {
    label: 'Worked for 7s · 5 steps', read: { n: 2, names: 'export.ts, queue.ts', ms: '1.1s' },
    diff: { file: 'export.ts', dir: 'src/', add: 3, del: 2, lines: [
      { t: 'ctx', o: 8, n: 8, code: 'export async function requestExport(id: string) {' },
      { t: 'del', o: 9, n: null, code: '  const file = await buildCsv(id)' },
      { t: 'del', o: 10, n: null, code: '  await mail(file)' },
      { t: 'add', o: null, n: 9, code: '  await queue.add("export", { id })' },
      { t: 'add', o: null, n: 10, code: '  return { queued: true }' },
      { t: 'ctx', o: 11, n: 11, code: '}' },
      { t: 'ctx', o: 12, n: 12, code: '' },
      { t: 'ctx', o: 13, n: 13, code: 'queue.process("export", async ({ id }) => {' },
      { t: 'add', o: null, n: 14, code: '  await mail(await buildCsv(id))' },
      { t: 'ctx', o: 14, n: 15, code: '})' }
    ] },
    ran: { cmd: 'npm test', ms: '4s 210ms' }
  }

  const TITLE = 'Run the export in the background'
  const $ = SB.$
  const heroChip = () => SB.tpl('hero', '[data-testid="composer-plat"]')

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

  const POCKET_AT = 16.2, POCKET_T = 13.9

  return {
    cycle: 32.9,
    preload: ['hero', 'picker', 'typed', 'rich-answer', 'rich-tools', 'rich-tools-open', 'rich-diff-open', 'rich-long', 'rich-live'],
    setup() {
      st = {}
      SB.state('hero'); SB.setModel('superbot')
    },
    beats: [
      /* -------------------------------------------------- 1. the real picker: pick the first model */
      { at: 0.3, run() { SB.overlayOpen('picker') } },
      { at: 0.65, dur: 1.0, run(_, p) { SB.pickerActive(Math.min(4, Math.floor(p * 5))) } },
      { at: 1.8, run() { SB.closeOverlay('picker'); SB.setModel('model:claude-sonnet-4-6') } },

      /* -------------------------------------------------- 2. real work: ask, live rows */
      { at: 2.0, dur: 2.1, run(_, p) { SB.typeText(ASK, p) } },
      { at: 4.4, dur: 0.4, run(_, p) {
        once('send1', () => { SB.threadBegin('rich-answer', TITLE); $('[data-testid="composer-plat"]').replaceWith(heroChip()); SB.setModel('model:claude-sonnet-4-6'); SB.composerBusy(true) })
        userAdd('u1', ASK, p)
      } },
      { at: 4.9, run() { liveAdd('reading', 'export.ts', 1, []) } },
      { at: 5.4, run() { liveAdd('editing', 'export.ts', 2, [R('Read', 'export.ts', 'Read src/export.ts (48 lines)'), R('Read', 'queue.ts', 'Read src/queue.ts (22 lines)')]) } },
      { at: 5.9, run() { liveAdd('running', 'npm test', 3, [R('Read', 'export.ts'), R('Read', 'queue.ts'), R('Edited', 'export.ts')]) } },

      /* -------------------------------------------------- 3. the answer lands: code, steps, the diff, the test run */
      { at: 6.4, dur: 2.2, run(_, p) { once('ans1', () => { drop('live'); SB.composerBusy(false); SB.setModel('model:claude-sonnet-4-6') }); answerAdd('a1', ANS, p) } },
      { at: 8.75, run() { outcomeAdd('o1', () => SB.outcome('tools', SPEC.label)) } },
      { at: 9.1, dur: 0.4, run(_, p) { once('o1s', () => { drop('o1') }); const s = once('o1s2', () => ({ node: SB.feedAppend(SB.workOutcome(SPEC, 'steps')) })); SB.stepsReveal(s.node, p); follow() } },
      { at: 9.65, dur: 0.45, run(_, p) { glide('o1d', p, () => { drop('o1s2'); st.o1d = { node: SB.feedAppend(SB.workOutcome(SPEC, 'diff')) } }) } },

      /* -------------------------------------------------- 4. next ask on another model: the real picker switches, same thread */
      { at: 11.0, dur: 1.2, run(_, p) { SB.typeText(ASK2, p); follow() } },
      { at: 12.4, run() { SB.overlayOpen('picker') } },
      { at: 12.65, run() { SB.pickerActive(4) } },
      { at: 12.95, run() { SB.pickerActive(3) } },
      { at: 13.3, run() { SB.closeOverlay('picker'); SB.setModel('model:gpt-5-codex') } },
      { at: 13.55, dur: 0.35, run(_, p) { once('send2', () => { SB.typeText('', 1); SB.composerBusy(true) }); userAdd('u2', ASK2, p) } },
      { at: 14.05, run() { liveAdd('editing', 'export.ts', 2, [R('Read', 'export.ts')]) } },
      { at: 14.55, dur: 1.5, run(_, p) { once('ans2', () => { drop('live'); SB.composerBusy(false); SB.setModel('model:gpt-5-codex') }); answerAdd('a2', ANS2, p) } },

      /* -------------------------------------------------- 5. the phone: the shipped iOS app's own screens beside the real desktop */
      { at: POCKET_AT, dur: POCKET_T, run(_, p) { SB.pocket(p * POCKET_T) } },

      /* -------------------------------------------------- end card */
      { at: POCKET_AT + POCKET_T, run() { SB.keepCard({ title: ['Every AI you pay for.', 'In your pocket.'], site: 'superbot.gg', note: 'Private beta. Invite only.', px: 150 }) } }
    ]
  }
}

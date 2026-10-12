/* fewer-tokens-short (real UI): token-burn in the 15 s short format (the recipe of one-key-short, same kit + ok-lib + ktr-lib + ext.js).
 *   t=0 the video opens ON the real Settings > Context page of superbot-desktop (the thread that asked for the work sits behind it):
 *   "Tidy it for Superbot chats / Recommended / Your other apps keep their setup. We never rewrite your words." -> the click on Tidy
 *   -> the Context map (the treemap of what a turn can load) -> Per app -> "What Tidy did" (how its rules land: every turn / on demand / pointers / off)
 *   -> the sheet closes, the same thread does the work (answer, the sync/client.ts diff, npm test) with a calm context meter
 *   -> end card (static mascot, Fewer tokens. Same work., superbot.gg, Private beta. Invite only.) at 11.7 s, held 3.3 s.
 * The persistent "superbot.gg" wordmark (ad copy, header gap, from ~1 s) keeps the destination on screen at any drop-off point.
 * Every frame is the real app's DOM (captured from a gate-on copy of the prebuilt app); only text / numbers / transforms are retargeted. run() is idempotent in p.
 * NO token figure, percentage or saving is on screen (SB.ctxFigures removes the value cells): the ad claims nothing numeric.
 */
import { ensureCtx } from './ctx-common.js'
await ensureCtx(window.SB, ['ctx-asis', 'ctx-tidy', 'ctx-open'])
export default (SB) => {
  const ASK = 'Add retry with backoff to the sync client, then run the tests.'

  const ANS = [
    { p: 'Done. `push` in `sync/client.ts` now retries a request up to three times, waiting longer each time (250 ms, 500 ms, 1 s):' },
    { code: { lang: 'ts', text: 'export async function push(batch: Batch) {\n  for (let i = 0; ; i++) {\n    try { return await post("/sync", batch) }\n    catch (e) { if (i >= 3) throw e; await sleep(2 ** i * 250) }\n  }\n}' } },
    { p: 'The three new tests pass and the rest of the suite is unchanged.' }
  ]

  const SPEC = {
    label: 'Worked for 9s · 6 steps', read: { n: 2, names: 'client.ts, client.test.ts', ms: '0s 940ms' },
    diff: { file: 'client.ts', dir: 'sync/', add: 7, del: 2, lines: [
      { t: 'ctx', o: 1, n: 1, code: 'import { post } from "./http"' },
      { t: 'add', o: null, n: 2, code: 'import { sleep } from "./time"' },
      { t: 'ctx', o: 2, n: 3, code: '' },
      { t: 'del', o: 3, n: null, code: 'export async function push(batch: Batch) {' },
      { t: 'del', o: 4, n: null, code: '  return post("/sync", batch)' },
      { t: 'add', o: null, n: 4, code: 'const MAX = 3' },
      { t: 'add', o: null, n: 5, code: 'export async function push(batch: Batch) {' },
      { t: 'add', o: null, n: 6, code: '  for (let i = 0; ; i++) {' },
      { t: 'add', o: null, n: 7, code: '    try { return await post("/sync", batch) }' },
      { t: 'add', o: null, n: 8, code: '    catch (e) { if (i >= MAX) throw e; await sleep(2 ** i * 250) }' },
      { t: 'add', o: null, n: 9, code: '  }' },
      { t: 'ctx', o: 5, n: 10, code: '}' }
    ] },
    ran: { cmd: 'npm test', ms: '6s 120ms' }
  }

  const TITLE = 'Retry the sync client'
  const $ = SB.$
  const heroChip = () => SB.tpl('hero', '[data-testid="composer-plat"]')
  const paneEl = (sel) => { let e = SB.$(sel); while (e && !(e.scrollHeight > e.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(e).overflowY))) e = e.parentElement; return e }
  const paneTop = (sel) => () => { const e = paneEl(sel); return e ? e.scrollTop : 0 }
  const memo = {}
  const from = (k, f) => (memo[k] ??= f())

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
  const answerAdd = (k, blocks, p) => { const s = once(k, () => ({ node: SB.feedAppend(SB.answerRow(blocks)) })); SB.stream(s.node, p); follow() }
  const liveAdd = (verb, target, secs, steps) => { drop('live'); st.live = { node: SB.feedAppend(SB.liveRow({ verb, target, secs, steps })) }; follow() }
  const R = (verb, target, result) => ({ verb, target, result })
  /* the sheet is ALREADY on screen at t=0: open it with its entrance finished (no fade-in from an empty first frame) */
  const sheet = (name) => SB.ctxGo(name)
  /* scroll the pane so `sel` sits near its top: from the captured scrollTop of the pane at the start of the beat */
  const scrollTo = (k, sel, p, dy = -14) => SB.scrollToEl(sel, p, from(k, paneTop(sel)), dy)

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
    preload: ['hero', 'typed', 'rich-answer', 'rich-tools', 'rich-tools-open', 'rich-diff-open', 'rich-long', 'rich-live'],
    setup() {
      st = {}; for (const k of Object.keys(memo)) delete memo[k]
      SB.state('hero'); SB.setModel('superbot')
    },
    beats: [
      /* -------------------------------------------------- 0 s: straight on the real Settings > Context page; the thread that asked for the work is behind it */
      { at: 0, run() {
        once('thread', () => {
          SB.threadBegin('rich-answer', TITLE); $('[data-testid="composer-plat"]').replaceWith(heroChip()); SB.setModel('superbot'); SB.composerBusy(true); SB.setContext(38, 200)
          st.u1 = { node: SB.feedAppend(SB.userRow(ASK)) }; SB.rise(st.u1.node, 1, 8)
          st.live = { node: SB.feedAppend(SB.liveRow({ verb: 'running', target: 'npm test', secs: 3, steps: [R('Read', 'client.ts'), R('Read', 'client.test.ts'), R('Edited', 'client.ts')] })) }; follow()
        })
        once('sheet', () => { sheet('ctx-asis') })
      } },
      { at: 0.9, dur: 0.35, run(_, p) { wordmark(p) } },

      /* -------------------------------------------------- 0.8 s: the click on "Tidy it for Superbot chats" (radio moves, the Learn row opens) */
      { at: 0.8, run() { once('tidy', () => { sheet('ctx-tidy') }) } },
      /* 1.5 s: the Context map and the Advanced fold open (their token figures removed) */
      { at: 1.5, run() { once('open', () => { sheet('ctx-open') }); SB.ctxFigures() } },

      /* -------------------------------------------------- 1.7 s: to the Context map (the treemap of what a turn can load) */
      { at: 1.7, dur: 1.1, run(_, p) { scrollTo('s1', '[data-testid="settings-context-map"]', p); SB.ctxFigures() } },

      /* -------------------------------------------------- 4.6 s: What Tidy did: how its rules land per app (counts only) */
      { at: 4.6, dur: 1.4, run(_, p) { SB.ctxFigures(); scrollTo('s2', '[data-testid="settings-context-per-app"]', p) } },

      /* -------------------------------------------------- 7.3 s: the sheet closes, the same thread does the work */
      { at: 7.3, run() { liveAdd('running', 'npm test', 5, [R('Read', 'client.ts'), R('Read', 'client.test.ts'), R('Edited', 'client.ts')]); SB.ctxClose(); SB.setContext(38, 200) } },
      { at: 7.5, dur: 1.3, run(_, p) { once('ans1', () => { drop('live'); SB.composerBusy(false); SB.setModel('superbot'); SB.setContext(38, 200) }); answerAdd('a1', ANS, p) } },
      { at: 9.1, dur: 0.35, run(_, p) { const s = once('o1s2', () => ({ node: SB.feedAppend(SB.workOutcome(SPEC, 'steps')) })); SB.stepsReveal(s.node, p); follow() } },
      { at: 9.7, dur: 0.4, run(_, p) { glide('o1d', p, () => { drop('o1s2'); st.o1d = { node: SB.feedAppend(SB.workOutcome(SPEC, 'diff')) } }) } },

      /* -------------------------------------------------- end card: lands at 11.7 s, holds 3.3 s */
      { at: 11.7, run() { SB.keepCard({ title: ['Fewer tokens.', 'Same work.'], site: 'superbot.gg', note: 'Private beta. Invite only.', px: 150 }) } }
    ]
  }
}

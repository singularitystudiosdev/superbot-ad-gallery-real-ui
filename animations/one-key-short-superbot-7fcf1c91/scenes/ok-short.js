/* one-key-short (real UI): the 15 s cut of one-key-real, built for the feed's drop-off curve (only ~2-3 % of impressions reach a 30 s video's
 * halfway point, so the destination and the hook sit in the first seconds and the end card lands before 12 s).
 *   t=0 the video opens ON the real Settings > Connections > API access sheet (the one endpoint https://api.superbot.gg), the thread that asked
 *   for the call already sits behind it -> the curl snippet: ONE request, only the model id changes (gpt-5-codex -> claude-sonnet-4-6 -> superbot)
 *   -> Usage: the call log fills across models (tokens + cost per call) -> sheet closes, the answer lands in the thread with the bot/ask.ts diff
 *   -> end card (static mascot, One key. Every model., superbot.gg, Private beta. Invite only.) at 11.7 s, held 3.3 s.
 * A small persistent "superbot.gg" wordmark (ad copy, header gap, from ~1 s) keeps the destination on screen at any drop-off point.
 * Every frame is the kit's captured app DOM (rows.js / ktr-lib.js / ext.js / ok-lib.js retarget text and numbers only). run() is idempotent in p.
 */
import { ensureExt } from './ext-common.js'
await ensureExt(window.SB, ['api-top', 'api-keys', 'api-usage', 'api-docs'])
export default (SB) => {
  const ASK = 'Point the review bot at our relay: one base URL, one key, the model named per call. Run it on three models.'

  const ANS = [
    { p: 'Done. `bot/ask.ts` now posts to `https://api.superbot.gg/v1/chat/completions` with one caller key, and the `model` field is the only thing that changes between calls:' },
    { code: { lang: 'ts', text: 'const models = ["gpt-5-codex", "claude-sonnet-4-6", "superbot"]\nfor (const model of models) {\n  const out = await ask(model, prompt)\n  console.log(model, out.usage.total_tokens)\n}' } },
    { p: 'All three answered through the one key. The URL and the key come from Settings > API access, and each call shows up in its call log.' }
  ]

  const SPEC = {
    label: 'Worked for 7s · 5 steps', read: { n: 2, names: 'ask.ts, run.ts', ms: '1s 120ms' },
    diff: { file: 'ask.ts', dir: 'bot/', add: 6, del: 2, lines: [
      { t: 'ctx', o: 1, n: 1, code: 'import { env } from "node:process"' },
      { t: 'del', o: 2, n: null, code: 'const BASE = "https://llm.internal.example/v1"' },
      { t: 'add', o: null, n: 2, code: 'const BASE = "https://api.superbot.gg/v1"' },
      { t: 'add', o: null, n: 3, code: 'const KEY = env.SUPERBOT_KEY' },
      { t: 'ctx', o: 3, n: 4, code: 'export async function ask(model: string, messages: Msg[]) {' },
      { t: 'del', o: 4, n: null, code: '  const res = await fetch(BASE + "/chat", { body: messages })' },
      { t: 'add', o: null, n: 5, code: '  const res = await fetch(BASE + "/chat/completions", {' },
      { t: 'add', o: null, n: 6, code: '    method: "POST", headers: { Authorization: "Bearer " + KEY },' },
      { t: 'add', o: null, n: 7, code: '    body: JSON.stringify({ model, messages })' },
      { t: 'add', o: null, n: 8, code: '  })' },
      { t: 'ctx', o: 5, n: 9, code: '  return res.json()' }
    ] },
    ran: { cmd: 'node bot/run.ts', ms: '4s 380ms' }
  }

  const TITLE = 'Review bot relay'
  const $ = SB.$
  const heroChip = () => SB.tpl('hero', '[data-testid="composer-plat"]')
  const top = (sel) => () => { let e = SB.$(sel); while (e && !(e.scrollHeight > e.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(e).overflowY))) e = e.parentElement; return e ? e.scrollTop : 0 }
  const paneEl = (sel) => { let e = SB.$(sel); while (e && !(e.scrollHeight > e.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(e).overflowY))) e = e.parentElement; return e }
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
  const userAdd = (k, text, p) => { const s = once(k, () => ({ node: SB.feedAppend(SB.userRow(text)) })); SB.rise(s.node, p, 8); follow() }
  const answerAdd = (k, blocks, p) => { const s = once(k, () => ({ node: SB.feedAppend(SB.answerRow(blocks)) })); SB.stream(s.node, p); follow() }
  const liveAdd = (verb, target, secs, steps) => { drop('live'); st.live = { node: SB.feedAppend(SB.liveRow({ verb, target, secs, steps })) }; follow() }
  const R = (verb, target, result) => ({ verb, target, result })
  const closeSettings = () => { for (const n of ['x-api', 'x-api-keys', 'x-api-usage', 'x-api-docs']) SB.closeOverlay(n); for (const e of SB.$$('[data-testid="settings-overlay"]')) e.remove() }
  /* the sheet is ALREADY on screen at t=0: open it with its entrance finished (no fade-in from an empty first frame) */
  const openSettingsOn = (name) => { const el = SB.overlayOpen(name); SB.apiTidy(); for (const a of el.getAnimations({ subtree: true })) { try { a.finish() } catch (e) { /* ignore */ } } return el }

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
      /* -------------------------------------------------- 0 s: straight on the real API access sheet; the thread that asked for the call is behind it */
      { at: 0, run() {
        once('thread', () => {
          SB.threadBegin('rich-answer', TITLE); $('[data-testid="composer-plat"]').replaceWith(heroChip()); SB.setModel('superbot'); SB.composerBusy(true)
          st.u1 = { node: SB.feedAppend(SB.userRow(ASK)) }; SB.rise(st.u1.node, 1, 8)
          st.live = { node: SB.feedAppend(SB.liveRow({ verb: 'running', target: 'node bot/run.ts', secs: 3, steps: [R('Read', 'ask.ts'), R('Read', 'run.ts'), R('Edited', 'ask.ts')] })) }; follow()
        })
        once('sheet', () => { openSettingsOn('x-api') })
      } },
      { at: 0.9, dur: 0.35, run(_, p) { wordmark(p) } },

      /* -------------------------------------------------- 0.9 s: to the curl snippet, ONE request; only the model id changes */
      { at: 0.9, dur: 0.8, run(_, p) { SB.snippetModel(0.8); SB.scrollToEl('[data-testid="developer-snippet-curl"]', p, from('s1', top('[data-testid="stuff-api"]')), -12) } },
      { at: 1.7, dur: 2.8, run(_, p) { SB.snippetModel(Math.min(3, 0.8 + p * 2.2)) } },

      /* -------------------------------------------------- 5.0 s: the call log fills across models (Advanced > Usage > Recent requests) */
      { at: 5.0, run() { SB.settingsGo('x-api-usage'); SB.apiTidy(); SB.callLogReveal(0) } },
      { at: 5.3, dur: 2.0, run(_, p) { SB.callLogReveal(p) } },
      { at: 7.3, dur: 0.4, run(_, p) { const e = paneEl('[data-testid="api-usage-recent-row"]'); if (e) { const y0 = from('s4', () => e.scrollTop); const rows = SB.$$('[data-testid="api-usage-recent-row"]'); const last = rows[rows.length - 1]; const y1 = from('s5', () => Math.min(e.scrollHeight - e.clientHeight, e.scrollTop + (last.getBoundingClientRect().bottom - e.getBoundingClientRect().bottom) + 28)); e.scrollTo({ top: y0 + (Math.max(y0, y1) - y0) * SB.ease.inOut(p), behavior: 'instant' }) } } },
      { at: 7.85, run() { liveAdd('running', 'node bot/run.ts', 5, [R('Read', 'ask.ts'), R('Read', 'run.ts'), R('Edited', 'ask.ts')]); closeSettings() } },

      /* -------------------------------------------------- 8 s: back in the thread, the answer lands, then the real diff of bot/ask.ts */
      { at: 8.0, dur: 1.2, run(_, p) { once('ans1', () => { drop('live'); SB.composerBusy(false); SB.setModel('superbot') }); answerAdd('a1', ANS, p) } },
      { at: 9.4, dur: 0.35, run(_, p) { const s = once('o1s2', () => ({ node: SB.feedAppend(SB.workOutcome(SPEC, 'steps')) })); SB.stepsReveal(s.node, p); follow() } },
      { at: 9.9, dur: 0.4, run(_, p) { glide('o1d', p, () => { drop('o1s2'); st.o1d = { node: SB.feedAppend(SB.workOutcome(SPEC, 'diff')) } }) } },

      /* -------------------------------------------------- end card: lands at 11.7 s, holds 3.3 s */
      { at: 11.7, run() { SB.keepCard({ title: ['One key.', 'Every model.'], site: 'superbot.gg', note: 'Private beta. Invite only.', px: 150 }) } }
    ]
  }
}

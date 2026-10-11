/* one-key-every-model (real UI): one thread on the real superbot-desktop hub asks an agent to point a bot at the relay; while the run is in
 * flight the real Settings > Connections > API access sheet shows the one endpoint and the one key (the drop-in snippet takes the model id,
 * the call log fills with calls across models, tokens + cost per call); back in the thread the answer lands.
 *   hero -> picker lists every model -> ask typed -> live rows -> gear -> API access (endpoint, snippet with the model id swapping, caller keys)
 *   -> Usage (call log fills) -> sheet closes -> answer with the three calls, diff of bot/ask.ts, the run -> end card.
 * Every frame is the kit's captured app DOM (rows.js / ktr-lib.js / ext.js / ok-lib.js retarget text and numbers only). run() is idempotent in p.
 */
import { ensureExt } from './ext-common.js'
await ensureExt(window.SB, ['api-top', 'api-keys', 'api-usage', 'api-docs'])
export default (SB) => {
  const ASK = 'Point the review bot at our relay: one base URL, one key, the model named per call. Run it on three models.'
  const ASK2 = 'Which of the three is cheapest for the review job?'

  const ANS = [
    { p: 'Done. `bot/ask.ts` now posts to `https://api.superbot.gg/v1/chat/completions` with one caller key, and the `model` field is the only thing that changes between calls:' },
    { code: { lang: 'ts', text: 'const models = ["gpt-5-codex", "claude-sonnet-4-6", "superbot"]\nfor (const model of models) {\n  const out = await ask(model, prompt)\n  console.log(model, out.usage.total_tokens)\n}' } },
    { p: 'All three answered through the one key. The URL and the key come from Settings > API access, and each call shows up in its call log.' }
  ]
  const ANS2 = [
    { p: 'From the call log, `superbot` is the cheapest for this job. Same prompt, same key, same URL:' },
    { table: { head: ['Model', 'Tokens', 'Cost'], rows: [['superbot', '9.6k', '$0.01'], ['gpt-5-codex', '8.1k', '$0.03'], ['claude-sonnet-4-6', '12.4k', '$0.05']] } },
    { p: 'Point the review bot at `superbot`, and keep `claude-sonnet-4-6` for the jobs that need it.' }
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
  const outcomeAdd = (k, make) => { drop(k); st[k] = { node: SB.feedAppend(make()) }; follow() }
  const R = (verb, target, result) => ({ verb, target, result })
  const press = (sel, on) => { const b = $(sel); if (b) { b.style.background = on ? 'color-mix(in srgb, var(--color-fg, #fff) 10%, transparent)' : ''; b.style.borderRadius = on ? '10px' : '' } }
  const closeSettings = () => { for (const n of ['x-api', 'x-api-keys', 'x-api-usage', 'x-api-docs']) SB.closeOverlay(n); for (const e of SB.$$('[data-testid="settings-overlay"]')) e.remove() }
  const openSettings = (name) => { const el = SB.overlayOpen(name); SB.apiTidy(); return el }

  return {
    cycle: 33.1,
    preload: ['hero', 'picker', 'typed', 'rich-answer', 'rich-tools', 'rich-tools-open', 'rich-diff-open', 'rich-long', 'rich-live'],
    setup() {
      st = {}; for (const k of Object.keys(memo)) delete memo[k]
      SB.state('hero'); SB.setModel('superbot')
    },
    beats: [
      /* -------------------------------------------------- 1. every model sits in the one picker */
      { at: 0.3, run() { SB.overlayOpen('picker') } },
      { at: 0.65, dur: 1.15, run(_, p) { SB.pickerActive(Math.min(5, Math.floor(p * 6))) } },
      { at: 1.95, run() { SB.closeOverlay('picker') } },

      /* -------------------------------------------------- 2. the ask, the agent starts working */
      { at: 2.15, dur: 2.2, run(_, p) { SB.typeText(ASK, p) } },
      { at: 4.55, dur: 0.4, run(_, p) {
        once('send1', () => { SB.threadBegin('rich-answer', TITLE); $('[data-testid="composer-plat"]').replaceWith(heroChip()); SB.setModel('superbot'); SB.composerBusy(true) })
        userAdd('u1', ASK, p)
      } },
      { at: 5.05, run() { liveAdd('reading', 'ask.ts', 1, []) } },
      { at: 5.55, run() { liveAdd('editing', 'ask.ts', 2, [R('Read', 'ask.ts', 'Read bot/ask.ts (14 lines)'), R('Read', 'run.ts', 'Read bot/run.ts (22 lines)')]) } },
      { at: 6.05, run() { liveAdd('running', 'node bot/run.ts', 3, [R('Read', 'ask.ts'), R('Read', 'run.ts'), R('Edited', 'ask.ts')]) } },

      /* -------------------------------------------------- 3. Settings > Connections > API access: the one endpoint, the one key */
      { at: 6.5, run() { press('[data-testid="side-settings"]', true) } },
      { at: 6.85, run() { press('[data-testid="side-settings"]', false); openSettings('x-api') } },
      { at: 8.35, dur: 1.2, run(_, p) { SB.scrollToEl('[data-testid="developer-snippet-openai"]', p, 0, -12) } },
      { at: 9.75, dur: 1.0, run(_, p) { SB.scrollToEl('[data-testid="developer-snippet-curl"]', p, from('s1', top('[data-testid="stuff-api"]')), -12) } },
      /* the same request, only the model id changes */
      { at: 10.95, dur: 3.3, run(_, p) { SB.snippetModel(Math.min(2.999, p * 3)) } },
      { at: 14.45, dur: 1.0, run(_, p) { SB.scrollToEl('[data-testid="api-keys"]', p, from('s2', top('[data-testid="stuff-api"]')), -8) } },
      /* the call log (Advanced > Usage > Recent requests) */
      { at: 15.9, run() { SB.settingsGo('x-api-usage'); SB.apiTidy(); SB.callLogReveal(0) } },
      { at: 16.3, dur: 2.5, run(_, p) { SB.callLogReveal(p) } },
      { at: 18.85, dur: 0.5, run(_, p) { const e = paneEl('[data-testid="api-usage-recent-row"]'); if (e) { const y0 = from('s4', () => e.scrollTop); const rows = SB.$$('[data-testid="api-usage-recent-row"]'); const last = rows[rows.length - 1]; const y1 = from('s5', () => Math.min(e.scrollHeight - e.clientHeight, e.scrollTop + (last.getBoundingClientRect().bottom - e.getBoundingClientRect().bottom) + 28)); e.scrollTo({ top: y0 + (Math.max(y0, y1) - y0) * SB.ease.inOut(p), behavior: 'instant' }) } } },
      { at: 19.65, run() { liveAdd('running', 'node bot/run.ts', 5, [R('Read', 'ask.ts'), R('Read', 'run.ts'), R('Edited', 'ask.ts')]) } },
      { at: 19.7, run() { closeSettings() } },

      /* -------------------------------------------------- 4. back in the thread: the answer lands */
      { at: 19.95, dur: 2.2, run(_, p) { once('ans1', () => { drop('live'); SB.composerBusy(false); SB.setModel('superbot') }); answerAdd('a1', ANS, p) } },
      { at: 22.3, run() { outcomeAdd('o1', () => SB.outcome('tools', SPEC.label)) } },
      { at: 22.65, dur: 0.4, run(_, p) { once('o1s', () => { drop('o1') }); const s = once('o1s2', () => ({ node: SB.feedAppend(SB.workOutcome(SPEC, 'steps')) })); SB.stepsReveal(s.node, p); follow() } },
      { at: 23.2, dur: 0.45, run(_, p) { glide('o1d', p, () => { drop('o1s2'); st.o1d = { node: SB.feedAppend(SB.workOutcome(SPEC, 'diff')) } }) } },

      /* -------------------------------------------------- 5. next ask on another model: the picker switches, same thread, same key */
      { at: 24.15, dur: 1.4, run(_, p) { SB.typeText(ASK2, p); follow() } },
      { at: 25.75, run() { SB.overlayOpen('picker') } },
      { at: 26.0, run() { SB.pickerActive(3) } },
      { at: 26.3, run() { SB.pickerActive(4) } },
      { at: 26.65, run() { SB.closeOverlay('picker'); SB.setModel('model:claude-sonnet-4-6') } },
      { at: 26.9, dur: 0.35, run(_, p) { once('send2', () => { SB.typeText('', 1); SB.composerBusy(true) }); userAdd('u2', ASK2, p) } },
      { at: 27.4, run() { liveAdd('reading', 'usage log', 1, []) } },
      { at: 27.85, dur: 2.1, run(_, p) { once('ans2', () => { drop('live'); SB.composerBusy(false); SB.setModel('model:claude-sonnet-4-6') }); answerAdd('a2', ANS2, p) } },

      /* -------------------------------------------------- end card */
      { at: 30.5, run() { SB.keepCard({ title: ['One key.', 'Every model.'], site: 'superbot.gg', note: 'Private beta. Invite only.', px: 150 }) } }
    ]
  }
}

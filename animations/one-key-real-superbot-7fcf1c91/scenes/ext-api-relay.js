// ext-api-relay (for ad #36, "one key, every model"): the REAL app's API access page — one endpoint (https://api.superbot.gg, the OpenAI and
// Anthropic dialects), the drop-in snippets, the caller keys behind it, the call log — after the real model picker listing every vendor.
// 4x5 and 16x9 (same scene, the app lays itself out). cycle 26 s.
import { ensureExt } from './ext-common.js'
await ensureExt(window.SB, ['api-top', 'api-keys', 'api-usage', 'api-docs'])
export default (SB) => {
  const memo = {}
  const from = (k, f) => (memo[k] ??= f())
  // current scrollTop of the pane that holds `sel` (the start of a scroll beat: where the previous beat left it)
  const top = (sel) => () => { let e = SB.$(sel); while (e && !(e.scrollHeight > e.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(e).overflowY))) e = e.parentElement; return e ? e.scrollTop : 0 }
  return {
    cycle: 26,
    preload: ['hero', 'picker'],
    setup() { for (const k of Object.keys(memo)) delete memo[k]; SB.state('hero') },
    beats: [
      // every vendor in the one picker
      { at: 0.6, run() { SB.overlayOpen('picker') } },
      { at: 1.0, dur: 3.2, run(_, p) { SB.pickerActive(Math.min(7, Math.floor(p * 8))) } },
      { at: 4.4, run() { SB.closeOverlay('picker') } },
      // Settings > Connections > API access
      { at: 5.0, run() { SB.overlayOpen('x-api') } },
      { at: 7.4, dur: 1.6, run(_, p) { SB.scrollToEl('[data-testid="developer-snippet-openai"]', p, 0, -12) } },
      { at: 9.8, dur: 1.4, run(_, p) { SB.scrollToEl('[data-testid="developer-snippet-curl"]', p, from('s1', top('[data-testid="stuff-api"]')), -12) } },
      { at: 11.6, dur: 1.6, run(_, p) { SB.scrollToEl('[data-testid="api-keys"]', p, from('s2', top('[data-testid="stuff-api"]')), -8) } },
      // the call log (Advanced > Usage > Recent requests): the fold is open in this captured state
      { at: 14.2, run() { SB.settingsGo('x-api-usage'); SB.callLogReveal(0) } },
      { at: 14.8, dur: 3.0, run(_, p) { SB.callLogReveal(p) } },
      { at: 19.0, dur: 1.6, run(_, p) { SB.scrollToEl('[data-testid="api-docs"]', p, from('s3', top('[data-testid="api-usage"]')), -8) } },
      { at: 22.6, run() { SB.closeOverlay('x-api-usage'); for (const e of SB.$$('[data-testid="settings-overlay"]')) e.remove(); SB.state('hero') } },
      { at: 23.2, run() { SB.endCard({ px: 220, text: 'superbot' }) } }
    ]
  }
}

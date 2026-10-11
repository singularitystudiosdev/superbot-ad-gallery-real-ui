// ext-limits (for ad #27, "live limits"): the composer's context meter filling as the chat grows, then the REAL Usage panel (sidebar account
// widget) with the 5 hour and 7 day bars of each connected plan animating to their readings and then ticking up live. cycle 22 s.
import { ensureExt } from './ext-common.js'
await ensureExt(window.SB, [])
export default (SB) => {
  const ROWS = [['openai', '5 hour', 0, 34], ['openai', '7 day', 0, 58], ['openai', '7 day Astra', 0, 52], ['anthropic', '5 hour', 0, 42], ['anthropic', '7 day', 0, 63], ['anthropic', '7 day Fable', 0, 44]]
  const TICK = [['openai', '5 hour', 34, 41], ['anthropic', '5 hour', 42, 49], ['openai', '7 day', 58, 60], ['anthropic', '7 day', 63, 65]]
  return {
    cycle: 22,
    preload: ['hero', 'usage'],
    setup() { SB.state('hero'); SB.setContext(0) },
    beats: [
      // the context meter: label, fill and tone move together (SB.setContext), as the thread's context grows
      { at: 0.8, dur: 4.0, run(_, p) { SB.setContext(142 * SB.ease.out(p)) } },
      // the Usage panel
      { at: 8.6, run() { SB.overlayOpen('usage'); SB.usageAnimate(ROWS, 0) } },
      { at: 9.0, dur: 3.0, run(_, p) { SB.usageAnimate(ROWS, p) } },
      // live: the bars keep moving
      { at: 13.0, dur: 3.0, run(_, p) {
        for (const [v, l, a, b] of TICK) SB.setUsage(v, l, SB.lerp(a, b, SB.ease.inOut(p)))
      } },
      { at: 18.4, run() { SB.closeOverlay('usage'); SB.endCard({ px: 220, text: 'superbot' }) } }
    ]
  }
}

/* tidy-lib (item #50): SB helpers for Settings > Context (Tidy), layered on engine.js + ext.js + ok-lib.js. The pane is the REAL app's DOM,
 * captured from the gate-on copy of the prebuilt app (.tmp/realui-kit.7fcf1c91/capture/ext2/capture-ext2.mjs -> snap-ext2/<ar>/ctx-*.json).
 *   SB.loadCtx(names)     fetch snap-ext2/<ar>/<name>.json into SB.snaps['x2:<name>']
 *   SB.ctxGo(name)        swap the open Settings sheet for another captured Context state (the sheet stays, no entrance replay): ctx-asis | ctx-tidy | ctx-open
 *   SB.ctxFigures(p)      the served figures, as a function of p (0 = the as-is block, 1 = the tidy block): "~8.2k" -> "~3.4k" sent each turn, "8.2k -> 3.4k always on", -59%
 * Only text of figures the pane already shows is retargeted (same elements, same classes).
 */
(() => {
  const SB = window.SB; if (!SB || SB.tidyLib) return
  const { $, $$, ease, clamp01 } = SB
  SB.tidyLib = true
  const AR = { '4x3': '16x9', '1x1': '4x5' }[SB.AR] || SB.AR
  SB.loadCtx = async (names) => {
    await Promise.all(names.filter((n) => !SB.snaps['x2:' + n]).map(async (n) => {
      const r = await fetch(`snap-ext2/${AR}/${n}.json`)
      if (!r.ok) throw new Error(`ctx snapshot ${AR}/${n} missing (${r.status})`)
      SB.snaps['x2:' + n] = await r.json()
    }))
  }
  const NAMES = ['x2-ctx-asis', 'x2-ctx-tidy', 'x2-ctx-open']
  for (const n of NAMES) SB.overlays[n] = { state: 'x2:' + n.slice(3), sel: '[data-testid="settings-overlay"]', into: '.hub-root' }
  SB.ctxClose = () => { for (const n of NAMES) SB.closeOverlay(n); for (const e of $$('[data-testid="settings-overlay"]')) e.remove() }
  SB.ctxGo = (name) => {
    SB.ctxClose()
    const el = SB.overlayOpen('x2-' + name)
    for (const a of el.getAnimations({ subtree: true })) { try { a.finish() } catch (e) { /* ignore */ } }
    return el
  }
  const k = (n) => (n / 1000).toFixed(1) + 'k'
  const LANES = { superbot: [8200, 3400], 'relay-agent': [6100, 2600] }
  const set = (sel, txt) => { const el = $(sel); if (el && el.textContent !== txt) el.textContent = txt }
  SB.ctxFigures = (p) => {
    const e = ease.inOut(clamp01(p))
    for (const [lane, [a, b]] of Object.entries(LANES)) {
      const v = a + (b - a) * e, pct = Math.round(((a - v) / a) * 100)
      set(`[data-testid="guardian-summary-${lane}-figure"]`, `${k(a)} → ${k(v)}`)
      set(`[data-testid="guardian-summary-${lane}-saving"]`, pct < 1 ? '' : `−${pct}%`)
    }
    const [a, b] = LANES.superbot
    set('[data-testid="settings-context-sent-figure"]', '~' + k(a + (b - a) * e))
  }
})()

/* tidy-lib (item #50): SB helpers for Settings > Context (Tidy), layered on engine.js + ext.js + ok-lib.js. The pane is the REAL app's DOM,
 * captured from the gate-on copy of the prebuilt app (.tmp/realui-kit.7fcf1c91/capture/ext2/capture-ext2.mjs -> snap-ext2/<ar>/ctx-*.json).
 *   SB.loadCtx(names)     fetch snap-ext2/<ar>/<name>.json into SB.snaps['x2:<name>']
 *   SB.ctxGo(name)        swap the open Settings sheet for another captured Context state (the sheet stays, no entrance replay): ctx-asis | ctx-tidy | ctx-open
 *   SB.ctxFigures()       removes every token figure / percentage (see below): no saving is claimed on screen
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
  /* NO token figure, percentage or saving is shown (ruling after the first publish: fixture before/after numbers must not appear as a saving):
   * the value cells of "What Tidy did" (the "8.2k -> 3.4k always on -59%" group) and the Context map's size readouts ("~N sent each turn", "N on disk") are removed;
   * the lane names, the rule counts and the map itself stay as the app draws them. Idempotent; called on every seek (p is ignored). */
  SB.ctxFigures = () => {
    for (const el of $$('[data-testid^="guardian-summary-"][data-testid$="-figure"]')) { const g = el.parentElement; if (g) g.remove() }
    for (const el of $$('[data-testid="settings-context-sent"], [data-testid="settings-context-ondisk"]')) el.remove()
  }
})()

/* Real-UI stage engine. Runs inside frame.html (the iframe the outer page zooms to the app's native 1.2 zoom).
 * Everything on screen is the REAL superbot-desktop renderer markup + stylesheet, captured from the running app
 * (capture/capture-all.mjs, capture/capture-rich.mjs). This file only (a) loads a captured state, (b) mutates that DOM
 * through ops that reuse captured markup, and (c) makes the result a pure function of time: SB.seek(t).
 */
(() => {
  const Q = new URLSearchParams(location.search)
  const AR = Q.get('ar') || '4x5'
  // snapshots exist for the two captured viewports; 4x3 (1440x1080) lays out like 16x9, 1x1 (1080x1080) like 4x5: the DOM re-lays out natively at the real size
  const SNAP = { '4x3': '16x9', '1x1': '4x5' }[AR] || AR
  const SB = (window.SB = { AR, snaps: {}, chips: {}, scene: null, t: 0, ready: null, cycle: 0 })
  const birth = new WeakMap()
  const clamp01 = (x) => Math.max(0, Math.min(1, x))
  const ease = { out: (p) => 1 - Math.pow(1 - p, 3), inOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2), lin: (p) => p }
  SB.ease = ease
  SB.clamp01 = clamp01
  const $ = (sel, root = document) => root.querySelector(sel)
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]
  SB.$ = $; SB.$$ = $$

  /* ---------------------------------------------------------------- snapshots */
  const frags = {} // name -> DocumentFragment (parsed once, never attached)
  SB.load = async (names) => {
    await Promise.all(names.filter((n) => !SB.snaps[n]).map(async (n) => {
      const r = await fetch(`snap/${SNAP}/${n}.json`)
      if (!r.ok) throw new Error(`snapshot ${SNAP}/${n} missing (${r.status})`)
      SB.snaps[n] = await r.json()
    }))
  }
  SB.loadChips = async () => { SB.chips = await (await fetch(`snap/${SNAP}/chips.json`)).json() }
  /** A detached parsed copy of a captured state's body (cached); query it for templates. */
  SB.frag = (name) => {
    if (!frags[name]) { const t = document.createElement('template'); t.innerHTML = SB.snaps[name].body; frags[name] = t.content }
    return frags[name]
  }
  /** Clone a template element out of a captured state. */
  SB.tpl = (name, sel, nth = 0) => {
    const el = $$(sel, SB.frag(name))[nth]
    if (!el) throw new Error(`SB.tpl: ${sel}[${nth}] not in state ${name}`)
    return el.cloneNode(true)
  }

  /* ------------------------------------------------------------------- states */
  /** Replace the whole document with a captured state (a hard cut, as if the app were in that state). */
  SB.state = (name) => {
    const s = SB.snaps[name]
    if (!s) throw new Error(`SB.state: ${name} not loaded`)
    const de = document.documentElement
    for (const a of [...de.attributes]) if (!(a.name in s.htmlAttrs)) de.removeAttribute(a.name)
    for (const [k, v] of Object.entries(s.htmlAttrs)) de.setAttribute(k, v)
    document.body.innerHTML = s.body
    for (const d of $$('dialog[data-sb-modal]')) { d.removeAttribute('data-sb-modal'); d.removeAttribute('open'); d.showModal() }
    SB.decorate()
    for (const el of $$('[data-sb-scroll]')) { const [x, y] = el.getAttribute('data-sb-scroll').split(',').map(Number); el.scrollTo({ left: x, top: y, behavior: 'instant' }) }
    for (const c of s.canvases || []) {
      const cv = $(`canvas`); if (cv && c.url) { const im = new Image(); im.onload = () => cv.getContext('2d').drawImage(im, 0, 0); im.src = c.url }
    }
    if (s.focus) { const f = $(`[data-testid="${s.focus}"],[data-slot="${s.focus}"]`); if (f && f.focus) f.focus({ preventScroll: true }) }
    // a captured state was captured long after its entrance animations ended: seek everything the insertion started to its end
    for (const a of document.getAnimations()) birth.set(a, (SB.t || 0) - 5)
    SB.cur = name
    SB._emptyComposer = null; SB._typedMode = false
    SB._caretSince = null
  }

  /* --------------------------------------------------------------- deterministic RNG */
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
  const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const typeCache = new Map()
  /** Cumulative typing schedule for `text` (human-ish cadence, seeded by the text): cum[i] = fraction of the beat at which char i+1 has landed. */
  function schedule(text) {
    if (typeCache.has(text)) return typeCache.get(text)
    const r = rng(hash(text)); const gaps = []
    for (let i = 0; i < text.length; i++) {
      const c = text[i]; let g = 0.7 + r() * 0.7
      if (c === ' ') g += 0.5; if (/[,.;:!?]/.test(c)) g += 1.6; if (r() < 0.04) g += 2.2
      gaps.push(g)
    }
    const tot = gaps.reduce((a, b) => a + b, 0); let acc = 0
    const cum = gaps.map((g) => (acc += g) / tot)
    typeCache.set(text, cum); return cum
  }
  SB.typedCount = (text, p) => { if (p >= 1) return text.length; const cum = schedule(text); let n = 0; while (n < cum.length && cum[n] <= p) n++; return n }

  /* ---------------------------------------------------------------- composer */
  const composer = () => $('[data-testid="composer"]')
  const chip = () => $('[data-testid="composer-plat"]')
  const input = () => $('[data-testid="composer-input"]')
  /** Type `text` into the REAL composer element (p = 0..1 along the typing beat). Swaps in the captured "typed" composer
   *  (send button armed, placeholder gone) as soon as there is one character; "" restores the empty composer. */
  SB.typeText = (text, p = 1, { caret = true } = {}) => {
    const n = SB.typedCount(text, p)
    const shown = text.slice(0, n)
    const typed = shown.length > 0
    if (SB._emptyComposer === null || SB._emptyComposer === undefined) SB._emptyComposer = composer().cloneNode(true)
    if (typed !== SB._typedMode) {
      const keep = chip().cloneNode(true)
      const nc = (typed ? SB.tpl('typed', '[data-testid="composer"]') : SB._emptyComposer.cloneNode(true))
      $('[data-testid="composer-plat"]', nc).replaceWith(keep)
      composer().replaceWith(nc)
      SB._typedMode = typed
    }
    if (typed) {
      const inp = input(); inp.textContent = shown
      if (caret) { const c = document.createElement('span'); c.className = 'sb-caret'; inp.appendChild(c); if (SB._lastLen !== n) { SB._caretSince = SB.t; SB._lastLen = n } }
      inp.style.height = ''; const h = inp.scrollHeight; if (h > 44) inp.style.height = h + 'px'; else inp.style.height = '44px'
    } else SB._lastLen = 0
  }
  /** Swap the composer's model chip for a captured one (key = the picker option's data-value, e.g. "model:gpt-5-codex", "superbot"). */
  SB.setModel = (key) => {
    const html = SB.chips[key]; if (!html) throw new Error(`SB.setModel: no captured chip for ${key}; have ${Object.keys(SB.chips)}`)
    const t = document.createElement('template'); t.innerHTML = html
    const open = chip().getAttribute('aria-expanded')
    const nc = t.content.firstElementChild; nc.setAttribute('aria-expanded', open || 'false')
    chip().replaceWith(nc)
  }

  /* --------------------------------------------------------------- overlays */
  const OVERLAYS = {
    picker: { state: 'picker', sel: '.sb-platpop', into: '[data-slot="composer-picker-wrap"]' },
    pickerSearch: { state: 'picker-search', sel: '.sb-platpop', into: '[data-slot="composer-picker-wrap"]' },
    usage: { state: 'usage', sel: 'dialog[data-slot="dialog"]', into: '[data-testid="aw-footer"]', modal: true },
    settings: { state: 'accounts', sel: '[data-testid="settings-overlay"]', into: '.hub-root' },
    palette: { state: 'list-search', sel: 'dialog[data-testid="command-palette"]', into: '.hub-root', modal: true },
    context: { state: 'context-modal', sel: 'dialog[data-slot="dialog"]', into: 'nav.hub-sidebar', modal: true }
  }
  SB.overlays = OVERLAYS
  SB.overlayOpen = (name) => {
    const o = OVERLAYS[name]; SB.closeOverlay(name)
    const el = SB.tpl(o.state, o.sel); el.setAttribute('data-sb-overlay', name)
    $(o.into).appendChild(el)
    if (name === 'picker' || name === 'pickerSearch') chip().setAttribute('aria-expanded', 'true')
    if (o.modal) { el.removeAttribute('open'); el.showModal() }
    return el
  }
  SB.closeOverlay = (name) => {
    for (const el of $$(`[data-sb-overlay="${name}"]`)) { if (el.close && el.open) el.close(); el.remove() }
    if ((name === 'picker' || name === 'pickerSearch') && chip()) chip().setAttribute('aria-expanded', 'false')
  }
  /** Highlight option `i` (0-based over the picker's [role=option] rows) the way the app's keyboard nav does. */
  SB.pickerActive = (i) => {
    const rows = $$('[data-sb-overlay="picker"] [role="option"]')
    rows.forEach((r, k) => { r.setAttribute('aria-selected', k === i ? 'true' : 'false'); if (k === i) r.setAttribute('data-active', 'true'); else r.removeAttribute('data-active') })
    return rows[i]
  }
  /** The usage panel's rows: set the 5 hour / 7 day (etc.) bar of one vendor card to `pct` (0..100). */
  SB.setUsage = (vendor, label, pct) => {
    const card = $(`[data-testid="usage-card"][data-vendor="${vendor}"]`)
    const row = card && $$('.stuff-usage-row', card).find((r) => $('.stuff-usage-label', r).textContent.trim() === label)
    if (!row) throw new Error(`SB.setUsage: ${vendor}/${label} not found`)
    const v = Math.round(pct)
    const tr = $('.stuff-usage-track', row); tr.setAttribute('aria-valuenow', String(v)); tr.setAttribute('aria-label', tr.getAttribute('aria-label').replace(/\d+% used/, v + '% used'))
    $('.stuff-usage-fill', row).style.transform = `scaleX(${pct / 100})`
    $('.stuff-usage-value', row).textContent = v + '%'
  }
  /** Palette (the app's search dialog): type `query` progressively into its real input; results are those captured for "launch". */
  SB.paletteQuery = (text, p = 1) => { const i = $('[data-testid="command-palette-input"]'); if (i) { const s = text.slice(0, SB.typedCount(text, p)); i.value = s; i.setAttribute('value', s) } }
  SB.scrollSidebar = (y) => { const rows = $('.hub-sidebar [data-testid="chat-row"]'); let e = rows; while (e && !(e.scrollHeight > e.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(e).overflowY))) e = e.parentElement; if (e) e.scrollTo({ top: y, behavior: 'instant' }); return e ? e.scrollHeight - e.clientHeight : 0 }
  SB.scrollFeed = (y) => { const f = feedScroller(); if (f) f.scrollTo({ top: y === 'end' ? f.scrollHeight : y, behavior: 'instant' }); return f }
  function feedScroller() { let e = $('[data-testid="feed"]'); while (e && !(e.scrollHeight > e.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(e).overflowY))) e = e.parentElement; return e }
  SB.feedScroller = feedScroller

  /* -------------------------------------------------------------------- mascot */
  /** The app's own mascot (the sidebar brand tile's bare mark, from the renderer markup; app/mascot.svg), static: for the end card. */
  SB.mascot = (px = 240) => { const i = new Image(); i.src = 'app/mascot.svg'; i.alt = 'Superbot'; i.className = 'sb-static'; i.style.cssText = `width:${px}px;height:auto;display:block`; return i }
  /** Full-bleed end card in the app's canvas colour with the static mascot (optionally a wordmark line below it). */
  SB.endCard = ({ px = 220, text = '' } = {}) => {
    SB.closeEndCard()
    const c = document.createElement('div'); c.setAttribute('data-sb-endcard', '')
    c.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:var(--color-canvas,var(--color-bg,#0a0a0a));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px'
    c.appendChild(SB.mascot(px))
    if (text) { const t = document.createElement('div'); t.textContent = text; t.style.cssText = 'font:600 34px/1.1 var(--font-ui, Inter, system-ui);color:var(--color-fg,#fff);letter-spacing:-0.01em'; c.appendChild(t) }
    document.body.appendChild(c); return c
  }
  SB.closeEndCard = () => { for (const e of $$('[data-sb-endcard]')) e.remove() }

  /* ------------------------------------------------------------- timeline engine */
  /** Scene = { cycle, preload:[states], setup(ctx), beats:[{at, dur?, run(ctx, p)}] }.  run() must be idempotent in p; it is
   *  called with the beat's progress (0..1, final call p=1) on every seek inside the beat, once with p=1 after it. Seeking
   *  backwards (or the first seek) rebuilds from setup() and replays every beat up to t, so seek(t) is a pure function of t. */
  let beats = [], lastT = -1, built = false
  
  function reset() {
    SB.scene.setup(SB)
    for (const b of beats) b._done = false
    built = true; lastT = -1; SB._lastLen = 0
  }
  function adopt(at) { for (const a of document.getAnimations()) if (!birth.has(a)) birth.set(a, at) }
  SB.seek = (t) => {
    if (!SB.scene) throw new Error('no scene')
    if (!built || t < lastT - 1e-9) reset()
    SB.t = t
    for (const b of beats) {
      if (b._done || t < b.at) continue
      const p = b.dur ? clamp01((t - b.at) / b.dur) : 1
      SB.at = b.at
      b.run(SB, p)
      adopt(b.at)
      if (p >= 1) b._done = true
    }
    SB.decorate()
    // caret blink as a pure function of t (real caret: ~530 ms on / off, restarting on each keystroke)
    for (const c of $$('.sb-caret')) { const since = SB._caretSince ?? 0; c.style.visibility = Math.floor((t - since) / 0.53) % 2 === 0 ? 'visible' : 'hidden' }
    // every CSS animation / transition on the frame clock (pause + seek), born when the op that created it ran
    for (const a of document.getAnimations()) {
      if (!birth.has(a)) birth.set(a, t)
      try { a.pause(); a.currentTime = Math.max(0, t - birth.get(a)) * 1000 } catch (e) { /* finished/detached */ }
    }
    lastT = t
  }
  /** The real app shows a thin classic scrollbar under an overflowing code block (and it adds ~8 px of height); the gallery's headless
   *  Chromium hides native scrollbars, so reproduce the bar + its height (CSS in stage.css) for every code block whose line overflows. */
  SB.decorate = () => {
    for (const [hostSel, scrollSel] of [['[data-slot="code-block"]', '[data-slot="code-block-body"]'], ['[data-slot="tool-diff"]', '.diff-table-scroll-container']]) {
      for (const host of $$(hostSel)) {
        const sc = $(scrollSel, host); if (!sc) continue
        const over = sc.scrollWidth > sc.clientWidth + 1
        host.classList.toggle('sb-hscroll', over)
        if (over) { host.style.setProperty('--sb-thumb', (sc.clientWidth / sc.scrollWidth * 100).toFixed(2) + '%'); host.style.setProperty('--sb-x', (sc.scrollLeft / sc.scrollWidth * 100).toFixed(2) + '%') }
      }
    }
  }
  /** Pause every animation at its frame-clock position (static states: SB.t = 0, state animations already finished). */
  SB.freeze = () => { for (const a of document.getAnimations()) { if (!birth.has(a)) birth.set(a, SB.t); try { a.pause(); a.currentTime = Math.max(0, SB.t - birth.get(a)) * 1000 } catch (e) {} } }
  SB.define = async (scene) => {
    SB.scene = scene; beats = scene.beats.slice().sort((a, b) => a.at - b.at)
    SB.cycle = scene.cycle
    await SB.load(scene.preload || [])
    await SB.loadChips()
    built = false
  }
  SB.start = async () => {
    const sc = Q.get('scene')
    const t0 = Number(Q.get('t') || 0), st = Q.get('state') || 'hero'
    const render = () => { if (sc) { built = false; SB.seek(t0) } else SB.state(st) }
    if (sc) { const m = await import(`./scenes/${sc}.js`); await SB.define(m.default(SB)) } else { await SB.load([st]); await SB.loadChips() }
    render()
    // fonts load lazily, so layout (and therefore every captured scrollTop) is only final after a first paint with them: render again
    await document.fonts.ready
    await Promise.all($$('img').map((i) => (i.decode ? i.decode().catch(() => {}) : null)))
    render(); SB.decorate(); SB.freeze()
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    SB.ready = true
  }
  SB.whenReady = () => new Promise((res) => { const k = () => (SB.ready ? res() : setTimeout(k, 20)); k() })
  window.addEventListener('DOMContentLoaded', () => { SB.start().catch((e) => { SB.error = String(e && e.stack || e); console.error(e) }) })
})()

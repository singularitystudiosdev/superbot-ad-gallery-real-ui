/* Real-UI kit EXTENSION helpers (item #38). A classic script that REGISTERS onto window.SB (engine.js is untouched); loaded by
 * scenes/ext-common.js (`await ensureExt(SB, [states])`) together with app/app-ext.css. Everything here reuses captured app
 * markup (stage/snap-ext/<ar>/*.json, captured by capture/ext/capture-ext.mjs) and only edits text / numbers / transforms, so the
 * result stays the real renderer's DOM.  All helpers are idempotent in `p` (0..1 along a beat) like the engine's own.
 *
 *   SB.loadExt(names)            fetch snap-ext/<ar>/<name>.json into SB.snaps['x:<name>']
 *   SB.extState(name)            hard-cut to an extension state (== SB.state('x:'+name))
 *   SB.settingsGo(name)          swap the Settings overlay for another captured page (nav highlight follows), no entrance replay
 *   SB.overlayOpen('x-api'|'x-api-keys'|'x-api-usage'|'x-api-docs'|'x-models'|'x-spend'|'x-spend-week')  extension overlays (registered below)
 *   SB.scrollWithin(sel, y)      scroll the nearest scrollable ancestor of `sel` (y px | 'end' | 0..1 fraction as {frac})
 *   SB.setContext(usedK, maxK)   the composer's "Context 142k of 200k" meter: label, fill (scaleX), aria/title, tone
 *   SB.usageAnimate(list, p)     [[vendor,label,from,to],...] -> SB.setUsage on every row (eased) : the 5h / 7d limit bars
 *   SB.spendReveal(p)            Spend "All AI" block: total counts up, per-day bars grow left to right, provider totals count up
 *   SB.callLogReveal(p)          API usage "Recent requests" (the call log): rows arrive one by one (newest first), count + by-key rows follow
 *   SB.iosPreload(names) / SB.iosStage() / SB.iosShow(name, opts)   the REAL iOS app screens (snap-ext/ios/*.png: native simulator captures imported from superbot-mobile), shown on a plain stage
 *   SB.neutralize()              stub@example.test -> alex@example.com in text + a11y attributes (runs on every decorate)
 *   SB.lerp(a, b, p)
 */
(() => {
  const SB = window.SB
  if (!SB || SB.ext) return
  const { $, $$, ease, clamp01 } = SB
  SB.ext = { version: 1 }
  SB.lerp = (a, b, p) => a + (b - a) * p

  /* ------------------------------------------------------------------ snapshots */
  SB.loadExt = async (names) => {
    await Promise.all(names.filter((n) => !SB.snaps['x:' + n]).map(async (n) => {
      const r = await fetch(`snap-ext/${{ '4x3': '16x9', '1x1': '4x5' }[SB.AR] || SB.AR}/${n}.json`)
      if (!r.ok) throw new Error(`extension snapshot ${SB.AR}/${n} missing (${r.status})`)
      SB.snaps['x:' + n] = await r.json()
    }))
  }
  SB.extState = (name) => SB.state('x:' + name)

  /* ------------------------------------------------------------------- overlays */
  // Settings pages and the Spend modal, as overlays over any captured base state (hero / thread …), same mechanism as the kit's own.
  Object.assign(SB.overlays, {
    'x-api': { state: 'x:api-top', sel: '[data-testid="settings-overlay"]', into: '.hub-root' },
    'x-api-keys': { state: 'x:api-keys', sel: '[data-testid="settings-overlay"]', into: '.hub-root' },
    'x-api-usage': { state: 'x:api-usage', sel: '[data-testid="settings-overlay"]', into: '.hub-root' },
    'x-api-docs': { state: 'x:api-docs', sel: '[data-testid="settings-overlay"]', into: '.hub-root' },
    'x-models': { state: 'x:models-spend', sel: '[data-testid="settings-overlay"]', into: '.hub-root' },
    'x-spend': { state: 'x:spend-allai', sel: 'dialog[data-sb-modal]', into: '.hub-root', modal: true },
    'x-spend-week': { state: 'x:spend-week', sel: 'dialog[data-sb-modal]', into: '.hub-root', modal: true }
  })
  // The kit's registry entries for the two modal panels select the FIRST dialog[data-slot=dialog] of the captured state, which is a closed one
  // (the open modal is the dialog the serializer marked data-sb-modal): point them at the marked one. engine.js itself is not touched.
  SB.overlays.usage.sel = 'dialog[data-sb-modal]'
  SB.overlays.context.sel = 'dialog[data-sb-modal]'
  // SB.state() restores each captured scrollTop (data-sb-scroll); an overlay cloned out of a state needs the same, once it is in the document.
  const overlayOpen = SB.overlayOpen
  SB.overlayOpen = (name) => {
    const el = overlayOpen(name)
    for (const e of [el, ...$$('[data-sb-scroll]', el)]) { const v = e.getAttribute && e.getAttribute('data-sb-scroll'); if (v) { const [x, y] = v.split(',').map(Number); e.scrollTo({ left: x, top: y, behavior: 'instant' }) } }
    return el
  }
  const SETTINGS_NAMES = ['settings', 'x-api', 'x-api-keys', 'x-api-usage', 'x-api-docs', 'x-models']
  /** Swap the Settings overlay for another captured page (what a click on the nav row does: the pane changes, the sheet stays). */
  SB.settingsGo = (name) => {
    for (const n of SETTINGS_NAMES) SB.closeOverlay(n)
    for (const e of $$('[data-testid="settings-overlay"]')) e.remove()
    const el = SB.overlayOpen(name)
    // the sheet is already on screen: do not replay its entrance
    for (const a of el.getAnimations({ subtree: true })) { try { a.finish() } catch (e) { /* ignore */ } }
    return el
  }

  /* ------------------------------------------------------------------- scrolling */
  SB.scrollWithin = (sel, y) => {
    let e = typeof sel === 'string' ? $(sel) : sel
    while (e && !(e.scrollHeight > e.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(e).overflowY))) e = e.parentElement
    if (!e) return 0
    const max = e.scrollHeight - e.clientHeight
    const top = y === 'end' ? max : typeof y === 'object' && y ? y.frac * max : y
    e.scrollTo({ top, behavior: 'instant' })
    return max
  }
  /** Scroll so the element `target` sits at the top of its scroller, offset by `dy`, blended by p from `from` px. */
  SB.scrollToEl = (target, p = 1, from = 0, dy = 0) => {
    const t = typeof target === 'string' ? $(target) : target
    if (!t) return 0
    let e = t.parentElement
    while (e && !(e.scrollHeight > e.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(e).overflowY))) e = e.parentElement
    if (!e) return 0
    const goal = e.scrollTop + (t.getBoundingClientRect().top - e.getBoundingClientRect().top) + dy
    e.scrollTo({ top: SB.lerp(from, goal, ease.inOut(clamp01(p))), behavior: 'instant' })
    return goal
  }

  /* ------------------------------------------------------------- composer context meter */
  /** The composer footer's "Context <used>k of <max>k" line. Same elements the app updates: label text, fill scaleX, title/aria, tone. */
  SB.setContext = (usedK, maxK = 200) => {
    const line = $('[data-testid="context-status-line"]'); if (!line) throw new Error('SB.setContext: no context-status-line in this state')
    const used = Math.round(usedK), frac = clamp01(usedK / maxK)
    const text = `${used}k of ${maxK}k`
    const lab = $('.hub-context-status-label', line); if (lab) lab.textContent = text
    const fill = $('.hub-context-status-fill', line); if (fill) fill.style.transform = `scaleX(${frac})`
    line.setAttribute('title', `${text}. Click for the breakdown.`)
    line.setAttribute('aria-label', `Context ${text}. Click for the breakdown.`)
    line.setAttribute('data-tone', 'ok')
    return frac
  }

  /* ----------------------------------------------------------------- usage bars */
  SB.usageAnimate = (list, p) => {
    const e = ease.out(clamp01(p))
    for (const [vendor, label, from, to] of list) SB.setUsage(vendor, label, SB.lerp(from, to, e))
  }

  /* --------------------------------------------------------------------- spend */
  const money = (v, dec) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
  /** Spend modal "All AI" block as a function of p: the hero total, the per-day columns and every provider total are tweened from 0. */
  SB.spendReveal = (p) => {
    const hero = $('.all-ai-hero-title'); if (!hero) return
    if (!hero.dataset.sbTotal) hero.dataset.sbTotal = (hero.textContent.match(/\$([\d,]+(?:\.\d+)?)/) || [])[1].replace(/,/g, '')
    const total = Number(hero.dataset.sbTotal)
    const e = ease.out(clamp01(p / 0.8))
    hero.textContent = `All AI ${money(Math.round(total * e), 0)} / mo`
    const sub = $('.all-ai-hero-sub'); if (sub) { sub.style.opacity = String(clamp01((p - 0.1) / 0.3)) }
    const cols = $$('.all-ai-col-stack')
    cols.forEach((c, i) => {
      if (!c.dataset.sbH) c.dataset.sbH = String(parseFloat(c.style.height))
      const q = ease.out(clamp01((p - 0.05 - (i / Math.max(1, cols.length)) * 0.45) / 0.35))
      c.style.height = (Number(c.dataset.sbH) * q).toFixed(3) + '%'
    })
    $$('.all-ai-row-total').forEach((t, i) => {
      if (!t.dataset.sbV) t.dataset.sbV = t.textContent.trim()
      const raw = t.dataset.sbV, v = Number(raw.replace(/[^\d.]/g, '')), dec = (raw.split('.')[1] || '').length
      const q = ease.out(clamp01((p - 0.35 - i * 0.06) / 0.4))
      t.textContent = money(v * q, dec)
    })
    $$('.all-ai-row').forEach((r, i) => { const q = clamp01((p - 0.3 - i * 0.06) / 0.2); r.style.opacity = String(q); r.style.transform = `translateY(${((1 - q) * 6).toFixed(2)}px)` })
  }

  /* ------------------------------------------------------------------ call log */
  /** API access > Usage > "Recent requests": the first n rows are on screen, the next one fades in with p's fraction. */
  SB.callLogReveal = (p) => {
    const rows = $$('[data-testid="api-usage-recent-row"]'); if (!rows.length) return 0
    const n = rows.length, x = clamp01(p) * n
    rows.forEach((r, i) => {
      const li = r.closest('li'); const q = clamp01(x - i)
      li.style.opacity = String(ease.out(q)); li.style.transform = `translateY(${((1 - ease.out(q)) * 8).toFixed(2)}px)`
    })
    return Math.floor(x)
  }

  /* ------------------------------------------------------------------- real iOS UI */
  // Real screenshots of the shipped iOS app (capture/ext/import-ios.mjs). Nothing is drawn: the pixels are the app's own; the stage only
  // positions / fades them. opts: { p (0..1 entrance), dx, dy (css px), scale, opacity, h (fraction of the viewport height, default .86), mask (round the screen corners) }.
  SB.ios = { imgs: {} }
  SB.iosPreload = async (names) => {
    await Promise.all(names.map(async (n) => {
      if (SB.ios.imgs[n]) return
      const im = new Image(); im.decoding = 'sync'; im.draggable = false; im.alt = 'Superbot iOS app'; im.src = `snap-ext/ios/${n}.png`
      await im.decode(); SB.ios.imgs[n] = im
    }))
  }
  SB.iosStage = () => {
    document.body.innerHTML = ''
    for (const a of [...document.documentElement.attributes]) document.documentElement.removeAttribute(a.name)
    document.body.style.cssText = 'margin:0;height:100vh;background:#0a0a0a;display:flex;align-items:center;justify-content:center;overflow:hidden'
    const c = document.createElement('div'); c.setAttribute('data-sb-ios', ''); c.style.cssText = 'position:relative;height:100vh;width:100%'
    document.body.appendChild(c)
    SB.ios.root = c
    for (const im of Object.values(SB.ios.imgs)) im.style.display = 'none'
    return c
  }
  SB.iosShow = (name, { dx = 0, dy = 0, scale = 1, opacity = 1, h = 0.86, mask = true } = {}) => {
    const im = SB.ios.imgs[name]; if (!im) throw new Error('SB.iosShow: ' + name + ' not preloaded')
    if (!im.isConnected) SB.ios.root.appendChild(im)
    const mr = mask ? 'border-radius:7.2% / 3.3%;' : ''
    im.style.cssText = `position:absolute;left:50%;top:50%;height:${(h * 100).toFixed(2)}vh;width:auto;display:block;${mr}transform:translate(-50%,-50%) translate(${dx}px,${dy}px) scale(${scale});opacity:${opacity};will-change:transform,opacity`
    return im
  }

  /* ---------------------------------------------------------------- neutralize */
  /** Fixture identities -> neutral ones (the kit's existing states still carry "stub@example.test"). Cheap + idempotent. */
  SB.neutralize = () => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let n; while ((n = w.nextNode())) {
      const s = n.textContent
      if (s.indexOf('stub@example') >= 0) n.textContent = s.replace(/stub@example\.test/g, 'alex@example.com').replace(/stub@example…/g, 'alex@example…')
    }
    for (const el of $$('[aria-label*="stub@example"],[title*="stub@example"]')) for (const a of ['aria-label', 'title']) { const v = el.getAttribute(a); if (v && v.includes('stub@example')) el.setAttribute(a, v.replace(/stub@example\.test/g, 'alex@example.com')) }
  }
  const decorate = SB.decorate
  SB.decorate = () => { decorate(); SB.neutralize() }
})()

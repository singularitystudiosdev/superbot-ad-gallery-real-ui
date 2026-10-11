/* ep-lib: helpers for the every-ai-pocket ad, layered on the real-UI kit (engine.js + rows.js + ktr-lib.js + ext.js).
 *
 *  1. SB.brandSafe(): keeps the real desktop app DOM, logos and layout. It only renames what a third party's product name sits in as FIXTURE text:
 *     sidebar chat titles become plain task titles, and the fixture identity stays neutral ('Sam', sam@example.com). Provider logos are the app's own.
 *  2. SB.pocket(t): the phone phase. The ONLY phone pixels are the shipped iOS app's own simulator screenshots (snap-ext/ios/*.png, sha256 in
 *     snap-ext/ios/sources.json). Nothing about the phone is drawn: this layer only dims the real desktop, positions / fades / crops those pixels and sets
 *     two-line captions beside them. Crops (never edits): the lane sheet is cut above the tab bar (no red badge) and below the list rows ('Desktop offline'),
 *     the full-phone screens used (provider rail + Connect, composer + keyboard) carry neither.
 */
(() => {
  const SB = window.SB, $ = SB.$, $$ = SB.$$
  const css = document.createElement('style')
  css.textContent = `
.developer-row-mask,[data-testid="developer-budget"]{display:none !important}
`
  document.head.appendChild(css)

  /* ------------------------------------------------------------ titles */
  const TITLES = [
    [/^Zazen: session summary/, 'Weekly session summary'],
    [/^Draft the changelog.*/, 'Draft the changelog'],
    [/^Draft notes offline.*/, 'Draft notes offline'],
    [/^Refactor the ingest pipeline/, 'Plan the data import'],
    [/^\/doctor --plan run/, 'Check the nightly run'],
    [/^Gemini CLI: refactor a script/, 'Refactor a shell script'],
    [/^Muse onboarding copy/, 'Onboarding copy'],
    [/^Codex CLI refactor/, 'Refactor the CLI'],
    [/^Kiro: spec a new endpoint/, 'Spec a new endpoint'],
    [/^Cowork: the billing refactor/, 'Billing refactor notes'],
    [/^Review the pull request.*/, 'Review the pull request'],
    [/^Amazon Q CLI: IAM policy review/, 'IAM policy review'],
    [/^Copilot CLI: explain a git command/, 'Explain a git command'],
    [/^Roo Code: fix a failing test/, 'Fix a failing test'],
    [/^Qwen Code: optimize a loop/, 'Optimize a loop'],
    [/^Gemini workspace audit/, 'Workspace audit'],
    [/^Summarize the meeting.*/, 'Summarize the meeting'],
    [/^Windsurf: wire a new route/, 'Wire a new route'],
    [/^Explain the build error.*/, 'Explain the build error'],
    [/^opencode: add a CLI flag/, 'Add a CLI flag'],
    [/^Cherry Studio prompt tuning/, 'Prompt tuning'],
    [/^Grok launch checklist/, 'Launch checklist'],
    [/^Zed: format-on-save setup/, 'Format-on-save setup'],
    [/^Write unit tests.*/, 'Write unit tests'],
    [/^Chatbox .*/, 'Trip planning notes'],
    [/^Continue: .*/, 'Tidy the config'],
    [/^Jan .*/, 'Offline chat notes'],
    [/^AnythingLLM .*/, 'Handbook Q&A']
  ]
  const retitle = (s) => { for (const [re, to] of TITLES) if (re.test(s)) return s.replace(re, to); return s }
  // any leftover "(model-name)" suffix or "Vendor: " prefix naming a third-party tool
  const BRAND = /\b(Zazen|Gemini|Codex|Kiro|Cowork|Muse|Amazon Q|Copilot|Roo|Qwen|Windsurf|opencode|Cherry Studio|Grok|Zed|Chatbox|AnythingLLM|Claude|ChatGPT|OpenAI|Anthropic|Cursor|Devin|Ollama|llama|mistral|phi-4)\b/i

  SB.brandSafe = () => {
    for (const e of $$('.awc-nm')) { if (e.textContent !== 'Sam') { e.textContent = 'Sam'; e.title = 'Sam' } }
    for (const e of $$('.awc-pop-email')) { e.textContent = 'sam@example.com'; e.title = 'sam@example.com' }
    for (const e of $$('.hub-side-row-badge, .awc-tool-dot')) e.style.display = 'none'
    for (const t of $$('[data-slot="chat-row-title"]')) { const n = retitle(t.textContent); if (n !== t.textContent) { t.textContent = n; t.title = n } }
  }

  const decorate = SB.decorate
  SB.decorate = () => { decorate(); SB.brandSafe() }

  /* ================================================================ the phone phase */
  const E = SB.ease, C = SB.clamp01
  const SHEET = { y0: 1672, y1: 2360, w: 1206 } // crop of ios-sheet.png (1206x2622): the lane sheet only
  const SR = 1206 / 2622 // screen aspect of the simulator captures (the 1170x2532 one is 0.4621 too)
  let L = null
  const layer = () => {
    if (L && L.root.isConnected) return L
    const root = document.createElement('div'); root.setAttribute('data-sb-pocket', '')
    root.style.cssText = 'position:fixed;inset:0;z-index:5000;pointer-events:none;overflow:hidden'
    const scrim = document.createElement('div'); scrim.style.cssText = 'position:absolute;inset:0;background:#08090c'
    const cap = document.createElement('div'); cap.style.cssText = 'position:absolute;font-family:var(--font-serif);font-weight:400;letter-spacing:-0.02em;line-height:1.08;color:#e9ebf1;white-space:nowrap'
    const phone = document.createElement('div'); phone.style.cssText = 'position:absolute;overflow:hidden;will-change:transform,opacity;box-shadow:0 0 0 1.5px rgba(255,255,255,.2),0 38px 90px rgba(0,0,0,.65)'
    const card = document.createElement('div'); card.style.cssText = 'position:absolute;overflow:hidden;will-change:transform,opacity;box-shadow:0 0 0 1.5px rgba(255,255,255,.2),0 38px 90px rgba(0,0,0,.65)'
    root.append(scrim, cap, phone, card); document.body.appendChild(root)
    L = { root, scrim, cap, phone, card, caps: {} }; return L
  }
  const geo = () => {
    const W = innerWidth, H = innerHeight, wide = W / H >= 1.25
    const ph = (wide ? 0.9 : 0.92) * H, pw = ph * SR
    return wide
      ? { W, H, wide, ph, pw, px: 0.73 * W - pw / 2, py: 0.05 * H, cx: 0.73 * W, cy: 0.5 * H, capX: 0.07 * W, capY: 0.5 * H, capW: 0.5 * W, cardW: Math.min(0.42 * W, 0.9 * H * 1.2) }
      : { W, H, wide, ph, pw, px: (W - pw) / 2, py: 0.18 * H, cx: 0.5 * W, cy: 0.58 * H, capX: 0, capY: 0.045 * H, capW: W, cardW: 0.84 * W }
  }
  // the image of a screen, as a child of `host`, shown fully (full phone) or as a crop (card)
  const put = (host, name) => {
    const im = SB.ios.imgs[name]; if (!im) throw new Error('SB.pocket: ' + name + ' not preloaded')
    if (im.parentNode !== host) host.appendChild(im)
    return im
  }
  const hideAll = (host) => { for (const im of host.querySelectorAll('img')) im.style.display = 'none' }
  const full = (host, name, o) => { // o: opacity
    const im = put(host, name); im.style.cssText = `position:absolute;left:0;top:0;width:100%;height:100%;display:block;opacity:${o};will-change:opacity`
  }
  const setCaption = (g, lines, p) => {
    // p: 0 hidden .. 1 shown (eased by caller); the caption block rises 14 px as it arrives
    const { cap } = L
    const key = lines.join('|'); if (cap.dataset.key !== key) {
      cap.dataset.key = key
      const longest = Math.max(...lines.map((s) => s.length))
      const fs = Math.min(g.W * 0.036, (g.capW * 0.95) / (longest * 0.5), g.H * 0.056)
      cap.style.fontSize = fs.toFixed(2) + 'px'
      cap.innerHTML = lines.map((s) => `<div>${s}</div>`).join('')
    }
    if (g.wide) { cap.style.left = g.capX + 'px'; cap.style.top = g.capY + 'px'; cap.style.width = 'auto'; cap.style.textAlign = 'left' }
    else { cap.style.left = '0'; cap.style.top = g.capY + 'px'; cap.style.width = g.W + 'px'; cap.style.textAlign = 'center' }
    const fsPx = parseFloat(cap.style.fontSize)
    const ty = g.wide ? -fsPx * 1.08 : 0 // wide: block centred on capY
    cap.style.transform = `translateY(${(ty + (1 - p) * 14).toFixed(2)}px)`
    cap.style.opacity = String(p)
  }

  /** One pure function of t (seconds into the phone phase, 0..T): the dim, the phone / sheet card, the captions. */
  SB.pocket = (t) => {
    const g = geo(), l = layer()
    const T_IN = 0.7
    // scrim: the real desktop dims and softens behind the phone
    const sIn = E.out(C(t / T_IN)), sOut = 0 // the dim stays to the end card cut
    l.scrim.style.opacity = String((0.66 * sIn * (1 - sOut)).toFixed(3))
    l.scrim.style.backdropFilter = l.scrim.style.webkitBackdropFilter = `blur(${(9 * sIn).toFixed(2)}px)`
    // timeline of the screens
    const S1 = [0.0, 4.6], S2 = [4.4, 9.2], S3 = [9.0, 13.0]
    const a1in = E.out(C((t - 0.15) / 1.0)), a1out = E.inOut(C((t - S1[1]) / 0.7))
    const a2in = E.out(C((t - S2[0]) / 0.7)), a2out = E.inOut(C((t - S2[1]) / 0.7))
    const a3in = E.out(C((t - S3[0]) / 0.9)), a3out = E.inOut(C((t - S3[1]) / 0.7))
    // full phone: rises in, holds with a slow push-in, then slides away when the card arrives
    const phoneIn = a1in, phoneOut = a2out
    const phoneOp = phoneIn * (1 - phoneOut) * (1 - sOut)
    hideAll(l.phone)
    l.phone.style.cssText += `;left:${g.px}px;top:${g.py}px;width:${g.pw}px;height:${g.ph}px;border-radius:${(g.pw * 0.072).toFixed(1)}px`
    const push = 1 + 0.045 * C(t / 9.2)
    const rise = (1 - phoneIn) * g.ph * 0.16 + phoneOut * g.ph * 0.1
    l.phone.style.transform = `translateY(${rise.toFixed(1)}px) scale(${((0.95 + 0.05 * phoneIn) * push).toFixed(4)})`
    l.phone.style.transformOrigin = '50% 30%'
    l.phone.style.opacity = String(phoneOp.toFixed(3))
    l.phone.style.display = phoneOp <= 0.002 ? 'none' : 'block'
    full(l.phone, 'ios-connect', (1 - a2in).toFixed(3))
    full(l.phone, 'ios-composer', a2in.toFixed(3))
    // the lane-sheet card (a crop of ios-sheet.png)
    const cw = g.cardW, k = cw / SHEET.w, ch = (SHEET.y1 - SHEET.y0) * k
    const cardOp = a3in * (1 - a3out) * (1 - sOut)
    hideAll(l.card)
    l.card.style.cssText += `;left:${(g.cx - cw / 2).toFixed(1)}px;top:${(g.cy - ch / 2).toFixed(1)}px;width:${cw.toFixed(1)}px;height:${ch.toFixed(1)}px;border-radius:${(cw * 0.04).toFixed(1)}px`
    l.card.style.transform = `translateY(${((1 - a3in) * 60 + a3out * 30).toFixed(1)}px) scale(${(0.94 + 0.06 * a3in + 0.03 * C((t - S3[0]) / 4.4)).toFixed(4)})`
    l.card.style.opacity = cardOp.toFixed(3)
    l.card.style.display = cardOp <= 0.002 ? 'none' : 'block'
    const im = put(l.card, 'ios-sheet')
    im.style.cssText = `position:absolute;left:0;top:${(-SHEET.y0 * k).toFixed(2)}px;width:${(1206 * k).toFixed(2)}px;height:${(2622 * k).toFixed(2)}px;display:block`
    // captions
    const caps = [
      [['Your desktop chats', 'wait on your phone.'], 0.55, 4.2],
      [['Pick up any chat.', 'Keep going.'], 4.9, 9.0],
      [['Same account.', 'Same chats.'], 9.5, 12.9]
    ]
    let on = null, pv = 0
    for (const [lines, t0, t1] of caps) {
      const v = E.out(C((t - t0) / 0.6)) * (1 - E.inOut(C((t - t1) / 0.5)))
      if (v > pv) { pv = v; on = lines }
    }
    if (on) { l.cap.style.display = 'block'; setCaption(g, on, pv) } else l.cap.style.display = 'none'
  }
})()

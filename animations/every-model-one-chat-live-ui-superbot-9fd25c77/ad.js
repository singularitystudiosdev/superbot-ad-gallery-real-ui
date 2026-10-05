// Every model. One chat. (live UI)
// Replays DOM captured from the real superbot-desktop renderer (main), state by state, on
// one virtual clock: the app's own markup and CSS, morphed in place so its own CSS
// animations keep running. Each aspect ratio replays a capture taken at that window shape.
// ?t=<s> freezes a frame, ?cam=full locks the camera, ?render=1 hands the clock to a renderer.

const RATIO_APP = { '16x9': [1440, 810], '4x3': [1080, 810], '1x1': [810, 810], '4x5': [648, 810] }
const AR_KEY = (window.AR && RATIO_APP[window.AR.key] && window.AR.key) || '16x9'
const [APP_W, APP_H] = RATIO_APP[AR_KEY]
const STAGE_W = window.AR?.w || 1920
const STAGE_H = 1080
const BASE = STAGE_W / APP_W
const { REGIONS, STATES } = await import(`./states.${AR_KEY}.js`)

const ASK_MEME = 'make me a muse meme'
const ASK_REDDIT = 'Scrape reddit and look for more'
const ASK_BURGER = 'Winning, order me a burger.'
const TAGLINE = ['Every model.', 'One chat.']
const DOMAIN = 'superbot.gg'

// t: when the state lands. type: composer text typed over `dur` s. reveal: seconds the
// newest answer streams in over. xfade: seconds the previous state fades out on top.
const CUES = [
  { t: 0.0, s: '00-newchat' },
  { t: 0.35, s: '00b-picker' },
  { t: 1.8, s: '00-newchat', xfade: 0.2 },
  { t: 2.0, s: '01-newchat-typed', type: ASK_MEME, dur: 0.95 },
  { t: 3.15, s: '02-t1-thinking', xfade: 0.3 },
  { t: 3.6, s: '03-t1-switching' },
  { t: 4.6, s: '04-t1-live' },
  { t: 5.3, s: '05-t1-streamed', reveal: 0.35 },
  { t: 5.7, s: '06-t1-done' },
  { t: 6.85, s: '07-t2-typed', type: ASK_REDDIT, dur: 1.05 },
  { t: 8.1, s: '08-t2-thinking' },
  { t: 8.5, s: 't2-searching' },
  { t: 9.3, s: 't2-reading' },
  { t: 10.05, s: 't2-list', reveal: 0.6 },
  { t: 10.75, s: '12-t2-done', xfade: 0.2 },
  { t: 11.75, s: '13-t3-typed', type: ASK_BURGER, dur: 1.0 },
  { t: 12.9, s: '14-t3-thinking' },
  { t: 13.3, s: '15-t3-switching' },
  { t: 14.05, s: '16-t3-step1' },
  { t: 14.65, s: '17-t3-step2' },
  { t: 15.25, s: '18-t3-step3' },
  { t: 15.9, s: '20-t3-done', xfade: 0.2, reveal: 0.6 },
]
const CARD_AT = 17.9
const CARD_FADE = 0.5
const DUR = 20.9

// Camera keys: [t, target]. Targets are measured from the app layout at boot.
const CAMERA = [
  [0, 'full'],
  [0.35, 'full'],
  [1.05, 'picker'],
  [1.35, 'pickerRows'],
  [1.85, 'pickerRows'],
  [2.9, 'composer'],
  [3.15, 'composer'],
  [3.65, 'thread'],
  [4.1, 'pill1'],
  [4.65, 'pill1'],
  [5.2, 'thread'],
  [13.25, 'thread'],
  [13.75, 'pill3'],
  [15.65, 'pill3'],
  [16.15, 'thread'],
  [16.6, 'thread'],
  [17.25, 'payoff'],
  [CARD_AT, 'payoff'],
  [CARD_AT + CARD_FADE, 'full'],
  [DUR, 'full'],
]

const params = new URLSearchParams(location.search)
const frozenAt = params.has('t') ? Number(params.get('t')) : null
const renderMode = params.has('render')
const lockedCamera = params.get('cam')

const stage = document.getElementById('stage')
const cam = document.getElementById('cam')

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
const easeOut = (p) => 1 - Math.pow(1 - p, 3)
const lerp = (a, b, p) => a + (b - a) * p

const byName = new Map(STATES.map((s) => [s.name, s]))
const expanded = new Map()
const expand = (str) =>
  str.replace(/<!--R:([a-z0-9]+)-->/g, (m, k) => {
    let v = expanded.get(k)
    if (v === undefined) {
      v = expand(REGIONS[k])
      expanded.set(k, v)
    }
    return v
  })

// ---- morph: patch a live DOM toward a template, keeping unchanged nodes --------------------

const keyOf = (n) =>
  n.nodeType === 1 ? n.getAttribute('data-message-id') || n.getAttribute('id') || n.getAttribute('data-testid') || null : null

// A key moves a node only when it is unique among its siblings: the step rows of one
// switch share a testid, and moving by it would fold the checklist onto one row.
function uniqueKeys(nodes) {
  const count = new Map()
  for (const n of nodes) {
    const k = keyOf(n)
    if (k) count.set(k, (count.get(k) || 0) + 1)
  }
  return nodes.map((n) => {
    const k = keyOf(n)
    return k && count.get(k) === 1 ? k : null
  })
}

function sameKind(a, b) {
  if (a.nodeType !== b.nodeType) return false
  if (a.nodeType !== 1) return true
  return a.tagName === b.tagName && keyOf(a) === keyOf(b)
}

function syncAttributes(from, to) {
  for (const a of [...from.attributes]) if (!to.hasAttribute(a.name)) from.removeAttribute(a.name)
  for (const a of to.attributes) if (from.getAttribute(a.name) !== a.value) from.setAttribute(a.name, a.value)
}

function morphChildren(doc, from, to) {
  const wanted = [...to.childNodes]
  const wantedKeys = uniqueKeys(wanted)
  const have = [...from.childNodes]
  const keyed = new Map()
  uniqueKeys(have).forEach((k, j) => k && keyed.set(k, have[j]))
  for (let i = 0; i < wanted.length; i++) {
    const t = wanted[i]
    let f = from.childNodes[i] || null
    const k = wantedKeys[i]
    const match = k ? keyed.get(k) : null
    if (match && match !== f && match.parentNode === from) {
      from.insertBefore(match, f)
      f = match
    }
    if (!f) from.appendChild(doc.importNode(t, true))
    else if (sameKind(f, t)) morphNode(doc, f, t)
    else from.insertBefore(doc.importNode(t, true), f)
  }
  while (from.childNodes.length > wanted.length) from.lastChild.remove()
}

function morphNode(doc, from, to) {
  if (from.nodeType !== 1) {
    if (from.nodeValue !== to.nodeValue) from.nodeValue = to.nodeValue
    return
  }
  syncAttributes(from, to)
  morphChildren(doc, from, to)
}

// ---- a surface: one iframe running the app's DOM ---------------------------------------

const FRAME_CSS = `
html, body { margin: 0 !important; width: ${APP_W}px; height: ${APP_H}px; overflow: hidden !important; }
::-webkit-scrollbar { width: 0 !important; height: 0 !important; }
* { caret-color: transparent !important; scrollbar-width: none; content-visibility: visible !important; scroll-behavior: auto !important; }
[data-testid="composer-input"].ad-caret::after { content: ""; display: inline-block; width: 2px; height: 1.15em; margin-left: 1px; vertical-align: -0.2em; background: currentColor; opacity: var(--ad-caret-o, 1); }
#ad-lights { position: fixed; left: 8.33px; top: 11.67px; z-index: 2147483646; display: flex; gap: 7.5px; pointer-events: none; }
#ad-lights i { width: 11.67px; height: 11.67px; border-radius: 50%; box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.18); }
#ad-card { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; opacity: 0; visibility: hidden; pointer-events: none; }
#ad-card .ad-card-stack { display: flex; flex-direction: column; align-items: center; gap: 26px; }
#ad-card .ad-card-mark { position: relative; }
#ad-card h1 { margin: 0; text-align: center; line-height: 1.04; }
#ad-card h1 span { display: block; }
#ad-card .ad-card-url { letter-spacing: 0.01em; }
`

class Surface {
  constructor(iframe) {
    this.iframe = iframe
    this.templates = new Map()
    this.scrollers = new Set()
    this.attrCache = new Map()
    this.applied = null
    this.appliedCueT = 0
  }

  async load() {
    this.iframe.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="app.css"><style>${FRAME_CSS}</style></head><body></body></html>`
    await new Promise((r) => this.iframe.addEventListener('load', r, { once: true }))
    this.doc = this.iframe.contentDocument
    const link = this.doc.querySelector('link[rel="stylesheet"]')
    if (!link.sheet) await new Promise((r) => link.addEventListener('load', r, { once: true }))
    // the macOS window controls: native chrome, so not in the renderer's DOM
    const lights = this.doc.createElement('div')
    lights.id = 'ad-lights'
    for (const color of ['#ff5f57', '#febc2e', '#28c840']) {
      const dot = this.doc.createElement('i')
      dot.style.background = color
      lights.append(dot)
    }
    this.doc.documentElement.append(lights)
  }

  template(name) {
    let tpl = this.templates.get(name)
    if (tpl) return tpl
    const src = byName.get(name)
    if (!src) throw new Error(`no captured state ${name} for ${AR_KEY}`)
    const holder = this.doc.createElement('template')
    holder.innerHTML = expand(src.body)
    tpl = { src, root: holder.content }
    this.templates.set(name, tpl)
    return tpl
  }

  attrs(attrs) {
    const key = JSON.stringify(attrs)
    let el = this.attrCache.get(key)
    if (!el) {
      el = this.doc.createElement('div')
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
      this.attrCache.set(key, el)
    }
    return el
  }

  apply(name, cueT) {
    const { doc } = this
    const tpl = this.template(name)
    syncAttributes(doc.documentElement, this.attrs(tpl.src.htmlAttrs))
    syncAttributes(doc.body, this.attrs(tpl.src.bodyAttrs))
    morphChildren(doc, doc.body, tpl.root)
    this.applied = name
    this.appliedCueT = cueT
    for (const el of doc.querySelectorAll('[data-snap-st]')) this.scrollers.add(el)
    for (const el of this.scrollers) {
      if (!el.isConnected) {
        this.scrollers.delete(el)
        continue
      }
      const target = Number(el.getAttribute('data-snap-st') || 0)
      if (el.__target !== target) {
        el.__from = el.__target ?? target
        el.__target = target
        el.__t0 = cueT
      }
    }
    this.syncPopovers()
    // a looping animation was already running in the app when the frame was captured
    for (const a of doc.getAnimations()) {
      if (a.__t0 !== undefined) continue
      a.__born = Number.isFinite(a.effect?.getComputedTiming().activeDuration) ? cueT : cueT - 1.3
    }
  }

  // The capture keeps a popover's markup but not its top-layer state: a listbox popover
  // is shown exactly when its trigger was captured expanded.
  syncPopovers() {
    const open = Boolean(this.doc.querySelector('[aria-haspopup="listbox"][aria-expanded="true"]'))
    for (const p of this.doc.querySelectorAll('[popover]')) {
      if (p.querySelectorAll('[role="option"]').length < 2) continue
      const shown = p.matches(':popover-open')
      if (open && !shown) p.showPopover()
      if (!open && shown) p.hidePopover()
    }
  }

  forgetScroll() {
    for (const el of this.scrollers) el.__target = undefined
  }

  // An animation first seen on a state's opening frame plays from the cue. One that
  // appears later (an image decoding) is already over if it ends, and keeps the cue's
  // phase if it loops.
  driveAnimations(t) {
    for (const a of this.doc.getAnimations()) {
      if (a.__t0 === undefined) a.__t0 = a.__born ?? (Number.isFinite(a.effect?.getComputedTiming().activeDuration) ? -1e4 : this.appliedCueT)
      if (a.playState !== 'paused') a.pause()
      a.currentTime = Math.max(0, (t - a.__t0) * 1000)
    }
  }

  driveScroll(t) {
    for (const el of this.scrollers) {
      if (el.__target === undefined) continue
      const p = easeInOut(clamp((t - el.__t0) / 0.55))
      el.scrollTop = Math.round(lerp(el.__from, el.__target, p))
    }
  }

  settleScroll() {
    for (const el of this.scrollers) {
      el.__from = el.__target
      if (el.__target !== undefined) el.scrollTop = el.__target
    }
  }

  async imagesReady() {
    await Promise.all(
      [...this.doc.images].map((im) => (im.complete ? im.decode().catch(() => {}) : new Promise((r) => { im.onload = im.onerror = r })))
    )
  }
}

const main = new Surface(document.getElementById('app'))
const ghost = new Surface(document.getElementById('ghost'))
const targets = {}

// ---- per-frame drivers ------------------------------------------------------------

function cueIndexAt(t) {
  let i = 0
  for (let j = 0; j < CUES.length; j++) if (CUES[j].t <= t) i = j
  return i
}

function driveTyping(cue, t) {
  const box = main.doc.querySelector('[data-testid="composer-input"]')
  if (!box) return
  if (!cue.type) {
    box.classList.remove('ad-caret')
    return
  }
  const p = clamp((t - cue.t) / cue.dur)
  const text = cue.type.slice(0, Math.round(p * cue.type.length))
  if (box.textContent !== text) box.textContent = text
  box.classList.add('ad-caret')
  const blinkOn = p < 1 || Math.floor((t - cue.t - cue.dur) * 2.4) % 2 === 0
  box.style.setProperty('--ad-caret-o', blinkOn ? '1' : '0')
}

function driveReveal(cue, t) {
  if (!cue.reveal) return
  const bodies = main.doc.querySelectorAll('[data-answer-body]')
  const el = bodies[bodies.length - 1]
  if (!el) return
  const p = easeOut(clamp((t - cue.t) / cue.reveal))
  if (p >= 1) {
    el.style.removeProperty('-webkit-mask-image')
    el.style.removeProperty('mask-image')
    return
  }
  const r = p * (el.scrollHeight + 48)
  const mask = `linear-gradient(180deg, #000 ${Math.max(0, r - 48)}px, transparent ${r}px)`
  el.style.setProperty('-webkit-mask-image', mask)
  el.style.setProperty('mask-image', mask)
}

function driveGhost(i, t) {
  const cue = CUES[i]
  const frame = ghost.iframe
  if (!cue.xfade || i === 0 || t >= cue.t + cue.xfade) {
    frame.style.opacity = '0'
    frame.style.visibility = 'hidden'
    // stage the outgoing state while hidden, so it is painted when the fade begins
    const next = CUES[i + 1]
    if (next?.xfade && ghost.applied !== cue.s) {
      ghost.apply(cue.s, cue.t)
      ghost.settleScroll()
    }
    return
  }
  const prev = CUES[i - 1]
  if (ghost.applied !== prev.s) ghost.apply(prev.s, prev.t)
  // every frame: the ghost's images may decode after it lands, which lets the feed scroll further
  ghost.settleScroll()
  // line the two frames up on the newest ask, so only what changed under it dissolves
  const bubbles = (d) => [...d.querySelectorAll('[data-testid="message-row"][data-variant="bubble"]')]
  const mine = bubbles(main.doc).pop()
  const id = mine?.getAttribute('data-message-id')
  const theirs = mine && ((id && ghost.doc.querySelector(`[data-message-id="${id}"]`)) || bubbles(ghost.doc).pop())
  const feed = ghost.doc.querySelector('[data-testid="feed"]')
  if (theirs && feed) feed.scrollTop += theirs.getBoundingClientRect().top - mine.getBoundingClientRect().top
  ghost.driveAnimations(cue.t)
  frame.style.visibility = 'visible'
  frame.style.opacity = String(1 - easeInOut(clamp((t - cue.t) / cue.xfade)))
}

function cameraTarget(name) {
  return targets[lockedCamera || name] || targets.full
}

function driveCamera(t) {
  let i = 0
  while (i < CAMERA.length - 2 && CAMERA[i + 1][0] <= t) i++
  const [t0, a] = CAMERA[i]
  const [t1, b] = CAMERA[i + 1]
  const p = easeInOut(clamp((t - t0) / Math.max(0.001, t1 - t0)))
  const A = cameraTarget(a)
  const B = cameraTarget(b)
  const s = lerp(A.s, B.s, p)
  const x = lerp(A.x, B.x, p)
  const y = lerp(A.y, B.y, p)
  const k = BASE * s
  cam.style.transform = `translate(${(STAGE_W / 2 - x * k).toFixed(2)}px, ${(STAGE_H / 2 - y * k).toFixed(2)}px) scale(${k.toFixed(4)})`
}

function driveCard(t) {
  const card = main.doc.getElementById('ad-card')
  if (!card) return
  const p = easeInOut(clamp((t - CARD_AT) / CARD_FADE))
  card.style.opacity = String(p)
  card.style.visibility = p > 0 ? 'visible' : 'hidden'
  card.firstElementChild.style.transform = `translateY(${((1 - p) * 18).toFixed(2)}px) scale(${(0.97 + 0.03 * p).toFixed(4)})`
}

let lastCue = -1
function render(t) {
  t = clamp(t, 0, DUR)
  const i = cueIndexAt(t)
  const cue = CUES[i]
  if (main.applied !== cue.s || main.appliedCueT !== cue.t) {
    main.apply(cue.s, cue.t)
    // a jump (seek, loop) has no frame to ease from, and a crossfade lines up best at rest
    if (i !== lastCue + 1 || cue.xfade) main.settleScroll()
  }
  lastCue = i
  driveTyping(cue, t)
  driveReveal(cue, t)
  main.driveScroll(t)
  main.driveAnimations(t)
  driveGhost(i, t)
  driveCamera(t)
  driveCard(t)
}

// ---- layout measurement for the camera ---------------------------------------------

function fit(rect, sMax, pad = 1.18) {
  const s = clamp(Math.min(sMax, APP_W / (rect.width * pad), APP_H / (rect.height * pad)), 1, sMax)
  const halfW = APP_W / (2 * s)
  const halfH = APP_H / (2 * s)
  return {
    s,
    x: clamp(rect.left + rect.width / 2, halfW, APP_W - halfW),
    y: clamp(rect.top + rect.height / 2, halfH, APP_H - halfH),
  }
}

function union(...els) {
  const rs = els.filter(Boolean).map((e) => e.getBoundingClientRect())
  const left = Math.min(...rs.map((r) => r.left))
  const top = Math.min(...rs.map((r) => r.top))
  const right = Math.max(...rs.map((r) => r.right))
  const bottom = Math.max(...rs.map((r) => r.bottom))
  return { left, top, width: right - left, height: bottom - top }
}

async function at(name) {
  main.apply(name, 0)
  main.settleScroll()
  await main.imagesReady()
  main.settleScroll()
  return main.doc
}

async function measure() {
  const narrow = APP_W < 1000
  targets.full = { s: 1, x: APP_W / 2, y: APP_H / 2 }
  let d = await at('20-t3-done')
  const thread = d.querySelector('[data-testid="thread"]') || d.querySelector('.hub-main')
  const tr = thread.getBoundingClientRect()
  const sThread = narrow ? 1.08 : APP_W < 1200 ? 1.18 : 1.3
  targets.thread = fit({ left: tr.left, top: APP_H - APP_H / sThread, width: tr.width, height: APP_H / sThread }, sThread, 1)
  const rows = d.querySelectorAll('[data-testid="message-row"][data-variant="prose"]')
  targets.payoff = fit(rows[rows.length - 1].getBoundingClientRect(), narrow ? 1.3 : 1.55)
  mainColumn = tr

  d = await at('00b-picker')
  const box = d.querySelector('[data-testid="composer-input"]')
  const composer = box.closest('.hub-composer') || box.parentElement.parentElement
  const list = d.querySelector('[role="listbox"]') || d.querySelector('[role="menu"]')
  targets.picker = fit(union(list, composer), narrow ? 1.25 : 1.5, 1.12)
  targets.pickerRows = fit(union(list), narrow ? 1.5 : 1.95, 1.08)
  targets.composer = fit(union(composer), narrow ? 1.2 : 1.45, 1.25)

  d = await at('03-t1-switching')
  const pills = d.querySelectorAll('[data-testid="provider-switch-pill"]')
  const pill1 = pills[pills.length - 1]
  const turn1 = pill1.closest('[data-testid="message-row"]') || pill1
  const bubbles = [...d.querySelectorAll('[data-testid="message-row"][data-variant="bubble"]')]
  targets.pill1 = fit(union(bubbles[bubbles.length - 1], pill1, ...turn1.querySelectorAll('[data-testid="turn-head"]')), narrow ? 1.45 : 1.7, 1.3)

  d = await at('18-t3-step3')
  const live = d.querySelector('[data-testid="live-provider-switch"]') || [...d.querySelectorAll('[data-testid="provider-switch-pill"]')].pop()
  targets.pill3 = fit(union(live), narrow ? 1.35 : 1.6, 1.3)

  // every framing inside the conversation stays clear of the sidebar and rail
  for (const k of ['thread', 'payoff', 'composer', 'pill1', 'pill3']) targets[k] = inMain(targets[k])
  main.forgetScroll()
  main.applied = null
}

let mainColumn = null
function inMain(target) {
  const s = Math.max(target.s, APP_W / mainColumn.width)
  const halfW = APP_W / (2 * s)
  const halfH = APP_H / (2 * s)
  return { s, x: clamp(target.x, mainColumn.left + halfW, APP_W - halfW), y: clamp(target.y, halfH, APP_H - halfH) }
}

// ---- the end card: the app's own mascot and display face, on the app's background ------

async function buildCard() {
  const d = await at('00-newchat')
  const hero = d.querySelector('[data-testid="thread-idle"]')
  const heading = hero.querySelector('h2, h1')
  const hs = getComputedStyle(heading)
  const bodyStyle = getComputedStyle(d.body)
  // the mascot: the outermost box around the hero's first svg that does not hold the heading
  let mascot = hero.querySelector('svg')
  while (mascot.parentElement && mascot.parentElement !== hero && !mascot.parentElement.contains(heading)) mascot = mascot.parentElement
  const mr = mascot.getBoundingClientRect()
  const card = d.createElement('div')
  card.id = 'ad-card'
  card.style.background = bodyStyle.backgroundColor
  const stack = d.createElement('div')
  stack.className = 'ad-card-stack'
  const markBox = d.createElement('div')
  markBox.className = 'ad-card-mark'
  const markPx = Math.min(150, APP_W * 0.2)
  const k = markPx / Math.max(mr.width, mr.height, 1)
  markBox.style.width = `${(mr.width * k).toFixed(1)}px`
  markBox.style.height = `${(mr.height * k).toFixed(1)}px`
  const clone = mascot.cloneNode(true)
  Object.assign(clone.style, { position: 'absolute', left: '0', top: '0', margin: '0', width: `${mr.width}px`, height: `${mr.height}px`, transformOrigin: '0 0', transform: `scale(${k})` })
  markBox.append(clone)
  const h1 = d.createElement('h1')
  Object.assign(h1.style, { fontFamily: hs.fontFamily, fontWeight: hs.fontWeight, color: hs.color, letterSpacing: hs.letterSpacing, fontSize: `${Math.min(76, APP_W * 0.085)}px` })
  for (const line of TAGLINE) {
    const span = d.createElement('span')
    span.textContent = line
    h1.append(span)
  }
  const url = d.createElement('div')
  url.className = 'ad-card-url'
  url.textContent = DOMAIN
  Object.assign(url.style, { font: `500 ${Math.min(24, APP_W * 0.032)}px ${bodyStyle.fontFamily}`, color: hs.color, opacity: '0.6' })
  stack.append(markBox, h1, url)
  card.append(stack)
  d.documentElement.append(card)
  main.forgetScroll()
  main.applied = null
}

// ---- boot ---------------------------------------------------------------------------

function fitStage() {
  stage.style.setProperty('--fit', String(Math.min(innerWidth / STAGE_W, innerHeight / STAGE_H)))
}

async function boot() {
  stage.style.setProperty('--stage-w', `${STAGE_W}px`)
  cam.style.width = `${APP_W}px`
  cam.style.height = `${APP_H}px`
  fitStage()
  addEventListener('resize', fitStage)
  addEventListener('archange', () => location.reload())
  await Promise.all([main.load(), ghost.load()])
  main.apply('00-newchat', 0)
  stage.style.setProperty('--app-bg', getComputedStyle(main.doc.body).backgroundColor || '#0e0e10')
  await main.doc.fonts.ready
  await Promise.all([preloadImages(main), preloadImages(ghost)])
  await measure()
  await buildCard()
  await renderSettled(frozenAt ?? 0)
}

// Warm every image the states use inside the app document, so a state change never waits.
async function preloadImages(surface) {
  const srcs = new Set()
  for (const v of [...Object.values(REGIONS), ...STATES.map((s) => s.body)]) for (const m of v.matchAll(/src="(app\/[^"]+)"/g)) srcs.add(m[1])
  await Promise.all(
    [...srcs].map((s) => {
      const im = surface.doc.createElement('img')
      im.src = s
      return im.decode().catch(() => {})
    })
  )
  await surface.doc.fonts.ready
}

// Images decode after a state lands; a scroller clamps against the shorter feed until
// they do, so a seek renders, waits for every image, and renders again.
async function renderSettled(t) {
  render(t)
  await Promise.all([main.imagesReady(), ghost.imagesReady()])
  await new Promise((r) => requestAnimationFrame(() => r()))
  render(t)
}

const ready = boot()
window.__AD = { DUR, CUES, render: (t) => render(t), renderSettled, ready, ratio: AR_KEY, targets, segments: [{ name: 'live-ui', start: 0, end: DUR }] }

if (!renderMode && frozenAt === null) {
  ready.then(() => {
    const start = performance.now()
    const tick = (now) => {
      render(((now - start) / 1000) % DUR)
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

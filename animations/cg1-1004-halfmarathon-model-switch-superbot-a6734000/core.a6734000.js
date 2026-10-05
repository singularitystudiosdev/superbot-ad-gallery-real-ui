// Shared timeline, easing and DOM helpers. Every visual is a pure function of t (seconds).

export const DUR = 27.872
export const END = 25.15

// Beat starts, in seconds. One table so every module agrees on the cut points.
export const T = {
  type0: 0.5, type1: 2.05, send: 2.18, dock0: 2.36, dock1: 3.1, ask: 2.75,
  route: 3.15,
  sw1: 4.2, ds: 4.7,
  sw2: 7.85, gm: 8.35,
  sw3: 11.0, op: 11.5, opPrev: 14.05,
  sb2: 17.45, sv: 19.05, svSave: 20.8, svRoutes: 22.6,
  fin: 23.6,
}

export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const seg = (t, a, b) => clamp01((t - a) / (b - a))
export const lerp = (a, b, p) => a + (b - a) * p

export const E = {
  out: (p) => 1 - Math.pow(1 - p, 3),
  outQuint: (p) => 1 - Math.pow(1 - p, 5),
  inOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  inOutSine: (p) => -(Math.cos(Math.PI * p) - 1) / 2,
  outBack: (p) => {
    const c1 = 1.15
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2)
  },
}

// Writes a style only when it changed: seek() runs every frame and layout must stay cheap.
export function css(el, prop, val) {
  const cache = el.__css || (el.__css = {})
  if (cache[prop] === val) return
  cache[prop] = val
  el.style.setProperty(prop, val)
}

export function show(el, p) {
  css(el, 'opacity', p.toFixed(3))
  css(el, 'visibility', p <= 0.001 ? 'hidden' : 'visible')
}

// Fade + rise (+ optional scale) driven by a start time and a duration.
export function rise(el, t, a, d = 0.55, dy = 16, s0 = 1) {
  const p = E.outQuint(seg(t, a, a + d))
  show(el, p)
  const sc = s0 === 1 ? '' : ` scale(${lerp(s0, 1, p).toFixed(4)})`
  css(el, 'transform', `translate3d(0,${((1 - p) * dy).toFixed(2)}px,0)${sc}`)
  return p
}

export function typeText(el, text, p) {
  const n = Math.round(text.length * clamp01(p))
  if (el.__n === n) return n
  el.__n = n
  el.textContent = text.slice(0, n)
  return n
}

export function el(html) {
  const host = document.createElement('div')
  host.innerHTML = html.trim()
  return host.firstElementChild
}

export const $ = (sel, root = document) => root.querySelector(sel)
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))

export function count(el, from, to, p, fmt = (v) => Math.round(v).toLocaleString('en-US')) {
  const s = fmt(lerp(from, to, E.out(clamp01(p))))
  if (el.__v !== s) {
    el.__v = s
    el.textContent = s
  }
}

// Seeded RNG so procedural art (map tiles) is identical on every load and every frame.
export function rng(seed) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 100000) / 100000
  }
}

export const tile = (kind) => {
  const src = {
    ds: 'brand/deepseek-logo.svg',
    gm: 'brand/gemini-logo.svg',
    op: 'brand/claude-logo.svg',
    sv: 'brand/strava-logo.svg',
  }[kind]
  return src ? `<span class="tile ${kind}"><img src="${src}" alt=""></span>` : `<span class="tile sb"><span class="sbm"></span></span>`
}

export const spinner = () => `<span class="spin"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg></span>`
export const check = () => `<span class="ok"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span>`

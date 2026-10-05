// Entry: builds the thread, measures it once, then renders any time t with window.seek(t).
// ?render=1 holds still for the frame grabber; otherwise it loops in real time.
import { DUR, END, T, E, seg, lerp, css, show, $, $$ } from './core.a6734000.js'
import { buildAsk, buildRoute, buildSwitch, buildSb2, buildFin, animThread, animComposer } from './thread.a6734000.js'
import { buildDeepSeek, animDeepSeek } from './deepseek.a6734000.js'
import { buildGemini, animGemini } from './gemini.a6734000.js'
import { buildOpus, animOpus, measureOpus } from './opus.a6734000.js'
import { buildStrava, animStrava, measureStrava } from './strava.a6734000.js'

const GEO = { homeTop: 486, dockTop: 912, viewH: 900, keys: [] }
let markHTML = ''
let markSeq = 0

function mountMarks(root) {
  for (const host of $$('.sbm', root)) {
    if (host.firstChild) continue
    host.innerHTML = markHTML.split('sb-gate-mark').join(`sbg-${++markSeq}`)
  }
}
GEO.mountMarks = mountMarks

function build() {
  const probe = document.createElement('div')
  const inst = window.sbMarkLive(probe, { size: 0, interactive: false })
  markHTML = inst.html
  inst.destroy()
  const feed = $('#feed')
  for (const b of [buildAsk(), buildRoute(), buildSwitch(0), buildDeepSeek(), buildSwitch(1), buildGemini(), buildSwitch(2), buildOpus(), buildSb2(), buildStrava(), buildFin()]) feed.appendChild(b)
  $('#hero-mark').innerHTML = '<span class="sbm big"></span>'
  $('#end-mark').innerHTML = '<span class="sbm huge"></span>'
  mountMarks(document)
  for (const eye of $$('.mark-eye-l, .mark-eye-r')) eye.__ry = eye.getAttribute('ry')
}

// Scroll targets are measured from the final layout; reveals only touch opacity/transform.
function measure() {
  const feed = $('#feed')
  const viewH = GEO.dockTop - 14
  GEO.viewH = viewH
  const box = (sel) => {
    const e = $(sel, feed)
    const r = e.getBoundingClientRect()
    const f = feed.getBoundingClientRect()
    return { top: r.top - f.top, bot: r.bottom - f.top, h: r.height }
  }
  const fit = (sel, gap = 34) => Math.max(0, box(sel).bot - (viewH - gap))
  const focus = (sel) => {
    const b = box(sel)
    return b.h <= viewH - 90 ? fit(sel) : Math.max(0, b.top - 46)
  }
  // targets switch at these times; a critically damped follower glides between them (see bakeScroll)
  GEO.keys = [
    [0, 0],
    [T.sw1 - 0.3, fit('#b-sw1')],
    [T.ds + 0.2, fit('#b-ds .ds-grid')],
    [T.ds + 1.1, fit('#b-ds')],
    [T.sw2 - 0.3, fit('#b-sw2')],
    [T.gm, fit('#b-gm .gm-figs')],
    [T.gm + 1.4, fit('#b-gm')],
    [T.sw3 - 0.3, fit('#b-sw3')],
    [T.op, focus('#b-op')],
    [T.sb2 - 0.3, fit('#b-sb2')],
    [T.sv - 0.25, focus('#b-sv')],
    [T.fin - 0.3, fit('#b-fin', 40)],
  ]
  bakeScroll()
  measureOpus()
  measureStrava()
}

// Critically damped spring (omega 6/s) sampled at 240 Hz once, so seek(t) stays pure and cheap:
// velocity carries through consecutive targets instead of stopping at each one.
const HZ = 240
const OMEGA = 6
function bakeScroll() {
  const k = GEO.keys
  const n = Math.ceil(DUR * HZ) + 1
  const out = new Float32Array(n)
  let x = 0
  let v = 0
  let ki = 0
  for (let i = 0; i < n; i++) {
    const t = i / HZ
    while (ki + 1 < k.length && k[ki + 1][0] <= t) ki++
    const acc = OMEGA * OMEGA * (k[ki][1] - x) - 2 * OMEGA * v
    v += acc / HZ
    x += v / HZ
    out[i] = x
  }
  GEO.scroll = out
}

function scrollAt(t) {
  const s = GEO.scroll
  const f = Math.min(s.length - 1, t * HZ)
  const i = Math.floor(f)
  return lerp(s[i], s[Math.min(s.length - 1, i + 1)], f - i)
}

const BLINKS = [1.55, 6.4, 12.9, 18.7, 25.1]

function animMarks(t) {
  document.documentElement.style.setProperty('--t', t.toFixed(3))
  const shut = BLINKS.some((b) => t >= b && t < b + 0.12)
  for (const eye of $$('.mark-eye-l, .mark-eye-r')) {
    if (eye.__ry === undefined) eye.__ry = eye.getAttribute('ry')
    const ry = shut ? '1' : eye.__ry
    if (eye.getAttribute('ry') !== ry) eye.setAttribute('ry', ry)
  }
}

function animCamera(t) {
  // gentle push toward the composer while typing, then settle on dock
  const push = E.inOutSine(seg(t, 0.3, T.type1)) * (1 - E.inOut(seg(t, T.dock0, T.dock1)))
  const sc = 1 + push * 0.035
  const oy = lerp(GEO.homeTop + 70, 560, E.inOut(seg(t, T.dock0, T.dock1)))
  css($('#cam'), 'transform-origin', `960px ${oy.toFixed(1)}px`)
  css($('#cam'), 'transform', `scale(${sc.toFixed(4)})`)
}

function animEnd(t) {
  const out = E.inOut(seg(t, END - 0.45, END + 0.15))
  css($('#app'), 'opacity', (1 - out).toFixed(3))
  css($('#app'), 'filter', out > 0.001 ? `blur(${(out * 6).toFixed(2)}px)` : 'none')
  const inn = E.outQuint(seg(t, END - 0.05, END + 0.85))
  const end = $('#end')
  show(end, inn)
  css($('#end-mark'), 'transform', `translate3d(0,${((1 - inn) * 26).toFixed(1)}px,0) scale(${lerp(0.86, 1, inn).toFixed(4)})`)
  const w = E.outQuint(seg(t, END + 0.2, END + 1.0))
  css($('.end-word'), 'opacity', w.toFixed(3))
  css($('.end-word'), 'transform', `translate3d(0,${((1 - w) * 18).toFixed(1)}px,0)`)
}

function seek(t) {
  t = Math.max(0, Math.min(DUR - 1e-4, t))
  animComposer(t, GEO)
  css($('#feed'), 'transform', `translate3d(0,${(-scrollAt(t)).toFixed(2)}px,0)`)
  animThread(t)
  animDeepSeek(t)
  animGemini(t)
  animOpus(t)
  animStrava(t)
  animMarks(t)
  animCamera(t)
  animEnd(t)
}

function fitStage() {
  const s = Math.min(innerWidth / 1920, innerHeight / 1080)
  document.documentElement.style.setProperty('--fit', s.toFixed(5))
}

async function main() {
  fitStage()
  addEventListener('resize', fitStage)
  build()
  await document.fonts.ready
  await Promise.all($$('img').map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r)))))
  measure()
  seek(0)
  window.DUR = DUR
  window.seek = seek
  window.AD_READY = true
  const q = new URLSearchParams(location.search)
  if (q.has('render')) return
  if (q.has('t')) return seek(Number(q.get('t')))
  const t0 = performance.now()
  const loop = (now) => {
    seek(((now - t0) / 1000) % DUR)
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
}

main().catch((err) => {
  console.error('ad init failed', err)
  throw err
})

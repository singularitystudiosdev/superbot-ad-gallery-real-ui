// cg1-1004-yt-comment-router-superbot-8386753e
// "Answer the top comments on my latest video and pin the best one", routed through
// DeepSeek V4 Pro -> Blender -> Gemini 3 Pro Image -> ElevenLabs Dubbing -> Claude Opus 5.5 -> YouTube.
//
// Everything inside the superbot window is superbot-desktop's own renderer output: the e2e
// harness played this turn through the real app (truth/drive3.2f6aa232.mjs: stub edge, hidden
// window, holds equal to this film's beats) and every state it passed through was dumped as DOM.
// states/base.html is one of those documents with its scripts removed; states/keys.2f6aa232.json
// holds, per captured state, the app's <main> and the sidebar chat row; states/preview.html is the
// document the app's html card showed live. This file swaps those captured states in on a
// schedule, moves the feed scroll and the camera, and drives what the app animates on its own
// (spinners, the sonar clock, the image reveal, the audio row) from t instead of the wall clock.
// The YouTube layers are youtube.com's own page, rendered headless and edited in place.
//
// window.seek(t) -> Promise draws frame t (deterministic); window.DUR is the cycle length.

const K = 4 / 3 // the 1440x810 window filmed at 1920x1080
const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const lerp = (a, b, k) => a + (b - a) * k
const seg = (t, a, b) => clamp((t - a) / (b - a))
const inOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)
const outCubic = (k) => 1 - Math.pow(1 - k, 3)
const outQuint = (k) => 1 - Math.pow(1 - k, 5)
const mix = (a, b, k) => ({ z: lerp(a.z, b.z, k), cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k) })

function cubicBezier(x1, y1, x2, y2) {
  const bx = (u) => 3 * x1 * u * (1 - u) ** 2 + 3 * x2 * u * u * (1 - u) + u ** 3
  const by = (u) => 3 * y1 * u * (1 - u) ** 2 + 3 * y2 * u * u * (1 - u) + u ** 3
  return (x) => {
    let lo = 0, hi = 1
    for (let i = 0; i < 30; i += 1) { const mid = (lo + hi) / 2; if (bx(mid) < x) lo = mid; else hi = mid }
    return by((lo + hi) / 2)
  }
}

const PROMPT = 'Answer the top comments on my latest video and pin the best one'

// ---------------------------------------------------------------- the schedule
const T_OPEN1 = 1.5 // the cold open: the comments nobody has answered yet
const T_TYPE0 = 1.55, T_TYPE1 = 2.6, T_SEND = 2.75, T_LIVE = 2.85
// captured live states (truth/s5/<id>-live.html) and how long each holds: the same lengths the
// stub held them for, so the app's own clock ("Replying · 9s") is real time
const LIVE = [['03', 0.45], ['04', 0.38], ['05', 0.38], ['06', 0.38], ['07', 0.15], ['08', 0.4], ['10', 0.38], ['11', 0.38],
  ['13', 0.38], ['14', 0.15], ['15', 0.4], ['16', 0.4], ['17', 0.35], ['18', 0.15], ['19', 0.4], ['20', 0.3], ['21', 0.15],
  ['22', 0.4], ['23', 0.25], ['24', 0.25], ['25', 0.15], ['26', 0.4], ['28', 0.36], ['29', 0.36], ['30', 0.36], ['31', 0.36], ['32', 0.3]]
let acc = T_LIVE
const LIVE_AT = LIVE.map(([id, d]) => { const k = { id, t0: acc, t1: acc + d }; acc += d; return k })
const T_ANSWER = acc
const T_LAND = 0.3 // the answer replaces the live block
// the answer, one beat per switch: DeepSeek, Blender, Gemini, ElevenLabs, Opus, YouTube [id, seconds, zoom]
const BEATS = [['ds', 3.3, 1.62], ['bl', 2.8, 1.5], ['gm', 2.4, 1.55], ['el', 3.9, 1.7], ['op', 3.6, 1.45], ['yt', 2.3, 1.6]]
const BEAT_AT = BEATS.map(([id, d, z]) => { const b = { id, z, t0: acc, t1: acc + d }; acc += d; return b })
const T_YT = acc
const YT_DUR = 4.6
const T_END = T_YT + YT_DUR
const END_DUR = 3.0
const DUR = T_END + END_DUR
window.DUR = DUR
const EL = BEAT_AT[3]
const OP = BEAT_AT[4]
const T_PLAY = EL.t0 + 0.6
const T_PLAY_END = T_PLAY + 3.3 // the dub's first sentence
const T_VIEW_CODE = OP.t0 + 2.35
window.AD_CUES = { T_OPEN1, T_TYPE0, T_TYPE1, T_SEND, T_LIVE, T_ANSWER, T_PLAY, T_PLAY_END, T_VIEW_CODE, T_YT, T_END, DUR, live: LIVE_AT, beats: BEAT_AT }

// ---------------------------------------------------------------- boot
const stage = $('#stage')
const cam = $('#cam')
const fNew = $('#f-new')
const fLive = $('#f-live')
const fAns = $('#f-ans')
const loaded = (frame) => new Promise((resolve) => {
  if (frame.contentDocument && frame.contentDocument.readyState === 'complete' && frame.contentDocument.querySelector('main')) resolve()
  else frame.addEventListener('load', () => resolve(), { once: true })
})
const [DATA] = await Promise.all([
  fetch(new URL('./states/keys.2f6aa232.json', import.meta.url)).then((r) => r.json()),
  loaded(fNew), loaded(fLive), loaded(fAns)
])
const newDoc = fNew.contentDocument
const liveDoc = fLive.contentDocument
const ansDoc = fAns.contentDocument
for (const doc of [newDoc, liveDoc, ansDoc]) {
  const style = doc.createElement('style')
  // transitions would run on the wall clock; this film drives every change from t
  style.textContent = '*,*::before,*::after{transition:none!important}::-webkit-scrollbar{display:none}html,body{overflow:hidden}'
  doc.head.appendChild(style)
}
await Promise.all([newDoc.fonts.ready, liveDoc.fonts.ready, ansDoc.fonts.ready])

// an element's identity across captured states: its path from <main> (tag, testid/slot, index)
function pathOf(el, root) {
  const parts = []
  for (let e = el; e && e !== root && e.parentElement; e = e.parentElement) {
    const tag = e.tagName
    const sib = [...e.parentElement.children].filter((c) => c.tagName === tag)
    parts.push(`${tag}${e.dataset && (e.dataset.testid || e.dataset.slot) ? '[' + (e.dataset.testid || e.dataset.slot) + ']' : ''}:${sib.indexOf(e)}`)
  }
  return parts.reverse().join('/')
}
const parser = new DOMParser()
const pathsOf = (html) => {
  const doc = parser.parseFromString(html, 'text/html')
  const main = doc.querySelector('main')
  return new Set([main, ...$$('*', main)].map((e) => pathOf(e, main)))
}
const KEY = Object.fromEntries(DATA.keys.map((k) => [k.id, k]))
const PREV = {}
LIVE_AT.forEach((k, i) => { PREV[k.id] = pathsOf(i ? KEY[LIVE_AT[i - 1].id].main : DATA.typed.main) })
PREV.answer = pathsOf(KEY['32'].main)
PREV.viewcode = pathsOf(DATA.answer.main)

async function decodeAll(root) {
  const imgs = $$('img', root)
  for (const img of imgs) if (img.loading === 'lazy') img.loading = 'eager'
  const settle = (img) => (img.complete && img.naturalWidth ? Promise.resolve() : Promise.race([img.decode().catch(() => undefined), new Promise((r) => setTimeout(r, 1500))]))
  await Promise.all(imgs.map(settle))
}
async function frameReady(root) {
  const frames = $$('iframe', root)
  await Promise.all(frames.map((f) => new Promise((resolve) => {
    if (f.contentDocument && f.contentDocument.readyState === 'complete' && f.contentDocument.body && f.contentDocument.body.childElementCount) resolve()
    else { f.addEventListener('load', () => resolve(), { once: true }); setTimeout(resolve, 3000) }
  })))
}

// ---------------------------------------------------------------- the three documents
const swapState = {}
async function setMain(doc, key, rec) {
  if (swapState[key] === rec) return false
  $('main.hub-main', doc).outerHTML = rec.main
  const btn = $$('[data-testid="chat-row"]', doc).find((b) => /Answer the top/.test(b.textContent))
  if (btn && rec.row) btn.parentElement.parentElement.outerHTML = rec.row
  swapState[key] = rec
  await decodeAll(doc)
  await frameReady(doc)
  return true
}

// every CSS animation the app runs, held at t: loops run on t; an entrance plays from the moment
// its element first appears, and is finished for an element the previous state already had
function holdAnimations(doc, t, bornAt, prevPaths) {
  const main = $('main.hub-main', doc)
  for (const a of doc.getAnimations()) {
    try {
      a.pause()
      const timing = a.effect.getComputedTiming()
      const target = a.effect.target
      if (timing.iterations === Infinity) a.currentTime = t * 1000
      else if (prevPaths && main && main.contains(target) && prevPaths.has(pathOf(target, main))) a.currentTime = timing.endTime
      else a.currentTime = Math.max(0, (t - bornAt) * 1000)
    } catch (error) {
      console.error('[ad] animation hold failed', error)
    }
  }
}

const rectIn = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2, b: r.bottom } }
const composerOf = (doc) => rectIn($('[data-testid="composer"]', doc) || $('[data-slot="composer-input-row"]', doc))

// ---------------------------------------------------------------- live phase
const Z_LIVE = 1.85
function liveFeed(t, k, i) {
  const feed = $('[data-testid="feed"]', liveDoc)
  const pinPill = (label) => {
    const pill = $$('[data-testid="provider-switch-pill"]', liveDoc).find((p) => p.textContent.includes(label))
    if (!pill) return false
    const comp = composerOf(liveDoc)
    const viewTop = comp.b + 6 - 1080 / (Z_LIVE * K)
    feed.scrollTop += pill.getBoundingClientRect().top - (viewTop + 28)
    return true
  }
  // Gemini's "Creating image" placeholder is taller than the shot: keep its pill and label in frame
  if (!(['16', '17'].includes(k.id) && pinPill('Gemini 3 Pro Image'))) feed.scrollTop = feed.scrollHeight
  // the sonar clock is the app's own, real time (the stub held these same lengths)
  const n = Math.floor(lerp(Number(KEY[k.id].clock || 0), Number((KEY[(LIVE_AT[i + 1] || k).id].clock) || 0), seg(t, k.t0, k.t1)))
  const clock = $('[data-slot="sonar-clock"]', liveDoc)
  if (clock && clock.lastElementChild) clock.lastElementChild.textContent = `${n}s`
}

// ---------------------------------------------------------------- the answer
const ANCHORS = new Map()
function answerAnchors() {
  const id = swapState.ans === DATA.viewcode ? 'viewcode' : 'answer'
  if (ANCHORS.has(id)) return ANCHORS.get(id)
  const feed = $('[data-testid="feed"]', ansDoc)
  const rows = $$('[data-testid="message-row"]', feed)
  const row = rows[rows.length - 1]
  const prose = $('[data-slot="message-row-prose"] > div', row)
  const kids = [...prose.children]
  const starts = kids.map((k, i) => (k.dataset.testid === 'embed-provider_switch' ? i : -1)).filter((i) => i >= 0)
  const fr = feed.getBoundingClientRect()
  const top = (el) => el.getBoundingClientRect().top - fr.top + feed.scrollTop
  const bottom = (el) => el.getBoundingClientRect().bottom - fr.top + feed.scrollTop
  const maxScroll = feed.scrollHeight - feed.clientHeight
  const groups = starts.map((s, gi) => {
    const beat = BEAT_AT[gi]
    const viewH = Math.min(feed.clientHeight, 1080 / (beat.z * K)) - 24
    const end = gi + 1 < starts.length ? starts[gi + 1] - 1 : kids.length - 1
    const t0 = top(kids[s]) - 84 // under the sticky prompt bar
    const b = gi + 1 < starts.length ? bottom(kids[end]) + 18 : bottom(row) + 14
    return { sStart: clamp(t0, 0, maxScroll), sEnd: clamp(Math.max(t0, b - viewH), 0, maxScroll), els: kids.slice(s, end + 1) }
  })
  const a = { feed, groups, fr: rectIn(feed), prose: rectIn(prose) }
  ANCHORS.set(id, a)
  return a
}
function answerScroll(t) {
  const A = answerAnchors()
  let s = A.groups[0].sStart
  BEAT_AT.forEach((b, i) => {
    const g = A.groups[i]
    if (!g || t < b.t0) return
    const prevEnd = i ? A.groups[i - 1].sEnd : g.sStart
    const move = Math.min(0.5, (b.t1 - b.t0) * 0.25)
    if (t - b.t0 < move) s = lerp(prevEnd, g.sStart, inOut((t - b.t0) / move))
    else s = lerp(g.sStart, g.sEnd, inOut(seg(t, b.t0 + move + 0.35, b.t1 - 0.2)))
  })
  A.feed.scrollTop = s
}

// the image cards' own reveal (opacity 1->0, the reveal scale -> 1 over
// --duration-activity-image-reveal on --ease-standard-decelerate), as each card comes on screen
let REVEAL = null
function revealSpec() {
  if (REVEAL) return REVEAL
  const cs = getComputedStyle(ansDoc.documentElement)
  const ms = (v) => { const s = String(v).trim(); return s.endsWith('ms') ? parseFloat(s) : s.endsWith('s') ? parseFloat(s) * 1000 : 600 }
  const bz = (cs.getPropertyValue('--ease-standard-decelerate').match(/cubic-bezier\(([^)]+)\)/) || [null, '0,0,0,1'])[1].split(',').map(Number)
  REVEAL = { dur: ms(cs.getPropertyValue('--duration-activity-image-reveal')) / 1000, scale: parseFloat(cs.getPropertyValue('--status-activity-image-reveal-scale')) || 1.04, ease: cubicBezier(...bz) }
  return REVEAL
}
function driveReveals(t) {
  const R = revealSpec()
  const A = answerAnchors()
  A.groups.forEach((g, i) => {
    let n = 0
    for (const el of g.els) {
      for (const veil of $$('[data-slot="media-reveal"]', el)) {
        const start = BEAT_AT[i].t0 + 0.35 + n * 1.0
        n += 1
        const p = R.ease(seg(t, start, start + R.dur))
        veil.style.opacity = String(1 - p)
        veil.style.transform = `scale(${lerp(R.scale, 1, p)})`
        veil.dataset.state = p >= 1 ? 'gone' : p > 0 ? 'revealing' : 'held'
      }
    }
  })
}

// the dub's audio row (audio-row.tsx): playing state, pause glyph, played mask, elapsed clock
const DUB_S = 9.66
function driveAudio(t) {
  const row = $('[data-slot="audio-row"]', ansDoc)
  if (!row) return
  const elapsed = clamp(t - T_PLAY, 0, T_PLAY_END - T_PLAY)
  const playing = t >= T_PLAY && t < T_PLAY_END
  row.dataset.state = playing ? 'playing' : 'paused'
  const btn = $('[data-slot="audio-row-play"]', row)
  const svg = $('svg', btn)
  if (playing !== svg.classList.contains('lucide-pause')) {
    svg.innerHTML = playing ? '<rect x="14" y="3" width="5" height="18" rx="1"></rect><rect x="5" y="3" width="5" height="18" rx="1"></rect>' : '<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path>'
    svg.setAttribute('class', svg.getAttribute('class').replace(playing ? 'lucide-play' : 'lucide-pause', playing ? 'lucide-pause' : 'lucide-play'))
    btn.setAttribute('aria-pressed', String(playing))
  }
  const hidden = (1 - elapsed / DUB_S) * 100
  const clip = $('[data-slot="audio-row-played"]', row)
  if (clip) {
    clip.style.transform = `translateX(-${hidden}%)`
    if (clip.firstElementChild) clip.firstElementChild.style.transform = `translateX(${hidden}%)`
  }
  const dur = $('[data-slot="audio-row-duration"]', row)
  if (dur) dur.textContent = t >= T_PLAY ? `0:${String(Math.floor(elapsed)).padStart(2, '0')}` : '0:09'
}

// ---------------------------------------------------------------- typing
let caret = null
function driveTyping(t) {
  const input = $('[data-testid="composer-input"]', newDoc)
  if (!input) return
  const n = Math.round(PROMPT.length * lerp(0.35, 1, seg(t, T_TYPE0, T_TYPE1)))
  if (input.dataset.n !== String(n)) {
    input.textContent = PROMPT.slice(0, n)
    caret = newDoc.createElement('span')
    caret.style.cssText = 'display:inline-block;width:2px;height:1.15em;margin-left:1px;vertical-align:text-bottom;background:currentColor'
    input.appendChild(caret)
    input.dataset.n = String(n)
  }
  caret.style.opacity = t <= T_TYPE1 + 0.05 || Math.floor(t * 2.2) % 2 === 0 ? '1' : '0'
  const send = $('[data-testid="composer-send"]', newDoc)
  if (send) send.style.transform = t > T_SEND - 0.1 ? 'scale(0.9)' : ''
}

// ---------------------------------------------------------------- camera (stage px of the 1920x1080 window)
function camAt(t) {
  const c0 = composerOf(newDoc)
  const typing = { z: 1.5, cx: c0.cx * K, cy: (c0.cy - 40) * K }
  if (t < T_SEND + 0.05) return mix({ ...typing, z: 1.62 }, typing, outCubic(seg(t, T_OPEN1, T_TYPE1)))
  const comp = composerOf(liveDoc)
  const proseCx = 840 * K
  const live = { z: Z_LIVE, cx: proseCx, cy: (comp.b + 6) * K - 540 / Z_LIVE }
  if (t < T_ANSWER) return mix(typing, live, inOut(seg(t, T_SEND, T_LIVE + 0.55)))
  const A = answerAnchors()
  const frameFor = (b) => ({ z: b.z, cx: A.prose.cx * K, cy: (A.fr.y + Math.min(A.fr.h, 1080 / (b.z * K)) / 2 + 6) * K })
  let v = mix(live, frameFor(BEAT_AT[0]), inOut(seg(t, T_ANSWER, T_ANSWER + 0.55)))
  BEAT_AT.forEach((b, i) => { if (i && t >= b.t0) v = mix(frameFor(BEAT_AT[i - 1]), frameFor(b), inOut(seg(t, b.t0, b.t0 + 0.5))) })
  return v
}
const toStage = (c, x, y) => ({ x: 960 + (x * K - c.cx) * c.z, y: 540 + (y * K - c.cy) * c.z })
function applyCam(c) {
  cam.style.transform = `translate(${(960 - c.cx * c.z).toFixed(2)}px, ${(540 - c.cy * c.z).toFixed(2)}px) scale(${c.z.toFixed(4)})`
}

// ---------------------------------------------------------------- the cursor: play on the dub, View code on the page
const cursor = $('#cursor')
const PRESSES = [
  { at: T_PLAY, from: EL.t0 + 0.05, until: T_PLAY + 0.9, target: () => $('[data-slot="audio-row-play"]', ansDoc) },
  { at: T_VIEW_CODE, from: T_VIEW_CODE - 0.75, until: T_VIEW_CODE + 0.6, target: () => $$('button', ansDoc).find((b) => ['View code', 'Preview'].includes((b.getAttribute('aria-label') || b.textContent).trim())) }
]
function driveCursor(t, c) {
  const p = PRESSES.find((x) => t >= x.from && t <= x.until)
  if (!p || t < T_ANSWER) { cursor.style.opacity = '0'; return }
  const el = p.target()
  if (!el) { cursor.style.opacity = '0'; return }
  const r = rectIn(el)
  const endPt = toStage(c, r.cx + 2, r.cy + 3)
  const start = { x: endPt.x + 380, y: endPt.y + 240 }
  const k = outCubic(seg(t, p.from, p.at - 0.1))
  const press = t > p.at - 0.08 && t < p.at + 0.08 ? 0.86 : 1
  cursor.style.opacity = String(seg(t, p.from, p.from + 0.15) * (1 - seg(t, p.until - 0.25, p.until)))
  cursor.style.transform = `translate(${(lerp(start.x, endPt.x, k) - 4).toFixed(1)}px, ${(lerp(start.y, endPt.y, k) - 2.5).toFixed(1)}px) scale(${press})`
}

// ---------------------------------------------------------------- YouTube (1280-wide page shot at 3x, shown at 1.5 stage px per css px)
const ytOpen = $('#yt-open')
const ytOpenCam = $('#yt-open-cam')
const yt = $('#yt')
const ytCam = $('#yt-cam')
const ytMast = $('#yt-mast')
const flash = $('#flash')
const S = 1.5
const ytTransform = (v) => `translate(${(960 - v.cx * S * v.z).toFixed(2)}px, ${(540 - v.cy * S * v.z).toFixed(2)}px) scale(${v.z.toFixed(4)})`
function driveOpen(t) {
  ytOpen.style.opacity = t < T_OPEN1 ? '1' : String(1 - seg(t, T_OPEN1, T_OPEN1 + 0.12))
  if (t > T_OPEN1 + 0.12) return
  // the comments as they were: 1,284 of them, the top one asking where to buy, nobody answered
  ytOpenCam.style.transform = ytTransform(mix({ z: 1.3, cx: 420, cy: 290 }, { z: 1.5, cx: 400, cy: 252 }, inOut(seg(t, 0, T_OPEN1))))
}
function driveYouTube(t) {
  const lt = t - T_YT
  yt.style.opacity = String(seg(lt, -0.1, 0.05))
  flash.style.opacity = String(Math.max(0, 1 - Math.abs(lt) / 0.16) * 0.55)
  if (lt < -0.1) return
  // the watch page, then the pinned thread and Sam's reply, then Lucía's answer in Spanish
  const top = { z: 1.22, cx: 520, cy: 330 }
  const pinned = { z: 1.48, cx: 470, cy: 1035 }
  const lucia = { z: 1.48, cx: 470, cy: 1305 }
  let v = top
  if (lt > 0.6) v = mix(top, pinned, inOut(seg(lt, 0.6, 1.4)))
  if (lt > 3.4) v = mix(pinned, lucia, inOut(seg(lt, 3.4, 3.9)))
  const push = lerp(1.04, 1, outCubic(seg(lt, 0, 0.6)))
  const vz = { ...v, z: v.z * push }
  ytCam.style.transform = ytTransform(vz)
  // YouTube's masthead is sticky: it stays at the top of the viewport whatever the scroll
  const viewTop = Math.max(0, vz.cy - 540 / (S * vz.z))
  ytMast.style.transform = `translateY(${(viewTop * S).toFixed(2)}px)`
}

// ---------------------------------------------------------------- end card (the source spot's lock-up + the line)
function makeMark(size) {
  const host = document.createElement('span')
  host.style.cssText = `display:grid;place-items:center;width:${size}px;height:${size}px`
  if (typeof window.sbMarkLive !== 'function') return { el: host, render() {} }
  const tmp = document.createElement('div')
  tmp.style.cssText = 'position:absolute;left:-9999px;top:0'
  document.body.appendChild(tmp)
  const live = window.sbMarkLive(tmp, { size, interactive: false })
  const wrap = live.wrap.cloneNode(true)
  live.destroy()
  tmp.remove()
  host.appendChild(wrap)
  const eyes = $$('.mark-eye', wrap)
  const baseRy = eyes.map((e) => e.getAttribute('ry'))
  return {
    el: host,
    render(t) {
      for (const a of wrap.getAnimations({ subtree: true })) { a.pause(); a.currentTime = Math.max(0, t) * 1000 }
      const k = Math.floor(t / 3.6), ph = t - k * 3.6
      const shut = ph > 2.2 && ph < 2.32
      eyes.forEach((e, i) => e.setAttribute('ry', shut && !(k % 3 === 2 && i === 0) ? '1' : baseRy[i]))
    }
  }
}
const end = $('#s-end')
const mark = makeMark(200)
$('.face', end).appendChild(mark.el)
const slide = $('.end-slide', end)
const line = $('.end-line', end)
function driveEnd(t) {
  const lt = t - T_END
  end.style.opacity = String(seg(lt, -0.22, 0.05))
  if (lt < -0.22) return
  const f = seg(lt, 0, 0.45)
  mark.el.style.opacity = String(f)
  mark.el.style.transform = `scale(${lerp(0.5, 1, outQuint(f)).toFixed(4)})`
  const w = seg(lt, 0.2, 0.85)
  slide.style.transform = `translateX(${((1 - outQuint(w)) * 110).toFixed(2)}%)`
  slide.style.opacity = String(w)
  const l = seg(lt, 0.7, 1.2)
  line.style.opacity = String(l)
  line.style.transform = `translateY(${((1 - outCubic(l)) * 14).toFixed(2)}px)`
  mark.render(Math.max(0, lt))
}

// ---------------------------------------------------------------- seek
async function seek(tIn) {
  const t = ((tIn % DUR) + DUR) % DUR
  const show = (f, on) => { f.style.visibility = on ? 'visible' : 'hidden' }
  if (t < T_SEND + 0.1) {
    show(fNew, true); show(fLive, false); show(fAns, false); fAns.style.opacity = '0'
    await setMain(newDoc, 'new', DATA.typed)
    driveTyping(t)
    holdAnimations(newDoc, t, 0, null)
  } else if (t < T_ANSWER + T_LAND) {
    show(fNew, false); show(fLive, true)
    const i = Math.max(0, LIVE_AT.findIndex((k) => t < k.t1))
    const k = t < T_ANSWER ? LIVE_AT[i] : LIVE_AT[LIVE_AT.length - 1]
    await setMain(liveDoc, 'live', KEY[k.id])
    liveFeed(Math.min(t, k.t1 - 0.001), k, LIVE_AT.indexOf(k))
    holdAnimations(liveDoc, t, k.t0, PREV[k.id])
    // the landed answer fades in over the live block
    const land = seg(t, T_ANSWER, T_ANSWER + T_LAND)
    show(fAns, land > 0); fAns.style.opacity = String(land)
    if (land > 0) {
      await setMain(ansDoc, 'ans', DATA.answer)
      answerScroll(t)
      driveReveals(t)
      driveAudio(t)
      holdAnimations(ansDoc, t, T_ANSWER, PREV.answer)
    }
  } else {
    show(fNew, false); show(fLive, false); show(fAns, true); fAns.style.opacity = '1'
    const viewCode = t >= T_VIEW_CODE && t < T_YT + 1
    await setMain(ansDoc, 'ans', viewCode ? DATA.viewcode : DATA.answer)
    answerScroll(t)
    driveReveals(t)
    driveAudio(t)
    holdAnimations(ansDoc, t, viewCode ? T_VIEW_CODE : T_ANSWER, viewCode ? PREV.viewcode : PREV.answer)
  }
  const c = camAt(t)
  applyCam(c)
  driveCursor(t, c)
  driveOpen(t)
  driveYouTube(t)
  driveEnd(t)
}
window.seek = seek

// ---------------------------------------------------------------- fit + preview playback
function fit() {
  const s = Math.min(innerWidth / 1920, innerHeight / 1080)
  stage.style.transform = `translate(-50%, -50%) scale(${s})`
}
const RENDER = new URLSearchParams(location.search).has('render')
if (RENDER) {
  stage.style.transform = 'translate(-50%, -50%)'
  await seek(0)
  window.AD_READY = true
} else {
  fit()
  addEventListener('resize', fit)
  const t0 = performance.now()
  let busy = false
  const tick = async () => {
    if (!busy) {
      busy = true
      try { await seek((performance.now() - t0) / 1000) } catch (error) { console.error('[ad] seek failed', error) }
      busy = false
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

// Strava on the web, driven by superbot: Route Builder (strava.com/maps/create) draws the week 9
// long run, Save opens the save dialog, then My Routes (strava.com/athlete/routes) shows all 12.
// Layout follows Strava's own help-centre screenshots of both pages.
import { T, E, seg, lerp, css, show, rise, typeText, count, el, $, $$ } from './core.a6734000.js'
import { basemap, peakRoute, ptsToD, thumb, elevation, HOME } from './map.a6734000.js'

const LONG = [6, 7, 8, 6, 9, 10, 11, 8, 12, 12, 8, 13.1]
const ELEV = [160, 175, 210, 160, 260, 290, 330, 205, 413, 413, 205, 446]
const SAVED_BEFORE = 8 // weeks 1 to 8 are already saved when the builder opens on week 9
const sunday = (w) => new Date(Date.UTC(2026, 9, 11 + w * 7)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const routeName = (w) => `HM Wk ${w + 1} · Sun ${sunday(w)} · ${w === 11 ? 'Race Day' : 'Long Run'}`
const NAME = routeName(8)
const DESC = 'Week 9 of 12, peak week. Tue Dec 1: 6 mi easy @ 10:15. Thu Dec 3: 8 mi tempo @ 8:25. Sat Dec 5: 6 mi easy. Sun Dec 6: this route, 12 mi long @ 10:20.'
const WAY = ['1420 Lakeview Ave', 'Lakeside Park Trail', 'Mirror Lake, east shore', 'Harbor Blvd & Elm St', '1420 Lakeview Ave']
const MI_UNITS = 191 // world units per mile, the map's scale

const ICON = {
  shoe: '<svg viewBox="0 0 24 24"><path d="M3 15.5c0-2 1-6 2-8l3 1 1.5 2.5L13 12l5 1.2c2 .5 3 1.6 3 3.3H3.6M3 15.5V18h18v-1.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  elev: '<svg viewBox="0 0 24 24"><path d="m2 19 7-11 4 6 3-4 6 9z"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
  pop: '<svg viewBox="0 0 24 24"><path d="M4 18c3-1 4-5 7-6s5 2 9-4M4 13c2-1 3-3 5-3"/></svg>',
  chev: '<svg class="rb-chev" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
}

const TOOL = {
  heat: '<svg viewBox="0 0 24 24"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2.2-4.7.2 1.6.9 2.7 1.8 3.2C11 8.5 11.3 5.6 12 3z"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></svg>',
  rev: '<svg viewBox="0 0 24 24"><path d="M4 8h14l-3-3M20 16H6l3 3"/></svg>',
  undo: '<svg viewBox="0 0 24 24"><path d="M9 7 4 11l5 4M4 11h10a5 5 0 0 1 0 10h-3"/></svg>',
  redo: '<svg viewBox="0 0 24 24"><path d="m15 7 5 4-5 4M20 11H10a5 5 0 0 0 0 10h3"/></svg>',
  bin: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13"/></svg>',
}

const hm = (mi) => {
  const min = Math.round(mi * 10.333)
  return `${Math.floor(min / 60)}h ${min % 60}m`
}

function wpRow(w, i) {
  const last = i === WAY.length - 1
  const ic = i === 0 ? '<i class="wp-start"></i>' : last ? '<i class="wp-end"></i>' : `<i class="wp-n">${i}</i>`
  const lab = i === 0 ? 'Start' : last ? 'End' : ''
  return `<div class="rb-wp" data-i="${i}">${ic}<span class="rb-in">${lab ? `<em>${lab}</em>` : ''}${w}</span><span class="rb-x">⊗</span></div>`
}

function panel() {
  const rows = WAY.map(wpRow)
  const hide = `<div class="rb-hide">Hide waypoints <svg viewBox="0 0 24 24"><path d="m7 14 5-5 5 5"/></svg></div>`
  const pref = (icon, label) => `<div class="rb-row">${icon}<span>${label}</span>${ICON.chev}</div>`
  return `<aside class="rb-panel">
    <div class="rb-brand"><img src="brand/strava-wordmark.svg" alt="Strava"><span>Routes</span><i class="rb-help">?</i></div>
    <div class="rb-crumb"><u>My Routes</u> / New</div>
    <div class="rb-title"><span>←</span>Build your route</div>
    ${rows[0]}${hide}${rows.slice(1).join('')}
    <div class="rb-add">⊕ Add waypoint</div>
    <div class="rb-pref"><b>Routing preferences</b>
      ${pref(ICON.shoe, 'Run')}${pref(ICON.pop, 'Follow most popular')}${pref(ICON.elev, 'Any elevation')}
    </div>
  </aside>`
}

// Fraction of the drawn path at which each waypoint is reached, so its pin lands as the line arrives.
function pinFractions(pts, way) {
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  const total = cum[cum.length - 1]
  return way.map(([x, y]) => {
    let best = 0
    let bd = 1e9
    pts.forEach(([px, py], i) => {
      const d = Math.hypot(px - x, py - y)
      if (d < bd - 0.5) {
        bd = d
        best = i
      }
    })
    return cum[best] / total
  })
}

function builder() {
  const { pts, way } = peakRoute()
  const d = ptsToD(pts)
  const frac = pinFractions(pts, way)
  const ev = elevation()
  const max = Math.max(...ev)
  const area = ev.map((v, i) => `${i ? 'L' : 'M'}${((i / (ev.length - 1)) * 520).toFixed(1)} ${(64 - (v / max) * 56).toFixed(1)}`).join('') + 'L520 64L0 64Z'
  return `<div class="sv-rb">${panel()}
    <div class="rb-map">
      <div class="rb-zoom"><svg class="map" viewBox="0 25 1000 640" preserveAspectRatio="xMidYMid slice">
        <defs><pattern id="chk" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#fff"/><rect width="3" height="3" fill="#222"/><rect x="3" y="3" width="3" height="3" fill="#222"/></pattern></defs>${basemap(true)}
        <path d="${d}" class="m-route-cas" pathLength="1"/><path d="${d}" class="m-route rb-line" pathLength="1"/>
        ${way.map(([x, y], i) => `<g transform="translate(${x} ${y})"><g class="rb-pin" data-f="${frac[i].toFixed(4)}"><circle r="13"/><text y="5">${i + 1}</text></g></g>`).join('')}
        <g class="rb-home" transform="translate(${HOME[0]} ${HOME[1]})"><rect x="7" y="-26" width="16" height="16" class="flag"/><circle r="10" class="m-start"/></g>
      </svg></div>
      <div class="rb-tools"><span class="rb-ti">${TOOL.heat}</span><i class="rb-sep"></i><span class="rb-ti">${TOOL.up}</span><span class="rb-ti">${TOOL.rev}</span><span class="rb-ti">${TOOL.undo}</span><span class="rb-ti">${TOOL.redo}</span><span class="rb-ti">${TOOL.bin}</span><span class="rb-save">Save</span></div>
      <div class="rb-zctl"><span>+</span><span>−</span></div>
      <div class="rb-scale"><span>0.5 mi</span><i></i></div>
      <div class="rb-drawer">
        <div class="rb-st"><div><b class="rb-dist">0.00</b><em>mi</em><span>Distance</span></div><div><b class="rb-gain">0</b><em>ft</em><span>Elevation Gain</span></div><div><b class="rb-time">0:00:00</b><span>Est. Moving Time</span></div></div>
        <svg class="rb-elev" viewBox="0 0 520 64" preserveAspectRatio="none"><path d="${area}"/></svg>
      </div>
    </div>
  </div>`
}

function saveModal() {
  return `<div class="svm"><div class="svm-card">
    <div class="svm-h"><b>Save</b><span>×</span></div>
    <label>Route Name</label><div class="svm-in"><span class="svm-name"></span></div>
    <label>Description</label><div class="svm-in ta"><span class="svm-desc"></span><span class="svm-ghost">${DESC}</span></div>
    <div class="svm-vis"><span>Make Private</span><i class="tg on"></i><em>Only you can see this route</em></div>
    <div class="svm-btns"><span class="svm-cancel">Cancel</span><span class="svm-ok">Save to My Routes</span></div>
  </div></div>`
}

function myRoutes() {
  const cards = LONG.map(
    (mi, i) => `<div class="mr-card${i === SAVED_BEFORE ? ' new' : ''}" data-i="${i}">${thumb(mi, i, 4.5)}
      <div class="mr-b"><div class="mr-top"><span>October 5, 2026</span><i class="mr-star">${ICON.star}</i><i class="mr-more">•••</i></div>
      <div class="mr-name">${routeName(i)}</div>
      <div class="mr-stats"><span>${ICON.shoe}${mi.toFixed(1)} mi</span><span>${ICON.clock}${hm(mi)}</span><span>${ICON.elev}${ELEV[i]} ft</span></div></div>
    </div>`,
  ).join('')
  return `<div class="sv-mr">
    <div class="sv-hdr"><img src="brand/strava-wordmark.svg" alt="Strava"><span class="sv-srch"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg></span>
      <nav><span>Dashboard ▾</span><span>Training ▾</span><span class="on">Maps ▾</span><span>Challenges</span></nav>
      <span class="sv-sp"></span><span class="sv-bell"><svg viewBox="0 0 24 24"><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 1.5h-15zM10 20.5h4"/></svg></span><span class="sv-av"></span><span class="sv-plus">+</span></div>
    <div class="mr-head"><h2>My Routes</h2><span class="mr-new">Create New Route</span></div>
    <div class="mr-filt"><span class="rb-seg"><span>Ride</span><span class="on">Run</span></span><span class="mr-chip">Distance ▾</span><span class="mr-chip">Elevation ▾</span><span class="mr-chip">Surface ▾</span><span class="mr-cnt"><b class="mr-n">8</b> routes</span></div>
    <div class="mr-grid">${cards}</div>
  </div>`
}

export function buildStrava() {
  return el(`<div class="blk" id="b-sv"><div class="br">
    <div class="br-bar"><span class="br-dots"><i></i><i></i><i></i></span><span class="br-nav">‹ ›</span>
      <span class="br-url"><svg viewBox="0 0 24 24"><rect x="6" y="11" width="12" height="9" rx="2"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/></svg><span class="br-u">strava.com/maps/create</span></span>
      <span class="br-agent"><span class="tile sb mini"><span class="sbm"></span></span>superbot is saving routes <b><span class="br-k">8</span> of 12</b></span></div>
    <div class="br-page">${builder()}${myRoutes()}${saveModal()}
      <svg class="cur" viewBox="0 0 24 24"><path d="M5 3l14 8.2-6.3 1.4 3.7 6.6-2.6 1.4-3.7-6.6L5 18.5z"/></svg><i class="cur-ring"></i>
    </div>
  </div></div>`)
}

let POS = null

export function measureStrava() {
  const page = $('#b-sv .br-page')
  const pr = page.getBoundingClientRect()
  const at = (sel) => {
    const r = $(sel, page).getBoundingClientRect()
    return [r.left - pr.left + r.width * 0.55, r.top - pr.top + r.height * 0.6]
  }
  const map = $('.rb-map', page).getBoundingClientRect()
  const pxPerUnit = Math.max(map.width / 1000, map.height / 640)
  css($('.rb-scale i', page), 'width', `${((MI_UNITS / 2) * pxPerUnit).toFixed(1)}px`)
  POS = { mapC: [pr.width * 0.62, pr.height * 0.45], save: at('.rb-save'), ok: at('.svm-ok') }
}

// Modal beats relative to T.svSave: dialog in, name, description, then the Save to My Routes press.
const M = { in: 0.1, name: [0.2, 0.5], desc: [0.45, 1.25], toOk: [1.1, 1.45], press: 1.55, out: [1.62, 1.78] }

function animCursor(t, page) {
  const a = T.svSave
  const cur = $('.cur', page)
  const m1 = E.inOut(seg(t, a - 0.45, a - 0.05))
  let p = [lerp(POS.mapC[0], POS.save[0], m1), lerp(POS.mapC[1], POS.save[1], m1)]
  const m2 = E.inOut(seg(t, a + M.toOk[0], a + M.toOk[1]))
  p = [lerp(p[0], POS.ok[0], m2), lerp(p[1], POS.ok[1], m2)]
  show(cur, seg(t, a - 0.65, a - 0.45) * (1 - seg(t, T.svRoutes - 0.1, T.svRoutes + 0.05)))
  const press = Math.sin(seg(t, a, a + 0.14) * Math.PI) + Math.sin(seg(t, a + M.press, a + M.press + 0.14) * Math.PI)
  css(cur, 'transform', `translate3d(${p[0].toFixed(1)}px,${p[1].toFixed(1)}px,0) scale(${(1 - press * 0.14).toFixed(3)})`)
  const ring = $('.cur-ring', page)
  const r1 = seg(t, a, a + 0.4)
  const r2 = seg(t, a + M.press, a + M.press + 0.4)
  const first = r1 > 0 && r1 < 1
  const r = first ? r1 : r2
  const rp = first ? POS.save : POS.ok
  show(ring, r > 0 && r < 1 ? 1 - r : 0)
  css(ring, 'transform', `translate3d(${rp[0].toFixed(1)}px,${rp[1].toFixed(1)}px,0) scale(${(0.3 + r * 1.1).toFixed(3)})`)
}

function animBuilder(t, root) {
  const a = T.sv
  $$('.rb-wp', root).forEach((w, i) => rise(w, t, a + 0.2 + i * 0.07, 0.4, 6))
  const draw = E.inOutSine(seg(t, a + 0.45, a + 1.6))
  for (const l of $$('.rb-map path[pathLength]', root)) css(l, 'stroke-dashoffset', (1 - draw).toFixed(4))
  for (const g of $$('.rb-pin', root)) {
    const q = E.outBack(clamp01((draw - Number(g.dataset.f) + 0.01) / 0.07))
    css(g, 'opacity', Math.min(1, q * 1.6).toFixed(3))
    css(g, 'transform', `scale(${q.toFixed(3)})`)
  }
  // stats track the drawn line exactly (count() would ease a second time and run ahead of it)
  const at = (v) => [v * draw, v * draw, 1]
  count($('.rb-dist', root), ...at(12.02), (v) => v.toFixed(2))
  count($('.rb-gain', root), ...at(413))
  count($('.rb-time', root), ...at(124.2), (v) => `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}:${String(Math.floor((v % 1) * 60)).padStart(2, '0')}`)
  css($('.rb-elev', root), 'clip-path', `inset(0 ${((1 - draw) * 100).toFixed(2)}% 0 0)`)
  css($('.rb-zoom', root), 'transform', `scale(${lerp(1.05, 1, E.out(seg(t, a, a + 2.0))).toFixed(4)})`)
}

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x)

function animModal(t, root) {
  const a = T.svSave
  const m = $('.svm', root)
  const inn = E.out(seg(t, a + M.in, a + M.in + 0.25))
  const out = E.inOut(seg(t, a + M.out[0], a + M.out[1]))
  show(m, inn * (1 - out))
  css($('.svm-card', m), 'transform', `translate3d(0,${((1 - inn) * 14 + out * -8).toFixed(1)}px,0) scale(${lerp(0.97, 1, inn).toFixed(4)})`)
  typeText($('.svm-name', m), NAME, seg(t, a + M.name[0], a + M.name[1]))
  typeText($('.svm-desc', m), DESC, seg(t, a + M.desc[0], a + M.desc[1]))
  $('.svm-ok', m).classList.toggle('press', t > a + M.press && t < a + M.press + 0.16)
}

// My Routes: weeks 1-8 are already there, week 9 lands with a ring, 10-12 follow; both counters tick with them.
function animRoutes(t, root) {
  const f = T.svRoutes
  const flip = E.inOut(seg(t, f, f + 0.3))
  show($('.sv-rb', root), flip >= 1 ? 0 : 1)
  show($('.sv-mr', root), flip)
  const appear = (i) => (i < SAVED_BEFORE ? -1 : f + 0.15 + (i - SAVED_BEFORE) * 0.2)
  let n = t < T.svSave + M.press ? SAVED_BEFORE : SAVED_BEFORE + 1
  $$('.mr-card', root).forEach((c, i) => {
    const s = appear(i)
    if (s < 0) return
    rise(c, t, s, 0.5, 14, 0.94)
    if (i > SAVED_BEFORE && t >= s) n = Math.max(n, i + 1)
  })
  const ring = $('.mr-card.new', root)
  css(ring, '--ring', (Math.sin(seg(t, f + 0.15, f + 1.6) * Math.PI) * 1).toFixed(3))
  for (const k of [$('.br-k', root), $('.mr-n', root)]) if (k.textContent !== String(n)) k.textContent = String(n)
  const u = $('.br-u', root)
  const url = t < f ? 'strava.com/maps/create' : 'strava.com/athlete/routes'
  if (u.textContent !== url) u.textContent = url
}

export function animStrava(t) {
  const root = $('#b-sv')
  rise(root, t, T.sv, 0.6, 18, 0.98)
  animBuilder(t, root)
  animModal(t, root)
  animRoutes(t, root)
  animCursor(t, $('.br-page', root))
}

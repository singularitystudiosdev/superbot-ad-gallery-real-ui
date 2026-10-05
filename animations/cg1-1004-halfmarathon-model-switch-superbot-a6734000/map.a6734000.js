// One hand-built neighbourhood (1000 x 640 world units) in the look of Strava's light basemap:
// pale land, white streets with soft casing, green parks, blue water, grey caps labels.
// Every route in the spot is a loop from the same home corner, so the thumbnails agree.
import { rng } from './core.a6734000.js'

export const HOME = [300, 400]
const LAKE = { cx: 640, cy: 290 }
const UNITS_PER_MI = 191

function ellipsePts(cx, cy, rx, ry, a0, n = 56) {
  const pts = []
  for (let i = 0; i <= n; i++) {
    const a = a0 + (i / n) * Math.PI * 2
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry])
  }
  return pts
}

function blob(cx, cy, rx, ry, wob, n = 40) {
  let d = ''
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    const k = 1 + wob * Math.sin(a * 3 + 0.7) + wob * 0.6 * Math.cos(a * 5 + 1.3)
    const x = cx + Math.cos(a) * rx * k
    const y = cy + Math.sin(a) * ry * k
    d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return d + 'Z'
}

const MAJOR = { x: new Set([150, 450, 850]), y: new Set([100, 400, 550]) }
const ALWAYS = { x: new Set([300]), y: new Set([500]) } // the home streets every loop starts on

// Minor streets drop random block-length segments so blocks vary in size like a real street map.
function minorLines(axis, rand) {
  const [c0, c1, a0, a1] = axis === 'x' ? [-700, 1700, -400, 1000] : [-400, 1000, -700, 1700]
  let d = ''
  for (let c = c0; c <= c1; c += 50) {
    if (MAJOR[axis].has(c)) continue
    let run = null
    for (let k = a0; k < a1; k += 50) {
      const on = ALWAYS[axis].has(c) || rand() > 0.26
      if (on && run === null) run = k
      const last = k + 50 >= a1
      if (run !== null && (!on || last)) {
        const end = on ? k + 50 : k
        d += axis === 'x' ? `M${c} ${run}V${end}` : `M${run} ${c}H${end}`
        run = null
      }
    }
  }
  return d
}

let STREETS = ''

function streets() {
  if (STREETS) return STREETS
  const rand = rng(1004)
  const minor = minorLines('x', rand) + minorLines('y', rand)
  let major = ''
  for (const x of MAJOR.x) major += `M${x} -1000V1640`
  for (const y of MAJOR.y) major += `M-1000 ${y}H2000`
  STREETS = `<path d="${minor}" class="m-cas"/><path d="${major}" class="m-cas2"/><path d="${minor}" class="m-st"/><path d="${major}" class="m-av"/>`
  return STREETS
}

const TREES = [[540, 170], [575, 410], [760, 175], [800, 395], [485, 330], [700, 425], [160, 235], [215, 285]]

export function basemap(labels = true) {
  const lab = labels
    ? `<text class="m-lab hood" x="70" y="72">NORTH SHORE</text>
       <text class="m-lab hood" x="40" y="620">WESTGATE</text>
       <text class="m-lab hood" x="860" y="600">OLD MILL</text>
       <text class="m-lab park" x="${LAKE.cx}" y="${LAKE.cy - 128}">Lakeside Park</text>
       <text class="m-lab water" x="${LAKE.cx}" y="${LAKE.cy + 6}">Mirror Lake</text>
       <text class="m-lab st" x="172" y="396">Lakeview Ave</text>
       <text class="m-lab st" x="250" y="96">Harbor Blvd</text>
       <text class="m-lab st" x="610" y="546">Mill Rd</text>
       <text class="m-lab st" transform="translate(146 330) rotate(-90)">Elm St</text>
       <text class="m-lab st" transform="translate(446 486) rotate(-90)">Cedar Ave</text>
       <text class="m-lab st" transform="translate(846 486) rotate(-90)">Pine St</text>`
    : ''
  const trees = TREES.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" class="m-tree"/>`).join('')
  return `<rect x="-1000" y="-1000" width="3000" height="2640" class="m-land"/>
    ${streets()}
    <path d="${blob(LAKE.cx, LAKE.cy, 195, 142, 0.05)}" class="m-park"/>
    <rect x="110" y="210" width="130" height="90" rx="6" class="m-park"/>
    <path d="${blob(LAKE.cx, LAKE.cy, 118, 74, 0.08)}" class="m-water"/>
    <path d="M-1000 616 L0 610 C 200 585, 380 640, 560 612 S 860 590, 1000 618 L2000 614 V1640 H-1000Z" class="m-water"/>
    <path d="${ptsToD(ellipsePts(LAKE.cx, LAKE.cy, 150, 105, Math.PI))}" class="m-trail"/>
    ${trees}${lab}`
}

export function ptsToD(pts) {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('')
}

// The long route superbot builds on screen (week 9, 12 mi): home, around the lake, north, west, home.
export function peakRoute() {
  const lake = ellipsePts(LAKE.cx, LAKE.cy, 150, 105, Math.PI)
  const pts = [HOME, [450, 400], [450, 290], ...lake, [450, 290], [450, 100], [150, 100], [150, 500], [300, 500], HOME]
  const way = [[490, 290], [790, 290], [150, 100]]
  return { pts, way }
}

const snap = (v) => Math.max(50, Math.round(v / 50) * 50)

// Smaller loops for the other weeks; long weeks add the lake trail.
export function routeFor(miles, i) {
  if (miles >= 12) return peakRoute().pts
  const lakeMi = miles >= 9 ? 4.6 : 0
  const half = ((miles - lakeMi) * UNITS_PER_MI) / 2
  const w = snap(half * (0.5 + (i % 3) * 0.08))
  const h = snap(half - w)
  const dir = i % 2 ? -1 : 1
  const [hx, hy] = HOME
  // a notch on one corner so no two loops read as the same plain rectangle
  const n = 50 + (i % 2) * 50
  const box = [HOME, [hx + w * dir, hy], [hx + w * dir, hy - h + n], [hx + (w - n) * dir, hy - h + n], [hx + (w - n) * dir, hy - h], [hx, hy - h], HOME]
  if (!lakeMi) return box
  const lake = ellipsePts(LAKE.cx, LAKE.cy, 150, 105, Math.PI)
  return [HOME, [450, 400], [450, 290], ...lake, [450, 290], [450, hy - h], [hx - (w - 150) * 0.5, hy - h], [hx - (w - 150) * 0.5, hy], HOME]
}

export function bbox(pts, pad, aspect) {
  let [x0, y0, x1, y1] = [1e9, 1e9, -1e9, -1e9]
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x)
    y0 = Math.min(y0, y)
    x1 = Math.max(x1, x)
    y1 = Math.max(y1, y)
  }
  let w = x1 - x0 + pad * 2
  let h = y1 - y0 + pad * 2
  if (w / h < aspect) w = h * aspect
  else h = w / aspect
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  return `${(cx - w / 2).toFixed(1)} ${(cy - h / 2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`
}

export function thumb(miles, i, aspect) {
  const pts = routeFor(miles, i)
  return `<svg class="map" viewBox="${bbox(pts, 34, aspect)}" preserveAspectRatio="xMidYMid slice">${basemap(true)}
    <path d="${ptsToD(pts)}" class="m-route"/><circle cx="${HOME[0]}" cy="${HOME[1]}" r="7" class="m-start"/></svg>`
}

// Elevation samples for the profile under the builder (ft), smooth and deterministic.
export function elevation(n = 90) {
  const out = []
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1)
    out.push(48 + 22 * Math.sin(x * 6.2 + 0.4) + 14 * Math.sin(x * 15.1 + 1.1) + 9 * Math.cos(x * 27.3) + (x > 0.55 && x < 0.75 ? 26 * Math.sin((x - 0.55) * 15.7) : 0))
  }
  return out
}

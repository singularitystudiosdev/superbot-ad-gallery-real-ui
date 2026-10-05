// Claude Opus 5.5: writes the plan as typed code, then the artifact flips to Preview and shows
// the page it built. Claude-style: a short note that states its assumption, then the artifact.
import { T, E, seg, lerp, css, show, rise, typeText, el, $, $$, tile, spinner, check } from './core.a6734000.js'
import { spinDone } from './thread.a6734000.js'

// One self-contained React file, the way a Claude artifact is: data, helpers, default export, JSX.
const CODE = [
  'import { useState } from "react";',
  '',
  '// 36 plans: long run peaks at 12 mi, cutback every 4th week, 2-week taper',
  'const GOAL = "1:55:00"; // assumed: change it and every pace follows',
  'const WEEKS = [ // miles: Tue easy · Thu workout · Sat easy · Sun long',
  '  [4, 5, 3, 6], [4, 5, 4, 7], [5, 6, 4, 8], [4, 5, 3, 6],',
  '  [5, 6, 5, 9], [5, 7, 5, 10], [6, 7, 6, 11], [5, 6, 5, 8],',
  '  [6, 8, 6, 12], [6, 8, 6, 12], [5, 6, 5, 8], [4, 3, 2, 13.1],',
  '];',
  'const phase = (w: number) => (w < 4 ? "base" : w < 8 ? "build" : w < 10 ? "peak" : "taper");',
  '',
  'function paces(goal: string) {',
  '  const [h, m, s] = goal.split(":").map(Number);',
  '  const race = (h * 3600 + m * 60 + s) / 13.1; // 8:46 per mile',
  '  return { race, tempo: race - 21, intervals: race - 46, easy: race + 89, long: race + 94 };',
  '}',
  '',
  'export default function HalfMarathonPlan() {',
  '  const [open, setOpen] = useState(8); // peak week starts expanded',
  '  const pace = paces(GOAL);',
  '  return (',
  '    <main className="mx-auto max-w-6xl p-8">',
  '      <Header race="Sun, Dec 27" goal={GOAL} miles={295.1} runs={48} />',
  '      <WeeklyChart weeks={WEEKS} phase={phase} />',
  '      <PaceCard pace={pace} />',
  '      {WEEKS.map((miles, w) => (',
  '        <WeekRow key={w} n={w + 1} miles={miles} phase={phase(w)} pace={pace}',
  '          open={open === w} onToggle={() => setOpen(w)} />',
  '      ))}',
  '    </main>',
  '  );',
  '}',
  '',
  'function WeekRow({ n, miles, phase, pace, open, onToggle }: WeekRowProps) {',
]

const KW = new Set(['import', 'from', 'export', 'default', 'function', 'const', 'type', 'return', 'as', 'new'])

function hl(line) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const re = /(\/\/.*$)|("[^"]*")|(<\/?[A-Za-z][\w.]*)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)/g
  let out = ''
  let last = 0
  for (const m of line.matchAll(re)) {
    out += esc(line.slice(last, m.index))
    const [tok, cm, str, tag, num, id] = m
    if (cm) out += `<span class="c">${esc(cm)}</span>`
    else if (str) out += `<span class="s">${esc(str)}</span>`
    else if (tag) out += `<span class="t">${esc(tag)}</span>`
    else if (num) out += `<span class="n">${num}</span>`
    else if (KW.has(id)) out += `<span class="k">${id}</span>`
    else if (/^[A-Z][a-z]/.test(id)) out += `<span class="t">${id}</span>`
    else if (line[m.index + tok.length] === '(') out += `<span class="f">${id}</span>`
    else out += esc(id)
    last = m.index + tok.length
  }
  return out + esc(line.slice(last))
}

const WEEKS = [
  [4, 5, 3, 6], [4, 5, 4, 7], [5, 6, 4, 8], [4, 5, 3, 6],
  [5, 6, 5, 9], [5, 7, 5, 10], [6, 7, 6, 11], [5, 6, 5, 8],
  [6, 8, 6, 12], [6, 8, 6, 12], [5, 6, 5, 8], [4, 3, 2, 13.1],
]
const PHASE = (w) => (w < 4 ? 'base' : w < 8 ? 'build' : w < 10 ? 'peak' : 'taper')
const START = new Date(Date.UTC(2026, 9, 5))
const md = (days) => new Date(START.getTime() + days * 864e5).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const kindOf = (w, d) => (d === 3 ? (w === 11 ? 'race' : 'long') : d === 1 ? (w % 2 ? 'intervals' : 'tempo') : 'easy')
const SHORT = { easy: 'easy', tempo: 'tempo', intervals: 'intervals', long: 'long', race: 'race' }

function preview() {
  const tot = WEEKS.map((w) => w.reduce((s, v) => s + v, 0))
  const bars = tot
    .map((m, i) => `<div class="pv-b ${PHASE(i)}${i === 3 || i === 7 ? ' cut' : ''}"><span>${m % 1 ? m.toFixed(1) : m}</span><i style="--h:${((m / 32) * 100).toFixed(1)}"></i><em>W${i + 1}</em></div>`)
    .join('')
  const rows = WEEKS.map(
    (w, i) => `<div class="pv-row ${PHASE(i)}${i === 8 ? ' hi' : ''}"><span class="pv-wk"><b>W${i + 1}</b>${md(i * 7)}</span>${w
      .map((mi, d) => `<span class="pv-run k-${kindOf(i, d)}"><b>${mi}</b> mi ${SHORT[kindOf(i, d)]}</span>`)
      .join('')}<span class="pv-tot">${tot[i] % 1 ? tot[i].toFixed(1) : tot[i]} mi</span></div>`,
  ).join('')
  return `<div class="pv"><div class="pv-in">
    <div class="pv-top">
      <div><div class="pv-eye">HALF MARATHON · 12 WEEKS · OCT 5 TO DEC 27</div>
        <div class="pv-h">Race day, Sun Dec 27</div>
        <div class="pv-sub">Goal 1:55:00 at 8:46/mi · 48 runs · 295 mi</div></div>
      <div class="pv-stats"><div><b>32 mi</b><span>peak week</span></div><div><b>12 mi</b><span>longest run</span></div><div><b>2 wks</b><span>taper</span></div></div>
    </div>
    <div class="pv-mid">
      <div class="pv-card pv-chart"><div class="pv-ct">Weekly miles</div><div class="pv-bars">${bars}</div>
        <div class="pv-ph"><span class="base">Base</span><span class="build">Build</span><span class="peak">Peak</span><span class="taper">Taper</span></div></div>
      <div class="pv-card pv-pace"><div class="pv-ct">Paces</div>
        <div class="k-easy"><i></i>Easy<b>10:15</b></div><div class="k-long"><i></i>Long<b>10:20</b></div>
        <div class="k-tempo"><i></i>Tempo<b>8:25</b></div><div class="k-intervals"><i></i>Intervals<b>8:00</b></div>
        <div class="k-race"><i></i>Race<b>8:46</b></div><p>per mile, from a 1:55 goal</p></div>
    </div>
    <div class="pv-card pv-grid"><div class="pv-ct">All 48 runs <span>Tue · Thu · Sat · Sun</span></div>${rows}</div>
  </div></div>`
}

const NOTE = 'No goal time was given, so it’s paced for a 1:55 finish. Change GOAL and every pace follows.'

export function buildOpus() {
  const code = CODE.map((l, i) => `<div class="ln"><em>${i + 1}</em><code>${hl(l) || ' '}</code></div>`).join('')
  return el(`<div class="blk" id="b-op">
    <div class="ahead">${tile('op')}<b>Claude Opus 5.5</b><span class="st op-st">writing plan.tsx</span><span class="sw-r">${spinner()}${check()}</span></div>
    <p class="say op-say"><span class="op-typed"></span><span class="op-ghost">${NOTE}</span></p>
    <div class="art">
      <div class="art-h"><span class="art-ic"><svg viewBox="0 0 24 24"><path d="m8 7-5 5 5 5M16 7l5 5-5 5"/></svg></span>
        <span class="art-t"><b>Half Marathon Plan</b><em>plan.tsx</em></span>
        <span class="art-sp"></span>
        <span class="art-tog"><i class="art-knob"></i><span class="tg-p">Preview</span><span class="tg-c">Code</span></span>
        <span class="art-btn">Copy</span><span class="art-btn pub">Publish</span></div>
      <div class="art-b"><div class="art-code"><div class="art-lines">${code}</div></div>${preview()}</div>
    </div>
  </div>`)
}

export function animOpus(t) {
  const root = $('#b-op')
  const a = T.op
  const pv = T.opPrev
  rise(root, t, a, 0.5)
  spinDone($('.ahead', root), t, a, pv + 1.6)
  const st = $('.op-st', root)
  const label = t < pv ? 'writing plan.tsx' : t < pv + 1.6 ? 'rendering the page' : 'done'
  if (st.textContent !== label) st.textContent = label
  typeText($('.op-typed', root), NOTE, seg(t, a + 0.15, a + 0.85))
  rise($('.art', root), t, a + 0.45, 0.6, 16, 0.98)
  // code streams line by line, each line wiping on left to right; the pane follows the newest line
  const lines = $$('.ln', root)
  const c0 = a + 0.7
  const c1 = pv - 0.2
  const step = (c1 - c0) / lines.length
  lines.forEach((ln, i) => {
    const s = c0 + i * step
    const p = E.out(seg(t, s, s + step + 0.12))
    css(ln, 'clip-path', `inset(0 ${((1 - p) * 100).toFixed(2)}% 0 0)`)
  })
  const geo = root.__code || { lh: 24, fit: 22 }
  const shown = Math.max(0, Math.min(lines.length, (t - c0) / step))
  const follow = Math.max(0, shown - geo.fit) * geo.lh
  css($('.art-lines', root), 'transform', `translate3d(0,${(-follow).toFixed(2)}px,0)`)
  const flip = E.inOut(seg(t, pv, pv + 0.5))
  css($('.art-knob', root), 'transform', `translate3d(${((1 - flip) * 100).toFixed(2)}%,0,0)`)
  $('.art-tog', root).classList.toggle('pv-on', flip > 0.5)
  show($('.art-code', root), 1 - flip)
  const page = $('.pv', root)
  show(page, flip)
  css(page, 'transform', `scale(${lerp(0.985, 1, flip).toFixed(4)})`)
  animPreview(t, root, pv)
}

// Top of the page settles (bars grow, then hold), then it scrolls to the 48 runs and rings week 9.
function animPreview(t, root, pv) {
  rise($('.pv-top', root), t, pv + 0.15, 0.55, 12)
  $$('.pv-stats > div', root).forEach((d, i) => rise(d, t, pv + 0.3 + i * 0.08, 0.45, 8))
  rise($('.pv-chart', root), t, pv + 0.25, 0.5, 12)
  rise($('.pv-pace', root), t, pv + 0.4, 0.5, 12)
  $$('.pv-b', root).forEach((b, i) => {
    const p = E.outQuint(seg(t, pv + 0.4 + i * 0.03, pv + 0.85 + i * 0.03))
    css($('i', b), 'transform', `scaleY(${p.toFixed(3)})`)
    show($('span', b), seg(t, pv + 0.7 + i * 0.03, pv + 1.0 + i * 0.03))
  })
  $$('.pv-pace > div', root).forEach((d, i) => rise(d, t, pv + 0.55 + i * 0.07, 0.4, 6))
  const sc = E.inOut(seg(t, pv + 1.8, pv + 2.7))
  css($('.pv-in', root), 'transform', `translate3d(0,${(-sc * (root.__pvScroll || 0)).toFixed(2)}px,0)`)
  rise($('.pv-grid', root), t, pv + 1.6, 0.5, 12)
  $$('.pv-row', root).forEach((r, i) => rise(r, t, pv + 1.7 + i * 0.05, 0.45, 8))
  css($('.pv-row.hi', root), '--ring', E.out(seg(t, pv + 2.7, pv + 3.0)).toFixed(3))
}

export function measureOpus() {
  const root = $('#b-op')
  const pane = $('.art-b', root)
  const vh = pane.clientHeight
  root.__pvScroll = Math.max(0, $('.pv-in', root).offsetHeight - vh)
  const lh = $('.ln', root).offsetHeight
  root.__code = { lh, fit: Math.floor((vh - 40) / lh) }
}

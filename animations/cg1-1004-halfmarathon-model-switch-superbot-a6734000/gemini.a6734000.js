// Gemini 3.1 Pro: reads the 9 plans DeepSeek could only find as pictures (a carousel slide,
// a scanned club PDF, a blog chart). Each picture is its own plan with its own numbers, built in HTML/CSS
// on a 348 x 268 canvas that the frame scales up.
import { T, E, seg, css, show, rise, el, $, $$, tile, spinner, check } from './core.a6734000.js'
import { spinDone } from './thread.a6734000.js'

// three other coaches' plans: they agree on the rules, not on the numbers
const SLIDE_LONG = [5, 6, 7, 5, 8, 9, 10, 7, 11, 12, 8, 'RACE']
const SCAN_WEEKS = [
  [3, 4, 3, 5], [3, 4, 3, 6], [4, 5, 3, 7], [3, 4, 3, 5],
  [4, 5, 4, 8], [4, 6, 4, 9], [5, 6, 4, 10], [4, 5, 4, 8],
  [5, 6, 5, 11], [5, 7, 5, 12], [4, 5, 3, 8], [3, 3, 2, 'RACE'],
]
const CHART_LONG = [5, 6, 7, 6, 8, 9, 10, 8, 11, 12, 9, 13.1]

function slide() {
  const rows = SLIDE_LONG.map((m, i) => `<li><span>WK ${i + 1}</span><b>${typeof m === 'number' ? m + ' MI' : m}</b></li>`).join('')
  return `<div class="img slide">
    <div class="sl-kick">SAVE THIS ↓</div>
    <div class="sl-h">12 WEEK<br>HALF PLAN</div>
    <div class="sl-sub">LONG RUNS · SUNDAYS</div>
    <ol class="sl-list">${rows}</ol>
    <div class="sl-dots"><i class="on"></i><i></i><i></i><i></i><i></i></div>
  </div>`
}

function scan() {
  const cell = (v) => (typeof v === 'number' ? `${v} m` : v)
  const rows = SCAN_WEEKS.map((w, i) => {
    const days = [w[0], 'Rest', w[1], 'X', w[2], 'Rest', w[3]]
    return `<tr><td>${i + 1}</td>${days.map((d) => `<td>${cell(d)}</td>`).join('')}</tr>`
  }).join('')
  return `<div class="img scan"><div class="paper">
    <div class="sc-h">HALF MARATHON · 12 WEEKS</div>
    <table><thead><tr><th>WK</th><th>MON</th><th>TUE</th><th>WED</th><th>THU</th><th>FRI</th><th>SAT</th><th>SUN</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="sc-foot">p. 2</div>
  </div></div>`
}

function chart() {
  const bars = CHART_LONG.map((m, i) => `<i class="${i === 11 ? 'race' : i >= 10 ? 'tp' : m >= 12 ? 'pk' : ''}" style="--h:${((m / 13.1) * 100).toFixed(1)}%"><em>${i === 11 ? 'RACE' : m}</em></i>`).join('')
  return `<div class="img chart">
    <div class="ch-h">Long runs <span>(mi)</span></div>
    <div class="ch-bars">${bars}</div>
    <div class="ch-x">${CHART_LONG.map((_, i) => `<span>${i + 1}</span>`).join('')}</div>
  </div>`
}

const FIGS = [
  ['slide_2.jpg', slide(), [['sl', 'long runs, peak 12 mi in wk 10']]],
  ['club_half_plan_scan.pdf · p2', scan(), [['sc', 'Sunday = long run, peak 12']]],
  ['long-run-chart.png', chart(), [['pk', 'peak 12 mi, then taper']]],
]

const SPARK = `<svg viewBox="0 0 24 24"><path d="M12 2c.4 5.4 4.6 9.6 10 10-5.4.4-9.6 4.6-10 10-.4-5.4-4.6-9.6-10-10 5.4-.4 9.6-4.6 10-10z"/></svg>`

export function buildGemini() {
  const figs = FIGS.map(
    ([name, inner, boxes], i) => `<figure class="gm-fig" data-i="${i}">
      <div class="gm-frame"><div class="gm-canvas">${inner}
        ${boxes.map(([k, label]) => `<span class="gm-box b-${k}"><em>${label}</em></span>`).join('')}</div>
        <i class="gm-sweep"></i>
      </div>
      <figcaption>${name}</figcaption>
    </figure>`,
  ).join('')
  return el(`<div class="blk" id="b-gm">
    <div class="ahead">${tile('gm')}<b>Gemini 3.1 Pro</b><span class="st gm-st">reading 9 images</span><span class="sw-r">${spinner()}${check()}</span></div>
    <div class="gm">
      <div class="gm-think">${SPARK}<span>Show thinking</span><svg class="chev" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg></div>
      <div class="gm-figs">${figs}<div class="gm-more">+6 more</div></div>
      <div class="gm-ans">
        <p><b>The 9 image plans follow the same rules as the text ones.</b></p>
        <ul><li>Long run peaks at <b>12 mi</b> in 8 of 9</li><li>A <b>2-week taper</b> in 7 of 9</li><li>A cutback every <b>4th week</b> in 6 of 9</li></ul>
      </div>
      <div class="gm-merge">${check()}<span><b>36 of 36</b> plans read, 5 rules ready for the plan</span></div>
    </div>
  </div>`)
}

export function animGemini(t) {
  const root = $('#b-gm')
  const a = T.gm
  rise(root, t, a, 0.5)
  const busy = seg(t, a, a + 2.4)
  css($('.ahead .tile img', root), 'transform', `rotate(${(E.inOut(busy) * 360).toFixed(1)}deg)`)
  spinDone($('.ahead', root), t, a, a + 2.4)
  const st = $('.gm-st', root)
  const label = t < a + 2.4 ? 'reading 9 images' : 'done'
  if (st.textContent !== label) st.textContent = label
  rise($('.gm-think', root), t, a + 0.12, 0.4, 8)
  $$('.gm-fig', root).forEach((f, i) => {
    const s = a + 0.25 + i * 0.14
    rise(f, t, s, 0.55, 18, 0.95)
    // scanning band sweeps down the picture, then the boxes lock onto what was read
    const p = E.inOutSine(seg(t, s + 0.35, s + 1.25))
    css($('.gm-sweep', f), 'transform', `translate3d(0,${(p * 100 - 15).toFixed(2)}%,0)`)
    show($('.gm-sweep', f), p > 0 && p < 1 ? 1 : 0)
    $$('.gm-box', f).forEach((b, j) => {
      const q = E.outBack(seg(t, s + 1.05 + j * 0.18, s + 1.45 + j * 0.18))
      show(b, Math.min(1, q))
      css(b, 'transform', `scale(${(0.9 + 0.1 * q).toFixed(3)})`)
    })
  })
  rise($('.gm-more', root), t, a + 0.75, 0.4, 8)
  rise($('.gm-ans', root), t, a + 1.75, 0.5, 10)
  $$('.gm-ans li', root).forEach((li, i) => rise(li, t, a + 1.9 + i * 0.12, 0.4, 6))
  const m = $('.gm-merge', root)
  rise(m, t, a + 2.3, 0.5, 8, 0.97)
  spinDone(m, t, a + 2.3, a + 2.3)
}

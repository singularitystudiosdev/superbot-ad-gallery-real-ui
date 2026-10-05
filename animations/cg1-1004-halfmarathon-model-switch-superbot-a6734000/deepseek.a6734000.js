// DeepSeek V4: web search + scrape. Rendered the way DeepSeek answers: a "Thought for Ns" block,
// a "Read N web pages" source chip, numbered sources, then a markdown table with citation chips.
import { T, E, seg, css, show, rise, count, el, $, $$, tile, spinner, check } from './core.a6734000.js'
import { spinDone } from './thread.a6734000.js'

const SOURCES = [
  ['halhigdon.com', 'Half Marathon Training: Novice 2', 'text'],
  ['runnersworld.com', 'Half marathon training plans for every level', 'text'],
  ['mcmillanrunning.com', 'Half marathon training plans', 'text'],
  ['nike.com', 'Nike Run Club half marathon training guide', 'text'],
  ['instagram.com', '12-week half plan, 5 slides', 'img'],
  ['drive.google.com', 'club_half_plan_scan.pdf', 'img'],
]

// [rule, plans agreeing out of 27, citations]
const RULES = [
  ['Long run peaks at 12 to 13 mi', 24, '1 3'],
  ['About 80% of weekly miles are easy', 25, '2 4'],
  ['Taper for the last 2 weeks', 22, '1 2'],
  ['Cut back every 4th week', 21, '3'],
  ['One workout a week: tempo or intervals', 19, '2 4'],
]

const ATOM = `<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-60 12 12)"/></svg>`
const GLOBE = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18"/></svg>`
const CHEV = `<svg class="chev" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>`

export function buildDeepSeek() {
  const src = SOURCES.map(
    ([d, title, kind], i) => `<div class="ds-card k-${kind}">
      <div class="ds-c-top"><span class="ds-num">${i + 1}</span><span class="ds-dom">${d}</span></div>
      <div class="ds-c-title">${title}</div>
      <div class="ds-tag">${kind === 'img' ? 'image only' : '<b>✓</b> scraped'}</div>
      <i class="ds-scan"></i>
    </div>`,
  ).join('')
  const rows = RULES.map(
    ([r, n, cites]) => `<tr><td>${r}${cites
      .split(' ')
      .map((c) => `<span class="cite">${c}</span>`)
      .join('')}</td><td class="n"><span class="ds-n">0</span>/27</td><td class="bar"><i style="--w:${((n / 27) * 100).toFixed(1)}%"></i></td></tr>`,
  ).join('')
  return el(`<div class="blk" id="b-ds">
    <div class="ahead">${tile('ds')}<b>DeepSeek V4</b><span class="st ds-st">searching the web</span><span class="sw-r">${spinner()}${check()}</span></div>
    <div class="ds">
      <div class="ds-pills">
        <span class="ds-pill p-src">${GLOBE}<span>Read <b class="ds-pages">0</b> web pages</span>${CHEV}</span>
        <span class="ds-pill p-think">${ATOM}<span>Thought for 3 seconds</span>${CHEV}</span>
      </div>
      <div class="ds-grid">${src}</div>
      <div class="ds-count"><b class="ds-found">0</b> half marathon plans found · <b>27</b> are text · <b class="amber">9</b> are images only</div>
      <div class="ds-ans">
        <h4>What the 27 text plans agree on</h4>
        <table><thead><tr><th>Rule</th><th>Plans</th><th></th></tr></thead><tbody>${rows}</tbody></table>
      </div>
      <p class="ds-foot">The other 9 plans are only published as images, so Gemini should read those.</p>
    </div>
  </div>`)
}

export function animDeepSeek(t) {
  const root = $('#b-ds')
  const a = T.ds
  rise(root, t, a, 0.5)
  spinDone($('.ahead', root), t, a, a + 2.6)
  const st = $('.ds-st', root)
  const label = t < a + 0.9 ? 'searching the web' : t < a + 2.6 ? 'scraping plans' : 'done'
  if (st.textContent !== label) st.textContent = label
  // DeepSeek shows the search block first, then the reasoning block
  rise($('.p-src', root), t, a + 0.12, 0.45, 8)
  count($('.ds-pages', root), 0, 41, seg(t, a + 0.12, a + 0.9))
  rise($('.p-think', root), t, a + 0.3, 0.45, 8)
  $$('.ds-card', root).forEach((c, i) => {
    const s = a + 0.4 + i * 0.06
    rise(c, t, s, 0.5, 12, 0.97)
    // scrape progress line runs across each card, then the tag lands
    const p = E.inOut(seg(t, s + 0.25, s + 0.75))
    css($('.ds-scan', c), 'transform', `scaleX(${p.toFixed(3)})`)
    show($('.ds-scan', c), p > 0 && p < 1 ? 1 : 0)
    rise($('.ds-tag', c), t, s + 0.75, 0.35, 6)
  })
  rise($('.ds-count', root), t, a + 1.0, 0.45, 8)
  count($('.ds-found', root), 0, 36, seg(t, a + 1.0, a + 1.5))
  rise($('.ds-ans', root), t, a + 1.25, 0.5, 12)
  $$('tbody tr', root).forEach((tr, i) => {
    const s = a + 1.4 + i * 0.1
    rise(tr, t, s, 0.45, 8)
    const p = E.outQuint(seg(t, s + 0.1, s + 0.7))
    css($('.bar i', tr), 'transform', `scaleX(${p.toFixed(3)})`)
    count($('.ds-n', tr), 0, RULES[i][1], p)
  })
  rise($('.ds-foot', root), t, a + 2.2, 0.45, 8)
}

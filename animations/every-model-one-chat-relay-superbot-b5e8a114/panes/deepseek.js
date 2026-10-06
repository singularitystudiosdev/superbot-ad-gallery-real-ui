// Pane 1: DeepSeek V4 Pro with DeepThink and Search on. It scrapes Yelp, DoorDash, Uber Eats, Maps and
// Reddit for every rival (the job other assistants decline on terms-of-service grounds) and hands back
// competitors.json with the pattern it found.
import { SPOTS, SCRAPE } from '../data.js';
import { html, $, $$, enter, seg, show, easeOut } from '../engine.js';

const FAV = [['Y', '#d32323'], ['D', '#ff3008'], ['U', '#06c167'], ['G', '#4285f4'], ['R', '#ff4500']];
const fmt = (n) => n.toLocaleString('en-US');

export function build() {
  const favs = FAV.map(([l, c]) => `<i style="background:${c}">${l}</i>`).join('');
  const log = SCRAPE.map(([url, , unit]) => `<li><span class="st"><i class="spin"></i><svg class="ok" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7"/></svg></span><code>${url}</code><b><span class="n">0</span> ${unit}</b></li>`).join('');
  const rows = SPOTS.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td class="${r[4] === 'soggy bun' ? 'hit' : ''}">${r[4]}</td></tr>`).join('');
  const el = html(`
  <div class="pane p-ds">
    <aside class="ds-side">
      <div class="ds-brand"><img src="brand/deepseek-logo.svg" alt=""><span>deepseek</span></div>
      <span class="ds-new"><svg viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"/></svg>New chat</span>
      <em>Today</em>
      <a class="on">Burger spots near 24th &amp; Mission</a>
      <a>Menu price scrape, Valencia St</a>
      <em>Previous 7 days</em>
      <a>Food truck permit SF</a>
    </aside>
    <div class="ds-main">
      <header class="ds-top">Burger spots near 24th &amp; Mission</header>
      <div class="ds-col">
        <div class="ds-user">Scrape every burger spot within 2 mi of 24th &amp; Mission. Menus, prices, every review. Tell me what people hate.</div>
        <div class="ds-ans">
          <img class="ds-av" src="brand/deepseek-logo.svg" alt="">
          <div class="ds-body">
            <div class="ds-pills">
              <span class="ds-pill think"><svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.5"/></svg><span class="lbl">Thinking</span></span>
              <span class="ds-pill search"><span class="favs">${favs}</span><span class="lbl">Searching the web</span></span>
            </div>
            <div class="ds-grid">
              <div class="ds-card ds-log">
                <div class="ds-card-h"><code>web_scrape</code><span class="ds-tag">5 sites, no API keys</span></div>
                <ul>${log}</ul>
              </div>
              <div class="ds-card ds-table">
                <table><thead><tr><th>Spot</th><th>Burger</th><th>Rating</th><th>Reviews</th><th>Top complaint</th></tr></thead><tbody>${rows}</tbody></table>
                <div class="ds-more">41 more rows</div>
              </div>
            </div>
            <div class="ds-stats">
              <span><em>Median burger</em><b>$13.50</b></span>
              <span><em>Top complaint</em><b>Soggy buns</b><i>418 reviews</i></span>
              <span><em>Spots under $10</em><b>0</b></span>
              <span class="file ds-out"><svg viewBox="0 0 16 16"><path d="M4 1.5h5.5L13 5v9.5H4z M9.5 1.5V5H13"/></svg><b>competitors.json</b><i>47 rows</i></span>
            </div>
            <p class="ds-say">Every spot charges $11.50 or more, and "soggy bun" is the top complaint in 418 reviews. A $9 burger on a toasted bun undercuts all 47.</p>
          </div>
        </div>
      </div>
      <div class="ds-input">
        <span class="ph">Message DeepSeek</span>
        <div class="ds-tools"><span class="tg on">DeepThink</span><span class="tg on">Search</span><span class="ds-send"><svg viewBox="0 0 16 16"><path d="M8 13V3M3.5 7.5L8 3l4.5 4.5"/></svg></span></div>
      </div>
    </div>
  </div>`);
  return {
    el,
    user: $(el, '.ds-user'),
    av: $(el, '.ds-av'),
    think: $(el, '.think'),
    search: $(el, '.search'),
    favs: $$(el, '.favs i'),
    log: $(el, '.ds-log'),
    lines: $$(el, '.ds-log li'),
    table: $(el, '.ds-table'),
    rows: $$(el, '.ds-table tbody tr'),
    more: $(el, '.ds-more'),
    stats: $$(el, '.ds-stats > span'),
    out: $(el, '.ds-out'),
    say: $(el, '.ds-say'),
  };
}

function pill(p, t, at, done, doneText) {
  show(p, t >= at);
  enter(p, t, at, 0.28, 6);
  const fin = t >= done;
  p.classList.toggle('done', fin);
  const lbl = $(p, '.lbl');
  if (fin) lbl.textContent = doneText;
  lbl.style.setProperty('--sh', `${100 - (((t - at) * 90) % 150)}%`);
}

export function render(c, t) {
  show(c.user, t >= 0);
  enter(c.user, t, 0, 0.3, 10);
  show(c.av, t >= 0.25);
  enter(c.av, t, 0.25);
  pill(c.think, t, 0.25, 0.85, 'Thought for 7 seconds');
  if (t < 0.85) $(c.think, '.lbl').textContent = 'Thinking';
  pill(c.search, t, 0.7, 1.25, 'Read 64 web pages');
  if (t < 1.25) $(c.search, '.lbl').textContent = 'Searching the web';
  c.favs.forEach((f, i) => { f.style.opacity = easeOut(seg(t, 0.75 + i * 0.09, 0.95 + i * 0.09)); });
  show(c.log, t >= 1.1);
  enter(c.log, t, 1.1, 0.3, 10);
  c.lines.forEach((li, i) => {
    const at = 1.25 + i * 0.3;
    show(li, t >= at);
    enter(li, t, at, 0.2, 4);
    const k = seg(t, at, at + 0.45);
    li.classList.toggle('done', k >= 1);
    $(li, '.n').textContent = fmt(Math.round(SCRAPE[i][1] * easeOut(k)));
    $(li, '.spin').style.transform = `rotate(${(t - at) * 600}deg)`;
  });
  show(c.table, t >= 1.9);
  enter(c.table, t, 1.9, 0.3, 10);
  c.rows.forEach((r, i) => { show(r, t >= 2.0 + i * 0.19); enter(r, t, 2.0 + i * 0.19, 0.22, 4); });
  show(c.more, t >= 3.15);
  enter(c.more, t, 3.15);
  c.stats.forEach((s, i) => { show(s, t >= 3.25 + i * 0.13); enter(s, t, 3.25 + i * 0.13, 0.3, 8); });
  show(c.say, t >= 3.7);
  enter(c.say, t, 3.7, 0.35, 8);
  c.out.classList.toggle('lit', t >= 3.9);
}

export const anchors = (c) => ({ in: c.user, out: c.out });

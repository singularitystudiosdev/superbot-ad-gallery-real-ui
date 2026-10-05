// Scrape beat: DeepSeek V4 does the web work the others decline. Two searches land (the course map, the results
// pages), then a terminal scrapes three years of results pages with no API: proxy rotation, a 429 it backs off from,
// 1,693 pages, 84,117 finishers parsed. Out come course.gpx (the course Blender builds next; its point count and
// gain are the real ones from data.9f1df009.js) and splits.parquet, and the one finding the plan is built on.
import { seg, outCubic, inOutCubic } from '../../../lib.js';
import { sayLine, rise, land, setText, fmt, statusRender, cardHead, withFocus } from './kit.9f1df009.js?v=9f1df009';
import { PROFILE } from '../../../media/data.9f1df009.js?v=9f1df009';

const SAY = "Results have no public API, so I'm scraping all three years of them.";
const PAGES = 1693, FINISHERS = 84117;
const SEARCH = [
  ['brooklyn half course map', `Course map PDF → ${fmt(PROFILE.points)} pts`],
  ['brooklyn half results', 'Results pages 2024–26 · no API'],
];
// the log: [kind, text]; the page numbers run with the counter
const LOG = [
  ['cmd', '$ scrape results --years 2024-2026 --proxies 12'],
  ['ok', 'GET /results/2024?page=1      200  41ms'],
  ['ok', 'GET /results/2024?page=2      200  38ms'],
  ['ok', 'GET /results/2024?page=3      200  44ms'],
  ['warn', '429 Too Many Requests · backoff 2.0s · IP 7/12'],
  ['ok', 'GET /results/2024?page=4      200  52ms'],
  ['ok', 'GET /results/2025?page=611    200  39ms'],
  ['ok', 'GET /results/2025?page=1102   200  40ms'],
  ['warn', '429 Too Many Requests · backoff 2.4s · IP 3/12'],
  ['ok', 'GET /results/2026?page=1401   200  37ms'],
  ['ok', 'GET /results/2026?page=1693   200  43ms'],
  ['sum', `parsed ${fmt(FINISHERS)} finishers · 5K 10K 15K 20K splits`],
];
const FILES = [
  ['course.gpx', `13.1 mi · +${PROFILE.gain_ft} ft`],
  ['splits.parquet', `${fmt(FINISHERS)} rows`],
];
const FIND = '1:55 finishers who negative split ran the park at 8:57/mi and Ocean Pkwy at 8:38/mi.';
const SHOWN = 8, LH = 13; // terminal lines visible, line height px

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + 0.14;
    T.q = SEARCH.map((_, i) => T.card + 0.2 + i * 0.3);
    T.l0 = T.card + 0.5; T.l1 = T.l0 + 1.5;       // the log runs, the counter with it
    T.files = FILES.map((_, i) => T.l1 + 0.08 + i * 0.12);
    T.find = T.files[FILES.length - 1] + 0.2;
    return withFocus(T, opts, T.card + 0.36, T.find + 1.0); // the camera pushes in on the output, then glides to the next pill
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY, T.r + 0.05);
    const card = x.el(`<div class="rk-card ds-card">
      ${cardHead(x, 'deepseek-logo.svg', 'Scraping race results', `<b class="rk-n">0</b> / ${fmt(PAGES)} pages`)}
      <div class="ds-bd">
        <div class="ds-search">${SEARCH.map(([q, a]) => `<div class="ds-q"><i class="ds-mg"></i><span class="ds-qt">${x.esc(q)}</span><span class="ds-qa">${x.esc(a)}</span></div>`).join('')}
          <div class="ds-tag">no API · scraped anyway</div></div>
        <div class="ds-term"><div class="ds-log">${LOG.map(([c, s]) => `<div class="ds-l ${c}">${x.esc(s)}</div>`).join('')}</div></div>
      </div>
      <div class="ds-out">${FILES.map(([f, m]) => `<span class="ds-file"><i class="ds-fi"></i><b>${f}</b><s>${m}</s></span>`).join('')}</div>
      <div class="ds-find">${x.OK}<span>${x.esc(FIND)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s), $$ = (s) => [...card.querySelectorAll(s)];
    const st = $('.rk-st'), n = $('.rk-n'), log = $('.ds-log'), lines = $$('.ds-l');
    const qs = $$('.ds-q'), tag = $('.ds-tag'), files = $$('.ds-file'), find = $('.ds-find');
    return {
      nodes: [say.n, card],
      focus: T.focus ? card : null, // the camera's target while T.focus runs (chat.js FOCUS; zoom cut only)
      marks: [[T.r, say.n], [T.card, card], [T.find, find]],
      render(t) {
        say.render(t);
        rise(card, seg(t, T.card, T.card + 0.36));
        statusRender(st, t, T.card, T.l1);
        qs.forEach((q, i) => {
          land(q, seg(t, T.q[i], T.q[i] + 0.22));
          q.lastElementChild.style.opacity = outCubic(seg(t, T.q[i] + 0.16, T.q[i] + 0.36)).toFixed(3);
        });
        land(tag, seg(t, T.q[1] + 0.3, T.q[1] + 0.5));
        // the log: lines land one by one across the run, the window scrolling to keep the newest at the bottom
        const p = seg(t, T.l0, T.l1), shown = Math.min(LOG.length, Math.ceil(p * LOG.length - 1e-6) + (t >= T.l0 ? 1 : 0));
        lines.forEach((l, i) => { l.style.visibility = i < shown ? '' : 'hidden'; });
        log.style.transform = `translateY(${(-Math.max(0, shown - SHOWN) * LH).toFixed(1)}px)`;
        setText(n, fmt(PAGES * inOutCubic(p)));
        files.forEach((f, i) => land(f, seg(t, T.files[i], T.files[i] + 0.22), 5));
        land(find, seg(t, T.find, T.find + 0.26));
      },
    };
  },
};

// bq.js: the data analyst's desk, BigQuery Studio beside Slack #data-requests, and the four beats superbot works on it.
// It is one DOM tree built at mount and then driven purely from local time t (?t=<s> reproduces any frame), so the
// spot is seek-safe at every ratio. Both product UIs are rebuilt in HTML from reference screenshots kept outside the
// repo in /tmp/da-ad.0368c93c/ref (Google Cloud docs for BigQuery Studio, the query editor, the query results tabs and
// the chart; Slack's help center and product pages for the channel, the thread panel, reactions and workflow
// messages). Every colour, size and radius in bq.css traces to a line of ref/NOTES.md.
// The motion is the call-center spot's (e360.js) beat for beat: CONNECT / VOICE / LEARN / ANSWER / LAND, the three
// WINS, the queue's tIn / tAns / tRes, the step ticks and the HUD rules are unchanged; only what the desk shows is an
// analyst's work. Column for column: the call queue is Slack #data-requests (request messages posted by a workflow,
// eyes -> white_check_mark reactions, "1 reply" as each is answered), SmartConnect is the BigQuery query editor (the
// SQL types in, Run is pressed, Results then Visualization), the transcript is the Slack thread reply in your voice,
// the ticket flip is the request turning answered and End Conversation is Send.
// Real marks in the chrome: the Google Cloud logo in the console bar and the BigQuery product icon at the head of the
// BigQuery nav (../../img, see ../../img/CREDITS.txt). All content (tables, schema, requests, SQL, results, charts,
// replies, dictionary facts) comes from bq-data.js, generated from the research pass; each record carries its src.
import { clamp, lerp, seg, outCubic, inOutCubic, rand, press, esc, streamCount } from '../../lib.js';
import { PROJECT, TABLES, REQUESTS, MAINS, LEARN, CHIPS } from './bq-data.js';

const NB = ' ';

// ---------- the desk's own clock (seconds, local to the desk layer): the call-center spot's, unchanged ----------
export const DUR = 18.40;
const CONNECT = { a: 0.00, b: 2.10 };
const VOICE = { a: 2.10, b: 4.60 };
const LEARN_B = { a: 4.60, b: 8.60 };
const ANSWER = { a: 8.60, b: 16.10 };
const LAND = { a: 16.10, b: DUR };

// the three requests worked in full, start to end
const WINS = [[8.90, 11.60], [11.60, 14.00], [14.00, 16.10]];
// where each step of a main request lands inside its window, as a fraction of it (the source's prob / sol / turn2 /
// closed / end roles: the SQL types, Run is pressed, results then chart, the thread reply, Send, answered)
// The thread opens as soon as the Results grid is in (the reply quotes its numbers) so the reply streams over twice
// the source's span (0.35 -> 0.72 of the window instead of 0.51 -> 0.70) while the chart draws beside it.
const FR = { open: 0.03, sql: 0.05, sqlEnd: 0.20, run: 0.23, res: 0.28, viz: 0.44, thread: 0.31, reply: 0.35,
  replyEnd: 0.72, tick: 0.73, send: 0.76, closed: 0.80, unthread: 0.90 };
const STEP_DONE = [1.75, 4.35, 8.35, 16.15];
const N_REQ = REQUESTS.length;
const TABLE = TABLES[0];

// ---------- icons: UI chrome drawn in each product's own line style (Material Symbols for the console,
// Slack's rounded outline for Slack); none of them is a product mark ----------
const ms = (inner) => `<svg class="bq-i" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
const I = {
  menu: ms('<path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/>'),
  search: ms('<path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14"/>'),
  drop: ms('<path d="M7 10l5 5 5-5z"/>'),
  chevR: ms('<path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>'),
  close: ms('<path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>'),
  play: ms('<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 14.5v-9l6 4.5z"/>'),
  save: ms('<path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7zm2 16H5V5h11.17L19 7.83zm-7-7a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 6h9v4H6z"/>'),
  share: ms('<path d="M15 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>'),
  schedule: ms('<path d="M11.99 2A10 10 0 1 0 22 12 10 10 0 0 0 11.99 2zM12 20a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>'),
  more: ms('<path d="M12 8a2 2 0 1 0-2-2 2 2 0 0 0 2 2zm0 2a2 2 0 1 0 2 2 2 2 0 0 0-2-2zm0 6a2 2 0 1 0 2 2 2 2 0 0 0-2-2z"/>'),
  home: ms('<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>'),
  star: ms('<path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>'),
  starO: ms('<path d="m22 9.24-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28z"/>'),
  shared: ms('<path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a3.3 3.3 0 0 0 0-1.39l7.05-4.11A3 3 0 1 0 15 5a3.2 3.2 0 0 0 .04.7L8.04 9.81a3 3 0 1 0 0 4.38l7.12 4.16a2.8 2.8 0 0 0-.08.65A2.92 2.92 0 1 0 18 16.08z"/>'),
  history: ms('<path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 1 1 2.05 4.95l-1.42 1.42A9 9 0 1 0 13 3zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8z"/>'),
  dataset: ms('<path d="M3 3v18h18V3zm8 16H5v-6h6zm0-8H5V5h6zm8 8h-6v-6h6zm0-8h-6V5h6z"/>'),
  table: ms('<path d="M20 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zM8 19H5v-3h3zm0-5H5v-3h3zm0-5H5V5h3zm11 10H10v-3h9zm0-5h-9v-3h9zm0-5h-9V5h9z"/>'),
  query: ms('<path d="M11 3a8 8 0 1 0 4.9 14.3l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0 0 11 3zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm-3 7h2v3H8zm2.5-3h2v6h-2zm2.5 2h2v4h-2z"/>'),
  add: ms('<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/>'),
  addBox: ms('<path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4z"/>'),
  explore: ms('<path d="M12 10.9a1.1 1.1 0 1 0 1.1 1.1 1.1 1.1 0 0 0-1.1-1.1zM12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm2.19 12.19L6 18l3.81-8.19L18 6z"/>'),
  filter: ms('<path d="M10 18h4v-2h-4zM3 6v2h18V6zm3 7h12v-2H6z"/>'),
  check: ms('<path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>'),
  okCircle: ms('<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"/>'),
  bell: ms('<path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1z"/>'),
  help: ms('<path d="M11 18h2v-2h-2zm1-16a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-14a4 4 0 0 0-4 4h2a2 2 0 0 1 4 0c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5a4 4 0 0 0-4-4z"/>'),
  terminal: ms('<path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 14H4V8h16zm-2-1h-6v-2h6zM7.5 17l-1.41-1.41L8.67 13l-2.59-2.59L7.5 9l4 4z"/>'),
  sort: ms('<path d="M7 10l5 5 5-5z"/>'),
  // Slack (rounded outline)
  skHome: '<svg class="sk-i" viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 8.6 10 3.5l6.5 5.1V16a.9.9 0 0 1-.9.9h-3.4v-4.6H7.8v4.6H4.4a.9.9 0 0 1-.9-.9z"/></svg>',
  skDms: '<svg class="sk-i" viewBox="0 0 20 20" aria-hidden="true"><path d="M8.2 3.8a5.2 5.2 0 0 0-4.6 7.6l-.8 2.8 2.8-.8a5.2 5.2 0 1 0 2.6-9.6z"/><path d="M13.6 8.3a4.6 4.6 0 0 1 3.1 6.8l.7 2.5-2.5-.7a4.6 4.6 0 0 1-6.3-1.9"/></svg>',
  skAct: '<svg class="sk-i" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3.3a4.6 4.6 0 0 0-4.6 4.6v3.4l-1.6 2.6h12.4l-1.6-2.6V7.9A4.6 4.6 0 0 0 10 3.3z"/><path d="M8.2 16.4a1.9 1.9 0 0 0 3.6 0"/></svg>',
  skMore: '<svg class="sk-i sk-dots" viewBox="0 0 20 20" aria-hidden="true"><circle cx="5" cy="10" r="1.2"/><circle cx="10" cy="10" r="1.2"/><circle cx="15" cy="10" r="1.2"/></svg>',
  skSearch: '<svg class="sk-i" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.8" cy="8.8" r="5.3"/><path d="m12.8 12.8 4 4"/></svg>',
  skChev: '<svg class="sk-i" viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4"/></svg>',
  skPlus: '<svg class="sk-i" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4.5v11M4.5 10h11"/></svg>',
  skSend: '<svg class="sk-i sk-fill" viewBox="0 0 20 20" aria-hidden="true"><path d="M2.8 3.2 17.6 10 2.8 16.8l1.9-6.8zm1.9 6.8h6.8"/></svg>',
  skClose: '<svg class="sk-i" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg>',
  skEmoji: '<svg class="sk-i" viewBox="0 0 20 20" aria-hidden="true"><circle cx="9.4" cy="10.6" r="6"/><path d="M6.9 12.2a3 3 0 0 0 5 0"/><path d="M7.4 9h.1M11.4 9h.1"/><path d="M15.6 2.8v4M13.6 4.8h4"/></svg>',
  skCheck: '<svg class="sk-i" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10.4 3.2 3.2L15 6.8"/></svg>',
  skWf: '<svg class="sk-i" viewBox="0 0 20 20" aria-hidden="true"><path d="M11.2 2.8 5 11h4.6l-1 6.2L15 9h-4.6z"/></svg>',
  hudCheck: '<svg class="bq-hc" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.8 12.6 9 16.8 19.2 6.6"/></svg>',
};

// ---------- small helpers ----------
const $ = (s, root) => root.querySelector(s);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const setT = (n, s) => { if (n && n.textContent !== s) n.textContent = s; };
const setH = (n, s) => { if (n && n._h !== s) { n.innerHTML = s; n._h = s; } };
const fmtInt = (n) => Math.round(n).toLocaleString('en-US');
const isNum = (v) => /^-?[\d,]*\.?\d+%?$/.test(String(v).trim());
// Text that does not fit its box is cut at a WORD boundary and ends in an ellipsis (the lawyer spot's fitT)
const fontState = () => (document.fonts ? document.fonts.status : 'loaded');
const cutAt = (w, m) => w.slice(0, m).join(' ').replace(/[\s,;:(\-]+$/, '') + '…';
function fitT(n, s, ctx = '') {
  if (!n) return;
  const key = `${s}|${el && el.lay ? el.lay.W : 0}|${fontState()}|${ctx}`;
  if (n._fit === key && n.textContent === n._fitOut) return;
  if (n.textContent !== s) n.textContent = s;
  if (!n.clientWidth) { n._fit = null; return; }
  n._nowrap = getComputedStyle(n).whiteSpace === 'nowrap';
  const over = () => {
    // (a single-line box is judged on width only: its glyphs may overhang a line-height-1 box without wrapping)
    if (!n._nowrap) return n.scrollHeight > n.clientHeight + 0.5 || n.scrollWidth > n.clientWidth;
    const r = document.createRange(); r.selectNodeContents(n);
    return r.getBoundingClientRect().width > n.getBoundingClientRect().width + 0.01;
  };
  if (over()) {
    const w = s.split(' ');
    let lo = 1, hi = w.length - 1, best = 1;
    while (lo <= hi) { const m = (lo + hi) >> 1; n.textContent = cutAt(w, m); if (over()) hi = m - 1; else { best = m; lo = m + 1; } }
    n.textContent = cutAt(w, best);
  }
  n._fit = key; n._fitOut = n.textContent;
}

// ---------- GoogleSQL highlighting, in the BigQuery editor's token classes ----------
const KW = new Set(('SELECT FROM WHERE GROUP BY ORDER LIMIT AS AND OR NOT ON JOIN LEFT RIGHT INNER FULL OUTER USING WITH CASE ' +
  'WHEN THEN ELSE END DESC ASC IN IS NULL BETWEEN DISTINCT HAVING UNION ALL OVER PARTITION INTERVAL TRUE FALSE LIKE ' +
  'HOUR DAY MONTH YEAR DAYOFWEEK MINUTE WEEK QUARTER DATE TIMESTAMP').split(' '));
function sqlTokens(sql) {
  const out = [];
  const re = /(--[^\n]*)|('(?:[^'\\]|\\.)*'?)|(`[^`]*`?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|([^\sA-Za-z0-9_])/g;
  let m;
  while ((m = re.exec(sql))) {
    const s = m[0];
    let c = '';
    if (m[1]) c = 'cm';
    else if (m[2]) c = 'st';
    else if (m[3]) c = 'bt';
    else if (m[4]) c = 'nu';
    else if (m[5]) {
      const after = sql.slice(re.lastIndex).match(/^\s*\(/);
      const up = s.toUpperCase();
      if (after && !['IN', 'AS', 'USING', 'OVER'].includes(up)) c = 'fn';
      else if (KW.has(up)) c = 'kw';
    } else if (m[7]) c = 'op';
    out.push({ s, c });
  }
  return out;
}
// the first n characters of the tokenised SQL as highlighted HTML, one div per line
function sqlHTML(toks, n) {
  let left = n, html = '';
  for (const tk of toks) {
    if (left <= 0) break;
    const s = tk.s.slice(0, left);
    left -= s.length;
    html += tk.c ? `<span class="t-${tk.c}">${esc(s)}</span>` : esc(s);
  }
  return html;
}

let el = null;

// ---------- mount ----------
export function mount(section, ctx) {
  const asset = (n) => new URL(`../../img/${n}`, import.meta.url).href;
  const root = h(`<div class="bq-root"></div>`);
  const hudMark = ctx.shell.makeMark(26);
  const vizTypeOf = (m) => (m.chart.type === 'line' ? 'Line chart' : 'Bar chart');
  root.innerHTML = `
<div class="dk">
  <header class="gc-top">
    <span class="gc-menu">${I.menu}</span>
    <span class="gc-logo"><img src="${asset('google-cloud-logo.svg')}" alt="Google Cloud"/></span>
    <span class="gc-proj"><span class="gc-proj-dot">${I.dataset}</span><b>${esc(PROJECT)}</b>${I.drop}</span>
    <span class="gc-search">${I.search}<span class="gc-search-t">Search (/) for resources, docs, products, and more</span><span class="gc-search-b">Search</span></span>
    <span class="gc-right">
      <span class="gc-ic">${I.terminal}</span><span class="gc-ic gc-bell">${I.bell}</span><span class="gc-ic">${I.help}</span><span class="gc-ic">${I.more}</span>
      <span class="gc-av">S</span>
    </span>
  </header>

  <div class="dk-body">
    <section class="sk">
      <div class="sk-top"><span class="sk-sbox">${I.skSearch}<span>Search</span></span></div>
      <div class="sk-win">
        <nav class="sk-rail">
          <span class="sk-ws">S</span>
          <span class="sk-ri on"><span class="sk-rb">${I.skHome}</span><small>Home</small></span>
          <span class="sk-ri"><span class="sk-rb">${I.skDms}</span><small>DMs</small></span>
          <span class="sk-ri"><span class="sk-rb">${I.skAct}</span><small>Activity</small></span>
          <span class="sk-ri"><span class="sk-rb">${I.skMore}</span><small>More</small></span>
          <span class="sk-me">S<i></i></span>
        </nav>
        <div class="sk-pane">
          <div class="sk-ch">
            <div class="sk-ch-h"><b># data-requests</b>${I.skChev}</div>
            <div class="sk-feed">
              <div class="sk-intro">
                <b class="sk-intro-t"># data-requests</b>
                <p>This is the very beginning of the <b>#data-requests</b> channel.</p>
              </div>
            </div>
            <div class="sk-comp"><span class="sk-cplus">${I.skPlus}</span><span class="sk-cph">Message #data-requests</span><span class="sk-csend">${I.skSend}</span></div>
          </div>
          <div class="sk-th">
            <div class="sk-th-h"><b>Thread</b><small>#data-requests</small><span class="sk-th-x">${I.skClose}</span></div>
            <div class="sk-th-body">
              <div class="sk-th-parent"></div>
              <div class="sk-th-div"><span class="sk-th-n">1 reply</span><i></i></div>
              <div class="sk-th-reply"></div>
            </div>
            <div class="sk-th-comp">
              <div class="sk-th-box"><span class="sk-th-in"></span><span class="sk-th-ph">Reply…</span><span class="sk-th-send">${I.skSend}</span></div>
              <label class="sk-also"><span class="sk-cbx">${I.skCheck}</span>Also send to <b>#data-requests</b></label>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="bqs">
      <nav class="bq-nav">
        <span class="bq-nav-logo"><img src="${asset('bigquery-logo.svg')}" alt="BigQuery"/></span>
        <span class="bq-nav-i on">${I.explore}</span>
        <span class="bq-nav-i">${I.search}</span>
        <span class="bq-nav-i">${I.history}</span>
        <span class="bq-nav-i">${I.schedule}</span>
      </nav>
      <aside class="bq-exp">
        <div class="bq-exp-h"><b>Explorer</b><span class="bq-add">${I.add}Add data</span></div>
        <div class="bq-exp-s">Search for resources</div>
        <div class="bq-tree">
          <div class="bq-tn">${I.home}<span>Home</span></div>
          <div class="bq-tn">${I.star}<span>Starred</span></div>
          <div class="bq-tn">${I.shared}<span>Shared with me</span></div>
          <div class="bq-tn">${I.history}<span>Job history</span></div>
          <div class="bq-tn bq-tn-p"><span class="bq-car">${I.drop}</span><b>${esc(PROJECT)}</b></div>
          <div class="bq-tn bq-l1"><span class="bq-car bq-car-ds">${I.drop}</span>${I.dataset}<span>Datasets</span></div>
          <div class="bq-kids bq-kids-ds"></div>
          <div class="bq-tn bq-l1">${I.query}<span>Queries</span></div>
        </div>
      </aside>
      <div class="bq-work">
        <div class="bq-tabs">
          <span class="bq-tab bq-tab-home">${I.home}${I.drop}<span class="bq-tx">${I.close}</span></span>
          <span class="bq-tab bq-tab-tbl">${I.table}<span class="bq-tab-t">${esc(TABLE.name)}</span>${I.drop}<span class="bq-tx">${I.close}</span></span>
          <span class="bq-tab bq-tab-q">${I.query}<span class="bq-tab-t">Untitled query</span>${I.drop}<span class="bq-tx">${I.close}</span></span>
          <span class="bq-tab-add">${I.addBox}</span>
          <span class="bq-und"></span>
        </div>
        <div class="bq-views">
          <div class="bq-view bq-v-home">
            <div class="bq-home-h"><h3>Create new</h3></div>
            <div class="bq-create">
              <span class="bq-cbtn">${I.query}SQL query</span><span class="bq-cbtn">${I.dataset}Notebook</span>
              <span class="bq-cbtn">${I.table}Data canvas</span><span class="bq-cbtn">${I.table}Table</span>
            </div>
            <h3 class="bq-rec-h">Recent</h3>
            <div class="bq-grid bq-rec">
              <div class="bq-gr bq-gh"><span>Display name</span><span>Type</span><span>Project</span></div>
              ${[...new Set(TABLES.map((t) => t.dataset))].map((d) => `<div class="bq-gr">${I.dataset}<span class="bq-lnk">${esc(d)}</span><span>Dataset</span><span>${esc(PROJECT)}</span></div>`).join('')}
              ${TABLES.map((t) => `<div class="bq-gr">${I.table}<span class="bq-lnk">${esc(t.name)}</span><span>Table</span><span>${esc(t.project)}</span></div>`).join('')}
            </div>
          </div>

          <div class="bq-view bq-v-tbl">
            <div class="bq-th"><span class="bq-th-n">${I.table}<b>${esc(TABLE.name)}</b></span>
              <span class="bq-tact">${I.search}Query</span><span class="bq-tact">${I.share}Share</span><span class="bq-tact">${I.save}Copy</span></div>
            <div class="bq-subtabs"><span class="on">Schema</span><span>Details</span><span>Preview</span><span>Lineage</span></div>
            <div class="bq-sch-f">${I.filter}<b>Filter</b><span>Enter property name or value</span></div>
            <div class="bq-grid bq-sch">
              <div class="bq-gr bq-gh"><span class="c-f">Field name</span><span class="c-t">Type</span><span class="c-m">Mode</span><span class="c-d">Description</span></div>
              <div class="bq-sch-vp"><div class="bq-sch-in"></div></div>
            </div>
          </div>

          <div class="bq-view bq-v-q">
            <div class="bq-qbar">
              <span class="bq-qname">${I.query}<b>Untitled query</b></span>
              <span class="bq-run">${I.play}Run</span>
              <span class="bq-tb">${I.save}Save${I.drop}</span>
              <span class="bq-tb bq-off">${I.share}Share${I.drop}</span>
              <span class="bq-tb bq-off">${I.schedule}Schedule</span>
              <span class="bq-valid">${I.okCircle}</span>
              <span class="bq-tb-more">${I.more}</span>
            </div>
            <div class="bq-ed"><div class="bq-gut"></div><div class="bq-code"><div class="bq-code-in"></div><i class="bq-caret"></i></div></div>
            <div class="bq-res">
              <div class="bq-res-h"><b>Query results</b><span class="bq-res-st"></span></div>
              <div class="bq-rtabs"><span>Job information</span><span class="r-res">Results</span><span class="r-viz">Visualization</span><span>JSON</span><span>Execution details</span><span>Execution graph</span><i class="bq-rund"></i></div>
              <div class="bq-rbody">
                <div class="bq-rempty">Run a query to see its results here</div>
                <div class="bq-grid bq-out"></div>
                <div class="bq-viz">
                  <div class="bq-chart"></div>
                  <div class="bq-vcfg">
                    <b class="bq-vcfg-h">Visualization configuration</b>
                    <div class="bq-fld"><small>Visualization type</small><span class="bq-v-type"></span>${I.drop}</div>
                    <div class="bq-fld"><small>Dimension</small><span class="bq-v-x"></span>${I.drop}</div>
                    <div class="bq-fld"><small>Measure</small><span class="bq-v-y"></span>${I.drop}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>

  <footer class="dk-foot">
    <span class="dk-fc"><small>Requests answered</small><b class="dk-fa">0</b></span>
    <span class="dk-fc"><small>Queries run</small><b class="dk-fq">0</b></span>
    <span class="dk-fc"><small>Charts shared</small><b class="dk-fch">0</b></span>
    <span class="dk-foot-r">BigQuery Studio and Slack, superbot working as you</span>
  </footer>

  <div class="bq-hud">
    <div class="bq-hud-h"><span class="bq-hud-mark"></span><span class="bq-hud-cur">Opening your request queue</span></div>
    <ul class="bq-hud-steps">${['Connected to BigQuery and Slack', 'Matched your SQL style and Slack voice', 'Read the data dictionary', 'Answering #data-requests'].map((s) => `<li><i></i>${esc(s)}</li>`).join('')}</ul>
    <div class="bq-hud-voice">
      <div class="bq-hud-lane"><b>Your SQL</b><span class="bq-hud-bars" data-l="you"></span></div>
      <div class="bq-hud-lane sb"><b>Superbot</b><span class="bq-hud-bars" data-l="sb"></span></div>
      <div class="bq-hud-mh"><span class="bq-hud-ok bq-ok-sql">${I.hudCheck}your SQL style</span><span class="bq-hud-ok bq-ok-sk">${I.hudCheck}your Slack voice</span></div>
    </div>
    <div class="bq-hud-res"><b>What the data dictionary warns</b><div class="bq-hud-chips"></div></div>
  </div>
</div>`;
  section.appendChild(root);
  $('.bq-hud-mark', root).appendChild(hudMark.el);

  // ---- Explorer: project > Datasets > each dataset > its tables (expanded in LEARN) ----
  const kidsDs = $('.bq-kids-ds', root);
  const dsNames = [...new Set(TABLES.map((t) => t.dataset))];
  const treeRows = [];     // rows that unfold in LEARN, in order: { n, at }
  dsNames.forEach((d, di) => {
    const dn = h(`<div class="bq-tn bq-l2"><span class="bq-car">${I.drop}</span>${I.dataset}<span>${esc(d)}</span></div>`);
    kidsDs.appendChild(dn);
    treeRows.push({ n: dn, ds: true, first: di === 0 });
    TABLES.filter((t) => t.dataset === d).forEach((t) => {
      const tn = h(`<div class="bq-tn bq-l3${t === TABLE ? ' bq-sel-t' : ''}">${I.table}<span>${esc(t.name)}</span></div>`);
      kidsDs.appendChild(tn);
      treeRows.push({ n: tn, ds: false, isMain: t === TABLE });
    });
  });

  // ---- LEARN: the main table's schema, the data dictionary's notes in the Description column ----
  // each dictionary note goes in the Description of the column the research pass tied it to (matched without case:
  // the dictionary writes airport_fee, the file's column is Airport_fee); notes on another table's column or on the
  // publisher page as a whole have no row in this table's schema and stay off this view
  const cols = TABLE.columns.map((c) => ({ ...c, notes: [] }));
  LEARN.forEach((f, i) => {
    const hit = f.column && cols.find((c) => c.name.toLowerCase() === String(f.column).toLowerCase());
    if (hit) hit.notes.push({ f, i });
  });
  const NOTES_ON = cols.reduce((a, c) => a + c.notes.length, 0);
  const schIn = $('.bq-sch-in', root);
  const schRows = [];
  const noteRow = (name, type, mode, note) => {
    const n = h(`<div class="bq-gr bq-srow${note ? ' has' : ''}"><span class="c-f">${esc(name)}</span><span class="c-t">${esc(type)}</span><span class="c-m">${esc(mode)}</span><span class="c-d"><span class="bq-fit">${note ? esc(note.f.quote) : ''}</span></span></div>`);
    schIn.appendChild(n);
    schRows.push({ n, note: note ? note.i : -1 });
  };
  for (const c of cols) {
    if (!c.notes.length) noteRow(c.name, c.bqType, 'NULLABLE', null);
    c.notes.forEach((nt, k) => noteRow(k ? '' : c.name, k ? '' : c.bqType, k ? '' : 'NULLABLE', nt));
  }

  // ---- Slack: every request message (posted by the workflow) and every reply sent back to the channel ----
  const feed = $('.sk-feed', root);
  const intro = $('.sk-intro', feed);
  const reqMsg = (r) => `<div class="sk-msg sk-req">
      <span class="sk-av sk-av-wf">${I.skWf}</span>
      <div class="sk-mb">
        <div class="sk-mh"><b>Data request</b><span class="sk-badge">WORKFLOW</span></div>
        <div class="sk-f"><b>Team:</b> <span>${esc(r.team)}</span></div>
        <div class="sk-f sk-f-q"><b>Question:</b> <span class="sk-q">${esc(r.ask)}</span></div>
        <div class="sk-rx"><span class="sk-pill sk-p-eyes"><i>👀</i>1</span><span class="sk-pill sk-p-ok"><i>✅</i>1</span></div>
        <div class="sk-tl"><span class="sk-av sk-av-me sk-av-s">S</span><b>1 reply</b><small>View thread</small></div>
      </div></div>`;
  const items = [];
  // The queue is already in the channel when the desk opens (the signin card counts it: "12 in queue"): all twelve
  // workflow messages were posted before superbot arrived, oldest at the top in the order they are picked up, and the
  // channel is scrolled to the newest like Slack's own. Their `at` sits before t = 0 so they are fully in place from
  // the first desk frame; only the reactions and "1 reply" change on them (tAns / tRes).
  const byPick = REQUESTS.map((r, i) => i).sort((a, b) => REQUESTS[a].tAns - REQUESTS[b].tAns);
  REQUESTS.forEach((r, i) => {
    const n = h(reqMsg(r));
    feed.appendChild(n);
    const q = $('.sk-q', n);
    q._src = r.ask;
    items.push({ kind: 'req', i, r, n, at: -2 + 0.01 * byPick.indexOf(i), q, rx: $('.sk-rx', n), eyes: $('.sk-p-eyes', n), ok: $('.sk-p-ok', n), tl: $('.sk-tl', n) });
    // the answer, sent to the channel from the thread ("Also send to #data-requests"): Slack posts the same message
    // that went into the thread, so a main's broadcast is its thread reply word for word
    const said = r.main !== undefined && MAINS[r.main] ? MAINS[r.main].reply : r.answer;
    const b = h(`<div class="sk-msg sk-bc">
      <span class="sk-av sk-av-me">S</span>
      <div class="sk-mb">
        <div class="sk-rt">replied to a thread: <span class="sk-rt-q">${esc(r.ask)}</span></div>
        <div class="sk-mh"><b>Sam R.</b></div>
        <div class="sk-tx">${esc(said)}</div>
      </div></div>`);
    feed.appendChild(b);
    const bq = $('.sk-rt-q', b), bt = $('.sk-tx', b);
    bq._src = r.ask; bt._src = said;
    items.push({ kind: 'bc', i, r, n: b, at: r.tRes, fits: [bq, bt] });
  });
  items.sort((a, b) => a.at - b.at);

  // ---- the thread panel's parent message, one per main ----
  const thParent = $('.sk-th-parent', root), thReply = $('.sk-th-reply', root);
  const parents = MAINS.map((m, k) => {
    const r = REQUESTS[k];
    const n = h(reqMsg(r));
    n.classList.add('sk-thp');
    thParent.appendChild(n);
    return n;
  });
  const replies = MAINS.map((m, k) => {
    const n = h(`<div class="sk-msg sk-rp"><span class="sk-av sk-av-me">S</span><div class="sk-mb">
      <div class="sk-mh"><b>Sam R.</b></div><div class="sk-tx"></div><div class="sk-att"><div class="bq-chart bq-chart-mini"></div></div></div></div>`);
    thReply.appendChild(n);
    return { n, tx: $('.sk-tx', n), att: $('.sk-att', n), chart: $('.bq-chart', n) };
  });

  // ---- results grids and charts, one per main ----
  const outBox = $('.bq-out', root);
  const grids = MAINS.map((m, k) => {
    const r = REQUESTS[k];
    const cols = r.result.cols;
    const g = h(`<div class="bq-rg" style="--nc:${cols.length}">
      <div class="bq-gr bq-gh"><span class="c-row">Row</span>${cols.map((c) => `<span>${esc(c)}${I.sort}</span>`).join('')}</div>
      ${r.result.rows.map((row, ri) => `<div class="bq-gr bq-rr"><span class="c-row">${ri + 1}</span>${row.map((v) => `<span class="${isNum(v) ? 'num' : ''}">${esc(v)}</span>`).join('')}</div>`).join('')}
    </div>`);
    outBox.appendChild(g);
    return { g, rows: [...g.querySelectorAll('.bq-rr')] };
  });
  const chartBox = $('.bq-v-q .bq-chart', root);
  const charts = MAINS.map((m) => buildChart(chartBox, m.chart, false));
  const minis = MAINS.map((m, k) => buildChart(replies[k].chart, m.chart, true));

  // ---- SQL, tokenised once per main ----
  const sqls = MAINS.map((m, k) => {
    const sql = REQUESTS[k].sql;
    return { sql, toks: sqlTokens(sql), lines: sql.split('\n') };
  });

  // ---- the HUD's style lanes: 26 deterministic bars each ----
  const lane = (which) => {
    const box = $(`.bq-hud-bars[data-l="${which}"]`, root);
    const out = [];
    for (let i = 0; i < 26; i++) { const b = document.createElement('i'); box.appendChild(b); out.push(b); }
    return out;
  };
  const barsYou = lane('you'), barsSb = lane('sb');
  const YOU = Array.from({ length: 26 }, (_, i) => clamp(0.26 + 0.74 * Math.abs(Math.sin(i * 0.58 + 0.7)) * (0.52 + 0.48 * Math.abs(Math.sin(i * 0.21 + 1.3))) * (0.68 + 0.32 * rand(i + 3)), 0, 1));
  const OTHER = YOU.map((_, i) => clamp(0.24 + 0.76 * YOU[(i * 5 + 3) % 26], 0, 1));
  const chipBox = $('.bq-hud-chips', root);
  const resChips = CHIPS.map((r) => {
    const n = h(`<span class="bq-hud-chip">${I.hudCheck}${esc(r)}</span>`);
    chipBox.appendChild(n);
    return n;
  });

  el = {
    root, hudMark, dk: $('.dk', root),
    // console + BigQuery
    tabHome: $('.bq-tab-home', root), tabTbl: $('.bq-tab-tbl', root), tabQ: $('.bq-tab-q', root), und: $('.bq-und', root),
    vHome: $('.bq-v-home', root), vTbl: $('.bq-v-tbl', root), vQ: $('.bq-v-q', root),
    carDs: $('.bq-car-ds', root), kidsDs, treeRows, schIn, schRows, schVp: $('.bq-sch-vp', root), notesOn: NOTES_ON,
    run: $('.bq-run', root), valid: $('.bq-valid', root), gut: $('.bq-gut', root), code: $('.bq-code-in', root), caret: $('.bq-caret', root),
    resSt: $('.bq-res-st', root), rTabRes: $('.r-res', root), rTabViz: $('.r-viz', root), rund: $('.bq-rund', root),
    rempty: $('.bq-rempty', root), outBox, grids, viz: $('.bq-viz', root), charts, minis,
    vType: $('.bq-v-type', root), vX: $('.bq-v-x', root), vY: $('.bq-v-y', root), sqls, vizTypeOf,
    // Slack
    feed, intro, items, th: $('.sk-th', root), thBody: $('.sk-th-body', root), parents, replies, thDiv: $('.sk-th-div', root),
    thIn: $('.sk-th-in', root), thPh: $('.sk-th-ph', root), thSend: $('.sk-th-send', root), cbx: $('.sk-cbx', root),
    // footer + HUD
    fa: $('.dk-fa', root), fq: $('.dk-fq', root), fch: $('.dk-fch', root),
    hudCur: $('.bq-hud-cur', root), hudSteps: [...root.querySelectorAll('.bq-hud-steps li')],
    hudVoice: $('.bq-hud-voice', root), okSql: $('.bq-ok-sql', root), okSk: $('.bq-ok-sk', root),
    hudRes: $('.bq-hud-res', root), resChips,
    barsYou, barsSb, YOU, OTHER, lay: null,
    fits: [...root.querySelectorAll('.bq-fit')].map((n) => { n._src = n.textContent; return n; }),
  };
  return el;
}

// ---------- the charts: the query-results Visualization look (Vega-Lite style, ref 17/18) ----------
// the y scale the way Vega-Lite draws it (d3's linear ticks: a 1 / 2 / 5 x 10^k step for about five ticks, the
// domain niced up to the next step) and its tick labels in d3's default "," format, as the ref chart shows (70,000)
function niceTicks(v, count = 5) {
  if (!(v > 0)) return { max: 1, ticks: [0, 1] };
  const raw = v / count, p = Math.pow(10, Math.floor(Math.log10(raw))), e = raw / p;
  const step = (e >= Math.sqrt(50) ? 10 : e >= Math.sqrt(10) ? 5 : e >= Math.sqrt(2) ? 2 : 1) * p;
  const max = Math.ceil(v / step) * step;
  const ticks = [];
  for (let x = 0; x <= max + step / 2; x += step) ticks.push(x);
  return { max, ticks };
}
const tickFmt = (v) => (Number.isInteger(v) ? fmtInt(v) : v.toLocaleString('en-US'));
function buildChart(box, c, mini) {
  // the Slack attachment is a picture of the SAME chart, only smaller: same ticks, titles and bar order
  const { max, ticks } = niceTicks(Math.max(...c.y), 5);
  const n = c.y.length;
  const wrap = h(`<div class="ch ch-t-${c.type}${mini ? ' ch-mini' : ''}">
    <div class="ch-plot">
      <span class="ch-ytitle">${esc(c.yTitle)}</span>
      <div class="ch-yax">${ticks.map((v) => `<span style="bottom:${(100 * v / max).toFixed(2)}%">${esc(tickFmt(v))}</span>`).join('')}</div>
      <div class="ch-area">
        ${ticks.map((v) => `<i class="ch-grid" style="bottom:${(100 * v / max).toFixed(2)}%"></i>`).join('')}
        ${c.type === 'line'
    ? `<svg class="ch-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${c.y.map((v, i) => `${((i + 0.5) * 100 / n).toFixed(3)},${(100 - 100 * v / max).toFixed(3)}`).join(' ')}"/></svg>
             ${c.y.map((v, i) => `<i class="ch-pt" style="left:${((i + 0.5) * 100 / n).toFixed(3)}%;bottom:${(100 * v / max).toFixed(3)}%"></i>`).join('')}`
    : c.y.map((v, i) => `<i class="ch-bar" style="left:${(i * 100 / n + 100 / n * 0.08).toFixed(3)}%;width:${(100 / n * 0.84).toFixed(3)}%;height:${(100 * v / max).toFixed(3)}%"></i>`).join('')}
      </div>
    </div>
    <div class="ch-xax">${c.x.map((x) => `<span>${esc(x)}</span>`).join('')}</div>
    <b class="ch-xtitle">${esc(c.xTitle)}</b>
  </div>`);
  // the tick-label column is as wide as its longest label ("8,000,000" needs more than "1,400")
  const chars = Math.max(...ticks.map((v) => tickFmt(v).length));
  wrap.style.setProperty('--yax', `${Math.max(mini ? 30 : 40, Math.ceil(chars * (mini ? 4.4 : 6.2) + (mini ? 8 : 12)))}px`);
  box.appendChild(wrap);
  return { n: wrap, yt: wrap.querySelector('.ch-ytitle'), ya: wrap.querySelector('.ch-yax'), bars: [...wrap.querySelectorAll('.ch-bar')], pts: [...wrap.querySelectorAll('.ch-pt')], line: wrap.querySelector('.ch-line polyline') };
}
function drawChart(ch, p) {
  ch.bars.forEach((b, i) => {
    const q = outCubic(clamp(p * (1 + ch.bars.length * 0.12) - i * 0.12));
    b.style.transform = `scaleY(${q.toFixed(4)})`;
  });
  if (ch.line) {
    ch.line.style.strokeDasharray = '1000';
    ch.line.style.strokeDashoffset = (1000 * (1 - outCubic(p))).toFixed(2);
    ch.pts.forEach((d, i) => { d.style.opacity = seg(p, i / ch.pts.length, i / ch.pts.length + 0.2).toFixed(3); });
  }
}

// ---------- per-frame render ----------
function callState(t) {
  for (let i = 0; i < WINS.length; i++) {
    if (t >= WINS[i][0] && t < WINS[i][1]) return { i, a: WINS[i][0], b: WINS[i][1] };
  }
  if (t >= WINS[2][1]) return { i: 2, a: WINS[2][0], b: WINS[2][1], done: true };
  return null;
}
const st = (c, k) => c.a + FR[k] * (c.b - c.a);
const winOf = (i) => ({ a: WINS[i][0], b: WINS[i][1] });

function counts(t) {
  const answered = REQUESTS.filter((r) => t >= r.tRes).length;
  const queries = WINS.filter((w, i) => t >= st(winOf(i), 'run')).length;
  const charts = WINS.filter((w, i) => t >= st(winOf(i), 'send')).length;
  return { answered, queries, charts };
}

function renderChrome(t) {
  const c = counts(t);
  // the tally lives in the footer only (the HUD's copy of the same three numbers was dropped)
  setT(el.fa, String(c.answered)); setT(el.fq, String(c.queries)); setT(el.fch, String(c.charts));
  el.root.classList.toggle('live', t >= 0.55);
}

// the tab strip: Home -> the table tab (LEARN) -> Untitled query (ANSWER); the underline slides between them
function renderViews(t) {
  const tblIn = outCubic(seg(t, LEARN_B.a + 0.10, LEARN_B.a + 0.40));
  const qIn = outCubic(seg(t, 8.45, 8.75));
  el.tabTbl.style.display = t >= LEARN_B.a + 0.10 ? '' : 'none';
  el.tabTbl.style.opacity = tblIn.toFixed(3);
  el.tabQ.style.display = t >= 8.45 ? '' : 'none';
  el.tabQ.style.opacity = qIn.toFixed(3);
  const toTbl = inOutCubic(seg(t, LEARN_B.a + 0.15, LEARN_B.a + 0.45));
  const toQ = inOutCubic(seg(t, 8.50, 8.80));
  const tblOn = toTbl * (1 - toQ), qOn = toQ, homeOn = (1 - toTbl) * (1 - toQ);
  el.vHome.style.opacity = homeOn.toFixed(3);
  el.vTbl.style.opacity = tblOn.toFixed(3);
  el.vQ.style.opacity = qOn.toFixed(3);
  el.vHome.style.visibility = homeOn > 0.002 ? '' : 'hidden';
  el.vTbl.style.visibility = tblOn > 0.002 ? '' : 'hidden';
  el.vQ.style.visibility = qOn > 0.002 ? '' : 'hidden';
  // the underline (measured per frame: the bundled fonts may land after mount)
  const a = el.tabHome, b = t >= LEARN_B.a + 0.10 ? el.tabTbl : a, q = t >= 8.45 ? el.tabQ : b;
  let l = lerp(a.offsetLeft, b.offsetLeft, toTbl), w = lerp(a.offsetWidth, b.offsetWidth, toTbl);
  if (toQ > 0) { l = lerp(l, q.offsetLeft, toQ); w = lerp(w, q.offsetWidth, toQ); }
  el.und.style.left = l.toFixed(2) + 'px';
  el.und.style.width = w.toFixed(2) + 'px';
  const on = qOn > 0.5 ? el.tabQ : tblOn > 0.5 ? el.tabTbl : el.tabHome;
  for (const tb of [el.tabHome, el.tabTbl, el.tabQ]) tb.classList.toggle('on', tb === on);
}

// LEARN: the Explorer unfolds to the dataset and its tables, the main table opens on its Schema tab and the
// dictionary's notes scroll past in the Description column
function renderLearn(t) {
  const open = t >= LEARN_B.a;
  el.carDs.classList.toggle('open', open);
  el.treeRows.forEach((r, i) => {
    const at = LEARN_B.a + 0.04 + i * 0.07;
    const p = outCubic(seg(t, at, at + 0.25));
    r.n.style.display = t >= at ? '' : 'none';
    r.n.style.opacity = p.toFixed(3);
    r.n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * -6).toFixed(2)}px)`;
    if (r.ds) r.n.querySelector('.bq-car').classList.toggle('open', t >= at + 0.1);
    if (r.isMain) r.n.classList.toggle('sel', t >= LEARN_B.a + 0.10);
  });
  const c = outCubic(seg(t, LEARN_B.a + 0.30, 7.40));
  const vpH = el.schVp.clientHeight || 400;
  const inH = el.schIn.scrollHeight;
  const y = -lerp(0, Math.max(0, inH - vpH), c);
  el.schIn.style.transform = `translateY(${Math.min(0, y).toFixed(2)}px)`;
  // the note row nearest the middle of the viewport is highlighted as the list scrolls past
  const mid = -Math.min(0, y) + vpH / 2;
  let best = null, bd = Infinity;
  for (const r of el.schRows) if (r.note >= 0) { const d = Math.abs(r.n.offsetTop + r.n.offsetHeight / 2 - mid); if (d < bd) { bd = d; best = r; } }
  for (const r of el.schRows) r.n.classList.toggle('reading', r === best && c > 0 && c < 1);
  const fade = 26 * clamp(4 * Math.min(c, 1 - c));
  const fs = fade.toFixed(1) + 'px';
  if (el.schVp.style.getPropertyValue('--fade') !== fs) el.schVp.style.setProperty('--fade', fs);
}

// the Slack channel: bottom-anchored like Slack's own; each item slides in at the bottom at its time and pushes the
// older ones up; an item pushed out past the top fades
function renderFeed(t) {
  const vpH = el.feed.clientHeight;
  const heights = el.items.map((it) => it.n.offsetHeight + 0);
  const eases = el.items.map((it) => outCubic(seg(t, it.at, it.at + 0.42)));
  let below = 0;   // how much of the stack sits under this item
  for (let k = el.items.length - 1; k >= 0; k--) {
    const it = el.items[k];
    if (t < it.at) { it.n.style.opacity = '0'; it.n.style.transform = `translateY(${vpH}px)`; it.n.style.visibility = 'hidden'; continue; }
    const top = vpH - below - heights[k] * eases[k];
    below += heights[k] * eases[k];
    it.n.style.visibility = '';
    it.n.style.transform = `translateY(${top.toFixed(2)}px)`;
    const fold = clamp((top + heights[k] * 0.6) / (heights[k] * 0.6));
    it.n.style.opacity = (seg(t, it.at, it.at + 0.26) * fold).toFixed(3);
    if (it.kind === 'req') {
      const r = it.r;
      const ans = t >= r.tAns, res = t >= r.tRes;
      it.eyes.style.display = ans && !res ? '' : 'none';
      it.ok.style.display = res ? '' : 'none';
      const rxp = outCubic(seg(t, r.tAns, r.tAns + 0.2));
      const tlp = outCubic(seg(t, r.tRes, r.tRes + 0.25));
      it.rx.style.opacity = ans ? rxp.toFixed(3) : '0';
      it.tl.style.opacity = res ? tlp.toFixed(3) : '0';
      // a message with no reaction and no reply yet has no empty rows under it (Slack adds each row when it
      // appears); the rows open with their fade so the stack grows smoothly instead of jumping
      const rh = ans ? rxp : 0, th = res ? tlp : 0;
      it.rx.style.height = (24 * rh).toFixed(2) + 'px'; it.rx.style.marginTop = (4 * rh).toFixed(2) + 'px';
      it.tl.style.height = (28 * th).toFixed(2) + 'px'; it.tl.style.marginTop = (2 * th).toFixed(2) + 'px';
      it.n.classList.toggle('work', ans && !res);
      fitT(it.q, it.q._src);
    } else {
      for (const f of it.fits) fitT(f, f._src);
    }
  }
  // the channel intro sits above the stack until it is pushed out
  const itop = vpH - below - el.intro.offsetHeight;
  el.intro.style.transform = `translateY(${itop.toFixed(2)}px)`;
  el.intro.style.opacity = clamp((itop + el.intro.offsetHeight * 0.6) / (el.intro.offsetHeight * 0.6)).toFixed(3);
}

// ANSWER, one main at a time: SQL -> Run -> Results -> Visualization in BigQuery, then the Slack thread reply
function renderCall(t) {
  const c = callState(t);
  // the thread panel slides over the channel while the reply is written, and away again once it is sent
  let thOn = 0;
  if (c) thOn = outCubic(seg(t, st(c, 'thread'), st(c, 'thread') + 0.24)) * (1 - inOutCubic(seg(t, st(c, 'unthread'), st(c, 'unthread') + 0.24)));
  el.th.style.transform = `translateX(${((1 - thOn) * 104).toFixed(2)}%)`;
  el.th.style.visibility = thOn > 0.002 ? '' : 'hidden';
  if (!c) {
    setH(el.code, ''); setH(el.gut, '<span>1</span>');
    el.caret.style.opacity = t >= ANSWER.a ? '1' : '0';
    el.rempty.style.display = ''; el.outBox.style.display = 'none'; el.viz.style.display = 'none';
    setT(el.resSt, '');
    el.rTabRes.classList.remove('on'); el.rTabViz.classList.remove('on'); el.rund.style.opacity = '0';
    el.valid.style.opacity = '0';
    return;
  }
  const k = c.i, m = MAINS[k], s = el.sqls[k];
  // the SQL types in (the editor is cleared as the next request is opened)
  const cps = Math.max(60, s.sql.length / ((FR.sqlEnd - FR.sql) * (c.b - c.a)));
  const n = streamCount(s.sql, st(c, 'sql'), cps, t);
  const html = sqlHTML(s.toks, n);
  if (el.code._h !== html) {
    el.code.innerHTML = html.split('\n').map((ln) => `<div class="bq-ln">${ln || '&#8203;'}</div>`).join('');
    el.code._h = html;
  }
  const nl = Math.max(1, s.sql.slice(0, n).split('\n').length);
  setH(el.gut, Array.from({ length: nl }, (_, i) => `<span${i === nl - 1 ? ' class="cur"' : ''}>${i + 1}</span>`).join(''));
  // the caret sits after the last typed character
  const typing = n < s.sql.length;
  el.caret.style.opacity = typing || t < st(c, 'run') ? '1' : '0';
  const lines = el.code.children;
  const last = lines[lines.length - 1];
  if (last) {
    const r = document.createRange();
    r.selectNodeContents(last);
    const rect = r.getBoundingClientRect(), base = el.code.getBoundingClientRect();
    const S = el.lay ? el.lay.S : 1;
    el.caret.style.transform = `translate(${((rect.width ? rect.right - base.left : 0) / S).toFixed(1)}px, ${((last.offsetTop)).toFixed(1)}px)`;
  }
  el.valid.style.opacity = outCubic(seg(t, st(c, 'sqlEnd'), st(c, 'sqlEnd') + 0.15)).toFixed(3);
  // Run is pressed
  const at = st(c, 'run');
  const pr = press(t, at, 0.08, 0.10, 0.16);
  el.run.style.transform = `scale(${(1 - 0.06 * pr).toFixed(4)})`;
  el.run.classList.toggle('press', pr > 0.05);
  // results, then the Visualization tab
  const hasRes = t >= st(c, 'res');
  const toViz = t >= st(c, 'viz');
  el.rempty.style.display = t >= at - 0.05 ? 'none' : '';
  setT(el.resSt, t >= at + 0.05 && !hasRes ? 'Running…' : hasRes ? 'Query completed' : '');
  el.outBox.style.display = hasRes && !toViz ? '' : 'none';
  el.viz.style.display = toViz ? '' : 'none';
  el.rTabRes.classList.toggle('on', hasRes && !toViz);
  el.rTabViz.classList.toggle('on', toViz);
  el.rund.style.opacity = hasRes ? '1' : '0';
  const tabEl = toViz ? el.rTabViz : el.rTabRes;
  const slide = toViz ? inOutCubic(seg(t, st(c, 'viz'), st(c, 'viz') + 0.2)) : 1;
  const l0 = el.rTabRes.offsetLeft, w0 = el.rTabRes.offsetWidth;
  const l = toViz ? lerp(l0, tabEl.offsetLeft, slide) : l0, w = toViz ? lerp(w0, tabEl.offsetWidth, slide) : w0;
  el.rund.style.left = l.toFixed(2) + 'px'; el.rund.style.width = w.toFixed(2) + 'px';
  el.grids.forEach((g, gi) => {
    g.g.style.display = gi === k ? '' : 'none';
    if (gi === k) g.rows.forEach((row, ri) => { row.style.opacity = outCubic(seg(t, st(c, 'res') + ri * 0.04, st(c, 'res') + ri * 0.04 + 0.2)).toFixed(3); });
  });
  el.charts.forEach((ch, ci) => {
    ch.n.style.display = ci === k ? '' : 'none';
    if (ci === k) {
      // the x labels start where the plot does (after the wrapped y title and the tick labels)
      const yw = `${ch.yt.offsetWidth + ch.ya.offsetWidth}px`;
      if (ch.n.style.getPropertyValue('--yw') !== yw) ch.n.style.setProperty('--yw', yw);
      drawChart(ch, seg(t, st(c, 'viz') + 0.05, st(c, 'viz') + 0.55));
    }
  });
  setT(el.vType, el.vizTypeOf(m));
  setT(el.vX, REQUESTS[k].result.cols[0] || '');
  setT(el.vY, REQUESTS[k].result.cols[REQUESTS[k].result.cols.length > 1 ? 1 : 0] || '');

  // the Slack thread: the request, then Sam's reply typed, "Also send to #data-requests" ticked, Send
  el.parents.forEach((p, pi) => { p.style.display = pi === k ? '' : 'none'; });
  const sent = t >= st(c, 'send');
  el.replies.forEach((r, ri) => {
    r.n.style.display = ri === k && sent ? '' : 'none';
    if (ri === k) {
      setT(r.tx, m.reply);
      const p = outCubic(seg(t, st(c, 'send'), st(c, 'send') + 0.25));
      r.n.style.opacity = p.toFixed(3);
      r.n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 10).toFixed(2)}px)`;
      const mc = el.minis[ri];
      const myw = `${mc.yt.offsetWidth + mc.ya.offsetWidth}px`;
      if (mc.n.style.getPropertyValue('--yw') !== myw) mc.n.style.setProperty('--yw', myw);
      // an attached image: it lands whole with the message (fades in with it), bars never mid-growth
      drawChart(mc, 1);
    }
  });
  el.thDiv.style.opacity = sent ? '1' : '0';
  // a short thread panel (portrait) scrolls so the reply that just landed is in view, as Slack keeps the newest
  const over = Math.max(0, el.thBody.scrollHeight - el.thBody.clientHeight);
  el.thBody.scrollTop = sent ? over * outCubic(seg(t, st(c, 'send') + 0.05, st(c, 'send') + 0.35)) : 0;
  el.parents[k].querySelector('.sk-rx').style.opacity = '1';
  el.parents[k].querySelector('.sk-p-eyes').style.display = t < REQUESTS[k].tRes ? '' : 'none';
  el.parents[k].querySelector('.sk-p-ok').style.display = t >= REQUESTS[k].tRes ? '' : 'none';
  el.parents[k].querySelector('.sk-tl').style.opacity = '0';
  // the composer: the reply streams in whole (Slack's box grows with the text, then scrolls to keep the caret line in
  // view; nothing is cut with an ellipsis), then clears on Send
  const replyText = m.reply;
  const rate = replyText.length / ((FR.replyEnd - FR.reply) * (c.b - c.a));
  const nr = sent ? 0 : streamCount(replyText, st(c, 'reply'), rate, t);
  setT(el.thIn, replyText.slice(0, nr));
  el.thIn.scrollTop = el.thIn.scrollHeight;
  el.thPh.style.opacity = nr > 0 ? '0' : '1';
  const ticked = t >= st(c, 'tick') && !sent ? true : t >= st(c, 'tick');
  el.cbx.classList.toggle('on', ticked && t < st(c, 'unthread') + 0.3);
  const sp = press(t, st(c, 'send'), 0.07, 0.08, 0.14);
  el.thSend.classList.toggle('ready', nr > 0 && !sent);
  el.thSend.style.transform = `scale(${(1 - 0.1 * sp).toFixed(4)})`;
}

function renderHud(t) {
  const cur = t < 1.50 ? 'Opening your request queue'
    : t < VOICE.a ? 'BigQuery and Slack connected'
      : t < 4.30 ? 'Matching your SQL style and Slack voice'
        : t < LEARN_B.a ? 'Style matched'
          : t < 8.30 ? 'Reading the data dictionary'
            : t < LAND.a ? 'Answering #data-requests' : `Queue clear · ${N_REQ} requests answered`;
  setT(el.hudCur, cur);
  el.hudSteps.forEach((li, i) => {
    const done = t >= STEP_DONE[i];
    const cur2 = !done && t >= (i === 0 ? 0 : STEP_DONE[i - 1]);
    li.classList.toggle('done', done);
    li.classList.toggle('cur', cur2);
    const dot = li.firstElementChild;
    if (cur2) {
      const b = 0.5 - 0.5 * Math.cos((t - (i === 0 ? 0 : STEP_DONE[i - 1])) * Math.PI * 2 / 1.1);
      dot.style.boxShadow = `inset 0 0 0 1.5px #34c759, 0 0 0 ${(1 + 3 * b).toFixed(2)}px rgba(52,199,89,${(0.35 * (1 - b)).toFixed(3)})`;
    } else if (dot.style.boxShadow) dot.style.boxShadow = '';
  });
  // the style panel (VOICE): no score and no count, just a tick on each once the lanes agree
  const vo = inOutCubic(seg(t, VOICE.a + 0.04, VOICE.a + 0.34)) * (1 - inOutCubic(seg(t, 4.40, 4.72)));
  el.hudVoice.style.maxHeight = (110 * vo).toFixed(1) + 'px';
  el.hudVoice.style.opacity = vo.toFixed(3);
  if (vo > 0.01) {
    const cv = outCubic(seg(t, VOICE.a + 0.25, 4.15));
    const play = t * 2.6;
    for (let i = 0; i < 26; i++) {
      const swell = 0.62 + 0.38 * Math.abs(Math.sin(i * 0.34 - play));
      el.barsYou[i].style.height = (3 + 21 * el.YOU[i] * swell).toFixed(2) + 'px';
      el.barsSb[i].style.height = (3 + 21 * lerp(el.OTHER[i], el.YOU[i], cv) * (0.62 + 0.38 * Math.abs(Math.sin(i * 0.34 - play + 1.9)))).toFixed(2) + 'px';
      el.barsSb[i].style.opacity = (0.55 + 0.45 * cv).toFixed(3);
    }
    [[el.okSql, 3.55], [el.okSk, 4.0]].forEach(([n, a]) => {
      const p = outCubic(seg(t, a, a + 0.3));
      n.classList.toggle('on', p > 0.5);
      n.style.opacity = (0.4 + 0.6 * p).toFixed(3);
    });
  }
  const ro = inOutCubic(seg(t, 6.55, 6.85)) * (1 - inOutCubic(seg(t, ANSWER.a + 0.35, ANSWER.a + 0.75)));
  el.hudRes.style.opacity = ro.toFixed(3);
  el.hudRes.style.maxHeight = (116 * ro).toFixed(1) + 'px';
  el.resChips.forEach((n, i) => {
    const p = outCubic(seg(t, 6.62 + i * 0.15, 6.62 + i * 0.15 + 0.4));
    n.style.opacity = (p * ro).toFixed(3);
    n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 8).toFixed(2)}px)`;
  });
  el.hudMark.render(t);
}

// the desk is authored in design px and scaled up to the frame, so its type reads at the size the real screens show
// it. Narrower ratios scale less and restack (bq.css). Same factors as the call-center spot.
const UI_SCALE = (W) => (W >= 1900 ? 1.3 : W >= 1400 ? 1.2 : W >= 1000 ? 1.1 : 1.05);
function layout(W) {
  if (el.lay && el.lay.W === W) return el.lay;
  const S = UI_SCALE(W);
  el.dk.style.width = (W / S).toFixed(2) + 'px';
  el.dk.style.height = (1080 / S).toFixed(2) + 'px';
  el.dk.style.transform = `scale(${S})`;
  el.lay = { W, S };
  // the schema viewport holds whole rows only
  el.schVp.style.height = '';
  const rh = el.schRows[0] ? el.schRows[0].n.offsetHeight : 36;
  const vpRows = Math.max(1, Math.floor(el.schVp.clientHeight / rh));
  el.schVp.style.height = `${vpRows * rh}px`;
  return el.lay;
}

export function render(t, W = 1920) {
  if (!el) return;
  layout(W);
  for (const n of el.fits) if (n.offsetParent) fitT(n, n._src);
  renderChrome(t);
  renderViews(t);
  renderLearn(t);
  renderFeed(t);
  renderCall(t);
  renderHud(t);
}

export default { id: 'bq', DUR, mount, render };

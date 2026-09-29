// word.js: the Microsoft Word for the web desk (the proof queue open on the Review tab, Track Changes on For Everyone,
// All Markup, the Navigation pane's Headings list as the queue) and the four beats superbot works on it. It is one DOM
// tree built at mount and then driven purely from local time t (?t=<s> reproduces any frame), so the spot is seek-safe
// at every ratio. The chrome is rebuilt from Microsoft's own support screenshots measured into .tmp/pe-ad.c54c5ecd/ref
// (word.css :root names the file behind every value); the icons are Fluent UI System Icons (word-icons.js). The motion
// is the source spot's (the do-my-job call-center spot's desk module) beat for beat: every beat window, queue timing and HUD
// rule is unchanged; only the three main pieces' windows (WINS, LEAD, STEP) are retimed so each passage, comment and
// published-fix reply stays on screen long enough to read. What the desk shows is a proofreader's work. All document content comes from
// word-data.js and every count on screen is computed from it (pieces fixed, tracked changes, comments, words).
import { lerp, seg, outCubic, inOutCubic, press, esc, streamCount } from '../../lib.js';
import { DOC, QUEUE, LEARN } from './word-data.js';
import { icon } from './word-icons.js';
import { mountHud, measureHud, renderHud } from './wd-hud.js';

// ---------- the desk's own clock (seconds, local to the desk layer): the source spot's, unchanged ----------
export const DUR = 18.40;
const VOICE = { a: 2.10, b: 4.60 };
const LEARN_B = { a: 4.60, b: 8.60 };
const ANSWER = { a: 8.60, b: 16.10 };
const LAND = { a: 16.10, b: DUR };

// the three main pieces superbot works on the page, start to end. Timed for reading, inside the ANSWER beat: each
// passage is on screen, still, for LEAD seconds before the selection starts (page 1 has been in view since the desk
// opened, so it needs only a beat); the posted comment stays readable for about 1.4 s and the reply quoting the
// published fix for about 1.25 s before the next page scrolls in; the last piece is fixed (heading, counters) by
// ANSWER.b and its thread is then read through the LAND beat to the end of the desk.
const WINS = [[8.60, 11.30], [11.30, 14.55], [14.55, 16.10]];
const LEAD = [0.15, 0.70, 0.70];
// where each step of a piece lands, in seconds from the start of its selection (s = window start + LEAD): the
// selection sweeps the wrong text, the tracked deletion lands, the fix is typed in, a comment is opened (New
// Comment), typed and posted, the heading flips to fixed, the reply quoting the published fix fades in
const STEP = { sel: 0.00, selEnd: 0.16, del: 0.19, type: 0.22, typeEnd: 0.32, cmt: 0.36, cmtType: 0.40, post: 0.78, closed: 0.80, reply: 0.84 };
const STEP_DONE = [1.75, 4.35, 8.35, 16.15];
const QWAIT_IN = { a: 0.70, b: 1.70 };   // the Navigation pane fills over this window (the source's queue-wait count-up)
const N = QUEUE.length;
// the source queue's arrival / answer / resolve timings, copied exactly (motion, not content). Slot k of the three
// main pieces is worked as window k opens; the other nine take the remaining slots in document order.
const TIMING = [[8.70, 8.90, 11.06], [9.30, 11.60, 13.52], [9.90, 14.00, 15.68], [10.40, 10.95, 12.60], [10.90, 11.35, 13.10],
  [11.40, 11.80, 13.45], [11.90, 12.30, 14.20], [12.40, 12.85, 14.55], [12.90, 13.35, 15.20], [13.40, 13.85, 15.60],
  [13.90, 14.35, 15.92], [14.40, 14.75, 16.02]];
// the Track Changes switch (CONNECT): the button is pressed, its menu opens, For Everyone is picked, the menu closes
const TC = { press: 0.30, open: [0.34, 0.46], hover: 0.72, pick: 0.95, close: [1.00, 1.14] };
const ED = { press: LEARN_B.a - 0.05, open: [LEARN_B.a, LEARN_B.a + 0.35], close: [8.45, 8.80] };

// the main pieces: QUEUE 0, 1, 2 (the contract puts them first, in this order)
const MAIN = [0, 1, 2].filter((i) => i < N).slice(0, WINS.length);

const $ = (s, root) => root.querySelector(s);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const setT = (n, s) => { if (n && n.textContent !== s) n.textContent = s; };
const fmt = (n) => Number(n).toLocaleString('en-US');
const winLen = (k) => WINS[k][1] - WINS[k][0];
const at = (k, step) => WINS[k][0] + LEAD[k] + STEP[step];
// Word's comment date line ("January 02, 2024" in word-resolve-thread-menu.png), from DOC.date
const LONG_DATE = (() => {
  const d = new Date(String(DOC.date).replace(/^[A-Za-z]+,\s*/, ''));
  return Number.isNaN(d.getTime()) ? String(DOC.date) : d.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
})();
// superbot's reply: the correction the publisher later printed, quoted verbatim. Quotation marks inside the quoted fix
// become single ones (US style: quotes within quotes), the only change made to the quoted text.
const inner = (s) => String(s).replace(/“/g, '‘').replace(/”/g, '’');
const replyText = (q) => `Matches the published fix, ${q.fix.by}, ${q.fix.date}: “${inner(q.fix.text)}”`;
// the documented consequence, quoted, with its source under it
const costText = (q) => `“${inner(q.cost.text)}”`;
const srcLine = (q) => `${q.pub}, ${q.published}, ${q.where}`;
// a tracked replacement is two revisions (a deletion and an insertion), as Word's Reviewing Pane counts them
const revisions = (q) => (q.wrong ? 1 : 0) + (q.right ? 1 : 0);

// Text that does not fit its box is cut at a WORD boundary and ends in an ellipsis, instead of the browser's mid-word
// text-overflow cut. Works for single-line (nowrap) boxes and -webkit-line-clamp boxes alike. Cached per text, frame
// width and font state. (The journalist remake's fitT, as the market-research remake carries it.) mode 'seg' (the
// Navigation headings) backs a cut off to the last comma, so a heading ends on a whole part of its name ("EPA Title V
// rule…", not "EPA Title V rule, 40…"); mode 'word' never cuts inside a word (a first word that cannot fit shows
// nothing) and never ends a cut on a joining word ("Centers for Medicare…", not "Centers for Medicare &…").
const fontState = () => (document.fonts ? document.fonts.status : 'loaded');
const cutAt = (w, m) => w.slice(0, m).join(' ').replace(/[\s,;:(\u00B7\-]+$/, '') + '…';
function fitT(n, s, ctx = '', box = n, mode = '') {
  if (!n) return;
  const key = `${s}|${el && el.lay ? el.lay.W : 0}|${fontState()}|${ctx}`;
  if (n._fit === key && n.textContent === n._fitOut) return;
  if (n.textContent !== s) n.textContent = s;
  if (!box.clientWidth) { n._fit = null; return; }
  n._nowrap = getComputedStyle(box).whiteSpace === 'nowrap';
  const over = () => {
    if (box.scrollHeight > box.clientHeight + 0.5) return true;
    if (!n._nowrap) return box.scrollWidth > box.clientWidth;
    const r = document.createRange(); r.selectNodeContents(box);
    return r.getBoundingClientRect().width > box.getBoundingClientRect().width + 0.01;
  };
  if (over()) {
    const w = s.split(' ');
    let lo = 1, hi = w.length - 1, best = 1;
    while (lo <= hi) { const m = (lo + hi) >> 1; n.textContent = cutAt(w, m); if (over()) hi = m - 1; else { best = m; lo = m + 1; } }
    n.textContent = cutAt(w, best);
    if (mode === 'seg' && !over()) {
      const kept = w.slice(0, best);
      let c = -1;
      kept.forEach((x, i) => { if (i < kept.length - 1 && /,$/.test(x)) c = i; });
      if (c >= 0 && !/,$/.test(kept[kept.length - 1])) n.textContent = cutAt(w, c + 1);
    }
    if (mode === 'word' && !over()) {
      let m = best;
      while (m > 1 && /^(&|and|or|nor|of|for|the|to|in|on|at|by|as|with|a|an)$/i.test(w[m - 1])) m--;
      if (m < best) n.textContent = cutAt(w, m);
    }
    if (best === 1 && over() && mode === 'word') n.textContent = '';
    else if (best === 1 && over()) {
      const c = w[0];
      let a = 1, b = c.length, keep = 1;
      while (a <= b) { const m = (a + b) >> 1; n.textContent = c.slice(0, m) + '…'; if (over()) b = m - 1; else { keep = m; a = m + 1; } }
      n.textContent = c.slice(0, keep) + '…';
    }
  }
  n._fit = key; n._fitOut = n.textContent;
}

// ---------- the queue: every heading's moments ----------
const ROWS = QUEUE.map((q, i) => {
  const k = MAIN.indexOf(i);
  const slot = k >= 0 ? k : MAIN.length + QUEUE.slice(0, i).filter((_, j) => !MAIN.includes(j)).length;
  const [, tAns, tRes] = TIMING[Math.min(slot, TIMING.length - 1)];
  // the Navigation pane lists the headings top to bottom as the document opens (the source's queue-wait window)
  const tIn = lerp(QWAIT_IN.a, QWAIT_IN.b - 0.12, N > 1 ? i / (N - 1) : 0);
  return { q, i, k: k < 0 ? null : k, tIn, tAns: k < 0 ? tAns : WINS[k][0], tRes: k < 0 ? tRes : at(k, 'closed') };
});

// ---------- a main piece's moments ----------
function plan(k) {
  const q = QUEUE[MAIN[k]];
  const T = {
    scroll: [WINS[k][0] - 0.35, WINS[k][0] + 0.10],
    sel: [at(k, 'sel'), at(k, 'selEnd')], del: at(k, 'del'),
    type: q.wrong ? [at(k, 'type'), at(k, 'typeEnd')] : [at(k, 'del'), at(k, 'typeEnd')],
    cmt: at(k, 'cmt'), cmtType: [at(k, 'cmtType'), at(k, 'post') - 0.04], post: at(k, 'post'),
    reply: at(k, 'reply'), closed: at(k, 'closed'),
  };
  T.cpsR = Math.max(12, q.right.length / Math.max(0.05, T.type[1] - T.type[0]));
  T.cpsC = Math.max(40, q.comment.length / Math.max(0.05, T.cmtType[1] - T.cmtType[0]));
  return { q, T };
}
const PLANS = MAIN.map((_, k) => plan(k));

// the counters: pieces fixed, tracked revisions and comment threads (each lands when its heading turns fixed)
function counts(t) {
  const done = ROWS.filter((r) => t >= r.tRes);
  return { fixed: done.length, changes: done.reduce((n, r) => n + revisions(r.q), 0), comments: done.length };
}

// Word's own labels (each seen in a reference: .tmp/pe-ad.c54c5ecd/ref/REFS.txt lists the file or page per label)
const L = {
  app: 'Word', saved: 'Saved', search: 'Search (Alt + Q)',
  tabs: ['File', 'Home', 'Insert', 'Layout', 'References', 'Review', 'View', 'Help'],
  comments: 'Comments', editing: 'Editing', share: 'Share',
  editor: 'Editor', spelling: 'Spelling & Grammar', wordCount: 'Word Count', access: 'Check Accessibility', language: 'Language',
  newComment: 'New Comment', del: 'Delete', prev: 'Previous', next: 'Next', show: 'Show Comments',
  track: 'Track Changes', markup: 'All Markup', accept: 'Accept', reject: 'Reject',
  tcMenu: ['Off', 'For Everyone', 'Just Mine'],
  nav: 'Navigation', navFind: 'Search document', navTabs: ['Headings', 'Pages', 'Results'],
  reply: '@mention or reply',
  page: (i, n) => `Page ${i} of ${n}`, words: (n) => `${fmt(n)} words`,
};
// the spot's own copy (superbot's statuses and HUD), never presented as Word UI text
const S = {
  queued: 'queued', review: 'in review', fixed: 'fixed',
  author: 'superbot',
  hud: ['Opening your proof queue in Word', 'Word connected, Track Changes on', 'Matching your markup', 'Markup matched',
    `Reading ${LEARN.length} style rules`, `Proofing ${N} pieces`, `Queue clear, ${N} pieces fixed`],
  steps: ['Connected to Microsoft Word', 'Markup matched', `Learned ${LEARN.length} style rules`, `Proofing ${N} pieces`],
  laneYou: 'Your comments', laneSb: 'superbot', laneMatch: 'Markup', matched: 'matched', learn: 'Your style rules',
  stats: ['fixed', 'changes', 'comments'],
};

let el = null;

// ---------- mount ----------
export function mount(section, ctx) {
  const root = h(`<div class="wd-root"></div>`);
  const img = (f) => new URL(`../../img/${f}`, import.meta.url).href;
  const mark = new URL('./mark-clean.svg', import.meta.url).href;
  const rb = (ic, label, cls = '') => `<span class="wd-rb ${cls}">${icon(ic)}<span class="wd-rl${/opt|icon/.test(cls) ? ' opt' : ''}">${esc(label)}</span></span>`;
  root.innerHTML = `
<div class="wd">
  <header class="wd-title">
    <span class="wd-waffle">${icon('launcher')}</span>
    <img class="wd-logo" src="${img('word-logo.svg')}" alt=""/><b class="wd-app">${esc(L.app)}</b>
    <span class="wd-doc"><span class="wd-docname">${esc(DOC.file)}</span><span> - </span><span>${esc(L.saved)}</span>${icon('chevron', 'xs')}</span>
    <span class="wd-search">${icon('search')}<span>${esc(L.search)}</span></span>
    <span class="wd-av">S</span>
  </header>
  <nav class="wd-tabs">
    ${L.tabs.map((s, i) => `<span class="wd-tab${s === 'Review' ? ' on' : ''}${i === 2 || i === 3 ? ' opt' : ''}${i >= 6 ? ' opt2' : ''}">${esc(s)}</span>`).join('')}
    <span class="wd-tabs-r">
      <span class="wd-btn">${icon('comment')}<span class="wd-bl">${esc(L.comments)}</span></span>
      <span class="wd-btn opt">${icon('edit')}<span class="wd-bl">${esc(L.editing)}</span>${icon('chevron', 'xs')}</span>
      <span class="wd-btn primary">${icon('share')}<span class="wd-bl">${esc(L.share)}</span></span>
    </span>
  </nav>
  <div class="wd-ribbon">
    ${rb('editorPen', L.editor, 'ed icon')}${rb('editor', L.spelling, 'sp')}${rb('wordCount', L.wordCount, 'wc')}${rb('accessibility', L.access, 'opt')}${rb('language', L.language, 'opt')}
    <i class="wd-rsep"></i>
    ${rb('newComment', L.newComment, 'nc')}${rb('deleteComment', L.del, 'opt')}${rb('prevComment', L.prev)}${rb('nextComment', L.next)}${rb('showComments', L.show, 'opt')}
    <i class="wd-rsep"></i>
    ${rb('trackChanges', L.track, 'tc keep')}<span class="wd-sel">${icon('markup')}<span class="wd-rl opt">${esc(L.markup)}</span>${icon('chevron', 'xs')}</span>
    <i class="wd-rsep"></i>
    ${rb('accept', L.accept)}${rb('reject', L.reject)}
  </div>
  <div class="wd-flyout">${L.tcMenu.map((m) => `<div class="wd-fly-i"><span class="wd-fly-ck">${icon('check')}</span><span>${esc(m)}</span></div>`).join('')}</div>
  <div class="wd-body">
    <aside class="wd-nav">
      <div class="wd-nav-h"><span>${esc(L.nav)}</span>${icon('dismiss')}</div>
      <div class="wd-nav-find"><span>${esc(L.navFind)}</span>${icon('search')}</div>
      <div class="wd-nav-tabs">${L.navTabs.map((s, i) => `<span class="${i === 0 ? 'on' : ''}">${esc(s)}</span>`).join('')}</div>
      <ul class="wd-hds"></ul>
    </aside>
    <main class="wd-canvas">
      <div class="wd-scroll"></div>
      <aside class="wd-ed">
        <div class="wd-ed-h"><span>${esc(L.editor)}</span>${icon('dismiss')}</div>
        <div class="wd-ed-vp"><div class="wd-ed-in"></div></div>
      </aside>
    </main>
  </div>
  <footer class="wd-status">
    <span class="wd-pg">${esc(L.page(1, N))}</span><span class="opt">${esc(L.words(DOC.words))}</span>
    <span class="wd-zoom">${icon('zoomOut')}<span class="wd-zoom-track"><i></i></span>${icon('zoomIn')}<span class="wd-zpc">100%</span></span>
  </footer>
</div>`;
  section.appendChild(root);
  const hud = mountHud($('.wd-canvas', root), ctx, { hud: S.hud, steps: S.steps, laneYou: S.laneYou, laneSb: S.laneSb, laneMatch: S.laneMatch,
    matched: S.matched, learn: S.learn, chips: LEARN.map((r) => r.label), stats: S.stats });

  // the Navigation pane: one heading per piece, with superbot's status under it
  const hds = $('.wd-hds', root);
  const navRows = ROWS.map((r) => {
    const n = h(`<li class="wd-hd"><span class="wd-hd-t"></span><span class="wd-hd-s"><em class="wd-st s-q">${icon('check12')}<span class="wd-st-t">${esc(S.queued)}</span></em><span class="wd-hd-k"></span></span></li>`);
    hds.appendChild(n);
    return { n, r, t: $('.wd-hd-t', n), st: $('.wd-st', n), stT: $('.wd-st-t', n), k: $('.wd-hd-k', n) };
  });

  // the pages: one piece per page (Heading 2, the published passage, its source line), each with its comment lane
  const scroll = $('.wd-scroll', root);
  const pages = QUEUE.map((q) => {
    const pre = q.before.slice(0, q.at), post = q.before.slice(q.at + q.wrong.length);
    const n = h(`<div class="wd-sheet">
      <div class="wd-page">
        <i class="wd-bar"></i>
        <h2 class="wd-h2">${esc(q.heading)}</h2>
        <p class="wd-p"><span>${esc(pre)}</span><span class="wd-anc"><span class="wd-w"><span class="wd-ws"></span><span class="wd-wr"></span></span><span class="wd-ins"></span><i class="wd-car"></i></span><span>${esc(post)}</span></p>
        <p class="wd-src">${esc(srcLine(q))}</p>
      </div>
      <div class="wd-lane">
        <div class="wd-card">
          <div class="wd-c-head"><span class="wd-c-av"><img src="${mark}" alt=""/></span><span class="wd-c-name">${esc(S.author)}</span><span class="wd-c-acts">${icon('resolve')}${icon('more')}</span></div>
          <div class="wd-c-drafting"><div class="wd-c-draft"><span class="wd-c-typed"></span><i class="wd-car"></i></div>
            <div class="wd-c-postrow"><span class="wd-c-post">${icon('send')}</span><span class="wd-c-cancel">${icon('dismiss')}</span></div></div>
          <div class="wd-c-posted"><p class="wd-c-body">${esc(q.comment)}</p><small class="wd-c-date">${esc(LONG_DATE)}</small></div>
          <div class="wd-c-reply">
            <div class="wd-c-head"><span class="wd-c-av"><img src="${mark}" alt=""/></span><span class="wd-c-name">${esc(S.author)}</span></div>
            <p class="wd-c-body wd-c-quote">${esc(replyText(q))}</p>
            ${q.cost ? `<p class="wd-c-body wd-c-cost">${esc(costText(q))}</p><small class="wd-c-date wd-c-csrc">${esc(q.cost.src)}</small>` : ''}
            <small class="wd-c-date">${esc(LONG_DATE)}</small>
          </div>
          <div class="wd-c-box">${esc(L.reply)}</div>
        </div>
      </div>
    </div>`);
    scroll.appendChild(n);
    const g = (s) => $(s, n);
    return { n, q, page: g('.wd-page'), bar: g('.wd-bar'), anc: g('.wd-anc'), w: g('.wd-w'), ws: g('.wd-ws'), wr: g('.wd-wr'), ins: g('.wd-ins'), car: g('.wd-p .wd-car'),
      card: g('.wd-card'), typed: g('.wd-c-typed'), dcar: g('.wd-c-draft .wd-car'), post: g('.wd-c-post'), reply: g('.wd-c-reply'), box: g('.wd-c-box'),
      quote: g('.wd-c-quote'), quoteSrc: replyText(q) };
  });

  // the Editor pane (LEARN): the style rules superbot reads, one row each
  const edIn = $('.wd-ed-in', root);
  const edRows = LEARN.map((r) => {
    // a Guardian entry starts with its headword, printed bold as the guide prints it (LEARN.head)
    const hw = r.head && String(r.text).startsWith(r.head + ' ') ? r.head : '';
    const rest = hw ? r.text.slice(hw.length) : r.text;
    const n = h(`<div class="wd-er"><span class="wd-er-ck">${icon('check')}</span><span class="wd-er-l">${esc(r.label)}</span><span class="wd-er-t">${hw ? `<b class="wd-er-hw">${esc(hw)}</b>` : ''}<span class="wd-er-tx">${esc(rest)}</span></span><span class="wd-er-s">${esc(r.src)}</span></div>`);
    edIn.appendChild(n);
    return { n, ck: $('.wd-er-ck', n), t: $('.wd-er-tx', n), tBox: $('.wd-er-t', n), src: rest, s: $('.wd-er-s', n), srcS: r.src, l: $('.wd-er-l', n), srcL: r.label };
  });


  el = {
    root, wd: $('.wd', root), hud, navRows, hds, pages, scroll, canvas: $('.wd-canvas', root), edRows, edIn,
    ed: $('.wd-ed', root), edVp: $('.wd-ed-vp', root), edBtn: $('.wd-rb.ed', root), ncBtn: $('.wd-rb.nc', root),
    tcBtn: $('.wd-rb.tc', root), fly: $('.wd-flyout', root), flyItems: [...root.querySelectorAll('.wd-fly-i')],
    pg: $('.wd-pg', root), zpc: $('.wd-zpc', root),
    lay: null,
  };
  return el;
}

// ---------- per-frame render ----------
function callState(t) {
  for (let k = 0; k < PLANS.length; k++) if (t >= WINS[k][0] && t < WINS[k][1]) return { k, f: (t - WINS[k][0]) / winLen(k) };
  const last = PLANS.length - 1;
  if (last >= 0 && t >= WINS[last][1]) return { k: last, f: 1 };
  return null;
}

// the page in view: page 1 until the first piece's scroll, then each main piece's page as its window opens
function scrollState(t) {
  let y = 0, page = 0;
  PLANS.forEach((p, k) => {
    const f = inOutCubic(seg(t, p.T.scroll[0], p.T.scroll[1]));
    if (f > 0) { y = lerp(y, el.lay.top[MAIN[k]], f); if (f >= 0.5) page = MAIN[k]; }
  });
  return { y, page };
}

function renderNav(t, cur) {
  el.navRows.forEach((row) => {
    const r = row.r;
    const p = outCubic(seg(t, r.tIn, r.tIn + 0.3));
    row.n.style.opacity = p.toFixed(3);
    row.n.style.transform = p >= 1 ? '' : `translateY(${((1 - p) * el.lay.rise).toFixed(2)}px)`;
    const rev = t >= r.tAns, done = t >= r.tRes;
    const cls = done ? 's-f' : rev ? 's-r' : 's-q';
    if (!row.st.classList.contains(cls)) { row.st.classList.remove('s-q', 's-r', 's-f'); row.st.classList.add(cls); }
    setT(row.stT, done ? S.fixed : rev ? S.review : S.queued);
    // the status flips over (1 -> 0 -> 1 on Y) as it turns fixed: the source's status-chip flip
    const fs = seg(t, r.tRes - 0.11, r.tRes + 0.11);
    row.st.style.transform = fs > 0 && fs < 1 ? `scaleY(${Math.max(0.02, Math.abs(0.5 - fs) * 2).toFixed(3)})` : '';
    // Word's current-heading highlight follows the page in view
    row.n.classList.toggle('on', r.i === cur && t >= r.tIn);
    fitT(row.t, r.q.heading, cls, row.t, 'seg');
    fitT(row.k, done ? r.q.kind : r.q.pub, cls, row.k, 'word');
  });
}

function renderChrome(t) {
  // Track Changes: pressed, its menu opens, For Everyone is picked, the menu closes; the button stays on
  const tp = press(t, TC.press, 0.06, 0.06, 0.14);
  el.tcBtn.style.transform = tp > 0 ? `scale(${(1 - 0.06 * tp).toFixed(4)})` : '';
  el.tcBtn.classList.toggle('on', t >= TC.pick);
  const fo = outCubic(seg(t, TC.open[0], TC.open[1])) * (1 - seg(t, TC.close[0], TC.close[1]));
  el.fly.style.opacity = fo.toFixed(3);
  el.fly.style.visibility = fo <= 0.002 ? 'hidden' : 'visible';
  el.fly.style.transform = fo >= 1 ? '' : `translateY(${(-(1 - fo) * el.lay.flyDy).toFixed(2)}px)`;
  el.flyItems.forEach((n, i) => n.classList.toggle('on', i === 1 && t >= TC.hover));
  // Editor opens its pane for the LEARN beat; New Comment is pressed as each main comment opens
  const ep = press(t, ED.press, 0.06, 0.06, 0.14);
  el.edBtn.style.transform = ep > 0 ? `scale(${(1 - 0.06 * ep).toFixed(4)})` : '';
  el.edBtn.classList.toggle('on', t >= ED.press && t < ED.close[0]);
  const np = PLANS.reduce((m, p) => Math.max(m, press(t, p.T.cmt - 0.04, 0.06, 0.06, 0.14)), 0);
  el.ncBtn.style.transform = np > 0 ? `scale(${(1 - 0.06 * np).toFixed(4)})` : '';
}

function renderEditor(t) {
  const o = inOutCubic(seg(t, ED.open[0], ED.open[1])) * (1 - inOutCubic(seg(t, ED.close[0], ED.close[1])));
  el.ed.style.opacity = o.toFixed(3);
  el.ed.style.visibility = o <= 0.002 ? 'hidden' : 'visible';
  el.ed.style.transform = o >= 1 ? '' : `translateX(${((1 - o) * el.lay.edDx).toFixed(2)}px)`;
  if (o <= 0.002) return;
  // superbot reads the rules top to bottom; the list scrolls so the rule being read stays in view
  const n = el.edRows.length;
  const r0 = LEARN_B.a + 0.30, r1 = 7.40;
  const c = outCubic(seg(t, r0, r1));
  const y = -Math.max(0, el.lay.edH - el.lay.edVp) * c;
  el.edIn.style.transform = `translateY(${y.toFixed(2)}px)`;
  el.edRows.forEach((row, i) => {
    const a = lerp(r0, r1, n > 1 ? i / (n - 1) : 0);
    const p = outCubic(seg(t, a, a + 0.2));
    row.ck.style.opacity = p.toFixed(3);
    fitT(row.t, row.src, 'er', row.tBox, 'word'); fitT(row.s, row.srcS, 'er', row.s, 'seg'); fitT(row.l, row.srcL, 'er');
    // a row the scroll carries past the viewport's top or bottom edge fades out before its lines reach the edge, so
    // no line is ever drawn half cut (the market-research remake's codebook rule)
    const top = row.n.offsetTop + y, bot = top + row.n.offsetHeight, f = el.lay.fade;
    const keep = Math.min(1, Math.max(0, Math.min(top / f + 1, (el.lay.edVp - bot) / f + 1)));
    const o = keep >= 1 ? '' : keep.toFixed(3);
    if (row.n.style.opacity !== o) row.n.style.opacity = o;
  });
}

function renderPages(t) {
  const cs = callState(t);
  el.pages.forEach((pg, i) => {
    const q = pg.q;
    const k = MAIN.indexOf(i);
    const row = ROWS[i];
    let selN = 0, delOn = false, insN = 0, caret = false, cardOn = 0, draft = false, typedN = 0, posted = false, replyO = 0, boxO = 0, active = false, lit = false, barO = 0;
    if (k >= 0) {
      const { T } = PLANS[k];
      // select the wrong text (a sweep), then the tracked deletion lands; a pure insertion only places the caret
      if (q.wrong) selN = t >= T.del ? 0 : Math.round(q.wrong.length * outCubic(seg(t, T.sel[0], T.sel[1])));
      delOn = !!q.wrong && t >= T.del;
      insN = q.right ? streamCount(q.right, T.type[0], T.cpsR, t) : 0;
      const inWin = cs && cs.k === k && t < WINS[k][1];
      const typingR = t >= T.type[0] && insN < q.right.length;
      caret = inWin && t >= T.sel[0] && t < T.cmt && (typingR || Math.floor((t - T.sel[0]) * 2.2) % 2 === 0) && !(q.wrong && t >= T.sel[0] && t < T.del);
      barO = outCubic(seg(t, T.del, T.del + 0.2));
      // the comment: opened (New Comment), typed, posted, then the reply quoting the published fix
      cardOn = outCubic(seg(t, T.cmt, T.cmt + 0.22));
      draft = t >= T.cmt && t < T.post;
      typedN = streamCount(q.comment, T.cmtType[0], T.cpsC, t);
      posted = t >= T.post;
      replyO = outCubic(seg(t, T.reply, T.reply + 0.3));
      boxO = outCubic(seg(t, T.post + 0.05, T.post + 0.3));
      // the card keeps its active outline while its thread is on screen (the last one through the LAND beat)
      active = t >= T.cmt && t < (k < PLANS.length - 1 ? WINS[k][1] : DUR + 1);
      lit = t >= T.cmt;
      // the Post button dips as it is pressed
      const pp = press(t, T.post - 0.08, 0.05, 0.05, 0.12);
      pg.post.style.transform = pp > 0 ? `scale(${(1 - 0.08 * pp).toFixed(4)})` : '';
      pg.dcar.style.visibility = draft && Math.floor(t * 2.2) % 2 === 0 || (draft && typedN < q.comment.length) ? '' : 'hidden';
    } else if (t >= row.tRes) {
      // a piece worked off screen: its markup and its thread are in place once its heading turns fixed
      delOn = !!q.wrong; insN = q.right.length; cardOn = 1; posted = true; replyO = 1; boxO = 1; lit = true; barO = 1;
    }
    setT(pg.ws, q.wrong.slice(0, selN));
    setT(pg.wr, q.wrong.slice(selN));
    pg.ws.classList.toggle('wd-sel-on', selN > 0);
    pg.w.classList.toggle('wd-del', delOn);
    setT(pg.ins, q.right.slice(0, insN));
    pg.car.style.display = caret ? '' : 'none';
    pg.anc.classList.toggle('lit', lit);
    pg.bar.style.opacity = barO.toFixed(3);
    pg.card.style.opacity = cardOn.toFixed(3);
    pg.card.style.transform = cardOn >= 1 ? '' : `translateX(${((1 - cardOn) * el.lay.cardDx).toFixed(2)}px)`;
    pg.card.classList.toggle('is-draft', draft);
    pg.card.classList.toggle('is-posted', posted);
    pg.card.classList.toggle('active', active);
    setT(pg.typed, q.comment.slice(0, typedN));
    pg.reply.style.opacity = replyO.toFixed(3);
    pg.reply.style.display = replyO > 0 ? '' : 'none';
    pg.box.style.opacity = boxO.toFixed(3);
    pg.box.style.display = posted ? '' : 'none';
    if (barO > 0 || cardOn > 0) place(pg);
    if (replyO > 0) fitT(pg.quote, pg.quoteSrc, 'q');
  });
}

// the change bar spans the changed lines; the card sits level with its change (Word's balloon alignment)
function place(pg) {
  const top = pg.anc.offsetTop, hgt = pg.anc.offsetHeight;
  const bt = `${top}px`, bh = `${hgt}px`;
  if (pg.bar.style.top !== bt) pg.bar.style.top = bt;
  if (pg.bar.style.height !== bh) pg.bar.style.height = bh;
  const ct = `${Math.max(0, top - el.lay.cardPad)}px`;
  if (pg.card.style.top !== ct) pg.card.style.top = ct;
}

function renderCanvas(t) {
  const s = scrollState(t);
  el.scroll.style.transform = `translateY(${(-s.y).toFixed(2)}px)`;
  setT(el.pg, L.page(s.page + 1, N));
  return s.page;
}

// the desk is authored in design px and scaled up to the frame, so its type reads at the size the real screens show
// it. Same factors as the source spot; the narrower ratios zoom the page out (word.css per-ratio tokens).
const UI_SCALE = (W) => (W >= 1900 ? 1.3 : W >= 1400 ? 1.2 : W >= 1000 ? 1.1 : 1.05);

function layout(W) {
  const key = `${W}|${fontState()}`;
  if (el.lay && el.lay.key === key) return el.lay;
  const Sc = UI_SCALE(W);
  el.wd.style.width = (W / Sc).toFixed(2) + 'px';
  el.wd.style.height = (1080 / Sc).toFixed(2) + 'px';
  el.wd.style.transform = `scale(${Sc})`;
  const cs = getComputedStyle(el.root);
  const docFs = parseFloat(cs.getPropertyValue('--wd-doc-fs')) || 16;
  const pad = parseFloat(getComputedStyle(el.scroll).paddingTop) || 0;
  // each page's scroll stop: its top a padding's width below the canvas edge
  const top = el.pages.map((p) => Math.max(0, p.n.offsetTop - pad));
  // the Track Changes menu opens under its button
  const wr = el.wd.getBoundingClientRect(), br = el.tcBtn.getBoundingClientRect();
  el.fly.style.left = ((br.left - wr.left) / Sc).toFixed(2) + 'px';
  el.fly.style.top = ((br.bottom - wr.top) / Sc).toFixed(2) + 'px';
  // the Editor pane's rows and viewport
  const edH = el.edIn.scrollHeight, edVp = el.edVp.clientHeight;
  // the HUD's chip block, measured open (its max-height is animated from 0 to this)
  measureHud(el.hud);
  const cardPad = parseFloat(getComputedStyle(el.pages[0].card).paddingTop) || 0;
  const flyDy = parseFloat(cs.getPropertyValue('--wd-s2')) || 0;
  el.lay = { key, W, S: Sc, top, edH, edVp, cardPad, flyDy, rise: flyDy, fade: flyDy * 2, edDx: el.ed.offsetWidth * 0.08, cardDx: flyDy * 2 };
  setT(el.zpc, `${Math.round(docFs / 16 * 100)}%`);
  return el.lay;
}

export function render(t, W = 1920) {
  if (!el) return;
  layout(W);
  renderChrome(t);
  renderEditor(t);
  renderPages(t);
  const page = renderCanvas(t);
  renderNav(t, page);
  const c = counts(t);
  renderHud(el.hud, t, { VOICE, LEARN_B, ANSWER, LAND, STEP_DONE }, [c.fixed, c.changes, c.comments].map(fmt));
}

export default { id: 'word', DUR, mount, render };

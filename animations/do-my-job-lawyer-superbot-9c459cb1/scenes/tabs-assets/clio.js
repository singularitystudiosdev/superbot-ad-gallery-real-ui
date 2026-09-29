// clio.js: the Clio Manage matter desk, and the four beats superbot works on it.
// It is one DOM tree built at mount and then driven purely from local time t (?t=<s> reproduces any frame), so
// the spot is seek-safe at every ratio. The chrome (left nav, top bar with search / Create new / timer / avatar,
// matter header, matter tabs, white cards) is rebuilt in HTML from reference screenshots of Clio Manage kept
// outside the repo in /tmp/clioref-9c459cb1 (see clio.css for the sampled tokens and which file each came from).
// The motion is the call-center spot's (e360.js) beat for beat: every window, WINS, FR fraction, queue timing
// and HUD rule is unchanged; only what the desk shows is a litigator's work. One real Clio mark sits in the
// chrome, Clio's white mark at the top left of the top bar (../../img/clio-mark-white.png, see ../../img/CREDITS.txt).
// The shell is Clio's 2025 one (ref-08 in the reference folder); the matter page (header, tabs, caret-headed
// cards) follows ref-01, and the court rules pane sits on the matter's Calendar tab as in ref-04.
// All docket content comes from clio-data.js, where each record carries its source.
import { clamp, lerp, seg, outCubic, inOutCubic, rand, press, esc, streamCount } from '../../lib.js';
import { I, DESK, MATTERS, NOTICES, RULES, REQUIREMENTS, STEPS, IDLE, OLD_TASKS } from './clio-data.js';

const NB = ' ';

// ---------- the desk's own clock (seconds, local to the desk layer): the call-center spot's, unchanged ----------
export const DUR = 18.40;
const CONNECT = { a: 0.00, b: 2.10 };
const VOICE = { a: 2.10, b: 4.60 };
const LEARN = { a: 4.60, b: 8.60 };
const ANSWER = { a: 8.60, b: 16.10 };
const LAND = { a: 16.10, b: DUR };

// the three matters the main pane works through, start to end
const WINS = [[8.90, 11.60], [11.60, 14.00], [14.00, 16.10]];
// where each step of a matter lands inside its window, as a fraction of it
const FR = { prob: 0.04, cause: 0.12, sol: 0.20, turn1: 0.24, turn2: 0.36, closed: 0.80, end: 0.88 };
const ROW_H = 40;               // one notice row
const AROW_H = 52;              // one court-rules row (clio.css .cl-arow)
const STEP_DONE = [1.75, 4.35, 8.35, 16.15];
const QWAIT_IN = { a: 0.70, b: 1.70 };
const N_NOTICES = NOTICES.length;

const $ = (s, root) => root.querySelector(s);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const setT = (n, s) => { if (n && n.textContent !== s) n.textContent = s; };
// Text that does not fit its box is cut at a WORD boundary and ends in an ellipsis, instead of the browser's
// mid-word text-overflow cut. Works for single-line (nowrap) boxes and -webkit-line-clamp boxes alike. The fit is
// cached per text, frame width and font state; a box that is not laid out yet (display: none) is fitted the first
// frame it is.
const fontState = () => (document.fonts ? document.fonts.status : 'loaded');
// (a cut never ends on a dangling "v." or on a cite without its number, e.g. "ECF" / "ECF No." / "D.I.")
const cutAt = (w, m) => w.slice(0, m).join(' ').replace(/(\s+v\.|[\s,·]+(ECF( No\.)?|D\.I\.|No\.))$/, '').replace(/[\s,;:(·\-]+$/, '') + '…';
function fitT(n, s, ctx = '') {
  if (!n) return;
  const key = `${s}|${el && el.lay ? el.lay.W : 0}|${fontState()}|${ctx}`;
  if (n._fit === key && n.textContent === n._fitOut) return;
  if (n.textContent !== s) n.textContent = s;
  if (!n.clientWidth) { n._fit = null; return; }
  // multi-line (clamped) boxes overflow in height; single-line boxes are measured to the sub-pixel, since
  // scrollWidth rounds and the browser still ellipsizes text a fraction of a pixel too wide
  n._nowrap = getComputedStyle(n).whiteSpace === 'nowrap';
  const over = () => {
    if (n.scrollHeight > n.clientHeight + 0.5) return true;
    if (!n._nowrap) return n.scrollWidth > n.clientWidth;
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
// the fitted form of s in box n, without leaving it there (for the lines that stream in letter by letter)
const fitCache = new Map();
function fitted(n, s) {
  const key = `${s}|${el.lay ? el.lay.W : 0}|${fontState()}`;
  if (fitCache.has(key)) return fitCache.get(key);
  const prev = n.textContent;
  n._fit = null; fitT(n, s);
  const out = n.textContent;
  const ok = !!n.clientWidth;
  n.textContent = prev; n._fit = null;
  if (ok) fitCache.set(key, out);
  return out;
}
// show only the items of a clipped list that fit WHOLE: walk them in visual order and hide every item from the
// first one whose bottom would pass the box's bottom (offsets, so the items' own translate motion does not count)
function wholeRows(items, box) {
  const limit = box.offsetTop + box.clientTop + box.clientHeight + 0.5;
  let full = false;
  for (const { n, want } of items) {
    if (!want || full) { if (n.style.display !== 'none') n.style.display = 'none'; continue; }
    if (n.style.display === 'none') n.style.display = '';
    if (n.offsetTop + n.offsetHeight > limit) { n.style.display = 'none'; full = true; }
  }
}
const hms = (s) => { const x = Math.floor(Math.max(0, s)); return `${String(Math.floor(x / 3600)).padStart(2, '0')}:${String(Math.floor(x / 60) % 60).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
const ecfNo = (n) => `ECF No.${NB}${n}`;
// a deadline date as a calendar tile: "Oct 9, 2026" -> ["Oct", "9"]; anything else shows whole
const tile = (d) => { const m = String(d).match(/([A-Z][a-z]{2})[a-z]*\.?\s+(\d{1,2})\b/); return m ? [m[1], m[2]] : ['', String(d)]; };
// hours in the 6-minute billing increment: 0.1 h per notice
const hours = (n) => `${(n * 0.1).toFixed(1)}${NB}h`;

// Clio's left navigation, in the product's order and labels as ref-08 shows them (/tmp/clioref-9c459cb1)
const NAV = [
  ['dashboard', 'Dashboard'], ['calendar', 'Calendar'], ['tasks', 'Tasks'], ['matters', 'Matters'],
  ['contacts', 'Contacts'], ['activities', 'Activities'], ['billing', 'Billing'], ['payments', 'Online payments'], ['accounts', 'Accounts'],
  ['documents', 'Documents'], ['communications', 'Communications'], ['reports', 'Reports'],
  ['apps', 'Integrations'], ['settings', 'Settings'],
];
const ACTIVE_NAV = 'matters';
// the matter page's tabs, in Clio's order; the underline moves Dashboard -> Calendar (LEARN) -> Dashboard
// (Clio keeps a matter's court rules on its Calendar tab, so the LEARN beat lands there)
const TABS = ['Dashboard', 'Custom Fields', 'Activities', 'Calendar', 'Communications', 'Notes', 'Documents', 'Tasks', 'Bills', 'Transactions'];
const TAB_OV = 0, TAB_ACT = 3;

let el = null;

// ---------- mount ----------
export function mount(section, ctx) {
  const asset = (n) => new URL(`../../img/${n}`, import.meta.url).href;
  const root = h(`<div class="cl-root"></div>`);
  const hudMark = ctx.shell.makeMark(26);
  const field = (label, cls) => `<div class="cl-f"><dt>${label}</dt><dd class="${cls}"></dd></div>`;
  // (the judge label reads "Presiding" when a magistrate judge presides alone; empty optional fields are dropped)
  root.innerHTML = `
<div class="cl">
  <header class="cl-top">
    <span class="cl-mark"><img src="${asset('clio-mark-white.png')}" alt="Clio"/></span>
    <span class="cl-prod">Clio Manage ${I.caret}</span>
    <span class="cl-search">${I.search}<span>Search Clio</span></span>
    <span class="cl-recent">Recents ${I.caret}</span>
    <div class="cl-topr">
      <span class="cl-timer"><span class="cl-tbtn">${I.play}<i class="cl-pause"></i></span><b class="cl-tclock">00:00:00</b><span class="cl-tclk">${I.clock}</span></span>
      <span class="cl-create">Create new ${I.caret}</span>
      <span class="cl-bell">${I.bell}<i class="cl-bell-n">0</i></span>
    </div>
  </header>
  <div class="cl-frame">
  <aside class="cl-nav">
    <div class="cl-nav-list">${NAV.map(([k, label]) => `<span class="cl-nav-i${k === ACTIVE_NAV ? ' on' : ''}">${I[k]}<span class="cl-nav-t">${label}</span></span>`).join('')}</div>
    <!-- Clio's nav footer: Resource center, the signed-in user (a generic avatar here, no name), Collapse -->
    <div class="cl-nav-foot">
      <span class="cl-nf cl-nf-help"><i>?</i><span class="cl-nav-t">Resource center</span></span>
      <span class="cl-nf cl-nf-av"><i>${I.avatar}</i><span class="cl-nav-t">My profile</span></span>
      <span class="cl-nf cl-nf-col"><i>${I.collapse}</i><span class="cl-nav-t">Collapse</span></span>
    </div>
  </aside>

  <div class="cl-app">
    <section class="cl-mh">
      <div class="cl-mh-row">
        <div class="cl-mh-t">
          <h1 class="cl-title">No matter open</h1>
          <div class="cl-crumb"><span class="cl-crumb-m">Open an ECF notice to load its matter</span><span class="cl-state">Open</span></div>
        </div>
        <div class="cl-mh-btns">
          <span class="cl-btn">Share</span>
          <span class="cl-btn">Edit matter</span>
          <span class="cl-btn cl-save">Save</span>
        </div>
      </div>
      <dl class="cl-fields">
        ${field('Case number', 'cl-f-no')}
        ${field('Court', 'cl-f-court')}
        ${field('District judge', 'cl-f-dj')}
        ${field('Magistrate judge', 'cl-f-mj')}
        ${field('Nature of suit', 'cl-f-nos')}
        ${field('Filed', 'cl-f-filed')}
      </dl>
    </section>

    <nav class="cl-tabs">${TABS.map((t) => `<span class="cl-tab">${t}</span>`).join('')}<span class="cl-und"></span></nav>

    <div class="cl-body">
      <section class="cl-q">
        <div class="cl-q-h">ECF notices <span class="cl-q-live"><i></i>Reading <b class="cl-q-ln">0</b></span></div>
        <div class="cl-q-top"><b class="cl-q-n">0</b><small>new</small><span class="cl-q-sub">handled in your voice</span></div>
        <ul class="cl-q-list"></ul>
      </section>
      <section class="cl-main">
        <div class="cl-view cl-v-idle">
          <div class="cl-card cl-agenda">
            <div class="cl-ch"><b>Upcoming calendar entries</b><small class="cl-ch-r"><span class="cl-wd">${esc(DESK.weekday)}, </span>${esc(DESK.date)}</small></div>
            ${IDLE.agenda.map(([when, what]) => `<div class="cl-ag"><span class="cl-ag-t">${esc(when)}</span><span class="cl-ag-d"></span><span class="cl-ag-w cl-fit">${esc(what)}</span></div>`).join('')}
          </div>
          <div class="cl-card cl-idle-tasks">
            <div class="cl-ch"><b>My tasks</b><small class="cl-ch-r">Last 7 days</small></div>
            ${IDLE.tasks.map(([what, due]) => `<div class="cl-it"><span class="cl-cbx"></span><span class="cl-it-w cl-fit">${esc(what)}</span><small>${esc(due)}</small></div>`).join('')}
          </div>
          <div class="cl-card cl-idle-empty">
            <b>${esc(IDLE.title)}</b>
            <p>${esc(IDLE.sub)}</p>
            <span class="cl-btn cl-btn-p">Open next notice</span>
          </div>
        </div>

        <div class="cl-view cl-v-act">
          <div class="cl-act-h"><h4>${I.caret}Court rules</h4><small class="cl-act-sub">Your judges' standing orders</small>
            <span class="cl-sel">All judges ${I.caret}</span>
            <span class="cl-cnt"><b class="cl-cn">0</b><small>rules read</small></span>
          </div>
          <div class="cl-act-head"><span class="cl-ar-j">Judge</span><span class="cl-ar-d">Document</span><span class="cl-ar-s">Section</span><span class="cl-ar-r">Requirement</span></div>
          <div class="cl-act-vp"><div class="cl-act-in"></div></div>
        </div>

        <div class="cl-view cl-v-call">
          <div class="cl-card cl-dk">
            <div class="cl-ch"><b>Docket entry</b><span class="cl-dk-no"></span><small class="cl-ch-r cl-dk-ent"></small></div>
            <div class="cl-dk-g">
              <div class="cl-dk-l">
                <div class="cl-dk-type"></div>
                <p class="cl-dk-text"></p>
                <div class="cl-dl">
                  <span class="cl-dl-tile"><small></small><b></b></span>
                  <span class="cl-dl-m"><small>Deadline</small><b class="cl-dl-what"></b><em class="cl-dl-basis"></em></span>
                </div>
                <div class="cl-acts"></div>
              </div>
              <div class="cl-dk-r">
                <div class="cl-rel-h">Related entries</div>
                <div class="cl-rel"></div>
              </div>
            </div>
            <div class="cl-tr"><span class="cl-tr-l">ORDER</span><p class="cl-tr-1"></p></div>
            <div class="cl-tr"><span class="cl-tr-l you">YOUR DRAFT</span><p class="cl-tr-2"></p><b class="cl-tr-ok">${I.check}in your voice</b></div>
          </div>
          <div class="cl-lower">
            <div class="cl-card cl-tk">
              <div class="cl-ch"><b>Tasks</b><span class="cl-cnt-pill cl-tkn">0</span><small class="cl-ch-r">Calendar entries from notices</small></div>
              <div class="cl-tk-head"><span class="cl-tk-hn">Name</span><span class="cl-tk-hd">Due</span><span class="cl-tk-hs">Status</span></div>
              <div class="cl-rows"></div>
            </div>
            <div class="cl-card cl-up">
              <div class="cl-ch"><b>Upcoming deadlines</b></div>
              <div class="cl-up-list"></div>
              <div class="cl-up-empty">Calendared deadlines appear here</div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <footer class="cl-foot">
      <span class="cl-fc"><small>Notices read</small><b class="cl-fc-r">0</b></span>
      <span class="cl-fc"><small>Deadlines calendared</small><b class="cl-fc-c">0</b></span>
      <span class="cl-fc"><small>Time logged</small><b class="cl-fc-h">0.0${NB}h</b></span>
      <span class="cl-foot-r">Clio Manage, superbot working as you</span>
    </footer>
  </div>
  </div>

  <div class="cl-hud">
    <div class="cl-hud-h"><span class="cl-hud-mark"></span><span class="cl-hud-cur">Opening your docket in Clio</span></div>
    <ul class="cl-hud-steps">${STEPS.map((s) => `<li><i></i>${esc(s)}</li>`).join('')}</ul>
    <div class="cl-hud-voice">
      <div class="cl-hud-lane"><b>Your briefs</b><span class="cl-hud-bars" data-l="you"></span></div>
      <div class="cl-hud-lane sb"><b>Superbot</b><span class="cl-hud-bars" data-l="sb"></span></div>
      <div class="cl-hud-mh"><span>Writing style</span><b class="cl-hud-ok">${I.check}matched</b></div>
      <div class="cl-hud-meter"><i></i></div>
    </div>
    <div class="cl-hud-res"><b>What your judges require</b><div class="cl-hud-chips"></div></div>
    <div class="cl-hud-stats"><span>read <b class="cl-hs-r">0</b></span><span>calendared <b class="cl-hs-c">0</b></span><span>logged <b class="cl-hs-h">0.0${NB}h</b></span></div>
  </div>
</div>`;
  section.appendChild(root);
  $('.cl-hud-mark', root).appendChild(hudMark.el);

  const tabs = [...root.querySelectorAll('.cl-tab')];
  const ovTab = tabs[TAB_OV], actTab = tabs[TAB_ACT];

  // the ECF notices queue: one row per notice, built once and placed every frame from t
  const qList = $('.cl-q-list', root);
  const qRows = NOTICES.map((q) => {
    const n = h(`<li class="cl-qi">
      <span class="cl-qi-ct">${esc(q.courtAbbrev)}</span>
      <span class="cl-qi-m"><span class="cl-qi-n">${esc(q.captionShort)}</span><span class="cl-qi-r">${esc(`${ecfNo(q.ecf)} · ${q.entryType}`)}</span></span>
      <em class="cl-qi-p s-new"><i></i>${I.check}<span class="cl-pl">New</span></em></li>`);
    qList.appendChild(n);
    return { n, q, p: $('.cl-qi-p', n), r: $('.cl-qi-r', n), nm: $('.cl-qi-n', n), pl: $('.cl-pl', n) };
  });
  const qEmpty = h(`<div class="cl-q-empty">Docket synced. New notices land here.</div>`);
  qList.appendChild(qEmpty);

  // the rules list (LEARN): the rows twice, so it has something to scroll through
  const actIn = $('.cl-act-in', root);
  const actRows = [];
  for (let rep = 0; rep < 2; rep++) for (const [judge, doc, sec, req] of RULES) {
    const n = h(`<div class="cl-arow">
      <span class="cl-ar-j cl-fit">${esc(judge)}</span><span class="cl-ar-d">${I.doc}<span class="cl-fit">${esc(doc)}</span></span>
      <span class="cl-ar-s cl-fit">${esc(sec)}</span><span class="cl-ar-r cl-fit">${esc(req)}</span></div>`);
    actIn.appendChild(n);
    actRows.push(n);
  }
  const actPx = actRows.length * AROW_H;

  // the calendar tasks (one per matter) above the older ones, and the action pills (one set per matter)
  const rowsBox = $('.cl-rows', root);
  const oldBox = h(`<div class="cl-oldrows">${OLD_TASKS.map(([nm, sub, when]) => `<div class="cl-row cl-row-old">
      <span class="cl-row-m"><b class="cl-fit">${esc(nm)}</b><small class="cl-fit">${esc(sub)}</small></span>
      <span class="cl-row-d">${esc(when)}</span><span class="cl-chip">CALENDARED</span></div>`).join('')}</div>`);
  const tasks = MATTERS.map((m) => {
    const n = h(`<div class="cl-row">
      <span class="cl-row-m"><b class="cl-fit">${esc(m.task)}</b><small class="cl-fit">${esc(`${m.captionShort}, ${m.cite}`)}</small></span>
      <span class="cl-row-d">${esc(m.deadline.date)}</span><span class="cl-chip open">OPEN</span></div>`);
    rowsBox.prepend(n);
    return { n, chip: $('.cl-chip', n), want: false };
  });
  rowsBox.appendChild(oldBox);
  // every task row in the order the card shows them: this session's (newest on top), then the older ones
  const rowOrder = [...tasks].reverse().map((tk) => ({ n: tk.n, tk, want: false }))
    .concat([...oldBox.children].map((n) => ({ n, want: true })));
  const actBox = $('.cl-acts', root);
  const acts = MATTERS.map((m) => m.actions.map((s) => {
    const n = h(`<span class="cl-act">${esc(s)}</span>`);
    actBox.appendChild(n);
    return n;
  }));
  const relBox = $('.cl-rel', root);
  // two Related entries slots; their label, text and age follow the live matter (renderCall)
  const rels = [0, 1].map(() => {
    const n = h(`<div class="cl-rel-i"><div class="cl-rel-ih"><b></b><small></small></div><p></p></div>`);
    relBox.appendChild(n);
    return { n, b: $('b', n), s: $('small', n), p: $('p', n) };
  });
  // the upcoming-deadlines card: one line per matter, shown once its task is calendared
  const upBox = $('.cl-up-list', root);
  const ups = MATTERS.map((m) => {
    const [mo, d] = tile(m.deadline.date);
    const n = h(`<div class="cl-up-i"><span class="cl-dl-tile"><small>${esc(mo)}</small><b>${esc(d)}</b></span>
      <span class="cl-up-m"><b class="cl-fit">${esc(m.deadline.what)}</b><small class="cl-fit">${esc(m.captionShort)}</small></span></div>`);
    upBox.appendChild(n);
    return n;
  });

  // the HUD's writing lanes: 26 deterministic bars each, plus the match meter
  const lane = (which) => {
    const box = $(`.cl-hud-bars[data-l="${which}"]`, root);
    const out = [];
    for (let i = 0; i < 26; i++) { const b = document.createElement('i'); box.appendChild(b); out.push(b); }
    return out;
  };
  const barsYou = lane('you'), barsSb = lane('sb');
  const YOU = Array.from({ length: 26 }, (_, i) => clamp(0.26 + 0.74 * Math.abs(Math.sin(i * 0.58 + 0.7)) * (0.52 + 0.48 * Math.abs(Math.sin(i * 0.21 + 1.3))) * (0.68 + 0.32 * rand(i + 3)), 0, 1));
  const OTHER = YOU.map((_, i) => clamp(0.24 + 0.76 * YOU[(i * 5 + 3) % 26], 0, 1));

  const chipBox = $('.cl-hud-chips', root);
  const resChips = REQUIREMENTS.map((r) => {
    const n = h(`<span class="cl-hud-chip">${I.check}${esc(r)}</span>`);
    chipBox.appendChild(n);
    return n;
  });

  el = {
    root, hudMark, tabs, ovTab, actTab,
    save: $('.cl-save', root), timer: $('.cl-timer', root), tclock: $('.cl-tclock', root), av: $('.cl-nf-av i', root),
    belln: $('.cl-bell-n', root), qn: $('.cl-q-n', root),
    fcr: $('.cl-fc-r', root), fcc: $('.cl-fc-c', root), fch: $('.cl-fc-h', root),
    qlive: $('.cl-q-live', root), qln: $('.cl-q-ln', root), qEmpty, qRows,
    cn: $('.cl-cn', root), actIn, actRows, actPx, und: $('.cl-und', root),
    vIdle: $('.cl-v-idle', root), vAct: $('.cl-v-act', root), vCall: $('.cl-v-call', root),
    title: $('.cl-title', root), crumb: $('.cl-crumb-m', root), state: $('.cl-state', root), fields: $('.cl-fields', root),
    fNo: $('.cl-f-no', root), fCourt: $('.cl-f-court', root), fDj: $('.cl-f-dj', root), fMj: $('.cl-f-mj', root),
    fDjL: $('.cl-f-dj', root).previousElementSibling,
    fNos: $('.cl-f-nos', root), fFiled: $('.cl-f-filed', root),
    dkNo: $('.cl-dk-no', root), dkEnt: $('.cl-dk-ent', root), dkType: $('.cl-dk-type', root), dkText: $('.cl-dk-text', root),
    dl: $('.cl-dl', root), dlMo: $('.cl-dl .cl-dl-tile small', root), dlDay: $('.cl-dl .cl-dl-tile b', root),
    dlWhat: $('.cl-dl-what', root), dlBasis: $('.cl-dl-basis', root),
    acts, rels, relBox, ups, upEmpty: $('.cl-up-empty', root),
    tr1: $('.cl-tr-1', root), tr2: $('.cl-tr-2', root), trOk: $('.cl-tr-ok', root),
    tasks, tkn: $('.cl-tkn', root),
    hud: $('.cl-hud', root), hudCur: $('.cl-hud-cur', root), hudSteps: [...root.querySelectorAll('.cl-hud-steps li')],
    hudVoice: $('.cl-hud-voice', root), hudOk: $('.cl-hud-ok', root), hudMeter: $('.cl-hud-meter i', root),
    hudRes: $('.cl-hud-res', root), resChips, hudStats: $('.cl-hud-stats', root),
    hsR: $('.cl-hs-r', root), hsC: $('.cl-hs-c', root), hsH: $('.cl-hs-h', root),
    barsYou, barsSb, YOU, OTHER, cl: $('.cl', root), qListEl: qList, lay: null,
    rowsBox, rowOrder, upCard: $('.cl-up', root), actVp: $('.cl-act-vp', root),
    // the static strings that are fitted at a word boundary (their full text kept aside)
    fits: [...root.querySelectorAll('.cl-fit')].map((n) => { n._src = n.textContent; return n; }),
  };
  return el;
}

// ---------- per-frame render ----------
function callState(t) {
  for (let i = 0; i < WINS.length; i++) {
    if (t >= WINS[i][0] && t < WINS[i][1]) return { i, c: MATTERS[i], a: WINS[i][0], b: WINS[i][1], f: (t - WINS[i][0]) / (WINS[i][1] - WINS[i][0]) };
  }
  if (t >= WINS[2][1]) return { i: 2, c: MATTERS[2], a: WINS[2][0], b: WINS[2][1], f: 1 };
  return null;
}
const st = (c, k) => c.a + FR[k] * (c.b - c.a);

function renderQueue(t, waiting) {
  let live = 0;
  for (const row of el.qRows) {
    const q = row.q;
    if (t < q.tIn) { row.n.style.opacity = '0'; row.n.style.transform = 'translateY(-60px)'; continue; }
    // every newer arrival pushes this row down one slot as it slides in on top (smoothly, from its own ease)
    const ease = (o) => outCubic(seg(t, o.tIn, o.tIn + 0.42));
    let pushed = 0;
    for (const o of NOTICES) if (o.tIn > q.tIn) pushed += ease(o);
    const y = (pushed - (1 - ease(q))) * ROW_H;
    row.n.style.transform = `translateY(${y.toFixed(2)}px)`;
    // only the rows that fit are drawn: an older row pushed past the fold fades out as the next one slides in
    const fold = clamp(1 - (y / ROW_H - (el.lay.rows - 1)) * 2.5);
    // and the arriving row stays clear while its text would still be cut by the list's top edge, then fades in
    // over the last 12px of its slide, so no frame shows a half-cut row
    const edge = clamp((y + el.lay.padT + 4) / 12);
    row.n.style.opacity = (seg(t, q.tIn, q.tIn + 0.26) * fold * edge).toFixed(3);
    const read = t >= q.tAns, done = t >= q.tRes;
    const cls = done ? 's-cal' : read ? 's-read' : 's-new';
    if (row.p.className !== `cl-qi-p ${cls}`) row.p.className = `cl-qi-p ${cls}`;
    // a notice that sets no deadline is reviewed, not calendared
    setT(row.pl, done ? (q.noDeadline ? 'Reviewed' : 'Calendared') : read ? 'Reading' : 'New');
    if (!read) {
      row.p.style.opacity = (0.55 + 0.45 * Math.abs(Math.sin((t - q.tIn) * 5.2))).toFixed(3);
      row.p.style.transform = `scale(${(1 + 0.05 * Math.abs(Math.sin((t - q.tIn) * 5.2))).toFixed(3)})`;
    } else { row.p.style.opacity = '1'; row.p.style.transform = ''; }
    // the entry-type line becomes the disposition once the deadline is calendared
    // (the pill's width changes with its state, so the two text lines are fitted per state)
    fitT(row.nm, q.captionShort, cls);
    fitT(row.r, done ? q.disp : `${ecfNo(q.ecf)} · ${q.entryType}`, cls);
    row.r.classList.toggle('disp', done && !q.noDeadline);
    if (read && !done) live++;
  }
  setT(el.qln, String(live));
  // the landed state: the reading chip turns into "Docket clear"
  const clear = t >= LAND.a;
  if (el.qlive.classList.contains('clear') !== clear) {
    el.qlive.classList.toggle('clear', clear);
    el.qlive.innerHTML = clear ? `${I.check}Docket clear` : '<i></i>Reading <b class="cl-q-ln">0</b>';
    el.qln = $('.cl-q-ln', el.qlive) || el.qln;
    if (!clear) setT(el.qln, String(live));
  }
  el.qlive.style.opacity = seg(t, ANSWER.a + 0.15, ANSWER.a + 0.5).toFixed(3);
  el.qEmpty.style.opacity = (1 - seg(t, NOTICES[0].tIn, NOTICES[0].tIn + 0.3)).toFixed(3);
  setT(el.qn, String(waiting));
  setT(el.belln, String(waiting));
  el.belln.style.opacity = waiting > 0 ? '1' : '0';
}

function counts(t) {
  const read = t < ANSWER.a ? 0 : NOTICES.filter((q) => t >= q.tAns).length;
  const cal = NOTICES.filter((q) => t >= q.tRes && !q.noDeadline).length;
  return { read, cal, h: hours(read) };
}

function renderChrome(t) {
  // CONNECT: the Clio timer starts on the line going live and runs on the desk clock
  const on = t >= 0.55;
  el.root.classList.toggle('live', on);
  setT(el.tclock, hms(on ? t - 0.55 : 0));  // Clio's timer reads 00:00:00
  const av = outCubic(seg(t, 0.55, 1.0));
  el.av.style.opacity = (0.35 + 0.65 * av).toFixed(3);
  // counters (footer, and mirrored in the HUD's stats line)
  const c = counts(t);
  setT(el.fcr, String(c.read)); setT(el.fcc, String(c.cal)); setT(el.fch, c.h);
  setT(el.hsR, String(c.read)); setT(el.hsC, String(c.cal)); setT(el.hsH, c.h);
}

function renderHeader(t) {
  const c = callState(t);
  const fill = c ? outCubic(seg(t, c.a, c.a + 0.34)) : 0;
  const v = c ? c.c : null;
  fitT(el.title, v ? v.captionShort : IDLE.title);
  fitT(el.crumb, v ? `${v.caseNo}, ${v.courtAbbrev}` : IDLE.sub);
  el.state.style.opacity = v ? '1' : '0';
  // a magistrate judge presiding with no district judge takes the judge slot as "Presiding"
  const presiding = v && !v.districtJudge && v.magistrateJudge;
  setT(el.fDjL, presiding ? 'Presiding' : 'District judge');
  const vals = [
    [el.fNo, v ? v.caseNo : ''], [el.fCourt, v ? v.court : ''],
    [el.fDj, v ? (presiding ? `${v.magistrateJudge}, U.S.M.J.` : v.districtJudge || '') : ''],
    [el.fMj, v && !presiding ? v.magistrateJudge || '' : ''],
    [el.fNos, v ? v.natureOfSuit || '' : ''], [el.fFiled, v ? v.caseFiled : ''],
  ];
  // optional fields drop out when the matter has no value for them (idle keeps every slot as an empty frame);
  // the rest are fitted once their slot is laid out
  for (const [n, s] of vals) {
    const hide = !!v && !s;
    if (n.parentNode.style.display !== (hide ? 'none' : '')) n.parentNode.style.display = hide ? 'none' : '';
  }
  for (const [n, s] of vals) fitT(n, s, v ? v.caseNo : 'idle');
  el.fields.style.opacity = (0.3 + 0.7 * fill).toFixed(3);
  el.fields.style.transform = `translateY(${((1 - fill) * 4).toFixed(2)}px)`;
}

function renderViews(t) {
  const toAct = inOutCubic(seg(t, LEARN.a, LEARN.a + 0.35));
  const fromAct = inOutCubic(seg(t, 8.45, 8.80));
  const toCall = outCubic(seg(t, ANSWER.a - 0.02, ANSWER.a + 0.28));
  const actOn = toAct * (1 - fromAct);
  const callOn = toCall;
  const idleOn = (1 - toAct) * (1 - toCall);
  el.vIdle.style.opacity = idleOn.toFixed(3);
  el.vAct.style.opacity = actOn.toFixed(3);
  el.vCall.style.opacity = callOn.toFixed(3);
  // the underline slides from Dashboard to Calendar (measured per frame: the bundled font may land after mount)
  const ov = el.ovTab, ac = el.actTab;
  const bl = lerp(ov.offsetLeft, ac.offsetLeft, actOn), bw = lerp(ov.offsetWidth, ac.offsetWidth, actOn);
  el.und.style.left = bl.toFixed(2) + 'px';
  el.und.style.width = bw.toFixed(2) + 'px';
  el.ovTab.classList.toggle('on', actOn <= 0.5);
  el.actTab.classList.toggle('on', actOn > 0.5);
}

function renderLearn(t) {
  const c = outCubic(seg(t, LEARN.a + 0.30, 7.40));
  setT(el.cn, String(Math.round(RULES.length * c)));
  const vpH = el.actVp.clientHeight || 470;
  const y = -lerp(0, el.actPx - vpH, c);
  el.actIn.style.transform = `translateY(${Math.min(0, y).toFixed(2)}px)`;
  // the viewport is a whole number of rows tall (layout), so the list starts and stops on whole rows; while it
  // scrolls, its top and bottom edges fade so no half-cut row reads as a hard cut
  const fade = 26 * clamp(4 * Math.min(c, 1 - c));
  const fs = fade.toFixed(1) + 'px';
  if (el.actVp.style.getPropertyValue('--fade') !== fs) el.actVp.style.setProperty('--fade', fs);
}

function renderCall(t) {
  const c = callState(t);
  // the upcoming-deadlines card fills as each matter's task is calendared
  let anyUp = 0;
  el.ups.forEach((n, i) => {
    const at = st({ a: WINS[i][0], b: WINS[i][1] }, 'closed');
    const p = outCubic(seg(t, at, at + 0.4));
    n.style.display = t >= at ? '' : 'none';
    n.style.opacity = p.toFixed(3);
    n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 8).toFixed(2)}px)`;
    anyUp = Math.max(anyUp, p);
  });
  el.upEmpty.style.opacity = (1 - anyUp).toFixed(3);
  el.upEmpty.style.display = anyUp >= 1 ? 'none' : '';
  wholeRows(el.ups.map((n, i) => ({ n, want: t >= st({ a: WINS[i][0], b: WINS[i][1] }, 'closed') })), el.upCard);
  for (const n of el.ups) if (n.style.display !== 'none') for (const f of n.querySelectorAll('.cl-fit')) fitT(f, f._src);
  if (!c) {
    el.trOk.style.opacity = '0';
    return;
  }
  const k = c.c;
  // the docket entry lands first, then its deadline
  const prob = outCubic(seg(t, st(c, 'prob'), st(c, 'prob') + 0.3));
  const cause = outCubic(seg(t, st(c, 'cause'), st(c, 'cause') + 0.3));
  setT(el.dkNo, ecfNo(k.entry.ecf));
  setT(el.dkEnt, `Entered ${k.entry.entered}`);
  fitT(el.dkType, k.entry.entryType);
  fitT(el.dkText, k.entry.text);
  const [mo, d] = tile(k.deadline.date);
  setT(el.dlMo, mo); setT(el.dlDay, d);
  // the tile carries the date; the line repeats it only when the date would not fit a tile
  fitT(el.dlWhat, mo ? k.deadline.what : `${k.deadline.date}: ${k.deadline.what}`);
  fitT(el.dlBasis, k.deadline.basis);
  for (const n of [el.dkType, el.dkText]) {
    n.style.opacity = prob.toFixed(3);
    n.style.transform = `translateY(${((1 - prob) * 6).toFixed(2)}px)`;
  }
  el.dl.style.opacity = cause.toFixed(3);
  el.dl.style.transform = `translateY(${((1 - cause) * 6).toFixed(2)}px)`;
  // the action superbot clicks: only this matter's pill set is live, and its pressed one dips
  el.acts.forEach((set, si) => set.forEach((n, i) => {
    const live = si === c.i;
    n.style.display = live ? '' : 'none';
    const isP = live && i === k.press;
    const at = st(c, 'sol') + 0.10;
    const pr = isP ? press(t, at, 0.08, 0.10, 0.16) : 0;
    n.classList.toggle('press', isP && t >= at - 0.04);
    n.style.transform = `scale(${(1 - 0.06 * pr).toFixed(4)})`;
  }));
  el.rels.forEach((r, i) => {
    const [label, text, when] = k.related[i];
    setT(r.b, label); setT(r.s, when); fitT(r.p, text);
    r.n.style.opacity = (outCubic(seg(t, c.a + 0.04, c.a + 0.4)) * (1 - 0.3 * i)).toFixed(3);
  });
  // ORDER (verbatim) then YOUR DRAFT; the rates stretch so each line lands inside its matter's window
  // (each line streams its word-boundary fit, so a line too long for the ratio ends in a clean ellipsis)
  const quote = fitted(el.tr1, k.quote), draft = fitted(el.tr2, k.draft);
  const r1 = Math.max(62, quote.length / 0.7), r2 = Math.max(112, draft.length / 0.8);
  const n1 = streamCount(quote, st(c, 'turn1'), r1, t);
  if (el.tr1.textContent !== quote.slice(0, n1)) el.tr1.textContent = quote.slice(0, n1);
  const n2 = streamCount(draft, st(c, 'turn2'), r2, t);
  if (el.tr2.textContent !== draft.slice(0, n2)) el.tr2.textContent = draft.slice(0, n2);
  const ok = outCubic(seg(t, st(c, 'turn2') + 0.15, st(c, 'turn2') + 0.75));
  el.trOk.style.opacity = ok.toFixed(3);
  // tasks: this matter's calendar task is OPEN until it flips to CALENDARED
  const closeAt = st(c, 'closed');
  el.tasks.forEach((tk, i) => {
    const mine = i === c.i;
    const shown = t >= WINS[i][0] + 0.04;
    const appear = outCubic(seg(t, WINS[i][0] + 0.04, WINS[i][0] + 0.45));
    tk.want = shown;
    tk.n.style.opacity = appear.toFixed(3);
    const closed = t >= closeAt && mine;
    // the status chip flips over (1 -> 0 -> 1 on Y) as it turns from OPEN to CALENDARED
    const fs = mine ? seg(t, closeAt - 0.11, closeAt + 0.11) : 1;
    tk.chip.style.transform = `scaleY(${Math.max(0.02, Math.abs(0.5 - fs) * 2).toFixed(3)})`;
    const done = i < c.i || closed;
    tk.chip.classList.toggle('open', !done);
    setT(tk.chip, done ? 'CALENDARED' : 'OPEN');
  });
  // only whole rows: the rows that would be cut by the card's bottom edge are not drawn
  wholeRows(el.rowOrder.map((r) => ({ n: r.n, want: r.tk ? r.tk.want : true })), el.rowsBox);
  for (const r of el.rowOrder) if (r.n.style.display !== 'none') for (const f of r.n.querySelectorAll('.cl-fit')) fitT(f, f._src);
  setT(el.tkn, String(c.i + 1 + OLD_TASKS.length));
  // Save is pressed as the matter closes
  const ep = press(t, st(c, 'end'), 0.07, 0.08, 0.14);
  el.save.style.transform = `scale(${(1 - 0.06 * ep).toFixed(4)})`;
  el.save.style.filter = ep > 0 ? `brightness(${(1 - 0.22 * ep).toFixed(3)})` : '';
}

function renderHud(t) {
  const cur = t < 1.50 ? 'Opening your docket in Clio'
    : t < VOICE.a ? 'Clio connected, notices syncing'
      : t < 4.30 ? 'Matching your writing'
        : t < LEARN.a ? 'Writing style matched'
          : t < 8.30 ? 'Reading your judges’ rules'
            : t < LAND.a ? 'Working your docket' : `Docket clear · ${N_NOTICES} notices handled`;
  setT(el.hudCur, cur);
  // each step is ACTIVE (bright label, pulsing green dot) while its beat runs and ticks when the beat lands
  el.hudSteps.forEach((li, i) => {
    const done = t >= STEP_DONE[i];
    const cur = !done && t >= (i === 0 ? 0 : STEP_DONE[i - 1]);
    li.classList.toggle('done', done);
    li.classList.toggle('cur', cur);
    const dot = li.firstElementChild;
    if (cur) {
      const b = 0.5 - 0.5 * Math.cos((t - (i === 0 ? 0 : STEP_DONE[i - 1])) * Math.PI * 2 / 1.1);
      dot.style.boxShadow = `inset 0 0 0 1.5px #34c759, 0 0 0 ${(1 + 4 * b).toFixed(2)}px rgba(52,199,89,${(0.42 * (1 - b)).toFixed(3)})`;
    } else if (dot.style.boxShadow) dot.style.boxShadow = '';
  });
  // the writing panel (VOICE): no score, just "matched" with a check once the lanes agree
  const vo = inOutCubic(seg(t, VOICE.a + 0.04, VOICE.a + 0.34)) * (1 - inOutCubic(seg(t, 4.40, 4.72)));
  el.hudVoice.style.maxHeight = (124 * vo).toFixed(1) + 'px';
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
    el.hudMeter.style.width = (100 * cv).toFixed(1) + '%';
    const okp = outCubic(seg(t, 4.0, 4.3));
    el.hudOk.style.opacity = okp.toFixed(3);
    el.hudOk.style.transform = okp >= 1 ? 'none' : `scale(${lerp(0.8, 1, okp).toFixed(3)})`;
  }
  // what superbot learned (LEARN); it folds away again once the notices start, so the HUD stays small
  const ro = inOutCubic(seg(t, 6.55, 6.85)) * (1 - inOutCubic(seg(t, ANSWER.a + 0.35, ANSWER.a + 0.75)));
  el.hudRes.style.opacity = ro.toFixed(3);
  el.hudRes.style.maxHeight = (150 * ro).toFixed(1) + 'px';
  el.resChips.forEach((n, i) => {
    const p = outCubic(seg(t, 6.62 + i * 0.15, 6.62 + i * 0.15 + 0.4));
    n.style.opacity = (p * ro).toFixed(3);
    n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 8).toFixed(2)}px)`;
  });
  const so = inOutCubic(seg(t, ANSWER.a - 0.2, ANSWER.a + 0.2));
  el.hudStats.style.opacity = so.toFixed(3);
  el.hudStats.style.maxHeight = (34 * so).toFixed(1) + 'px';
  el.hudMark.render(t);
}

// the desk is authored in design px and scaled up to the frame, so its type reads at the size the real
// screens show it. Narrower ratios scale less and restack (clio.css). Same factors as the call-center spot.
const UI_SCALE = (W) => (W >= 1900 ? 1.3 : W >= 1400 ? 1.2 : W >= 1000 ? 1.1 : 1.05);
function layout(W) {
  if (el.lay && el.lay.W === W) return el.lay;
  const S = UI_SCALE(W);
  el.cl.style.width = (W / S).toFixed(2) + 'px';
  el.cl.style.height = (1080 / S).toFixed(2) + 'px';
  el.cl.style.transform = `scale(${S})`;
  const cs = getComputedStyle(el.qListEl);
  const listH = el.qListEl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  el.lay = { W, S, rows: Math.max(3, Math.floor(listH / ROW_H)), padT: parseFloat(cs.paddingTop) };
  // the court-rules viewport: as many WHOLE rules rows as the pane holds
  el.actVp.style.flex = ''; el.actVp.style.height = '';
  const vpRows = Math.max(1, Math.floor(el.actVp.clientHeight / AROW_H));
  el.actVp.style.flex = 'none'; el.actVp.style.height = `${vpRows * AROW_H}px`;
  return el.lay;
}

export function render(t, W = 1920) {
  if (!el) return;
  layout(W);
  for (const n of el.fits) if (n.offsetParent) fitT(n, n._src);
  const waiting = t < QWAIT_IN.b ? Math.round(N_NOTICES * outCubic(seg(t, QWAIT_IN.a, QWAIT_IN.b)))
    : t < ANSWER.a ? N_NOTICES
      : NOTICES.filter((q) => t < q.tAns).length;
  renderChrome(t);
  renderHeader(t);
  renderViews(t);
  renderQueue(t, waiting);
  renderLearn(t);
  renderCall(t);
  renderHud(t);
}

export default { id: 'clio', DUR, mount, render };

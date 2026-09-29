// proconnect.js: the Intuit ProConnect Tax desk, and the four beats superbot works on it.
// It is one DOM tree built at mount and then driven purely from local time t (?t=<s> reproduces any frame), so the
// spot is seek-safe at every ratio. The chrome (the dark-blue nav rail with its white active bar, the 60px white top
// bar, the Tax Returns 2025 list with its segmented control and EFILE STATUS columns, the 1040 Individual count card,
// the E-File Dashboard, a return's header with its Profile / SmartReturn / Input return / Check return / File return
// tabs, the diagnostics headings and the rejected acknowledgement's Error message / Solution / Code) is rebuilt in
// HTML from the measured values of Intuit's own captures (reference pack .tmp/tp-uiref.0f0aa66c, see
// proconnect.tokens.css). The motion is the call-center spot's (e360.js) beat for beat: every window, WINS, FR
// fraction and HUD rule is unchanged; only what the desk shows is a preparer's extension season. One real Intuit
// mark sits in the chrome, the circle-arrow mark atop the rail (../../img/proconnect-rail-mark-capture-1x.png, see
// ../../img/CREDITS.txt). Every figure, code and date comes from proconnect-data.js, where each record carries the
// facts-pack ids it restates. No person is named.
import { clamp, lerp, seg, outCubic, inOutCubic, press, esc, streamCount } from '../../lib.js';
import { I, DESK, REQUESTS, QUEUE, ACKS, PAST, TOPICS, VOICE_LINES, STEPS, SEGMENTS, COLS, EXT, STATE_STATUS, STATUS,
  FLOW, CHECKS } from './proconnect-data.js';

const NB = ' ';

// ---------- the desk's own clock (seconds, local to the desk layer): the call-center spot's, unchanged ----------
export const DUR = 18.40;
const CONNECT = { a: 0.00, b: 2.10 };
const VOICE = { a: 2.10, b: 4.60 };
const LEARN = { a: 4.60, b: 8.60 };
const ANSWER = { a: 8.60, b: 16.10 };
const LAND = { a: 16.10, b: DUR };

// the three returns the main pane works through, start to end
const WINS = [[8.90, 11.60], [11.60, 14.00], [14.00, 16.10]];
// where each step of a return lands inside its window, as a fraction of it (the source spot's, plus the checks and
// the E-file press this desk adds between its steps)
const FR = { prob: 0.04, cause: 0.12, sol: 0.20, turn1: 0.24, turn2: 0.36, checks: [0.22, 0.30, 0.38, 0.46, 0.54], efile: 0.60, closed: 0.80, end: 0.88 };
const STEP_DONE = [1.75, 4.35, 8.35, 16.15];
const QWAIT_IN = { a: 0.70, b: 1.70 };
const N_RET = QUEUE.length;
const CONNECT_ON = [0.35, 0.55];

const $ = (s, root) => root.querySelector(s);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const setT = (n, s) => { if (n && n.textContent !== s) n.textContent = s; };
const px = (n, v) => { const s = `${v}px`; if (n.style.height !== s) n.style.height = s; };
// Text that does not fit its box is cut at a WORD boundary and ends in an ellipsis (the lawyer spot's fitter):
// single-line (nowrap) and -webkit-line-clamp boxes alike, cached per text, frame width and font state.
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
    // a one-line (nowrap) box is judged on width alone: Avenir Next's tall ascenders overhang a tight line box,
    // so its scrollHeight always exceeds its clientHeight by a pixel or two
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
// the fitted form of s in box n, without leaving it there (for the lines that stream in letter by letter)
const fitCache = new Map();
function fitted(n, s) {
  const key = `${s}|${el.lay ? el.lay.W : 0}|${fontState()}|${n.className}`;
  if (fitCache.has(key)) return fitCache.get(key);
  const prev = n.textContent;
  n._fit = null; fitT(n, s);
  const out = n.textContent;
  const ok = !!n.clientWidth;
  n.textContent = prev; n._fit = null;
  if (ok) fitCache.set(key, out);
  return out;
}

// ---------- e-file status of a queue row at t (the product's own statuses) ----------
// An answered return keeps its first status until superbot presses E-file in its window; every other row is
// transmitted as soon as it is opened. Received by Intuit, then Received by agency, then Accepted at tRes.
function sentAt(q) {
  if (q.req !== undefined) { const [a, b] = WINS[q.req]; return a + FR.efile * (b - a); }
  return q.tAns;
}
function statusAt(q, t) {
  const s = sentAt(q);
  if (t < s) return q.init === 'Rejected' ? 'rej' : 'nef';
  if (t >= q.tRes) return 'acc';
  return t < s + 0.5 * (q.tRes - s) ? 'rbi' : 'rba';
}
const TONE = { rej: 's-rej', nef: 's-nef', rbi: 's-tx', rba: 's-tx', acc: 's-acc' };

// ProConnect's nav, top to bottom (labels per the reference; rendered as the collapsed 75px icon rail a return
// shows); the active item's white bar moves Tax returns -> E-File dashboard (LEARN) -> Tax returns
const NAV = [['returns', 'Tax returns'], ['clients', 'Clients'], ['efile', 'E-File dashboard'], ['link', 'Intuit Link'], ['reporting', 'Reporting'],
  null, ['advisor', 'Tax Advisor'], ['qb', 'QB Accountant'], ['all', 'All solutions'], null, ['purchase', 'Purchase']];
// a return's tabs (2025 wording); the underline sits on Input return while superbot enters the example and slides
// to File return as it e-files
const TABS = [['profile', 'Profile'], ['flask', 'SmartReturn'], ['pencil', 'Input return'], ['clip', 'Check return'], ['send', 'File return']];
const TAB_IN = 2, TAB_FILE = 4;

let el = null;

// ---------- mount ----------
export function mount(section, ctx) {
  const asset = (n) => new URL(`../../img/${n}`, import.meta.url).href;
  const root = h(`<div class="pc-root"></div>`);
  const hudMark = ctx.shell.makeMark(26);
  const chip = (k) => `<em class="pc-st ${TONE[k]}"><i></i>${I.check}<span class="pc-st-t">${STATUS[k]}</span></em>`;
  root.innerHTML = `
<div class="pc">
  <aside class="pc-rail">
    <span class="pc-mark"><img src="${asset('proconnect-rail-mark-capture-1x.png')}" alt="Intuit ProConnect"/></span>
    <div class="pc-rail-list">${NAV.map((n) => (n ? `<span class="pc-nav-i" data-k="${n[0]}" title="${esc(n[1])}">${I[n[0]]}</span>` : '<hr class="pc-rail-hr"/>')).join('')}</div>
    <div class="pc-rail-foot"><span class="pc-nav-i">${I.collapse}</span></div>
  </aside>
  <div class="pc-col">
    <header class="pc-top">
      <span class="pc-firm">Your firm</span>
      <div class="pc-topr">
        <span class="pc-ef"><i></i><b>Intuit e-file</b><span class="pc-ef-s">Not connected</span></span>
        <span class="pc-tool">${I.help}<span class="pc-tool-t">Help</span></span>
        <span class="pc-tool pc-bell"><span class="pc-bell-i">${I.bell}<i class="pc-bell-n">0</i></span><span class="pc-tool-t">Notifications</span></span>
        <span class="pc-tool">${I.gear}<span class="pc-tool-t">Settings</span><i class="pc-dot"></i></span>
        <span class="pc-av">${I.person}</span>
      </div>
    </header>
    <div class="pc-body">
      <section class="pc-q">
        <div class="pc-q-h"><b>Extension queue</b><span class="pc-q-live"><i></i>Filing <b class="pc-q-ln">0</b></span></div>
        <div class="pc-q-due">Due <b>${esc(DESK.due)}</b><span class="pc-q-left">${DESK.daysLeft}${NB}days left</span></div>
        <div class="pc-cnt">
          <div class="pc-cnt-h"><b>1040</b><span>Individual</span><i class="pc-pill-n">0</i></div>
          <div class="pc-cnt-b">
            <span class="pc-cr c-rej"><b>0</b>Rejected</span><span class="pc-cr c-nef"><b>0</b>Not e-filed</span>
            <span class="pc-cr c-tx"><b>0</b>Transmitted</span><span class="pc-cr c-acc"><b>0</b>Accepted</span>
          </div>
        </div>
        <ul class="pc-q-list"></ul>
      </section>

      <section class="pc-main">
        <div class="pc-view pc-v-idle">
          <div class="pc-title"><h1>Tax Returns <b>${DESK.taxYear}</b></h1>${I.caret}</div>
          <div class="pc-seg">${SEGMENTS.map((s, i) => `<span class="pc-seg-i${i === 0 ? ' on' : ''}">${esc(s)}</span>`).join('')}</div>
          <div class="pc-panel pc-list">
            <div class="pc-list-h"><h2>${DESK.taxYear} - All</h2><span class="pc-filter">Filter</span>
              <span class="pc-list-tools">${I.refresh}${I.download}${I.gear}</span></div>
            <div class="pc-th">${COLS.map((c, i) => `<span class="pc-c${i}">${c}</span>`).join('')}</div>
            <div class="pc-tvp"><div class="pc-tin"></div></div>
          </div>
        </div>

        <div class="pc-view pc-v-act">
          <div class="pc-title"><h1>E-File Dashboard</h1><span class="pc-ty">Tax Year <b>${DESK.taxYear}</b></span>
            <span class="pc-cnt2"><b class="pc-cn">0</b><small>past returns read</small></span></div>
          <div class="pc-tiles">
            <span class="pc-tile t-all"><b>${PAST.length}</b>ALL</span><span class="pc-tile t-rej"><b>0</b>REJECTED</span>
            <span class="pc-tile t-tx"><b>0</b>TRANSMITTED</span><span class="pc-tile t-acc"><b>${PAST.length}</b>ACCEPTED</span>
          </div>
          <div class="pc-panel pc-past">
            <div class="pc-th pc-th-p"><span class="pc-p0">STATUS</span><span class="pc-p1">TYPE</span><span class="pc-p2">CODE</span><span class="pc-p3">ERROR MESSAGE</span></div>
            <div class="pc-pvp"><div class="pc-pin"></div></div>
          </div>
        </div>

        <div class="pc-view pc-v-call">
          <div class="pc-rh">
            <h1 class="pc-rh-n"></h1>
            <span class="pc-rh-cp">${I.profile}Client profile</span>
            <span class="pc-meta"><small>Tax Year</small><b>${DESK.taxYear}</b></span>
            <span class="pc-meta"><small>Return type</small><b>1040</b></span>
            <span class="pc-meta pc-meta3"><small></small><b></b></span>
            <span class="pc-rh-r"><span class="pc-btn pc-btn-o">Notes</span><span class="pc-btn pc-btn-p"><i class="pc-dot"></i>Return actions${I.caret}</span></span>
          </div>
          <nav class="pc-tabs">${TABS.map(([k, t]) => `<span class="pc-tab">${I[k]}${t}</span>`).join('')}<span class="pc-und"></span></nav>
          <div class="pc-callb">
            <div class="pc-panel pc-ans">
              <div class="pc-ans-h"><b class="pc-ans-t" data-full="Details: Schedule 1-A (Form 1040), Additional Deductions">Details: Schedule 1-A (Form 1040), Additional Deductions</b><span class="pc-ans-tags"></span>
                <span class="pc-btn pc-btn-p pc-efile">E-file</span></div>
              <div class="pc-ans-g">
                <div class="pc-ans-l">
                  <div class="pc-lab">Client email</div>
                  <div class="pc-asked"></div>
                  <p class="pc-tr-1"></p>
                  <div class="pc-lab pc-lab-ex">IRS worked example</div>
                  <blockquote class="pc-rule"><p class="pc-rule-q"></p><small class="pc-rule-s"></small></blockquote>
                </div>
                <div class="pc-ans-r">
                  <div class="pc-math"></div>
                  <div class="pc-flow pc-fit">${esc(FLOW.text)}</div>
                  <div class="pc-checks">${CHECKS.map((c) => `<div class="pc-ck"><span class="pc-ck-i">${I.pending}${I.check}</span><span class="pc-ck-t">${esc(c.label)}</span>${c.val ? `<b class="pc-ck-v">${esc(c.val)}</b>` : ''}</div>`).join('')}</div>
                </div>
              </div>
              <div class="pc-thread">
                <span class="pc-tr-l">Your reply</span>
                <div class="pc-tr-ps"><p class="pc-tr-p"></p><p class="pc-tr-p"></p><p class="pc-tr-p"></p></div>
                <span class="pc-tr-side"><b class="pc-tr-ok">${I.check}in your writing</b><span class="pc-btn pc-btn-o pc-send">Send</span></span>
              </div>
            </div>
            <div class="pc-lower">
              <div class="pc-panel pc-ed">
                <div class="pc-ch"><b>E-File Dashboard</b><small>${DESK.taxYear}, 1040</small></div>
                <div class="pc-th pc-th-e"><span class="pc-e0">RETURN NAME</span><span class="pc-e1">CODE</span><span class="pc-e2">FEDERAL EFILE STATUS</span></div>
                <div class="pc-rows"></div>
              </div>
              <div class="pc-panel pc-ack">
                <div class="pc-ch"><b class="pc-ack-n"></b><span class="pc-ack-st"></span></div>
                <div class="pc-ack-g">
                  <div class="pc-hist"><div class="pc-hist-h">STATUS</div><div class="pc-hist-l"></div></div>
                  <dl class="pc-ack-m">
                    <dt>Error message:</dt><dd class="pc-ack-e"></dd>
                    <dt>Solution:</dt><dd class="pc-ack-s"></dd>
                    <dt>Code:</dt><dd class="pc-ack-c"></dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>

  <div class="pc-hud">
    <div class="pc-hud-h"><span class="pc-hud-mark"></span><span class="pc-hud-cur">Opening your returns in ProConnect</span></div>
    <ul class="pc-hud-steps">${STEPS.map((s) => `<li><i></i>${esc(s)}</li>`).join('')}</ul>
    <div class="pc-hud-voice">
      <div class="pc-hud-lane"><b>Your email</b><span class="pc-hud-line">${esc(VOICE_LINES.you)}</span></div>
      <div class="pc-hud-lane sb"><b>Superbot</b><span class="pc-hud-line pc-hud-sbl"></span></div>
      <div class="pc-hud-mh"><span>Writing style</span><b class="pc-hud-ok">${I.check}matched</b></div>
      <div class="pc-hud-meter"><i></i></div>
    </div>
    <div class="pc-hud-res"><b>Fixes learned from past rejects</b><div class="pc-hud-chips"></div></div>
    <div class="pc-hud-stats"><span>e-filed <b class="pc-hs-e">0</b></span><span>accepted <b class="pc-hs-a">0</b></span><span>rejects fixed <b class="pc-hs-r">0</b></span></div>
  </div>
</div>`;
  section.appendChild(root);
  $('.pc-hud-mark', root).appendChild(hudMark.el);

  // the queue: one row per return, built once and placed every frame from t
  const qList = $('.pc-q-list', root);
  const qRows = QUEUE.map((q) => {
    const n = h(`<li class="pc-qi">
      <span class="pc-qi-m"><span class="pc-qi-n"></span><span class="pc-qi-r"></span></span>
      ${chip(q.init === 'Rejected' ? 'rej' : 'nef')}</li>`);
    qList.appendChild(n);
    return { n, q, p: $('.pc-st', n), pl: $('.pc-st-t', n), r: $('.pc-qi-r', n), nm: $('.pc-qi-n', n) };
  });
  const qEmpty = h(`<div class="pc-q-empty">Intuit e-file connected. Returns land here.</div>`);
  qList.appendChild(qEmpty);

  // the list page's table (idle): all 12 returns with the product's EFILE STATUS columns
  const tin = $('.pc-tin', root);
  const tRows = QUEUE.map((q) => {
    const n = h(`<div class="pc-tr">
      <a class="pc-c0 pc-fit">${esc(q.label)}</a><span class="pc-c1">1040</span>
      <span class="pc-c2 ${q.init === 'Rejected' ? 'st-rej' : ''}">${esc(q.init)}</span><span class="pc-c3">${esc(STATE_STATUS)}</span>
      <span class="pc-c4">${esc(EXT.status)}</span></div>`);
    tin.appendChild(n);
    return n;
  });

  // the E-File Dashboard (LEARN): past rejected returns, each accepted after its fix
  const pin = $('.pc-pin', root);
  const pastRows = PAST.map(([code, msg, lift]) => {
    const n = h(`<div class="pc-prow${lift ? ' is-lift' : ''}">
      <span class="pc-p0"><em class="pc-st s-acc"><i></i>${I.check}<span class="pc-st-t">Accepted</span></em></span><span class="pc-p1">1040</span>
      <span class="pc-p2">${esc(code)}</span><span class="pc-p3 pc-fit">${esc(msg)}</span>${lift ? `<span class="pc-lift">${I.check}Fix learned</span>` : ''}</div>`);
    pin.appendChild(n);
    return n;
  });

  // the answer card's tags, math sets and checks (one set per return, only the live one shown)
  const tagBox = $('.pc-ans-tags', root);
  const tagSets = REQUESTS.map((r) => r.tags.map((s) => { const n = h(`<span class="pc-tag">${esc(s)}</span>`); tagBox.appendChild(n); return n; }));
  const mathBox = $('.pc-math', root);
  const maths = REQUESTS.map((r) => {
    const box = h(`<div class="pc-math-set">${r.math.map(([k, v], i) => `<div class="pc-mrow${i === r.math.length - 1 ? ' res' : ''}"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>`);
    mathBox.appendChild(box);
    return box;
  });

  // the lower-left E-File Dashboard: one row per return in the order it is opened; a window of whole rows follows
  const rowsBox = $('.pc-rows', root);
  const order = QUEUE.map((q, i) => ({ q, i })).sort((a, b) => a.q.tAns - b.q.tAns);
  const eRows = order.map(({ q }) => {
    const n = h(`<div class="pc-erow">
      <span class="pc-e0"><b data-full="${esc(q.label)}">${esc(q.label)}</b><small data-full="${esc(q.fix)}">${esc(q.fix)}</small></span>
      <span class="pc-e1">${esc(q.code)}</span>
      <span class="pc-e2">${chip(q.init === 'Rejected' ? 'rej' : 'nef')}</span></div>`);
    rowsBox.appendChild(n);
    return { n, q, p: $('.pc-st', n), pl: $('.pc-st-t', n) };
  });
  const winTop = (t, N) => {
    const shown = eRows.filter((r) => t >= r.q.tAns).length;
    const firstOpen = eRows.findIndex((r) => t >= r.q.tAns && t < r.q.tRes);
    const s = firstOpen < 0 ? shown - N : firstOpen - 1;
    return clamp(s, 0, Math.max(0, shown - N));
  };

  // the Rejected ack card: its status history rows (newest on top), rebuilt per ack
  const hist = $('.pc-hist-l', root);
  const histRows = ['acc', 'rba', 'rbi', 'rej'].map((k) => {
    const n = h(`<div class="pc-hr h-${k}"><span>${STATUS[k]}</span>${k === 'acc' ? `<small>${DESK.stamp}</small>` : ''}</div>`);
    hist.appendChild(n);
    return { k, n };
  });

  const chipBox = $('.pc-hud-chips', root);
  const resChips = TOPICS.map((r) => {
    const n = h(`<span class="pc-hud-chip">${I.check}${esc(r)}</span>`);
    chipBox.appendChild(n);
    return n;
  });

  el = {
    root, hudMark, winTop, eRows, rowsBox, qRows, qEmpty, qListEl: qList, tRows, pastRows, tagSets, maths, histRows, resChips,
    pc: $('.pc', root), navs: [...root.querySelectorAll('.pc-rail-list .pc-nav-i')],
    ef: $('.pc-ef', root), efS: $('.pc-ef-s', root), av: $('.pc-av', root), belln: $('.pc-bell-n', root),
    qlive: $('.pc-q-live', root), qln: $('.pc-q-ln', root), pillN: $('.pc-pill-n', root),
    cnt: { rej: $('.c-rej b', root), nef: $('.c-nef b', root), tx: $('.c-tx b', root), acc: $('.c-acc b', root) },
    tvp: $('.pc-tvp', root), pvp: $('.pc-pvp', root), pin, cn: $('.pc-cn', root),
    vIdle: $('.pc-v-idle', root), vAct: $('.pc-v-act', root), vCall: $('.pc-v-call', root),
    rhN: $('.pc-rh-n', root), m3: $('.pc-meta3 small', root), m3b: $('.pc-meta3 b', root), rhEls: [...root.querySelectorAll('.pc-rh > *')],
    tabs: [...root.querySelectorAll('.pc-tab')], und: $('.pc-und', root),
    asked: $('.pc-asked', root), tr1: $('.pc-tr-1', root), ruleQ: $('.pc-rule-q', root), ruleS: $('.pc-rule-s', root), rule: $('.pc-rule', root),
    cks: [...root.querySelectorAll('.pc-ck')], efile: $('.pc-efile', root), flow: $('.pc-flow', root),
    trPs: [...root.querySelectorAll('.pc-tr-p')], trOk: $('.pc-tr-ok', root), send: $('.pc-send', root),
    ack: $('.pc-ack', root), ackN: $('.pc-ack-n', root), ackSt: $('.pc-ack-st', root), ackE: $('.pc-ack-e', root), ackS: $('.pc-ack-s', root), ackC: $('.pc-ack-c', root),
    ackG: $('.pc-ack-g', root),
    hud: $('.pc-hud', root), hudCur: $('.pc-hud-cur', root), hudSteps: [...root.querySelectorAll('.pc-hud-steps li')],
    hudVoice: $('.pc-hud-voice', root), hudSbl: $('.pc-hud-sbl', root), hudOk: $('.pc-hud-ok', root), hudMeter: $('.pc-hud-meter i', root),
    hudRes: $('.pc-hud-res', root), hudStats: $('.pc-hud-stats', root), hsE: $('.pc-hs-e', root), hsA: $('.pc-hs-a', root), hsR: $('.pc-hs-r', root),
    lay: null,
    fits: [...root.querySelectorAll('.pc-fit')].map((n) => { n._src = n.textContent; return n; }),
  };
  return el;
}

// ---------- per-frame render ----------
function callState(t) {
  for (let i = 0; i < WINS.length; i++) {
    if (t >= WINS[i][0] && t < WINS[i][1]) return { i, c: REQUESTS[i], a: WINS[i][0], b: WINS[i][1], f: (t - WINS[i][0]) / (WINS[i][1] - WINS[i][0]) };
  }
  if (t >= WINS[2][1]) return { i: 2, c: REQUESTS[2], a: WINS[2][0], b: WINS[2][1], f: 1 };
  return null;
}
const st = (c, k) => c.a + FR[k] * (c.b - c.a);

function setChip(p, pl, k) {
  const cls = `pc-st ${TONE[k]}`;
  if (p.className !== cls) p.className = cls;
  setT(pl, STATUS[k]);
}

function renderQueue(t) {
  let live = 0;
  const ROW_H = el.lay.rowH;
  for (const row of el.qRows) {
    const q = row.q;
    if (t < q.tIn) { row.n.style.opacity = '0'; row.n.style.transform = 'translateY(-60px)'; continue; }
    // every newer arrival pushes this row down one slot as it slides in on top (smoothly, from its own ease)
    const ease = (o) => outCubic(seg(t, o.tIn, o.tIn + 0.42));
    let pushed = 0;
    for (const o of QUEUE) if (o.tIn > q.tIn) pushed += ease(o);
    const y = (pushed - (1 - ease(q))) * ROW_H;
    row.n.style.transform = `translateY(${y.toFixed(2)}px)`;
    // only the rows that fit are drawn: an older row pushed past the fold fades out as the next one slides in,
    // and the arriving row stays clear while the list's top edge would still cut it
    const fold = clamp(1 - (y / ROW_H - (el.lay.rows - 1)) * 2.5);
    const edge = clamp((y + el.lay.padT + 4) / 12);
    row.n.style.opacity = (seg(t, q.tIn, q.tIn + 0.26) * fold * edge).toFixed(3);
    const k = statusAt(q, t);
    setChip(row.p, row.pl, k);
    if (k === 'rej') {
      row.p.style.opacity = (0.6 + 0.4 * Math.abs(Math.sin((t - q.tIn) * 5.2))).toFixed(3);
    } else row.p.style.opacity = '1';
    const done = k === 'acc';
    // the chip beside the label changes width with the status, so the fit is keyed on the status
    fitT(row.nm, q.label, k);
    fitT(row.r, done ? q.disp : q.code, k);
    row.r.classList.toggle('disp', done);
    if (t >= q.tAns && !done) live++;
  }
  setT(el.qln, String(live));
  // the landed state: the filing chip turns into "Extension queue clear"
  const clear = t >= LAND.a;
  if (el.qlive.classList.contains('clear') !== clear) {
    el.qlive.classList.toggle('clear', clear);
    el.qlive.parentNode.classList.toggle('clear', clear);
    el.qlive.innerHTML = clear ? `${I.check}Extension queue clear` : '<i></i>Filing <b class="pc-q-ln">0</b>';
    el.qln = $('.pc-q-ln', el.qlive) || el.qln;
    if (!clear) setT(el.qln, String(live));
  }
  el.qlive.style.opacity = seg(t, ANSWER.a + 0.15, ANSWER.a + 0.5).toFixed(3);
  el.qEmpty.style.opacity = (1 - seg(t, QUEUE[0].tIn, QUEUE[0].tIn + 0.3)).toFixed(3);
  // the Notifications badge counts the IRS acknowledgements received so far: the rows now Accepted (the same number
  // as the 1040 card's Accepted count and the HUD's "accepted"); hidden while it is 0
  const acks = QUEUE.filter((q) => t >= q.tRes).length;
  setT(el.belln, String(acks));
  el.belln.style.opacity = acks > 0 ? '1' : '0';
}

// the 1040 Individual card: the literal count of queue rows in each e-file state (they rise in on CONNECT)
function renderCounts(t) {
  const n = { rej: 0, nef: 0, tx: 0, acc: 0 };
  for (const q of QUEUE) { const k = statusAt(q, t); n[k === 'rbi' || k === 'rba' ? 'tx' : k]++; }
  const rise = t < QWAIT_IN.b ? outCubic(seg(t, QWAIT_IN.a, QWAIT_IN.b)) : 1;
  setT(el.cnt.rej, String(Math.round(n.rej * rise)));
  setT(el.cnt.nef, String(Math.round(n.nef * rise)));
  setT(el.cnt.tx, String(n.tx));
  setT(el.cnt.acc, String(n.acc));
  setT(el.pillN, String(Math.round(N_RET * rise)));
  return n;
}

function counts(t) {
  const efiled = QUEUE.filter((q) => t >= sentAt(q)).length;
  const accepted = QUEUE.filter((q) => t >= q.tRes).length;
  const fixed = QUEUE.filter((q) => q.init === 'Rejected' && t >= q.tRes).length;
  return { efiled, accepted, fixed };
}

function renderChrome(t) {
  // CONNECT: Intuit e-file connects (the source spot's CTI switch, same 0.35 to 0.55 window) and the top bar settles
  const on = seg(t, CONNECT_ON[0], CONNECT_ON[1]);
  el.root.classList.toggle('live', on > 0.5);
  setT(el.efS, t >= CONNECT_ON[1] ? 'Connected' : on > 0 ? 'Connecting' : 'Not connected');
  const me = outCubic(seg(t, 0.55, 1.0));
  el.av.style.opacity = (0.35 + 0.65 * me).toFixed(3);
  el.av.style.transform = `translateX(${((1 - me) * 8).toFixed(2)}px)`;
  const c = counts(t);
  setT(el.hsE, String(c.efiled)); setT(el.hsA, String(c.accepted)); setT(el.hsR, String(c.fixed));
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
  el.vIdle.style.visibility = idleOn <= 0.002 ? 'hidden' : '';
  el.vAct.style.visibility = actOn <= 0.002 ? 'hidden' : '';
  el.vCall.style.visibility = callOn <= 0.002 ? 'hidden' : '';
  // the rail's active item: E-File dashboard while the dashboard is up, Tax returns otherwise
  const onK = actOn > 0.5 ? 'efile' : 'returns';
  for (const n of el.navs) n.classList.toggle('on', n.dataset.k === onK);
}

function renderLearn(t) {
  const c = outCubic(seg(t, LEARN.a + 0.30, 7.40));
  const n = Math.round(PAST.length * c);
  setT(el.cn, String(n));
  const vpH = el.pvp.clientHeight || 400;
  const y = -lerp(0, Math.max(0, el.lay.pastPx - vpH), c);
  el.pin.style.transform = `translateY(${Math.min(0, y).toFixed(2)}px)`;
  // each past return lights as it is read (the count and the highlight move together); the four fixes the queue
  // needs later lift out with a tag
  el.pastRows.forEach((r, i) => r.classList.toggle('read', i < n));
  const fade = 26 * clamp(4 * Math.min(c, 1 - c));
  const fs = fade.toFixed(1) + 'px';
  if (el.pvp.style.getPropertyValue('--fade') !== fs) el.pvp.style.setProperty('--fade', fs);
}

function renderRows(t) {
  const N = el.lay.eRowsN;
  const RH = el.lay.eRowH;
  // the window's top index, eased between its steps: a step at time T glides over [T, T + 0.35]
  let top = el.winTop(ANSWER.a, N);
  for (const [T, d] of el.lay.winSteps) top += d * outCubic(seg(t, T, T + 0.35));
  el.eRows.forEach((r, i) => {
    const shown = t >= r.q.tAns;
    const y = (i - top) * RH;
    const inWin = clamp(1 + 2 * y / RH) * clamp(2 * (N - y / RH) - 1);
    const appear = outCubic(seg(t, r.q.tAns, r.q.tAns + 0.4));
    const vis = shown ? inWin * appear : 0;
    r.n.style.opacity = vis.toFixed(3);
    r.n.style.visibility = vis <= 0.002 ? 'hidden' : '';
    r.n.style.transform = `translateY(${y.toFixed(2)}px)`;
    const k = statusAt(r.q, t);
    setChip(r.p, r.pl, k);
    r.n.classList.toggle('done', k === 'acc');
    if (vis > 0.002) for (const f of r.n.querySelectorAll('.pc-fit')) fitT(f, f._src);
  });
}

// the Rejected ack card (queue rows 4 to 7): Error message / Solution / Code, and the status history growing from
// Rejected to Accepted with the acknowledgement date
function renderAck(t) {
  const k = ACKS.find((a) => t >= a.a && t < a.b) || ACKS[0];
  const q = k.q;
  const inA = outCubic(seg(t, k.a, k.a + 0.3));
  el.ackG.style.opacity = (k === ACKS[0] ? 1 : inA).toFixed(3);
  const s = statusAt(q, t);
  // the status link reads the current status, as the dashboard's STATUS cell does (set first: the title is fitted
  // into what the link leaves)
  if (el.ackSt._k !== s) {
    el.ackSt._k = s;
    el.ackSt.className = `pc-ack-st ${TONE[s]}`;
    el.ackSt.innerHTML = s === 'acc' ? `${I.check}${STATUS.acc} <small>${DESK.stamp}</small>` : STATUS[s];
  }
  // shown in full (they wrap; never cut): the return's name, the IRS error message and the fix
  for (const [n, v] of [[el.ackE, k.msg], [el.ackS, k.fix]]) { setT(n, v); if (n.dataset.full !== v) n.dataset.full = v; }
  // the title may wrap, but never inside its rule code: "(F8962-070)" is kept on one line (same text)
  if (el.ackN.dataset.full !== q.label) {
    el.ackN.dataset.full = q.label;
    el.ackN.innerHTML = esc(q.label).replace(/(\([^)]*\))$/, '<span class="pc-nw">$1</span>');
  }
  setT(el.ackC, k.code);
  const lvl = { rej: 0, nef: 0, rbi: 1, rba: 2, acc: 3 }[s];
  const at = [0, sentAt(q), sentAt(q) + 0.5 * (q.tRes - sentAt(q)), q.tRes];
  el.histRows.forEach(({ k: hk, n }) => {
    const i = { rej: 0, rbi: 1, rba: 2, acc: 3 }[hk];
    const on = i <= lvl;
    const p = i === 0 ? 1 : outCubic(seg(t, at[i], at[i] + 0.25));
    n.style.display = on ? '' : 'none';
    n.style.opacity = on ? p.toFixed(3) : '0';
    n.classList.toggle('cur', i === lvl);
  });
}

function renderCall(t) {
  renderRows(t);
  renderAck(t);
  const c = callState(t);
  // the tab underline: Input return while the example is entered, File return from the E-file press
  const toFile = c ? outCubic(seg(t, st(c, 'efile') - 0.1, st(c, 'efile') + 0.2)) : 0;
  const a = el.tabs[TAB_IN], b = el.tabs[TAB_FILE];
  const back = c && c.i > 0 ? 1 - outCubic(seg(t, c.a - 0.02, c.a + 0.26)) : 0;
  const u = clamp(toFile + back);
  el.und.style.left = lerp(a.offsetLeft, b.offsetLeft, u).toFixed(2) + 'px';
  el.und.style.width = lerp(a.offsetWidth, b.offsetWidth, u).toFixed(2) + 'px';
  a.classList.toggle('on', u <= 0.5);
  b.classList.toggle('on', u > 0.5);

  const v = c ? c.c : REQUESTS[0];
  const fill = c ? outCubic(seg(t, c.a, c.a + 0.34)) : 0;
  // the third meta first: the title is fitted into what the metas leave
  setT(el.m3, v.meta3[0]); setT(el.m3b, v.meta3[1]);
  fitT(el.rhN, v.title, v.meta3.join('|'));
  for (const n of el.rhEls) {
    n.style.opacity = (c ? 0.3 + 0.7 * fill : 0.3).toFixed(3);
  }
  el.tagSets.forEach((set, i) => set.forEach((n) => { n.style.display = c && c.i === i ? '' : 'none'; }));
  if (!c) {
    // before the first return opens, the answer card is an empty frame
    el.trOk.style.opacity = '0';
    el.maths.forEach((box) => { box.style.display = 'none'; });
    el.flow.style.opacity = '0';
    el.cks.forEach((n) => { n.style.opacity = '0'; });
    el.efile.style.opacity = '0';
    return;
  }
  const k = c.c;
  const prob = outCubic(seg(t, st(c, 'prob'), st(c, 'prob') + 0.3));
  const cause = outCubic(seg(t, st(c, 'cause'), st(c, 'cause') + 0.3));
  fitT(el.asked, k.asked);
  fitT(el.ruleQ, k.quote);
  setT(el.ruleS, k.source);
  el.asked.style.opacity = prob.toFixed(3);
  el.asked.style.transform = `translateY(${((1 - prob) * 6).toFixed(2)}px)`;
  el.rule.style.opacity = cause.toFixed(3);
  el.rule.style.transform = `translateY(${((1 - cause) * 6).toFixed(2)}px)`;
  // the math lands with the example, then the line it flows to
  el.maths.forEach((box, i) => {
    box.style.display = i === c.i ? '' : 'none';
    box.style.opacity = (i === c.i ? outCubic(seg(t, c.a + 0.04, c.a + 0.4)) : 0).toFixed(3);
  });
  el.flow.style.opacity = outCubic(seg(t, st(c, 'sol'), st(c, 'sol') + 0.3)).toFixed(3);
  // the checks: superbot runs the three diagnostics (each then reads 0), Form 8879 is signed, the return is ready;
  // each turns from pending to a green check
  el.cks.forEach((n, i) => {
    const at = c.a + FR.checks[i] * (c.b - c.a);
    n.style.opacity = outCubic(seg(t, c.a + 0.1, c.a + 0.4)).toFixed(3);
    const ok = t >= at;
    n.classList.toggle('ok', ok);
    const v = n.querySelector('.pc-ck-v');
    if (v) v.style.visibility = ok ? '' : 'hidden';
  });
  // E-file: pale while checks are open, then pressed (the product's disabled vs primary button)
  const ready = t >= c.a + FR.checks[FR.checks.length - 1] * (c.b - c.a);
  el.efile.style.opacity = outCubic(seg(t, c.a + 0.1, c.a + 0.4)).toFixed(3);
  el.efile.classList.toggle('off', !ready);
  const ep0 = press(t, st(c, 'efile'), 0.07, 0.08, 0.14);
  el.efile.style.transform = `scale(${(1 - 0.06 * ep0).toFixed(4)})`;
  el.efile.classList.toggle('press', ep0 > 0);
  // the client's email body, then YOUR REPLY; the rates stretch so each lands inside its return's window
  const ask = fitted(el.tr1, k.ask);
  const r1 = Math.max(62, ask.length / 0.7);
  const n1 = streamCount(ask, st(c, 'turn1'), r1, t);
  if (el.tr1.textContent !== ask.slice(0, n1)) el.tr1.textContent = ask.slice(0, n1);
  const lines = k.draft.map((s, i) => fitted(el.trPs[i], s));
  const total = lines.reduce((x, s) => x + s.length, 0);
  const r2 = Math.max(112, total / 0.8);
  let n2 = streamCount(lines.join(''), st(c, 'turn2'), r2, t);
  lines.forEach((s, i) => {
    const take = Math.min(s.length, n2); n2 -= take;
    const out = s.slice(0, take);
    if (el.trPs[i].textContent !== out) el.trPs[i].textContent = out;
  });
  const ok = outCubic(seg(t, st(c, 'turn2') + 0.15, st(c, 'turn2') + 0.75));
  el.trOk.style.opacity = ok.toFixed(3);
  // Send is pressed as the return closes
  const sp = press(t, st(c, 'end'), 0.07, 0.08, 0.14);
  el.send.style.transform = `scale(${(1 - 0.06 * sp).toFixed(4)})`;
  el.send.classList.toggle('press', sp > 0);
}

function renderHud(t) {
  const cur = t < 1.50 ? 'Opening your returns in ProConnect'
    : t < VOICE.a ? 'ProConnect open, Intuit e-file connected'
      : t < 4.30 ? 'Matching your writing'
        : t < LEARN.a ? 'Writing style matched'
          : t < 8.30 ? 'Reading your past returns'
            : t < LAND.a ? 'Filing your extended returns' : `Extension queue clear, ${N_RET}${NB}accepted`;
  setT(el.hudCur, cur);
  el.hudSteps.forEach((li, i) => {
    const done = t >= STEP_DONE[i];
    const cur2 = !done && t >= (i === 0 ? 0 : STEP_DONE[i - 1]);
    li.classList.toggle('done', done);
    li.classList.toggle('cur', cur2);
    const dot = li.firstElementChild;
    if (cur2) {
      const b = 0.5 - 0.5 * Math.cos((t - (i === 0 ? 0 : STEP_DONE[i - 1])) * Math.PI * 2 / 1.1);
      dot.style.boxShadow = `inset 0 0 0 1.5px var(--ad-hud-green), 0 0 0 ${(1 + 4 * b).toFixed(2)}px rgba(52,199,89,${(0.42 * (1 - b)).toFixed(3)})`;
    } else if (dot.style.boxShadow) dot.style.boxShadow = '';
  });
  // the writing panel (VOICE): a line from a past email, superbot's line typed in the same style, then "matched"
  const vo = inOutCubic(seg(t, VOICE.a + 0.04, VOICE.a + 0.34)) * (1 - inOutCubic(seg(t, 4.40, 4.72)));
  el.hudVoice.style.maxHeight = (el.lay.voiceH * vo).toFixed(1) + 'px';
  el.hudVoice.style.opacity = vo.toFixed(3);
  if (vo > 0.01) {
    const cv = outCubic(seg(t, VOICE.a + 0.25, 4.15));
    const s = VOICE_LINES.sb;
    const n = streamCount(s, VOICE.a + 0.3, s.length / 1.6, t);
    setT(el.hudSbl, s.slice(0, n));
    el.hudMeter.style.width = (100 * cv).toFixed(1) + '%';
    const okp = outCubic(seg(t, 4.0, 4.3));
    el.hudOk.style.opacity = okp.toFixed(3);
    el.hudOk.style.transform = okp >= 1 ? 'none' : `scale(${lerp(0.8, 1, okp).toFixed(3)})`;
  }
  // what superbot learned (LEARN); it folds away again once the returns start, so the HUD stays small
  // (portrait: the queue row beside the HUD is short, so the panel folds before the return opens above it)
  const early = el.lay.portrait ? 0.80 : 0;
  const ro = inOutCubic(seg(t, 6.55, 6.85)) * (1 - inOutCubic(seg(t, ANSWER.a + 0.35 - early, ANSWER.a + 0.75 - early)));
  el.hudRes.style.opacity = ro.toFixed(3);
  el.hudRes.style.maxHeight = (el.lay.resH * ro).toFixed(1) + 'px';
  el.resChips.forEach((n, i) => {
    const p = outCubic(seg(t, 6.62 + i * 0.15, 6.62 + i * 0.15 + 0.4));
    n.style.opacity = (p * ro).toFixed(3);
    n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 8).toFixed(2)}px)`;
  });
  const so = inOutCubic(seg(t, ANSWER.a - 0.2, ANSWER.a + 0.2));
  el.hudStats.style.opacity = so.toFixed(3);
  el.hudStats.style.maxHeight = (el.lay.statsH * so).toFixed(1) + 'px';
  el.hudMark.render(t);
}

// The desk is authored at ProConnect's own sizes (the reference captures are 1:1 with a 1920 frame) and scaled a
// little on the wide frames so its type reads on a phone; narrower ratios restack (proconnect.css).
const UI_SCALE = (W) => (W >= 1900 ? 1.1 : W >= 1400 ? 1.05 : 1.0);
function layout(W) {
  if (el.lay && el.lay.W === W) return el.lay;
  const S = UI_SCALE(W);
  el.pc.style.width = (W / S).toFixed(2) + 'px';
  el.pc.style.height = (1080 / S).toFixed(2) + 'px';
  el.pc.style.transform = `scale(${S})`;
  const cs = getComputedStyle(el.root);
  const v = (k) => parseFloat(cs.getPropertyValue(k));
  const rowH = v('--ad-qrow-h'), eRowH = v('--ad-erow-h'), tRowH = v('--ad-trow-h'), pRowH = v('--ad-prow-h');
  const ls = getComputedStyle(el.qListEl);
  const listH = el.qListEl.clientHeight - parseFloat(ls.paddingTop) - parseFloat(ls.paddingBottom);
  // the call view is hidden until ANSWER; measure it laid out
  const vis = el.vCall.style.visibility; el.vCall.style.visibility = 'hidden';
  const eRowsN = Math.max(1, Math.floor((el.rowsBox.clientHeight + 0.5) / eRowH));
  el.vCall.style.visibility = vis;
  el.lay = { W, S, rowH, eRowH, portrait: W < 1400, rows: Math.max(1, Math.floor(listH / rowH)), padT: parseFloat(ls.paddingTop), eRowsN, winSteps: [],
    pastPx: PAST.length * pRowH, voiceH: v('--ad-hud-voice-h'), resH: v('--ad-hud-res-h'), statsH: v('--ad-hud-stats-h') };
  // the E-File Dashboard window's steps over the ANSWER beat, sampled every 10 ms (a pure function of t afterwards)
  let prev = el.winTop(ANSWER.a, eRowsN);
  for (let x = ANSWER.a; x <= DUR + 1e-6; x += 0.01) {
    const s = el.winTop(x, eRowsN);
    if (s !== prev) { el.lay.winSteps.push([x, s - prev]); prev = s; }
  }
  // the list and dashboard viewports: as many WHOLE rows as the pane holds
  for (const [vp, rh] of [[el.tvp, tRowH], [el.pvp, pRowH]]) {
    vp.style.flex = ''; vp.style.height = '';
    const n = Math.max(1, Math.floor(vp.clientHeight / rh));
    vp.style.flex = 'none'; px(vp, n * rh);
  }
  return el.lay;
}

export function render(t, W = 1920) {
  if (!el) return;
  layout(W);
  for (const n of el.fits) if (n.offsetParent) fitT(n, n._src);
  renderChrome(t);
  renderViews(t);
  renderCounts(t);
  renderQueue(t);
  renderLearn(t);
  renderCall(t);
  renderHud(t);
}

export default { id: 'proconnect', DUR, mount, render };

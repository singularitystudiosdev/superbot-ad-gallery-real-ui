// wealthbox.js: the Wealthbox CRM desk, and the four beats superbot works on it.
// It is one DOM tree built at mount and then driven purely from local time t (?t=<s> reproduces any frame), so
// the spot is seek-safe at every ratio. The chrome (the 52px blue header with its search, the dark 200px sidenav
// with a coloured active border, the contact header card with its blue left accent, the content tabs, white cards,
// workflow steps, task rows) is rebuilt in HTML from Wealthbox's own app CSS tokens and screenshots, kept outside
// the repo in /tmp/fa-wbref.38facc16 (see wealthbox.tokens.css). The motion is the call-center spot's (e360.js)
// beat for beat: every window, WINS, FR fraction, queue timing and HUD rule is unchanged; only what the desk shows
// is an advisor's book. One real Wealthbox mark sits in the chrome, the hexagon at the top left of the header
// (../../img/wealthbox-icon.svg, see ../../img/CREDITS.txt). Every figure comes from wealthbox-data.js, where each
// record carries its source. No person is named.
import { clamp, lerp, seg, outCubic, inOutCubic, press, esc, streamCount } from '../../lib.js';
import { I, DESK, REQUESTS, QUEUE, ACTIVITY, TOPICS, VOICE_LINES, STEPS, IDLE, WORKFLOW, COMPLIANCE, MODEL } from './wealthbox-data.js';

const NB = ' ';

// ---------- the desk's own clock (seconds, local to the desk layer): the call-center spot's, unchanged ----------
export const DUR = 18.40;
const CONNECT = { a: 0.00, b: 2.10 };
const VOICE = { a: 2.10, b: 4.60 };
const LEARN = { a: 4.60, b: 8.60 };
const ANSWER = { a: 8.60, b: 16.10 };
const LAND = { a: 16.10, b: DUR };

// the three requests the main pane works through, start to end
const WINS = [[8.90, 11.60], [11.60, 14.00], [14.00, 16.10]];
// where each step of a request lands inside its window, as a fraction of it
const FR = { prob: 0.04, cause: 0.12, sol: 0.20, turn1: 0.24, turn2: 0.36, closed: 0.80, end: 0.88 };
const ROW_H = 40;               // one inbox row, one task row (wealthbox.tokens.css --ad-row-h)
const AROW_H = 52;              // one activity row (--ad-arow-h)
const STEP_DONE = [1.75, 4.35, 8.35, 16.15];
const QWAIT_IN = { a: 0.70, b: 1.70 };
const N_REQ = QUEUE.length;
// the model rebalance, inside the ANSWER beat: drift shows from the start of the beat, the three trades tick,
// the weights glide back to the model and the check draws
const RB = { a: 13.00, trades: [13.00, 13.25, 13.50], move: [13.00, 13.90], check: [13.80, 14.40] };

const $ = (s, root) => root.querySelector(s);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const setT = (n, s) => { if (n && n.textContent !== s) n.textContent = s; };
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
const pct = (x) => `${x.toFixed(2)}%`;

// Wealthbox's left navigation (labels and order per the reference notes; the active item's left border takes its
// section colour, Contacts blue)
const NAV = [
  ['home', 'Home'], ['ai', 'AI Assistant'], ['email', 'Email'], ['contacts', 'Contacts'], ['tasks', 'Tasks'],
  ['workflows', 'Workflows'], ['meetings', 'Meetings'], ['calendar', 'Calendar'], ['opportunities', 'Opportunities'],
  ['projects', 'Projects'], ['files', 'Files'], ['reports', 'Reports'], ['dashboards', 'Dashboards'],
];
const ACTIVE_NAV = 'contacts';
// the contact page's content tabs; the underline moves Email -> Activity (LEARN) -> Email (the reply is an email)
const TABS = ['Activity', 'Email', 'Accounts', 'Files', 'Additional Info'];
const TAB_OV = 1, TAB_ACT = 0;
const KIND = { email: ['is an email you sent', I.email], note: ['is a note you wrote', I.note], task: ['is a task you completed', I.check] };

let el = null;

// ---------- mount ----------
export function mount(section, ctx) {
  const asset = (n) => new URL(`../../img/${n}`, import.meta.url).href;
  const root = h(`<div class="wb-root"></div>`);
  const hudMark = ctx.shell.makeMark(26);
  root.innerHTML = `
<div class="wb">
  <header class="wb-top">
    <span class="wb-toggle">${I.menu}</span>
    <span class="wb-mark"><img src="${asset('wealthbox-icon.svg')}" alt="Wealthbox"/></span>
    <span class="wb-search">${I.search}<span>Search Wealthbox</span></span>
    <div class="wb-topr">
      <span class="wb-sync"><i></i><span class="wb-sync-t">Schwab</span><b class="wb-sync-s">Not connected</b></span>
      <span class="wb-tool">${I.plus}</span>
      <span class="wb-tool">${I.help}</span>
      <span class="wb-tool wb-bell">${I.bell}<i class="wb-bell-n">0</i></span>
      <span class="wb-me"><span class="wb-headshot">${I.person}</span><span class="wb-me-n">Advisor</span>${I.caret}</span>
    </div>
  </header>
  <div class="wb-frame">
    <aside class="wb-nav">
      <div class="wb-nav-list">${NAV.map(([k, label]) => `<span class="wb-nav-i${k === ACTIVE_NAV ? ' on' : ''}" data-k="${k}">${I[k]}<span class="wb-nav-t">${label}</span></span>`).join('')}</div>
      <div class="wb-nav-foot"><span class="wb-nav-i">${I.menu}<span class="wb-nav-t">Collapse</span></span></div>
    </aside>

    <div class="wb-app">
      <section class="wb-hc">
        <span class="wb-hc-photo">${I.person}</span>
        <div class="wb-hc-m">
          <h1 class="wb-hc-name"></h1>
          <div class="wb-hc-l"><span class="wb-hc-l1"></span></div>
          <div class="wb-tags"></div>
        </div>
        <div class="wb-hc-r">
          <div class="wb-fig"><span class="wb-fig-m"><b></b><small></small></span><span class="wb-fig-btn">${I.calc}</span></div>
          <div class="wb-fig"><span class="wb-fig-m"><b></b><small></small></span><span class="wb-fig-btn">${I.calendar}</span></div>
        </div>
      </section>

      <nav class="wb-tabs">${TABS.map((t) => `<span class="wb-tab">${t}</span>`).join('')}<span class="wb-und"></span></nav>

      <div class="wb-body">
        <section class="wb-q">
          <div class="wb-q-h"><b>Client requests</b><span class="wb-q-live"><i></i>Answering <b class="wb-q-ln">0</b></span></div>
          <div class="wb-q-top"><b class="wb-q-n">0</b><small>waiting</small><span class="wb-q-sub">answered in your writing</span></div>
          <ul class="wb-q-list"></ul>
        </section>
        <section class="wb-main">
          <div class="wb-view wb-v-idle">
            <div class="wb-card wb-steps">
              <div class="wb-steps-h"><h2>Steps</h2><small>Workflow: ${esc(WORKFLOW.name)}</small></div>
              <div class="wb-steps-list">${WORKFLOW.steps.map((s, i) => `<div class="wb-step">
                <span class="wb-step-dot"><b>${i + 1}</b>${I.check}</span>
                <div class="wb-step-c"><div class="wb-step-t">${I.star}<span class="wb-fit">${esc(s)}</span><span class="wb-btn wb-btn-ok wb-cstep">Complete Step</span></div>
                  <small class="wb-step-by">Completed By: superbot${NB}${NB}${NB}Date: ${esc(DESK.date)}</small></div></div>`).join('')}</div>
            </div>
            <div class="wb-card wb-todo">
              <div class="wb-ch"><b>My To-Do's</b><small class="wb-ch-r">Firm and clients</small></div>
              ${COMPLIANCE.map(([t, s, m]) => `<div class="wb-td"><span class="wb-cbx"></span><span class="wb-td-m"><b class="wb-fit">${esc(t)}</b><small class="wb-fit">${esc(s)}</small></span><span class="wb-srcmark">${esc(m)}</span></div>`).join('')}
            </div>
          </div>

          <div class="wb-view wb-v-act">
            <div class="wb-act-h"><span class="wb-act-s">${I.search}<span>Search...</span></span>
              <span class="wb-sel">All ${I.caret}</span>
              <span class="wb-cnt"><b class="wb-cn">0</b><small>past notes read</small></span>
            </div>
            <div class="wb-act-vp"><div class="wb-act-in"></div></div>
          </div>

          <div class="wb-view wb-v-call">
            <div class="wb-card wb-ans">
              <div class="wb-ans-h"><b>Answer</b><span class="wb-ans-topic"></span><span class="wb-ans-src">${I.link}<span class="wb-ans-srct"></span></span></div>
              <div class="wb-ans-g">
                <div class="wb-ans-l">
                  <div class="wb-lab">Client email</div>
                  <div class="wb-asked"></div>
                  <p class="wb-tr-1"></p>
                  <div class="wb-lab">The rule</div>
                  <blockquote class="wb-rule"><p class="wb-rule-q"></p><small class="wb-rule-s"></small></blockquote>
                </div>
                <div class="wb-ans-r">
                  <div class="wb-math"></div>
                  <div class="wb-acts"></div>
                </div>
              </div>
              <div class="wb-thread">
                <div class="wb-tr wb-tr-y"><span class="wb-tr-l you">Your reply</span>
                  <div class="wb-tr-ps"><p class="wb-tr-p"></p><p class="wb-tr-p"></p><p class="wb-tr-p"></p></div>
                  <span class="wb-tr-side"><b class="wb-tr-ok">${I.check}in your writing</b><span class="wb-btn wb-btn-ok wb-post">Post</span></span>
                </div>
              </div>
            </div>
            <div class="wb-lower">
              <div class="wb-card wb-tk">
                <div class="wb-ch"><b>Tasks</b><small class="wb-ch-r">Assigned to me</small></div>
                <div class="wb-tk-head"><span class="wb-tk-hn">Name</span><span class="wb-tk-hc">Category</span><span class="wb-tk-hs">Source</span></div>
                <div class="wb-rows"></div>
              </div>
              <div class="wb-card wb-mdl">
                <div class="wb-ch"><b>Schwab</b><small class="wb-ch-r">${esc(MODEL.name)}</small></div>
                <div class="wb-mdl-sub">${esc(MODEL.set)}, ${esc(MODEL.asOf)}</div>
                <div class="wb-mdl-rows">${MODEL.rows.map((r) => `<div class="wb-mr">
                  <span class="wb-mr-t"><b>${esc(r.tk)}</b><small>${esc(r.sleeve)}, ER ${esc(r.er)}</small></span>
                  <span class="wb-mr-bar"><i class="wb-mr-fill"></i><i class="wb-mr-tgt"></i></span>
                  <span class="wb-mr-v"><b class="wb-mr-w"></b><small class="wb-mr-p"></small></span></div>`).join('')}</div>
                <div class="wb-mdl-foot">
                  <div class="wb-mdl-st"><span class="wb-ring"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="wb-ring-p" d="M5 12.6 9.6 17.2 19 7.4"/></svg></span><span class="wb-mdl-stt"><b class="wb-eq"></b><small class="wb-eq-s"></small></span></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>

  <div class="wb-hud">
    <div class="wb-hud-h"><span class="wb-hud-mark"></span><span class="wb-hud-cur">Opening your book in Wealthbox</span></div>
    <ul class="wb-hud-steps">${STEPS.map((s) => `<li><i></i>${esc(s)}</li>`).join('')}</ul>
    <div class="wb-hud-voice">
      <div class="wb-hud-lane"><b>Your email</b><span class="wb-hud-line">${esc(VOICE_LINES.you)}</span></div>
      <div class="wb-hud-lane sb"><b>Superbot</b><span class="wb-hud-line wb-hud-sbl"></span></div>
      <div class="wb-hud-mh"><span>Writing style</span><b class="wb-hud-ok">${I.check}matched</b></div>
      <div class="wb-hud-meter"><i></i></div>
    </div>
    <div class="wb-hud-res"><b>What your clients ask about</b><div class="wb-hud-chips"></div></div>
    <div class="wb-hud-stats"><span>answered <b class="wb-hs-a">0</b></span><span>tasks done <b class="wb-hs-t">0</b></span></div>
  </div>
</div>`;
  section.appendChild(root);
  $('.wb-hud-mark', root).appendChild(hudMark.el);

  const tabs = [...root.querySelectorAll('.wb-tab')];
  const ovTab = tabs[TAB_OV], actTab = tabs[TAB_ACT];

  // the inbox: one row per request, built once and placed every frame from t
  const qList = $('.wb-q-list', root);
  const qRows = QUEUE.map((q) => {
    const n = h(`<li class="wb-qi">
      <span class="wb-qi-b">${esc(q.badge)}</span>
      <span class="wb-qi-m"><span class="wb-qi-n"></span><span class="wb-qi-r"></span></span>
      <em class="wb-qi-p s-new"><i></i>${I.check}<span class="wb-pl">New</span></em></li>`);
    qList.appendChild(n);
    return { n, q, p: $('.wb-qi-p', n), r: $('.wb-qi-r', n), nm: $('.wb-qi-n', n), pl: $('.wb-pl', n) };
  });
  const qEmpty = h(`<div class="wb-q-empty">Schwab synced. New requests land here.</div>`);
  qList.appendChild(qEmpty);

  // the Activity tab (LEARN): the advisor's past notes and emails, once each
  const actIn = $('.wb-act-in', root);
  const actRows = ACTIVITY.map(([kind, title, snip, mark]) => {
    const [verb, icon] = KIND[kind];
    const n = h(`<div class="wb-arow">
      <span class="wb-arow-i k-${kind}">${icon}</span>
      <span class="wb-arow-m"><span class="wb-arow-t"><b>${esc(title)}</b> ${esc(verb)}</span><small class="wb-fit">${esc(snip)}</small></span>
      <span class="wb-srcmark">${esc(mark)}</span></div>`);
    actIn.appendChild(n);
    return n;
  });
  const actPx = actRows.length * AROW_H;

  // the header card's tags (one set per request, only the live one shown)
  const tagBox = $('.wb-tags', root);
  const tagSets = REQUESTS.map((r) => {
    const set = r.tags.map((s) => { const n = h(`<span class="wb-tag">${esc(s)}</span>`); tagBox.appendChild(n); return n; });
    return set;
  });
  const tagPlus = h(`<span class="wb-tag-plus">${I.plus}</span>`);
  tagBox.appendChild(tagPlus);

  // the answer card's action pills (one set per request) and math rows (one set per request)
  const actBox = $('.wb-acts', root);
  const acts = REQUESTS.map((r) => r.actions.map((s) => { const n = h(`<span class="wb-act">${esc(s)}</span>`); actBox.appendChild(n); return n; }));
  const mathBox = $('.wb-math', root);
  const maths = REQUESTS.map((r) => {
    const box = h(`<div class="wb-math-set">${r.math.map(([k, v], i) => `<div class="wb-mrow${i === r.math.length - 1 ? ' res' : ''}"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>`);
    mathBox.appendChild(box);
    return box;
  });

  // the Tasks card: one task per request, in the order they are opened; a window of whole rows follows the work
  const rowsBox = $('.wb-rows', root);
  const order = QUEUE.map((q, i) => ({ q, i })).sort((a, b) => a.q.tAns - b.q.tAns);
  const tasks = order.map(({ q }) => {
    const n = h(`<div class="wb-row">
      <span class="wb-cbx">${I.check}</span>
      <span class="wb-row-m"><b class="wb-fit">${esc(q.task)}</b><small class="wb-fit">${esc(q.taskSub)}</small></span>
      <span class="wb-row-c"><span class="wb-pill t-${q.tone}">${esc(q.cat)}</span></span>
      <span class="wb-row-s">${esc(q.mark)}</span></div>`);
    rowsBox.appendChild(n);
    return { n, q, cbx: $('.wb-cbx', n) };
  });
  // where the window's top row index steps, precomputed once on a fine grid so the slide is a pure function of t
  const winTop = (t, N) => {
    const shown = tasks.filter((tk) => t >= tk.q.tAns).length;
    const firstOpen = tasks.findIndex((tk) => t >= tk.q.tAns && t < tk.q.tRes);
    const s = firstOpen < 0 ? shown - N : firstOpen - 1;
    return clamp(s, 0, Math.max(0, shown - N));
  };

  const mr = [...root.querySelectorAll('.wb-mr')].map((n, i) => ({
    n, r: MODEL.rows[i], fill: $('.wb-mr-fill', n), tgt: $('.wb-mr-tgt', n), w: $('.wb-mr-w', n), p: $('.wb-mr-p', n),
  }));

  const chipBox = $('.wb-hud-chips', root);
  const resChips = TOPICS.map((r) => {
    const n = h(`<span class="wb-hud-chip">${I.check}${esc(r)}</span>`);
    chipBox.appendChild(n);
    return n;
  });

  el = {
    root, hudMark, tabs, ovTab, actTab, winTop, tasks, rowsBox,
    sync: $('.wb-sync', root), syncS: $('.wb-sync-s', root), me: $('.wb-me', root),
    belln: $('.wb-bell-n', root), qn: $('.wb-q-n', root),
    qlive: $('.wb-q-live', root), qln: $('.wb-q-ln', root), qEmpty, qRows,
    cn: $('.wb-cn', root), actIn, actRows, actPx, actVp: $('.wb-act-vp', root), und: $('.wb-und', root),
    vIdle: $('.wb-v-idle', root), vAct: $('.wb-v-act', root), vCall: $('.wb-v-call', root),
    hcName: $('.wb-hc-name', root), hcL1: $('.wb-hc-l1', root), hcM: $('.wb-hc-m', root),
    hcR: $('.wb-hc-r', root), figs: [...root.querySelectorAll('.wb-fig')].map((n) => ({ n, b: $('b', n), s: $('small', n) })),
    tagSets, tagPlus,
    steps: [...root.querySelectorAll('.wb-step')], cstep: [...root.querySelectorAll('.wb-cstep')],
    ansTopic: $('.wb-ans-topic', root), ansSrc: $('.wb-ans-srct', root), asked: $('.wb-asked', root),
    ruleQ: $('.wb-rule-q', root), ruleS: $('.wb-rule-s', root), rule: $('.wb-rule', root), acts, maths,
    tr1: $('.wb-tr-1', root), trPs: [...root.querySelectorAll('.wb-tr-p')], trOk: $('.wb-tr-ok', root), post: $('.wb-post', root),
    mr, ringP: $('.wb-ring-p', root), eq: $('.wb-eq', root), eqS: $('.wb-eq-s', root), mdlSt: $('.wb-mdl-st', root),
    hud: $('.wb-hud', root), hudCur: $('.wb-hud-cur', root), hudSteps: [...root.querySelectorAll('.wb-hud-steps li')],
    hudVoice: $('.wb-hud-voice', root), hudSbl: $('.wb-hud-sbl', root), hudOk: $('.wb-hud-ok', root), hudMeter: $('.wb-hud-meter i', root),
    hudRes: $('.wb-hud-res', root), resChips, hudStats: $('.wb-hud-stats', root), hsA: $('.wb-hs-a', root), hsT: $('.wb-hs-t', root),
    wb: $('.wb', root), qListEl: qList, lay: null,
    fits: [...root.querySelectorAll('.wb-fit')].map((n) => { n._src = n.textContent; return n; }),
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

function renderQueue(t, waiting) {
  let live = 0;
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
    const open = t >= q.tAns, done = t >= q.tRes;
    const cls = done ? 's-done' : open ? 's-work' : 's-new';
    if (row.p.className !== `wb-qi-p ${cls}`) row.p.className = `wb-qi-p ${cls}`;
    setT(row.pl, done ? 'Answered' : open ? 'Working' : 'New');
    if (!open) {
      row.p.style.opacity = (0.55 + 0.45 * Math.abs(Math.sin((t - q.tIn) * 5.2))).toFixed(3);
      row.p.style.transform = `scale(${(1 + 0.05 * Math.abs(Math.sin((t - q.tIn) * 5.2))).toFixed(3)})`;
    } else { row.p.style.opacity = '1'; row.p.style.transform = ''; }
    // the registration line becomes what was done once the request is answered
    fitT(row.nm, q.title, cls);
    fitT(row.r, done ? q.disp : q.sub, cls);
    row.r.classList.toggle('disp', done);
    if (open && !done) live++;
  }
  setT(el.qln, String(live));
  // the landed state: the answering chip turns into "Inbox clear"
  const clear = t >= LAND.a;
  if (el.qlive.classList.contains('clear') !== clear) {
    el.qlive.classList.toggle('clear', clear);
    el.qlive.innerHTML = clear ? `${I.check}Inbox clear` : '<i></i>Answering <b class="wb-q-ln">0</b>';
    el.qln = $('.wb-q-ln', el.qlive) || el.qln;
    if (!clear) setT(el.qln, String(live));
  }
  el.qlive.style.opacity = seg(t, ANSWER.a + 0.15, ANSWER.a + 0.5).toFixed(3);
  el.qEmpty.style.opacity = (1 - seg(t, QUEUE[0].tIn, QUEUE[0].tIn + 0.3)).toFixed(3);
  setT(el.qn, String(waiting));
  setT(el.belln, String(waiting));
  el.belln.style.opacity = waiting > 0 ? '1' : '0';
}

function counts(t) {
  const answered = QUEUE.filter((q) => t >= q.tRes).length;
  return { answered, tasks: answered };
}

function renderChrome(t) {
  // CONNECT: Schwab turns on (the source spot's CTI switch, same 0.35 to 0.55 window) and the header settles
  const on = seg(t, 0.35, 0.55);
  el.root.classList.toggle('live', on > 0.5);
  setT(el.syncS, t >= 0.55 ? 'Connected' : on > 0 ? 'Connecting' : 'Not connected');
  const me = outCubic(seg(t, 0.55, 1.0));
  el.me.style.opacity = (0.35 + 0.65 * me).toFixed(3);
  el.me.style.transform = `translateX(${((1 - me) * 8).toFixed(2)}px)`;
  const c = counts(t);
  setT(el.hsA, String(c.answered)); setT(el.hsT, String(c.tasks));
}

function renderHeader(t) {
  const c = callState(t);
  const fill = c ? outCubic(seg(t, c.a, c.a + 0.34)) : 0;
  const v = c ? c.c : null;
  fitT(el.hcName, v ? v.title : IDLE.title);
  const hk = v ? v.title : 'idle';
  if (el.hcKey !== hk) {
    el.hcKey = hk;
    el.hcL1.innerHTML = v ? `${esc(v.reg)} at <a>Schwab</a>. Request by email: <a>${esc(v.topic)}</a>` : esc(IDLE.line1);
  }
  el.tagSets.forEach((set, i) => set.forEach((n) => { n.style.display = c && c.i === i ? '' : 'none'; }));
  el.tagPlus.style.display = c ? '' : 'none';
  el.figs.forEach((f, i) => {
    setT(f.b, v ? v.figures[i][0] : '');
    setT(f.s, v ? v.figures[i][1] : '');
    f.n.style.visibility = v ? '' : 'hidden';
  });
  for (const n of [el.hcM, el.hcR]) {
    n.style.opacity = (c ? 0.3 + 0.7 * fill : 1).toFixed(3);
    n.style.transform = `translateY(${(c ? (1 - fill) * 4 : 0).toFixed(2)}px)`;
  }
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
  // the underline slides from Email to Activity (measured per frame: the bundled font may land after mount)
  const ov = el.ovTab, ac = el.actTab;
  const bl = lerp(ov.offsetLeft, ac.offsetLeft, actOn), bw = lerp(ov.offsetWidth, ac.offsetWidth, actOn);
  el.und.style.left = bl.toFixed(2) + 'px';
  el.und.style.width = bw.toFixed(2) + 'px';
  el.ovTab.classList.toggle('on', actOn <= 0.5);
  el.actTab.classList.toggle('on', actOn > 0.5);
}

function renderIdle(t) {
  // the workflow: steps 1 and 2 land on CONNECT, step 3 (Match your writing) is current through VOICE and is
  // completed as the voice beat lands, step 4 is current as the book opens
  const doneAt = [0, 0.55, 4.35, Infinity, Infinity];
  el.steps.forEach((n, i) => {
    const done = t >= doneAt[i];
    const cur = !done && (i === 0 || t >= doneAt[i - 1]);
    n.classList.toggle('done', done);
    n.classList.toggle('cur', cur);
  });
  const pr = press(t, 4.28, 0.06, 0.06, 0.12);
  el.cstep.forEach((b) => { b.style.transform = `scale(${(1 - 0.06 * pr).toFixed(4)})`; });
}

function renderLearn(t) {
  const c = outCubic(seg(t, LEARN.a + 0.30, 7.40));
  setT(el.cn, String(Math.round(ACTIVITY.length * c)));
  const vpH = el.actVp.clientHeight || 470;
  const y = -lerp(0, Math.max(0, el.actPx - vpH), c);
  el.actIn.style.transform = `translateY(${Math.min(0, y).toFixed(2)}px)`;
  // each note lights as it is read (the count and the highlight move together)
  const n = Math.round(ACTIVITY.length * c);
  el.actRows.forEach((r, i) => r.classList.toggle('read', i < n));
  const fade = 26 * clamp(4 * Math.min(c, 1 - c));
  const fs = fade.toFixed(1) + 'px';
  if (el.actVp.style.getPropertyValue('--fade') !== fs) el.actVp.style.setProperty('--fade', fs);
}

function renderTasks(t) {
  const N = el.lay.taskRows;
  // the window's top index, eased between its steps: a step at time T glides over [T, T + 0.35]
  let top = el.winTop(ANSWER.a, N);
  for (const [T, d] of el.lay.winSteps) top += d * outCubic(seg(t, T, T + 0.35));
  el.tasks.forEach((tk, i) => {
    const shown = t >= tk.q.tAns;
    const y = (i - top) * ROW_H;
    const inWin = clamp(1 + 2 * y / ROW_H) * clamp(2 * (N - y / ROW_H) - 1);
    const appear = outCubic(seg(t, tk.q.tAns, tk.q.tAns + 0.4));
    const vis = shown ? inWin * appear : 0;
    tk.n.style.opacity = vis.toFixed(3);
    tk.n.style.visibility = vis <= 0.002 ? 'hidden' : '';
    tk.n.style.transform = `translateY(${y.toFixed(2)}px)`;
    const done = t >= tk.q.tRes;
    tk.n.classList.toggle('done', done);
    // the checkbox pops as it turns green
    const pop = seg(t, tk.q.tRes - 0.05, tk.q.tRes + 0.2);
    tk.cbx.style.transform = `scale(${(1 + 0.18 * Math.sin(Math.PI * pop)).toFixed(3)})`;
    if (vis > 0.002) for (const f of tk.n.querySelectorAll('.wb-fit')) fitT(f, f._src);
  });
}

function renderModel(t) {
  const m = inOutCubic(seg(t, RB.move[0], RB.move[1]));
  let eq = 0;
  el.mr.forEach(({ r, fill, tgt, w, p }, i) => {
    const x = lerp(r.drift, r.model, m);
    // the bar is on a 0 to 50% scale so the drift reads; the tick marks the model weight
    fill.style.width = `${(x * 2).toFixed(2)}%`;
    tgt.style.left = `${(r.model * 2).toFixed(2)}%`;
    setT(w, m >= 1 ? pct(r.model) : pct(r.drift));
    // the drift line turns into this row's trade as superbot places it, then into "on model"
    const traded = t >= RB.trades[i];
    setT(p, m >= 1 ? 'on model' : traded ? MODEL.trades[i].replace(` ${r.tk}`, '') : `${r.pts} pts`);
    p.classList.toggle('over', !traded && r.pts[0] === '+');
    p.classList.toggle('under', !traded && r.pts[0] === '-');
    p.classList.toggle('ok', traded);
  });
  const back = t >= RB.check[0];
  setT(el.eq, back ? 'Back on model' : `Equity ${MODEL.equity}, model 60%`);
  setT(el.eqS, back ? 'Sold VTI and VXUS, bought BND' : 'Rebalance to VTI 36, VXUS 24, BND 40');
  el.mdlSt.classList.toggle('ok', back);
  el.ringP.style.strokeDashoffset = (24 * (1 - outCubic(seg(t, RB.check[0], RB.check[1])))).toFixed(2);
}

function renderCall(t) {
  renderTasks(t);
  renderModel(t);
  const c = callState(t);
  if (!c) {
    // before the first request opens, the answer card is an empty frame
    el.trOk.style.opacity = '0';
    el.acts.forEach((set) => set.forEach((n) => { n.style.display = 'none'; }));
    el.maths.forEach((box) => { box.style.display = 'none'; });
    return;
  }
  const k = c.c;
  const prob = outCubic(seg(t, st(c, 'prob'), st(c, 'prob') + 0.3));
  const cause = outCubic(seg(t, st(c, 'cause'), st(c, 'cause') + 0.3));
  setT(el.ansTopic, `${k.reg}, ${k.topic}`);
  setT(el.ansSrc, k.source);
  fitT(el.asked, k.asked);
  fitT(el.ruleQ, k.quote);
  setT(el.ruleS, k.source);
  el.asked.style.opacity = prob.toFixed(3);
  el.asked.style.transform = `translateY(${((1 - prob) * 6).toFixed(2)}px)`;
  el.rule.style.opacity = cause.toFixed(3);
  el.rule.style.transform = `translateY(${((1 - cause) * 6).toFixed(2)}px)`;
  // the math lands with the rule
  el.maths.forEach((box, i) => {
    box.style.display = i === c.i ? '' : 'none';
    box.style.opacity = (i === c.i ? outCubic(seg(t, c.a + 0.04, c.a + 0.4)) : 0).toFixed(3);
  });
  // the action superbot clicks: only this request's pill set is live, and its pressed one fills
  el.acts.forEach((set, si) => set.forEach((n, i) => {
    const live = si === c.i;
    n.style.display = live ? '' : 'none';
    const isP = live && i === k.press;
    const at = st(c, 'sol') + 0.10;
    const pr = isP ? press(t, at, 0.08, 0.10, 0.16) : 0;
    n.classList.toggle('press', isP && t >= at - 0.04);
    n.style.transform = `scale(${(1 - 0.06 * pr).toFixed(4)})`;
  }));
  // the client's email body, then YOUR REPLY; the rates stretch so each lands inside its request's window
  const ask = fitted(el.tr1, k.ask);
  const r1 = Math.max(62, ask.length / 0.7);
  const n1 = streamCount(ask, st(c, 'turn1'), r1, t);
  if (el.tr1.textContent !== ask.slice(0, n1)) el.tr1.textContent = ask.slice(0, n1);
  const lines = k.draft.map((s, i) => fitted(el.trPs[i], s));
  const total = lines.reduce((a, s) => a + s.length, 0);
  const r2 = Math.max(112, total / 0.8);
  let n2 = streamCount(lines.join(''), st(c, 'turn2'), r2, t);
  lines.forEach((s, i) => {
    const take = Math.min(s.length, n2); n2 -= take;
    const out = s.slice(0, take);
    if (el.trPs[i].textContent !== out) el.trPs[i].textContent = out;
  });
  const ok = outCubic(seg(t, st(c, 'turn2') + 0.15, st(c, 'turn2') + 0.75));
  el.trOk.style.opacity = ok.toFixed(3);
  // Post is pressed as the request closes
  const ep = press(t, st(c, 'end'), 0.07, 0.08, 0.14);
  el.post.style.transform = `scale(${(1 - 0.06 * ep).toFixed(4)})`;
  el.post.classList.toggle('press', ep > 0);
}

function renderHud(t) {
  const cur = t < 1.50 ? 'Opening your book in Wealthbox'
    : t < VOICE.a ? 'Wealthbox open, Schwab connected'
      : t < 4.30 ? 'Matching your writing'
        : t < LEARN.a ? 'Writing style matched'
          : t < 8.30 ? 'Reading your past notes'
            : t < LAND.a ? 'Answering client requests' : `Inbox clear, ${N_REQ}${NB}answered`;
  setT(el.hudCur, cur);
  el.hudSteps.forEach((li, i) => {
    const done = t >= STEP_DONE[i];
    const cur = !done && t >= (i === 0 ? 0 : STEP_DONE[i - 1]);
    li.classList.toggle('done', done);
    li.classList.toggle('cur', cur);
    const dot = li.firstElementChild;
    if (cur) {
      const b = 0.5 - 0.5 * Math.cos((t - (i === 0 ? 0 : STEP_DONE[i - 1])) * Math.PI * 2 / 1.1);
      dot.style.boxShadow = `inset 0 0 0 1.5px var(--ad-hud-green), 0 0 0 ${(1 + 4 * b).toFixed(2)}px rgba(52,199,89,${(0.42 * (1 - b)).toFixed(3)})`;
    } else if (dot.style.boxShadow) dot.style.boxShadow = '';
  });
  // the writing panel (VOICE): a line from a past email, superbot's line typed in the same style, then "matched"
  const vo = inOutCubic(seg(t, VOICE.a + 0.04, VOICE.a + 0.34)) * (1 - inOutCubic(seg(t, 4.40, 4.72)));
  el.hudVoice.style.maxHeight = (124 * vo).toFixed(1) + 'px';
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
  // what superbot learned (LEARN); it folds away again once the requests start, so the HUD stays small
  const ro = inOutCubic(seg(t, 6.55, 6.85)) * (1 - inOutCubic(seg(t, ANSWER.a + 0.35, ANSWER.a + 0.75)));
  el.hudRes.style.opacity = ro.toFixed(3);
  el.hudRes.style.maxHeight = (116 * ro).toFixed(1) + 'px';
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

// the desk is authored in design px and scaled up to the frame, so its type reads at the size the real app shows
// it. Narrower ratios scale less and restack (wealthbox.css). Same factors as the call-center spot.
const UI_SCALE = (W) => (W >= 1900 ? 1.3 : W >= 1400 ? 1.2 : W >= 1000 ? 1.1 : 1.05);
function layout(W) {
  if (el.lay && el.lay.W === W) return el.lay;
  const S = UI_SCALE(W);
  el.wb.style.width = (W / S).toFixed(2) + 'px';
  el.wb.style.height = (1080 / S).toFixed(2) + 'px';
  el.wb.style.transform = `scale(${S})`;
  const cs = getComputedStyle(el.qListEl);
  const listH = el.qListEl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  // the answer view is hidden until ANSWER; measure it laid out
  const vis = el.vCall.style.visibility; el.vCall.style.visibility = 'hidden';
  const taskRows = Math.max(1, Math.floor((el.rowsBox.clientHeight + 0.5) / ROW_H));
  el.vCall.style.visibility = vis;
  el.lay = { W, S, rows: Math.max(1, Math.floor(listH / ROW_H)), padT: parseFloat(cs.paddingTop), taskRows, winSteps: [] };
  // the Tasks window's steps over the ANSWER beat, sampled every 10 ms (a pure function of t afterwards)
  let prev = el.winTop(ANSWER.a, taskRows);
  for (let x = ANSWER.a; x <= DUR + 1e-6; x += 0.01) {
    const s = el.winTop(x, taskRows);
    if (s !== prev) { el.lay.winSteps.push([x, s - prev]); prev = s; }
  }
  // the activity viewport: as many WHOLE rows as the pane holds
  el.actVp.style.flex = ''; el.actVp.style.height = '';
  const vpRows = Math.max(1, Math.floor(el.actVp.clientHeight / AROW_H));
  el.actVp.style.flex = 'none'; el.actVp.style.height = `${vpRows * AROW_H}px`;
  return el.lay;
}

export function render(t, W = 1920) {
  if (!el) return;
  layout(W);
  for (const n of el.fits) if (n.offsetParent) fitT(n, n._src);
  const waiting = t < QWAIT_IN.b ? Math.round(N_REQ * outCubic(seg(t, QWAIT_IN.a, QWAIT_IN.b)))
    : t < ANSWER.a ? N_REQ
      : QUEUE.filter((q) => t < q.tAns).length;
  renderChrome(t);
  renderHeader(t);
  renderViews(t);
  renderIdle(t);
  renderQueue(t, waiting);
  renderLearn(t);
  renderCall(t);
  renderHud(t);
}

export default { id: 'wealthbox', DUR, mount, render };

// e360.js: the Comcast Einstein 360 agent desktop, and the four beats superbot works on it.
// It is one DOM tree built at mount and then driven purely from local time t (?t=<s> reproduces any frame), so
// the spot is seek-safe at every ratio. The chrome, the SmartConnect panel, the Repairs ticket list, the gray
// Devices panel, the Recent Activity list and the resolving queue row are rebuilt from the reference screenshots
// in /tmp/e360ref-497a61f3 (see e360.css for the sampled colours). Two real Comcast marks sit in the chrome: the
// Comcast logo in the app bar and the Xfinity wordmark on the queue chip (../../img, see ../../img/CREDITS.txt).
// Everything else on screen, including every caller, ticket id, code and figure, is fictional.
import { clamp, lerp, seg, outCubic, inOutCubic, rand, press, esc, streamCount } from '../../lib.js';
import { I, checkDisc, CALLS, QUEUE, ACTIVITY, RESOLVERS, STEPS, OLD_TICKETS } from './e360-data.js';

const NB = ' ';

// ---------- the desktop's own clock (seconds, local to the desktop layer) ----------
export const DUR = 18.40;
const CONNECT = { a: 0.00, b: 2.10 };
const VOICE = { a: 2.10, b: 4.60 };
const LEARN = { a: 4.60, b: 8.60 };
const ANSWER = { a: 8.60, b: 16.10 };
const LAND = { a: 16.10, b: DUR };

// the three inbound calls the main pane works through, start to end (the brief's "faster each time")
const WINS = [[8.90, 11.60], [11.60, 14.00], [14.00, 16.10]];
// where each step of a call lands inside its window, as a fraction of it
const FR = { prob: 0.04, cause: 0.12, sol: 0.20, turn1: 0.24, turn2: 0.36, closed: 0.80, end: 0.88 };
const ROW_H = 40;               // one inbound-queue row
const STEP_DONE = [1.75, 4.35, 8.35, 16.15];
const QWAIT_IN = { a: 0.70, b: 1.70 };

const $ = (s, root) => root.querySelector(s);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const setT = (n, s) => { if (n && n.textContent !== s) n.textContent = s; };
const mmss = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s)) % 60).padStart(2, '0')}`;

let el = null;

// ---------- mount ----------
export function mount(section, ctx) {
  const asset = (n) => new URL(`../../img/${n}`, import.meta.url).href;
  const root = h(`<div class="e3-root"></div>`);
  const hudMark = ctx.shell.makeMark(26);
  root.innerHTML = `
<div class="e3">
  <header class="e3-bar">
    <span class="e3-brand"><img src="${asset('comcast-logo.svg')}" alt="Comcast"/></span>
    <span class="e3-lookup">Customer lookup <i class="e3-chev"></i></span>
    <span class="e3-endpill">End Conversation</span>
    <div class="e3-barr">
      <span class="e3-cti">CTI: <b>OFF</b></span>
      <span class="e3-status"><i></i><b>Offline</b></span>
      <span class="e3-hello">Hello <b>Sam</b> <i class="e3-chev"></i></span>
      <span class="e3-div"></span>
      <span class="e3-bell">${I.bell}<i class="e3-bell-n">3</i></span>
      <span class="e3-qwrap"><img src="${asset('xfinity-logo.svg')}" alt="Xfinity"/><span class="e3-qtx">Xfinity Support · <b class="e3-qtxn">0</b>${NB}waiting</span></span>
    </div>
  </header>

  <section class="e3-cust">
    <div class="e3-acc">
      <div class="e3-acc-n"><b>8888888888888888</b><span class="e3-plan">Freedom</span><i class="e3-chev"></i></div>
      <div class="e3-cust-name"><span class="e3-cn-t">No call connected</span></div>
    </div>
    <div class="e3-fields">
      <div class="e3-f"><dt>Speaking with</dt><dd class="e3-sw">Not connected</dd><span class="e3-ver">${checkDisc()}Verified</span></div>
      <div class="e3-f"><dt>Call back number</dt><dd class="e3-cbn"></dd></div>
      <div class="e3-f"><dt>Customer for</dt><dd class="e3-cfy"></dd></div>
      <div class="e3-f e3-f-w"><dt>Weather</dt><dd class="e3-city"><span class="e3-temp"></span><span class="e3-cty"></span></dd>
        <small class="e3-date">Mon, Sep 28, 2026 | 10:39 AM EST</small></div>
    </div>
    <div class="e3-health">
      <div class="e3-h-t">Account Health <i class="e3-hdot"></i></div>
      <div class="e3-h-drawers">
        <span class="e3-dw">${I.bill}<small>BILL</small></span>
        <span class="e3-dw">${I.tv}<small>TV</small></span>
        <span class="e3-dw">${I.internet}<small>INTERNET</small></span>
      </div>
    </div>
  </section>

  <nav class="e3-tabs">
    <span class="e3-tab">Overview</span>
    <span class="e3-tab">Account <i class="e3-chev"></i></span>
    <span class="e3-tab">Billing &amp; Payment <i class="e3-chev"></i></span>
    <span class="e3-tab">Troubleshooting <i class="e3-chev"></i></span>
    <span class="e3-tab">Services <i class="e3-chev"></i></span>
    <span class="e3-tab">Activity <i class="e3-chev"></i></span>
    <span class="e3-und"></span>
    <span class="e3-search">${I.search}Search</span>
  </nav>

  <div class="e3-body">
    <aside class="e3-rail">
      <span class="e3-rail-i on">${I.notes}<small>Notes</small></span>
      <span class="e3-rail-i">${I.actions}<small>Actions</small></span>
      <span class="e3-rail-i">${I.devices}<small>Devices</small></span>
    </aside>
    <div class="e3-cols">
      <section class="e3-q">
        <div class="e3-q-h">Inbound queue <span class="e3-q-live"><i></i>Lines: <b class="e3-q-ln">0</b>&nbsp;live</span></div>
        <div class="e3-q-top"><b class="e3-q-n">0</b><small>waiting</small>
          <span class="e3-q-sub"><img src="${asset('xfinity-logo.svg')}" alt=""/>answered in your voice</span></div>
        <ul class="e3-q-list"></ul>
        <div class="e3-q-foot"></div>
      </section>
      <section class="e3-main">
        <div class="e3-view e3-v-idle">
          <div class="e3-railc">
            <div class="e3-railc-h">RECOMMENDED ACTIONS</div>
            <div class="e3-rc"><span class="e3-rc-b"></span><div class="e3-rc-m"><b>Upgrade to Gigabit</b><small>Eligible for Promo</small></div></div>
            <div class="e3-rc"><span class="e3-rc-b"></span><div class="e3-rc-m"><b>Thank for 6&nbsp;Years</b><small>Long Time Customer</small></div></div>
            <div class="e3-csum"><i class="e3-chev"></i>Conversation Summary</div>
          </div>
          <div class="e3-idle-col">
            <div class="e3-reco">
              <div class="e3-reco-l"><b>Einstein Recommends:</b><span class="e3-offer">Take Next Call</span></div>
              <div class="e3-reco-r"><b>Because:</b><small>12 customers are waiting in Xfinity Support and the average wait is climbing.</small></div>
            </div>
            <div class="e3-topics">
              <div>
                <div class="e3-topic">${I.alert}Outages</div>
                <div class="e3-topic">${I.alert}Devices &amp; Diagnostics</div>
                <div class="e3-topic">${I.alert}Billing &amp; Payments</div>
                <div class="e3-topic ok">${I.okc}Services</div>
                <div class="e3-topic">${'<i class="e3-tcount">3</i>'}Tickets &amp; Work Orders</div>
              </div>
              <div class="e3-tl">
                <div class="e3-tl-c"><div class="e3-tl-h">Recent</div>
                  <div class="e3-tl-i"><span class="e3-tl-d"></span><div><small>Sep 28, 2026</small><b>Call: Slow Internet</b><em>10:12 AM EST</em></div></div>
                  <div class="e3-tl-i"><span class="e3-tl-d"></span><div><small>Sep 26, 2026</small><b>Diagnostics: Line noise</b><em>4:02 PM EST</em></div></div>
                </div>
                <div class="e3-tl-c"><div class="e3-tl-h">Upcoming</div>
                  <div class="e3-tl-i"><span class="e3-tl-d"></span><div><small>Oct 05, 2026</small><b>Bill Due</b><em>$89.15</em></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="e3-view e3-v-act">
          <div class="e3-act-h"><h4>Recent Activity</h4>
            <span class="e3-sel">All types <i class="e3-chev"></i></span>
            <span class="e3-sel">Last 30 days <i class="e3-chev"></i></span>
            <span class="e3-cnt"><b class="e3-cn">0</b><small>past calls analyzed</small></span>
          </div>
          <div class="e3-act-vp"><div class="e3-act-in"></div></div>
        </div>

        <div class="e3-view e3-v-call">
          <div class="e3-scc">
            <div class="e3-ph"><b>SMARTCONNECT</b><span class="e3-exp">${I.expand}</span></div>
            <div class="e3-scc-g">
              <div class="e3-scc-l">
                <div class="e3-say">The customer says the problem is</div>
                <div class="e3-sayval e3-v-prob"></div>
                <div class="e3-say">We think the problem could be</div>
                <div class="e3-sayval e3-v-cause"></div>
                <div class="e3-solh">Potential Solutions</div>
                <div class="e3-sols"></div>
              </div>
              <div class="e3-scc-r">
                <div class="e3-reld">Related Details</div>
                <div class="e3-rel"></div>
              </div>
            </div>
            <div class="e3-tr">
              <span class="e3-tr-l">CALLER</span><p class="e3-tr-1"></p>
            </div>
            <div class="e3-tr">
              <span class="e3-tr-l you">YOU</span><p class="e3-tr-2"></p>
              <b class="e3-tr-ok">${I.check}in your voice</b>
            </div>
          </div>
          <div class="e3-lower">
            <div class="e3-rep">
              <div class="e3-rep-h"><b>REPAIRS</b><span class="e3-exp">${I.expand}</span></div>
              <div class="e3-rep-t"><span class="on">Tickets <em class="e3-tk">0</em></span><span>Work Order <em>0</em></span></div>
              <div class="e3-rep-f">
                <span class="e3-sel">All Tickets <i class="e3-chev"></i></span>
                <span class="e3-sel">Last 30 Days <i class="e3-chev"></i></span>
                <span class="e3-find"><i></i><b></b></span>
              </div>
              <div class="e3-rep-head"><span style="flex:1">NAME</span><span style="width:96px">ID</span><span style="width:74px">STATUS</span></div>
              <div class="e3-rows"></div>
            </div>
            <div class="e3-dev">
              <div class="e3-ph"><b>DEVICES</b><span class="e3-exp">${I.expand}</span></div>
              <div class="e3-dev-g">
                <div class="e3-bigcheck"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="e3-bigp" d="M4.5 12.6 10 18 19.6 6.4"/></svg></div>
                <div class="e3-dev-t">ALL DEVICES HEALTHY</div>
              </div>
              <div class="e3-dev-row">
                <span class="e3-dvc">${I.tv}${checkDisc()}</span>
                <span class="e3-dvc">${I.voice}${checkDisc()}</span>
                <span class="e3-dvc">${I.internet}${checkDisc()}</span>
                <span class="e3-dvc">${I.home}${checkDisc()}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>

  <footer class="e3-foot">
    <span class="e3-fc"><small>Calls answered</small><b class="e3-ca">0</b></span>
    <span class="e3-fc"><small>Resolved</small><b>94%</b></span>
    <span class="e3-fc"><small>Avg handle</small><b>2:11</b></span>
    <span class="e3-fc"><small>Queue waiting</small><b class="e3-cq">0</b></span>
    <span class="e3-foot-r">Einstein 360 · seat 14 · superbot agent</span>
  </footer>

  <div class="e3-hud">
    <div class="e3-hud-h"><span class="e3-hud-mark"></span><span class="e3-hud-cur">Clocking in at Comcast</span></div>
    <ul class="e3-hud-steps">${STEPS.map((s) => `<li><i></i>${s}</li>`).join('')}</ul>
    <div class="e3-hud-voice">
      <div class="e3-hud-lane"><b>You</b><span class="e3-hud-bars" data-l="you"></span></div>
      <div class="e3-hud-lane sb"><b>Superbot</b><span class="e3-hud-bars" data-l="sb"></span></div>
      <div class="e3-hud-mh"><span>Voice match</span><b class="e3-hud-pct">0%</b></div>
      <div class="e3-hud-meter"><i></i></div>
    </div>
    <div class="e3-hud-res"><b>What resolves calls</b><div class="e3-hud-chips"></div></div>
    <div class="e3-hud-stats"><span>answered <b class="e3-hs-a">0</b></span><span>resolved 94%</span><span>avg 2:11</span></div>
  </div>
</div>`;
  section.appendChild(root);
  $('.e3-hud-mark', root).appendChild(hudMark.el);

  const tabs = [...root.querySelectorAll('.e3-tab')];
  const ovTab = tabs[0], actTab = tabs[5];

  // the inbound queue: one row per fictional caller, built once and placed every frame from t
  const qList = $('.e3-q-list', root);
  const qRows = QUEUE.map((q) => {
    const n = h(`<li class="e3-qi">
      <span class="e3-qi-av">${esc(q.initials)}</span>
      <span class="e3-qi-m"><span class="e3-qi-n">${esc(q.name)}</span><span class="e3-qi-r">${esc(q.reason)}</span></span>
      <span class="e3-qi-t">0:00</span><em class="e3-qi-p s-ring"><i></i>${I.check}<span class="e3-pl">Ringing</span></em></li>`);
    qList.appendChild(n);
    return { n, q, p: $('.e3-qi-p', n), t: $('.e3-qi-t', n), r: $('.e3-qi-r', n), pl: $('.e3-pl', n) };
  });
  const qEmpty = h(`<div class="e3-q-empty">Line ready · waiting for the next call</div>`);
  qList.appendChild(qEmpty);

  // the Recent Activity list (LEARN): the same 14 rows twice, so it has something to scroll fast through
  const actIn = $('.e3-act-in', root);
  const actRows = [];
  for (let rep = 0; rep < 2; rep++) for (const [who, why, how, out, dur] of ACTIVITY) {
    const n = h(`<div class="e3-arow">
      <span class="e3-arow-av">${I.avatar}</span><span class="e3-arow-n">${esc(who)}</span><span class="e3-arow-r">${esc(why)}</span>
      <span class="e3-arow-s">${esc(how)}</span><span class="e3-arow-o ${out === 'Resolved' ? '' : 'rf'}">${esc(out)}</span><span class="e3-arow-d">${dur}</span></div>`);
    actIn.appendChild(n);
    actRows.push(n);
  }
  const actPx = actRows.length * 46;

  // the three repairs tickets (one per call) and the potential-solution pills (one set per call, swapped in)
  const rowsBox = $('.e3-rows', root);
  const oldBox = h(`<div class="e3-oldrows">${OLD_TICKETS.map(([nm, when, id]) => `<div class="e3-row e3-row-old">
      <span class="e3-row-m"><b>${esc(nm)}</b><small>${esc(when)}</small></span>
      <span class="e3-row-id">${esc(id)}</span><span class="e3-chip">CLOSED</span></div>`).join('')}</div>`);
  const tickets = CALLS.map((c) => {
    const n = h(`<div class="e3-row">
      <span class="e3-row-m"><b>${esc(c.ticket)}</b><small>Sep 28, 2026, ${esc(c.time)}</small></span>
      <span class="e3-row-id">${esc(c.ticketId)}</span><span class="e3-chip open">OPEN</span></div>`);
    rowsBox.prepend(n);
    return { n, chip: $('.e3-chip', n) };
  });
  rowsBox.appendChild(oldBox);
  const solBox = $('.e3-sols', root);
  const sols = CALLS.map((c) => {
    const set = [];
    c.solutions.forEach((s, i) => {
      const n = h(`<span class="e3-sol">${esc(s)}</span>`);
      solBox.appendChild(n);
      set.push(n);
    });
    return set;
  });
  const solBrowse = h(`<span class="e3-solbrowse">Browse ITGs…</span>`);
  solBox.appendChild(solBrowse);
  const relBox = $('.e3-rel', root);
  // two Related Details slots; their code, note and age follow the live call's issue (renderCall)
  const rels = [0, 1].map(() => {
    const n = h(`<div class="e3-rel-i"><div class="e3-rel-h"><b></b><small></small></div><p></p></div>`);
    relBox.appendChild(n);
    return { n, b: $('b', n), s: $('small', n), p: $('p', n) };
  });

  // the HUD's voice lanes: 26 deterministic bars each, plus the match meter
  const lane = (which) => {
    const box = $(`.e3-hud-bars[data-l="${which}"]`, root);
    const out = [];
    for (let i = 0; i < 26; i++) { const b = document.createElement('i'); box.appendChild(b); out.push(b); }
    return out;
  };
  const barsYou = lane('you'), barsSb = lane('sb');
  const YOU = Array.from({ length: 26 }, (_, i) => clamp(0.26 + 0.74 * Math.abs(Math.sin(i * 0.58 + 0.7)) * (0.52 + 0.48 * Math.abs(Math.sin(i * 0.21 + 1.3))) * (0.68 + 0.32 * rand(i + 3)), 0, 1));
  const OTHER = YOU.map((_, i) => clamp(0.24 + 0.76 * YOU[(i * 5 + 3) % 26], 0, 1));

  const chipBox = $('.e3-hud-chips', root);
  const resChips = RESOLVERS.map((r) => {
    const n = h(`<span class="e3-hud-chip">${I.check}${esc(r)}</span>`);
    chipBox.appendChild(n);
    return n;
  });

  el = {
    root, hudMark, tabs, ovTab, actTab,
    bar: $('.e3-bar', root), endPill: $('.e3-endpill', root), ctiB: $('.e3-cti b', root),
    statusB: $('.e3-status b', root), statusDot: $('.e3-status i', root), hello: $('.e3-hello', root),
    qtxn: $('.e3-qtxn', root), qn: $('.e3-q-n', root), fca: $('.e3-ca', root), fcq: $('.e3-cq', root),
    qlive: $('.e3-q-live', root), qln: $('.e3-q-ln', root), qEmpty, qRows,
    cn: $('.e3-cn', root), actIn, actRows, actPx, und: $('.e3-und', root),
    vIdle: $('.e3-v-idle', root), vAct: $('.e3-v-act', root), vCall: $('.e3-v-call', root),
    cnT: $('.e3-cn-t', root), fields: $('.e3-fields', root), sw: $('.e3-sw', root),
    cbn: $('.e3-cbn', root), cfy: $('.e3-cfy', root), temp: $('.e3-temp', root), cty: $('.e3-cty', root),
    date: $('.e3-date', root), accN: $('.e3-acc-n b', root), plan: $('.e3-plan', root),
    prob: $('.e3-v-prob', root), cause: $('.e3-v-cause', root), sols, solBrowse, rels, relBox,
    tr1: $('.e3-tr-1', root), tr2: $('.e3-tr-2', root), trOk: $('.e3-tr-ok', root),
    tickets, tk: $('.e3-tk', root), bigP: $('.e3-bigp', root),
    hud: $('.e3-hud', root), hudCur: $('.e3-hud-cur', root), hudSteps: [...root.querySelectorAll('.e3-hud-steps li')],
    hudVoice: $('.e3-hud-voice', root), hudPct: $('.e3-hud-pct', root), hudMeter: $('.e3-hud-meter i', root),
    hudRes: $('.e3-hud-res', root), resChips, hudStats: $('.e3-hud-stats', root), hudSa: $('.e3-hs-a', root),
    barsYou, barsSb, tabsBox: $('.e3-tabs', root), YOU, OTHER, e3: $('.e3', root), qListEl: qList, lay: null,
  };
  return el;
}

// ---------- per-frame render ----------
function callState(t) {
  for (let i = 0; i < WINS.length; i++) {
    if (t >= WINS[i][0] && t < WINS[i][1]) return { i, c: CALLS[i], a: WINS[i][0], b: WINS[i][1], f: (t - WINS[i][0]) / (WINS[i][1] - WINS[i][0]) };
  }
  if (t >= WINS[2][1]) return { i: 2, c: CALLS[2], a: WINS[2][0], b: WINS[2][1], f: 1 };
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
    // only the rows that fit are drawn: an older row pushed past the fold fades out as the next one slides in
    const fold = clamp(1 - (y / ROW_H - (el.lay.rows - 1)) * 2.5);
    row.n.style.opacity = (seg(t, q.tIn, q.tIn + 0.26) * fold).toFixed(3);
    const answered = t >= q.tAns, resolved = t >= q.tRes;
    const cls = resolved ? 's-res' : answered ? 's-ans' : 's-ring';
    if (row.p.className !== `e3-qi-p ${cls}`) row.p.className = `e3-qi-p ${cls}`;
    setT(row.pl, resolved ? 'Resolved' : answered ? 'Answered' : 'Ringing');
    if (!answered) {
      row.p.style.opacity = (0.55 + 0.45 * Math.abs(Math.sin((t - q.tIn) * 5.2))).toFixed(3);
      row.p.style.transform = `scale(${(1 + 0.05 * Math.abs(Math.sin((t - q.tIn) * 5.2))).toFixed(3)})`;
    } else { row.p.style.opacity = '1'; row.p.style.transform = ''; }
    // the wait clock runs while it rings and freezes on the answer
    setT(row.t, answered ? q.wait : mmss(t - q.tIn));
    // the reason line becomes the disposition once the call closes
    setT(row.r, resolved ? q.disp : q.reason);
    if (answered && !resolved) live++;
  }
  setT(el.qln, String(live));
  // the landed state: the live-lines chip turns into "Queue clear"
  const clear = t >= LAND.a;
  if (el.qlive.classList.contains('clear') !== clear) {
    el.qlive.classList.toggle('clear', clear);
    el.qlive.innerHTML = clear ? `${I.check}Queue clear` : '<i></i>Lines: <b class="e3-q-ln">0</b>&nbsp;live';
    el.qln = $('.e3-q-ln', el.qlive) || el.qln;
    if (!clear) setT(el.qln, String(live));
  }
  el.qlive.style.opacity = seg(t, ANSWER.a + 0.15, ANSWER.a + 0.5).toFixed(3);
  el.qEmpty.style.opacity = (1 - seg(t, QUEUE[0].tIn, QUEUE[0].tIn + 0.3)).toFixed(3);
  setT(el.qn, String(waiting));
  setT(el.qtxn, String(waiting));
  setT(el.fcq, String(waiting));
}

function renderChrome(t, waiting) {
  const cti = seg(t, 0.35, 0.55);
  el.root.classList.toggle('cti', cti > 0.5);
  setT(el.ctiB, cti > 0.5 ? 'ON' : 'OFF');
  setT(el.statusB, t >= 0.55 ? 'Ready' : 'Offline');
  el.statusDot.style.background = t >= 0.55 ? '#3ddc6b' : '#8d939c';
  const hel = outCubic(seg(t, 0.55, 1.0));
  el.hello.style.opacity = hel.toFixed(3);
  el.hello.style.transform = `translateX(${((1 - hel) * 8).toFixed(2)}px)`;
  // counters (footer, and mirrored in the HUD's stats line)
  const an = Math.round(1 + 46 * outCubic(seg(t, 8.85, 16.05)));
  setT(el.fca, t < ANSWER.a ? '0' : String(an));
  setT(el.hudSa, String(an));
}

function renderHeader(t) {
  const c = callState(t);
  const fill = c ? outCubic(seg(t, c.a, c.a + 0.34)) : 0;
  const v = c ? c.c : null;
  setT(el.sw, v ? v.name : 'Not connected');
  setT(el.cnT, v ? v.name : 'No call connected');
  setT(el.cbn, v ? v.phone : '');
  setT(el.cfy, v ? v.tenure : '');
  setT(el.temp, v ? v.temp : '');
  setT(el.cty, v ? v.city : '');
  setT(el.date, v ? `${v.date} | ${v.time}` : 'Mon, Sep 28, 2026 | 10:39 AM EST');
  setT(el.accN, v ? v.account : '8888888888888888');
  setT(el.plan, v ? v.plan : 'Freedom');
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
  // the underline slides from Overview to Activity (measured per frame: the bundled font may land after mount)
  const ov = el.ovTab, ac = el.actTab;
  const bl = lerp(ov.offsetLeft, ac.offsetLeft, actOn), bw = lerp(ov.offsetWidth, ac.offsetWidth, actOn);
  el.und.style.left = bl.toFixed(2) + 'px';
  el.und.style.width = bw.toFixed(2) + 'px';
  el.ovTab.classList.toggle('on', actOn <= 0.5);
  el.actTab.classList.toggle('on', actOn > 0.5);
}

function renderLearn(t) {
  const c = outCubic(seg(t, LEARN.a + 0.30, 7.40));
  setT(el.cn, Math.round(1284 * c).toLocaleString('en-US'));
  const y = -lerp(0, el.actPx - 470, outCubic(seg(t, LEARN.a + 0.30, 7.40)));
  el.actIn.style.transform = `translateY(${Math.min(0, y).toFixed(2)}px)`;
}

function renderCall(t) {
  const c = callState(t);
  // the Devices check draws itself the first time a live call is on screen
  const draw = outCubic(seg(t, ANSWER.a + 0.05, ANSWER.a + 0.75));
  el.bigP.style.strokeDashoffset = (46 * (1 - draw)).toFixed(2);
  if (!c) {
    el.trOk.style.opacity = '0';
    return;
  }
  const k = c.c;
  const prob = outCubic(seg(t, st(c, 'prob'), st(c, 'prob') + 0.3));
  const cause = outCubic(seg(t, st(c, 'cause'), st(c, 'cause') + 0.3));
  if (el.prob.textContent !== k.reason) el.prob.textContent = k.reason;
  if (el.cause.textContent !== k.cause) el.cause.textContent = k.cause;
  el.prob.style.opacity = prob.toFixed(3);
  el.cause.style.opacity = cause.toFixed(3);
  el.prob.style.transform = `translateY(${((1 - prob) * 6).toFixed(2)}px)`;
  el.cause.style.transform = `translateY(${((1 - cause) * 6).toFixed(2)}px)`;
  // the solution superbot clicks: only this call's pill set is live, and its pressed one dips
  el.sols.forEach((set, si) => set.forEach((n, i) => {
    const live = si === c.i;
    n.style.display = live ? '' : 'none';
    const isP = live && i === k.press;
    const at = st(c, 'sol') + 0.10;
    const pr = isP ? press(t, at, 0.08, 0.10, 0.16) : 0;
    n.classList.toggle('press', isP && t >= at - 0.04);
    n.style.transform = `scale(${(1 - 0.06 * pr).toFixed(4)})`;
  }));
  el.rels.forEach((r, i) => {
    const [code, note, ago] = k.related[i];
    setT(r.b, code); setT(r.s, ago); setT(r.p, note);
    r.n.style.opacity = (outCubic(seg(t, c.a + 0.04, c.a + 0.4)) * (1 - 0.3 * i)).toFixed(3);
  });
  // transcript
  const n1 = streamCount(k.ask, st(c, 'turn1'), 62, t);
  if (el.tr1.textContent.length !== n1) el.tr1.textContent = k.ask.slice(0, n1);
  const n2 = streamCount(k.reply, st(c, 'turn2'), 112, t);
  if (el.tr2.textContent.length !== n2) el.tr2.textContent = k.reply.slice(0, n2);
  const ok = outCubic(seg(t, st(c, 'turn2') + 0.15, st(c, 'turn2') + 0.75));
  el.trOk.style.opacity = ok.toFixed(3);
  // repairs: this call's ticket is OPEN until it flips to CLOSED
  const closeAt = st(c, 'closed');
  el.tickets.forEach((tk, i) => {
    const mine = i === c.i;
    const shown = t >= WINS[i][0] + 0.04;
    const appear = outCubic(seg(t, WINS[i][0] + 0.04, WINS[i][0] + 0.45));
    tk.n.style.display = shown ? '' : 'none';
    tk.n.style.opacity = appear.toFixed(3);
    const closed = t >= closeAt && mine;
    // the status chip flips over (1 -> 0 -> 1 on Y) as it turns from OPEN to CLOSED
    const fs = mine ? seg(t, closeAt - 0.11, closeAt + 0.11) : 1;
    tk.chip.style.transform = `scaleY(${Math.max(0.02, Math.abs(0.5 - fs) * 2).toFixed(3)})`;
    const done = i < c.i || closed;
    tk.chip.classList.toggle('open', !done);
    setT(tk.chip, done ? 'CLOSED' : 'OPEN');
  });
  setT(el.tk, String(CALLS.slice(0, c.i + 1).length));
  // End Conversation is pressed as the call closes
  const ep = press(t, st(c, 'end'), 0.07, 0.08, 0.14);
  el.endPill.style.transform = `scale(${(1 - 0.06 * ep).toFixed(4)})`;
  el.endPill.style.boxShadow = `inset 0 0 0 1.5px #3a8fd6, inset 0 0 0 40px rgba(58,143,214,${(0.55 * ep).toFixed(3)})`;
}

function renderHud(t) {
  const cur = t < 1.50 ? 'Clocking in at Comcast'
    : t < VOICE.a ? 'CTI on · line ready'
      : t < 4.30 ? 'Matching your voice'
        : t < LEARN.a ? 'Voice matched'
          : t < 8.30 ? 'Reading your last 1,284 calls'
            : t < LAND.a ? 'Answering calls for you' : 'Queue clear · 47 answered';
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
  // the voice panel (VOICE)
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
    el.hudMeter.style.width = (98 * cv).toFixed(1) + '%';
    setT(el.hudPct, Math.round(98 * cv) + '%');
  }
  // what superbot learned (LEARN)
  // it folds away again once the calls start, so the HUD stays small over the queue
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

// the desktop is authored in design px and scaled up to the frame, so its type reads at the size the real
// screens show it (the reference captures run ~1450 px wide). Narrower ratios scale less and restack (e360.css).
const UI_SCALE = (W) => (W >= 1900 ? 1.3 : W >= 1400 ? 1.2 : W >= 1000 ? 1.1 : 1.05);
function layout(W) {
  if (el.lay && el.lay.W === W) return el.lay;
  const S = UI_SCALE(W);
  el.e3.style.width = (W / S).toFixed(2) + 'px';
  el.e3.style.height = (1080 / S).toFixed(2) + 'px';
  el.e3.style.transform = `scale(${S})`;
  const cs = getComputedStyle(el.qListEl);
  const listH = el.qListEl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  el.lay = { W, S, rows: Math.max(3, Math.floor(listH / ROW_H)) };
  return el.lay;
}

export function render(t, W = 1920) {
  if (!el) return;
  layout(W);
  const waiting = t < QWAIT_IN.b ? Math.round(12 * outCubic(seg(t, QWAIT_IN.a, QWAIT_IN.b)))
    : t < ANSWER.a ? 12
      : QUEUE.filter((q) => t < q.tAns).length;
  renderChrome(t, waiting);
  renderHeader(t);
  renderViews(t);
  renderQueue(t, waiting);
  renderLearn(t);
  renderCall(t);
  renderHud(t);
}

export default { id: 'e360', DUR, mount, render };
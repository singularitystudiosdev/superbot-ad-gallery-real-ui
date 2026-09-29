// sabre.js: the Sabre Red 360 travel-agent desk, and the four beats superbot works on it.
// The motion engine is the call-center spot's (do-my-job-callcenter-superbot-497a61f3, its desk module), beat for
// beat: DUR, the CONNECT / VOICE / LEARN / ANSWER / LAND windows, WINS, FR, STEP_DONE, QWAIT_IN, the queue-row
// physics and every HUD rule are unchanged. Only what the desk shows is new.
// It is one DOM tree built at mount and then driven purely from local time t (?t=<s> reproduces any frame), so the
// spot is seek-safe at every ratio. The chrome is rebuilt in HTML from Sabre Red 360 reference frames kept in
// .tmp/ta-ad.8163d44c/refs (see REFS.md there, and sabre.tokens.css for the sampled values): the light menu bar,
// the charcoal Favorites / Tools / Community / Admin bar with the red Sabre banner at its right end, the A to F
// work-area tabs, the slate Profile / Air / Hotel / Car / PNR / Proposal row, the PNR tabs (HOME ... HISTORY), the
// Trip Summary panel with End & Retrieve, and the dark command pane with its TYPE COMMAND HERE entry line and Send.
// One real Sabre mark sits in the chrome (../../img/sabre-logo.svg, see ../../img/CREDITS.txt). Every record on
// the desk comes from sabre-data.js.
// On top of the source engine this desk adds: the command pane (the record display, superbot's entry, the response;
// a line longer than the pane, the 3DOCS SSR or the *T ticket line, continues on the next line), the Q6 queue number on schedule-change
// rows, footer counts of Rebooked / Claims filed read off the rows' dispositions, and the fitting rules that keep any
// row from being drawn cut or under the HUD (History rows fade at the list's edges; task rows under the HUD hide).
//
// REAL AND CITED: every flight, time, aircraft, rule, amount, Sabre entry, status code, queue number and ticket prefix
// the desk shows (scenes/tabs-assets/sabre-data.js; one line per fact with a verbatim quote in .tmp/ta-ad.8163d44c/
// research/sources.md, saved copies in research/snap, re-checked by audit/verify-shipped.8163d44c.mjs). The three
// worked PNRs: (a) UA852 TPE-SFO 03NOV26 retimed from 25OCT26 to 23:20 / 19:00 (AeroRoutes), 7 h 45 later on arrival,
// past the 6 h international line of 14 CFR 260.2, cancelled and rebooked on UA872 with X1‡01Y1 (Sabre queue 6);
// (b) LH440 FRA-IAH flown 02SEP26, 4 h 39 min late over 8,402 km, EUR 600 under EU261 Art. 7 (Your Europe), the
// e-ticket displayed with *T for the claim (its issue date / time are part of the fictional booking, its pseudo city
// code T3K7 and sine ASB part of the agent);
// (c) UA934 EWR-LHR 13OCT26, a US passport needs a UK ETA, £20 on GOV.UK, passport SSR added as 3DOCS/P, then ER.
// FICTIONAL ON PURPOSE (and nothing else is):
//   - traveler names (GDS 'SURNAME/FIRST MR|MS'; the source desk's own fictional callers, never a real private person)
//   - 6-letter record locators (pnr, OLD_ITEMS ids)
//   - ticket serial digits after the real 3-digit airline prefix
//   - the booking class letter 'Y' is a real full-fare economy code, chosen, not looked up per traveler
//   - desk timings: QUEUE wait/tIn/tAns/tRes/call copied verbatim from the source desk (e360-data.js QUEUE),
//     ACTIVITY handle times copied verbatim, in order, from the source desk's ACTIVITY
//   - the agent (superbot) and the fact that these travelers booked these flights
//   - the passport data in case (c)'s 3DOCS line: passport number, date of birth, gender and expiry (the field order,
//     the P document type and the US country codes follow the sourced Sabre format)
import { clamp, lerp, seg, outCubic, inOutCubic, rand, press, esc, streamCount } from '../../lib.js';
import { I, checkDisc, CASES, QUEUE, ACTIVITY, RULES, STEPS, IDLE, OLD_ITEMS } from './sabre-data.js';

const NB = '\u00a0';

// ---------- the desk's own clock (seconds, local to the desk layer): the call-center spot's, unchanged ----------
export const DUR = 18.40;
const CONNECT = { a: 0.00, b: 2.10 };
const VOICE = { a: 2.10, b: 4.60 };
const LEARN = { a: 4.60, b: 8.60 };
const ANSWER = { a: 8.60, b: 16.10 };
const LAND = { a: 16.10, b: DUR };

// the three PNRs the main pane works through, start to end
const WINS = [[8.90, 11.60], [11.60, 14.00], [14.00, 16.10]];
// where each step of a PNR lands inside its window, as a fraction of it
const FR = { prob: 0.04, cause: 0.12, sol: 0.20, turn1: 0.24, turn2: 0.36, closed: 0.80, end: 0.88 };
const ROW_H = 40;               // one queue row
const AROW_H = 46;              // one HISTORY row
const STEP_DONE = [1.75, 4.35, 8.35, 16.15];
const QWAIT_IN = { a: 0.70, b: 1.70 };
// the command line, inside each PNR's window: typed after the pressed action lands, sent, answered
const CMD = { after: 0.16, cps: 60, send: 0.06, resp: 0.12, line: 0.10 };

// counted from the queue rows themselves (sabre-data.js QUEUE)
const N_Q = QUEUE.length;
const isRebook = (q) => /rebook/i.test(q.disp);
const isClaim = (q) => /claim/i.test(q.disp);
const secs = (s) => { const [m, x] = String(s).split(':').map(Number); return m * 60 + x; };
const mmss = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s)) % 60).padStart(2, '0')}`;
const AVG_WAIT = mmss(Math.round(QUEUE.reduce((a, q) => a + secs(q.wait), 0) / N_Q));

const $ = (s, root) => root.querySelector(s);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const setT = (n, s) => { if (n && n.textContent !== s) n.textContent = s; };

let el = null;

// ---------- mount ----------
export function mount(section, ctx) {
  const asset = (n) => new URL(`../../img/${n}`, import.meta.url).href;
  const root = h(`<div class="sr-root"></div>`);
  const hudMark = ctx.shell.makeMark(26);
  const maxSegs = Math.max(...CASES.map((c) => c.segs.length));
  root.innerHTML = `
<div class="sr">
  <div class="sr-menu"><span>File</span><span>Edit</span><span>View</span><span>Tools</span><span>Window</span><span>Help</span><span>Contact Us</span></div>
  <header class="sr-bar">
    <span class="sr-dd">Favorites <i class="sr-car"></i></span>
    <span class="sr-dd">Tools <i class="sr-car"></i></span>
    <span class="sr-dd">Community <i class="sr-car"></i></span>
    <span class="sr-dd sr-dd-adm">Admin <i class="sr-car"></i></span>
    <div class="sr-barr">
      <span class="sr-sess">Session: <b>Signed out</b></span>
      <span class="sr-status"><i></i><b>Offline</b></span>
      <span class="sr-bell">${I.bell}</span>
      <span class="sr-qchip">${I.queue}<span class="sr-qtx">Queues · <b class="sr-qtxn">0</b>${NB}waiting</span></span>
    </div>
    <span class="sr-banner"><img src="${asset('sabre-logo.svg')}" alt="Sabre"/><em>Red 360</em></span>
  </header>
  <div class="sr-tool"><span class="sr-tool-i">${I.trip}</span><span class="sr-tool-i">${I.cmd}</span><span class="sr-tool-sep"></span><span class="sr-tool-app"><i></i>Red App Centre</span></div>

  <div class="sr-was">
    <span class="sr-wa on"><em>A</em><span class="sr-wa-t"></span></span>
    <span class="sr-wa"><em>B</em></span><span class="sr-wa"><em>C</em></span><span class="sr-wa"><em>D</em></span>
    <span class="sr-wa"><em>E</em></span><span class="sr-wa"><em>F</em></span>
  </div>
  <div class="sr-fn">
    <span class="sr-fb">${I.avatar}Profile</span><span class="sr-fb">${I.air}Air</span><span class="sr-fb">${I.hotel}Hotel</span>
    <span class="sr-fb">${I.car}Car</span><span class="sr-fb">${I.trip}PNR</span><span class="sr-fb sr-fb-prop">${I.trip}Proposal</span>
    <span class="sr-fn-r"><span class="sr-fb sr-fb-h">${I.clock}</span><span class="sr-fb">PF Keys</span><span class="sr-fb sr-fb-mc">${I.cmd}Manual Command</span></span>
  </div>

  <div class="sr-body">
    <section class="sr-q">
      <div class="sr-q-h">${I.queue}<b>Queues</b><span class="sr-q-live"><i></i>Working: <b class="sr-q-ln">0</b></span></div>
      <div class="sr-q-top"><b class="sr-q-n">0</b><small>waiting</small><span class="sr-q-sub">worked in your style</span></div>
      <ul class="sr-q-list"></ul>
    </section>

    <section class="sr-center">
      <div class="sr-pnr">
        <div class="sr-pnr-id">
          <b class="sr-loc">&nbsp;</b>
          <span class="sr-tl"></span>
          <small class="sr-tby"></small>
        </div>
        <div class="sr-pnr-who">
          <span class="sr-pname"></span>
          <span class="sr-pmeta"><span class="sr-pax"></span><span class="sr-tkt"></span></span>
        </div>
        <div class="sr-segs"></div>
        <div class="sr-drw">
          <span class="sr-dw">${I.air}<b class="sr-dw-air">0</b><small>AIR</small></span>
          <span class="sr-dw">${I.hotel}<b>0</b><small>HOTEL</small></span>
          <span class="sr-dw">${I.car}<b>0</b><small>CAR</small></span>
        </div>
      </div>
      <nav class="sr-tabs">
        <span class="sr-und"></span>
        <span class="sr-tab">HOME</span><span class="sr-tab">ITINERARY</span><span class="sr-tab sr-tab-q">QUOTES</span>
        <span class="sr-tab sr-tab-ti">TRAVELER INFORMATION</span><span class="sr-tab">REMARKS</span><span class="sr-tab sr-tab-tk">TICKETING</span>
        <span class="sr-tab">HISTORY</span>
      </nav>
      <div class="sr-main">
        <div class="sr-view sr-v-idle">
          <div class="sr-ti">
            <div class="sr-ti-h">${I.trip}Traveler Information</div>
            ${['Travelers', 'Phone', 'Email', 'Form of Payment', 'Frequent Flyer', 'Delivery Address', 'OSI', 'SSR', 'Security Information']
    .map((s) => `<div class="sr-ti-r"><span>${s}</span><em>Add</em></div>`).join('')}
          </div>
          <div class="sr-sum">
            <div class="sr-sum-h">${I.trip}Summary</div>
            <div class="sr-sum-b">
              <div class="sr-sum-empty">${esc(IDLE.name)}</div>
              <div class="sr-sum-q"><b class="sr-sum-n">0</b><span>PNRs waiting in your queues</span></div>
              <div class="sr-sum-t">${esc(IDLE.date)}</div>
            </div>
          </div>
        </div>

        <div class="sr-view sr-v-act">
          <div class="sr-act-h"><h4>History</h4>
            <span class="sr-sel">All queues <i class="sr-car"></i></span>
            <span class="sr-sel sr-sel-2">Last 90 days <i class="sr-car"></i></span>
            <span class="sr-cnt"><b class="sr-cn">0</b><small>of ${ACTIVITY.length}${NB}past PNRs read</small></span>
          </div>
          <div class="sr-act-vp"><div class="sr-act-in"></div></div>
        </div>

        <div class="sr-view sr-v-call">
          <div class="sr-rc">
            <div class="sr-ph">${I.queue}<b>QUEUE ITEM</b><span class="sr-ph-q"></span><span class="sr-ph-loc"></span></div>
            <div class="sr-rc-g">
              <div class="sr-rc-l">
                <div class="sr-say">The traveler says</div>
                <div class="sr-sayval sr-v-prob"></div>
                <div class="sr-say">The rule says</div>
                <div class="sr-sayval sr-v-cause"></div>
              </div>
              <div class="sr-rc-r">
                <div class="sr-reld">Related details</div>
                <div class="sr-rel"></div>
              </div>
            </div>
            <div class="sr-solrow"><div class="sr-solh">Actions</div><div class="sr-sols"></div></div>
            <div class="sr-tr"><span class="sr-tr-l">TRAVELER</span><p class="sr-tr-1"></p></div>
            <div class="sr-tr"><span class="sr-tr-l sb">SUPERBOT</span><p class="sr-tr-2"></p><b class="sr-tr-ok">${I.check}in your style</b></div>
          </div>
          <div class="sr-lower">
            <div class="sr-tk">
              <div class="sr-tk-h"><b>PNR TASKS</b></div>
              <div class="sr-tk-t"><span class="on">Tasks <em class="sr-tkn">0</em></span><span>Remarks <em>0</em></span></div>
              <div class="sr-tk-head"><span class="c-n">TASK</span><span class="c-id">PNR</span><span class="c-st">STATUS</span></div>
              <div class="sr-rows"></div>
            </div>
            <div class="sr-emu">
              <div class="sr-cl">
                <span class="sr-cl-u">${I.avatar}</span>
                <span class="sr-cl-in"><span class="sr-cl-ph">TYPE COMMAND HERE</span><span class="sr-cl-tx"></span><i class="sr-cl-caret"></i></span>
                <span class="sr-cl-send">Send</span>
              </div>
              <div class="sr-emu-vp"><div class="sr-emu-in"></div></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <aside class="sr-ts">
      <div class="sr-ts-h"><i class="sr-ts-cv"></i>Trip Summary</div>
      <div class="sr-ts-loc">${I.trip}<b class="sr-ts-locb">PNR</b><span class="sr-ts-warn">${I.alert}</span></div>
      <div class="sr-ts-add"><i></i>Add to PNR</div>
      <div class="sr-ts-g">${I.avatar}<b>Travelers (<span class="sr-ts-tn">0</span>)</b><i class="sr-car"></i></div>
      <div class="sr-ts-trav"></div>
      <div class="sr-ts-g">${I.air}<b>Air (<span class="sr-ts-an">0</span>)</b><i class="sr-car"></i></div>
      <div class="sr-ts-air"></div>
      <div class="sr-ts-g off">${I.hotel}<b>Hotel (0)</b><i class="sr-car"></i></div>
      <div class="sr-ts-g off">${I.car}<b>Car (0)</b><i class="sr-car"></i></div>
      <div class="sr-ts-g off"><b>Other (0)</b><i class="sr-car"></i></div>
      <div class="sr-ts-end">End &amp; Retrieve</div>
    </aside>
    <aside class="sr-rail"><span>${I.trip}</span><span>${I.cmd}</span><span>${I.clock}</span><span>${I.search}</span></aside>
  </div>

  <footer class="sr-foot">
    <span class="sr-fc"><small>PNRs worked</small><b class="sr-fw">0</b></span>
    <span class="sr-fc"><small>Rebooked</small><b class="sr-fr">0</b></span>
    <span class="sr-fc"><small>Claims filed</small><b class="sr-fcl">0</b></span>
    <span class="sr-fc"><small>Avg wait</small><b>${AVG_WAIT}</b></span>
    <span class="sr-fc sr-fc-q"><small>Queues waiting</small><b class="sr-fq">0</b></span>
    <span class="sr-foot-r">Sabre Red 360 · superbot working as you</span>
  </footer>

  <div class="sr-hud">
    <div class="sr-hud-h"><span class="sr-hud-mark"></span><span class="sr-hud-cur">Signing in to Sabre</span></div>
    <ul class="sr-hud-steps">${STEPS.map((s) => `<li><i></i>${esc(s)}</li>`).join('')}</ul>
    <div class="sr-hud-voice">
      <div class="sr-hud-lane"><b>Your remarks</b><span class="sr-hud-bars" data-l="you"></span></div>
      <div class="sr-hud-lane sb"><b>Superbot</b><span class="sr-hud-bars" data-l="sb"></span></div>
      <div class="sr-hud-mh"><span>Remarks style</span><b class="sr-hud-pct">matching</b></div>
      <div class="sr-hud-meter"><i></i></div>
    </div>
    <div class="sr-hud-res"><b>What the rules say</b><div class="sr-hud-chips"></div></div>
    <div class="sr-hud-stats"><span>worked <b class="sr-hs-a">0</b></span><span>rebooked <b class="sr-hs-r">0</b></span><span>claims <b class="sr-hs-c">0</b></span></div>
  </div>
</div>`;
  section.appendChild(root);
  $('.sr-hud-mark', root).appendChild(hudMark.el);

  const tabs = [...root.querySelectorAll('.sr-tab')];
  const ovTab = tabs[0], actTab = tabs[tabs.length - 1];

  // the queue: one row per PNR, built once and placed every frame from t
  const qList = $('.sr-q-list', root);
  const qRows = QUEUE.map((q) => {
    const n = h(`<li class="sr-qi">
      <span class="sr-qi-lc"><span class="sr-qi-loc">${esc(q.pnr)}</span>${q.q ? `<small class="sr-qi-qn">Q${q.q}</small>` : ''}</span>
      <span class="sr-qi-m"><span class="sr-qi-n">${esc(q.name)}</span><span class="sr-qi-r">${esc(q.reason)}</span></span>
      <span class="sr-qi-t">0:00</span><em class="sr-qi-p s-q"><i></i>${I.check}<span class="sr-pl">Queued</span></em></li>`);
    qList.appendChild(n);
    return { n, q, p: $('.sr-qi-p', n), t: $('.sr-qi-t', n), r: $('.sr-qi-r', n), pl: $('.sr-pl', n) };
  });
  const qEmpty = h(`<div class="sr-q-empty">Queues open · waiting for the next PNR</div>`);
  qList.appendChild(qEmpty);

  // the HISTORY list (LEARN): the past PNRs superbot reads, once each
  const actIn = $('.sr-act-in', root);
  const actRows = ACTIVITY.map(([who, why, how, out, dur]) => {
    const n = h(`<div class="sr-arow">
      <span class="sr-arow-n">${esc(who)}</span><span class="sr-arow-r">${esc(why)}</span>
      <span class="sr-arow-s">${esc(how)}</span><span class="sr-arow-o ${/not eligible/i.test(out) ? 'alt' : ''}">${esc(out)}</span><span class="sr-arow-d">${esc(dur)}</span></div>`);
    actIn.appendChild(n);
    return n;
  });
  const actPx = actRows.length * AROW_H;

  // the PNR tasks (one per worked PNR) above the older, already-worked items
  const rowsBox = $('.sr-rows', root);
  const oldBox = h(`<div class="sr-oldrows">${OLD_ITEMS.map(([nm, when, id]) => `<div class="sr-row sr-row-old">
      <span class="sr-row-m"><b>${esc(nm)}</b><small>${esc(when)}</small></span>
      <span class="sr-row-id">${esc(id)}</span><span class="sr-chip">DONE</span></div>`).join('')}</div>`);
  const tasks = CASES.map((c) => {
    const n = h(`<div class="sr-row">
      <span class="sr-row-m"><b>${esc(c.task)}</b><small>${esc(c.disposition)}</small></span>
      <span class="sr-row-id">${esc(c.pnr)}</span><span class="sr-chip open">OPEN</span></div>`);
    rowsBox.prepend(n);
    return { n, chip: $('.sr-chip', n) };
  });
  rowsBox.appendChild(oldBox);

  // the action buttons (one set per PNR, swapped in) and the two related-detail slots
  const solBox = $('.sr-sols', root);
  const sols = CASES.map((c) => c.solutions.map((s) => {
    const n = h(`<span class="sr-sol">${esc(s)}</span>`);
    solBox.appendChild(n);
    return n;
  }));
  const relBox = $('.sr-rel', root);
  const rels = [0, 1].map(() => {
    const n = h(`<div class="sr-rel-i"><div class="sr-rel-h"><b></b><small></small></div><p></p></div>`);
    relBox.appendChild(n);
    return { n, b: $('b', n), s: $('small', n), p: $('p', n) };
  });

  // the PNR header's segment lines and the Trip Summary's traveler / air rows (filled per PNR)
  const segBox = $('.sr-segs', root);
  const segs = Array.from({ length: maxSegs }, () => {
    const n = h(`<div class="sr-seg"><span class="s-i"></span><span class="s-f"></span><span class="s-c"></span><span class="s-d"></span><span class="s-p"></span><span class="s-s"></span><span class="s-t"></span><span class="s-e"></span></div>`);
    segBox.appendChild(n);
    return { n, c: [...n.children] };
  });
  const tsTrav = h(`<div class="sr-ts-r"><span class="sr-ts-rt"></span><i class="sr-dots"></i></div>`);
  $('.sr-ts-trav', root).appendChild(tsTrav);
  const tsAir = Array.from({ length: maxSegs }, () => {
    const n = h(`<div class="sr-ts-r"><span class="sr-ts-rt"></span><span class="sr-ts-rs"></span><i class="sr-dots"></i></div>`);
    $('.sr-ts-air', root).appendChild(n);
    return { n, t: $('.sr-ts-rt', n), s: $('.sr-ts-rs', n) };
  });

  // the command pane: for each PNR, first the record display the queue item opens with (*<locator>, the name line
  // and the segment lines in Sabre's text format), then superbot's own entry echoed on its line and the response
  const emuIn = $('.sr-emu-in', root);
  const block = (cmd, lines) => {
    const blk = h(`<div class="sr-eb"><div class="sr-eb-cmd">${esc(cmd)}</div>${lines.map((r) => r.length > 40 ? `<div class="sr-eb-r sr-eb-wrap">${esc(r).replace(/\//g, '/<wbr>')}</div>` : `<div class="sr-eb-r">${esc(r)}</div>`).join('')}</div>`);
    emuIn.appendChild(blk);
    return { blk, cmd: $('.sr-eb-cmd', blk), resp: [...blk.querySelectorAll('.sr-eb-r')] };
  };
  const emu = CASES.map((c) => ({ ret: block(`*${c.pnr}`, pnrLines(c)), own: block(c.cmd, c.resp) }));

  // the HUD's style lanes: 26 deterministic bars each, plus the match meter
  const lane = (which) => {
    const box = $(`.sr-hud-bars[data-l="${which}"]`, root);
    const out = [];
    for (let i = 0; i < 26; i++) { const b = document.createElement('i'); box.appendChild(b); out.push(b); }
    return out;
  };
  const barsYou = lane('you'), barsSb = lane('sb');
  const YOU = Array.from({ length: 26 }, (_, i) => clamp(0.26 + 0.74 * Math.abs(Math.sin(i * 0.58 + 0.7)) * (0.52 + 0.48 * Math.abs(Math.sin(i * 0.21 + 1.3))) * (0.68 + 0.32 * rand(i + 3)), 0, 1));
  const OTHER = YOU.map((_, i) => clamp(0.24 + 0.76 * YOU[(i * 5 + 3) % 26], 0, 1));

  const chipBox = $('.sr-hud-chips', root);
  const resChips = RULES.map((r) => {
    const n = h(`<span class="sr-hud-chip">${I.check}${esc(r)}</span>`);
    chipBox.appendChild(n);
    return n;
  });

  el = {
    root, hudMark, tabs, ovTab, actTab,
    endBtn: $('.sr-ts-end', root), sessB: $('.sr-sess b', root),
    statusB: $('.sr-status b', root), statusDot: $('.sr-status i', root),
    qtxn: $('.sr-qtxn', root), qn: $('.sr-q-n', root), sumN: $('.sr-sum-n', root),
    fw: $('.sr-fw', root), fr: $('.sr-fr', root), fcl: $('.sr-fcl', root), fq: $('.sr-fq', root),
    qlive: $('.sr-q-live', root), qln: $('.sr-q-ln', root), qEmpty, qRows,
    cn: $('.sr-cn', root), actIn, actRows, actPx, actVp: $('.sr-act-vp', root), und: $('.sr-und', root),
    vIdle: $('.sr-v-idle', root), vAct: $('.sr-v-act', root), vCall: $('.sr-v-call', root),
    waT: $('.sr-wa-t', root), loc: $('.sr-loc', root), tl: $('.sr-tl', root), tby: $('.sr-tby', root),
    pname: $('.sr-pname', root), pax: $('.sr-pax', root), tkt: $('.sr-tkt', root), pnrBox: $('.sr-pnr', root),
    segs, dwAir: $('.sr-dw-air', root),
    tsLoc: $('.sr-ts-locb', root), tsTn: $('.sr-ts-tn', root), tsAn: $('.sr-ts-an', root), tsTrav, tsTravT: $('.sr-ts-rt', tsTrav), tsAir,
    phLoc: $('.sr-ph-loc', root), phQ: $('.sr-ph-q', root),
    prob: $('.sr-v-prob', root), cause: $('.sr-v-cause', root), sols, rels,
    tr1: $('.sr-tr-1', root), tr2: $('.sr-tr-2', root), trOk: $('.sr-tr-ok', root),
    tasks, tkn: $('.sr-tkn', root), rowsBox, rowEls: [...rowsBox.querySelectorAll('.sr-row')],
    clPh: $('.sr-cl-ph', root), clTx: $('.sr-cl-tx', root), clCaret: $('.sr-cl-caret', root), clSend: $('.sr-cl-send', root),
    emu, emuIn, emuVp: $('.sr-emu-vp', root),
    hud: $('.sr-hud', root), hudCur: $('.sr-hud-cur', root), hudSteps: [...root.querySelectorAll('.sr-hud-steps li')],
    hudVoice: $('.sr-hud-voice', root), hudPct: $('.sr-hud-pct', root), hudMeter: $('.sr-hud-meter i', root),
    hudRes: $('.sr-hud-res', root), resChips, hudStats: $('.sr-hud-stats', root),
    hsA: $('.sr-hs-a', root), hsR: $('.sr-hs-r', root), hsC: $('.sr-hs-c', root),
    barsYou, barsSb, YOU, OTHER, sr: $('.sr', root), qListEl: qList, lay: null,
  };
  return el;
}

// the PNR display lines: " 1.1SURNAME/FIRST MS" and one line per segment, in the layout of Sabre's own *I itinerary
// display ("1 LH 400Y 02FEB 4 FRAJFK SS1 1025 1315", Basic Pricing quick reference; reference frame 07 shows the same
// "1 WY 670M 25JUL 2 DOHMCT HK2 0750 1020"): segment number, carrier and flight number (4 wide) with the class letter,
// date, day of week (1 = Monday), city pair, status and count, 24 h times. Every segment line in sabre-data.js resp is
// written in this same layout (audit/verify-shipped.8163d44c.mjs checks the two agree field for field).
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
function dow(ddmmm) {
  const m = /^(\d{2})([A-Z]{3})$/.exec(ddmmm || '');
  if (!m || MON.indexOf(m[2]) < 0) return '';
  const d = new Date(Date.UTC(2026, MON.indexOf(m[2]), +m[1])).getUTCDay();
  return String(((d + 6) % 7) + 1);
}
function pnrLines(c) {
  return [` 1.1${c.name}`, ...c.segs.map((g, i) => {
    const [car, num = ''] = g.flt.split(' ');
    return `${i + 1} ${car}${num.padStart(4)}${g.cls} ${g.date} ${dow(g.date)} ${g.from}${g.to} ${g.st} ${g.dep} ${g.arr}`;
  })];
}

// ---------- per-frame render ----------
function callState(t) {
  for (let i = 0; i < WINS.length; i++) {
    if (t >= WINS[i][0] && t < WINS[i][1]) return { i, c: CASES[i], a: WINS[i][0], b: WINS[i][1], f: (t - WINS[i][0]) / (WINS[i][1] - WINS[i][0]) };
  }
  if (t >= WINS[2][1]) return { i: 2, c: CASES[2], a: WINS[2][0], b: WINS[2][1], f: 1 };
  return null;
}
const st = (c, k) => c.a + FR[k] * (c.b - c.a);
// the command line's own marks inside PNR i's window (typed after the pressed action lands)
function cmdTimes(i) {
  const c = { a: WINS[i][0], b: WINS[i][1] };
  const k = CASES[i];
  const type = st(c, 'sol') + CMD.after;
  const typed = type + k.cmd.length / CMD.cps;
  const send = typed + CMD.send;
  const resp = send + CMD.resp;
  return { type, typed, send, resp };
}

function renderQueue(t, waiting) {
  let live = 0;
  for (const row of el.qRows) {
    const q = row.q;
    if (t < q.tIn) {
      // not on queue yet: hidden, and reset to its queued state so a backward seek leaves nothing stale in it
      row.n.style.opacity = '0'; row.n.style.transform = 'translateY(-60px)';
      if (row.p.className !== 'sr-qi-p s-q') row.p.className = 'sr-qi-p s-q';
      setT(row.pl, 'Queued'); setT(row.t, '0:00'); setT(row.r, q.reason);
      row.p.style.opacity = ''; row.p.style.transform = '';
      continue;
    }
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
    const cls = resolved ? 's-done' : answered ? 's-work' : 's-q';
    if (row.p.className !== `sr-qi-p ${cls}`) row.p.className = `sr-qi-p ${cls}`;
    setT(row.pl, resolved ? 'Done' : answered ? 'Working' : 'Queued');
    if (!answered) {
      row.p.style.opacity = (0.55 + 0.45 * Math.abs(Math.sin((t - q.tIn) * 5.2))).toFixed(3);
      row.p.style.transform = `scale(${(1 + 0.05 * Math.abs(Math.sin((t - q.tIn) * 5.2))).toFixed(3)})`;
    } else { row.p.style.opacity = '1'; row.p.style.transform = ''; }
    // the wait clock runs while the PNR sits on queue and freezes when superbot opens it
    setT(row.t, answered ? q.wait : mmss(t - q.tIn));
    // the reason line becomes the disposition once the PNR is done
    setT(row.r, resolved ? q.disp : q.reason);
    if (answered && !resolved) live++;
  }
  setT(el.qln, String(live));
  // the landed state: the working chip turns into "Queues clear"
  const clear = t >= LAND.a;
  if (el.qlive.classList.contains('clear') !== clear) {
    el.qlive.classList.toggle('clear', clear);
    el.qlive.innerHTML = clear ? `${I.check}Queues clear` : '<i></i>Working: <b class="sr-q-ln">0</b>';
    el.qln = $('.sr-q-ln', el.qlive) || el.qln;
    if (!clear) setT(el.qln, String(live));
  }
  el.qlive.style.opacity = seg(t, ANSWER.a + 0.15, ANSWER.a + 0.5).toFixed(3);
  el.qEmpty.style.opacity = (1 - seg(t, QUEUE[0].tIn, QUEUE[0].tIn + 0.3)).toFixed(3);
  setT(el.qn, String(waiting));
  setT(el.qtxn, String(waiting));
  setT(el.fq, String(waiting));
  setT(el.sumN, String(waiting));
}

function renderChrome(t) {
  const on = seg(t, 0.35, 0.55);
  el.root.classList.toggle('sess', on > 0.5);
  setT(el.sessB, on > 0.5 ? 'Signed in' : 'Signed out');
  setT(el.statusB, t >= 0.55 ? 'Available' : 'Offline');
  el.root.classList.toggle('ready', t >= 0.55);
  // counters (footer, mirrored in the HUD's stats line): counted from the queue rows that are done at t
  const done = QUEUE.filter((q) => t >= q.tRes);
  const w = String(done.length), r = String(done.filter(isRebook).length), c = String(done.filter(isClaim).length);
  setT(el.fw, w); setT(el.fr, r); setT(el.fcl, c);
  setT(el.hsA, w); setT(el.hsR, r); setT(el.hsC, c);
}

function renderHeader(t) {
  const c = callState(t);
  const fill = c ? outCubic(seg(t, c.a, c.a + 0.34)) : 0;
  const v = c ? c.c : null;
  setT(el.waT, v ? `${v.pnr} · ${v.name}` : '');
  setT(el.loc, v ? v.pnr : 'No PNR');
  el.pnrBox.classList.toggle('live', !!v);
  setT(el.tby, v ? `Ticket ${v.ticket}` : IDLE.name);
  setT(el.pname, v ? v.name : '');
  setT(el.pax, v ? v.pax : '');
  setT(el.tkt, v ? `${v.segs.length}${NB}${v.segs.length === 1 ? 'segment' : 'segments'}` : '');
  setT(el.dwAir, String(v ? v.segs.length : 0));
  el.segs.forEach((s, i) => {
    const g = v && v.segs[i];
    s.n.style.display = g ? '' : 'none';
    if (!g) return;
    const vals = [String(i + 1), g.flt, g.cls, g.date, `${g.from}${g.to}`, g.st, `${g.dep} ${g.arr}`, g.eq];
    s.c.forEach((n, j) => setT(n, vals[j]));
    const p = outCubic(seg(t, c.a + 0.06 + i * 0.07, c.a + 0.4 + i * 0.07));
    s.n.style.opacity = p.toFixed(3);
  });
  el.tl.style.transform = `scaleX(${fill.toFixed(3)})`;
  // Trip Summary: the PNR, its traveler and its air segments
  setT(el.tsLoc, v ? v.pnr : 'PNR');
  setT(el.tsTn, v ? '1' : '0');
  setT(el.tsAn, String(v ? v.segs.length : 0));
  el.tsTrav.style.display = v ? '' : 'none';
  setT(el.tsTravT, v ? `1.1 ${v.name} (${v.pax.replace(/^\d+\s*/, '')})` : '');
  el.tsAir.forEach((r, i) => {
    const g = v && v.segs[i];
    r.n.style.display = g ? '' : 'none';
    if (!g) return;
    setT(r.t, `${g.from} > ${g.to} ${g.date} ${g.dep}-${g.arr}`);
    setT(r.s, g.st);
  });
  const segWrap = el.pnrBox;
  segWrap.style.setProperty('--fill', (0.3 + 0.7 * fill).toFixed(3));
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
  // the active-tab block slides from HOME to HISTORY (measured per frame: the bundled font may land after mount)
  const ov = el.ovTab, ac = el.actTab;
  const bl = lerp(ov.offsetLeft, ac.offsetLeft, actOn), bw = lerp(ov.offsetWidth, ac.offsetWidth, actOn);
  el.und.style.left = bl.toFixed(2) + 'px';
  el.und.style.width = bw.toFixed(2) + 'px';
  el.ovTab.classList.toggle('on', actOn <= 0.5);
  el.actTab.classList.toggle('on', actOn > 0.5);
}

function renderLearn(t) {
  const c = outCubic(seg(t, LEARN.a + 0.30, 7.40));
  setT(el.cn, String(Math.round(ACTIVITY.length * c)));
  const span = Math.max(0, el.actPx - el.actVp.clientHeight);
  const y = -lerp(0, span, c);
  el.actIn.style.transform = `translateY(${Math.min(0, y).toFixed(2)}px)`;
  // each row lights as the count passes it
  const n = ACTIVITY.length * c;
  const vpH = el.actVp.clientHeight, yy = Math.min(0, y);
  el.actRows.forEach((r, i) => {
    r.classList.toggle('read', i < n);
    // a row crossing the top or bottom edge of the list fades by how far it is past it, so no row is drawn cut
    const top = r.offsetTop + yy, over = Math.max(0, -top, top + r.offsetHeight - vpH);
    r.style.opacity = over < 0.5 ? '' : clamp(1 - over / (AROW_H * 0.5)).toFixed(3);
  });
}

function renderCmd(t, c) {
  // the entry line: this PNR's command is typed, Send dips, the line clears and the response prints
  const T = cmdTimes(c.i);
  const k = c.c;
  const typing = t >= T.type && t < T.send;
  const n = typing ? streamCount(k.cmd, T.type, CMD.cps, t) : 0;
  setT(el.clTx, k.cmd.slice(0, n));
  el.clPh.style.display = n > 0 ? 'none' : '';
  el.clCaret.style.opacity = typing ? '1' : '0';
  const sp = press(t, T.send, 0.06, 0.06, 0.14);
  el.clSend.style.transform = `scale(${(1 - 0.06 * sp).toFixed(4)})`;
  el.clSend.classList.toggle('press', sp > 0.05);
  // the pane: every earlier PNR's blocks stay; this one's record display prints as it opens, then superbot's entry
  // and its response. A block takes space from the moment it starts, and the pane scrolls it into view smoothly.
  let inH = 0;
  const place = (b, start, lineAt, cur) => {
    const on = t >= start;
    b.blk.style.display = on ? '' : 'none';
    b.blk.classList.toggle('cur', cur);
    if (!on) return;
    b.cmd.style.opacity = outCubic(seg(t, start, start + 0.12)).toFixed(3);
    b.resp.forEach((r, j) => { r.style.opacity = outCubic(seg(t, lineAt + j * CMD.line, lineAt + j * CMD.line + 0.14)).toFixed(3); });
    inH += b.blk.offsetHeight * outCubic(seg(t, start, start + 0.3));
  };
  el.emu.forEach((b, i) => {
    if (i > c.i) { b.ret.blk.style.display = 'none'; b.own.blk.style.display = 'none'; return; }
    const Ti = cmdTimes(i), a = WINS[i][0];
    place(b.ret, a + 0.02, a + 0.08, i === c.i && t < Ti.send);
    place(b.own, Ti.send, Ti.resp, i === c.i);
  });
  const pad = parseFloat(getComputedStyle(el.emuIn).paddingTop) + parseFloat(getComputedStyle(el.emuIn).paddingBottom);
  el.emuIn.style.transform = `translateY(${Math.min(0, el.emuVp.clientHeight - inH - pad).toFixed(2)}px)`;
}

// only whole task rows are drawn, and none under the superbot HUD: a row that would be cut by the bottom of the panel,
// or that the HUD covers on the narrow ratios (it sits over the panel's lower left there), is hidden
function fitRows() {
  const boxH = el.rowsBox.clientHeight;
  const hb = parseFloat(getComputedStyle(el.hud).opacity) > 0.05 ? el.hud.getBoundingClientRect() : null;
  for (const r of el.rowEls) {
    r.style.visibility = '';
    if (!r.offsetParent) continue;
    let hide = r.offsetTop - el.rowsBox.offsetTop + r.offsetHeight > boxH + 0.5;
    if (!hide && hb) { const q = r.getBoundingClientRect(); hide = q.right > hb.left && q.left < hb.right && q.bottom > hb.top && q.top < hb.bottom; }
    if (hide) r.style.visibility = 'hidden';
  }
}

function renderCall(t) {
  const c = callState(t);
  if (!c) {
    // the view fades in just ahead of the first PNR: it shows the empty queue item (and is reset whatever was drawn
    // before, so a backward seek leaves nothing stale in it)
    el.trOk.style.opacity = '0';
    el.endBtn.style.transform = '';
    el.endBtn.classList.remove('press');
    setT(el.phLoc, ''); setT(el.phQ, ''); el.phQ.style.display = 'none';
    setT(el.prob, ''); setT(el.cause, ''); setT(el.tr1, ''); setT(el.tr2, '');
    for (const n of [el.prob, el.cause]) { n.style.opacity = ''; n.style.transform = ''; }
    el.sols.forEach((set) => set.forEach((n) => { n.style.display = 'none'; n.classList.remove('press'); n.style.transform = ''; }));
    el.rels.forEach((r) => { setT(r.b, ''); setT(r.s, ''); setT(r.p, ''); r.n.style.opacity = '0'; });
    el.tasks.forEach((tk) => { tk.n.style.display = 'none'; });
    setT(el.tkn, '0');
    fitRows();
    el.emu.forEach((b) => { b.ret.blk.style.display = 'none'; b.own.blk.style.display = 'none'; });
    el.emuIn.style.transform = 'translateY(0px)';
    setT(el.clTx, ''); el.clPh.style.display = ''; el.clCaret.style.opacity = '0';
    el.clSend.style.transform = ''; el.clSend.classList.remove('press');
    return;
  }
  const k = c.c;
  setT(el.phLoc, `${k.pnr} · ${k.name}`);
  const qn = (QUEUE.find((q) => q.pnr === k.pnr) || {}).q;
  setT(el.phQ, qn ? `Q${qn}` : '');
  el.phQ.style.display = qn ? '' : 'none';
  const prob = outCubic(seg(t, st(c, 'prob'), st(c, 'prob') + 0.3));
  const cause = outCubic(seg(t, st(c, 'cause'), st(c, 'cause') + 0.3));
  setT(el.prob, k.says);
  setT(el.cause, k.cause);
  el.prob.style.opacity = prob.toFixed(3);
  el.cause.style.opacity = cause.toFixed(3);
  el.prob.style.transform = `translateY(${((1 - prob) * 6).toFixed(2)}px)`;
  el.cause.style.transform = `translateY(${((1 - cause) * 6).toFixed(2)}px)`;
  // the action superbot clicks: only this PNR's button set is live, and its pressed one dips
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
  // the traveler's line and superbot's reply (compared by content, not length: two PNRs' lines can be the same length,
  // and the source engine's length test left the previous traveler's line on screen when they were)
  setT(el.tr1, k.says.slice(0, streamCount(k.says, st(c, 'turn1'), 62, t)));
  setT(el.tr2, k.reply.slice(0, streamCount(k.reply, st(c, 'turn2'), 112, t)));
  const ok = outCubic(seg(t, st(c, 'turn2') + 0.15, st(c, 'turn2') + 0.75));
  el.trOk.style.opacity = ok.toFixed(3);
  // PNR tasks: this PNR's task is OPEN until it flips to DONE
  const closeAt = st(c, 'closed');
  el.tasks.forEach((tk, i) => {
    const mine = i === c.i;
    const shown = t >= WINS[i][0] + 0.04;
    const appear = outCubic(seg(t, WINS[i][0] + 0.04, WINS[i][0] + 0.45));
    tk.n.style.display = shown ? '' : 'none';
    tk.n.style.opacity = appear.toFixed(3);
    const closed = t >= closeAt && mine;
    // the status chip flips over (1 -> 0 -> 1 on Y) as it turns from OPEN to DONE
    const fs = mine ? seg(t, closeAt - 0.11, closeAt + 0.11) : 1;
    tk.chip.style.transform = `scaleY(${Math.max(0.02, Math.abs(0.5 - fs) * 2).toFixed(3)})`;
    const done = i < c.i || closed;
    tk.chip.classList.toggle('open', !done);
    setT(tk.chip, done ? 'DONE' : 'OPEN');
  });
  setT(el.tkn, String(c.i + 1));
  fitRows();
  renderCmd(t, c);
  // End & Retrieve is pressed as the PNR closes
  const ep = press(t, st(c, 'end'), 0.07, 0.08, 0.14);
  el.endBtn.style.transform = ep > 0 ? `scale(${(1 - 0.06 * ep).toFixed(4)})` : '';
  el.endBtn.classList.toggle('press', ep > 0.05);
}

function renderHud(t) {
  const cur = t < 1.50 ? 'Signing in to Sabre'
    : t < VOICE.a ? 'Signed in · queues open'
      : t < 4.30 ? 'Matching your remarks style'
        : t < LEARN.a ? 'Remarks style matched'
          : t < 8.30 ? `Reading ${ACTIVITY.length}${NB}past PNRs and the rules`
            : t < LAND.a ? 'Working your queues' : `Queues clear · ${N_Q}${NB}worked`;
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
  // the remarks-style panel (VOICE): the two lanes converge; the meter fills and reads "matched", no invented %
  const vo = inOutCubic(seg(t, VOICE.a + 0.04, VOICE.a + 0.34)) * (1 - inOutCubic(seg(t, 4.40, 4.72)));
  el.hudVoice.style.maxHeight = (132 * vo).toFixed(1) + 'px';
  el.hudVoice.style.opacity = vo.toFixed(3);
  if (vo > 0) {   // written whenever the panel draws at all, so a seek never leaves stale bars in it
    const cv = outCubic(seg(t, VOICE.a + 0.25, 4.15));
    const play = t * 2.6;
    for (let i = 0; i < 26; i++) {
      const swell = 0.62 + 0.38 * Math.abs(Math.sin(i * 0.34 - play));
      el.barsYou[i].style.height = (3 + 21 * el.YOU[i] * swell).toFixed(2) + 'px';
      el.barsSb[i].style.height = (3 + 21 * lerp(el.OTHER[i], el.YOU[i], cv) * (0.62 + 0.38 * Math.abs(Math.sin(i * 0.34 - play + 1.9)))).toFixed(2) + 'px';
      el.barsSb[i].style.opacity = (0.55 + 0.45 * cv).toFixed(3);
    }
    el.hudMeter.style.width = (100 * cv).toFixed(1) + '%';
    setT(el.hudPct, cv >= 1 ? 'matched' : 'matching');
    el.hudPct.classList.toggle('ok', cv >= 1);
  }
  // what superbot lifted from the rules (LEARN); it folds away again once the queues start
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
  el.hudStats.style.maxHeight = (40 * so).toFixed(1) + 'px';
  el.hudMark.render(t);
}

// the desk is authored in design px and scaled up to the frame (the call-center spot's scale steps), so its type
// reads at the size the real screens show it. Narrower ratios scale less and restack (sabre.css); the type tokens
// in sabre.tokens.css are set per ratio so no text renders under 14 px at the export size.
const UI_SCALE = (W) => (W >= 1900 ? 1.3 : W >= 1400 ? 1.2 : W >= 1000 ? 1.1 : 1.05);
function layout(W) {
  if (el.lay && el.lay.W === W) return el.lay;
  const S = UI_SCALE(W);
  el.sr.style.width = (W / S).toFixed(2) + 'px';
  el.sr.style.height = (1080 / S).toFixed(2) + 'px';
  el.sr.style.transform = `scale(${S})`;
  const cs = getComputedStyle(el.qListEl);
  const listH = el.qListEl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  el.lay = { W, S, rows: Math.max(3, Math.floor(listH / ROW_H)) };
  return el.lay;
}

export function render(t, W = 1920) {
  if (!el) return;
  layout(W);
  const waiting = t < QWAIT_IN.b ? Math.round(N_Q * outCubic(seg(t, QWAIT_IN.a, QWAIT_IN.b)))
    : t < ANSWER.a ? N_Q
      : QUEUE.filter((q) => t < q.tAns).length;
  renderChrome(t);
  renderHeader(t);
  renderViews(t);
  renderQueue(t, waiting);
  renderLearn(t);
  renderHud(t);     // before the worked PNR: its task rows are fitted around the HUD's size at this t
  renderCall(t);
}

export default { id: 'sabre', DUR, mount, render };

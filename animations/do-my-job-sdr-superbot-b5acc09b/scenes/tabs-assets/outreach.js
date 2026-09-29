// outreach.js: the Outreach desk (Activity > Tasks with the task-flow side panel and the Outreach Voice dialer) and
// the four beats superbot works on it. It is one DOM tree built at mount and then driven purely from local time t
// (?t=<s> reproduces any frame), so the spot is seek-safe at every ratio. The chrome is rebuilt in HTML/CSS from the
// Outreach support-portal screenshots and the live app's theme (see /tmp/sdr-ad.b5acc09b/ref/refs.txt and
// outreach.css for which value came from where).
// The motion is the call-center spot's desk beat for beat: DUR, every beat window, WINS, FR, STEP_DONE, QWAIT_IN
// and the queue's arrival / answer / resolve timings are unchanged; only what the desk shows is an SDR's day. The
// call-center "inbound queue" is the Tasks list (pending -> in progress -> completed on the same tIn / tAns / tRes),
// its three worked calls are three tasks worked in the task flow (an email step, an Outreach Voice call step, a
// LinkedIn connection-request step), and its "Recent Activity" read is a modal of published cold-outreach findings.
// No copy lives here: every string and every figure comes from outreach-data.js or is counted from its arrays.
import { clamp, lerp, seg, outCubic, inOutCubic, rand, press, esc, blink } from '../../lib.js';
import { PLACEHOLDER, SEAT, ACCOUNTS, TASKS, EMAIL, CALL, LINKEDIN, FINDINGS, RULES, OUTREACH, HUD } from './outreach-data.js';
import { I } from './outreach-ui.js';

// ---------- the desk's own clock (seconds, local to the desk layer): the call-center spot's, unchanged ----------
export const DUR = 18.40;
const CONNECT = { a: 0.00, b: 2.10 };
const VOICE = { a: 2.10, b: 4.60 };
const LEARN = { a: 4.60, b: 8.60 };
const ANSWER = { a: 8.60, b: 16.10 };
// the three worked tasks are timed from their own copy: typing never runs faster than CPS characters a second (a
// {{variable}} lands as one unit), and every typed text holds HOLD seconds, fully typed, before its completing button
// is pressed (Send & Complete / Log Call & Complete / Mark Complete), so it can be read. The windows follow each other
// from T0; the last one ends where LAND begins. (The call-center spot's fixed windows could not fit readable copy.)
const CPS = 120, HOLD = 0.80, T0 = 8.66;
const uLen = (s) => units(s).length;
const MK = (() => {
  const e = { a: T0 }; e.prob = e.a + 0.04; e.cause = e.a + 0.12;
  e.subj = [e.a + 0.32]; e.subj[1] = e.subj[0] + Math.max(0.12, uLen(EMAIL.subject) / CPS);
  e.body = [e.subj[1] + 0.04]; e.body[1] = e.body[0] + uLen(EMAIL.body) / CPS;
  e.closed = e.body[1] + HOLD; e.end = e.closed + 0.18; e.b = e.end + 0.14;
  const c = { a: e.b }; c.prob = c.a + 0.02; c.cause = c.a + 0.10; c.ring = c.a + 0.14; c.vm = c.a + 0.30;
  c.notes = [c.vm + 0.04]; c.notes[1] = c.notes[0] + uLen(CALL.notes) / CPS;
  c.hang = c.notes[1] + 0.10; c.disp = c.hang + 0.12; c.closed = c.notes[1] + HOLD; c.end = c.closed + 0.18; c.b = c.end + 0.12;
  const l = { a: c.b }; l.prob = l.a + 0.02; l.cause = l.a + 0.12;
  l.note = [l.a + 0.24]; l.note[1] = l.note[0] + uLen(LINKEDIN.note) / CPS;
  l.copy = l.note[1] + 0.12; l.closed = l.note[1] + HOLD; l.b = l.closed + 0.22; l.end = l.b;
  return [e, c, l];
})();
const WINS = MK.map((m) => [m.a, m.b]);
const LAND = { a: MK[2].b, b: DUR };
ANSWER.b = LAND.a;
if (LAND.a > 16.7) console.error(`[sdr] the worked tasks' copy is too long to type readably: LAND would start at ${LAND.a.toFixed(2)}`);
const STEP_DONE = [1.75, 4.35, 8.35, LAND.a + 0.05];
// the key moment of every beat, in spot time (the desk starts 9.2 s into the spot), for the fit / audit tools only
const DESK_AT = 9.2;
if (typeof window !== 'undefined') window.__SDR_KEY = [
  ['signin', 8.3 - DESK_AT], ['connect', 1.95], ['voice', 3.9], ['learn', 6.3], ['rules', 8.2],
  ['email-card', MK[0].body[0] + 0.12], ['email-typed', MK[0].closed - 0.1], ['call-typed', MK[1].closed - 0.1],
  ['li-typed', MK[2].closed - 0.1], ['land', LAND.a + 1.0],
].map(([k, t]) => ({ k, t: t + DESK_AT, mk: k === 'land' ? null : undefined }));
const QWAIT_IN = { a: 0.70, b: 1.70 };
// the call-center queue's arrival / answer / resolve timings (motion, not content): slot i is task row i; the three
// worked rows take their answer / resolve moments from their task's window instead
const TIMING = [[8.70, 8.90, 11.06], [9.30, 11.60, 13.52], [9.90, 14.00, 15.68], [10.40, 10.95, 12.60], [10.90, 11.35, 13.10],
  [11.40, 11.80, 13.45], [11.90, 12.30, 14.20], [12.40, 12.85, 14.55], [12.90, 13.35, 15.20], [13.40, 13.85, 15.60],
  [13.90, 14.35, 15.92], [14.40, 14.75, 16.02]];

const U = OUTREACH.ui;
const N = Math.min(TASKS.length, TIMING.length);
const ACC = Object.fromEntries(ACCOUNTS.map((a) => [a.id, a]));
const acc = (i) => ACC[TASKS[i].account] || { company: '', domain: '', buyerTitle: '', trigger: {} };
// the three worked tasks: the first email, call and LinkedIn rows (the data contract puts them at 0, 1, 2)
const MAIN = ['email', 'call', 'linkedin'].map((ty) => TASKS.findIndex((x) => x.type === ty));
if (MAIN.some((i) => i < 0 || i >= N)) console.error('[sdr] outreach-data.js TASKS needs an email, a call and a linkedin row among the first 12');

const $ = (s, root) => root.querySelector(s);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
// a scale transform, or none at all at rest (no idle compositing layer, so a frame renders the same whichever way it was reached)
const scl = (v, d = 4) => (Math.abs(v - 1) < 1e-4 ? '' : `scale(${v.toFixed(d)})`);
const setT = (n, s) => { if (n && n.textContent !== s) n.textContent = s; };
const setH = (n, s) => { if (n && n._h !== s) { n.innerHTML = s; n._h = s; } };
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] != null ? o[k] : `{${k}}`));
const fmt = (n) => Number(n).toLocaleString('en-US');
const mmss = (s) => `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, '0')}:${String(Math.floor(Math.max(0, s)) % 60).padStart(2, '0')}`;
const initials = (s) => {
  const w = String(s).replace(/[^A-Za-z0-9 ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  return ((w[0] || '')[0] || '').concat((w[1] || w[0] || '').slice(w[1] ? 0 : 1, w[1] ? 1 : 2)).toUpperCase();
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const showDate = (d) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d || ''));
  return m ? `${MONTHS[+m[2] - 1]} ${+m[3]}, ${m[1]}` : String(d || '');
};
const year = (d) => (/^(\d{4})/.exec(String(d || '')) || [, String(d || '')])[1];
const typeIcon = (ty) => I[ty] || I.action;
const typeWord = (ty) => (OUTREACH.stepTypes[ty] || '').split(':')[0];
const tileKey = (ty) => (ty === 'linkedin' ? 'linkedin' : ty === 'email' ? 'email' : ty === 'call' ? 'call' : ty === 'meet' ? 'meet' : 'action');

// typing: a text is a list of units (a character, a line break, or a whole {{variable}} that lands as one chip)
function units(text) {
  const out = []; const re = /\{\{[^}]+\}\}|\n\n/g; let i = 0, m;
  const s = String(text || '');
  while ((m = re.exec(s))) { for (const ch of s.slice(i, m.index)) out.push(ch); out.push(m[0]); i = m.index + m[0].length; }
  for (const ch of s.slice(i)) out.push(ch);
  return out;
}
const unitHTML = (u) => (u === '\n\n' ? '<br><i class="or-pg"></i>' : u === '\n' ? '<br>' : u.length > 1 && u.startsWith('{{') ? `<span class="or-var">${esc(u)}</span>` : esc(u));
function typeInto(node, us, a, b, t, caretOn = true) {
  const n = Math.round(us.length * clamp((t - a) / Math.max(0.05, b - a)));
  const typing = t >= a && n < us.length;
  const car = caretOn && typing && blink(t, 0.5) ? '<i class="or-car"></i>' : (caretOn && typing ? '<i class="or-car off"></i>' : '');
  setH(node, us.slice(0, n).map(unitHTML).join('') + car);
  return n;
}

// ---------- the Tasks list rows, their moments ----------
const ROWS = TASKS.slice(0, N).map((task, i) => {
  const k = MAIN.indexOf(i);
  const [tIn0, tAns, tRes] = k >= 0 ? [TIMING[i][0], MK[k].a, MK[k].closed] : TIMING[i];
  const tIn = Math.min(tIn0, tAns);
  // the list fills top to bottom over QWAIT_IN (the call-center "waiting" count-up window)
  const land = lerp(QWAIT_IN.a, QWAIT_IN.b - 0.14, N > 1 ? i / (N - 1) : 0);
  return { task, i, a: acc(i), land, tIn, tAns, tRes, k };
});

let el = null;

// ---------- mount ----------
export function mount(section, ctx) {
  const asset = (n) => new URL(`../../img/${n}`, import.meta.url).href;
  const root = h(`<div class="or-root"></div>`);
  const hudMark = ctx.shell.makeMark(26);
  const typeCount = (key) => (key === 'total' ? N : ROWS.filter((r) => tileKey(r.task.type) === key).length);
  const navIcons = [I.home, I.pipeline, I.prospects, I.accounts, I.opps, I.kaia, I.agents, I.forecast, I.records, I.activity];
  root.innerHTML = `
<div class="or">
  <aside class="or-side">
    <div class="or-logo"><img src="${asset('outreach-nucleo.svg')}" alt="Outreach"/></div>
    <nav class="or-nav">
      ${U.nav.map((s, i) => `<span class="or-ni${i === U.nav.length - 1 ? ' open' : ''}">${navIcons[i] || I.records}<span class="or-nl">${esc(s)}</span>${i >= U.nav.length - 2 ? `<span class="or-nch">${i === U.nav.length - 1 ? I.chevUp : I.chevSm}</span>` : ''}</span>`).join('')}
      <div class="or-sub">${U.activity.map((s) => `<span class="or-si${s === U.page ? ' on' : ''}">${esc(s)}</span>`).join('')}</div>
      ${U.navTail.map((s, i) => `<span class="or-ni">${i === 0 ? I.content : I.reports}<span class="or-nl">${esc(s)}</span><span class="or-nch">${I.chevSm}</span></span>`).join('')}
    </nav>
    <div class="or-me"><span class="or-av or-av-me">${esc(SEAT.initials)}</span><span class="or-nl">${esc(SEAT.user)}</span></div>
  </aside>

  <div class="or-page">
    <header class="or-top">
      <h1 class="or-h1">${esc(U.page)}</h1>
      <span class="or-hi">${I.search}</span>
      <span class="or-hi">${I.bell}<i class="or-bdot"></i></span>
      <span class="or-hi">${I.help}</span>
      <span class="or-hi or-hi-ph">${I.phone}<i class="or-live"></i></span>
      <span class="or-hi or-hi-ml">${I.mail}<i class="or-sync">${I.check}</i></span>
      <span class="or-hi">${I.calendar}</span>
      <span class="or-hi">${I.tasks}</span>
      <span class="or-btn or-newtask">${I.plus}${esc(U.newTask)}</span>
      <span class="or-avail"><i></i><b>${esc(OUTREACH.dialer.offline)}</b>${I.chevDown}</span>
      <span class="or-bolt">${I.bolt}</span>
    </header>

    <div class="or-work">
      <section class="or-card">
        <div class="or-tiles">${OUTREACH.tileTypes.map(([k, s], i) => `<div class="or-tile${i === 0 ? ' on' : ''}" data-k="${k}"><b>0</b><small>${esc(s)}</small></div>`).join('')}</div>
        <div class="or-lbar"><span class="or-view">${esc(U.view)}${I.chevDown}</span><span class="or-save">${esc(U.saveView)}</span><span class="or-res">${esc(fill(U.results, { n: fmt(N) }))}</span></div>
        <div class="or-fbar">
          <span class="or-search">${I.search}<span>${esc(U.search)}</span>${I.info}</span>
          ${U.chips.map(([a, b]) => `<span class="or-fchip"><b>${esc(a)}</b>&nbsp;${esc(b)}${I.circleX}</span>`).join('')}
          <span class="or-addf">${esc(U.addFilter)}</span>
          <span class="or-fr">
            <span class="or-btn or-start">${I.play}${esc(U.startTasks)}</span>
            <span class="or-sortb">${I.sort}<span>${esc(U.sort)}</span>${I.chevDown}</span>
            <span class="or-rnd">${I.columns}</span><span class="or-rnd">${I.refresh}</span>
          </span>
        </div>
        <div class="or-thead"><span class="or-c-chk"><i class="or-cb"></i></span>${U.cols.map((c, i) => `<span class="or-c-${['type', 'ct', 'lt', 'dt', 'du', 'st'][i]}">${esc(c)}</span>`).join('')}</div>
        <div class="or-tbody"></div>

        <div class="or-learn">
          <div class="or-modal">
            <div class="or-mh"><h2>${esc(U.learnTitle)}</h2><span class="or-mcnt"><b class="or-cn">0</b><small>${esc(U.learnCount)}</small></span><span class="or-mx">${I.close}</span></div>
            <div class="or-mhead"><span>${esc(U.learnCols[0])}</span><span>${esc(U.learnCols[1])}</span></div>
            <div class="or-mvp"><div class="or-min"></div></div>
          </div>
        </div>
      </section>

      <aside class="or-flow"><div class="or-flin">
        <div class="or-fh">
          <div class="or-fh1"><span class="or-fhi">${I.collapse}</span><span class="or-fnav">${I.chevLeft}<b class="or-fof"></b>${I.chevRight}</span><span class="or-fhi">${I.gear}</span><span class="or-fhi">${I.close}</span></div>
          <div class="or-fh2">
            <div class="or-fhm">
              <small class="or-fty"></small>
              <b class="or-fti"></b>
              <span class="or-fco"></span>
              <span class="or-fst">${I.sendSm}<span class="or-fstt"></span></span>
            </div>
            <span class="or-av or-fav"></span>
          </div>
          <div class="or-fh3"><span class="or-fic"><img src="${asset('outreach-nucleo.svg')}" alt=""/></span><span class="or-fic">${I.linkedin}</span><span class="or-fic">${I.cloud}</span><span class="or-fdue">${I.clock}<span>${esc(U.dueToday)}</span></span></div>
        </div>
        <div class="or-ftabs">${U.tabs.map((s, i) => `<span class="or-ft${i === 0 ? ' on' : ''}">${esc(s)}</span>`).join('')}<span class="or-ftp">${I.plus}</span></div>
        <div class="or-fb"></div>
        <div class="or-ff"><span class="or-btn or-fdo"><span class="or-fdo-a"></span><span class="or-fdo-b">${I.check}<span></span></span></span><span class="or-rnd">${I.snooze}</span><span class="or-fmore">${I.more}</span></div>
      </div></aside>

      <div class="or-dialer">
        <div class="or-dh"><div class="or-dhm"><b class="or-dti"></b><span class="or-dnum">${esc(CALL.phone)}</span></div><span class="or-dhang">${I.hangup}</span></div>
        <div class="or-dband"><span class="or-av or-dav"></span><span class="or-dplus">${I.plus}</span><span class="or-dbi">${I.mic}</span><span class="or-dbi">${I.headset}</span><i class="or-dsep"></i><span class="or-dbi">${I.callLog}</span></div>
        <div class="or-dbody"><div class="or-dst"><b class="or-dstate"></b><span class="or-dco"></span></div><div class="or-dwave"></div></div>
        <div class="or-dfoot"><span class="or-dtm">${I.wave}<b class="or-dtime">00:00</b></span><span class="or-dbi">${I.transfer}</span><span class="or-dbi">${I.keypad}</span><span class="or-dbi">${I.record}</span><span class="or-dbi or-dvm">${I.voicemail}</span><span class="or-dbi or-dai">${I.waveAi}</span></div>
      </div>
    </div>
  </div>

  <div class="or-hud">
    <div class="or-hud-h"><span class="or-hud-mark"></span><span class="or-hud-cur">${esc(HUD.connect)}</span></div>
    <ul class="or-hud-steps">${HUD.steps.map((s) => `<li><i></i>${esc(fill(s, { n: fmt(FINDINGS.length) }))}</li>`).join('')}</ul>
    <div class="or-hud-voice">
      <div class="or-hud-lane"><b>${esc(HUD.laneYou)}</b><span class="or-hud-bars" data-l="you"></span></div>
      <div class="or-hud-lane sb"><b>${esc(HUD.laneSb)}</b><span class="or-hud-bars" data-l="sb"></span></div>
      <div class="or-hud-mh"><span>${esc(HUD.match)}</span><b class="or-hud-pct">0%</b></div>
      <div class="or-hud-meter"><i></i></div>
    </div>
    <div class="or-hud-res"><b>${esc(HUD.rules)}</b><div class="or-hud-chips"></div></div>
    <div class="or-hud-stats">${HUD.stats.map((s, i) => `<span>${esc(s)} <b class="or-hs" data-i="${i}">0</b></span>`).join('')}</div>
  </div>
</div>`;
  section.appendChild(root);
  $('.or-hud-mark', root).appendChild(hudMark.el);

  // ---- the Tasks list: one row per task, built once and restyled every frame from t ----
  const tbody = $('.or-tbody', root);
  const rows = ROWS.map((r) => {
    const tw = typeWord(r.task.type);
    const n = h(`<div class="or-tr">
      <span class="or-c-chk"><i class="or-cb"></i></span>
      <span class="or-c-type">${typeIcon(r.task.type)}</span>
      <span class="or-c-ct"><span class="or-av">${esc(initials(r.a.company))}</span><span class="or-ctm"><b>${esc(r.a.buyerTitle)}</b><small>${esc(r.a.company)}</small></span></span>
      <span class="or-c-lt">${esc(r.task.localTime)}</span>
      <span class="or-c-dt"><span class="or-dt1"><b>${esc(tw)}:</b> ${esc(r.task.detail)}</span><span class="or-dt2">${esc(fill(U.stepOf, { n: r.task.step }))} ${esc(r.task.sequence)}</span></span>
      <span class="or-c-du">${esc(r.task.due)}</span>
      <span class="or-c-st"><em class="or-st s-p"><i class="or-std"></i>${I.check}<span class="or-stl">${esc(OUTREACH.taskStates.pending)}</span></em></span>
    </div>`);
    tbody.appendChild(n);
    return { n, r, st: $('.or-st', n), stl: $('.or-stl', n), std: $('.or-std', n) };
  });
  const allLoaded = h(`<div class="or-loaded">${I.okc}<span>${esc(U.allLoaded)}</span></div>`);
  tbody.appendChild(allLoaded);

  // ---- the findings modal (LEARN): each published finding once ----
  const min = $('.or-min', root);
  const fRows = FINDINGS.map((f) => {
    const n = h(`<div class="or-frow"><span class="or-fstat">${esc(f.stat || '')}</span><span class="or-ftw"><span class="or-ftx">${esc(f.text)}</span>${f.sample ? `<small class="or-fsm">${esc(f.sample)}</small>` : ''}</span><span class="or-fsrc"><b>${esc(f.publisher)}</b><small>${esc(year(f.date))}</small></span></div>`);
    min.appendChild(n);
    return n;
  });

  // ---- the task-flow bodies: one per worked task, built once, only the live one shown ----
  const fb = $('.or-fb', root);
  const views = MAIN.map((ri, k) => {
    const r = ROWS[ri];
    const tr = r.a.trigger || {};
    let n;
    if (r.task.type === 'email') {
      n = h(`<div class="or-fv or-fv-email">
        <div class="or-pz">
          <div class="or-pz-h">${I.sparkle}<b>${esc(U.research)}</b><small>${esc(U.researchSub)}</small></div>
          <div class="or-pz-c">
            <div class="or-pz-l">${esc(U.buyerData)}</div>
            <div class="or-pz-r"><span class="or-pz-hl">${esc(tr.headline || '')}</span><span class="or-pz-d">${esc(showDate(tr.date))}</span></div>
            <p class="or-pz-q">${esc(tr.quote || '')}</p>
            <div class="or-pz-s"><b>${esc(tr.publisher || '')}</b>${tr.amount ? `<span class="or-pz-amt">${esc(tr.amount)}</span>` : ''}</div>
          </div>
        </div>
        <div class="or-cmp">
          <div class="or-cf"><span class="or-cl">${esc(U.to)}</span><span class="or-tochip"><span class="or-av">${esc(initials(r.a.company))}</span>${esc(r.a.buyerTitle)} · ${esc(r.a.domain)}</span><span class="or-ccb">${esc(U.ccbcc)}</span></div>
          <div class="or-cf"><span class="or-cl">${esc(U.subject)}</span><span class="or-subj"></span></div>
          <div class="or-body"></div>
          <div class="or-tools">${[I.textA, I.attach, I.link, I.image, I.copy, I.scissors, I.calendar, I.braces, I.list, I.sendSm, I.clock].map((x) => `<span>${x}</span>`).join('')}</div>
        </div>
      </div>`);
    } else if (r.task.type === 'call') {
      n = h(`<div class="or-fv or-fv-call">
        <div class="or-sel"><small>${esc(U.yourPhone)}</small><span>${esc(SEAT.phone)}</span>${I.chevDown}</div>
        ${CALL.script ? `<div class="or-vms"><div class="or-vms-h">${I.voicemail}<b>${esc(U.vmScript)}</b></div><p>${esc(CALL.script)}</p></div>` : ''}
        <div class="or-pz or-pz-sm">
          <div class="or-pz-h">${I.sparkle}<b>${esc(U.research)}</b></div>
          <div class="or-pz-c"><div class="or-pz-l">${esc(U.buyerData)}</div>
            <div class="or-pz-r"><span class="or-pz-hl">${esc(tr.headline || '')}</span><span class="or-pz-d">${esc(showDate(tr.date))}</span></div>
            <div class="or-pz-s"><b>${esc(tr.publisher || '')}</b></div></div>
        </div>
        <div class="or-log">
          <div class="or-ta"><small>${esc(U.callNotes)}</small><p class="or-notes"></p></div>
          <div class="or-sel or-disp"><small>${esc(U.disposition)}</small><span class="or-dispv"></span>${I.chevDown}</div>
          <div class="or-sel2${CALL.purpose ? '' : ' one'}">
            ${CALL.purpose ? `<div class="or-sel"><small>${esc(U.purpose)}</small><span>${esc(CALL.purpose)}</span>${I.chevDown}</div>` : ''}
            <div class="or-sel"><small>${esc(U.sequenceAction)}</small><span>${esc(CALL.sequenceAction)}</span>${I.chevDown}</div>
          </div>
        </div>
      </div>`);
    } else {
      n = h(`<div class="or-fv or-fv-li">
        <div class="or-li">
          <div class="or-li-h">${I.linkedin}<b>${esc(U.liTitle)}</b></div>
          <p class="or-li-hint">${esc(U.liHint)}</p>
          <div class="or-li-box"><div class="or-li-bh"><small>${esc(U.liNote)}</small><span class="or-li-copy">${I.copy}</span></div><p class="or-li-note"></p>
            <div class="or-li-cnt"><b class="or-li-n">0</b>/${esc(fmt(LINKEDIN.noteLimit))}</div></div>
        </div>
        <div class="or-pz or-pz-sm">
          <div class="or-pz-h">${I.sparkle}<b>${esc(U.research)}</b></div>
          <div class="or-pz-c"><div class="or-pz-l">${esc(U.buyerData)}</div>
            <div class="or-pz-r"><span class="or-pz-hl">${esc(tr.headline || '')}</span><span class="or-pz-d">${esc(showDate(tr.date))}</span></div>
            <div class="or-pz-s"><b>${esc(tr.publisher || '')}</b></div></div>
        </div>
      </div>`);
    }
    n.style.display = 'none';
    fb.appendChild(n);
    const q = (s) => $(s, n);
    return {
      n, k, r, type: r.task.type,
      pz: q('.or-pz'), pzh: q('.or-pz-h'), pzc: q('.or-pz-c'), q: q('.or-pz-q'), qH: 0, hH: 0, subj: q('.or-subj'), body: q('.or-body'), cmp: q('.or-cmp'),
      vms: q('.or-vms'), notes: q('.or-notes'), disp: q('.or-disp'), dispv: q('.or-dispv'), log: q('.or-log'),
      li: q('.or-li'), note: q('.or-li-note'), cnt: q('.or-li-n'), copy: q('.or-li-copy'),
    };
  });
  const US = { subj: units(EMAIL.subject), body: units(EMAIL.body), notes: units(CALL.notes), note: units(LINKEDIN.note) };

  // ---- the HUD's voice lanes: 26 deterministic bars each ----
  const lane = (which) => {
    const box = $(`.or-hud-bars[data-l="${which}"]`, root);
    return Array.from({ length: 26 }, () => { const b = document.createElement('i'); box.appendChild(b); return b; });
  };
  const barsYou = lane('you'), barsSb = lane('sb');
  const YOU = Array.from({ length: 26 }, (_, i) => clamp(0.26 + 0.74 * Math.abs(Math.sin(i * 0.58 + 0.7)) * (0.52 + 0.48 * Math.abs(Math.sin(i * 0.21 + 1.3))) * (0.68 + 0.32 * rand(i + 3)), 0, 1));
  const OTHER = YOU.map((_, i) => clamp(0.24 + 0.76 * YOU[(i * 5 + 3) % 26], 0, 1));
  const chipBox = $('.or-hud-chips', root);
  const ruleChips = RULES.map((r) => { const n = h(`<span class="or-hud-chip">${I.hudCheck}<span>${esc(r.text)}</span></span>`); chipBox.appendChild(n); return n; });
  // the dialer's voicemail wave: 34 bars
  const dwave = $('.or-dwave', root);
  const dBars = Array.from({ length: 34 }, () => { const b = document.createElement('i'); dwave.appendChild(b); return b; });

  const flowHead = {
    of: $('.or-fof', root), ty: $('.or-fty', root), ti: $('.or-fti', root), co: $('.or-fco', root), st: $('.or-fstt', root),
    av: $('.or-fav', root), box: $('.or-fh2', root),
  };
  el = {
    root, hudMark, or: $('.or', root), side: $('.or-side', root), work: $('.or-work', root), card: $('.or-card', root),
    flow: $('.or-flow', root), flin: $('.or-flin', root), rows, allLoaded, tbody,
    tiles: [...root.querySelectorAll('.or-tile')].map((n) => ({ n, k: n.dataset.k, b: $('b', n), total: typeCount(n.dataset.k) })),
    avail: $('.or-avail', root), availB: $('.or-avail b', root), live: $('.or-live', root), sync: $('.or-sync', root),
    start: $('.or-start', root), learn: $('.or-learn', root), modal: $('.or-modal', root), cn: $('.or-cn', root), min, fRows,
    views, US, flowHead, fdo: $('.or-fdo', root), fdoA: $('.or-fdo-a', root), fdoB: $('.or-fdo-b', root), fdoBt: $('.or-fdo-b span', root),
    dialer: $('.or-dialer', root), dti: $('.or-dti', root), dav: $('.or-dav', root), dstate: $('.or-dstate', root), dco: $('.or-dco', root),
    dtime: $('.or-dtime', root), dhang: $('.or-dhang', root), dvm: $('.or-dvm', root), dBars, dwave,
    hud: $('.or-hud', root), hudCur: $('.or-hud-cur', root), hudSteps: [...root.querySelectorAll('.or-hud-steps li')],
    hudVoice: $('.or-hud-voice', root), hudPct: $('.or-hud-pct', root), hudMeter: $('.or-hud-meter i', root),
    hudRes: $('.or-hud-res', root), ruleChips, hudStats: $('.or-hud-stats', root), hs: [...root.querySelectorAll('.or-hs')],
    barsYou, barsSb, YOU, OTHER, lay: null,
  };
  el.callK = views.findIndex((v) => v.type === 'call');
  el.dti.textContent = acc(MAIN[1]).buyerTitle;
  el.dco.textContent = acc(MAIN[1]).company;
  el.dav.textContent = initials(acc(MAIN[1]).company);
  if (PLACEHOLDER) root.dataset.placeholder = '1';
  return el;
}

// ---------- per-frame render ----------
function win(t) {
  for (let i = 0; i < WINS.length; i++) if (t >= WINS[i][0] && t < WINS[i][1]) return { k: i, a: WINS[i][0], b: WINS[i][1], f: (t - WINS[i][0]) / (WINS[i][1] - WINS[i][0]) };
  if (t >= WINS[WINS.length - 1][1]) { const k = WINS.length - 1; return { k, a: WINS[k][0], b: WINS[k][1], f: 1 }; }
  if (t >= ANSWER.a) return { k: 0, a: WINS[0][0], b: WINS[0][1], f: 0 };
  return null;
}

function renderChrome(t) {
  const on = t >= 0.55;
  setT(el.availB, on ? OUTREACH.dialer.available : OUTREACH.dialer.offline);
  el.avail.classList.toggle('on', on);
  const lv = outCubic(seg(t, 0.55, 0.8));
  el.live.style.transform = scl(lv, 3);
  const sy = outCubic(seg(t, 1.05, 1.35));
  el.sync.style.transform = scl(sy, 3);
  // Start tasks is pressed as the task flow opens
  const sp = press(t, ANSWER.a - 0.02, 0.07, 0.07, 0.14);
  el.start.style.transform = scl(1 - 0.06 * sp);
  el.start.classList.toggle('press', sp > 0.3);
}

function renderList(t) {
  let done = 0, emails = 0, calls = 0;
  const cur = win(t);
  el.rows.forEach((row) => {
    const r = row.r;
    const p = outCubic(seg(t, r.land, r.land + 0.3));
    row.n.style.opacity = p.toFixed(3);
    row.n.style.transform = p >= 1 ? '' : `translateY(${((1 - p) * 10).toFixed(2)}px)`;
    const active = t >= r.tAns, resolved = t >= r.tRes;
    const cls = resolved ? 's-d' : active ? 's-a' : 's-p';
    if (row.st.className !== `or-st ${cls}`) row.st.className = `or-st ${cls}`;
    setT(row.stl, resolved ? OUTREACH.taskStates.done : active ? OUTREACH.taskStates.active : OUTREACH.taskStates.pending);
    // due now (tIn) until it is picked up: the pending pill's dot breathes
    if (!active && t >= r.tIn) {
      const b = 0.5 - 0.5 * Math.cos((t - r.tIn) * Math.PI * 2 / 0.9);
      row.std.style.boxShadow = `0 0 0 ${(1 + 3 * b).toFixed(2)}px rgba(94,94,175,${(0.35 * (1 - b)).toFixed(3)})`;
      row.std.classList.add('due');
    } else { row.std.style.boxShadow = ''; row.std.classList.remove('due'); }
    // the in-progress spinner turns with t
    if (active && !resolved) row.std.style.transform = `rotate(${(((t - r.tAns) * 400) % 360).toFixed(1)}deg)`;
    else row.std.style.transform = '';
    row.n.classList.toggle('done', resolved);
    // the row the task flow is working is the selected row
    const sel = r.k >= 0 && cur && cur.k === r.k && t >= ANSWER.a && t < LAND.a;
    row.n.classList.toggle('sel', !!sel);
    if (resolved) { done++; if (r.task.type === 'email') emails++; if (r.task.type === 'call') calls++; }
  });
  el.allLoaded.style.opacity = seg(t, QWAIT_IN.b, QWAIT_IN.b + 0.3).toFixed(3);
  // the tiles count the rows as they land
  el.tiles.forEach((tl) => {
    const landed = tl.k === 'total' ? el.rows.filter((row) => t >= row.r.land).length
      : el.rows.filter((row) => t >= row.r.land && tileKey(row.r.task.type) === tl.k).length;
    setT(tl.b, fmt(Math.min(tl.total, landed)));
  });
  return { done, emails, calls };
}

function renderLearn(t) {
  const on = inOutCubic(seg(t, LEARN.a, LEARN.a + 0.35)) * (1 - inOutCubic(seg(t, 8.45, 8.80)));
  el.learn.style.opacity = on.toFixed(3);
  el.learn.style.visibility = on <= 0.001 ? 'hidden' : 'visible';
  el.modal.style.transform = on >= 1 ? '' : `translateY(${((1 - on) * 14).toFixed(2)}px) scale(${lerp(0.98, 1, on).toFixed(4)})`;
  if (on <= 0.001) return;
  const c = outCubic(seg(t, LEARN.a + 0.30, 7.40));
  setT(el.cn, fmt(Math.round(FINDINGS.length * c)));
  const vp = el.min.parentNode.clientHeight, total = el.min.scrollHeight;
  const y = -Math.max(0, total - vp) * c;
  el.min.style.transform = y === 0 ? '' : `translateY(${y.toFixed(2)}px)`;
  // each finding lights as the read passes it
  el.fRows.forEach((n, i) => {
    const read = c * FINDINGS.length > i + 0.2;
    n.classList.toggle('read', read);
  });
}

// the flow panel slides in as Start tasks is pressed and stays; its width is the card's loss
function renderFlow(t) {
  const L = el.lay;
  const open = inOutCubic(seg(t, ANSWER.a, ANSWER.a + 0.36));
  el.flow.style.width = (L.PW * open + (open > 0 ? L.gap * open : 0)).toFixed(2) + 'px';
  el.flow.style.visibility = open <= 0.001 ? 'hidden' : '';
  el.flin.style.width = L.PW + 'px';
  // the card drops columns it no longer has room for (Local time, then Details, then Due), as the real list does
  const cw = L.cardW - (L.PW + L.gap) * open;
  el.card.classList.toggle('no-lt', cw < 940);
  el.card.classList.toggle('no-dt', cw < 700);
  el.card.classList.toggle('no-du', cw < 520);
  el.card.classList.toggle('no-chk', cw < 420);
  el.card.classList.toggle('tight', cw < 860);
  el.card.classList.toggle('nar', cw < 660);
  const c = win(t);
  if (!c) return;
  const k = c.k, v = el.views[k], r = v.r, m = MK[k];
  // the header: which task, whose title, which company, which step
  const H = el.flowHead;
  setT(H.of, fill(U.flowOf, { i: fmt(r.i + 1), n: fmt(N) }));
  setT(H.ty, r.task.stepType || OUTREACH.stepTypes[r.task.type] || '');
  setT(H.ti, r.a.buyerTitle);
  setT(H.co, r.a.company);
  setT(H.st, `${fill(U.stepHash, { n: r.task.step })} ${r.task.sequence}`);
  setT(H.av, initials(r.a.company));
  // the hand-over between tasks: the outgoing view fades from `end`, the next header lands with its window
  const inF = k === 0 ? 1 : outCubic(seg(t, c.a, c.a + 0.22));
  const outF = k === WINS.length - 1 ? 1 : 1 - inOutCubic(seg(t, m.end, c.b));
  H.box.style.opacity = (inF * (k === WINS.length - 1 ? 1 : lerp(0.35, 1, outF))).toFixed(3);
  el.views.forEach((w, j) => { w.n.style.display = j === k ? '' : 'none'; });
  v.n.style.opacity = (inF * outF).toFixed(3);
  v.n.style.transform = inF >= 1 ? '' : `translateY(${((1 - inF) * 10).toFixed(2)}px)`;
  const rise = (n, a, dy = 8) => { if (!n) return; const p = outCubic(seg(t, a, a + 0.3)); n.style.opacity = p.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - p) * dy).toFixed(2)}px)`; };

  const closeAt = m.closed;
  let label = '', doneLabel = '';
  if (v.type === 'email') {
    rise(v.pz, m.cause);
    rise(v.cmp, m.prob);
    // once the subject starts, the research card folds to its headline + source so the editor has the room
    const fold = inOutCubic(seg(t, m.body[0] + 0.2, m.body[0] + 0.5));
    if (v.q) {
      if (!v.qH) v.qH = v.q.scrollHeight;
      v.q.style.maxHeight = (v.qH * (1 - fold)).toFixed(2) + 'px';
      v.q.style.marginTop = (7 * (1 - fold)).toFixed(2) + 'px';
      v.q.style.opacity = (1 - fold).toFixed(3);
    }
    if (v.pzh) {
      if (!v.hH) v.hH = v.pzh.scrollHeight;
      v.pzh.style.maxHeight = (v.hH * (1 - fold)).toFixed(2) + 'px';
      v.pzh.style.opacity = (1 - fold).toFixed(3);
      v.pzc.style.marginTop = (10 * (1 - fold)).toFixed(2) + 'px';
    }
    typeInto(v.subj, el.US.subj, m.subj[0], m.subj[1], t);
    typeInto(v.body, el.US.body, m.body[0], m.body[1], t);
    // the editor keeps the caret in view as the body grows past its box
    v.body.scrollTop = Math.max(0, v.body.scrollHeight - v.body.clientHeight);
    label = U.send; doneLabel = U.sent;
  } else if (v.type === 'call') {
    rise(v.vms, m.prob);
    rise(v.pz, m.cause);
    rise(v.log, m.vm - 0.1);
    typeInto(v.notes, el.US.notes, m.notes[0], m.notes[1], t);
    const dOn = t >= m.disp;
    setT(v.dispv, dOn ? CALL.disposition : '');
    const dp = outCubic(seg(t, m.disp - 0.05, m.disp + 0.25));
    v.disp.style.boxShadow = `inset 0 0 0 ${(1 + 1 * dp * (1 - seg(t, m.disp + 0.3, m.disp + 0.6))).toFixed(2)}px ${dp > 0.02 && t < m.disp + 0.6 ? '#5e5eaf' : '#cccedb'}`;
    label = U.logComplete; doneLabel = U.logged;
  } else {
    rise(v.li, m.prob);
    rise(v.pz, m.cause);
    const n = typeInto(v.note, el.US.note, m.note[0], m.note[1], t);
    setT(v.cnt, fmt(el.US.note.slice(0, n).join('').length));
    const cp = press(t, m.copy, 0.06, 0.08, 0.16);
    v.copy.style.transform = scl(1 - 0.12 * cp, 3);
    v.copy.classList.toggle('on', t >= m.copy);
    label = U.markComplete; doneLabel = U.completed;
  }
  // the completing button: pressed at `closed`, it resolves to a check + the done label
  setT(el.fdoA, label);
  setT(el.fdoBt, doneLabel);
  const pr = press(t, closeAt, 0.07, 0.08, 0.14);
  el.fdo.style.transform = scl(1 - 0.05 * pr);
  const ro = seg(t, closeAt + 0.04, closeAt + 0.3);
  el.fdoA.style.opacity = (1 - outCubic(ro)).toFixed(3);
  el.fdoB.style.opacity = outCubic(seg(t, closeAt + 0.1, closeAt + 0.4)).toFixed(3);
  el.fdo.classList.toggle('ok', t >= closeAt + 0.1);
}

function renderDialer(t) {
  const k = el.callK;
  if (k < 0) return;
  const m = MK[k], a = m.prob, hang = m.hang;
  const on = outCubic(seg(t, a, a + 0.3)) * (1 - inOutCubic(seg(t, hang + 0.18, hang + 0.5)));
  el.dialer.style.opacity = on.toFixed(3);
  el.dialer.style.visibility = on <= 0.001 ? 'hidden' : 'visible';
  const dy = (1 - outCubic(seg(t, a, a + 0.3))) * 16;
  el.dialer.style.transform = dy <= 0 ? '' : `translateY(${dy.toFixed(2)}px)`;
  if (on <= 0.001) return;
  const D = OUTREACH.dialer;
  const st = t >= hang ? D.ended : t >= m.vm ? D.voicemail : t >= m.ring ? D.ringing : D.calling;
  setT(el.dstate, st);
  setT(el.dtime, mmss(CALL.durationSec * seg(t, a, hang)));
  el.dvm.classList.toggle('on', t >= m.vm && t < hang);
  const hp = press(t, hang, 0.07, 0.08, 0.14);
  el.dhang.style.transform = scl(1 - 0.1 * hp, 3);
  // the voicemail being left in your voice: the wave moves while it speaks
  const speak = t >= m.vm && t < hang;
  const w = outCubic(seg(t, m.vm, m.vm + 0.2)) * (1 - seg(t, hang - 0.05, hang + 0.1));
  el.dwave.style.opacity = w.toFixed(3);
  el.dBars.forEach((b, i) => {
    const amp = speak ? 0.25 + 0.75 * Math.abs(Math.sin(i * 0.61 + t * 7.3)) * (0.55 + 0.45 * Math.abs(Math.sin(i * 0.23 - t * 3.1))) : 0.15;
    b.style.height = (3 + 22 * amp).toFixed(2) + 'px';
  });
}

function renderHud(t, stats) {
  const cur = t < 1.50 ? HUD.connect
    : t < VOICE.a ? HUD.connected
      : t < 4.30 ? HUD.voice
        : t < LEARN.a ? HUD.voiced
          : t < 8.30 ? fill(HUD.learn, { n: fmt(FINDINGS.length) })
            : t < LAND.a ? HUD.work : fill(HUD.land, { n: fmt(stats.done) });
  setT(el.hudCur, cur);
  el.hudSteps.forEach((li, i) => {
    const done = t >= STEP_DONE[i];
    const c = !done && t >= (i === 0 ? 0 : STEP_DONE[i - 1]);
    li.classList.toggle('done', done);
    li.classList.toggle('cur', c);
    const dot = li.firstElementChild;
    if (c) {
      const b = 0.5 - 0.5 * Math.cos((t - (i === 0 ? 0 : STEP_DONE[i - 1])) * Math.PI * 2 / 1.1);
      dot.style.boxShadow = `inset 0 0 0 1.5px #34c759, 0 0 0 ${(1 + 4 * b).toFixed(2)}px rgba(52,199,89,${(0.42 * (1 - b)).toFixed(3)})`;
    } else if (dot.style.boxShadow) dot.style.boxShadow = '';
  });
  const vo = inOutCubic(seg(t, VOICE.a + 0.04, VOICE.a + 0.34)) * (1 - inOutCubic(seg(t, 4.40, 4.72)));
  el.hudVoice.style.maxHeight = (el.hudVoice.scrollHeight * vo).toFixed(1) + 'px';
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
  const ro = inOutCubic(seg(t, 6.55, 6.85)) * (1 - inOutCubic(seg(t, ANSWER.a + 0.35, ANSWER.a + 0.75)));
  el.hudRes.style.opacity = ro.toFixed(3);
  el.hudRes.style.maxHeight = (el.hudRes.scrollHeight * ro).toFixed(1) + 'px';
  el.ruleChips.forEach((n, i) => {
    const p = outCubic(seg(t, 6.62 + i * 0.15, 6.62 + i * 0.15 + 0.4));
    n.style.opacity = (p * ro).toFixed(3);
    n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 8).toFixed(2)}px)`;
  });
  const so = inOutCubic(seg(t, ANSWER.a - 0.2, ANSWER.a + 0.2));
  el.hudStats.style.opacity = so.toFixed(3);
  el.hudStats.style.maxHeight = ((el.hudStats.scrollHeight + 2) * so).toFixed(1) + 'px';
  [stats.done, stats.emails, stats.calls].forEach((v, i) => setT(el.hs[i], fmt(v)));
  el.hudMark.render(t);
}

// the desk is authored in design px and scaled up to the frame, so its type reads at the size the real screens show
// it; narrower ratios scale less, fold the sidebar to the icon rail (the app's collapsed state) and narrow the flow
const UI_SCALE = (W) => (W >= 1900 ? 1.3 : W >= 1400 ? 1.2 : W >= 1000 ? 1.1 : 1.05);
const FLOW_W = (W) => (W >= 1900 ? 440 : W >= 1400 ? 420 : W >= 1000 ? 400 : 372);
function layout(W) {
  if (el.lay && el.lay.W === W) return el.lay;
  const S = UI_SCALE(W);
  el.or.style.width = (W / S).toFixed(2) + 'px';
  el.or.style.height = (1080 / S).toFixed(2) + 'px';
  el.or.style.transform = `scale(${S})`;
  el.or.classList.toggle('rail', W < 1900);
  const PW = FLOW_W(W), gap = 14;
  // the card's full width, measured with the flow closed
  el.flow.style.width = '0px';
  const cardW = el.card.getBoundingClientRect().width / S;
  // the dialer floats over the list, just left of the open task flow
  el.dialer.style.right = (PW + gap + 20) + 'px';
  el.views.forEach((v) => { v.qH = 0; v.hH = 0; });
  // reading sizes: 18 px in the frame, whatever the desk's scale (never below the app's own sizes)
  el.or.style.setProperty('--rd', Math.max(14.5, 18.2 / S).toFixed(2) + 'px');
  el.or.style.setProperty('--rs', Math.max(13.5, 18 / S).toFixed(2) + 'px');
  // narrower than 16x9 the findings modal would sit under the HUD: top-align it and end it above the HUD at its
  // tallest on that beat (the rule chips shown), measured here with layout offsets (no transforms involved)
  const narrow = W < 1900;
  el.learn.classList.toggle('top', narrow);
  if (narrow) {
    const res = el.hudRes, mh = res.style.maxHeight, st = el.hudStats.style.maxHeight, vo = el.hudVoice.style.maxHeight;
    res.style.maxHeight = 'none'; el.hudStats.style.maxHeight = '0px'; el.hudVoice.style.maxHeight = '0px';
    const hudTop = el.or.offsetHeight - 14 - el.hud.offsetHeight;
    res.style.maxHeight = mh; el.hudStats.style.maxHeight = st; el.hudVoice.style.maxHeight = vo;
    const cardTop = el.work.offsetTop + el.card.offsetTop;
    el.modal.style.height = Math.max(320, hudTop - cardTop - 14 - 12).toFixed(1) + 'px';
  } else el.modal.style.height = '';
  el.lay = { W, S, PW, gap, cardW };
  return el.lay;
}

export function render(t, W = 1920) {
  if (!el) return;
  layout(W);
  renderChrome(t);
  const stats = renderList(t);
  renderLearn(t);
  renderFlow(t);
  renderDialer(t);
  renderHud(t, stats);
}

export default { id: 'outreach', DUR, mount, render };

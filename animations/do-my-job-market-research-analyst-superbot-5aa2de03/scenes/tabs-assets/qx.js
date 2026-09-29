// qx.js: the Qualtrics XM desk (the SHED 2025 project open on Data & Analysis > Crosstabs iQ, the saved crosstabs as
// the tab plan on the left, the topline report on the right) and the four beats superbot works on it. It is one DOM
// tree built at mount and then driven purely from local time t (?t=<s> reproduces any frame), so the spot is
// seek-safe at every ratio. The chrome is rebuilt in HTML/CSS from Qualtrics support-doc screenshots measured into
// .tmp/mr-ad.5aa2de03/ref/measure.json (see qx.css for which value came from where). The motion is the call-center
// spot's (e360.js) beat for beat: every window, WINS, FR fraction, queue timing and HUD rule is unchanged; only what
// the desk shows is an analyst's work. All survey content comes from qx-data.js and every number on screen is read
// from it (percentages, letters, bases, counts) or counted from its arrays (the footer, the list, the HUD).
import { clamp, lerp, seg, outCubic, inOutCubic, rand, press, esc, streamCount } from '../../lib.js';
import { DATASET, BANNERS, LEARN, QUEUE } from './qx-data.js';
import { I, Q, STR, STEPS } from './qx-ui.js';

// ---------- the desk's own clock (seconds, local to the desk layer): the call-center spot's, unchanged ----------
export const DUR = 18.40;
const CONNECT = { a: 0.00, b: 2.10 };
const VOICE = { a: 2.10, b: 4.60 };
const LEARN_B = { a: 4.60, b: 8.60 };
const ANSWER = { a: 8.60, b: 16.10 };
const LAND = { a: 16.10, b: DUR };

// the three crosstabs superbot runs on screen, start to end
const WINS = [[8.90, 11.60], [11.60, 14.00], [14.00, 16.10]];
// where each step of a crosstab lands inside its window, as a fraction of it (the call-center spot's marks): the
// question lands (prob), the banner pills appear (cause), one is pressed (sol + 0.10), the table fills (turn1 on),
// the Fed report check turns Match (closed) and Add to report is pressed (end)
const FR = { prob: 0.04, cause: 0.12, sol: 0.20, turn1: 0.24, closed: 0.80, end: 0.88 };
// inside a window: the table rows land from turn1 to ROWS_END, the significance letters light from SIG_A to SIG_B,
// the finding is typed into the report page from FIND_A to FIND_B, and the Fed report check lands at CHECK_AT
const ROWS_END = 0.42, SIG_A = 0.44, SIG_B = 0.56, FIND_A = 0.50, FIND_B = 0.72, CHECK_AT = 0.70;
const ROW_H = 44;               // one crosstab row in the list (qx.css .qx-li, 40px + 4px gap)
const AROW_H = 56;              // one codebook row (qx.css .qx-arow)
const STEP_DONE = [1.75, 4.35, 8.35, 16.15];
const QWAIT_IN = { a: 0.70, b: 1.70 };   // the list fills over this window (the source's queue-wait count-up)
const N = QUEUE.length;
// the call-center queue's arrival / answer / resolve timings, copied exactly (motion, not content). Slot k of the
// three main crosstabs is opened as window k opens; the other nine take the remaining slots in plan order.
const TIMING = [[8.70, 8.90, 11.06], [9.30, 11.60, 13.52], [9.90, 14.00, 15.68], [10.40, 10.95, 12.60], [10.90, 11.35, 13.10],
  [11.40, 11.80, 13.45], [11.90, 12.30, 14.20], [12.40, 12.85, 14.55], [12.90, 13.35, 15.20], [13.40, 13.85, 15.60],
  [13.90, 14.35, 15.92], [14.40, 14.75, 16.02]];

// the main crosstabs: the first three QUEUE entries that carry a banner and rows (the data contract puts them at 0..2)
const MAIN = QUEUE.map((q, i) => i).filter((i) => QUEUE[i].rows && QUEUE[i].rows.length && BANNERS[QUEUE[i].banner]).slice(0, WINS.length);

const $ = (s, root) => root.querySelector(s);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const setT = (n, s) => { if (n && n.textContent !== s) n.textContent = s; };
const fmt = (n) => Number(n).toLocaleString('en-US');
const pct = (v) => `${v}%`;
// a codebook note's source: the section named in its trailing parentheses (the URL stays in qx-data.js), else as given
// significance letters as the table prints them, comma separated ("B, D"); four or more close up ("A,B,C,D") so they
// keep to one line in a five-column banner
const sigText = (sg) => { const l = String(sg).replace(/[^A-Za-z]/g, '').split(''); return l.join(l.length > 3 ? ',' : ', '); };
// A verbatim excerpt is shown cut where it is cut, one rule for every source line on screen (codebook notes, HUD notes,
// the Fed report check): a leading ellipsis when it starts inside its sentence (a lowercase start, or a clause cut
// here), a trailing one when it stops before the sentence's end (no closing punctuation, or a clause cut here).
const cutMarks = (s, lead = false, trail = false) => {
  const o = String(s || '').trim();
  const a = lead || /^[a-z]/.test(o) ? '…' : '';
  const b = trail || !/[.?!]["”’)]?$/.test(o) ? '…' : '';
  return `${a}${o}${b}`;
};
// the published sentence as the check shows it, inside curly quotes (the source's own double quotes become single ones,
// the nested-quotation rule). Candidates, longest first: the whole verbatim sentence, then the same sentence cut only at
// a clause boundary (a comma) before and / or after the figure it states, so the matching number always stays in; the
// check shows the longest candidate that fits its lines (fitQuote)
const nestQ = (s) => s.replace(/"([^"]*)"/g, '‘$1’');
const quoteCands = (quote, v) => {
  const s = String(quote || '').trim();
  const m = new RegExp(`(^|[^0-9.])${String(v).replace('.', '\\.')}( ?percent|%)`).exec(s);
  const f0 = m ? m.index + m[1].length : 0, f1 = m ? m.index + m[0].length : 0;
  const commas = [...s.matchAll(/, /g)].map((x) => x.index);
  const leads = [0, ...commas.filter((p) => p + 2 <= f0).map((p) => p + 2)];
  const trails = [s.length, ...commas.filter((p) => p >= f1)];
  const out = [];
  for (const a of leads) for (const b of trails) out.push({ n: b - a, t: `“${nestQ(cutMarks(s.slice(a, b), a > 0, b < s.length))}”` });
  return out.sort((x, y) => y.n - x.n).map((x) => x.t);
};
const srcLabel = (s) => { const m = /\(([^()]+)\)\s*$/.exec(String(s || '')); return m ? m[1] : String(s || ''); };
const winLen = (i) => WINS[i][1] - WINS[i][0];
const at = (i, f) => WINS[i][0] + f * winLen(i);
const submitAt = (k) => at(k, FR.end);
// a published figure matches the crosstab's when both round to the same whole percent (the Fed reports whole numbers)
const matches = (q) => Math.round(Number(q.published.pct)) === Math.round(Number(q.headline.pct));

// Text that does not fit its box is cut at a WORD boundary and ends in an ellipsis, instead of the browser's mid-word
// text-overflow cut. Works for single-line (nowrap) boxes and -webkit-line-clamp boxes alike. Cached per text, frame
// width and font state. (The journalist remake's fitT, unchanged.)
const fontState = () => (document.fonts ? document.fonts.status : 'loaded');
const cutAt = (w, m) => w.slice(0, m).join(' ').replace(/[\s,;:(·\-]+$/, '') + '…';
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
    // (a first word too long for the box on its own is cut by characters instead)
    if (best === 1 && over()) {
      const c = w[0];
      let a = 1, b = c.length, keep = 1;
      while (a <= b) { const m = (a + b) >> 1; n.textContent = c.slice(0, m) + '…'; if (over()) b = m - 1; else { keep = m; a = m + 1; } }
      n.textContent = c.slice(0, keep) + '…';
    }
  }
  n._fit = key; n._fitOut = n.textContent;
}
// the Fed report check's quote: the longest clause-bounded candidate (quoteCands) that fits the quote's lines whole;
// only if none does is the shortest one cut at a word (fitT). Cached per frame width and font state, like fitT.
function fitQuote(n, cands) {
  if (!n || !n.clientWidth) return;
  const key = `${el && el.lay ? el.lay.W : 0}|${fontState()}`;
  if (n._fitQ === key && n.textContent === n._fitQOut) return;
  const over = () => n.scrollHeight > n.clientHeight + 0.5 || n.scrollWidth > n.clientWidth;
  let pick = null;
  for (const c of cands) { n.textContent = c; if (!over()) { pick = c; break; } }
  if (pick == null) { n._fit = null; fitT(n, cands[cands.length - 1], 'q'); }
  n._fitQ = key; n._fitQOut = n.textContent;
}

// ---------- the tab plan: the saved crosstabs in their queue slots ----------
const ROWS = (() => {
  const order = [...MAIN];
  QUEUE.forEach((q, i) => { if (!order.includes(i)) order.push(i); });
  const n = Math.min(order.length, TIMING.length);
  return order.slice(0, n).map((qi, slot) => {
    const [, tAns, tRes] = TIMING[slot];
    // the tab plan is on screen from CONNECT: its crosstabs land as the "queued" count rises (QWAIT_IN), the last slot
    // first, so the list reads slot 0 (the first main) at the top; the answer / resolve moments are the source's
    const tIn = lerp(QWAIT_IN.a, QWAIT_IN.b - 0.12, n > 1 ? (n - 1 - slot) / (n - 1) : 0);
    const k = MAIN.indexOf(qi);
    // a main crosstab turns "in report" when its Add to report is pressed
    return { q: QUEUE[qi], qi, k: k < 0 ? null : k, tIn, tAns, tRes: k < 0 ? tRes : Math.max(tRes, submitAt(k)) };
  });
})();

// ---------- a main crosstab's moments ----------
function plan(k) {
  const q = QUEUE[MAIN[k]];
  const B = BANNERS[q.banner];
  const nR = q.rows.length, nC = B.cols.length;
  const tPress = at(k, FR.sol) + 0.10;
  const T = {
    q: at(k, FR.prob), pills: at(k, FR.cause), press: tPress, head: tPress + 0.06,
    rows: q.rows.map((_, r) => lerp(at(k, FR.turn1), at(k, ROWS_END) - 0.12, nR > 1 ? r / (nR - 1) : 0)),
    count: at(k, ROWS_END),
    find: [at(k, FIND_A), at(k, FIND_B)], check: at(k, CHECK_AT), closed: at(k, FR.closed), end: at(k, FR.end),
  };
  // the significance letters light in reading order (row by row, left to right), each one its own moment
  const sig = [];
  q.rows.forEach((row, r) => row.cells.forEach((c, j) => { if (c && c.sig) sig.push([r, j]); }));
  T.sig = new Map(sig.map(([r, j], i) => [`${r}:${j}`, lerp(at(k, SIG_A), at(k, SIG_B), sig.length > 1 ? i / (sig.length - 1) : 0)]));
  T.cF = Math.max(40, q.finding.length / Math.max(0.05, T.find[1] - T.find[0]));
  // the cells this crosstab tests: every banner cell of every row
  const cells = q.rows.reduce((a, row) => a + row.cells.length, 0);
  return { q, B, T, nR, nC, cells };
}
const PLANS = MAIN.map((_, k) => plan(k));

let el = null;

// ---------- mount ----------
export function mount(section, ctx) {
  const root = h(`<div class="qx-root"></div>`);
  const hudMark = ctx.shell.makeMark(26);
  const logo = new URL('../../img/qualtrics-logo.svg', import.meta.url).href;
  root.innerHTML = `
<div class="qx">
  <header class="qx-gh">
    <img class="qx-logo" src="${logo}" alt="Qualtrics XM"/>
    <span class="qx-gb qx-ham">${I.menu}</span>
    <span class="qx-proj"><b>${esc(DATASET.project)}</b>${I.chevronDown}</span>
    <span class="qx-gh-r"><span class="qx-gb">${I.help}</span><span class="qx-gb">${I.bell}</span><span class="qx-av">${I.dot}<span>${esc(STR.author.slice(0, 1))}</span></span><span class="qx-gb">${I.grid}</span></span>
  </header>
  <nav class="qx-pt">
    ${[Q.navSurvey, Q.navWorkflows, Q.navDist, Q.navData, Q.navResults, Q.navReports].map((s) => `<span class="qx-tab${s === Q.navData ? ' on' : ''}">${esc(s)}</span>`).join('')}
  </nav>
  <nav class="qx-st">
    ${[Q.subData, Q.subText, Q.subStats, Q.subCrosstabs, Q.subWeighting, Q.subAV].map((s) => `<span class="qx-sub${s === Q.subCrosstabs ? ' on' : ''}">${esc(s)}</span>`).join('')}
  </nav>
  <div class="qx-tb">
    <span class="qx-btn qx-xsel"><span class="qx-xsel-t">${esc(Q.newCrosstab)}</span>${I.chevronDown}</span>
    <span class="qx-lnk">${esc(Q.addFilter)}${I.chevronDown}</span>
    <span class="qx-tb-r"><span class="qx-resp">${esc(Q.responses)} <b>${fmt(DATASET.responses)}</b>${I.info}</span><span class="qx-btn2">${I.download}${esc(Q.export)}</span><span class="qx-btn2">${I.gear}${esc(Q.settings)}${I.chevronDown}</span></span>
  </div>
  <div class="qx-body">
    <aside class="qx-list">
      <div class="qx-lh"><b>${esc(STR.plan)}</b><span class="qx-live"><i></i>${esc(STR.tabbed)} <b class="qx-ln">0</b></span></div>
      <div class="qx-lday"><span class="qx-ld">${esc(DATASET.project)}</span><span class="qx-lbar"><i></i></span><b class="qx-lpc">${esc(STR.inReportOf(0, N))}</b></div>
      <div class="qx-ltop"><b class="qx-lq">0</b><small>${esc(STR.queued)}</small><span class="qx-lsub">${N} ${esc(STR.crosstabsWord)}</span></div>
      <ul class="qx-ul"></ul>
    </aside>

    <section class="qx-cfg">
      <div class="qx-box qx-box-b"><h4>${I.cols}${esc(Q.banner)}</h4><div class="qx-box-in"><span class="qx-drag">${esc(Q.dragHere)}</span></div></div>
      <div class="qx-box qx-box-s"><h4>${I.rows}${esc(Q.stub)}</h4><div class="qx-box-in"><span class="qx-drag">${esc(Q.dragHere)}</span></div></div>
      <div class="qx-box qx-box-c"><h4>${esc(Q.cells)}</h4><div class="qx-cells">${Q.cellList.map((c) => `<span class="qx-ck${Q.cellOn.includes(c) ? ' is-on' : ''}"><i>${I.check}</i>${esc(c)}</span>`).join('')}</div></div>
      <div class="qx-box qx-box-w"><h4>${esc(Q.weights)}</h4><div class="qx-sel"><span>${esc(DATASET.weightVar)}</span>${I.chevronDown}</div></div>
    </section>

    <main class="qx-cv">
      <div class="qx-view qx-v-idle">
        <div class="qx-idle"><b>${esc(STR.idleTitle)}</b><p class="qx-empty">${esc(STR.idleHint)}</p></div>
      </div>

      <div class="qx-view qx-v-act">
        <div class="qx-modal">
          <div class="qx-mh"><h2>${esc(STR.codebookTitle)}</h2><span class="qx-mcnt"><b class="qx-cn">0</b><small>${esc(STR.notesRead)}</small></span><span class="qx-mx">${I.close}</span></div>
          <div class="qx-mhead"><span class="qx-ar-q">${esc(STR.colNote)}</span><span class="qx-ar-s">${esc(STR.colSrc)}</span></div>
          <div class="qx-act-vp"><div class="qx-act-in"></div>${LEARN.length ? '' : `<p class="qx-empty qx-m-empty">${esc(STR.codebookEmpty)}</p>`}</div>
        </div>
      </div>

      <div class="qx-view qx-v-call"><div class="qx-xts"></div></div>
    </main>

    <aside class="qx-rep">
      <div class="qx-rt1"><span class="qx-rname"><small>${esc(Q.report)}</small><b>${esc(STR.report)}</b>${I.chevronDown}</span><span class="qx-menus">${Q.menus.map((m) => `<span>${esc(m)}${I.chevronDown}</span>`).join('')}</span></div>
      <div class="qx-rt2"><span class="qx-rresp">${esc(Q.responsesN(fmt(DATASET.responses)))}</span><span class="qx-saved">${esc(Q.saved)}</span><span class="qx-add">${esc(STR.addToReport)}</span></div>
      <div class="qx-rcv">
        <div class="qx-sheet qx-sheet-idle"><p class="qx-empty">${esc(STR.reportEmpty)}</p></div>
      </div>
    </aside>
  </div>
  <footer class="qx-foot">
    <span class="qx-fl"><b>${esc(DATASET.project)}</b><span class="qx-fl-s">${esc(Q.navData)}</span><i>${I.chevronRight}</i><span>${esc(Q.subCrosstabs)}</span></span>
    <span class="qx-fs"><span>${esc(STR.fTabbed)} <b class="qx-f-t">0</b> / ${N}</span><span>${esc(STR.fCells)} <b class="qx-f-c">0</b></span><span>${esc(STR.fMatched)} <b class="qx-f-m">0</b></span></span>
  </footer>

  <div class="qx-toast"><span class="qx-toast-i">${I.check}</span><span class="qx-toast-t">${esc(STR.added)}</span></div>

  <div class="qx-hud">
    <div class="qx-hud-h"><span class="qx-hud-mark"></span><span class="qx-hud-cur">${esc(STR.hud[0])}</span></div>
    <ul class="qx-hud-steps">${STEPS.map((s) => `<li><i></i>${esc(s)}</li>`).join('')}</ul>
    <div class="qx-hud-voice">
      <div class="qx-hud-lane"><b>${esc(STR.laneYou)}</b><span class="qx-hud-bars" data-l="you"></span></div>
      <div class="qx-hud-lane sb"><b>Superbot</b><span class="qx-hud-bars" data-l="sb"></span></div>
      <div class="qx-hud-mh"><span>${esc(STR.laneStyle)}</span><b class="qx-hud-ok">${I.hudCheck}matched</b></div>
      <div class="qx-hud-meter"><i></i></div>
    </div>
    <div class="qx-hud-res"><b>${esc(STR.hudLearn)}</b><div class="qx-hud-notes">${LEARN.slice(0, 2).map((r) => `<span class="qx-hud-note">${I.hudCheck}<span class="qx-hud-nt qx-fit">${esc(cutMarks(r.text))}</span></span>`).join('')}</div></div>
    <div class="qx-hud-stats"><span>tabbed <b class="qx-hs-t">0</b></span><span>cells <b class="qx-hs-c">0</b></span><span>matched <b class="qx-hs-m">0</b></span></div>
  </div>
</div>`;
  section.appendChild(root);
  $('.qx-hud-mark', root).appendChild(hudMark.el);

  // the tab plan: one row per saved crosstab, built once and placed every frame from t
  const qList = $('.qx-ul', root);
  const qRows = ROWS.map((r) => {
    const n = h(`<li class="qx-li">
      <span class="qx-li-m"><span class="qx-li-n">${esc(r.q.topic)}</span><span class="qx-li-r"><b class="qx-li-v">${esc(r.q.var)}</b><span class="qx-li-b">${esc(r.q.base)}</span></span></span>
      <em class="qx-stat s-q">${esc(STR.queued)}</em></li>`);
    qList.appendChild(n);
    return { n, r, p: $('.qx-stat', n), nm: $('.qx-li-n', n), bs: $('.qx-li-b', n) };
  });
  const qEmpty = h(`<div class="qx-lempty">${esc(STR.listEmpty)}</div>`);
  qList.appendChild(qEmpty);

  // the codebook (LEARN): the notes twice, so it has something to scroll through
  const actIn = $('.qx-act-in', root);
  const actRows = [];
  for (let rep = 0; rep < 2; rep++) for (const r of LEARN) {
    const n = h(`<div class="qx-arow"><span class="qx-ar-q qx-fit">${esc(cutMarks(r.text))}</span><span class="qx-ar-s qx-fit">${esc(srcLabel(r.src))}</span></div>`);
    actIn.appendChild(n);
    actRows.push(n);
  }
  const actPx = actRows.length * AROW_H;

  // the crosstab view: one per main crosstab (only the live one is shown), each built once
  const xts = $('.qx-xts', root);
  const docs = PLANS.map(({ q, B }, k) => {
    const n = h(`<div class="qx-xt">
      <div class="qx-qh"><small class="qx-qa">${esc(STR.questionAsks)}</small><p class="qx-qt qx-fit">${esc(Q.stubPrefix)} ${esc(q.var)}: ${esc(q.question)}</p><span class="qx-qb">${esc(STR.baseLine(q.base, fmt(q.nBase)))}</span></div>
      <div class="qx-tw">
        <table class="qx-t${B.cols.length > 4 ? ' qx-t-wide' : ''}">
          <colgroup><col class="qx-c-stub"/><col class="qx-c-n"/>${B.cols.map(() => '<col class="qx-c-n"/>').join('')}</colgroup>
          <thead>
            <tr class="qx-th1"><th class="qx-corner"></th><th colspan="${B.cols.length + 1}" class="qx-bl">${esc(B.var ? `${B.var}: ${B.label}` : B.label)}</th></tr>
            <tr class="qx-th2"><th class="qx-corner"></th><th>${esc(Q.total)}</th>${B.cols.map((c) => `<th><span class="qx-cl">${esc(c.label)}</span></th>`).join('')}</tr>
            <tr class="qx-th3"><th class="qx-corner"></th><th></th>${B.cols.map((c) => `<th>${esc(c.letter)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${q.rows.map((row) => `<tr class="qx-tr"><th rowspan="2"><span class="qx-opt">${esc(row.option)}</span></th><td>${esc(pct(row.total))}</td>${B.cols.map((c, j) => {
              const cell = row.cells[j];
              return `<td>${cell && cell.pct !== '' && cell.pct != null ? esc(pct(cell.pct)) : ''}</td>`;
            }).join('')}</tr><tr class="qx-ts"><td></td>${B.cols.map((c, j) => {
              const cell = row.cells[j];
              return `<td><span class="qx-sig">${esc(cell && cell.sig ? sigText(cell.sig) : '')}</span></td>`;
            }).join('')}</tr>`).join('')}
            <tr class="qx-tc"><th><span class="qx-opt">${esc(STR.unweighted)}</span></th><td>${esc(fmt(q.nBase))}</td>${B.cols.map((c) => `<td>${esc(fmt(c.n))}</td>`).join('')}</tr>
          </tbody>
        </table>
        <p class="qx-tnote"><span class="qx-test">${esc(q.test)}</span><span class="qx-signote">${esc(STR.sigNote)}</span></p>
      </div>
    </div>`);
    n.style.display = 'none';
    xts.appendChild(n);
    const qa = (c) => [...n.querySelectorAll(c)];
    const rowsN = qa('.qx-tr'), sigRows = qa('.qx-ts');
    const sig = [];
    sigRows.forEach((tr, r) => [...tr.querySelectorAll('.qx-sig')].forEach((s, j) => { if (s.textContent) sig.push({ n: s, key: `${r}:${j}` }); }));
    // the Columns (Banner) box offers every banner as a pill and the chosen one becomes the added variable chip; the
    // Rows (Stubs) box holds this question as its chip
    const bIn = $('.qx-box-b .qx-box-in', root), sIn = $('.qx-box-s .qx-box-in', root);
    const pillSet = h(`<span class="qx-pills">${Object.keys(BANNERS).map((key) => `<span class="qx-pill${key === q.banner ? ' is-pick' : ''}">${I.list}<span class="qx-pill-t qx-fit">${esc(BANNERS[key].label)}</span>${I.close}</span>`).join('')}</span>`);
    const stubSet = h(`<span class="qx-stubs"><span class="qx-radio">${I.radio}</span><span class="qx-pill is-pick on"><span class="qx-pill-t qx-fit">${esc(q.var)}: ${esc(q.topic)}</span>${I.close}</span></span>`);
    pillSet.style.display = 'none'; stubSet.style.display = 'none';
    bIn.appendChild(pillSet); sIn.appendChild(stubSet);
    return {
      n, k, pillSet, stubSet, pills: [...pillSet.querySelectorAll('.qx-pill')], pick: $('.qx-pill.is-pick', pillSet), qh: $('.qx-qh', n), qt: $('.qx-qt', n),
      head: qa('thead tr'), rowsN, sigRows, count: $('.qx-tc', n), note: $('.qx-tnote', n), sig,
    };
  });

  // the report: one page per main crosstab (its heading, the finding typed in, the Fed report check)
  const rcv = $('.qx-rcv', root);
  const sheets = PLANS.map(({ q }, k) => {
    const n = h(`<div class="qx-sheet">
      <h3 class="qx-sh">${esc(q.topic)}</h3>
      <div class="qx-ta"><span class="qx-ta-pills"><span>${I.plus}${esc(Q.insert)}</span><span>${esc(Q.options)}</span></span><p class="qx-find"><span class="qx-tx"></span><i class="qx-car"></i></p></div>
      <div class="qx-fc">
        <div class="qx-fc-h"><b>${esc(STR.fedCheck)}</b><em class="qx-badge">${esc(STR.checking)}</em></div>
        <div class="qx-fc-row"><span class="qx-fc-l">${esc(STR.published)}</span><b class="qx-fc-v">${esc(pct(q.published.pct))}</b><span class="qx-fc-q qx-fit">${esc(q.published.loc.split(':')[0])}</span></div>
        <p class="qx-fc-qt"></p>
        <div class="qx-fc-row"><span class="qx-fc-l">${esc(STR.crosstab)}</span><b class="qx-fc-v">${esc(pct(q.headline.pct))}</b><span class="qx-fc-q qx-fit">${esc(`${q.var} · ${q.headline.option}`)}</span></div>
      </div>
    </div>`);
    n.style.display = 'none';
    rcv.appendChild(n);
    return { n, sh: $('.qx-sh', n), ta: $('.qx-ta', n), find: $('.qx-find', n), tx: $('.qx-tx', n), car: $('.qx-car', n), fc: $('.qx-fc', n), badge: $('.qx-badge', n),
      qt: $('.qx-fc-qt', n), cands: quoteCands(q.published.quote, q.published.pct) };
  });

  // the HUD's style lanes: 26 deterministic bars each, plus the match meter
  const lane = (which) => {
    const box = $(`.qx-hud-bars[data-l="${which}"]`, root);
    const out = [];
    for (let i = 0; i < 26; i++) { const b = document.createElement('i'); box.appendChild(b); out.push(b); }
    return out;
  };
  const barsYou = lane('you'), barsSb = lane('sb');
  const YOU = Array.from({ length: 26 }, (_, i) => clamp(0.26 + 0.74 * Math.abs(Math.sin(i * 0.58 + 0.7)) * (0.52 + 0.48 * Math.abs(Math.sin(i * 0.21 + 1.3))) * (0.68 + 0.32 * rand(i + 3)), 0, 1));
  const OTHER = YOU.map((_, i) => clamp(0.24 + 0.76 * YOU[(i * 5 + 3) % 26], 0, 1));

  el = {
    root, hudMark, qx: $('.qx', root), qListEl: qList, qRows, qEmpty, lay: null,
    qlive: $('.qx-live', root), qln: $('.qx-ln', root), lq: $('.qx-lq', root), lpc: $('.qx-lpc', root), lbar: $('.qx-lbar i', root),
    drags: [...root.querySelectorAll('.qx-drag')], cfgCells: $('.qx-cells', root),
    saved: $('.qx-saved', root), boxW: $('.qx-box-w', root),
    xsel: $('.qx-xsel-t', root), add: $('.qx-add', root),
    vIdle: $('.qx-v-idle', root), vAct: $('.qx-v-act', root), vCall: $('.qx-v-call', root),
    cn: $('.qx-cn', root), actIn, actRows, actPx, actVp: $('.qx-act-vp', root),
    docs, sheets, sheetIdle: $('.qx-sheet-idle', root), toast: $('.qx-toast', root),
    fT: $('.qx-f-t', root), fC: $('.qx-f-c', root), fM: $('.qx-f-m', root),
    hud: $('.qx-hud', root), hudCur: $('.qx-hud-cur', root), hudSteps: [...root.querySelectorAll('.qx-hud-steps li')],
    hudVoice: $('.qx-hud-voice', root), hudOk: $('.qx-hud-ok', root), hudMeter: $('.qx-hud-meter i', root),
    hudRes: $('.qx-hud-res', root), resNotes: [...root.querySelectorAll('.qx-hud-note')], hudStats: $('.qx-hud-stats', root),
    hsT: $('.qx-hs-t', root), hsC: $('.qx-hs-c', root), hsM: $('.qx-hs-m', root),
    barsYou, barsSb, YOU, OTHER,
    // the static strings that are fitted at a word boundary (their full text kept aside)
    fits: [...root.querySelectorAll('.qx-fit')].map((n) => { n._src = n.textContent; return n; }),
  };
  return el;
}

// ---------- per-frame render ----------
function callState(t) {
  for (let i = 0; i < PLANS.length; i++) {
    if (t >= WINS[i][0] && t < WINS[i][1]) return { i, a: WINS[i][0], b: WINS[i][1], f: (t - WINS[i][0]) / winLen(i) };
  }
  const last = PLANS.length - 1;
  if (last >= 0 && t >= WINS[last][1]) return { i: last, a: WINS[last][0], b: WINS[last][1], f: 1 };
  return null;
}

// the counters: questions tabbed (past "queued" in the list), cells tested (every banner cell of a main crosstab once
// its letters have lit), crosstabs whose headline matches the Fed's published figure (counted as each lands in the report)
function counts(t) {
  const tabbed = ROWS.filter((r) => t >= r.tAns).length;
  const matched = ROWS.filter((r) => t >= r.tRes && matches(r.q)).length;
  let cells = 0;
  PLANS.forEach((p, k) => { if (t >= at(k, SIG_B)) cells += p.cells; });
  return { tabbed, cells, matched };
}

function renderQueue(t, waiting) {
  let live = 0;
  const cur = callState(t);
  // (the list's height can change with the boxes above it in the square and portrait stacks, so the fold is re-read)
  const cs = getComputedStyle(el.qListEl);
  el.lay.rows = Math.max(1, Math.floor((el.qListEl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) / ROW_H));
  for (const row of el.qRows) {
    const q = row.r;
    if (t < q.tIn) { row.n.style.opacity = '0'; row.n.style.transform = 'translateY(-60px)'; continue; }
    // every newer arrival pushes this row down one slot as it slides in on top (smoothly, from its own ease)
    const ease = (o) => outCubic(seg(t, o.tIn, o.tIn + 0.42));
    let pushed = 0;
    for (const o of ROWS) if (o.tIn > q.tIn) pushed += ease(o);
    const y = (pushed - (1 - ease(q))) * ROW_H;
    row.n.style.transform = `translateY(${y.toFixed(2)}px)`;
    // only the rows that fit are drawn: an older row pushed past the fold fades out as the next one slides in
    const fold = clamp(1 - (y / ROW_H - (el.lay.rows - 1)) * 2.5);
    // and the arriving row stays clear while its text would still be cut by the list's top edge
    const edge = clamp((y + 8) / 8);
    row.n.style.opacity = (seg(t, q.tIn, q.tIn + 0.26) * fold * edge).toFixed(3);
    const acc = t >= q.tAns, done = t >= q.tRes;
    const cls = done ? 's-r' : acc ? 's-t' : 's-q';
    if (row.p.className !== `qx-stat ${cls}`) row.p.className = `qx-stat ${cls}`;
    setT(row.p, done ? STR.inReport : acc ? STR.tabbed : STR.queued);
    if (!acc) {
      row.p.style.opacity = (0.55 + 0.45 * Math.abs(Math.sin((t - q.tIn) * 5.2))).toFixed(3);
      row.p.style.transform = `scale(${(1 + 0.05 * Math.abs(Math.sin((t - q.tIn) * 5.2))).toFixed(3)})`;
    } else { row.p.style.opacity = '1'; row.p.style.transform = ''; }
    // the crosstab open in the centre is the selected row
    row.n.classList.toggle('on', !!cur && q.k === cur.i && t < LAND.a);
    // the status chip's width changes with its state, so the topic is fitted per state
    fitT(row.nm, q.q.topic, cls);
    fitT(row.bs, q.q.base, cls);
    if (acc && !done) live++;
  }
  // the landed state: the tabbed chip turns into "Tab plan clear"
  const clear = t >= LAND.a;
  if (el.qlive.classList.contains('clear') !== clear) {
    el.qlive.classList.toggle('clear', clear);
    el.qlive.innerHTML = clear ? `${I.check}${esc(STR.planClear)}` : `<i></i>${esc(STR.tabbed)} <b class="qx-ln">0</b>`;
    el.qln = $('.qx-ln', el.qlive) || el.qln;
  }
  if (!clear) setT(el.qln, String(live));
  el.qlive.style.opacity = seg(t, ANSWER.a + 0.15, ANSWER.a + 0.5).toFixed(3);
  // the empty-list line clears as the FIRST crosstab lands (the list fills from its last slot, so that is the lowest tIn),
  // never under an arriving row
  const t0 = Math.min(...ROWS.map((r) => r.tIn));
  el.qEmpty.style.opacity = (1 - seg(t, t0 - 0.12, t0 + 0.02)).toFixed(3);
  setT(el.lq, String(waiting));
  const inRep = ROWS.filter((r) => t >= r.tRes).length;
  setT(el.lpc, STR.inReportOf(inRep, N));
  el.lbar.style.width = (100 * inRep / N).toFixed(1) + '%';
}

// superbot's HUD at its tallest reaches this far up from the desk's bottom edge (design px, measured over the whole
// desk clock at 16x9: its top at 673.7 screen px of 1080 at scale 1.3); a box of the config column that would reach
// into that corner (a long list of banners wraps the Columns (Banner) box onto more lines) steps aside
const HUD_REACH = 316;
function renderBoxes() {
  const box = el.boxW;
  if (!box) return;
  box.style.visibility = '';
  const top = el.qx.getBoundingClientRect().top;
  const bottom = (box.getBoundingClientRect().bottom - top) / el.lay.S;
  if (box.offsetParent && bottom > el.qx.offsetHeight - HUD_REACH) box.style.visibility = 'hidden';
}

function renderChrome(t) {
  el.root.classList.toggle('live', t >= 0.55);
  el.saved.style.opacity = PLANS.length ? outCubic(seg(t, submitAt(0) + 0.1, submitAt(0) + 0.35)).toFixed(3) : '0';
  const c = counts(t);
  setT(el.fT, fmt(c.tabbed)); setT(el.fC, fmt(c.cells)); setT(el.fM, fmt(c.matched));
  setT(el.hsT, fmt(c.tabbed)); setT(el.hsC, fmt(c.cells)); setT(el.hsM, fmt(c.matched));
}

function renderViews(t) {
  const toAct = inOutCubic(seg(t, LEARN_B.a, LEARN_B.a + 0.35));
  const fromAct = inOutCubic(seg(t, 8.45, 8.80));
  const toCall = outCubic(seg(t, ANSWER.a - 0.02, ANSWER.a + 0.28));
  const actOn = toAct * (1 - fromAct);
  const idleOn = 1 - toCall;
  el.vIdle.style.opacity = idleOn.toFixed(3);
  el.vAct.style.opacity = actOn.toFixed(3);
  el.vCall.style.opacity = toCall.toFixed(3);
  el.vIdle.style.visibility = idleOn <= 0.002 ? 'hidden' : '';
  el.vAct.style.visibility = actOn <= 0.002 ? 'hidden' : '';
  el.vCall.style.visibility = toCall <= 0.002 ? 'hidden' : '';
  // the dialog rises a little as it opens
  el.vAct.firstElementChild.style.transform = actOn >= 1 ? 'none' : `translateY(${((1 - actOn) * 14).toFixed(2)}px)`;
}

function renderLearn(t) {
  const c = outCubic(seg(t, LEARN_B.a + 0.30, 7.40));
  setT(el.cn, String(Math.round(LEARN.length * c)));
  const vpH = el.actVp.clientHeight || 300;
  const y = -lerp(0, el.actPx - vpH, c);
  el.actIn.style.transform = `translateY(${Math.min(0, y).toFixed(2)}px)`;
  // a row the scroll carries past the viewport's top or bottom edge fades out before its lines reach the edge, so no
  // line is ever drawn half cut (the mask softens the edges while the list moves)
  const ty = Math.min(0, y);
  for (let i = 0; i < el.actRows.length; i++) {
    const top = i * AROW_H + ty, bot = top + AROW_H;
    const keep = clamp(Math.min((top + 2) / 10, (vpH - bot + 2) / 10));
    const o = keep >= 1 ? '' : keep.toFixed(3);
    if (el.actRows[i].style.opacity !== o) el.actRows[i].style.opacity = o;
  }
  const fade = 26 * clamp(4 * Math.min(c, 1 - c));
  const fs = fade.toFixed(1) + 'px';
  if (el.actVp.style.getPropertyValue('--fade') !== fs) el.actVp.style.setProperty('--fade', fs);
}

const rise = (n, t, a, d = 0.24, dy = 6) => {
  const p = outCubic(seg(t, a, a + d));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? '' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
  return p;
};

function renderCall(t) {
  const c = callState(t);
  el.docs.forEach((d, k) => {
    const on = !!c && k === c.i;
    for (const n of [d.n, d.pillSet, d.stubSet]) if ((n.style.display === 'none') === on) n.style.display = on ? '' : 'none';
  });
  // the config boxes: "Drag variables here" until a crosstab is open; its Cells ticks are on while one is
  el.drags.forEach((n) => { const v = c ? 'none' : ''; if (n.style.display !== v) n.style.display = v; });
  el.cfgCells.classList.toggle('is-live', !!c);
  el.sheets.forEach((s, k) => { const on = !!c && k === c.i; if ((s.n.style.display === 'none') === on) s.n.style.display = on ? '' : 'none'; });
  el.sheetIdle.style.display = c ? 'none' : '';
  if (!c) {
    setT(el.xsel, Q.newCrosstab);
    el.toast.style.opacity = '0';
    el.add.classList.remove('done');
    return;
  }
  const P = PLANS[c.i], { q, T } = P;
  const d = el.docs[c.i], s = el.sheets[c.i];
  setT(el.xsel, `${q.var} ${q.topic}`);
  fitT(el.xsel, `${q.var} ${q.topic}`, String(c.i));

  // the question lands: its variable, the verbatim wording and the base
  rise(d.qh, t, T.q, 0.3);
  rise(d.stubSet, t, T.q, 0.3);
  // the banner selector: the pills appear in the Columns (Banner) box, the chosen banner is pressed and stays added
  d.pills.forEach((n, i) => {
    const isP = n === d.pick;
    const ap = outCubic(seg(t, T.pills + i * 0.05, T.pills + i * 0.05 + 0.22));
    n.style.opacity = ap.toFixed(3);
    const pr = isP ? press(t, T.press, 0.08, 0.10, 0.16) : 0;
    n.classList.toggle('on', isP && t >= T.press - 0.04);
    n.style.transform = pr > 0 ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : '';
  });
  // the table: its head lands with the banner, then the rows fill top to bottom, then the unweighted n row
  d.head.forEach((tr, i) => { tr.style.opacity = outCubic(seg(t, T.head + i * 0.04, T.head + i * 0.04 + 0.2)).toFixed(3); });
  d.rowsN.forEach((tr, r) => { rise(tr, t, T.rows[r], 0.2, 4); rise(d.sigRows[r], t, T.rows[r], 0.2, 4); });
  rise(d.count, t, T.count, 0.2, 4);
  rise(d.note, t, at(c.i, SIG_B), 0.25, 0);
  // the one bold thing: each significance letter lights with a short accent flash, then rests in the table's sig style
  for (const sg of d.sig) {
    const a = T.sig.get(sg.key);
    const on = t >= a;
    sg.n.classList.toggle('on', on);
    const p = outCubic(seg(t, a, a + 0.16));
    sg.n.style.opacity = on ? p.toFixed(3) : '0';
    sg.n.style.setProperty('--fl', on ? (1 - seg(t, a + 0.08, a + 0.38)).toFixed(3) : '0');
  }

  // the report page: the heading lands, the finding is typed in, then the Fed report check lands and turns Match
  rise(s.sh, t, T.find[0] - 0.12, 0.2);
  const nF = streamCount(q.finding, T.find[0], T.cF, t);
  setT(s.tx, q.finding.slice(0, nF));
  s.car.style.display = t >= T.find[0] && nF < q.finding.length ? '' : 'none';
  s.ta.style.visibility = t >= T.find[0] - 0.12 ? '' : 'hidden';
  s.ta.classList.toggle('is-sel', t >= T.find[0] - 0.12 && t < T.end);
  rise(s.fc, t, T.check, 0.22);
  const closed = t >= T.closed;
  const ok = closed && matches(q);
  setT(s.badge, closed ? (ok ? STR.match : STR.checking) : STR.checking);
  s.badge.classList.toggle('ok', ok);
  // the badge flips over (1 -> 0 -> 1 on Y) as it turns Match: the repair ticket's flip
  const fs = seg(t, T.closed - 0.11, T.closed + 0.11);
  s.badge.style.transform = `scaleY(${Math.max(0.02, Math.abs(0.5 - fs) * 2).toFixed(3)})`;
  for (const f of s.fc.querySelectorAll('.qx-fit')) if (f.offsetParent) fitT(f, f._src);
  fitQuote(s.qt, s.cands);

  // Add to report: pressed at the end of the window, then the toast confirms it
  const ep = press(t, T.end, 0.07, 0.08, 0.14);
  el.add.style.transform = ep > 0 ? `scale(${(1 - 0.06 * ep).toFixed(4)})` : '';
  el.add.classList.toggle('done', t >= T.end);
  // the report saves as each finding is added: the toolbar's save status appears after the first one
  setT(el.add, t >= T.end ? STR.added : STR.addToReport);
  const sn = outCubic(seg(t, T.end + 0.06, T.end + 0.24)) * (c.i < PLANS.length - 1 ? 1 - seg(t, c.b - 0.08, c.b) : 1);
  el.toast.style.opacity = sn.toFixed(3);
  el.toast.style.transform = `translate(-50%, ${((1 - sn) * 10).toFixed(2)}px)`;
}

// a HUD section that unfolds over [a, b] and folds over [c, d]: h drives its height; its contents (o) fade in only once
// it is open and fade out before it folds, so no line is ever drawn half clipped by the moving edge
function reveal(t, a, b, c, d) {
  const hh = inOutCubic(seg(t, a, b)) * (1 - inOutCubic(seg(t, c, d)));
  const o = seg(t, b, b + 0.14) * (1 - seg(t, c - 0.14, c));
  return { h: hh, o };
}

function renderHud(t) {
  const H = STR.hud;
  const cur = t < 1.50 ? H[0] : t < VOICE.a ? H[1] : t < 4.30 ? H[2] : t < LEARN_B.a ? H[3] : t < 8.30 ? H[4] : t < LAND.a ? H[5] : H[6];
  setT(el.hudCur, cur);
  // each step is ACTIVE (bright label, pulsing green dot) while its beat runs and ticks when the beat lands
  el.hudSteps.forEach((li, i) => {
    const done = t >= STEP_DONE[i];
    const on = !done && t >= (i === 0 ? 0 : STEP_DONE[i - 1]);
    li.classList.toggle('done', done);
    li.classList.toggle('cur', on);
    const dot = li.firstElementChild;
    if (on) {
      const b = 0.5 - 0.5 * Math.cos((t - (i === 0 ? 0 : STEP_DONE[i - 1])) * Math.PI * 2 / 1.1);
      dot.style.boxShadow = `inset 0 0 0 1.5px #34c759, 0 0 0 ${(1 + 4 * b).toFixed(2)}px rgba(52,199,89,${(0.42 * (1 - b)).toFixed(3)})`;
    } else if (dot.style.boxShadow) dot.style.boxShadow = '';
  });
  // the style panel (VOICE): no score, just "matched" with a check once the lanes agree
  const V = reveal(t, VOICE.a + 0.04, VOICE.a + 0.34, 4.40, 4.72), vo = V.h;
  el.hudVoice.style.maxHeight = (124 * vo).toFixed(1) + 'px';
  el.hudVoice.style.opacity = V.o.toFixed(3);
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
  // what superbot learned (LEARN); it folds away again once the crosstabs start, so the HUD stays small
  const R = reveal(t, 6.55, 6.85, ANSWER.a + 0.35, ANSWER.a + 0.75), ro = R.o;
  el.hudRes.style.opacity = R.o.toFixed(3);
  el.hudRes.style.maxHeight = (150 * R.h).toFixed(1) + 'px';
  el.resNotes.forEach((n, i) => {
    const p = outCubic(seg(t, 6.62 + i * 0.15, 6.62 + i * 0.15 + 0.4));
    n.style.opacity = (p * ro).toFixed(3);
    n.style.transform = p >= 1 ? 'none' : `scale(${lerp(0.96, 1, p).toFixed(3)})`;
  });
  const S = reveal(t, ANSWER.a - 0.2, ANSWER.a + 0.2, 1e6, 1e6 + 1);
  el.hudStats.style.opacity = S.o.toFixed(3);
  el.hudStats.style.maxHeight = (34 * S.h).toFixed(1) + 'px';
  el.hudMark.render(t);
}

// the desk is authored in design px and scaled up to the frame, so its type reads at the size the real screens show
// it. Narrower ratios scale less and restack (qx.css). Same factors as the call-center spot.
const UI_SCALE = (W) => (W >= 1900 ? 1.3 : W >= 1400 ? 1.2 : W >= 1000 ? 1.1 : 1.05);

function layout(W) {
  const key = `${W}|${fontState()}`;
  if (el.lay && el.lay.key === key) return el.lay;
  const S = UI_SCALE(W);
  el.qx.style.width = (W / S).toFixed(2) + 'px';
  el.qx.style.height = (1080 / S).toFixed(2) + 'px';
  el.qx.style.transform = `scale(${S})`;
  const cs = getComputedStyle(el.qListEl);
  const listH = el.qListEl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  el.lay = { key, W, S, rows: Math.max(1, Math.floor(listH / ROW_H)), padT: parseFloat(cs.paddingTop) };
  // a crosstab too tall for the table area at this ratio (six rows under a five-column banner, in the square and
  // portrait stacks) is set tighter, one step at a time, until it fits: shorter rows, then the note lines go
  for (const d of el.docs) {
    const shown = d.n.style.display;
    d.n.style.display = '';
    d.n.classList.remove('tight', 'tighter');
    const over = () => d.n.scrollHeight > d.n.clientHeight + 1;
    if (over()) d.n.classList.add('tight');
    if (over()) d.n.classList.add('tighter');
    d.n.style.display = shown;
  }
  // the same for a report page, measured with its whole finding and check in place: the Text Area's pills and the
  // heading's size give way first
  for (let k = 0; k < el.sheets.length; k++) {
    const sh = el.sheets[k], q = PLANS[k].q;
    const shown = sh.n.style.display, typed = sh.tx.textContent, quoted = sh.qt.textContent;
    sh.n.style.display = ''; sh.tx.textContent = q.finding; sh.qt.textContent = sh.cands[0];
    sh.n.classList.remove('tight');
    if (sh.n.scrollHeight > sh.n.clientHeight + 1) sh.n.classList.add('tight');
    sh.tx.textContent = typed; sh.qt.textContent = quoted; sh.qt._fitQ = null; sh.n.style.display = shown;
  }
  // the codebook viewport: as many WHOLE rows as the dialog holds
  el.actVp.style.flex = ''; el.actVp.style.height = '';
  const vpRows = Math.max(1, Math.floor(el.actVp.clientHeight / AROW_H));
  el.actVp.style.flex = 'none'; el.actVp.style.height = `${vpRows * AROW_H}px`;
  return el.lay;
}

export function render(t, W = 1920) {
  if (!el) return;
  layout(W);
  for (const n of el.fits) if (n.offsetParent) fitT(n, n._src);
  // the "queued" count is the crosstabs on the list that superbot has not tabbed yet (they land during CONNECT)
  const waiting = ROWS.filter((q) => t >= q.tIn && t < q.tAns).length;
  renderChrome(t);
  renderViews(t);
  renderQueue(t, waiting);
  renderLearn(t);
  renderCall(t);
  renderBoxes();
  renderHud(t);
}

export default { id: 'qx', DUR, mount, render };

// phrase.js: the Phrase TMS translator desk (the CAT web editor with its job queue), and the four beats superbot
// works on it. It is one DOM tree built at mount and then driven purely from local time t (?t=<s> reproduces any
// frame), so the spot is seek-safe at every ratio. The chrome (editor top bar, job bar, toolbar, segment grid with
// # / source / target / status columns, CAT pane, status bar) is rebuilt in HTML from reference screenshots of
// Phrase TMS kept outside the repo in /tmp/phraseref-e60f1bcc (see phrase.css for the sampled tokens and which file
// each came from). The motion is the call-center spot's (e360.js) beat for beat, as the lawyer spot kept it: every
// window, WINS, FR fraction, queue timing and HUD rule is unchanged; only what the desk shows is a translator's
// work. One real Phrase logo sits in the chrome (../../img/phrase-logo.svg, see ../../img/CREDITS.txt).
// All translation content comes from phrase-data.js, where each record carries its source.
import { clamp, lerp, seg, outCubic, inOutCubic, rand, press, esc, streamCount } from '../../lib.js';
import { I, PAIR, STEPS, JOBS, MAIN, TERMS, RULES } from './phrase-data.js';

const NB = ' ';

// ---------- the desk's own clock (seconds, local to the desk layer): the call-center spot's, unchanged ----------
export const DUR = 18.40;
const CONNECT = { a: 0.00, b: 2.10 };
const VOICE = { a: 2.10, b: 4.60 };
const LEARN = { a: 4.60, b: 8.60 };
const ANSWER = { a: 8.60, b: 16.10 };
const LAND = { a: 16.10, b: DUR };

// the three jobs the editor works through, start to end
const WINS = [[8.90, 11.60], [11.60, 14.00], [14.00, 16.10]];
// where each step of a job lands inside its window, as a fraction of it: the segments load (prob), the first
// target starts (cause), the last segment is confirmed by `closed`, and Complete is pressed just before it
const FR = { prob: 0.04, cause: 0.12, sol: 0.20, turn1: 0.24, turn2: 0.36, closed: 0.80, end: 0.88 };
const ROW_H = 40;               // one job row in the queue
const AROW_H = 52;              // one style-guide row (phrase.css .ph-arow)
const STEP_DONE = [1.75, 4.35, 8.35, 16.15];
const QWAIT_IN = { a: 0.70, b: 1.70 };
const N_JOBS = JOBS.length;

const $ = (s, root) => root.querySelector(s);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const setT = (n, s) => { if (n && n.textContent !== s) n.textContent = s; };
const fmt = (n) => Number(n).toLocaleString('en-US');
// Text that does not fit its box is cut at a WORD boundary and ends in an ellipsis, instead of the browser's
// mid-word text-overflow cut. Works for single-line (nowrap) boxes and -webkit-line-clamp boxes alike. The fit is
// cached per text, frame width and font state; a box that is not laid out yet (display: none) is fitted the first
// frame it is.
const fontState = () => (document.fonts ? document.fonts.status : 'loaded');
const cutAt = (w, m) => w.slice(0, m).join(' ').replace(/[\s,;:(·\-¿¡]+$/, '') + '…';
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
  if (over() && !/\s/.test(s)) {
    // one word (a file name): cut its middle and keep the extension, "22-088_EEOC_Know….pdf"
    const ext = (s.match(/\.[A-Za-z0-9]{2,5}$/) || [''])[0], stem = s.slice(0, s.length - ext.length);
    let lo = 1, hi = stem.length - 1, best = 1;
    while (lo <= hi) { const m = (lo + hi) >> 1; n.textContent = stem.slice(0, m) + '…' + ext; if (over()) hi = m - 1; else { best = m; lo = m + 1; } }
    n.textContent = stem.slice(0, best) + '…' + ext;
  } else if (over()) {
    const w = s.split(' ');
    let lo = 1, hi = w.length - 1, best = 1;
    while (lo <= hi) { const m = (lo + hi) >> 1; n.textContent = cutAt(w, m); if (over()) hi = m - 1; else { best = m; lo = m + 1; } }
    n.textContent = cutAt(w, best);
  }
  n._fit = key; n._fitOut = n.textContent;
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
// a source segment as HTML, its term base hits marked the way Phrase marks them in the source column (R1: a
// yellow ground). A glossary headword is matched as written (its parenthetical dropped, a plural allowed), else by
// its first word ("refund of tax" marks "refund")
const reEsc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function termSpan(en, t) {
  const base = t.en.replace(/\s*\(.*?\)\s*/g, ' ').trim();
  for (const w of [base, base.split(' ')[0]]) {
    const m = new RegExp(`\\b${reEsc(w)}(s|’s|s’)?\\b`, 'i').exec(en);
    if (m) return [m.index, m.index + m[0].length];
  }
  return null;
}
function markTerms(en, tb) {
  const spans = [];
  for (const i of tb || []) {
    const t = TERMS[i]; if (!t || !t.en) continue;
    const sp = termSpan(en, t);
    if (sp && !spans.some(([a, b]) => sp[0] < b && sp[1] > a)) spans.push(sp);
  }
  spans.sort((a, b) => a[0] - b[0]);
  let out = '', at = 0;
  for (const [a, b] of spans) { out += esc(en.slice(at, a)) + `<mark class="ph-tbm">${esc(en.slice(a, b))}</mark>`; at = b; }
  return out + esc(en.slice(at));
}
// a target with its QA fix applied (the corrected part marked), as HTML
const fixedHTML = (s) => { const i = s.es.indexOf(s.qa.from); return esc(s.es.slice(0, i)) + `<mark class="ph-fx">${esc(s.qa.to)}</mark>` + esc(s.es.slice(i + s.qa.from.length)); };
const fixedText = (s) => (s.qa ? s.es.replace(s.qa.from, s.qa.to) : s.es);
const words = (j) => (j && j.words ? j.words : 0);
// the job line under a file name: agency and word count (a count the source does not give is left out)
const jobSub = (j) => [j.agency, j.words ? `${fmt(j.words)}${NB}words` : ''].filter(Boolean).join(' · ');
// the style rules' short forms, lifted into the HUD on the LEARN beat
const REQUIREMENTS = RULES.slice(0, 4).map((r) => r.chip || r.gloss || r.section);
const uniq = (a) => [...new Set(a.filter(Boolean))];

let el = null;

// ---------- mount ----------
export function mount(section, ctx) {
  const asset = (n) => new URL(`../../img/${n}`, import.meta.url).href;
  const root = h(`<div class="ph-root"></div>`);
  const hudMark = ctx.shell.makeMark(26);
  // the editor toolbar, left to right as the CAT web editor's toolbar reads (ref-A in phrase.css): text formatting,
  // segment tools, confirm, then undo / redo
  const TOOLS = [['bold', ''], ['italic', ''], ['underline', ''], ['sub', ''], ['sup', ''], null,
    ['copySrc', ''], ['join', ''], ['split', ''], null, ['checkC', ''], ['tag', ''], ['qa', ''], null, ['search', ''], ['pilcrow', ''], null, ['undo', ''], ['redo', '']];
  const tbSources = uniq(TERMS.map((t) => t.sourceShort || t.source));
  const ruleSources = uniq(RULES.map((r) => r.sourceShort || r.source));
  const RAIL = ['cat', 'search', 'spell', 'doc', 'globe', 'comment', 'flag'];
  root.innerHTML = `
<div class="ph">
  <header class="ph-top">
    <span class="ph-menu">${I.menu}</span>
    <span class="ph-app-ic"><img src="${asset('phrase-app-icon.svg')}" alt="Phrase"/></span>
    <span class="ph-crumb"><span class="ph-crumb-p">Jobs</span><i>/</i><b class="ph-crumb-j">No job open</b></span>
    <span class="ph-wf">Translation</span>
    <div class="ph-topr">
      <span class="ph-st">No job ${I.chevron}</span>
      <span class="ph-res"><span><i></i>TM</span><span><i></i>TB</span><span><i></i>MT</span></span>
      <span class="ph-tico ph-bell">${I.bell}<i class="ph-bell-n">0</i></span>
      <span class="ph-av">S</span>
    </div>
  </header>
  <div class="ph-frame">
    <aside class="ph-q">
      <div class="ph-q-h">Jobs <span class="ph-q-live"><i></i>Translating <b class="ph-q-ln">0</b></span></div>
      <div class="ph-q-top"><small>Overall progress</small><b class="ph-q-pc">0%</b><span class="ph-q-bar"><i></i></span></div>
      <div class="ph-q-top2"><b class="ph-q-n">0</b><small>new</small><span class="ph-q-sub">translated in your style</span></div>
      <div class="ph-q-cols"><span>File</span><span>Status</span></div>
      <ul class="ph-q-list"></ul>
    </aside>

    <div class="ph-ed">
      <nav class="ph-tb">${TOOLS.map((x) => (x ? `<span class="ph-tool">${I[x[0]]}</span>` : '<i class="ph-tsep"></i>')).join('')}</nav>
      <div class="ph-flt"><span class="ph-flt-ic">${I.sliders}</span><span class="ph-in">${I.search}Filter source (${esc(PAIR.src)})</span><span class="ph-in">${I.search}Filter target (${esc(PAIR.tgt)})</span><span class="ph-flt-c">Clear filter</span></div>

      <section class="ph-main">
        <div class="ph-view ph-v-idle">
          <div class="ph-card ph-res-c">
            <div class="ph-ch"><b>Term bases</b><small class="ph-ch-r">${TERMS.length}${NB}terms</small></div>
            ${tbSources.map((s) => `<div class="ph-ri">${I.book}<span class="ph-ri-n ph-fit">${esc(s)}</span><small>${TERMS.filter((t) => (t.sourceShort || t.source) === s).length}</small></div>`).join('')}
          </div>
          <div class="ph-card ph-res-c">
            <div class="ph-ch"><b>Reference files</b><small class="ph-ch-r">Style guides</small></div>
            ${ruleSources.map((s) => `<div class="ph-ri">${I.doc}<span class="ph-ri-n ph-fit">${esc(s)}</span><small>${RULES.filter((r) => (r.sourceShort || r.source) === s).length}</small></div>`).join('')}
          </div>
          <div class="ph-card ph-idle-empty">
            <b>No job open</b>
            <p>Accepted jobs open here, segment by segment.</p>
          </div>
        </div>

        <div class="ph-view ph-v-act">
          <div class="ph-act-h"><h4>Style guides</h4><small class="ph-act-sub">Reference files</small>
            <span class="ph-cnt"><b class="ph-cn">0</b><small>rules read</small></span>
          </div>
          <div class="ph-act-head"><span class="ph-ar-s">Source</span><span class="ph-ar-q">Rule</span><span class="ph-ar-g">In English</span></div>
          <div class="ph-act-vp"><div class="ph-act-in"></div></div>
          <div class="ph-tbase">
            <div class="ph-act-h"><h4>Term base</h4><span class="ph-cnt"><b class="ph-tn">0</b><small>terms</small></span></div>
            <div class="ph-act-head ph-tbr"><span>${esc(PAIR.src)}</span><span>${esc(PAIR.tgt)}</span><span>Source</span></div>
            <div class="ph-tbase-list"></div>
          </div>
        </div>

        <div class="ph-view ph-v-call">
          <div class="ph-grid-vp"><div class="ph-grid"></div></div>
        </div>
      </section>

      <section class="ph-pv">
        <div class="ph-pv-tabs"><span class="ph-pv-t">${I.info}Context note</span><span class="ph-pv-t on">${I.preview}Preview</span></div>
        <div class="ph-pv-page"><div class="ph-pv-empty">Open a job to preview its target document</div><div class="ph-pv-tog"><span>Source</span><span class="on">Target</span></div><div class="ph-pv-doc"><div class="ph-pv-body"></div></div></div>
      </section>

      <footer class="ph-foot">
        <b>Confirmed</b>
        <span class="ph-fc">segments <b class="ph-fc-s">0</b></span><i>·</i>
        <span class="ph-fc">jobs <b class="ph-fc-j">0</b> / ${N_JOBS}</span><i>·</i>
        <span class="ph-fc">words <b class="ph-fc-w">0</b></span>
        <span class="ph-foot-r">superbot working as you</span>
      </footer>
    </div>

    <aside class="ph-cat">
      <div class="ph-cat-h"><b>CAT</b><small class="ph-cat-seg"></small></div>
      <div class="ph-cat-sum"></div>
      <div class="ph-cat-list"></div>
      <div class="ph-cat-empty">Matches for the active segment appear here</div>
      <div class="ph-qa"><div class="ph-qa-h"><b>QA</b><i>·</i><em class="ph-qa-n">0 warnings</em><small class="ph-qa-seg"></small></div>
        <div class="ph-qa-w"><span class="ph-qa-fx"><s class="ph-qa-from"></s>${I.arrow}<b class="ph-qa-to"></b></span></div>
        <p class="ph-qa-q"></p><p class="ph-qa-r"></p><small class="ph-qa-s"></small>
        <ul class="ph-qa-list">${RULES.map((r) => `<li><i class="ph-qa-ic">${I.check}</i><span class="ph-fit">${esc(r.chip)}</span></li>`).join('')}</ul></div>
    </aside>
    <nav class="ph-rail">${RAIL.map((k, i) => `<span class="ph-rail-i${i === 0 ? ' on' : ''}">${I[k]}</span>`).join('')}</nav>
  </div>

  <div class="ph-hud">
    <div class="ph-hud-h"><span class="ph-hud-mark"></span><span class="ph-hud-cur">Opening your jobs in Phrase</span></div>
    <ul class="ph-hud-steps">${STEPS.map((s) => `<li><i></i>${esc(s)}</li>`).join('')}</ul>
    <div class="ph-hud-voice">
      <div class="ph-hud-lane"><b>Your translations</b><span class="ph-hud-bars" data-l="you"></span></div>
      <div class="ph-hud-lane sb"><b>Superbot</b><span class="ph-hud-bars" data-l="sb"></span></div>
      <div class="ph-hud-mh"><span>Translation style</span><b class="ph-hud-ok">${I.check}matched</b></div>
      <div class="ph-hud-meter"><i></i></div>
    </div>
    <div class="ph-hud-res"><b>What your style guides require</b><div class="ph-hud-chips"></div></div>
    <div class="ph-hud-stats"><span>confirmed <b class="ph-hs-s">0</b></span><span>completed <b class="ph-hs-j">0</b></span><span>words <b class="ph-hs-w">0</b></span></div>
  </div>
</div>`;
  section.appendChild(root);
  $('.ph-hud-mark', root).appendChild(hudMark.el);

  // the job queue: one row per job, built once and placed every frame from t
  const qList = $('.ph-q-list', root);
  const qRows = JOBS.map((q) => {
    const n = h(`<li class="ph-qi">
      <span class="ph-qi-ic">${I.doc}</span>
      <span class="ph-qi-m"><span class="ph-qi-n">${esc(q.fileName)}</span><span class="ph-qi-r">${esc(jobSub(q))}</span></span>
      <em class="ph-qi-p s-new"><i></i>${I.check}<span class="ph-pl">New</span></em></li>`);
    qList.appendChild(n);
    return { n, q, p: $('.ph-qi-p', n), r: $('.ph-qi-r', n), nm: $('.ph-qi-n', n), pl: $('.ph-pl', n) };
  });
  const qEmpty = h(`<div class="ph-q-empty">Connected. New jobs land here.</div>`);
  qList.appendChild(qEmpty);

  // the style-guide list (LEARN): the rules twice, so it has something to scroll through
  const actIn = $('.ph-act-in', root);
  const actRows = [];
  for (let rep = 0; rep < 2; rep++) for (const r of RULES) {
    const n = h(`<div class="ph-arow">
      <span class="ph-ar-s"><b class="ph-fit">${esc(r.sourceShort || r.source)}</b><small class="ph-fit">${esc(r.section)}</small></span>
      <span class="ph-ar-q ph-fit">${esc(r.quote)}</span><span class="ph-ar-g ph-fit">${esc(r.gloss)}</span></div>`);
    actIn.appendChild(n);
    actRows.push(n);
  }
  const actPx = actRows.length * AROW_H;
  // the term base entries, shown briefly under the rules
  const tbList = $('.ph-tbase-list', root);
  const tbRows = TERMS.map((t) => {
    const n = h(`<div class="ph-tbr"><span class="ph-fit">${esc(t.en)}</span><span class="ph-fit">${esc(t.es)}</span><span class="ph-fit">${esc(t.sourceShort || t.source)}</span></div>`);
    tbList.appendChild(n);
    return n;
  });

  // the segment grid: one set of rows per main job (only the live job's set is shown)
  const grid = $('.ph-grid', root);
  const segRows = MAIN.map((m, mi) => m.segs.map((s, k) => {
    const n = h(`<div class="ph-seg">
      <span class="ph-sn">${k + 1}</span>
      <div class="ph-src"><p>${markTerms(s.en, s.tb)}</p></div>
      <div class="ph-tgt"><p><span class="ph-tv"></span><i class="ph-tcar"></i><span class="ph-th">${esc(s.es)}</span></p></div>
      <span class="ph-okc"><span class="ph-ok">${I.check}</span></span>
      <em class="ph-mb${s.tm ? ' k-tm' : ''}">${s.tm ? esc(String(s.tm.score)) : ''}</em>
      <span class="ph-ics">${I.lock}</span><span class="ph-ics">${I.flag}</span><span class="ph-ics">${I.comment}</span></div>`);
    n.style.display = 'none';
    grid.appendChild(n);
    return { n, s, mi, k, tv: $('.ph-tv', n), th: $('.ph-th', n), car: $('.ph-tcar', n), ok: $('.ph-ok', n), mb: $('.ph-mb', n) };
  }));

  // the Preview pane (target): the confirmed segments of the open job, as the translated document reads
  const pvBody = $('.ph-pv-body', root);
  const pvParas = MAIN.map((m) => m.segs.map((s, k) => {
    const n = h(`<p${k === 0 ? ' class="ph-pv-h"' : ''}>${esc(fixedText(s))}</p>`);
    n.style.display = 'none';
    pvBody.appendChild(n);
    return n;
  }));

  // the CAT pane: one set per job, holding every match the job's segments have: the TM match (when the source
  // records one) and each term base entry the job hits, with the segments it hits. Every frame the active
  // segment's own matches are lifted to the top at full strength; the job's other term base entries stay listed
  // under them, dimmed, so the pane is never blank while a job is open.
  const catList = $('.ph-cat-list', root);
  // "PDF p." because content.json records 1-based PDF page indexes, not the printed folios
  const pg = (p) => (p != null ? `, PDF p. ${p}` : '');
  const catSets = MAIN.map((m) => {
    const ents = [];
    m.segs.forEach((s, k) => {
      if (s.tm) ents.push({ tm: s.tm, hits: new Set([k]) });
      for (const i of s.tb || []) {
        if (!TERMS[i]) continue;
        let e = ents.find((x) => x.tb === i);
        if (!e) { e = { tb: i, hits: new Set() }; ents.push(e); }
        e.hits.add(k);
      }
    });
    // R1's row: number | source | coloured match cell | target, the resource it came from under the target
    const row = (src, k, cls, tgt, from) => h(`<div class="ph-cr"><span class="ph-cr-n"></span><span class="ph-cr-s"><span class="ph-fit">${esc(src)}</span></span>
      <span class="ph-cr-k ${cls}">${esc(k)}</span><span class="ph-cr-g"><span class="ph-fit">${esc(tgt)}</span><small class="ph-fit">${esc(from)}</small></span></div>`);
    const set = h('<div class="ph-cat-set"></div>');
    const lab = h('<div class="ph-cat-lab"></div>');
    set.appendChild(lab);
    const rows = ents.map((e) => {
      const t = e.tm ? null : TERMS[e.tb];
      const n = e.tm ? row(e.tm.en, String(e.tm.score), 'k-tm', e.tm.es, `TM: ${e.tm.from}${pg(e.tm.page)}`)
        : row(t.en, 'TB', 'k-tb', t.es, `${t.sourceShort || t.source}${pg(t.page)}`);
      set.appendChild(n);
      return { n, e, no: $('.ph-cr-n', n) };
    });
    set.style.display = 'none';
    catList.appendChild(set);
    return { set, lab, rows };
  });

  // the HUD's style lanes: 26 deterministic bars each, plus the match meter
  const lane = (which) => {
    const box = $(`.ph-hud-bars[data-l="${which}"]`, root);
    const out = [];
    for (let i = 0; i < 26; i++) { const b = document.createElement('i'); box.appendChild(b); out.push(b); }
    return out;
  };
  const barsYou = lane('you'), barsSb = lane('sb');
  const YOU = Array.from({ length: 26 }, (_, i) => clamp(0.26 + 0.74 * Math.abs(Math.sin(i * 0.58 + 0.7)) * (0.52 + 0.48 * Math.abs(Math.sin(i * 0.21 + 1.3))) * (0.68 + 0.32 * rand(i + 3)), 0, 1));
  const OTHER = YOU.map((_, i) => clamp(0.24 + 0.76 * YOU[(i * 5 + 3) % 26], 0, 1));

  const chipBox = $('.ph-hud-chips', root);
  const resChips = REQUIREMENTS.map((r) => {
    const n = h(`<span class="ph-hud-chip">${I.check}${esc(r)}</span>`);
    chipBox.appendChild(n);
    return n;
  });

  el = {
    root, hudMark, st: $('.ph-st', root), av: $('.ph-av', root), qpc: $('.ph-q-pc', root), qbar: $('.ph-q-bar i', root),
    belln: $('.ph-bell-n', root), qn: $('.ph-q-n', root),
    fcs: $('.ph-fc-s', root), fcj: $('.ph-fc-j', root), fcw: $('.ph-fc-w', root),
    qlive: $('.ph-q-live', root), qln: $('.ph-q-ln', root), qEmpty, qRows,
    cn: $('.ph-cn', root), tn: $('.ph-tn', root), actIn, actRows, actPx, tbRows, tbList,
    vIdle: $('.ph-v-idle', root), vAct: $('.ph-v-act', root), vCall: $('.ph-v-call', root),
    crumbJ: $('.ph-crumb-j', root), pvEmpty: $('.ph-pv-empty', root), pvBody: $('.ph-pv-body', root), pvParas,
    gridVp: $('.ph-grid-vp', root), grid, segRows,
    cat: $('.ph-cat', root), catBox: $('.ph-cat-list', root), catSeg: $('.ph-cat-seg', root), catSets, catEmpty: $('.ph-cat-empty', root),
    catSum: $('.ph-cat-sum', root), qaSeg: $('.ph-qa-seg', root), qaQ: $('.ph-qa-q', root), qaLis: [...root.querySelectorAll('.ph-qa-list li')],
    qa: $('.ph-qa', root), qaN: $('.ph-qa-n', root), qaR: $('.ph-qa-r', root), qaS: $('.ph-qa-s', root), qaW: $('.ph-qa-w', root), qaFrom: $('.ph-qa-from', root), qaTo: $('.ph-qa-to', root),
    hud: $('.ph-hud', root), hudCur: $('.ph-hud-cur', root), hudSteps: [...root.querySelectorAll('.ph-hud-steps li')],
    hudVoice: $('.ph-hud-voice', root), hudOk: $('.ph-hud-ok', root), hudMeter: $('.ph-hud-meter i', root),
    hudRes: $('.ph-hud-res', root), resChips, hudStats: $('.ph-hud-stats', root),
    hsS: $('.ph-hs-s', root), hsJ: $('.ph-hs-j', root), hsW: $('.ph-hs-w', root),
    barsYou, barsSb, YOU, OTHER, ph: $('.ph', root), qListEl: qList, lay: null,
    actVp: $('.ph-act-vp', root),
    // the static strings that are fitted at a word boundary (their full text kept aside)
    fits: [...root.querySelectorAll('.ph-fit')].map((n) => { n._src = n.textContent; return n; }),
  };
  return el;
}

// ---------- per-frame render ----------
function callState(t) {
  for (let i = 0; i < WINS.length; i++) {
    if (t >= WINS[i][0] && t < WINS[i][1]) return { i, c: MAIN[i], a: WINS[i][0], b: WINS[i][1], f: (t - WINS[i][0]) / (WINS[i][1] - WINS[i][0]) };
  }
  if (t >= WINS[2][1]) return { i: 2, c: MAIN[2], a: WINS[2][0], b: WINS[2][1], f: 1 };
  return null;
}
const st = (c, k) => c.a + FR[k] * (c.b - c.a);
// segment k of a job: its target is typed over the first 78% of its slot and it is confirmed at the slot's end;
// the slots split [cause, closed - 0.06] evenly, so the last segment is confirmed just before the job completes
function segTimes(c, k, n) {
  const a = st(c, 'cause'), z = st(c, 'closed') - 0.06, slot = (z - a) / n;
  return { a: a + k * slot, typed: a + k * slot + 0.66 * slot, fix: a + k * slot + 0.8 * slot, ok: a + (k + 1) * slot };
}

function renderQueue(t, waiting) {
  let live = 0;
  for (const row of el.qRows) {
    const q = row.q;
    if (t < q.tIn) { row.n.style.opacity = '0'; row.n.style.transform = 'translateY(-60px)'; continue; }
    // every newer arrival pushes this row down one slot as it slides in on top (smoothly, from its own ease)
    const ease = (o) => outCubic(seg(t, o.tIn, o.tIn + 0.42));
    let pushed = 0;
    for (const o of JOBS) if (o.tIn > q.tIn) pushed += ease(o);
    const y = (pushed - (1 - ease(q))) * ROW_H;
    row.n.style.transform = `translateY(${y.toFixed(2)}px)`;
    // only the rows that fit are drawn: an older row pushed past the fold fades out as the next one slides in
    const fold = clamp(1 - (y / ROW_H - (el.lay.rows - 1)) * 2.5);
    // and the arriving row stays clear while its text would still be cut by the list's top edge
    const edge = clamp((y + el.lay.padT + 8) / 12);
    row.n.style.opacity = (seg(t, q.tIn, q.tIn + 0.26) * fold * edge).toFixed(3);
    const acc = t >= q.tAns, done = t >= q.tRes;
    const cls = done ? 's-done' : acc ? 's-acc' : 's-new';
    if (row.p.className !== `ph-qi-p ${cls}`) row.p.className = `ph-qi-p ${cls}`;
    // Phrase's job statuses: New, then Accepted once the linguist takes it, then Completed
    setT(row.pl, done ? 'Completed' : acc ? 'Accepted' : 'New');
    if (!acc) {
      row.p.style.opacity = (0.55 + 0.45 * Math.abs(Math.sin((t - q.tIn) * 5.2))).toFixed(3);
      row.p.style.transform = `scale(${(1 + 0.05 * Math.abs(Math.sin((t - q.tIn) * 5.2))).toFixed(3)})`;
    } else { row.p.style.opacity = '1'; row.p.style.transform = ''; }
    // (the pill's width changes with its state, so the two text lines are fitted per state)
    fitT(row.nm, q.fileName, cls);
    fitT(row.r, jobSub(q), cls);
    if (acc && !done) live++;
  }
  setT(el.qln, String(live));
  // the landed state: the translating chip turns into "Queue clear"
  const clear = t >= LAND.a;
  if (el.qlive.classList.contains('clear') !== clear) {
    el.qlive.classList.toggle('clear', clear);
    el.qlive.innerHTML = clear ? `${I.check}Queue clear` : '<i></i>Translating <b class="ph-q-ln">0</b>';
    el.qln = $('.ph-q-ln', el.qlive) || el.qln;
    if (!clear) setT(el.qln, String(live));
  }
  el.qlive.style.opacity = seg(t, ANSWER.a + 0.15, ANSWER.a + 0.5).toFixed(3);
  el.qEmpty.style.opacity = (1 - seg(t, JOBS[0].tIn, JOBS[0].tIn + 0.3)).toFixed(3);
  setT(el.qn, String(waiting));
  setT(el.belln, String(waiting));
  el.belln.style.opacity = waiting > 0 ? '1' : '0';
}

// the counters: segments confirmed in the editor, jobs completed, and the words of the completed jobs
function counts(t) {
  let segs = 0;
  WINS.forEach((w, i) => {
    const c = { a: w[0], b: w[1] }, n = MAIN[i].segs.length;
    for (let k = 0; k < n; k++) if (t >= segTimes(c, k, n).ok) segs++;
  });
  const done = JOBS.filter((q) => t >= q.tRes);
  return { segs, jobs: done.length, words: done.reduce((s, q) => s + words(q), 0) };
}

function renderChrome(t) {
  const on = t >= 0.55;
  el.root.classList.toggle('live', on);
  const av = outCubic(seg(t, 0.55, 1.0));
  el.av.style.opacity = (0.35 + 0.65 * av).toFixed(3);
  const c = counts(t);
  setT(el.fcs, fmt(c.segs)); setT(el.fcj, fmt(c.jobs)); setT(el.fcw, fmt(c.words));
  setT(el.hsS, fmt(c.segs)); setT(el.hsJ, fmt(c.jobs)); setT(el.hsW, fmt(c.words));
}

function renderHeader(t) {
  const c = callState(t);
  const v = c ? c.c : null;
  fitT(el.crumbJ, v ? v.fileName : 'No job open');
  // the job status pill (top right): Accepted while superbot works the job, Completed once its last segment is
  // confirmed; it dips as it is set
  const done = c && t >= st(c, 'closed');
  const lab = !c ? 'No job' : done ? 'Completed' : 'Accepted';
  if (el.st.firstChild.textContent !== lab + ' ') el.st.firstChild.textContent = lab + ' ';
  el.st.classList.toggle('done', !!done);
  el.st.classList.toggle('off', !c);
  const ep = c ? press(t, st(c, 'closed'), 0.07, 0.08, 0.14) : 0;
  el.st.style.transform = `scale(${(1 - 0.06 * ep).toFixed(4)})`;
  // overall progress of the queue: the share of the jobs completed
  const pc = JOBS.filter((q) => t >= q.tRes).length / N_JOBS;
  setT(el.qpc, `${Math.round(100 * pc)}%`);
  el.qbar.style.width = (100 * pc).toFixed(1) + '%';
}

function renderViews(t) {
  const toAct = inOutCubic(seg(t, LEARN.a, LEARN.a + 0.35));
  const fromAct = inOutCubic(seg(t, 8.45, 8.80));
  const toCall = outCubic(seg(t, ANSWER.a - 0.02, ANSWER.a + 0.28));
  const actOn = toAct * (1 - fromAct);
  const idleOn = (1 - toAct) * (1 - toCall);
  el.vIdle.style.opacity = idleOn.toFixed(3);
  el.vAct.style.opacity = actOn.toFixed(3);
  el.vCall.style.opacity = toCall.toFixed(3);
  el.vIdle.style.visibility = idleOn <= 0.002 ? 'hidden' : '';
  el.vAct.style.visibility = actOn <= 0.002 ? 'hidden' : '';
  el.vCall.style.visibility = toCall <= 0.002 ? 'hidden' : '';
}

function renderLearn(t) {
  const c = outCubic(seg(t, LEARN.a + 0.30, 7.40));
  setT(el.cn, String(Math.round(RULES.length * c)));
  const vpH = el.actVp.clientHeight || 300;
  const y = -lerp(0, el.actPx - vpH, c);
  el.actIn.style.transform = `translateY(${Math.min(0, y).toFixed(2)}px)`;
  const fade = 26 * clamp(4 * Math.min(c, 1 - c));
  const fs = fade.toFixed(1) + 'px';
  if (el.actVp.style.getPropertyValue('--fade') !== fs) el.actVp.style.setProperty('--fade', fs);
  // the term base entries land one after another while the rules scroll
  let shown = 0;
  el.tbRows.forEach((n, i) => {
    const p = outCubic(seg(t, 5.2 + i * 0.16, 5.2 + i * 0.16 + 0.35));
    n.style.opacity = p.toFixed(3);
    n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 6).toFixed(2)}px)`;
    if (p > 0.5) shown++;
  });
  setT(el.tn, String(shown));
  wholeRows(el.tbRows.map((n) => ({ n, want: true })), el.tbList);
}

function renderCall(t) {
  const c = callState(t);
  // the grid: the live job's rows only
  el.segRows.forEach((set, mi) => set.forEach((r) => { const on = !!c && mi === c.i; if ((r.n.style.display === 'none') === on) r.n.style.display = on ? '' : 'none'; }));
  el.catSets.forEach((x, mi) => { if (!(c && mi === c.i) && x.set.style.display !== 'none') x.set.style.display = 'none'; });
  // the Preview: the open job's Spanish title, then each segment's target once it is confirmed
  el.pvParas.forEach((set, mi) => set.forEach((n, k) => {
    const on = !!c && mi === c.i && t >= segTimes(c, k, set.length).ok;
    if ((n.style.display === 'none') === on) n.style.display = on ? '' : 'none';
    if (on) n.style.opacity = outCubic(seg(t, segTimes(c, k, set.length).ok, segTimes(c, k, set.length).ok + 0.25)).toFixed(3);
  }));
  el.pvEmpty.style.opacity = c ? '0' : '1';
  // the preview page scrolls so the newest paragraph stays in view
  const pb = el.pvBody.parentNode, pvH = pb.parentNode.clientHeight;
  const over = Math.max(0, pb.scrollHeight - pvH + 10);
  pb.style.transform = `translateY(${(-over).toFixed(1)}px)`;
  // a paragraph the scroll pushes past the page's top edge fades out before its lines reach the edge, so no line
  // is ever drawn half cut
  el.pvParas.forEach((set) => set.forEach((n) => {
    if (n.style.display === 'none') return;
    const top = n.offsetTop - over;
    const keep = clamp((top - 2) / 8);
    if (keep < 1) n.style.opacity = (Math.min(+n.style.opacity || 1, keep)).toFixed(3);
    n.style.visibility = keep <= 0 ? 'hidden' : '';
  }));
  if (!c) {
    el.catEmpty.style.opacity = '1';
    setT(el.catSeg, ''); setT(el.catSum, '');
    el.qa.style.opacity = '0';
    el.qa.classList.remove('warn', 'fixed');
    return;
  }
  const rows = el.segRows[c.i], n = rows.length;
  const load = outCubic(seg(t, st(c, 'prob'), st(c, 'prob') + 0.3));
  let act = -1;
  rows.forEach((r, k) => {
    const T = segTimes(c, k, n);
    // the rows land as the job opens (source filled, target empty)
    const pr = outCubic(seg(t, c.a + k * 0.03, c.a + k * 0.03 + 0.3));
    r.n.style.opacity = pr.toFixed(3);
    r.n.style.transform = pr >= 1 ? 'none' : `translateY(${((1 - pr) * 8).toFixed(2)}px)`;
    // the target is typed in (the rest of it sits in the row, transparent, so the row keeps its height)
    const es = r.s.es;
    const cps = Math.max(40, es.length / Math.max(0.05, T.typed - T.a));
    r.n.classList.toggle('qa', !!r.s.qa && t >= T.typed && t < T.ok);
    const m = streamCount(es, T.a, cps, t);
    // a QA catch: once the official text is in, the flagged part is swapped for its corrected form
    // (while it is flagged, the offending part is marked; then it is swapped for its corrected form)
    const state = r.s.qa && t >= T.fix ? 'fixed' : r.s.qa && m >= es.length ? 'flag' : m;
    if (r._state !== state) {
      if (state === 'fixed') { r.tv.innerHTML = fixedHTML(r.s); r.th.textContent = ''; }
      else if (state === 'flag') { const i = es.indexOf(r.s.qa.from); r.tv.innerHTML = esc(es.slice(0, i)) + `<mark class="ph-qw">${esc(r.s.qa.from)}</mark>` + esc(es.slice(i + r.s.qa.from.length)); r.th.textContent = ''; }
      else { r.tv.textContent = es.slice(0, m); r.th.textContent = es.slice(m); }
      r._state = state;
    }
    const typing = t >= T.a && t < T.ok;
    if (typing) act = k;
    r.car.style.display = typing && m < es.length ? '' : 'none';
    r.n.classList.toggle('act', typing);
    const ok = t >= T.ok;
    r.n.classList.toggle('done', ok);
    const okp = outCubic(seg(t, T.ok, T.ok + 0.18));
    r.ok.style.opacity = ok ? okp.toFixed(3) : '0';
    r.ok.style.transform = ok && okp < 1 ? `scale(${lerp(0.5, 1, okp).toFixed(3)})` : 'none';
  });
  if (act < 0 && t < segTimes(c, 0, n).a) act = 0;
  // keep the active segment in view: the grid scrolls (eased) so the active row's bottom stays inside the viewport
  const vpH = el.gridVp.clientHeight;
  const target = (k) => { const r = rows[Math.max(0, k)].n; return Math.max(0, r.offsetTop + r.offsetHeight + 6 - vpH); };
  let y = target(0);
  for (let k = 1; k < n; k++) y = lerp(y, target(k), inOutCubic(seg(t, segTimes(c, k, n).a - 0.12, segTimes(c, k, n).a + 0.05)));
  el.grid.style.transform = `translateY(${(-y).toFixed(2)}px)`;
  // the viewport's edges fade only where rows run past them, so a row cut by the edge reads as the grid scrolling
  const rest = Math.max(0, el.grid.offsetHeight - vpH - y);
  const ft = `${Math.min(22, y).toFixed(1)}px`, fb = `${Math.min(22, rest).toFixed(1)}px`;
  if (el.gridVp.style.getPropertyValue('--ft') !== ft) el.gridVp.style.setProperty('--ft', ft);
  if (el.gridVp.style.getPropertyValue('--fb') !== fb) el.gridVp.style.setProperty('--fb', fb);
  // the CAT pane follows the active (or last confirmed) segment: its own matches on top (the TM match first, as R1
  // lists the best match first), then the job's other term base entries, dimmed
  const k = act >= 0 ? act : n - 1;
  const cs = el.catSets[c.i];
  if (cs.set.style.display === 'none') cs.set.style.display = '';
  cs.set.style.opacity = load.toFixed(3);
  const cp = outCubic(seg(t, segTimes(c, k, n).a - 0.02, segTimes(c, k, n).a + 0.14));
  const hit = cs.rows.filter((r) => r.e.hits.has(k)).sort((x, y) => (y.e.tm ? 1 : 0) - (x.e.tm ? 1 : 0));
  const others = cs.rows.filter((r) => !r.e.hits.has(k) && !r.e.tm);
  const nTm = hit.filter((r) => r.e.tm).length, nTb = hit.length - nTm;
  setT(cs.lab, hit.length ? 'Other terms in this job' : 'Term base entries in this job');
  cs.lab.style.order = String(hit.length);
  cs.lab.style.display = others.length ? '' : 'none';
  const order = [...hit, { lab: true }, ...others];
  let no = 0;
  order.forEach((r, i) => {
    if (r.lab) return;
    r.n.style.order = String(i);
    r.n.classList.toggle('hit', r.e.hits.has(k));
    r.n.classList.toggle('dim', !r.e.hits.has(k));
    r.n.style.opacity = r.e.hits.has(k) ? cp.toFixed(3) : '';
  });
  for (const r of cs.rows) if (r.e.tm && !r.e.hits.has(k)) r.n.style.order = '99';
  // only whole match rows: a row the pane's bottom would cut is not drawn
  // (a TM match that is not the active segment's is not listed)
  const idleTm = cs.rows.filter((r) => r.e.tm && !r.e.hits.has(k)).map((r) => ({ n: r.n, want: false }));
  wholeRows([...order.map((r) => (r.lab ? { n: cs.lab, want: others.length > 0 } : { n: r.n, want: true })), ...idleTm], el.catBox);
  for (const r of order) if (!r.lab && r.n.style.display !== 'none') setT(r.no, String(++no));
  for (const f of cs.set.querySelectorAll('.ph-fit')) if (f.offsetParent) fitT(f, f._src);
  el.catEmpty.style.opacity = '0';
  setT(el.catSeg, `Segment ${k + 1}`);
  setT(el.catSum, [nTm ? `${nTm} TM match, 100%` : '', nTb ? `${nTb} term base hit${nTb > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ') || 'No TM or term base match in this segment');
  el.catSum.classList.toggle('none', !hit.length);
  el.catSum.style.opacity = load.toFixed(3);
  el.qa.style.opacity = load.toFixed(3);
  // QA: the job's catch (a style rule the official Spanish breaks) shows from the moment its segment's text is
  // in and stays up, marked fixed, until the job closes; otherwise the active segment's rule check passes. The
  // block quotes the rule (RAE's own words), its English gloss and where it is from; the list under it is every
  // style rule the job is checked against, with the one in play marked
  let q = -1;
  for (let j = 0; j <= k; j++) if (c.c.segs[j].qa && t >= segTimes(c, j, n).typed) q = j;
  const warn = q >= 0 ? c.c.segs[q] : null;
  el.qa.classList.toggle('warn', !!warn);
  const fixed = !!warn && t >= segTimes(c, q, n).fix;
  el.qa.classList.toggle('fixed', fixed);
  const R = warn ? RULES[warn.qa.rule] : (c.c.segs[k].rules || []).map((i) => RULES[i]).find(Boolean);
  const ri = R ? RULES.indexOf(R) : -1;
  el.qa.classList.toggle('none', !R);
  if (warn) {
    setT(el.qaN, fixed ? '1 warning, fixed' : '1 warning');
    setT(el.qaSeg, `Segment ${q + 1}`);
    setT(el.qaFrom, warn.qa.from); setT(el.qaTo, warn.qa.to);
  } else {
    setT(el.qaN, '0 warnings');
    setT(el.qaSeg, `Segment ${k + 1}`);
  }
  const ctx = `${c.i}:${warn ? q : k}`;
  fitT(el.qaQ, R ? R.quote : `Segment ${k + 1} checked against your ${RULES.length} style rules`, ctx + ':q');
  el.qaQ.classList.toggle('plain', !R);
  fitT(el.qaR, R ? R.gloss : '', ctx + ':r');
  fitT(el.qaS, R ? `${R.sourceShort}, ${R.section}` : (RULES[0] ? RULES[0].sourceShort : ''), ctx + ':s');
  el.qaLis.forEach((li, i) => {
    const on = i === ri;
    li.classList.toggle('on', on);
    li.classList.toggle('warn', on && !!warn && !fixed);
    li.classList.toggle('fixed', on && fixed);
  });
}

function renderHud(t) {
  const cur = t < 1.50 ? 'Opening your jobs in Phrase'
    : t < VOICE.a ? 'Phrase connected, jobs syncing'
      : t < 4.30 ? 'Matching your translations'
        : t < LEARN.a ? 'Translation style matched'
          : t < 8.30 ? 'Reading your style guides'
            : t < LAND.a ? 'Working your queue' : `Queue clear · ${N_JOBS} jobs completed`;
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
  // the style panel (VOICE): no score, just "matched" with a check once the lanes agree
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
  // what superbot learned (LEARN); it folds away again once the jobs start, so the HUD stays small
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
// screens show it. Narrower ratios scale less and restack (phrase.css). Same factors as the call-center spot.
const UI_SCALE = (W) => (W >= 1900 ? 1.3 : W >= 1400 ? 1.2 : W >= 1000 ? 1.1 : 1.05);
function layout(W) {
  if (el.lay && el.lay.W === W) return el.lay;
  const S = UI_SCALE(W);
  el.ph.style.width = (W / S).toFixed(2) + 'px';
  el.ph.style.height = (1080 / S).toFixed(2) + 'px';
  el.ph.style.transform = `scale(${S})`;
  const cs = getComputedStyle(el.qListEl);
  const listH = el.qListEl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  el.lay = { W, S, rows: Math.max(3, Math.floor(listH / ROW_H)), padT: parseFloat(cs.paddingTop) };
  // the style-guide viewport: as many WHOLE rows as the pane holds
  el.actVp.style.flex = ''; el.actVp.style.height = '';
  const vpRows = Math.max(1, Math.floor(el.actVp.clientHeight / AROW_H));
  el.actVp.style.flex = 'none'; el.actVp.style.height = `${vpRows * AROW_H}px`;
  return el.lay;
}

export function render(t, W = 1920) {
  if (!el) return;
  layout(W);
  for (const n of el.fits) if (n.offsetParent) fitT(n, n._src);
  const waiting = t < QWAIT_IN.b ? Math.round(N_JOBS * outCubic(seg(t, QWAIT_IN.a, QWAIT_IN.b)))
    : t < ANSWER.a ? N_JOBS
      : JOBS.filter((q) => t < q.tAns).length;
  renderChrome(t);
  renderHeader(t);
  renderViews(t);
  renderQueue(t, waiting);
  renderLearn(t);
  renderCall(t);
  renderHud(t);
}

export default { id: 'phrase', DUR, mount, render };

// wp.js: the WordPress desk (the block editor with a newsroom story budget beside it), and the four beats superbot
// works on it. It is one DOM tree built at mount and then driven purely from local time t (?t=<s> reproduces any
// frame), so the spot is seek-safe at every ratio. The chrome (the admin bar with the W; the editor header with the
// back button, inserter, undo / redo, document overview, the centred document bar, Save draft / View / Settings /
// Submit for Review / Options; the
// settings sidebar with its Post tab, summary rows and panels; the footer breadcrumb) is rebuilt in HTML from a
// headless render of the current WordPress release in WordPress Playground, kept outside the repo in
// /tmp/jr-ad.f8795b48/ref (see wp.css for the measured tokens and which file each came from). The left pane is the
// day's story budget (the newsroom term; the status names are Edit Flow's). The motion is the call-center spot's
// (e360.js) beat for beat: every window, WINS, FR fraction, queue timing and HUD rule
// is unchanged; only what the desk shows is a reporter's work. The official WordPress logo file is on the chat's
// sign-in card (../../img/wordpress-logo.svg, see ../../img/CREDITS.txt); the admin bar draws the W as the editor does.
// All story content comes from wp-data.js; every count on screen is derived from its arrays.
import { clamp, lerp, seg, outCubic, inOutCubic, rand, press, esc, streamCount } from '../../lib.js';
import { DAY, STORIES, MAIN, STYLE } from './wp-data.js';
import { I, STR, STEPS } from './wp-ui.js';

// ---------- the desk's own clock (seconds, local to the desk layer): the call-center spot's, unchanged ----------
export const DUR = 18.40;
const CONNECT = { a: 0.00, b: 2.10 };
const VOICE = { a: 2.10, b: 4.60 };
const LEARN = { a: 4.60, b: 8.60 };
const ANSWER = { a: 8.60, b: 16.10 };
const LAND = { a: 16.10, b: DUR };

// the three stories the editor writes, start to end
const WINS = [[8.90, 11.60], [11.60, 14.00], [14.00, 16.10]];
// where each step of a story lands inside its window, as a fraction of it (the call-center spot's marks): the
// release lands (prob), the headline options appear (cause), one is pressed (sol + 0.10), the lede starts (turn1),
// the fact check flips to checked (closed) and Submit for Review is pressed (end)
const FR = { prob: 0.04, cause: 0.12, sol: 0.20, turn1: 0.24, turn2: 0.36, closed: 0.80, end: 0.88 };
// inside a window: the pressed headline is typed into the title in 0.2 s, then the lede runs (from turn1, or as soon
// as the title is in) to LEDE_END, the second paragraph to GRAF_END, then the quote and
// the sources list are inserted (each a block landing, not typed)
const LEDE_END = 0.54, GRAF_END = 0.72, QUOTE_AT = 0.73, SRC_AT = 0.765;
const ROW_H = 44;               // one story row in the budget (wp.css .wp-bi, 40px + 4px gap)
const AROW_H = 56;              // one Stylebook row (wp.css .wp-arow)
const FC_H = 26;                // one Fact check row (wp.css .wp-fc, 24px + 2px gap)
const FADE_TOP = 56;            // the canvas viewport's top fade once it scrolls (wp.css .wp-vp --cvfade)
const STEP_DONE = [1.75, 4.35, 8.35, 16.15];
const QWAIT_IN = { a: 0.70, b: 1.70 };
const N = STORIES.length;
// the call-center queue's arrival / answer / resolve timings, copied exactly (motion, not content). Slot k of the
// three main stories is answered as window k opens; the other nine stories take the remaining slots in budget order.
const TIMING = [[8.70, 8.90, 11.06], [9.30, 11.60, 13.52], [9.90, 14.00, 15.68], [10.40, 10.95, 12.60], [10.90, 11.35, 13.10],
  [11.40, 11.80, 13.45], [11.90, 12.30, 14.20], [12.40, 12.85, 14.55], [12.90, 13.35, 15.20], [13.40, 13.85, 15.60],
  [13.90, 14.35, 15.92], [14.40, 14.75, 16.02]];

const $ = (s, root) => root.querySelector(s);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const setT = (n, s) => { if (n && n.textContent !== s) n.textContent = s; };
const fmt = (n) => Number(n).toLocaleString('en-US');
const words = (s) => (s ? s.trim().split(/\s+/).length : 0);
const winLen = (i) => WINS[i][1] - WINS[i][0];
const at = (i, f) => WINS[i][0] + f * winLen(i);
// the moment Submit for Review is pressed on main story k
const submitAt = (k) => at(k, FR.end);

// Text that does not fit its box is cut at a WORD boundary and ends in an ellipsis, instead of the browser's
// mid-word text-overflow cut (the earlier remake's fitT). Works for single-line (nowrap) boxes and
// -webkit-line-clamp boxes alike. Cached per text, frame width and font state.
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
  }
  n._fit = key; n._fitOut = n.textContent;
}
// ---------- the budget: the 12 stories in their queue slots ----------
const ROWS = (() => {
  const order = [];
  for (let k = 0; k < MAIN.length; k++) order.push(MAIN[k].story);
  STORIES.forEach((s, i) => { if (!order.includes(i)) order.push(i); });
  return order.map((si, slot) => {
    const [tIn, tAns, tRes] = TIMING[slot];
    const k = STORIES[si].main;
    // a main story turns Pending Review when its Submit for Review is pressed
    return { s: STORIES[si], si, k: k == null ? null : k, tIn, tAns, tRes: k == null ? tRes : Math.max(tRes, submitAt(k)) };
  });
})();

// ---------- a main story's text, with the moments its parts land ----------
// A story's dateline leads its lede in bold, as filed (WASHINGTON; ISSAQUAH, Wash.), with no dash after it (the house rule); the lede and the second
// paragraph are typed in, each at the speed that fills its slot.
function plan(k) {
  const m = MAIN[k];
  const lede = m.lede, graf = m.graf2;
  const title = m.options[m.press];
  const tPress = at(k, FR.sol) + 0.10;
  const T = {
    says: at(k, FR.prob), opts: at(k, FR.cause), press: tPress,
    title: [tPress + 0.06, tPress + 0.26],
    lede: [Math.max(at(k, FR.turn1), tPress + 0.28), at(k, LEDE_END)], graf: [at(k, LEDE_END), at(k, GRAF_END)],
    quote: at(k, QUOTE_AT), src: at(k, SRC_AT), closed: at(k, FR.closed), end: at(k, FR.end),
  };
  const cps = (s, w) => Math.max(40, s.length / Math.max(0.05, w[1] - w[0]));
  T.cT = cps(title, T.title); T.cL = cps(lede, T.lede); T.cG = cps(graf, T.graf);
  // the moment a substring of the story first stands on screen: typed out in the title (the filed headline), the
  // lede or the second paragraph, or with the dateline, which lands whole as the lede opens
  const typedAt = (sub) => {
    let i = title.indexOf(sub);
    if (i >= 0) return T.title[0] + (i + sub.length) / T.cT;
    if (m.dateline.includes(sub)) return T.lede[0];
    i = lede.indexOf(sub);
    if (i >= 0) return T.lede[0] + (i + sub.length) / T.cL;
    i = graf.indexOf(sub);
    if (i >= 0) return T.graf[0] + (i + sub.length) / T.cG;
    return T.closed;
  };
  T.facts = m.facts.map((f) => Math.min(typedAt(f.text), T.closed));
  T.fixes = m.fixes.map((f) => Math.min(typedAt(f.to), T.closed));
  return { m, title, T };
}
const PLANS = MAIN.map((_, k) => plan(k));

let el = null;

// ---------- mount ----------
export function mount(section, ctx) {
  const root = h(`<div class="wp-root"></div>`);
  const hudMark = ctx.shell.makeMark(26);
  const HUD_RULES = STYLE.slice(0, 4).map((r) => r.label);
  root.innerHTML = `
<div class="wp">
  <nav class="wp-ab">
    <span class="wp-ab-i wp-ab-w">${I.wordpress}</span>
    <span class="wp-ab-i">${I.abSearch}<span class="wp-ab-t">⌘K</span></span>
    <span class="wp-ab-i">${I.abComments}<span class="wp-ab-t">0</span></span>
    <span class="wp-ab-i">${I.abPlus}<span class="wp-ab-t">${esc(STR.newItem)}</span></span>
    <span class="wp-ab-i wp-ab-me"><span class="wp-ab-t">${esc(STR.howdy)} ${esc(STR.author)}</span><i class="wp-ab-av"></i></span>
  </nav>
  <header class="wp-top">
    <div class="wp-tl">
      <span class="wp-b wp-back">${I.back}</span>
      <span class="wp-b wp-ins">${I.plus}</span>
      <span class="wp-b wp-undo">${I.undo}</span>
      <span class="wp-b wp-redo">${I.redo}</span>
      <span class="wp-b wp-ov">${I.listView}</span>
    </div>
    <div class="wp-dbar"><span class="wp-dbar-t">${esc(STR.noTitle)}</span><span class="wp-dbar-k">${esc(STR.postType)}</span></div>
    <div class="wp-tr">
      <span class="wp-save">${I.check}<span class="wp-save-t">${esc(STR.saveDraft)}</span></span>
      <span class="wp-b wp-prev">${I.desktop}</span>
      <span class="wp-b wp-set">${I.drawerRight}</span>
      <span class="wp-pub">${esc(STR.submit)}</span>
      <span class="wp-b wp-more">${I.moreVertical}</span>
    </div>
  </header>
  <div class="wp-body">
    <aside class="wp-bud">
      <div class="wp-bud-h"><b>${esc(STR.budget)}</b><span class="wp-bud-live"><i></i>${esc(STR.inProgress)} <b class="wp-bud-ln">0</b></span></div>
      <div class="wp-bud-day"><span class="wp-bud-date">${esc(DAY.label)}</span><span class="wp-bud-bar"><i></i></span><b class="wp-bud-pc">0 / ${N}</b></div>
      <div class="wp-bud-top"><b class="wp-bud-n">0</b><small>${esc(STR.assigned.toLowerCase())}</small><span class="wp-bud-sub">${N} ${esc(STR.storiesWord)}</span></div>
      <div class="wp-bud-cols"><span>${esc(STR.colStory)}</span><span>${esc(STR.colStatus)}</span></div>
      <ul class="wp-bud-list"></ul>
    </aside>

    <main class="wp-cv">
      <div class="wp-view wp-v-idle">
        <div class="wp-doc">
          <h1 class="wp-title is-ph">${esc(STR.addTitle)}</h1>
          <p class="wp-p is-ph">${esc(STR.typeSlash)}</p>
        </div>
      </div>

      <div class="wp-view wp-v-act">
        <div class="wp-modal">
          <div class="wp-mh"><h2>${esc(STR.styleTitle)}</h2><span class="wp-mcnt"><b class="wp-cn">0</b><small>${esc(STR.entriesRead)}</small></span><span class="wp-b wp-mx">${I.close}</span></div>
          <div class="wp-mhead"><span class="wp-ar-e">${esc(STR.colEntry)}</span><span class="wp-ar-q">${esc(STR.colRule)}</span><span class="wp-ar-l">${esc(STR.colShort)}</span></div>
          <div class="wp-act-vp"><div class="wp-act-in"></div>${STYLE.length ? '' : `<p class="wp-empty wp-m-empty">${esc(STR.styleEmpty)}</p>`}</div>
        </div>
      </div>

      <div class="wp-view wp-v-call">
        <div class="wp-vp"><div class="wp-scroll"></div></div>
      </div>
    </main>

    <aside class="wp-side">
      <div class="wp-tabs"><span class="wp-tab on">${esc(STR.tabPost)}</span><span class="wp-tab">${esc(STR.tabBlock)}</span><span class="wp-b wp-sx">${I.close}</span></div>
      <div class="wp-side-in">
        <section class="wp-sum">
          <div class="wp-card"><span class="wp-card-ic">${I.post}</span><b class="wp-card-t">${esc(STR.noTitle)}</b><span class="wp-card-more">${I.moreVertical}</span></div>
          <p class="wp-card-s"></p>
          <div class="wp-rows">
            <div class="wp-row"><span class="wp-rl">${esc(STR.rowStatus)}</span><span class="wp-rv wp-rv-txt wp-rv-st"><span class="wp-st-l">${esc(STR.statusDraft)}</span></span></div>
            <div class="wp-row"><span class="wp-rl">${esc(STR.rowSlug)}</span><span class="wp-rv wp-rv-slug"></span></div>
            <div class="wp-row"><span class="wp-rl">${esc(STR.rowDateline)}</span><span class="wp-rv wp-rv-txt wp-rv-dl"></span></div>
          </div>
        </section>
        <section class="wp-pn wp-pn-cat"><h3><span>${esc(STR.categories)}</span>${I.chevronUp}${I.chevronDown}</h3><div class="wp-pn-b"><span class="wp-chk"><i>${I.check}</i><span class="wp-cat-v"></span></span></div></section>
        <section class="wp-pn wp-pn-tag"><h3><span>${esc(STR.tags)}</span>${I.chevronUp}${I.chevronDown}</h3><div class="wp-pn-b"><div class="wp-toks"></div></div></section>
        <section class="wp-pn wp-pn-ap"><h3><span>${esc(STR.apStyle)}</span>${I.chevronUp}</h3><div class="wp-pn-b">
          <ul class="wp-ap-list"></ul><p class="wp-empty wp-ap-empty">${esc(STR.apEmpty)}</p></div></section>
        <section class="wp-pn wp-pn-fc"><h3><span>${esc(STR.factCheck)}</span><em class="wp-badge"></em>${I.chevronUp}</h3><div class="wp-pn-b">
          <div class="wp-fc-sum"><span class="wp-fc-n"></span></div>
          <ul class="wp-fc-list"></ul><p class="wp-empty wp-fc-empty">${esc(STR.fcEmpty)}</p></div></section>
      </div>
    </aside>
  </div>
  <footer class="wp-foot">
    <span class="wp-crumb"><span>${esc(STR.crumbPost)}</span><i>${I.chevronRight}</i><span class="wp-crumb-b">${esc(STR.crumbPara)}</span></span>
    <span class="wp-fs"><span>${esc(STR.fFiled)} <b class="wp-f-s">0</b> / ${N}</span><span>${esc(STR.fFacts)} <b class="wp-f-f">0</b></span><span>${esc(STR.fFixes)} <b class="wp-f-x">0</b></span></span>
  </footer>

  <div class="wp-snack"><span>${esc(STR.snack)}</span><span class="wp-snack-a"><u>${esc(STR.snackLink)}</u> ↗</span></div>

  <div class="wp-hud">
    <div class="wp-hud-h"><span class="wp-hud-mark"></span><span class="wp-hud-cur">${esc(STR.hud[0])}</span></div>
    <ul class="wp-hud-steps">${STEPS.map((s) => `<li><i></i>${esc(s)}</li>`).join('')}</ul>
    <div class="wp-hud-voice">
      <div class="wp-hud-lane"><b>${esc(STR.laneYou)}</b><span class="wp-hud-bars" data-l="you"></span></div>
      <div class="wp-hud-lane sb"><b>Superbot</b><span class="wp-hud-bars" data-l="sb"></span></div>
      <div class="wp-hud-mh"><span>${esc(STR.laneStyle)}</span><b class="wp-hud-ok">${I.hudCheck}matched</b></div>
      <div class="wp-hud-meter"><i></i></div>
    </div>
    <div class="wp-hud-res"><b>${esc(STR.hudRules)}</b><div class="wp-hud-chips">${HUD_RULES.map((r) => `<span class="wp-hud-chip">${I.hudCheck}${esc(r)}</span>`).join('')}</div></div>
    <div class="wp-hud-stats"><span>filed <b class="wp-hs-s">0</b></span><span>facts <b class="wp-hs-f">0</b></span><span>style fixes <b class="wp-hs-x">0</b></span></div>
  </div>
</div>`;
  section.appendChild(root);
  $('.wp-hud-mark', root).appendChild(hudMark.el);

  // the budget: one row per story, built once and placed every frame from t
  const qList = $('.wp-bud-list', root);
  const qRows = ROWS.map((r) => {
    const n = h(`<li class="wp-bi">
      <span class="wp-bi-m"><span class="wp-bi-n">${esc(r.s.release)}</span><span class="wp-bi-r"><b class="wp-bi-o">${esc(r.s.orgShort)}</b><span class="wp-bi-at">${esc(r.s.at)}</span></span></span>
      <em class="wp-st s-as">${esc(STR.assigned)}</em></li>`);
    qList.appendChild(n);
    return { n, r, p: $('.wp-st', n), nm: $('.wp-bi-n', n), og: $('.wp-bi-o', n) };
  });
  const qEmpty = h(`<div class="wp-bud-empty">${esc(STR.budgetEmpty)}</div>`);
  qList.appendChild(qEmpty);

  // the Stylebook (LEARN): the entries twice, so it has something to scroll through
  const actIn = $('.wp-act-in', root);
  const actRows = [];
  for (let rep = 0; rep < 2; rep++) for (const r of STYLE) {
    const n = h(`<div class="wp-arow">
      <span class="wp-ar-e"><b class="wp-fit">${esc(r.entry)}</b></span>
      <span class="wp-ar-q wp-fit">${esc(r.quote)}</span><span class="wp-ar-l wp-fit">${esc(r.label)}</span></div>`);
    actIn.appendChild(n);
    actRows.push(n);
  }
  const actPx = actRows.length * AROW_H;

  // the canvas: one document per main story (only the live one is shown), each block built once
  const scroll = $('.wp-scroll', root);
  const docs = PLANS.map(({ m, title }, k) => {
    const s = STORIES[m.story];
    const n = h(`<div class="wp-doc wp-story">
      <div class="wp-notice"><div class="wp-notice-h"><b>${esc(STR.releaseSays)}</b><span class="wp-notice-src"><span class="wp-notice-o">${esc(s.org)}</span><span class="wp-notice-at">${esc(s.at)} ET</span></span></div>
        <p class="wp-says">${esc(m.says.join(' '))}</p></div>
      <div class="wp-opts"><div class="wp-opts-h"><span>${esc(STR.headlineOpts)}</span><span class="wp-opts-c"><b class="wp-cc">0</b> ${esc(STR.characters)}</span></div>
        <div class="wp-opts-b">${m.options.map((o) => `<span class="wp-opt"><span class="wp-opt-t">${esc(o)}</span><small>${o.length}</small></span>`).join('')}</div></div>
      <h1 class="wp-title"><span class="wp-tt"></span><i class="wp-car"></i></h1>
      <p class="wp-p wp-lede"><b class="wp-dl">${esc(m.dateline)}</b> <span class="wp-tx"></span><i class="wp-car"></i></p>
      <p class="wp-p wp-graf"><span class="wp-tx"></span><i class="wp-car"></i></p>
      ${m.quote ? `<blockquote class="wp-quote"><p>${esc(m.quote.text)}</p><cite>${esc(m.quote.who)}</cite></blockquote>` : ''}
      <h3 class="wp-srch">${esc(STR.sources)}</h3>
      <ul class="wp-src"><li>${esc(s.org)}, “${esc(s.release)},” ${esc(DAY.label)}, ${esc(s.at)} ET</li><li class="wp-src-u">${esc(s.url)}</li></ul>
    </div>`);
    n.style.display = 'none';
    scroll.appendChild(n);
    const q = (c) => $(c, n);
    const blocks = [q('.wp-notice'), q('.wp-opts'), q('.wp-title'), q('.wp-lede'), q('.wp-graf'), q('.wp-quote'), q('.wp-srch'), q('.wp-src')].filter(Boolean);
    return {
      n, k, blocks, notice: q('.wp-notice'), says: q('.wp-says'), opts: q('.wp-opts'), optN: [...n.querySelectorAll('.wp-opt')], cc: q('.wp-cc'),
      title: q('.wp-title'), tt: q('.wp-tt'), tcar: q('.wp-title .wp-car'),
      lede: q('.wp-lede'), ltx: q('.wp-lede .wp-tx'), lcar: q('.wp-lede .wp-car'),
      graf: q('.wp-graf'), gtx: q('.wp-graf .wp-tx'), gcar: q('.wp-graf .wp-car'),
      quote: q('.wp-quote'), srch: q('.wp-srch'), src: q('.wp-src'), title0: title,
    };
  });

  // the sidebar's per-story lists: facts (each with a tick against the release) and the AP style fixes
  const fcList = $('.wp-fc-list', root), apList = $('.wp-ap-list', root), toks = $('.wp-toks', root);
  const fcRows = MAIN.map((m, k) => {
    const rows = m.facts.map((f) => {
      const n = h(`<li class="wp-fc"><i class="wp-tick">${I.check}</i><b class="wp-fc-t wp-fit">${esc(f.text)}</b><span class="wp-fc-s wp-fit">${esc(`“${f.span}”`)}</span></li>`);
      n.style.display = 'none';
      return { n, tick: $('.wp-tick', n), s: $('.wp-fc-s', n) };
    });
    // (in the order the facts tick, so the list reads top to bottom as the story is written)
    const T = PLANS[k].T.facts;
    const order = rows.map((_, j) => j).sort((a, b) => T[a] - T[b] || a - b);
    for (const j of order) fcList.appendChild(rows[j].n);
    rows.order = order;
    return rows;
  });
  const apRows = MAIN.map((m) => m.fixes.map((f) => {
    const r = STYLE.find((x) => x.id === f.rule);
    const n = h(`<li class="wp-ap"><small class="wp-ap-r">${esc(r ? r.entry : f.rule)}</small><s>${esc(f.from)}</s> <span class="wp-ap-to">${I.arrowRight}<b>${esc(f.to)}</b></span></li>`);
    n.style.display = 'none';
    apList.appendChild(n);
    return n;
  }));
  const tokRows = MAIN.map((m) => {
    const n = h(`<span class="wp-tokset">${m.tags.map((x) => `<span class="wp-tok">${esc(x)}</span>`).join('')}</span>`);
    n.style.display = 'none';
    toks.appendChild(n);
    return n;
  });

  // the HUD's style lanes: 26 deterministic bars each, plus the match meter
  const lane = (which) => {
    const box = $(`.wp-hud-bars[data-l="${which}"]`, root);
    const out = [];
    for (let i = 0; i < 26; i++) { const b = document.createElement('i'); box.appendChild(b); out.push(b); }
    return out;
  };
  const barsYou = lane('you'), barsSb = lane('sb');
  const YOU = Array.from({ length: 26 }, (_, i) => clamp(0.26 + 0.74 * Math.abs(Math.sin(i * 0.58 + 0.7)) * (0.52 + 0.48 * Math.abs(Math.sin(i * 0.21 + 1.3))) * (0.68 + 0.32 * rand(i + 3)), 0, 1));
  const OTHER = YOU.map((_, i) => clamp(0.24 + 0.76 * YOU[(i * 5 + 3) % 26], 0, 1));

  el = {
    root, hudMark, wp: $('.wp', root), qListEl: qList, qRows, qEmpty, lay: null,
    qlive: $('.wp-bud-live', root), qln: $('.wp-bud-ln', root), qn: $('.wp-bud-n', root), qpc: $('.wp-bud-pc', root), qbar: $('.wp-bud-bar i', root),
    dbarT: $('.wp-dbar-t', root), save: $('.wp-save', root), saveT: $('.wp-save-t', root), pub: $('.wp-pub', root), undo: $('.wp-undo', root),
    vIdle: $('.wp-v-idle', root), vAct: $('.wp-v-act', root), vCall: $('.wp-v-call', root),
    cn: $('.wp-cn', root), actIn, actRows, actPx, actVp: $('.wp-act-vp', root),
    vp: $('.wp-vp', root), scroll, docs, snack: $('.wp-snack', root),
    cardT: $('.wp-card-t', root), cardS: $('.wp-card-s', root), stV: $('.wp-rv-st', root), stL: $('.wp-st-l', root), slugV: $('.wp-rv-slug', root), dlV: $('.wp-rv-dl', root),
    catV: $('.wp-cat-v', root), chk: $('.wp-chk', root), tokRows, toks,
    fcSum: $('.wp-fc-sum', root), fcN: $('.wp-fc-n', root), badge: $('.wp-badge', root), fcRows, fcList, fcEmpty: $('.wp-fc-empty', root),
    apRows, apList, apEmpty: $('.wp-ap-empty', root), sideIn: $('.wp-side-in', root),
    crumbB: $('.wp-crumb-b', root), fS: $('.wp-f-s', root), fF: $('.wp-f-f', root), fX: $('.wp-f-x', root),
    hud: $('.wp-hud', root), hudCur: $('.wp-hud-cur', root), hudSteps: [...root.querySelectorAll('.wp-hud-steps li')],
    hudVoice: $('.wp-hud-voice', root), hudOk: $('.wp-hud-ok', root), hudMeter: $('.wp-hud-meter i', root),
    hudRes: $('.wp-hud-res', root), resChips: [...root.querySelectorAll('.wp-hud-chip')], hudStats: $('.wp-hud-stats', root),
    hsS: $('.wp-hs-s', root), hsF: $('.wp-hs-f', root), hsX: $('.wp-hs-x', root),
    barsYou, barsSb, YOU, OTHER,
    // the static strings that are fitted at a word boundary (their full text kept aside)
    fits: [...root.querySelectorAll('.wp-fit')].map((n) => { n._src = n.textContent; return n; }),
  };
  return el;
}

// ---------- per-frame render ----------
function callState(t) {
  for (let i = 0; i < WINS.length; i++) {
    if (t >= WINS[i][0] && t < WINS[i][1]) return { i, a: WINS[i][0], b: WINS[i][1], f: (t - WINS[i][0]) / winLen(i) };
  }
  if (t >= WINS[2][1]) return { i: 2, a: WINS[2][0], b: WINS[2][1], f: 1 };
  return null;
}

// the counters: stories filed (Pending Review on the budget), facts checked, style fixes made
function counts(t) {
  const filed = ROWS.filter((r) => t >= r.tRes).length;
  let facts = 0, fixes = 0;
  PLANS.forEach((p) => {
    if (t >= p.T.closed) facts += p.m.facts.length;
    fixes += p.T.fixes.filter((x) => t >= x).length;
  });
  return { filed, facts, fixes };
}

function renderQueue(t, waiting) {
  let live = 0;
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
    const edge = clamp((y + el.lay.padT) / 8);
    row.n.style.opacity = (seg(t, q.tIn, q.tIn + 0.26) * fold * edge).toFixed(3);
    const acc = t >= q.tAns, done = t >= q.tRes;
    const cls = done ? 's-pr' : acc ? 's-ip' : 's-as';
    if (row.p.className !== `wp-st ${cls}`) row.p.className = `wp-st ${cls}`;
    // Edit Flow's statuses: Assigned, then In Progress once superbot takes it, then Pending Review once submitted
    setT(row.p, done ? STR.pendingReview : acc ? STR.inProgress : STR.assigned);
    if (!acc) {
      row.p.style.opacity = (0.55 + 0.45 * Math.abs(Math.sin((t - q.tIn) * 5.2))).toFixed(3);
      row.p.style.transform = `scale(${(1 + 0.05 * Math.abs(Math.sin((t - q.tIn) * 5.2))).toFixed(3)})`;
    } else { row.p.style.opacity = '1'; row.p.style.transform = ''; }
    // the status chip's width changes with its state, so the release title is fitted per state
    fitT(row.nm, q.s.release, cls);
    fitT(row.og, q.s.orgShort, cls);
    if (acc && !done) live++;
  }
  // the landed state: the in-progress chip turns into "Budget clear"
  const clear = t >= LAND.a;
  if (el.qlive.classList.contains('clear') !== clear) {
    el.qlive.classList.toggle('clear', clear);
    el.qlive.innerHTML = clear ? `${I.check}${esc(STR.budgetClear)}` : `<i></i>${esc(STR.inProgress)} <b class="wp-bud-ln">0</b>`;
    el.qln = $('.wp-bud-ln', el.qlive) || el.qln;
  }
  if (!clear) setT(el.qln, String(live));
  el.qlive.style.opacity = seg(t, ANSWER.a + 0.15, ANSWER.a + 0.5).toFixed(3);
  el.qEmpty.style.opacity = (1 - seg(t, ROWS[0].tIn, ROWS[0].tIn + 0.3)).toFixed(3);
  setT(el.qn, String(waiting));
  const filed = ROWS.filter((r) => t >= r.tRes).length;
  setT(el.qpc, `${filed} / ${N}`);
  el.qbar.style.width = (100 * filed / N).toFixed(1) + '%';
}

function renderChrome(t) {
  const on = t >= 0.55;
  el.root.classList.toggle('live', on);
  const c = counts(t);
  setT(el.fS, fmt(c.filed)); setT(el.fF, fmt(c.facts)); setT(el.fX, fmt(c.fixes));
  setT(el.hsS, fmt(c.filed)); setT(el.hsF, fmt(c.facts)); setT(el.hsX, fmt(c.fixes));
}

function renderViews(t) {
  const toAct = inOutCubic(seg(t, LEARN.a, LEARN.a + 0.35));
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
  // the modal rises a little as it opens, as the editor's modals do
  el.vAct.firstElementChild.style.transform = actOn >= 1 ? 'none' : `translateY(${((1 - actOn) * 14).toFixed(2)}px)`;
}

function renderLearn(t) {
  const c = outCubic(seg(t, LEARN.a + 0.30, 7.40));
  setT(el.cn, String(Math.round(STYLE.length * c)));
  const vpH = el.actVp.clientHeight || 300;
  const y = -lerp(0, el.actPx - vpH, c);
  el.actIn.style.transform = `translateY(${Math.min(0, y).toFixed(2)}px)`;
  // a row the scroll carries past the viewport's top or bottom edge fades out before its lines reach the edge, so no
  // line is ever drawn half cut (the mask below softens the edges while the list moves)
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

// the typed part of a paragraph: the text so far, the caret while it runs
function typeInto(tx, car, s, t0, cps, t) {
  const n = streamCount(s, t0, cps, t);
  if (tx.textContent.length !== n) tx.textContent = s.slice(0, n);
  car.style.display = t >= t0 && n < s.length ? '' : 'none';
  return n;
}

function renderCall(t) {
  const c = callState(t);
  el.docs.forEach((d, k) => { const on = !!c && k === c.i; if ((d.n.style.display === 'none') === on) d.n.style.display = on ? '' : 'none'; });
  el.tokRows.forEach((n, k) => { const on = !!c && k === c.i; if ((n.style.display === 'none') === on) n.style.display = on ? '' : 'none'; });
  el.fcRows.forEach((set, k) => { if (c && k === c.i) return; set.forEach((r) => { if (r.n.style.display !== 'none') r.n.style.display = 'none'; }); });
  el.apRows.forEach((set, k) => set.forEach((n, j) => { const on = !!c && k === c.i && t >= PLANS[k].T.fixes[j]; if ((n.style.display === 'none') === on) n.style.display = on ? '' : 'none'; }));
  if (!c) {
    setT(el.crumbB, '');
    el.crumbB.parentNode.classList.add('solo');
    renderSidebar(t, null);
    el.snack.style.opacity = '0';
    setT(el.dbarT, STR.noTitle);
    return;
  }
  const { m, title, T } = PLANS[c.i];
  const d = el.docs[c.i];
  const s = STORIES[m.story];

  // the release lands as a notice at the top of the canvas: its two sentences, verbatim
  const sp = outCubic(seg(t, T.says, T.says + 0.3));
  d.notice.style.opacity = sp.toFixed(3);
  d.notice.style.transform = sp >= 1 ? 'none' : `translateY(${((1 - sp) * 6).toFixed(2)}px)`;

  // the headline options: three pills, the chosen one pressed; the count follows the title as it is typed
  const op = outCubic(seg(t, T.opts, T.opts + 0.3));
  d.opts.style.opacity = op.toFixed(3);
  d.opts.style.transform = op >= 1 ? 'none' : `translateY(${((1 - op) * 6).toFixed(2)}px)`;
  d.optN.forEach((n, i) => {
    const isP = i === m.press;
    const pr = isP ? press(t, T.press, 0.08, 0.10, 0.16) : 0;
    n.classList.toggle('on', isP && t >= T.press - 0.04);
    n.style.transform = pr > 0 ? `scale(${(1 - 0.05 * pr).toFixed(4)})` : '';
    const ap = outCubic(seg(t, T.opts + i * 0.06, T.opts + i * 0.06 + 0.25));
    n.style.opacity = ap.toFixed(3);
  });

  // the title (the pressed headline), the lede (dateline first) and the second paragraph are typed in
  // (until its first character lands the title shows the editor's own placeholder)
  const nT = streamCount(title, T.title[0], T.cT, t);
  setT(d.tt, nT > 0 ? title.slice(0, nT) : STR.addTitle);
  d.tcar.style.display = t >= T.title[0] && nT < title.length ? '' : 'none';
  setT(d.cc, String(nT));
  d.title.classList.toggle('is-ph', nT === 0);
  const nL = typeInto(d.ltx, d.lcar, m.lede, T.lede[0], T.cL, t);
  d.lede.style.display = t >= T.lede[0] ? '' : 'none';
  const nG = typeInto(d.gtx, d.gcar, m.graf2, T.graf[0], T.cG, t);
  d.graf.style.display = t >= T.graf[0] ? '' : 'none';
  const land = (n, a) => {
    if (!n) return;
    const on = t >= a;
    if ((n.style.display === 'none') === on) n.style.display = on ? '' : 'none';
    const p = outCubic(seg(t, a, a + 0.22));
    n.style.opacity = p.toFixed(3);
    n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 8).toFixed(2)}px)`;
  };
  land(d.quote, T.quote);
  land(d.srch, T.src);
  land(d.src, T.src + 0.04);
  // the block in focus (the footer breadcrumb follows it)
  const focus = t < T.title[0] ? 'opts' : t < T.lede[0] ? 'title' : t < T.graf[0] ? 'lede' : t < T.quote || !d.quote ? (t < T.src ? 'graf' : 'src') : t < T.src ? 'quote' : 'src';
  // (the post title is not a block: with it in focus the breadcrumb reads just "Post")
  const crumb = focus === 'quote' ? STR.crumbQuote : focus === 'src' ? STR.crumbList : focus === 'lede' || focus === 'graf' ? STR.crumbPara : '';
  setT(el.crumbB, crumb);
  el.crumbB.parentNode.classList.toggle('solo', !crumb);
  for (const b of [d.title, d.lede, d.graf]) b.classList.toggle('is-sel', false);
  const selB = focus === 'title' ? d.title : focus === 'lede' ? d.lede : focus === 'graf' ? d.graf : null;
  if (selB) selB.classList.add('is-sel');

  // keep the block being written in view: the canvas scrolls so the line being typed (or the block landing) stays
  // inside the viewport. The target comes from each block's FINAL geometry (measured per ratio in layout()) times
  // how far it has run, so the scroll is smooth and a pure function of t; a block the scroll pushes past the top
  // edge fades out before its lines reach it, so no line is drawn half cut
  const G = el.lay.geo[c.i], vpH = el.vp.clientHeight, pad = 26;
  const reach = (g, a, p) => (g && t >= a ? g[0] + g[1] * clamp(p) + pad : 0);
  // (a block being typed is followed by its live bottom: the line being written is always in view)
  const live = (n, a) => (t >= a ? n.offsetTop + n.offsetHeight + pad : 0);
  const want = Math.max(
    reach(G.opts, T.opts, 1),
    live(d.title, T.title[0]),
    live(d.lede, T.lede[0]),
    live(d.graf, T.graf[0]),
    reach(G.quote, T.quote, outCubic(seg(t, T.quote, T.quote + 0.22))),
    reach(G.srch, T.src, outCubic(seg(t, T.src, T.src + 0.22))),
    reach(G.src, T.src + 0.04, outCubic(seg(t, T.src + 0.04, T.src + 0.26))));
  const y = Math.max(0, want - vpH);
  el.scroll.style.transform = `translateY(${(-y).toFixed(2)}px)`;
  // (the viewport's top edge is a soft mask as deep as the scroll has gone, up to FADE_TOP, so a line carried up past
  // it fades out instead of being cut; a block wholly above the fade is hidden)
  const ft = Math.min(y, FADE_TOP).toFixed(1) + 'px';
  if (el.vp.style.getPropertyValue('--cvfade') !== ft) el.vp.style.setProperty('--cvfade', ft);
  for (const b of d.blocks) {
    if (b.style.display === 'none') continue;
    const top = b.offsetTop - y, bot = top + b.offsetHeight;
    // (and a block still easing up from under the bottom edge stays clear until it is wholly in view)
    const keep = bot <= 2 ? 0 : clamp((vpH - bot) / 12);
    if (keep < 1) b.style.opacity = Math.min(+b.style.opacity || 1, keep).toFixed(3);
    b.style.visibility = keep <= 0 ? 'hidden' : '';
  }

  // header: the document bar names the post; Save draft / Submit for Review; the press is the spot's bold beat
  fitT(el.dbarT, nT > 0 ? title.slice(0, nT) : STR.noTitle, `${c.i}:${nT}`);
  const ep = press(t, T.end, 0.07, 0.08, 0.14);
  el.pub.style.transform = ep > 0 ? `scale(${(1 - 0.06 * ep).toFixed(4)})` : '';
  el.pub.classList.toggle('busy', t >= T.end - 0.02 && t < T.end + 0.16);
  const pending = t >= T.end;
  setT(el.saveT, pending ? STR.saved : STR.saveDraft);
  el.save.classList.toggle('is-saved', pending);
  el.undo.classList.toggle('on', t >= T.title[0]);
  // the snackbar confirms the submission, bottom left of the canvas
  const sn = outCubic(seg(t, T.end + 0.06, T.end + 0.24)) * (c.i < 2 ? 1 - seg(t, c.b - 0.08, c.b) : 1);
  el.snack.style.opacity = sn.toFixed(3);
  el.snack.style.transform = `translate(-50%, ${((1 - sn) * 10).toFixed(2)}px)`;

  renderSidebar(t, { c, d, m, s, T, nT, nL, nG, pending });
}

function renderSidebar(t, x) {
  if (!x) {
    setT(el.cardT, STR.noTitle); setT(el.cardS, ''); el.cardS.style.display = 'none';
    el.badge.style.display = 'none';
    setT(el.stL, STR.statusDraft); el.stV.classList.remove('is-pending');
    setT(el.slugV, ''); setT(el.dlV, ''); setT(el.catV, STR.uncategorized); el.chk.classList.remove('on');
    el.fcSum.style.display = 'none'; el.fcEmpty.style.display = ''; el.apEmpty.style.display = '';
    el.toks.classList.add('none');
    return;
  }
  const { c, d, m, s, T, nT, pending } = x;
  const title = PLANS[c.i].title;
  fitT(el.cardT, nT > 0 ? title.slice(0, nT) : STR.noTitle, `${c.i}:${nT}`);
  const wc = words(m.lede.slice(0, x.nL)) + words(m.graf2.slice(0, x.nG)) + (x.nL > 0 ? words(m.dateline) : 0) + (t >= T.quote && m.quote ? words(m.quote.text) + words(m.quote.who) : 0) +
    (t >= T.src ? words(STR.sources) + words(d.src.textContent) : 0);
  setT(el.cardS, wc ? STR.contentInfo(wc) : '');
  el.cardS.style.display = wc ? '' : 'none';
  // Status flips from Draft to Pending on the Submit for Review press, with a short flash
  setT(el.stL, pending ? STR.statusPending : STR.statusDraft);
  el.stV.classList.toggle('is-pending', pending);
  const fl = pending ? 1 - seg(t, T.end, T.end + 0.6) : 0;
  el.stV.style.setProperty('--fl', fl.toFixed(3));
  setT(el.slugV, `/${s.slug}/`);
  fitT(el.slugV, `/${s.slug}/`, String(c.i));
  setT(el.dlV, m.dateline);
  const catOn = t >= T.title[1];
  setT(el.catV, catOn ? m.category : STR.uncategorized);
  el.chk.classList.toggle('on', catOn);
  el.toks.classList.toggle('none', !(t >= T.title[1]));
  el.tokRows[c.i].style.opacity = outCubic(seg(t, T.title[1], T.title[1] + 0.25)).toFixed(3);

  // Fact check: each number in the story ticks once it is typed; the panel flips to checked as the story closes
  const facts = m.facts, ticks = PLANS[c.i].T.facts;
  let ok = 0;
  el.fcRows[c.i].forEach((r, j) => {
    const on = t >= ticks[j];
    if (on) ok++;
    r.n.classList.toggle('on', on);
    const p = outCubic(seg(t, ticks[j], ticks[j] + 0.18));
    r.tick.style.transform = on && p < 1 ? `scale(${lerp(0.4, 1, p).toFixed(3)})` : '';
  });
  const closed = t >= T.closed;
  el.fcSum.style.display = '';
  el.badge.style.display = '';
  el.fcEmpty.style.display = 'none';
  setT(el.fcN, !facts.length ? STR.fcNone : closed ? STR.factsMatch(facts.length, facts.length) : STR.factsMatch(ok, facts.length));
  setT(el.badge, closed ? STR.checked : STR.checking);
  el.badge.classList.toggle('ok', closed);
  // the badge flips over (1 -> 0 -> 1 on Y) as it turns from Checking to Checked: the repair ticket's flip
  const fs = seg(t, T.closed - 0.11, T.closed + 0.11);
  el.badge.style.transform = `scaleY(${Math.max(0.02, Math.abs(0.5 - fs) * 2).toFixed(3)})`;
  // the list shows as many whole rows as the panel holds, in tick order; once more have ticked than fit, the window
  // moves down with the ticks so the latest check (and the next one due) stays in view
  const rows = el.fcRows[c.i], order = rows.order;
  const cap = Math.max(1, Math.floor((el.fcList.clientHeight + 2) / FC_H));
  const from = clamp(ok + 1 - cap, 0, Math.max(0, order.length - cap));
  order.forEach((j, pos) => {
    const on = pos >= from && pos < from + cap;
    if ((rows[j].n.style.display === 'none') === on) rows[j].n.style.display = on ? '' : 'none';
  });
  // AP style: each fix is listed as the text that needed it is typed (in the title, the dateline or the body)
  const fx = PLANS[c.i].T.fixes;
  const nFix = fx.filter((a) => t >= a).length;
  el.apEmpty.style.display = nFix ? 'none' : '';
  el.apRows[c.i].forEach((n, j) => {
    if (t < fx[j]) return;
    const p = outCubic(seg(t, fx[j], fx[j] + 0.22));
    n.style.opacity = p >= 1 ? '' : p.toFixed(3);
    n.style.transform = p >= 1 ? '' : `translateY(${((1 - p) * 6).toFixed(2)}px)`;
    n.style.setProperty('--fl', (1 - seg(t, fx[j], fx[j] + 0.8)).toFixed(3));
  });
  // the fact itself, then the release's words beside it, fitted at a word boundary; a quote left with fewer than
  // three words is dropped rather than shown as a stub
  for (const f of el.fcList.querySelectorAll('.wp-fit')) {
    if (!f.offsetParent) continue;
    fitT(f, f._src);
    if (f.classList.contains('wp-fc-s')) {
      const thin = f.textContent !== f._src && f.textContent.split(' ').length < 3;
      const v = thin ? 'hidden' : '';
      if (f.style.visibility !== v) f.style.visibility = v;
    }
  }
}

// a HUD section that unfolds over [a, b] and folds over [c, d]: h drives its height; its contents (o) fade in only once
// it is open and fade out before it folds, so no line is ever drawn half clipped by the moving edge
function reveal(t, a, b, c, d) {
  const h = inOutCubic(seg(t, a, b)) * (1 - inOutCubic(seg(t, c, d)));
  const o = seg(t, b, b + 0.14) * (1 - seg(t, c - 0.14, c));
  return { h, o };
}

function renderHud(t) {
  const H = STR.hud;
  const cur = t < 1.50 ? H[0] : t < VOICE.a ? H[1] : t < 4.30 ? H[2] : t < LEARN.a ? H[3] : t < 8.30 ? H[4] : t < LAND.a ? H[5] : H[6];
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
  // what superbot learned (LEARN); it folds away again once the stories start, so the HUD stays small
  const R = reveal(t, 6.55, 6.85, ANSWER.a + 0.35, ANSWER.a + 0.75), ro = R.o;
  el.hudRes.style.opacity = R.o.toFixed(3);
  el.hudRes.style.maxHeight = (150 * R.h).toFixed(1) + 'px';
  el.resChips.forEach((n, i) => {
    const p = outCubic(seg(t, 6.62 + i * 0.15, 6.62 + i * 0.15 + 0.4));
    n.style.opacity = (p * ro).toFixed(3);
    // (each chip grows into place inside the open panel, so none is clipped by its bottom edge on the way in)
    n.style.transform = p >= 1 ? 'none' : `scale(${lerp(0.9, 1, p).toFixed(3)})`;
  });
  const S = reveal(t, ANSWER.a - 0.2, ANSWER.a + 0.2, 1e6, 1e6 + 1);
  el.hudStats.style.opacity = S.o.toFixed(3);
  el.hudStats.style.maxHeight = (34 * S.h).toFixed(1) + 'px';
  el.hudMark.render(t);
}

// the desk is authored in design px and scaled up to the frame, so its type reads at the size the real
// screens show it. Narrower ratios scale less and restack (wp.css). Same factors as the call-center spot.
const UI_SCALE = (W) => (W >= 1900 ? 1.3 : W >= 1400 ? 1.2 : W >= 1000 ? 1.1 : 1.05);
// every block of a story at its final size: [top, height] in the scroll box, measured with the whole story in
// place (then emptied again; render() refills what t calls for)
function measureDocs() {
  const vc = el.vCall.style.visibility;
  el.vCall.style.visibility = 'hidden';
  el.vCall.style.display = '';
  const geo = el.docs.map((d, k) => {
    const { m, title } = PLANS[k];
    d.n.style.display = '';
    for (const b of d.blocks) { b.style.display = ''; b.style.visibility = ''; }
    d.tt.textContent = title; d.ltx.textContent = m.lede; d.gtx.textContent = m.graf2;
    const g = (n) => (n ? [n.offsetTop, n.offsetHeight] : null);
    const out = { opts: g(d.opts), title: g(d.title), lede: g(d.lede), graf: g(d.graf), quote: g(d.quote), srch: g(d.srch), src: g(d.src) };
    d.tt.textContent = ''; d.ltx.textContent = ''; d.gtx.textContent = '';
    d.n.style.display = 'none';
    return out;
  });
  el.vCall.style.visibility = vc;
  return geo;
}

function layout(W) {
  const key = `${W}|${fontState()}`;
  if (el.lay && el.lay.key === key) return el.lay;
  const S = UI_SCALE(W);
  el.wp.style.width = (W / S).toFixed(2) + 'px';
  el.wp.style.height = (1080 / S).toFixed(2) + 'px';
  el.wp.style.transform = `scale(${S})`;
  const cs = getComputedStyle(el.qListEl);
  const listH = el.qListEl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  el.lay = { key, W, S, rows: Math.max(1, Math.floor(listH / ROW_H)), padT: parseFloat(cs.paddingTop), geo: measureDocs() };
  // the Stylebook viewport: as many WHOLE rows as the modal holds
  el.actVp.style.flex = ''; el.actVp.style.height = '';
  const vpRows = Math.max(1, Math.floor(el.actVp.clientHeight / AROW_H));
  el.actVp.style.flex = 'none'; el.actVp.style.height = `${vpRows * AROW_H}px`;
  return el.lay;
}

export function render(t, W = 1920) {
  if (!el) return;
  layout(W);
  for (const n of el.fits) if (n.offsetParent) fitT(n, n._src);
  const waiting = t < QWAIT_IN.b ? Math.round(N * outCubic(seg(t, QWAIT_IN.a, QWAIT_IN.b)))
    : t < ANSWER.a ? N
      : ROWS.filter((q) => t < q.tAns).length;
  renderChrome(t);
  renderViews(t);
  renderQueue(t, waiting);
  renderLearn(t);
  renderCall(t);
  renderHud(t);
}

export default { id: 'wp', DUR, mount, render };

// plan beat (chat.js imports it as `code`): Claude Opus 5.5 writes Sam's 12-week half marathon plan itself, as a
// document artifact in the hub thread (title bar, a status that streams "Writing N workouts" and resolves to a green
// check, then the content). The content is the plan from beats/plan-data.js, nothing restated: a phase band down the
// weeks (Base, Build, Peak, Taper), the week grid streaming in row by row (Tue, Thu with its structure bar, Sat, the
// Sunday long run, weekly miles, a quiet cutback/taper tag), and week 9's tempo as the expanded key session with its
// full structure graph (bar width = distance, bar height = intensity from the zone paces) and the coach's line.
// The camera (scenes/tabs.js via chat.js FOCUS) pushes in on the panel while it writes: T.focus marks are fixed.
// Every moving value is written from t in render, so ?t= and __AD.seek(t) freeze any frame.
import { seg, outCubic, streamCount } from '../../../lib.js';
import { GOAL, PACES, PACE_SEC, ZONES, PHASES, PLAN, WEEKS, CUTBACK, TAPER, PEAK, START, RACE, phaseOf, md } from './plan-data.js?v=69889d8f';

const N_WEEKS = PLAN.length, PER_WEEK = PLAN[0].length, N_RUNS = N_WEEKS * PER_WEEK;
const SAY = `Wrote your ${N_WEEKS}-week plan: ${PER_WEEK} runs a week, paced for a ${GOAL.replace(/:00$/, '')} finish`;
const TITLE = 'Half Marathon Plan';
const SUB = `${N_WEEKS} weeks, ${md(START)} to ${md(RACE.date)}, goal ${GOAL}`;
const DAYS = ['Tue', 'Thu', 'Sat', 'Sun'];
const KEY_WEEK = 9; // the expanded key session: week 9's Thursday tempo (peak phase)
const KEY = PLAN[KEY_WEEK - 1].find((w) => w.day === 'Thu');

// zone of a segment -> the pace key it runs at, and its intensity (bar height share): neutral zones sit at the easy
// floor; the rest rise with speed, scaled between the easy pace and the interval pace (PACE_SEC)
const PACE_KEY = { wu: 'easy', cd: 'easy', jog: 'easy', easy: 'easy', tempo: 'tempo', int: 'intervals', race: 'race' };
const FLOOR = 0.3;
const lift = (z) => FLOOR + (1 - FLOOR) * Math.max(0, (PACE_SEC.easy - PACE_SEC[PACE_KEY[z]]) / (PACE_SEC.easy - PACE_SEC.intervals));
const ZCLS = (z) => (PACE_KEY[z] === 'easy' ? 'n' : z === 'int' ? 'i' : z); // n neutral, tempo, i intervals, race
const mi = (v) => `${v} mi`;

const THU_MAX = Math.max(...PLAN.map((wk) => wk.find((w) => w.day === 'Thu').miles));
const MINI_W = 40; // design px for the longest Thursday; every mini bar shares the scale (width = distance)
const MINI_H = 12;

const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (as the source)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const ROW0 = 0.3;        // the panel is up, then week 1 lands
const ROW_STEP = 0.125;  // one week row after the next
const ROW_IN = 0.14;     // a row's entrance
const CELL_STEP = 0.035; // Tue, Thu, Sat, Sun land in order inside the row (each counts one workout)
const BAR_IN = 0.16;     // the Thursday structure bar draws left to right (distance order)
const TOT_AT = 0.17;     // the row's weekly total lands last
const KEY_AT = 0.1;      // week 9's row has landed, then the key session card rises
const KEY_IN = 0.2;
const GRAPH_AT = 0.12, GRAPH_IN = 0.3; // key card up, then its structure graph draws
const DESC_AT = 0.3;     // the coach's line under the graph
const DONE_AT = 2.144; /* deliberate */ // the plan is written: status check (keeps the source's focus marks exactly)
const POP = 0.176;       // done: the status check pops in
const SETTLE = 0.24;     // done: the panel's last change (nozoom end, as the source's pulse)
const HOLD_DONE = 0.4; /* deliberate */ // done: the finished plan reads, pushed in, before the camera pulls back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const DOC = '<svg class="pl-doc" viewBox="0 0 16 16"><path d="M4 1.75h5.25L12.5 5v9.25H4z"/><path d="M9 1.75V5.25h3.5"/><path d="M6 8h4.5M6 10.25h4.5M6 12.5h2.75"/></svg>';
const TICK = '<svg class="pl-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

// a structure bar from segs as divs: left/width in % of the run's distance, height in % of the bar box
function barHTML(w, cls) {
  let x = 0;
  const segs = w.segs.map((s) => {
    const h = `<i class="pl-z pl-z-${ZCLS(s.z)}" style="left:${((x / w.miles) * 100).toFixed(3)}%;width:${((s.mi / w.miles) * 100).toFixed(3)}%;height:${(lift(s.z) * 100).toFixed(1)}%"></i>`;
    x += s.mi;
    return h;
  }).join('');
  return `<span class="${cls}" style="width:${MINI_W}px"><span class="pl-mb" style="width:${((w.miles / THU_MAX) * 100).toFixed(3)}%">${segs}</span></span>`;
}

function tagOf(week) {
  if (CUTBACK.includes(week)) return 'Cutback';
  if (TAPER.includes(week)) return 'Taper';
  return '';
}

function rowHTML(wk, i) {
  const week = i + 1, ph = phaseOf(week);
  const first = ph.from === week, last = ph.to === week;
  const by = Object.fromEntries(wk.map((w) => [w.day, w]));
  const cell = (d) => {
    const w = by[d];
    if (d === 'Thu') return `<span class="pl-c pl-thu">${barHTML(w, 'pl-mini')}<b>${esc(w.name)}</b></span>`;
    return `<span class="pl-c pl-${d.toLowerCase()}${w.kind === 'race' ? ' pl-race' : ''}">${mi(w.miles)}</span>`;
  };
  const tag = tagOf(week);
  return `<div class="pl-row${week === KEY_WEEK ? ' pl-key' : ''}">
    <span class="pl-ph${first ? ' pl-ph-a' : ''}${last ? ' pl-ph-z' : ''}">${first ? esc(ph.name) : ''}</span>
    <span class="pl-wk">${week}</span>${DAYS.map(cell).join('')}
    <span class="pl-tot">${mi(WEEKS[i])}</span><span class="pl-tag">${tag ? `<i>${tag}</i>` : ''}</span>
  </div>`;
}

// the key session's structure graph: inline SVG in design px, bars on a baseline, paces above, a mile axis below
const G = { w: 168, top: 16, h: 58, axis: 14 };
function graphHTML(w) {
  const k = G.w / w.miles, base = G.top + G.h;
  let x = 0;
  const bars = [], labels = [];
  w.segs.forEach((s) => {
    const bw = s.mi * k, bh = lift(s.z) * G.h;
    bars.push(`<rect class="pl-z-${ZCLS(s.z)}" x="${(x + 0.75).toFixed(2)}" y="${(base - bh).toFixed(2)}" width="${(bw - 1.5).toFixed(2)}" height="${bh.toFixed(2)}"/>`);
    labels.push(`<text class="pl-gp" x="${(x + bw / 2).toFixed(2)}" y="${(base - bh - 4).toFixed(2)}">${PACES[PACE_KEY[s.z]]}</text>`);
    x += bw;
  });
  const n = Math.floor(w.miles);
  const ticks = Array.from({ length: n + 1 }, (_, m) => {
    const a = m === 0 ? 'start' : m === n ? 'end' : 'middle';
    return `<text class="pl-gx" text-anchor="${a}" x="${(m * k).toFixed(2)}" y="${base + G.axis - 1}">${m === n ? mi(m) : m}</text>`;
  }).join('');
  const H = base + G.axis;
  return `<svg class="pl-graph" viewBox="0 0 ${G.w} ${H}" width="${G.w}" height="${H}">
    <clipPath id="pl-clip"><rect class="pl-clip" x="0" y="0" width="0" height="${H}"/></clipPath>
    <line class="pl-gb" x1="0" x2="${G.w}" y1="${base + 0.5}" y2="${base + 0.5}"/>
    <g clip-path="url(#pl-clip)">${bars.join('')}${labels.join('')}</g>${ticks}
  </svg>`;
}

function keyHTML() {
  const ph = phaseOf(KEY_WEEK), wkMi = WEEKS[KEY_WEEK - 1];
  const legend = ZONES.map((z) => `<span class="pl-lg"><i class="pl-dot pl-z-${ZCLS(z.key)}"></i>${esc(z.name)}<b>${PACES[PACE_KEY[z.key]]}</b></span>`).join('');
  return `<div class="pl-ks">
    <div class="pl-ks-e">Key session, week ${KEY_WEEK}</div>
    <div class="pl-ks-t">${esc(KEY.name)}, ${mi(KEY.miles)} <small>${KEY.day} ${md(KEY.date)}</small></div>
    <div class="pl-ks-m">${esc(ph.name)} phase, ${wkMi === PEAK ? 'peak week' : 'week'} of ${mi(wkMi)}</div>
    ${graphHTML(KEY)}
    <div class="pl-ks-d">${esc(KEY.desc)}</div>
    <div class="pl-legend">${legend}</div>
  </div>`;
}

const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };
function rise(n, p, dy) {
  const e = outCubic(p);
  n.style.opacity = e.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px)`;
}

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.rows = PLAN.map((_, i) => T.card + ROW0 + i * ROW_STEP);
    T.key = T.rows[KEY_WEEK - 1] + KEY_AT;
    T.done = r + DONE_AT; // after the last row's total (T.rows[11] + TOT_AT + ROW_IN) and the key graph
    // zoom cut only (chat.js passes opts.zoom; nozoom has no camera move): the camera (scenes/tabs.js, via chat.js
    // FOCUS) pushes in on the panel once it is up, holds while the plan writes, and pulls back to rest after done
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL };
    }
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + SETTLE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const card = x.el(`<div class="pl-x">
      <div class="pl-hd">
        ${DOC}<span class="pl-ttl"><b>${TITLE}</b><small>${esc(SUB)}</small></span>
        <em class="pl-st"><i class="pl-spin"></i>${TICK}<span class="pl-sl">Writing</span></em>
      </div>
      <div class="pl-bd">
        <div class="pl-grid">
          <div class="pl-row pl-head"><span>Phase</span><span class="pl-wk">Week</span>${DAYS.map((d) => `<span class="pl-c">${d}</span>`).join('')}<span class="pl-tot">Total</span><span></span></div>
          ${PLAN.map(rowHTML).join('')}
        </div>
        ${keyHTML()}
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const rows = [...card.querySelectorAll('.pl-row:not(.pl-head)')].map((n, i) => ({
      n, a: T.rows[i],
      wk: n.querySelector('.pl-wk'), tot: n.querySelector('.pl-tot'), tag: n.querySelector('.pl-tag'),
      cells: [...n.querySelectorAll('.pl-c')], bar: n.querySelector('.pl-mini'),
    }));
    const ks = $('.pl-ks'), clip = $('.pl-clip'), ksd = $('.pl-ks-d'), legend = $('.pl-legend');
    const st = $('.pl-st'), sl = $('.pl-sl'), spin = $('.pl-spin'), tk = st.querySelector('.pl-tk');
    let said = -1;

    return {
      nodes: [say, card],
      focus: T.focus ? card : null, // the camera's target while T.focus runs (chat.js FOCUS; zoom cut only)
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS_SAY, t);
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        rise(card, seg(t, T.card, T.card + CARD_IN), 16);

        // week rows: the row (phase band, week number) enters, then its four workouts land in day order, the
        // Thursday bar draws by distance, and the weekly total lands; every landed workout counts once
        let wrote = 0;
        rows.forEach((o) => {
          const p = outCubic(seg(t, o.a, o.a + ROW_IN));
          o.n.style.opacity = p.toFixed(3);
          o.n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 6).toFixed(2)}px)`;
          o.cells.forEach((c, j) => {
            const ca = o.a + CELL_STEP * (j + 1);
            c.style.opacity = outCubic(seg(t, ca, ca + ROW_IN)).toFixed(3);
            if (t >= ca) wrote++;
          });
          const ba = o.a + CELL_STEP * 2;
          const bp = outCubic(seg(t, ba, ba + BAR_IN));
          o.bar.style.clipPath = bp >= 1 ? 'none' : `inset(0 ${((1 - bp) * 100).toFixed(2)}% 0 0)`;
          const ta = outCubic(seg(t, o.a + TOT_AT, o.a + TOT_AT + ROW_IN)).toFixed(3);
          o.tot.style.opacity = ta; o.tag.style.opacity = ta;
        });

        // the key session: card rises once week 9 is written, its graph draws left to right, then the coach's line
        rise(ks, seg(t, T.key, T.key + KEY_IN), 10);
        const g = outCubic(seg(t, T.key + GRAPH_AT, T.key + GRAPH_AT + GRAPH_IN));
        clip.setAttribute('width', (g * G.w).toFixed(2));
        const dIn = outCubic(seg(t, T.key + DESC_AT, T.key + DESC_AT + KEY_IN)).toFixed(3);
        ksd.style.opacity = dIn; legend.style.opacity = dIn;

        // status: a spinner and "Writing N workouts" counting the landed cells, then a check and "Wrote 48 workouts"
        const d = t >= T.done;
        setText(sl, d ? `Wrote ${N_RUNS} workouts` : `Writing ${wrote} workouts`);
        st.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        tk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';
      },
    };
  },
};

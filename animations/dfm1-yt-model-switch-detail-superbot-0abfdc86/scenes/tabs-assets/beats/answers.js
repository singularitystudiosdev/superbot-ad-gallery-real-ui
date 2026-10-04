// Answers beat: Gemini watched the 14:32 video and grounds every top comment in a moment of it. Its line streams and a
// wide evidence card rises. Top: the video (its real thumbnail, img/thumb-mics.jpg, and title) with a clock, then a
// scrub bar for LEN_S whose ticks are the comment-density heat of MOMENTS (height from n, a label at each peak). A
// playhead sweeps the whole video once; as it reaches each ANSWERS timestamp a marker chip lands under the track and
// that commenter's evidence row lands below: avatar and first name, the timestamp chip, the evidence kind, the line or
// reading, and the fact. Four rows stack on the left in the order the video reaches them; Priya's, the strongest
// answer, lands as its own panel on the right with a self-made data view: the noise floor of all 12 mics at 7:05,
// the $49 dynamic best at -61 dB, the condenser average at -47 dB. Then the spinner resolves to the check and the
// done line lands. In the zoom cut the camera pushes in on the card while it builds and pulls back before the next
// pill (chat.js FOCUS, the replies.js pattern). Pure function of t: every value on screen is written from t, so ?t= and
// __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { VIDEO, LEN_S, MOMENTS, TOP, ANSWERS, byId } from '../script.js?v=0abfdc86';

const SAY = `Watched all ${VIDEO.len} and found the answer behind each top comment.`;
const DONE = `${ANSWERS.length} answers found in the video, each with a timestamp`;
// Priya's panel: the 12 mics' noise floors read off the 7:05 side-by-side, sorted quietest first (dB). The first is
// the $49 dynamic (ANSWERS[0].fact: -61 dB, best of 12); the last eight are the condensers, which average -47 dB.
const FLOOR = [-61, -57, -55, -53, -49, -48, -48, -47, -47, -46, -46, -45];
const CONDENSER_AVG = FLOOR.slice(4).reduce((a, b) => a + b, 0) / 8;   // -47, the fact's figure
const DB0 = -70, DB1 = -40;            // the chart's floor and ceiling: a bar's height is how far above -70 dB it sits
// the heat strip under the scrub bar: TICKS ticks across LEN_S; each is a baseline plus a bump at every moment
const TICKS = 112;
const SPREAD = 11;                     // a moment's bump width, seconds (gaussian sigma)
const NMAX = Math.max(...MOMENTS.map((m) => m.n));
// a peak label hangs off its peak's left or right edge where two peaks sit close, else it is centred on it
const ANCHOR = { 372: 'end', 425: 'start', 842: 'end' };
// the marker chips the same way: 4:38 hangs left and 7:05 right so the 6:12 chip fits centred between them
const CHIP = { 278: 'end', 425: 'start', 842: 'end' };
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.04;                   // reply start to the line's first character
const CARD = 0.08;                     // reply start to the card rising in
const RISE = 0.24;                     // the card rising in
const FOCUS_AT = 0.2; /* deliberate */ // the card has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint (tabs.js)
const FOCUS_PULL = 0.36; /* deliberate */ // pull-back, inOutCubic (tabs.js)
const SWEEP_AT = 0.32;                 // the card to the playhead leaving 0:00
const SWEEP = 0.92; /* deliberate */   // the playhead crossing all 14:32, linear, so each answer lands at its timestamp
const ROW_IN = 0.24;                   // a marker chip and its evidence row landing as the playhead reaches it
const BARS_AT = 0.06;                  // Priya's row landing to the first chart bar growing
const BAR_STEP = 0.03;                 // one bar to the next
const BAR_IN = 0.24;                   // a bar growing
const AVG_AT = 0.2;                    // Priya's row landing to the condenser-average line drawing
const AVG_IN = 0.3;                    // the average line drawing left to right
const DONE_AT = 0.1;                   // the sweep finished to the done line
const DONE_IN = 0.24;                  // the done line rising in
const HOLD = 0.06;                     // the done line landed to the camera pulling back (the card reads while it builds)

const pct = (v) => `${(v * 100).toFixed(3)}%`;
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const first = (id) => byId(TOP, id).name.split(' ')[0];
// the evidence rows in the order the playhead reaches them; Priya's is the panel, not a row
const ROWS = ANSWERS.filter((a) => a.id !== 'priya').sort((a, b) => a.s - b.s);
const PRIYA = byId(ANSWERS, 'priya');
// heat: tick i's height share (0..1) from the moments' comment counts
const HEAT = Array.from({ length: TICKS }, (_, i) => {
  const s = ((i + 0.5) / TICKS) * LEN_S;
  const v = MOMENTS.reduce((a, m) => a + m.n * Math.exp(-0.5 * ((s - m.s) / SPREAD) ** 2), 0);
  return Math.min(1, 0.07 + v / NMAX);
});
const peakH = (m) => Math.min(1, 0.07 + m.n / NMAX);

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD;
    T.p0 = T.card + SWEEP_AT;
    T.p1 = T.p0 + SWEEP;
    // the sweep is linear in video time, so each answer lands the moment the playhead reaches its timestamp
    T.at = Object.fromEntries(ANSWERS.map((a) => [a.id, T.p0 + SWEEP * (a.s / LEN_S)]));
    T.bars = T.at.priya + BARS_AT;
    T.done = T.p1 + DONE_AT;
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + DONE_IN + HOLD, back: T.done + DONE_IN + HOLD + FOCUS_PULL };
    }
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + DONE_IN, r + SAY_AT + SAY.length / CPS,
      T.bars + BAR_STEP * (FLOOR.length - 1) + BAR_IN);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const av = (id) => { const p = byId(TOP, id); return `<i class="ev-av" style="background: ${p.color}">${x.esc(p.name[0])}</i>`; };
    const head = (a) => `<span class="ev-l1"><b>${x.esc(first(a.id))}</b><i class="ev-ts">${x.esc(a.at)}</i><small>${x.esc(a.kind)}</small></span>`;
    const quote = (a) => `<span class="ev-q">“${x.esc(a.quote)}”</span>`;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="ev-card">
      <div class="ev-hd"><span class="ev-st"><i class="ev-spin"></i>${x.OK}</span><img class="ev-th" src="${x.img('thumb-mics.jpg')}" width="1280" height="720" alt=""/><b>${x.esc(VIDEO.title)}</b><span class="ev-clk"><span class="ev-now">0:00</span> / ${x.esc(VIDEO.len)}</span></div>
      <div class="ev-scrub">
        <div class="ev-heat">${HEAT.map((h) => `<i style="height: ${pct(h)}"></i>`).join('')}</div>
        <div class="ev-heat ev-played">${HEAT.map((h) => `<i style="height: ${pct(h)}"></i>`).join('')}</div>
        ${MOMENTS.map((m) => `<span class="ev-pk ev-${ANCHOR[m.s] || 'mid'}" style="left: ${pct(m.s / LEN_S)}; bottom: calc(var(--ev-hh) * ${peakH(m).toFixed(3)} + 28px)">${x.esc(m.what)}</span>`).join('')}
        <i class="ev-trk"><i class="ev-fill"></i></i>
        ${ANSWERS.map((a) => `<span class="ev-mk ev-${CHIP[a.s] || 'mid'}" style="left: ${pct(a.s / LEN_S)}"><i class="ev-dot" style="background: ${byId(TOP, a.id).color}"></i>${x.esc(a.at)}</span>`).join('')}
        <i class="ev-ph"><i class="ev-knob"></i></i>
      </div>
      <div class="ev-body">
        <div class="ev-list">${ROWS.map((a) => `<div class="ev-row">${av(a.id)}<span class="ev-tx">${head(a)}${quote(a)}<span class="ev-f">${x.esc(a.fact)}</span></span></div>`).join('')}</div>
        <div class="ev-pri">
          <div class="ev-row">${av('priya')}<span class="ev-tx">${head(PRIYA)}${quote(PRIYA)}</span></div>
          <div class="ev-ch">
            <small>Noise floor at ${x.esc(PRIYA.at)}, lower is quieter</small>
            <div class="ev-plot">
              <span class="ev-bars">${FLOOR.map((v, i) => `<i class="${i === 0 ? 'ev-best' : ''}" style="height: ${pct((v - DB0) / (DB1 - DB0))}"></i>`).join('')}</span>
              <span class="ev-avg" style="bottom: ${pct((CONDENSER_AVG - DB0) / (DB1 - DB0))}"><i></i><em>Condenser avg ${CONDENSER_AVG} dB</em></span>
            </div>
            <span class="ev-bl"><i></i>$49 dynamic, ${FLOOR[0]} dB</span>
          </div>
          <span class="ev-f">${x.esc(PRIYA.fact)}</span>
        </div>
      </div>
      <div class="ev-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const played = $('.ev-played'), fill = $('.ev-fill'), ph = $('.ev-ph'), now = $('.ev-now');
    const marks = [...card.querySelectorAll('.ev-mk')];             // in ANSWERS order
    const rows = [...card.querySelectorAll('.ev-list .ev-row')];     // in ROWS order
    const pri = $('.ev-pri'), bars = [...card.querySelectorAll('.ev-bars i')], bl = $('.ev-bl'), avg = $('.ev-avg');
    const avgLine = avg.firstElementChild, avgTx = avg.lastElementChild;
    const ft = $('.ev-ft'), spin = $('.ev-spin'), ok = $('.ev-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, nowS = -1;
    const land = (node, t0, t, dy = 4) => {
      const q = outCubic(seg(t, t0, t0 + ROW_IN));
      node.style.opacity = q.toFixed(3);
      node.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * dy).toFixed(2)}px)`;
      return q;
    };

    return {
      nodes: [say, card],
      focus: T.focus ? card : null,
      marks: [[T.r, say], [T.card, card], [T.done, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the playhead: linear across the video; the heat it has passed turns accent, the clock reads its position
        const p = seg(t, T.p0, T.p1);
        played.style.clipPath = `inset(0 ${pct(1 - p)} 0 0)`;
        fill.style.width = pct(p);
        ph.style.left = pct(p);
        ph.style.opacity = (p > 0 && p < 1 ? Math.min(1, p * 12, (1 - p) * 12) : 0).toFixed(3);
        const s = Math.floor(p * LEN_S);
        if (s !== nowS) { now.textContent = p >= 1 ? VIDEO.len : clock(s); nowS = s; }

        // each answer: its marker chip pops under the track and its row (or Priya's panel) lands
        ANSWERS.forEach((a, i) => {
          const q = outCubic(seg(t, T.at[a.id], T.at[a.id] + ROW_IN));
          marks[i].style.opacity = q.toFixed(3);
          marks[i].style.scale = q >= 1 ? '' : lerp(0.85, 1, q).toFixed(4);   // scale, not transform: the anchor owns that
        });
        ROWS.forEach((a, i) => land(rows[i], T.at[a.id], t));
        land(pri, T.at.priya, t);

        // Priya's chart: the bars grow quietest first, the best one named under the axis, then the condenser average draws
        bars.forEach((b, i) => {
          const q = outCubic(seg(t, T.bars + i * BAR_STEP, T.bars + i * BAR_STEP + BAR_IN));
          b.style.transform = `scaleY(${q.toFixed(4)})`;
        });
        bl.style.opacity = outCubic(seg(t, T.bars + 0.1, T.bars + 0.1 + BAR_IN)).toFixed(3);
        const g = outCubic(seg(t, T.at.priya + AVG_AT, T.at.priya + AVG_AT + AVG_IN));
        avgLine.style.transform = `scaleX(${g.toFixed(4)})`;
        avgTx.style.opacity = seg(g, 0.5, 1).toFixed(3);

        // done watching: the spinner resolves to the check as the sweep ends, then the done line lands
        const d = outCubic(seg(t, T.p1, T.p1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.p1 - 0.08, T.p1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        const f = outCubic(seg(t, T.done, T.done + DONE_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};

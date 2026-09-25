// rules.js: in superbot's own thread the user asks why ChatGPT is slow. Superbot reads ChatGPT's context, lists
// the rules that load into every ChatGPT turn but never apply there, and one press on Optimize unloads them: the
// rows strike and fold away, the per-turn token count and its meter fall, and superbot confirms the other rules
// still load where they apply (rules are scoped per lane in the app).
import { clamp, lerp, seg, outCubic, inOutCubic, outBack } from '../lib.js';
import {
  icon, mountHub, place, camera, centerOf, cursorAt, ringAt, pathDesign, railSel, reveal, viewHTML, thread, draft,
  streamWords, rise, nativeTitle, toolHTML, tool, words,
} from './hubkit.js';

const C = {
  cur: 0.3, toComp: [0.35, 0.95], clickComp: 1.02,
  type: [1.15, 3.0], send: 3.2, u: 3.26,
  tool: 3.5, toolDone: 4.3, a1: 4.4, a1words: 4.5,
  card: 5.3, camIn: [5.4, 6.6],
  toOpt: [6.7, 7.3], clickOpt: 7.42, busy: [7.46, 8.05],
  strike: 7.6, step: 0.17, meter: [7.6, 8.95],
  a2: 9.25, a2words: 9.35, camOut: [9.1, 10.4],
  dur: 12.4,
};
const ASK = 'ChatGPT is really slow, do I have any unneeded rules?';
const A1 = 'ChatGPT loads 12 rules into every turn. 5 of them never apply to what you do there.';
const A2 = 'Done. ChatGPT now loads 7 rules, 5.1k tokens a turn. The other 5 still load in the projects they belong to.';
const RULES = [
  ['python-style.mdc', 'Python only', '3.2k'],
  ['roblox-luau.mdc', 'Roblox only', '4.1k'],
  ['deploy-legacy.md', 'Duplicate of deploy.md', '1.9k'],
  ['api-notes-2024.md', 'Stale · 94 days', '2.3k'],
  ['launch-checklist.md', 'Never matched a turn', '1.8k'],
];
const FULL = 18.4, LEAN = 5.1;

const DOC = '<svg class="rl-doc" viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const cardHTML = () => `<div class="rl-card">
  <div class="rl-h"><span class="vz-tile t-gpt">${icon('openai')}</span><b>ChatGPT</b><span class="rl-sub">rules loaded every turn</span><span class="rl-tok"><span class="n">18.4k</span> tokens</span></div>
  <div class="rl-meter"><i></i></div>
  <div class="rl-rows">${RULES.map(([n, why, sz], i) => `<div class="rl-row" data-i="${i}"><span class="rl-box">${CHECK}</span>${DOC}<span class="rl-n"><span>${n}</span><i class="rl-strike"></i></span><span class="rl-why">${why}</span><span class="rl-sz">${sz}</span></div>`).join('')}</div>
  <div class="rl-more"><svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>7 more are in use and stay</div>
  <div class="rl-foot"><span class="rl-save">Saves <b>13.3k tokens</b> on every ChatGPT turn</span><span class="rl-opt"><span class="ic-spark">✦</span><span class="ic-spin"></span><span class="ic-ok">${CHECK}</span><span class="lb">Optimize</span></span></div>
</div>`;

export default {
  dur: C.dur,
  mount(section, ctx) {
    const R = mountHub(section, ctx, viewHTML('sb', {
      msgs: [
        { id: 'u', who: 'u', text: ASK },
        { id: 'tool', who: 'raw', html: toolHTML('Reading ChatGPT’s context') },
        { id: 'a1', who: 'a', text: A1 },
        { id: 'card', who: 'raw', html: cardHTML() },
        { id: 'a2', who: 'a', text: A2 },
      ],
    }));
    nativeTitle(R, 'unneeded rules');
    const v = R.views.sb;
    R.card = v.m.card.querySelector('.rl-card');
    R.rows = [...R.card.querySelectorAll('.rl-row')];
    R.tok = R.card.querySelector('.rl-tok .n');
    R.meter = R.card.querySelector('.rl-meter i');
    R.opt = R.card.querySelector('.rl-opt');
    R.toolEl = v.m.tool.querySelector('.vz-tool');
    return R;
  },

  render(t, ctx) {
    const R = ctx.state;
    place(R, ctx.W);
    const v = R.views.sb;
    railSel(R, 'sb', 'sb', 1);
    reveal(R, 'sb', 1);

    // ---- camera: in on the card for the optimize, out for superbot's confirmation
    const zin = inOutCubic(seg(t, ...C.camIn)), zout = inOutCubic(seg(t, ...C.camOut));
    // focus where the card sits while the zoom runs (only superbot's last line is still below the fold then)
    const fc = R.cardC || (v.heights ? (R.cardC = centerOf(R, R.card)) : null);
    camera(R, 1 + 0.15 * zin * (1 - zout), 520, fc ? fc.y + v.heights.a2 : 420);

    // ---- the composer and the ask
    const text = t >= C.type[0] && t < C.send ? ASK.slice(0, Math.round(ASK.length * seg(t, ...C.type))) : '';
    const idle = t >= C.clickComp && t < C.type[0];
    draft(R, 'sb', text, { press: pulse(t, C.send), caretIdle: idle && Math.floor(t * 2.2) % 2 === 0 });

    // ---- the reply, in five slots. The stack sits on the feed's bottom edge, so rows folding out of the card let
    // everything above it settle down, the way a real thread does.
    const rowH = R.rowH || (R.rowH = R.rows[0].offsetHeight || 30);
    thread(R, 'sb', { u: rise(t, C.u), tool: rise(t, C.tool), a1: rise(t, C.a1), card: rise(t, C.card, 0.5), a2: rise(t, C.a2) }, 0);
    tool(R.toolEl, t, C.tool, C.toolDone, 'Read ChatGPT’s context · <b>12 rules</b>');
    streamWords(v.m.a1, C.a1words, 12, t);
    streamWords(v.m.a2, C.a2words, 12, t);

    // card entrance: rows cascade in
    R.rows.forEach((row, i) => {
      const e = outCubic(seg(t, C.card + 0.12 + i * 0.07, C.card + 0.5 + i * 0.07));
      const s0 = C.strike + i * C.step;
      const st = inOutCubic(seg(t, s0, s0 + 0.26));          // the strike line draws across the name
      const fold = outCubic(seg(t, s0 + 0.28, s0 + 0.6));    // then the row folds away
      row.style.opacity = (e * (1 - 0.55 * st) * (1 - fold)).toFixed(3);
      row.style.transform = `translateX(${((1 - e) * 10 + fold * 14).toFixed(2)}px)`;
      row.style.height = (rowH * (1 - fold)).toFixed(2) + 'px';
      row.style.marginTop = row.style.marginBottom = '0px';
      row.querySelector('.rl-strike').style.transform = `scaleX(${st.toFixed(3)})`;
      row.querySelector('.rl-box').style.opacity = (1 - st).toFixed(3);
    });

    // the token count and its meter fall together
    const m = inOutCubic(seg(t, ...C.meter));
    R.tok.textContent = lerp(FULL, LEAN, m).toFixed(1) + 'k';
    R.meter.style.transform = `scaleX(${lerp(1, LEAN / FULL, m).toFixed(4)})`;
    R.card.querySelector('.rl-save').style.opacity = (1 - seg(t, C.busy[1], C.busy[1] + 0.25)).toFixed(3);

    // the Optimize button: hover, press, spin, done
    const hov = seg(t, C.toOpt[1] - 0.15, C.toOpt[1]);
    const busy = t >= C.busy[0] && t < C.busy[1], done = t >= C.busy[1];
    R.opt.classList.toggle('busy', busy);
    R.opt.classList.toggle('done', done);
    R.opt.querySelector('.lb').textContent = done ? 'Optimized' : busy ? 'Optimizing' : 'Optimize';
    R.opt.querySelector('.ic-spin').style.transform = `rotate(${((t * 420) % 360).toFixed(1)}deg)`;
    R.opt.style.transform = `scale(${(1 + 0.03 * hov * (done ? 0 : 1) - 0.06 * pulse(t, C.clickOpt)).toFixed(3)})`;
    R.opt.style.filter = `brightness(${(1 + 0.15 * hov * (done ? 0 : 1)).toFixed(3)})`;
    const okPop = outBack(seg(t, C.busy[1], C.busy[1] + 0.35));
    R.opt.querySelector('.ic-ok').style.transform = `scale(${okPop.toFixed(3)})`;

    // ---- cursor: into the composer, then onto Optimize, then it rests
    const rc = centerOf(R, v.rc);
    const oc = centerOf(R, R.opt, 0, v.ty || 0);
    const cp = pathDesign(R, t, [
      { t: C.cur, x: 820, y: 470 },
      { t: C.toComp[0], x: 820, y: 470 },
      { t: C.toComp[1], x: rc.l + 150, y: rc.t + 32 },
      { t: C.type[1], x: rc.l + 170, y: rc.t + 62 },
      { t: C.toOpt[0], x: rc.l + 175, y: rc.t + 64 },
      { t: C.toOpt[1], x: oc.x + 6, y: oc.y + 2 },
      { t: C.a2, x: oc.x + 6, y: oc.y + 2 },
      { t: C.a2 + 0.8, x: oc.x + 60, y: oc.y + 60 },
    ]);
    cursorAt(R, cp.x, cp.y, pulse(t, C.clickComp) + pulse(t, C.clickOpt), seg(t, C.cur, C.cur + 0.25) * (1 - seg(t, C.a2 + 0.4, C.a2 + 0.9)));
    const lc = [C.clickComp, C.clickOpt].filter((c) => c <= t).pop();
    ringAt(R, cp.x, cp.y, lc == null ? -1 : t - lc);
  },
};

function pulse(t, c) { const a = seg(t, c - 0.06, c + 0.04), b = seg(t, c + 0.04, c + 0.2); return a * (1 - b); }

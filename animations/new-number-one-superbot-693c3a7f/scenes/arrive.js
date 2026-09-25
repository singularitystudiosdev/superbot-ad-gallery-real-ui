// arrive.js: the payoff. The real superbot hub, mid-conversation: a new agent's tile slides into the rail with a NEW
// dot, the cursor clicks it once, and the SAME thread carries on under the new agent (the carry row says where it came
// from). Nothing else changes: same window, same rail, same chat. That is the ad's whole argument ("Don't switch.").
import { clamp, seg, outCubic, outBack, blink } from '../lib.js';
import {
  AGENTS, mountHub, place, camera, centerOf, cursorAt, ringAt, pathDesign, railSel, railHover, reveal, viewPoint,
  viewHTML, thread, draft, streamWords, rise, nativeTitle, words,
} from './hubkit.js';

// every beat, in scene seconds
const C = {
  cur: 0.35,
  toComp: [0.75, 1.1],
  type1: [1.05, 1.7], send1: 1.82, u1: 1.88, a1: 2.06, a1words: 2.26,
  arr: 2.62,          // the new agent's tile slides into the rail
  dot: 2.84,          // its NEW dot pops
  toTile: [3.2, 3.62], hover: 3.4, click: 3.78,
  rev: [3.84, 4.6], sel: [3.86, 4.26],
  toComp2: [4.7, 5.0],
  type2: [5.05, 5.6], send2: 5.72, u2: 5.78, a2: 5.98, a2words: 6.2,
  curOut: [6.9, 7.4],
  dur: 8.1,
};
const Q1 = 'Turn this week’s notes into a launch one pager.';
const A1 = 'Done. One page, three headline options, ready when you are.';
const Q2 = 'Make it punchier.';
const A2 = 'Sharper lines, same outline, and a first paragraph that lands.';

const CHATS = ['Launch one pager', 'Week 12 recap', 'Pricing page copy', 'Kyoto in four days'];

const views = () =>
  // superbot's own view: it covers the thread only, so the hub's real chats column and header stay in frame
  viewHTML('sb', {
    title: 'Launch one pager',
    chats: CHATS,
    msgs: [
      { id: 'u1', who: 'u', text: Q1 },
      { id: 'a1', who: 'a', html: `<span class="vz-think vz-dot"></span>${words(A1)}` },
    ],
  }) +
  // the same thread, opened under the agent that just landed
  viewHTML('windsurf', {
    title: 'Launch one pager',
    chats: CHATS,
    msgs: [
      { id: 'carry', who: 'raw', html: `<span class="vz-carry"><span class="vz-tile t-sb">${AGENTS.sb.mark}</span>Continued from superbot</span>` },
      { id: 'u1', who: 'u', text: Q1 },
      { id: 'a1', who: 'a', text: A1 },
      { id: 'u2', who: 'u', text: Q2 },
      { id: 'a2', who: 'a', html: `<span class="vz-think vz-dot"></span>${words(A2)}` },
    ],
  });

export default {
  dur: C.dur,

  mount(section, ctx) {
    const R = mountHub(section, ctx, views());
    nativeTitle(R, 'Launch one pager'); // the hub's own header names the open chat
    // the new agent: a real rail item with the registry's windsurf mark and a NEW dot, appended to the app group
    const item = document.createElement('span');
    item.className = 'rail-item';
    item.dataset.app = 'windsurf';
    item.innerHTML = '<svg><use href="#tbs-ic-windsurf"/></svg><i class="dot is-new"></i>';
    const copilot = R.hub.querySelector('.rail-item[data-app="copilot"]');
    copilot.after(item);
    Object.assign(item.style, { opacity: '0', transform: 'translateX(-46px) scale(0.7)' });
    R.ws = item;
    R.items.ws = item; // so the selection bar and the hover tip can target it
    R.dot = item.querySelector('.dot');
    R.think1 = R.views.sb.el.querySelector('.vz-think');
    R.think2 = R.views.windsurf.el.querySelector('.vz-think');
    return R;
  },

  render(t, ctx) {
    const R = ctx.state;
    place(R, ctx.W);
    const sv = R.views.sb, wv = R.views.windsurf;

    // ---- the new agent's tile: slides in with an overshoot, then behaves like every other rail item
    const au = t - C.arr;
    const ae = outBack(clamp(au / 0.5));
    railHover(R, 'ws', 0, null);
    R.ws.style.opacity = t < C.arr ? '0' : clamp(au / 0.28).toFixed(3); // written every frame: ?t=<s> must render it too
    if (t < C.hover) {
      R.ws.style.transform = t < C.arr ? 'translateX(-46px) scale(0.7)' : `translateX(${((1 - ae) * -46).toFixed(2)}px) scale(${(0.7 + 0.3 * ae).toFixed(3)})`;
    } else {
      // it is an ordinary rail item from here: the hover lifts it and names it
      railHover(R, 'ws', seg(t, C.hover, C.hover + 0.25) * (1 - seg(t, C.click, C.click + 0.45)), 'Windsurf · new');
    }
    const de = outBack(clamp((t - C.dot) / 0.36));
    R.dot.style.opacity = t >= C.dot ? '1' : '0';
    R.dot.style.transform = `scale(${de.toFixed(3)})`;
    const halo = 0.5 + 0.5 * Math.sin((t - C.dot) * 6.5);
    R.dot.style.boxShadow = `0 0 0 2px #000, 0 0 0 ${(4 + 3.4 * halo).toFixed(1)}px rgba(192,38,211,.32), 0 0 14px rgba(43,107,255,.8)`;

    // ---- camera: lean in on the rail while the new agent arrives, hold through the click, ease back out at the end
    const zin = outCubic(seg(t, C.arr - 0.15, C.arr + 0.9));
    const zout = outCubic(seg(t, C.click + 0.5, C.curOut[1]));
    const ws = centerOf(R, R.ws);
    camera(R, 1 + 0.17 * zin * (1 - zout), 0, ws.y); // pivot on the window's own left edge: the rail never gets clipped

    // ---- the rail: the selection bar stays on superbot until the click, then travels to the new agent
    if (t < C.sel[0]) railSel(R, 'sb', 'sb', 0); else railSel(R, 'sb', 'ws', seg(t, ...C.sel));

    // ---- the views: superbot's thread, then the same thread under Windsurf, grown out of the rail tile
    const wi = centerOf(R, R.ws), p1 = viewPoint(R, wi.x, wi.y);
    reveal(R, 'sb', t >= C.rev[1] ? 0 : 1);
    reveal(R, 'windsurf', outCubic(seg(t, ...C.rev)) * 0.999 + (t >= C.rev[1] ? 0.001 : 0), p1.x, p1.y);

    // ---- superbot's thread: the ask lands, the reply streams
    thread(R, 'sb', { u1: rise(t, C.u1), a1: rise(t, C.a1) });
    const d1 = seg(t, C.a1, C.a1 + 0.15) * (1 - seg(t, C.a1words - 0.1, C.a1words + 0.05));
    R.think1.style.opacity = d1.toFixed(3);
    R.think1.style.transform = `scale(${(0.8 + 0.2 * Math.sin((t - C.a1) * 9)).toFixed(3)})`;
    streamWords(sv.m.a1, C.a1words, 9.5, t);

    // ---- the composer: the ask, then the follow-up, both typed into the same window
    let text = '', text2 = '';
    if (t >= C.type1[0] && t < C.send1) text = Q1.slice(0, Math.round(Q1.length * seg(t, ...C.type1)));
    draft(R, 'sb', text, { press: pulse(t, C.send1), caretIdle: t >= C.type1[1] && t < C.send1 && blink(t) });
    if (t >= C.type2[0] && t < C.send2) text2 = Q2.slice(0, Math.round(Q2.length * seg(t, ...C.type2)));
    draft(R, 'windsurf', text2, { press: pulse(t, C.send2), caretIdle: t >= C.rev[1] && t < C.type2[0] && blink(t) });

    // ---- the carried thread: the follow-up and its answer, in the agent that just arrived
    thread(R, 'windsurf', { u2: rise(t, C.u2), a2: rise(t, C.a2) });
    const d2 = seg(t, C.a2, C.a2 + 0.15) * (1 - seg(t, C.a2words - 0.1, C.a2words + 0.05));
    R.think2.style.opacity = d2.toFixed(3);
    R.think2.style.transform = `scale(${(0.8 + 0.2 * Math.sin((t - C.a2) * 9)).toFixed(3)})`;
    streamWords(wv.m.a2, C.a2words, 9.5, t);

    // ---- the cursor: composer, rail tile, then the composer again; it never leaves the window
    const rc = centerOf(R, sv.rc), wc = centerOf(R, wv.rc);
    const keys = [
      { t: C.cur, x: 900, y: 470 },
      { t: C.toComp[0], x: 900, y: 470 },
      { t: C.toComp[1], x: rc.l + 150, y: rc.t + 38 },
      { t: C.type1[1] + 0.25, x: rc.l + 178, y: rc.t + 56 },
      { t: C.toTile[0], x: rc.l + 196, y: rc.t + 58 },
      { t: C.toTile[1], x: wi.x + 3, y: wi.y + 1 },
      { t: C.click + 0.35, x: wi.x + 3, y: wi.y + 1 },
      { t: C.toComp2[1], x: wc.l + 150, y: wc.t + 38 },
      { t: C.type2[1] + 0.25, x: wc.l + 176, y: wc.t + 56 },
      { t: C.send2 + 0.06, x: wc.l + 196, y: wc.t + 58 },
      { t: C.curOut[1], x: wc.l + 110, y: wc.t + 158 },
    ];
    const cp = pathDesign(R, t, keys);
    const pr = pulse(t, C.send1) + pulse(t, C.click) + pulse(t, C.send2);
    const cvis = seg(t, C.cur, C.cur + 0.25) * (1 - seg(t, ...C.curOut));
    cursorAt(R, cp.x, cp.y, pr, cvis);
    const last = [C.send1, C.click, C.send2].filter((c) => c <= t).pop();
    ringAt(R, cp.x, cp.y, last == null ? -1 : t - last);
  },
};

/** a press dip, 0 -> 1 -> 0 over 0.22 s from c */
function pulse(t, c) { const a = seg(t, c - 0.06, c + 0.04), b = seg(t, c + 0.04, c + 0.2); return a * (1 - b); }
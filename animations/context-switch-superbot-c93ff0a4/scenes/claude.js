// claude.js: opens on the intro's last frame (the landed hub), clicks Claude in the rail, says Hello, gets Hi!,
// asks How are you?, and runs into Superbot's own usage-limit notice (Thread.tsx UsageLimitNotice, composer top
// row). One press on the composer's agent chip moves the same thread to ChatGPT: Claude's warm palette gives way to
// ChatGPT's in a feathered circle grown from the chip, and ChatGPT answers the question Claude never got to.
import { clamp, lerp, seg, outCubic, outBack, esc } from '../lib.js';
import {
  AGENTS, icon, mountHub, place, camera, centerOf, cursorAt, ringAt, pathDesign, railSel, railHover, reveal, viewPoint,
  viewHTML, thread, draft, streamWords, hms, rise,
} from './hubkit.js';

// every beat, in scene seconds
const C = {
  cur: 0.3, rail: 1.05, clickRail: 1.2, rev1: [1.25, 2.2], sel1: [1.22, 1.62],
  toComp: [1.9, 2.55], clickComp: 2.62,
  type1: [2.8, 3.22], send1: 3.42, u1: 3.48, greetOut: [3.4, 3.75],
  a1: 3.7, a1words: 4.35,
  type2: [4.8, 5.62], send2: 5.86, u2: 5.92,
  a2: 6.12, notice: 7.12,
  camIn: [6.75, 7.85], toChip: [8.55, 9.2], clickChip: 9.34, pickOpen: [9.38, 9.66],
  toGpt: [9.72, 10.14], clickGpt: 10.28, pickClose: [10.34, 10.52],
  rev2: [10.36, 11.4], sel2: [10.36, 10.84], curOut: [11.05, 11.6], camOut: [11.15, 12.35],
  g2: 11.5, g2words: 12.05,
  dur: 14.6,
};
const HELLO = 'Hello', HOW = 'How are you?';
const REPLY = 'Doing great, thanks for asking! What are we working on today?';
const LIMIT_S = 5 * 3600 - 1; // the window just rolled: 4:59:59 and counting down

const views = () =>
  viewHTML('claude', {
    title: 'Hello',
    chats: ['Hello', 'Q3 board deck outline', 'Regex for email validation', 'Kyoto in four days', 'Cover letter, v2', 'Sourdough starter help'],
    greet: `<div class="vz-greet"><span class="vz-spark">${icon('claude')}</span><h2>Good evening, Sam</h2></div>`,
    msgs: [
      { id: 'u1', who: 'u', text: HELLO },
      { id: 'a1', who: 'a', html: `<span class="vz-think vz-spark">${icon('claude')}</span><span class="w">Hi!</span>` },
      { id: 'u2', who: 'u', text: HOW },
      { id: 'a2', who: 'a', html: `<span class="vz-think vz-spark">${icon('claude')}</span>&nbsp;` },
    ],
  }) +
  viewHTML('gpt', {
    title: 'ChatGPT',
    chats: ['Hello', 'Wedding toast ideas', 'Fix this SQL join', 'Names for a golden retriever', 'Explain RAG like I’m five', 'Marathon training plan'],
    msgs: [
      { id: 'carry', who: 'raw', html: `<span class="vz-carry"><span class="vz-tile t-claude">${icon('claude')}</span>Continued from Claude</span>` },
      { id: 'u1', who: 'u', text: HELLO },
      { id: 'a1', who: 'a', text: 'Hi!' },
      { id: 'u2', who: 'u', text: HOW },
      { id: 'a2', who: 'a', html: `<span class="vz-think vz-dot"></span>${REPLY.split(' ').map((w) => `<span class="w">${esc(w)}</span>`).join(' ')}` },
    ],
  });

const PICK = [
  { k: 'sb', label: 'superbot', tile: `<span class="vz-tile t-sb">${AGENTS.sb.mark}</span>` },
  { k: 'gpt', label: 'ChatGPT', tile: `<span class="vz-tile t-gpt">${icon('openai')}</span>` },
  { k: 'claude', label: 'Claude', tile: `<span class="vz-tile t-claude">${icon('claude')}</span>`, note: 'Out of usage' },
  { k: 'gemini', label: 'Gemini', tile: `<span class="vz-tile t-gemini">${icon('gemini')}</span>` },
];

export default {
  dur: C.dur,
  fadeIn: false, // the intro's last frame IS this scene's first: a straight cut, no dip

  mount(section, ctx) {
    const R = mountHub(section, ctx, views());
    const cv = R.views.claude, gv = R.views.gpt;
    cv.top.innerHTML = `<div class="hub-usage-limit"><b>Claude is out of usage</b><span>Your 5 hour limit resets in <span class="cd">4:59:59</span>.</span><small>9:41 PM</small><u>Open Claude</u></div>`;
    R.cd = cv.top.querySelector('.cd');
    R.notice = cv.top.firstElementChild;
    // the agent picker lives on the Claude view's composer, above its chip
    const pick = document.createElement('div');
    pick.className = 'vz-pick';
    pick.innerHTML = `<i class="pk-hl"></i><div class="pk-lab">Switch agent</div>` +
      PICK.map((p) => `<div class="pk" data-pk="${p.k}">${p.tile}<span>${p.label}</span>${p.note ? `<em>${p.note}</em>` : ''}${p.k === 'claude' ? '<svg class="ok" viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>' : ''}</div>`).join('');
    cv.comp.appendChild(pick);
    R.pick = pick; R.pickHl = pick.querySelector('.pk-hl');
    R.pk = Object.fromEntries([...pick.querySelectorAll('.pk')].map((n) => [n.dataset.pk, n]));
    R.cthink = [...cv.el.querySelectorAll('.vz-think')];
    R.gthink = gv.el.querySelector('.vz-think');
    R.greet = cv.greet;
    R.row0 = { claude: cv.rows[0], gpt: gv.rows[0] };
    return R;
  },

  render(t, ctx) {
    const R = ctx.state;
    place(R, ctx.W);
    const cv = R.views.claude, gv = R.views.gpt;

    // ---- camera: push in on the composer for the limit and the switch, ease back out as ChatGPT answers
    const zin = outCubic(seg(t, ...C.camIn)), zout = outCubic(seg(t, ...C.camOut));
    // pivot left of centre (the rail stays in frame for the switch), level with the composer at any ratio
    camera(R, 1 + 0.2 * zin * (1 - zout), 480, centerOf(R, cv.rc).y);

    // ---- rail: selection travels superbot -> Claude -> ChatGPT; Claude lifts under the hover
    if (t < C.sel2[0]) railSel(R, 'sb', 'claude', seg(t, ...C.sel1));
    else railSel(R, 'claude', 'gpt', seg(t, ...C.sel2));
    const hov = seg(t, C.rail - 0.25, C.rail) * (1 - seg(t, C.clickRail + 0.2, C.clickRail + 0.5));
    railHover(R, 'claude', hov, 'Claude');

    // ---- the views: Claude grows out of the rail icon, then ChatGPT out of the composer chip
    const ci = centerOf(R, R.items.claude), p1 = viewPoint(R, ci.x, ci.y);
    reveal(R, 'claude', t >= C.rev2[1] ? 0 : outCubic(seg(t, ...C.rev1)), p1.x, p1.y);
    const chip = centerOf(R, cv.plat), p2 = viewPoint(R, chip.x, chip.y);
    reveal(R, 'gpt', outCubic(seg(t, ...C.rev2)) * 0.999 + (t >= C.rev2[1] ? 0.001 : 0), p2.x, p2.y);

    // ---- Claude thread
    const nh = outCubic(seg(t, C.notice, C.notice + 0.45)); // the notice's top row opening
    const noticeH = R.notice.offsetHeight || 24;
    cv.top.style.height = (noticeH * nh).toFixed(2) + 'px';
    R.notice.style.opacity = seg(t, C.notice + 0.12, C.notice + 0.5).toFixed(3);
    R.notice.style.transform = `translateY(${(6 * (1 - nh)).toFixed(2)}px)`;
    R.cd.textContent = hms(LIMIT_S - Math.max(0, t - C.notice));
    thread(R, 'claude', { u1: rise(t, C.u1), a1: rise(t, C.a1), u2: rise(t, C.u2), a2: rise(t, C.a2) }, noticeH * nh);
    const gOut = seg(t, ...C.greetOut);
    R.greet.style.opacity = (1 - gOut).toFixed(3);
    R.greet.style.transform = `translateY(${(-10 * outCubic(gOut)).toFixed(2)}px) scale(${(1 - 0.03 * gOut).toFixed(3)})`;
    // the spark breathes while Claude thinks; the second one stalls out when the limit lands
    const spark = (el, a, b) => {
      const on = seg(t, a, a + 0.2) * (1 - seg(t, b, b + 0.25));
      el.style.opacity = on.toFixed(3);
      el.style.transform = `rotate(${((t - a) * 160).toFixed(1)}deg) scale(${(0.86 + 0.14 * Math.sin((t - a) * 7) * on).toFixed(3)})`;
    };
    spark(R.cthink[0], C.a1, C.a1words - 0.05);
    spark(R.cthink[1], C.a2, C.notice + 0.1);
    streamWords(cv.m.a1, C.a1words, 8, t);
    rowIn(R.row0.claude, t, C.u1);

    // ---- the composer: Hello, then How are you?
    let text = '', press = 0;
    if (t >= C.type1[0] && t < C.send1) text = HELLO.slice(0, Math.round(HELLO.length * seg(t, ...C.type1)));
    if (t >= C.type2[0] && t < C.send2) text = HOW.slice(0, Math.round(HOW.length * seg(t, ...C.type2)));
    press = pulse(t, C.send1) + pulse(t, C.send2);
    const typing = t >= C.clickComp && t < C.notice;
    draft(R, 'claude', text, { press, caretIdle: typing && Math.floor(t * 2.2) % 2 === 0 });
    cv.send.style.opacity = t > C.notice ? (1 - 0.55 * seg(t, C.notice, C.notice + 0.4)).toFixed(3) : '';

    // ---- the picker
    const po = outBack(seg(t, ...C.pickOpen)) * (1 - seg(t, ...C.pickClose));
    const pickShown = t >= C.pickOpen[0] && t < C.pickClose[1];
    R.pick.style.visibility = pickShown ? 'visible' : 'hidden';
    if (pickShown) {
      if (!R.pickPos) {
        R.pickPos = true;
        R.pick.style.left = (cv.plat.offsetLeft + cv.plat.offsetParent.offsetLeft + cv.plat.offsetWidth / 2 - 132).toFixed(1) + 'px';
        R.pick.style.bottom = 'calc(100% - 16px)';
      }
      R.pick.style.opacity = clamp(po * 1.2).toFixed(3);
      R.pick.style.transform = `translateY(${(8 * (1 - po)).toFixed(2)}px) scale(${(0.94 + 0.06 * po).toFixed(3)})`;
      const yOf = (k) => R.pk[k].offsetTop;
      const hf = outCubic(seg(t, ...C.toGpt));
      R.pickHl.style.top = lerp(yOf('claude'), yOf('gpt'), hf).toFixed(2) + 'px';
      R.pickHl.style.opacity = (0.7 + 0.3 * hf).toFixed(3);
      R.pk.gpt.style.transform = `scale(${(1 - 0.03 * pulse(t, C.clickGpt)).toFixed(3)})`;
    }

    // ---- ChatGPT thread: the carried conversation is already there; the answer lands after a beat
    thread(R, 'gpt', { a2: rise(t, C.g2) });
    const dot = seg(t, C.g2, C.g2 + 0.15) * (1 - seg(t, C.g2words - 0.1, C.g2words + 0.05));
    R.gthink.style.opacity = dot.toFixed(3);
    R.gthink.style.transform = `scale(${(0.8 + 0.2 * Math.sin((t - C.g2) * 9)).toFixed(3)})`;
    R.gthink.style.width = dot > 0.01 ? '' : '0px';
    R.gthink.style.margin = dot > 0.01 ? '' : '0';
    streamWords(gv.m.a2, C.g2words, 9.5, t);

    // ---- cursor: in from the thread, rail, composer, chip, the ChatGPT row, then away
    const rc = centerOf(R, cv.rc);
    const pk = R.pickPos ? centerOf(R, R.pk.gpt) : { x: chip.x, y: chip.y - 60 };
    const keys = [
      { t: C.cur, x: 820, y: 430 },
      { t: C.rail, x: ci.x + 2, y: ci.y + 2 },
      { t: C.toComp[0], x: ci.x + 2, y: ci.y + 2 },
      { t: C.toComp[1], x: rc.l + 150, y: rc.t + 34 },
      { t: C.type1[1] + 0.3, x: rc.l + 180, y: rc.t + 64 },
      { t: C.toChip[0], x: rc.l + 190, y: rc.t + 70 },
      { t: C.toChip[1], x: chip.x + 4, y: chip.y + 1 },
      { t: C.toGpt[0], x: chip.x + 4, y: chip.y + 1 },
      { t: C.toGpt[1], x: pk.x - 30, y: pk.y + 1 },
      { t: C.curOut[1], x: pk.x + 40, y: pk.y + 70 },
    ];
    const cp = pathDesign(R, t, keys);
    const pr = pulse(t, C.clickRail) + pulse(t, C.clickComp) + pulse(t, C.clickChip) + pulse(t, C.clickGpt);
    const cvis = seg(t, C.cur, C.cur + 0.25) * (1 - seg(t, ...C.curOut));
    cursorAt(R, cp.x, cp.y, pr, cvis);
    const lastClick = [C.clickRail, C.clickComp, C.clickChip, C.clickGpt].filter((c) => c <= t).pop();
    ringAt(R, cp.x, cp.y, lastClick == null ? -1 : t - lastClick);
    cv.plat.style.background = `rgba(255,255,255,${(0.1 * seg(t, C.toChip[1] - 0.15, C.toChip[1]) * (1 - seg(t, C.pickClose[0], C.pickClose[1]))).toFixed(3)})`;

    rowIn(R.row0.gpt, t, -1);
  },
};

/** a press dip, 0 -> 1 -> 0 over 0.22 s from c */
function pulse(t, c) { const a = seg(t, c - 0.06, c + 0.04), b = seg(t, c + 0.04, c + 0.2); return a * (1 - b); }
/** the new chat's row slides into Recents when the first message is sent */
function rowIn(row, t, at) {
  const f = at < 0 ? 1 : outCubic(seg(t, at, at + 0.4));
  row.style.opacity = f.toFixed(3);
  row.style.height = (27 * f).toFixed(2) + 'px';
  row.style.paddingTop = row.style.paddingBottom = (6 * f).toFixed(2) + 'px';
}

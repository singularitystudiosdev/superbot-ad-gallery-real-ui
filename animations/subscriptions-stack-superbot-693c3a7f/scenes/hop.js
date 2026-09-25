// hop.js: one window, one thread, agent after agent. Claude is picked in the rail and the ask lands there;
// one press on the composer's agent chip moves the SAME thread to ChatGPT, and one more press hands it to
// superbot. What changes is the agent view only: the window, the rail, the composer and the conversation stay
// put. Every value is a pure function of lt; hubkit.js owns the landed window and its helpers.
import { clamp, lerp, seg, outCubic, outBack, esc } from '../lib.js';
import {
  AGENTS, icon, mountHub, place, centerOf, cursorAt, ringAt, pathDesign, railSel, railHover, reveal, viewPoint,
  viewHTML, thread, streamWords, rise, toolHTML, tool,
} from './hubkit.js';

// every beat, in scene seconds
const C = {
  cur: 0.30,
  toRail: [0.55, 1.05], clickRail: 1.12,
  rev1: [1.16, 2.02], sel1: [1.12, 1.52],
  q1: 2.10, think1: 2.40, acWords: 2.70,
  toChip1: [3.55, 3.90], clickChip1: 3.96, pick1: [4.00, 4.24], hl1: [4.14, 4.46],
  clickGpt: 4.52, pick1Out: [4.56, 4.74],
  rev2: [4.58, 5.40], sel2: [4.56, 4.96],
  agWords: 5.62,
  toChip2: [6.30, 6.66], clickChip2: 6.72, pick2: [6.76, 7.00], hl2: [6.90, 7.22],
  clickSb: 7.28, pick2Out: [7.32, 7.50],
  rev3: [7.34, 8.16], sel3: [7.32, 7.72],
  t1: 8.30, t1done: 8.80, asWords: 8.95,
  curOut: [10.00, 10.50],
  dur: 10.8,
};
const TITLE = 'Team offsite';
const ASK = 'Plan our team offsite: 12 people, Lisbon, three days in mid October.';
const SAY_CLAUDE = 'I can plan this at a high level, but I cannot book a venue or send the invites.';
const SAY_GPT = 'Here is a three day agenda. I cannot hold rooms or send the invites.';
const SAY_SB = 'Done. Agenda, venue shortlist and invite copy are all in this thread.';
const CHATS = ['Team offsite', 'Q3 hiring plan', 'Invoice chase', 'Flight options', 'Standup notes', 'Rewrite bio'];

/** words as spans, so a reply lays out in full and streams without reflowing */
const w = (text) => text.split(' ').map((x) => `<span class="w">${esc(x)}</span>`).join(' ');
/** the carried-thread chip: which agent this thread came from */
const carry = (kind, label) => `<span class="vz-carry"><span class="vz-tile t-${kind}">${kind === 'sb' ? AGENTS.sb.mark : icon(kind === 'gpt' ? 'openai' : 'claude')}</span>Continued from ${label}</span>`;

const views = () =>
  viewHTML('claude', {
    title: TITLE,
    chats: CHATS,
    greet: `<div class="vz-greet"><span class="vz-spark">${icon('claude')}</span><h2>Good evening, Sam</h2></div>`,
    msgs: [
      { id: 'u', who: 'u', text: ASK },
      { id: 'ac', who: 'a', html: `<span class="vz-think vz-spark">${icon('claude')}</span>${w(SAY_CLAUDE)}` },
    ],
  }) +
  viewHTML('gpt', {
    title: TITLE,
    chats: CHATS,
    msgs: [
      { id: 'carry', who: 'raw', html: carry('claude', 'Claude') },
      { id: 'u', who: 'u', text: ASK },
      { id: 'ac', who: 'a', text: SAY_CLAUDE, cls: 'shown' },
      { id: 'ag', who: 'a', html: `<span class="vz-think vz-dot"></span>${w(SAY_GPT)}` },
    ],
  }) +
  viewHTML('sb', {
    title: TITLE,
    chats: CHATS,
    msgs: [
      { id: 'carry', who: 'raw', html: carry('gpt', 'ChatGPT') },
      { id: 'u', who: 'u', text: ASK },
      { id: 'ac', who: 'a', text: SAY_CLAUDE, cls: 'shown' },
      { id: 'ag', who: 'a', text: SAY_GPT, cls: 'shown' },
      { id: 'tool', who: 'raw', html: toolHTML('Gathering venues in Lisbon') },
      { id: 'as', who: 'a', html: w(SAY_SB) },
    ],
  });

// the composer's switch-agent picker: the real chip menu, current agent marked
const PICK = [
  { k: 'sb', label: 'superbot', tile: `<span class="vz-tile t-sb">${AGENTS.sb.mark}</span>` },
  { k: 'gpt', label: 'ChatGPT', tile: `<span class="vz-tile t-gpt">${icon('openai')}</span>` },
  { k: 'claude', label: 'Claude', tile: `<span class="vz-tile t-claude">${icon('claude')}</span>` },
  { k: 'gemini', label: 'Gemini', tile: `<span class="vz-tile t-gemini">${icon('gemini')}</span>` },
];

export default {
  id: 'hop',
  dur: C.dur,

  mount(section, ctx) {
    const R = mountHub(section, ctx, views());
    const cv = R.views.claude, gv = R.views.gpt, sv = R.views.sb;
    // the picker belongs to the layer, not to one view: it opens over whichever chip was pressed
    const pick = document.createElement('div');
    pick.className = 'vz-pick';
    pick.innerHTML = `<i class="pk-hl"></i><div class="pk-lab">Switch agent</div>` +
      PICK.map((p) => `<div class="pk" data-pk="${p.k}">${p.tile}<span>${p.label}</span>${p.k === 'sb' ? '<svg class="ok" viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>' : ''}</div>`).join('');
    R.layer.appendChild(pick);
    R.pick = pick;
    R.pickHl = pick.querySelector('.pk-hl');
    R.pk = Object.fromEntries([...pick.querySelectorAll('.pk')].map((n) => [n.dataset.pk, n]));
    R.greet = cv.greet;
    R.cthink = cv.el.querySelector('.vz-think.vz-spark');
    R.gthink = gv.el.querySelector('.vz-think.vz-dot');
    R.t1 = sv.m.tool.querySelector('.vz-tool');
    R.rows = { claude: cv.rows[0], gpt: gv.rows[0], sb: sv.rows[0] };
    return R;
  },

  render(t, ctx) {
    const R = ctx.state;
    place(R, ctx.W);
    const cv = R.views.claude, gv = R.views.gpt, sv = R.views.sb;

    // ---- rail: the selection travels superbot -> Claude -> ChatGPT -> superbot, and Claude lifts under the hover
    if (t < C.sel2[0]) railSel(R, 'sb', 'claude', seg(t, ...C.sel1));
    else if (t < C.sel3[0]) railSel(R, 'claude', 'gpt', seg(t, ...C.sel2));
    else railSel(R, 'gpt', 'sb', seg(t, ...C.sel3));
    const hov = seg(t, C.toRail[1] - 0.2, C.toRail[1]) * (1 - seg(t, C.clickRail + 0.15, C.clickRail + 0.45));
    railHover(R, 'claude', hov, 'Claude');

    // ---- the three views of ONE thread: each one grows out of the control that was pressed ----
    const ci = centerOf(R, R.items.claude), chip1 = centerOf(R, cv.plat), chip2 = centerOf(R, gv.plat);
    const p1 = viewPoint(R, ci.x, ci.y), p2 = viewPoint(R, chip1.x, chip1.y), p3 = viewPoint(R, chip2.x, chip2.y);
    reveal(R, 'claude', outCubic(seg(t, ...C.rev1)), p1.x, p1.y);
    reveal(R, 'gpt', outCubic(seg(t, ...C.rev2)), p2.x, p2.y);
    reveal(R, 'sb', outCubic(seg(t, ...C.rev3)), p3.x, p3.y);

    // ---- Claude: the greeting steps aside, the ask lands, the reply thinks then streams
    const gOut = seg(t, C.q1 - 0.35, C.q1 + 0.05);
    R.greet.style.opacity = (1 - gOut).toFixed(3);
    R.greet.style.transform = `translateY(${(-10 * outCubic(gOut)).toFixed(2)}px) scale(${(1 - 0.03 * gOut).toFixed(3)})`;
    thread(R, 'claude', { u: rise(t, C.q1), ac: rise(t, C.think1) });
    spark(R.cthink, t, C.think1, C.acWords - 0.05);
    streamWords(cv.m.ac, C.acWords, 16, t);
    rowIn(R.rows.claude, t, C.q1);

    // ---- ChatGPT, the same thread carried: it answers where Claude stopped
    thread(R, 'gpt', { ag: rise(t, C.agWords) });
    dot(R.gthink, t, C.agWords, C.agWords + 0.15);
    streamWords(gv.m.ag, C.agWords, 16, t);

    // ---- superbot finishes it: a tool line, then the answer, all in the same thread
    thread(R, 'sb', { tool: rise(t, C.t1), as: rise(t, C.asWords - 0.1) });
    tool(R.t1, t, C.t1, C.t1done, 'Shortlist ready for mid October');
    streamWords(sv.m.as, C.asWords, 16, t);
    rowIn(R.rows.gpt, t, -1);
    rowIn(R.rows.sb, t, -1);

    // ---- the picker: opens on the chip that was pressed, its highlight travels to the agent the cursor lands on
    const open = t >= C.pick1[0] && t < C.pick1Out[1];
    const open2 = t >= C.pick2[0] && t < C.pick2Out[1];
    const shown = open || open2;
    R.pick.style.visibility = shown ? 'visible' : 'hidden';
    let pkPos = null;
    if (shown) {
      const chip = open ? chip1 : chip2;
      const vp = viewPoint(R, chip.x, chip.y);
      if (!R.pickH) R.pickH = R.pick.offsetHeight || 168;
      R.pick.style.left = (vp.x - 94).toFixed(1) + 'px';
      R.pick.style.top = (vp.y - 20 - R.pickH).toFixed(1) + 'px';
      const rise1 = outBack(seg(t, ...C.pick1)), out1 = seg(t, ...C.pick1Out);
      const rise2 = outBack(seg(t, ...C.pick2)), out2 = seg(t, ...C.pick2Out);
      const pin = open ? rise1 : rise2, pout = open ? out1 : out2;
      const vis = clamp(pin) * (1 - pout);
      R.pick.style.opacity = clamp(vis * 1.25).toFixed(3);
      R.pick.style.transform = `translateY(${(8 * (1 - clamp(pin)) + 10 * outCubic(pout)).toFixed(2)}px) scale(${(0.94 + 0.06 * clamp(pin) - 0.05 * outCubic(pout)).toFixed(3)})`;
      const yOf = (k) => R.pk[k].offsetTop;
      const from = open ? 'claude' : 'gpt', to = open ? 'gpt' : 'sb';
      const hf = outCubic(seg(t, ...(open ? C.hl1 : C.hl2)));
      R.pickHl.style.top = lerp(yOf(from), yOf(to), hf).toFixed(2) + 'px';
      R.pickHl.style.opacity = (0.7 + 0.3 * hf).toFixed(3);
      R.pk[to].style.transform = `scale(${(1 - 0.03 * pulse(t, open ? C.clickGpt : C.clickSb)).toFixed(3)})`;
      pkPos = centerOf(R, R.pk[to]);
    }

    // ---- the chips the cursor pressed stay lit while their menu is open
    const lit = (o) => `rgba(255,255,255,${(0.1 * o).toFixed(3)})`;
    const l1 = seg(t, C.toChip1[1] - 0.12, C.toChip1[1]) * (1 - seg(t, C.pick1Out[0], C.pick1Out[1]));
    const l2 = seg(t, C.toChip2[1] - 0.12, C.toChip2[1]) * (1 - seg(t, C.pick2Out[0], C.pick2Out[1]));
    cv.plat.style.background = lit(l1);
    gv.plat.style.background = lit(l2);

    // ---- cursor: rail icon, composer chip, the picker, the next chip, the picker, then away
    const keys = [
      { t: C.cur, x: 900, y: 470 },
      { t: C.toRail[0], x: 900, y: 470 },
      { t: C.toRail[1], x: ci.x + 3, y: ci.y + 2 },
      { t: C.toChip1[0], x: ci.x + 3, y: ci.y + 2 },
      { t: C.toChip1[1], x: chip1.x + 4, y: chip1.y + 1 },
      { t: C.toChip2[0], x: chip1.x + 4, y: chip1.y + 1 },
    ];
    let cp;
    if (t < C.toChip2[0] && pkPos && t >= C.pick1[0]) cp = pathDesign(R, t, [...keys, { t: C.pick1[0] + 0.16, x: pkPos.x + 6, y: pkPos.y + 1 }]);
    else if (t < C.toChip2[0]) cp = pathDesign(R, t, keys);
    else if (pkPos == null) cp = pathDesign(R, t, [...keys, { t: C.toChip2[1], x: chip2.x + 4, y: chip2.y + 1 }]);
    else cp = pathDesign(R, t, [...keys, { t: C.toChip2[1], x: chip2.x + 4, y: chip2.y + 1 }, { t: C.pick2[0] + 0.16, x: pkPos.x + 6, y: pkPos.y + 1 }, { t: C.curOut[1], x: pkPos.x + 70, y: pkPos.y + 96 }]);
    const presses = [C.clickRail, C.clickChip1, C.clickGpt, C.clickChip2, C.clickSb];
    const vis = seg(t, C.cur, C.cur + 0.25) * (1 - seg(t, ...C.curOut));
    cursorAt(R, cp.x, cp.y, presses.reduce((a, c) => a + pulse(t, c), 0), vis);
    const lc = presses.filter((c) => c <= t).pop();
    ringAt(R, cp.x, cp.y, lc == null ? -1 : t - lc);
  },
};

/** a press dip, 0 -> 1 -> 0 over 0.22 s from c */
function pulse(t, c) { const a = seg(t, c - 0.06, c + 0.04), b = seg(t, c + 0.04, c + 0.2); return a * (1 - b); }
/** the thinking spark: breathes while the agent works, stalls out when its words land */
function spark(el, t, a, b) {
  const on = seg(t, a, a + 0.2) * (1 - seg(t, b, b + 0.25));
  el.style.opacity = on.toFixed(3);
  el.style.transform = `rotate(${((t - a) * 160).toFixed(1)}deg) scale(${(0.86 + 0.14 * Math.sin((t - a) * 7) * on).toFixed(3)})`;
}
/** the waiting dot, shown only while the reply is still to come */
function dot(el, t, a, b) {
  const on = seg(t, a, a + 0.15) * (1 - seg(t, b - 0.1, b + 0.05));
  el.style.opacity = on.toFixed(3);
  el.style.transform = `scale(${(0.8 + 0.2 * Math.sin((t - a) * 9)).toFixed(3)})`;
  el.style.width = on > 0.01 ? '' : '0px';
  el.style.margin = on > 0.01 ? '' : '0';
}
/** the thread's own row slides into Recents when the first message of that app's view lands */
function rowIn(row, t, at) {
  const f = at < 0 ? 1 : outCubic(seg(t, at, at + 0.4));
  row.style.opacity = f.toFixed(3);
  row.style.height = (27 * f).toFixed(2) + 'px';
  row.style.paddingTop = row.style.paddingBottom = (6 * f).toFixed(2) + 'px';
}
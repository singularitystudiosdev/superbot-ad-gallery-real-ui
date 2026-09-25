// picks.js: "superbot picks the best agent for every task." One superbot chat, three tasks in a row.
// The user only types and sends: superbot opens its own agent switcher, the highlight travels to the agent it
// picked, the composer's platform chip flips to that agent and the composer's top row says so ("superbot picked
// Claude for this task"), then the reply streams in. Three tasks, three agents: a failing test -> Claude,
// a product photo -> ChatGPT, a 200 page PDF -> Gemini.
// Everything is a pure function of the scene clock (t), so ?t=<s> freezes any frame: the chip, the picker,
// the routing line, the thread and the cursor are all computed from t, never advanced per frame.
import { clamp, lerp, seg, outCubic, outBack, blink, esc } from '../lib.js';
import {
  AGENTS, mountHub, place, camera, centerOf, cursorAt, ringAt, pathDesign, railSel, railHover,
  reveal, viewHTML, thread, draft, streamWords, rise, toolHTML, tool,
} from './hubkit.js';

const CHEV = '<svg class="rc-chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>';
const ROUTING = 'Routing this task';

// ---------- the three tasks (task i is sent at TASKS[i].at scene seconds) ----------
const TASKS = [
  {
    at: 1.0, k: 'claude', q: 'Fix this failing test',
    reply: 'Fixed. The failing test compared a string to a number. Matcher corrected, the suite is green.',
  },
  {
    at: 5.6, k: 'gpt', q: 'Make a product photo',
    reply: 'Rendered three product shots from your desk photo. The first one is lit and ready to post.',
  },
  {
    at: 10.2, k: 'gemini', q: 'Summarize this 200-page PDF',
    reply: 'Read all 200 pages. Notes on the three decisions you asked about, with the risks flagged.',
  },
];
// every beat of a task, in seconds from its `at`. The chip's flip window [1.24, 1.44] sits inside the picker's
// close window [1.26, 1.44], so the chip takes the new agent exactly as the menu shuts (the real composer's own
// behaviour when you pick an agent in it).
const P = {
  type: 0.62, bubble: 0.08, tool: 0.16,
  open: [0.42, 0.72], hl: [0.72, 1.22], close: [1.26, 1.44], flip: [1.24, 1.44],
  done: 1.66, tagIn: [1.30, 1.62], reply: 1.80, tagOut: [3.10, 3.40],
  rail: [0.90, 1.10, 2.50, 2.80],
  curIn: 0.35, curOut: 3.30, away: 3.60,
};
const DUR = 16;

// the hub's own agent switcher: superbot opens it, the highlight travels, the chip follows
const PICKER = [
  { k: 'sb', label: 'superbot' },
  { k: 'gpt', label: 'ChatGPT' },
  { k: 'claude', label: 'Claude' },
  { k: 'gemini', label: 'Gemini' },
];

const views = () => viewHTML('sb', {
  title: 'superbot',
  msgs: TASKS.flatMap((k, i) => ([
    { id: `u${i + 1}`, who: 'u', text: k.q },
    { id: `r${i + 1}`, who: 'raw', html: toolHTML(ROUTING) },
    { id: `a${i + 1}`, who: 'a', text: k.reply },
  ])),
});

export default {
  id: 'picks',
  dur: DUR,

  mount(section, ctx) {
    const R = mountHub(section, ctx, views());
    const V = R.views.sb;
    R.V = V;
    // the picker (claude.js's switch idiom): superbot's own choice, not the user's
    const pick = document.createElement('div');
    pick.className = 'vz-pick';
    pick.innerHTML = `<i class="pk-hl"></i><div class="pk-lab">superbot picks</div>` +
      PICKER.map((p) => `<div class="pk" data-pk="${p.k}"><span class="vz-tile t-${p.k}">${AGENTS[p.k].tile}</span><span>${p.label}</span></div>`).join('');
    V.comp.appendChild(pick);
    R.pick = pick;
    R.pickHl = pick.querySelector('.pk-hl');
    R.pk = Object.fromEntries([...pick.querySelectorAll('.pk')].map((n) => [n.dataset.pk, n]));
    R.top = V.top;
    R.plat = V.plat;
    R.superEl = V.rc.querySelector('.rc-super');
    R.tools = TASKS.map((_, i) => V.m[`r${i + 1}`].querySelector('.vz-tool'));
    R.chipK = null;
    setChip(R, 'sb');
    return R;
  },

  render(t, ctx) {
    const R = ctx.state, V = R.V;
    place(R, ctx.W);
    // the camera only breathes (pivot on the composer, which it keeps in place): at 1x1/4x5 a real push-in
    // would crop the thread, and this spot is read out of the composer and the thread
    camera(R, 1.008 + 0.012 * Math.sin(t * 0.55), 480, centerOf(R, V.rc).y);
    railSel(R, 'sb', 'sb', 1);
    reveal(R, 'sb', 1);

    // ---- walk the three tasks and collect what each one is doing at t
    const rev = {};
    let chipK = 'sb', flip = -1, openI = -1, hlI = -1, hlF = 0, tagI = -1, tagF = 0, lit = 0, railI = -1, railH = 0;
    for (let i = 0; i < TASKS.length; i++) {
      const k = TASKS[i], b = k.at;
      rev[`u${i + 1}`] = rise(t, b + P.bubble);
      rev[`r${i + 1}`] = rise(t, b + P.tool);
      rev[`a${i + 1}`] = rise(t, b + P.reply);
      tool(R.tools[i], t, b + P.tool, b + P.done, `Routed to ${AGENTS[k.k].name}`);
      streamWords(V.m[`a${i + 1}`], b + P.reply + 0.06, 8.5, t);
      if (t >= b + (P.flip[0] + P.flip[1]) / 2) chipK = k.k;
      if (t >= b + P.flip[0] && t < b + P.flip[1]) flip = seg(t, b + P.flip[0], b + P.flip[1]);
      if (t >= b + P.open[0] && t < b + P.close[1]) openI = i;
      if (t >= b + P.hl[0] && t < b + P.hl[1]) { hlI = i; hlF = seg(t, b + P.hl[0], b + P.hl[1]); }
      if (t >= b + P.tagIn[0] && t < b + P.tagOut[1]) {
        tagI = i;
        tagF = seg(t, b + P.tagIn[0], b + P.tagIn[1]) * (1 - seg(t, b + P.tagOut[0], b + P.tagOut[1]));
      }
      lit = Math.max(lit, seg(t, b + P.open[0], b + P.open[0] + 0.18) * (1 - seg(t, b + P.flip[1], b + P.flip[1] + 0.3)));
      const h = outCubic(seg(t, b + P.rail[0], b + P.rail[1])) * (1 - outCubic(seg(t, b + P.rail[2], b + P.rail[3])));
      if (h > railH) { railH = h; railI = i; }
    }
    thread(R, 'sb', rev);

    // ---- the platform chip: flips to the agent of the task superbot just routed
    setChip(R, chipK);
    R.plat.style.transform = flip < 0 ? '' : `scale(${(1 - 0.14 * Math.sin(Math.PI * flip)).toFixed(3)})`;
    R.plat.style.opacity = flip < 0 ? '' : (0.45 + 0.55 * Math.abs(Math.cos(Math.PI * flip))).toFixed(3);

    // ---- the SUPER chip, lit while superbot is the one choosing
    R.superEl.classList.toggle('vz-lit', lit > 0.02);
    R.superEl.style.filter = lit > 0.02 ? `brightness(${(1 + 0.12 * lit).toFixed(3)})` : '';

    // ---- the picker: opens under the chip, the highlight travels to the picked agent, then it shuts
    R.pick.style.visibility = openI >= 0 ? 'visible' : 'hidden';
    if (openI >= 0) {
      const k = TASKS[openI], b = k.at;
      if (!R.pickPos) {
        R.pickPos = true;
        R.pick.style.left = (V.plat.offsetLeft + V.plat.offsetParent.offsetLeft + V.plat.offsetWidth / 2 - 94).toFixed(1) + 'px';
        R.pick.style.bottom = 'calc(100% - 16px)';
      }
      const po = outBack(seg(t, b + P.open[0], b + P.open[1])) * (1 - seg(t, b + P.close[0], b + P.close[1]));
      R.pick.style.opacity = clamp(po * 1.2).toFixed(3);
      R.pick.style.transform = `translateY(${(8 * (1 - po)).toFixed(2)}px) scale(${(0.94 + 0.06 * po).toFixed(3)})`;
      // the highlight: from the agent the chip is on now to the one this task picked
      const fromK = openI === 0 ? 'sb' : TASKS[openI - 1].k;
      const hf = hlI === openI ? hlF : (t >= b + P.hl[1] ? 1 : 0);
      R.pickHl.style.top = lerp(R.pk[fromK].offsetTop, R.pk[k.k].offsetTop, hf).toFixed(2) + 'px';
      R.pickHl.style.opacity = (0.5 + 0.5 * hf).toFixed(3);
      R.pk[k.k].style.transform = `scale(${(1 - 0.03 * pulse(t, b + P.flip[1] - 0.1)).toFixed(3)})`;
    } else for (const p of PICKER) R.pk[p.k].style.transform = '';

    // ---- the composer's top row: 'superbot picked Claude for this task'
    if (tagI >= 0) {
      const k = TASKS[tagI].k;
      if (R.tagK !== k) {
        R.tagK = k;
        R.top.innerHTML = `<span class="rt"><span class="vz-tile t-${k}">${AGENTS[k].tile}</span>` +
          `<span>superbot picked <b>${esc(AGENTS[k].name)}</b> for this task</span></span>`;
        R.tagEl = R.top.firstElementChild;
      }
      R.top.style.height = ((R.tagEl.offsetHeight || 22) * tagF).toFixed(2) + 'px';
      R.tagEl.style.opacity = seg(t, TASKS[tagI].at + P.tagIn[0] + 0.04, TASKS[tagI].at + P.tagIn[1]).toFixed(3);
      R.tagEl.style.transform = `translateY(${(6 * (1 - tagF)).toFixed(2)}px)`;
    } else {
      R.top.style.height = '0px';
    }

    // ---- the rail: the picked agent lifts and names itself while its answer lands
    if (railH > 0) railHover(R, TASKS[railI].k, railH, AGENTS[TASKS[railI].k].name);
    else for (const k of TASKS) railHover(R, k.k, 0, '');

    // ---- the composer draft: the task types in, then the send button dips
    let text = '', press = 0;
    for (const k of TASKS) {
      const b = k.at;
      if (t >= b - P.type && t < b) text = k.q.slice(0, Math.round(k.q.length * seg(t, b - P.type, b - 0.04)));
      press = Math.max(press, pulse(t, b));
    }
    const focused = TASKS.some((k) => t >= k.at - P.type - 0.2 && t < k.at + 1.5);
    draft(R, 'sb', text, { press, caretIdle: focused && blink(t) });

    // ---- the cursor: onto the composer, the send button, the chip, then off while the answer streams
    if (!R.keys) R.keys = cursorKeys(R, V);
    const cp = pathDesign(R, t, R.keys);
    const cvis = seg(t, P.curIn, P.curIn + 0.3) * (1 - seg(t, TASKS[2].at + P.curOut, TASKS[2].at + P.away));
    cursorAt(R, cp.x, cp.y, press, cvis);
    const clicked = TASKS.map((k) => k.at).filter((c) => c <= t).pop();
    ringAt(R, cp.x, cp.y, clicked == null ? -1 : t - clicked);
  },
};

// ---------- helpers ----------
const chipHTML = (k) => `${AGENTS[k].mark}${esc(AGENTS[k].name)}${CHEV}`;
/** the composer's platform chip takes agent k (the real chip's markup, class and all) */
function setChip(R, k) {
  if (R.chipK === k) return;
  R.chipK = k;
  R.plat.innerHTML = chipHTML(k);
  R.plat.className = 'rc-plat vz-plat k-' + k;
}

/** a press dip, 0 -> 1 -> 0 over 0.22 s from c */
function pulse(t, c) { const a = seg(t, c - 0.06, c + 0.04), b = seg(t, c + 0.04, c + 0.2); return a * (1 - b); }

/** the cursor path over the whole spot, in site design px (built once, measured after mount) */
function cursorKeys(R, V) {
  const rc = centerOf(R, V.rc), send = centerOf(R, V.send), chip = centerOf(R, V.plat);
  const keys = [{ t: 0, x: rc.l - 60, y: rc.t + 120 }];
  TASKS.forEach((k, i) => {
    const b = k.at;
    keys.push({ t: Math.max(0.5, b - 1.0), x: rc.l + 130 + 26 * i, y: rc.t + 66 });
    keys.push({ t: b - 0.12, x: send.x - 2, y: send.y });
    keys.push({ t: b + 1.0, x: chip.x - 4, y: chip.y + 2 });
    keys.push({ t: b + 1.5, x: chip.x + 8, y: chip.y + 8 });
  });
  keys.push({ t: TASKS[2].at + P.away, x: chip.x + 150, y: chip.y + 90 });
  return keys;
}
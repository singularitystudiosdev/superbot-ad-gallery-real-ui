// switch.js: the turn. The hub opens mid-thread with Claude: the brief is already written, Claude already
// answered, and the user has just sent one more request. A newly added model sits in the composer's agent
// picker with a NEW badge; one click and the same thread continues on it, the "Continued from Claude" chip
// where a new chat would have started. One press, no retyping. Beats and geometry follow claude.js.
import { clamp, lerp, seg, outCubic, outBack, esc } from '../lib.js';
import {
  DW, AGENTS, icon, mountHub, place, camera, centerOf, cursorAt, ringAt, pathDesign, railSel, reveal, viewPoint,
  viewHTML, thread, draft, streamWords, rise,
} from './hubkit.js';

// every beat, in scene seconds
const C = {
  cur: 0.3,
  toComp: [0.85, 1.25], clickComp: 1.35,
  type2: [1.45, 2.25], send2: 2.36, u2: 2.42,
  camIn: [2.8, 3.8], toChip: [3.05, 3.65], clickChip: 3.8,
  pickOpen: [3.85, 4.15],
  toNew: [4.45, 4.9], clickNew: 5.05, pickClose: [5.11, 5.29],
  rev2: [5.15, 6.1], sel2: [5.15, 5.6],
  carry: 5.7, a3: 6.3, a3w: 6.65,
  curOut: [7.6, 8.2], camOut: [8.4, 9.9],
  dur: 10.2,
};
const U1 = 'My project is a bakery website in Lisbon. Warm and handmade, no stock photos.';
const A1 = 'Noted: warm and handmade, and photo free throughout. What should we start with?';
const U2 = 'Draft the About page.';
const A3 = 'Kept the Lisbon bakery, the warm handmade voice, no stock photos. About page, first pass: baked this morning, two streets from the water. Want the rest in this voice?';
const WPS = 12.5;

const g6 = new URL('./tabs-assets/grok.png', import.meta.url).href; // the rail's Grok raster, reused for its picker row
const views = () =>
  viewHTML('claude', {
    title: 'Bakery website',
    chats: ['Bakery website', 'Q3 board deck outline', 'Regex for email validation', 'Kyoto in four days', 'Cover letter, v2'],
    msgs: [
      { id: 'u1', who: 'u', text: U1 },
      { id: 'a1', who: 'a', html: `<span class="vz-think vz-spark">${icon('claude')}</span>${A1.split(' ').map((w) => `<span class="w">${esc(w)}</span>`).join(' ')}` },
      { id: 'u2', who: 'u', text: U2 },
    ],
  }) +
  viewHTML('gpt6', {
    title: 'Bakery website',
    chats: ['Bakery website', 'Q3 board deck outline', 'Regex for email validation', 'Kyoto in four days', 'Cover letter, v2'],
    msgs: [
      { id: 'carry', who: 'raw', html: `<span class="vz-carry"><span class="vz-tile t-claude">${icon('claude')}</span>Continued from Claude</span>` },
      { id: 'u1', who: 'u', text: U1 },
      { id: 'a1', who: 'a', text: A1 },
      { id: 'u2', who: 'u', text: U2 },
      { id: 'a3', who: 'a', html: `<span class="vz-think vz-dot"></span>${A3.split(' ').map((w) => `<span class="w">${esc(w)}</span>`).join(' ')}` },
    ],
  });

// the picker: the models this account can reach, newest first, the model that just landed marked NEW
const PICK = [
  { k: 'sb', label: 'superbot', tile: `<span class="vz-tile t-sb">${AGENTS.sb.mark}</span>` },
  { k: 'gpt6', label: 'GPT-6', tile: `<span class="vz-tile t-gpt6">${icon('openai')}</span>`, note: 'NEW', isNew: true },
  { k: 'claude', label: 'Claude Opus 5.5', tile: `<span class="vz-tile t-claude">${icon('claude')}</span>` },
  { k: 'gemini', label: 'Gemini 3', tile: `<span class="vz-tile t-gemini">${icon('gemini')}</span>` },
  { k: 'grok', label: 'Grok 4.7', tile: `<span class="vz-tile t-grok"><img src="${g6}" alt=""/></span>` },
];

export default {
  dur: C.dur,

  mount(section, ctx) {
    const R = mountHub(section, ctx, views());
    section.classList.add('sw');
    const cv = R.views.claude, gv = R.views.gpt6;
    // the picker lives on the Claude composer, above its platform chip
    const pick = document.createElement('div');
    pick.className = 'vz-pick';
    pick.innerHTML = `<i class="pk-hl"></i><div class="pk-lab">Switch agent</div>` +
      PICK.map((p) => `<div class="pk${p.isNew ? ' is-new' : ''}" data-pk="${p.k}">${p.tile}<span>${p.label}</span>` +
        `${p.note ? `<em class="new">${p.note}</em>` : ''}<svg class="ok" viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg></div>`).join('');
    cv.comp.appendChild(pick);
    R.pick = pick; R.pickHl = pick.querySelector('.pk-hl');
    R.pk = Object.fromEntries([...pick.querySelectorAll('.pk')].map((n) => [n.dataset.pk, n]));
    R.ok = { claude: R.pk.claude.querySelector('.ok'), gpt6: R.pk.gpt6.querySelector('.ok') };
    R.cthink = cv.el.querySelector('.vz-think');
    R.gthink = gv.el.querySelector('.vz-think');
    return R;
  },

  render(t, ctx) {
    const R = ctx.state;
    const g = place(R, ctx.W);
    const cv = R.views.claude, gv = R.views.gpt6;

    // ---- camera: push in for the picker (clamped, so the rail and the open picker both stay in frame),
    //      ease back out while the new model answers
    const zin = outCubic(seg(t, ...C.camIn)), zout = outCubic(seg(t, ...C.camOut));
    zoom(R, g, ctx.W, 1 + 0.12 * zin * (1 - zout));

    // ---- rail: this thread has been Claude's all along; the selection follows the model to OpenAI's slot
    railSel(R, 'claude', 'gpt', t >= C.sel2[0] ? seg(t, ...C.sel2) : 0);

    // ---- the views: Claude is the hub's thread from the first frame, GPT-6 grows out of the composer chip
    reveal(R, 'claude', t >= C.rev2[1] ? 0 : 1);
    const chip = centerOf(R, cv.plat), p2 = viewPoint(R, chip.x, chip.y);
    reveal(R, 'gpt6', outCubic(seg(t, ...C.rev2)) * 0.999 + (t >= C.rev2[1] ? 0.001 : 0), p2.x, p2.y);

    // ---- Claude's thread: the brief, the answer, then one more request the user is about to move
    thread(R, 'claude', { u1: rise(t, C.u1), a1: rise(t, C.a1), u2: rise(t, C.u2) });
    const th = R.cthink;
    const sparkOn = seg(t, C.a1, C.a1 + 0.2) * (1 - seg(t, C.a1 + 0.55, C.a1 + 0.8));
    th.style.opacity = sparkOn.toFixed(3);
    th.style.transform = `rotate(${((t - C.a1) * 160).toFixed(1)}deg) scale(${(0.86 + 0.14 * Math.sin((t - C.a1) * 7) * sparkOn).toFixed(3)})`;
    streamWords(cv.m.a1, C.a1 + 0.6, 11, t);

    // ---- the composer: one more request, sent just before the switch
    let text = '', press = 0;
    if (t >= C.type2[0] && t < C.send2) text = U2.slice(0, Math.round(U2.length * seg(t, ...C.type2)));
    press = pulse(t, C.send2);
    const typing = t >= C.clickComp && t < C.send2;
    draft(R, 'claude', text, { press, caretIdle: typing && Math.floor(t * 2.2) % 2 === 0 });

    // ---- the picker
    const po = outBack(seg(t, ...C.pickOpen)) * (1 - seg(t, ...C.pickClose));
    const shown = t >= C.pickOpen[0] && t < C.pickClose[1];
    R.pick.style.visibility = shown ? 'visible' : 'hidden';
    if (shown) {
      if (!R.pickPos) {
        R.pickPos = true;
        R.pick.style.left = (cv.plat.offsetLeft + cv.plat.offsetParent.offsetLeft + cv.plat.offsetWidth / 2 - 151).toFixed(1) + 'px';
        R.pick.style.bottom = 'calc(100% - 16px)';
      }
      R.pick.style.opacity = clamp(po * 1.2).toFixed(3);
      R.pick.style.transform = `translateY(${(8 * (1 - po)).toFixed(2)}px) scale(${(0.94 + 0.06 * po).toFixed(3)})`;
      const yOf = (k) => R.pk[k].offsetTop;
      const hf = outCubic(seg(t, ...C.toNew));
      R.pickHl.style.top = lerp(yOf('claude'), yOf('gpt6'), hf).toFixed(2) + 'px';
      R.pickHl.style.opacity = (0.7 + 0.3 * hf).toFixed(3);
      R.pk.gpt6.style.transform = `scale(${(1 - 0.03 * pulse(t, C.clickNew)).toFixed(3)})`;
      // the check rides to the model the user just picked
      const moved = seg(t, C.clickNew, C.clickNew + 0.12);
      R.ok.claude.style.opacity = (1 - moved).toFixed(3);
      R.ok.gpt6.style.opacity = moved.toFixed(3);
    }

    // ---- GPT-6's thread: the conversation it inherited, then the answer that uses it
    thread(R, 'gpt6', { a3: rise(t, C.a3) });
    const dot = seg(t, C.a3, C.a3 + 0.15) * (1 - seg(t, C.a3w - 0.1, C.a3w + 0.05));
    R.gthink.style.opacity = dot.toFixed(3);
    R.gthink.style.transform = `scale(${(0.8 + 0.2 * Math.sin((t - C.a3) * 9)).toFixed(3)})`;
    R.gthink.style.width = dot > 0.01 ? '' : '0px';
    R.gthink.style.margin = dot > 0.01 ? '' : '0';
    streamWords(gv.m.a3, C.a3w, WPS, t);

    // ---- cursor: into the composer, onto the chip, then down the picker to the new row
    const rc = centerOf(R, cv.rc);
    const pk = R.pickPos ? centerOf(R, R.pk.gpt6) : { x: chip.x, y: chip.y - 70 };
    const keys = [
      { t: C.cur, x: 700, y: 430 },
      { t: C.toComp[0], x: 700, y: 430 },
      { t: C.toComp[1], x: rc.l + 150, y: rc.t + 34 },
      { t: C.type2[1] + 0.2, x: rc.l + 190, y: rc.t + 62 },
      { t: C.toChip[0], x: rc.l + 200, y: rc.t + 68 },
      { t: C.toChip[1], x: chip.x + 4, y: chip.y + 1 },
      { t: C.toNew[0], x: chip.x + 4, y: chip.y + 1 },
      { t: C.toNew[1], x: pk.x - 44, y: pk.y + 1 },
      { t: C.curOut[1], x: pk.x + 30, y: pk.y + 60 },
    ];
    const cp = pathDesign(R, t, keys);
    const pr = pulse(t, C.clickComp) + pulse(t, C.clickChip) + pulse(t, C.clickNew);
    cursorAt(R, cp.x, cp.y, pr, seg(t, C.cur, C.cur + 0.25) * (1 - seg(t, ...C.curOut)));
    const last = [C.clickComp, C.clickChip, C.clickNew].filter((c) => c <= t).pop();
    ringAt(R, cp.x, cp.y, last == null ? -1 : t - last);
    cv.plat.style.background = `rgba(255,255,255,${(0.1 * seg(t, C.toChip[1] - 0.15, C.toChip[1]) * (1 - seg(t, C.pickClose[0], C.pickClose[1]))).toFixed(3)})`;
  },
};


/** the push-in: pivoted on the stage centre and clamped, so the camera can never eat a letterbox margin
    (the hub app fills 94% of the width at 4x5, so there is almost nothing to spend there) */
function zoom(R, g, W, s) {
  const H = 1080;
  const smax = Math.min(s, (W / 2) / Math.max(1, W / 2 - g.L), (H / 2) / Math.max(1, H / 2 - g.T));
  camera(R, smax, DW / 2, g.DH / 2);
}
/** a press dip, 0 -> 1 -> 0 over 0.22 s from c */
function pulse(t, c) { const a = seg(t, c - 0.06, c + 0.04), b = seg(t, c + 0.04, c + 0.2); return a * (1 - b); }

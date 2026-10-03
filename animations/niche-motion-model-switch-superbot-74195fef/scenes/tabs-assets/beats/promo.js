// The promo inside the ad: "launch_promo_v12", a short kinetic-type spot for the fictional cold brew client Fernway,
// built here in HTML/CSS as a pure function of its own time pt (seconds into the promo, 0 <= pt < P). One module, used
// by Gemini's filmstrip (the 16x9 layout frozen at 8 instants) and by the three Composition viewers of the After Effects
// result (9x16, 1x1 and 4x5, each in its own layout, in sync). Eight shots:
//   1 "Meet the new"            green, the line rises out of a mask
//   2 the bottle photo + "Fernway Cold Brew"   oat; the photo opens from the bottom, the name rises (16x9: the bottle
//                               sits on the left third)
//   3 "Oat. Vanilla. Ice."      green; one line 1,420 px wide on 16x9, two lines on every other size
//   4 "Oat."  5 "Vanilla."  6 "Ice."   hard cuts on the beat, one word each, alternating colours
//   7 the photo full bleed      a slow settle
//   8 the lockup "Fernway"      green; letters rise in turn, a rule draws under them (16x9: on the lower edge; 4x5:
//                               lifted 96 px off it). The lockup has fully landed at LOCK_AT and holds to P.
// Every move is an ease-out (outQuint / outCubic) or an inOutCubic wipe; no bounce, no linear slides, no CSS
// animation or transition: every value is written from pt. Two flat brand colours (promo.css), no gradients or glow.
// Every layout is in the comp's own px (16x9 1920x1080, 9x16 1080x1920, 1x1 1080x1080, 4x5 1080x1350) and keeps
// everything inside title safe (10% each side) except full-bleed photo and the 16x9 lockup, which the brief puts on
// the lower edge on purpose (it is what Gemini flags in shot 8).
import { seg, lerp, outCubic, outQuint, inOutCubic } from '../../../lib.js';

const IMG = new URL('../../../img/fernway_bottle.jpg?v=74195fef', import.meta.url).href;
export const SIZES = { '16x9': [1920, 1080], '9x16': [1080, 1920], '1x1': [1080, 1080], '4x5': [1080, 1350] };
export const P = 6.0;          // the promo's own loop
export const LOCK_AT = 4.85;   // every letter of the lockup has landed
// the 8 instants Gemini's filmstrip shows (one inside each shot)
export const SHOT_T = [0.55, 1.45, 2.3, 2.72, 3.17, 3.62, 4.2, 5.4];
// shot starts
const S = [0, 0.7, 1.6, 2.4, 2.85, 3.3, 3.75, 4.35];
const WIPE = 0.2;              // a shot wiping over the last (inOutCubic)

// per-size layouts. txt: [x, y(top), w, font px, align, lines]; ph: photo [x, y, w, h, object-position]
const L = {
  '16x9': {
    s1: [192, 452, 1536, 168, 'center', ['Meet the new']],
    ph2: [192, 108, 560, 864, '30% 50%'],
    s2: [860, 372, 868, 150, 'left', ['Fernway', 'Cold Brew']],
    s3: [192, 430, 1536, 205, 'center', ['Oat. Vanilla. Ice.']], // measured 1,420 px wide (the shot 3 finding)
    word: 300,
    ph7: [0, 0, 1920, 1080, '55% 60%'],
    s8: [192, 752, 1536, 214, 'center', ['Fernway']], rule8: [760, 1004, 400],
  },
  '9x16': {
    s1: [108, 776, 864, 176, 'center', ['Meet', 'the new']],
    ph2: [108, 300, 864, 940, '42% 50%'],
    s2: [108, 1320, 864, 128, 'center', ['Fernway', 'Cold Brew']],
    s3: [108, 787, 864, 160, 'center', ['Oat. Vanilla.', 'Ice.']],
    word: 230,
    ph7: [0, 0, 1080, 1920, '55% 50%'],
    s8: [108, 836, 864, 196, 'center', ['Fernway']], rule8: [380, 1080, 320],
  },
  '1x1': {
    s1: [108, 474, 864, 122, 'center', ['Meet the new']],
    ph2: [108, 108, 400, 864, '32% 50%'],
    s2: [556, 420, 416, 80, 'left', ['Fernway', 'Cold Brew']],
    s3: [108, 367, 864, 160, 'center', ['Oat. Vanilla.', 'Ice.']],
    word: 220,
    ph7: [0, 0, 1080, 1080, '55% 60%'],
    s8: [108, 420, 864, 178, 'center', ['Fernway']], rule8: [390, 640, 300],
  },
  '4x5': {
    s1: [108, 500, 864, 166, 'center', ['Meet', 'the new']],
    ph2: [108, 135, 864, 690, '40% 50%'],
    s2: [108, 880, 864, 112, 'center', ['Fernway', 'Cold Brew']],
    s3: [108, 502, 864, 160, 'center', ['Oat. Vanilla.', 'Ice.']],
    word: 230,
    ph7: [0, 0, 1080, 1350, '55% 55%'],
    s8: [108, 872, 864, 196, 'center', ['Fernway']], rule8: [390, 1112, 300],
  },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const LH = 1.08; // line box (the mask) in em: room for the descender of "y"

function txt([x, y, w, fs, al, lines], cls, split) {
  const inner = lines.map((ln) => {
    if (split === 'char') return `<span class="pm-ln">${[...ln].map((c) => `<span class="pm-m"><span class="pm-in">${esc(c)}</span></span>`).join('')}</span>`;
    if (split === 'word') return `<span class="pm-ln">${ln.split(' ').map((wd) => `<span class="pm-m"><span class="pm-in">${esc(wd)}</span></span>`).join(' ')}</span>`;
    return `<span class="pm-ln pm-m"><span class="pm-in">${esc(ln)}</span></span>`;
  }).join('');
  return `<div class="pm-tx ${cls}" style="left:${x}px;top:${y}px;width:${w}px;font-size:${fs}px;line-height:${LH};text-align:${al}">${inner}</div>`;
}
const photo = ([x, y, w, h, pos], cls) => `<div class="pm-ph ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><img src="${IMG}" alt="" style="object-position:${pos}"/></div>`;

export function makePromo(size) {
  const [W, H] = SIZES[size];
  const l = L[size];
  const word = (w) => `<div class="pm-word" style="font-size:${l.word}px;line-height:${LH}"><span class="pm-m"><span class="pm-in">${w}</span></span></div>`;
  const el = document.createElement('div');
  el.className = `pm pm-${size}`;
  el.style.width = `${W}px`; el.style.height = `${H}px`;
  el.innerHTML = `
    <div class="pm-sh pm-g">${txt(l.s1, 'pm-t1')}</div>
    <div class="pm-sh pm-o">${photo(l.ph2, 'pm-p2')}${txt(l.s2, 'pm-t2')}</div>
    <div class="pm-sh pm-g">${txt(l.s3, 'pm-t3', 'word')}</div>
    <div class="pm-sh pm-o">${word('Oat.')}</div>
    <div class="pm-sh pm-g">${word('Vanilla.')}</div>
    <div class="pm-sh pm-o">${word('Ice.')}</div>
    <div class="pm-sh pm-o">${photo(l.ph7, 'pm-p7')}</div>
    <div class="pm-sh pm-g">${txt(l.s8, 'pm-t8', 'char')}<i class="pm-rule" style="left:${l.rule8[0]}px;top:${l.rule8[1]}px;width:${l.rule8[2]}px"></i></div>`;
  const sh = [...el.querySelectorAll('.pm-sh')];
  const ins = sh.map((s) => [...s.querySelectorAll('.pm-in')]);
  const p2 = el.querySelector('.pm-p2'), p2i = p2.querySelector('img'), p7i = el.querySelector('.pm-p7 img');
  const rule = el.querySelector('.pm-rule');
  const rise = (n, p) => { n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 104).toFixed(2)}%)`; };
  // the wipe each shot enters with: [shot index, direction] (cuts have none)
  const WIPES = { 1: 'r', 2: 'b', 7: 'l' };
  let last = -2;

  function render(ptIn) {
    const pt = ((ptIn % P) + P) % P;
    // which shots are on: the current one, and the one under it while the current wipes in
    let cur = 0;
    for (let i = 0; i < S.length; i++) if (pt >= S[i]) cur = i;
    sh.forEach((n, i) => {
      const on = i === cur || (i === cur - 1 && WIPES[cur] && pt < S[cur] + WIPE);
      n.style.visibility = on ? 'visible' : 'hidden';
      if (!on) return;
      const dir = WIPES[i];
      if (i === cur && dir) {
        const w = inOutCubic(seg(pt, S[i], S[i] + WIPE));
        const k = ((1 - w) * 100).toFixed(2);
        n.style.clipPath = w >= 1 ? '' : dir === 'r' ? `inset(0 0 0 ${k}%)` : dir === 'l' ? `inset(0 ${k}% 0 0)` : `inset(${k}% 0 0 0)`;
      } else n.style.clipPath = '';
    });
    if (cur !== last) last = cur;
    // shot 1: the line rises out of its mask
    ins[0].forEach((n, j) => rise(n, outQuint(seg(pt, 0.06 + j * 0.08, 0.5 + j * 0.08))));
    // shot 2: the photo opens from the bottom and settles, then the name rises line by line
    const o2 = outCubic(seg(pt, S[1] + 0.06, S[1] + 0.48));
    p2.style.clipPath = o2 >= 1 ? '' : `inset(${((1 - o2) * 100).toFixed(2)}% 0 0 0)`;
    p2i.style.transform = `scale(${lerp(1.12, 1, outCubic(seg(pt, S[1], S[1] + 0.85))).toFixed(4)})`;
    ins[1].forEach((n, j) => rise(n, outQuint(seg(pt, S[1] + 0.22 + j * 0.09, S[1] + 0.62 + j * 0.09))));
    // shot 3: word by word
    ins[2].forEach((n, j) => rise(n, outQuint(seg(pt, S[2] + 0.1 + j * 0.1, S[2] + 0.48 + j * 0.1))));
    // shots 4 to 6: one word each, rising on the cut
    [3, 4, 5].forEach((i) => ins[i].forEach((n) => rise(n, outQuint(seg(pt, S[i], S[i] + 0.3)))));
    // shot 7: the photo full bleed, a slow settle
    p7i.style.transform = `scale(${lerp(1.16, 1.04, outCubic(seg(pt, S[6], S[7]))).toFixed(4)})`;
    // shot 8: the lockup letter by letter (the last lands at LOCK_AT), then the rule draws from the centre
    const n8 = ins[7].length;
    ins[7].forEach((n, j) => { const a = S[7] + 0.08 + j * ((LOCK_AT - 0.42 - S[7] - 0.08) / Math.max(1, n8 - 1)); rise(n, outQuint(seg(pt, a, a + 0.42))); });
    rule.style.transform = `scaleX(${outQuint(seg(pt, LOCK_AT - 0.2, LOCK_AT + 0.25)).toFixed(4)})`;
  }
  return { el, W, H, render };
}

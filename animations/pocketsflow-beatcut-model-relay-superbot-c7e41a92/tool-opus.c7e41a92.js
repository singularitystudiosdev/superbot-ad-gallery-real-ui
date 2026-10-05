// Claude Opus 5.5 in the code workspace: writes the two React scenes (the live preview builds as each line
// lands), cuts LaunchFilm.tsx on the bar grid, then renders with Remotion. The tree shows every earlier
// model's output sitting in public/, so the relay is visible in one place.
import { h } from './shell.c7e41a92.js';
import { icon } from './icons.c7e41a92.js';
import { EASE, prog, clamp01 } from './ease.c7e41a92.js';
import { O, PANEL, CLIPS } from './plan.c7e41a92.js';
import { FILES, highlight } from './code.c7e41a92.js';
import { checkout, payouts } from './pfui.c7e41a92.js';

const PLAN = [ // [file, start, end] relative to O
  ['Checkout.tsx', 0.35, 2.5], ['Payouts.tsx', 2.65, 3.55], ['LaunchFilm.tsx', 3.7, 4.85],
];
const TREE = [
  ['launch-film', 0, 'dir'], ['public', 1, 'dir'],
  ['score.mp3', 2, 'f', 'brand/elevenlabs-logo.svg'], ['stills/ nb1 nb2 nb4', 2, 'f', 'brand/gemini-logo.svg'],
  ['pf-icon/ 60 frames', 2, 'f', 'brand/blender-logo.svg'], ['beats.json', 2, 'f', 'brand/deepseek-logo.svg'],
  ['src', 1, 'dir'], ['scenes/Checkout.tsx', 2, 'new', 0], ['scenes/Payouts.tsx', 2, 'new', 1], ['LaunchFilm.tsx', 2, 'new', 2],
];
const PREVIEW = { x: 776, y: 70, w: 430, h: 364 }; // tool coords
const CMD = '$ npx remotion render LaunchFilm out/launch.mp4';

export function buildOpus() {
  const files = PLAN.map(([name]) => FILES[name].split('\n'));
  const el = h(`<div class="tool t-op">
<header class="otop"><img src="brand/claude-logo-orange.svg" alt=""><b>Claude Opus 5.5</b><span>launch-film</span><em data-ost></em><span class="br">⎇ main</span></header>
<aside class="otree">${TREE.map((n, i) => `<div class="tn d${n[1]} ${n[2]}" data-tn="${i}">${n[2] === 'dir' ? '▾ ' : ''}${n[0]}${n[3] && typeof n[3] === 'string' ? `<img src="${n[3]}" alt="">` : ''}${n[2] === 'new' ? '<b>A</b>' : ''}</div>`).join('')}</aside>
<section class="oed"><div class="otabs">${PLAN.map(([n]) => `<span data-tab>${n}</span>`).join('')}</div>
  ${files.map((lines, f) => `<div class="ocode" data-file="${f}">${lines.map((l, i) => `<div class="ol"><span class="no">${i + 1}</span><span class="tx" data-tx style="width:0ch">${highlight(l)}</span><i class="cur" data-cur></i></div>`).join('')}</div>`).join('')}</section>
<section class="oprev"><div class="oph">${icon('globe')}localhost:3000/<span data-route>Checkout</span><em>Preview</em></div><div class="opc" data-pc></div></section>
<section class="oterm"><div class="oth">Terminal</div><div class="otl"><span data-cmd></span></div>
  <div class="otl dim" data-l1>Bundled 9 files in 1.1s</div>
  <div class="otl" data-l2>Rendering frames <span class="bar"><i data-pbar></i></span> <span data-pn>0/420</span></div>
  <div class="otl ok" data-l3>✓ out/launch.mp4 · 1920×1080 · 30 fps · 14.0 s</div></section>
</div>`);
  const q = (s) => el.querySelector(s), qa = (s) => [...el.querySelectorAll(s)];
  const tabs = qa('[data-tab]'), codes = qa('[data-file]'), ost = q('[data-ost]'), route = q('[data-route]');
  const lineEls = codes.map((c) => [...c.querySelectorAll('[data-tx]')]), curs = codes.map((c) => [...c.querySelectorAll('[data-cur]')]);
  const treeNew = qa('.tn.new');
  const co = checkout(), po = payouts();
  q('[data-pc]').append(co.el, po.el);
  const cmd = q('[data-cmd]'), l1 = q('[data-l1]'), l2 = q('[data-l2]'), l3 = q('[data-l3]'), pbar = q('[data-pbar]'), pn = q('[data-pn]');
  // Checkout preview parts appear when the line that declares them finishes typing.
  const lineDone = (f, i) => {
    const [, a, b] = PLAN[f];
    const total = files[f].reduce((s, l) => s + Math.max(l.length, 4), 0);
    let acc = 0;
    for (let k = 0; k <= i; k++) acc += Math.max(files[f][k].length, 4);
    return O + a + (b - a) * (acc / total);
  };
  const reveal = { page: lineDone(0, 4), card: lineDone(0, 5), img: lineDone(0, 6), title: lineDone(0, 7), price: lineDone(0, 8), btn: lineDone(0, 9), fine: lineDone(0, 10) };
  for (const c of CLIPS) if (c.kind === 'ui') c.src = [PREVIEW.x, PANEL.tabsH + PREVIEW.y, PREVIEW.w, PREVIEW.h];

  return {
    id: 'opus', label: 'Claude Opus 5.5', logo: 'brand/claude-logo-orange.svg', tileBg: '#1f1e1d', el,
    update(t) {
      const r = t - O;
      let active = 0;
      PLAN.forEach(([, a], f) => { if (r >= a - 0.1) active = f; });
      tabs.forEach((tb, f) => {
        tb.classList.toggle('on', f === active);
        tb.style.opacity = prog(r, PLAN[f][1] - 0.15, 0.2, EASE.standard).toFixed(3);
      });
      codes.forEach((c, f) => (c.style.display = f === active ? 'block' : 'none'));
      const [name, a] = PLAN[active];
      ost.textContent = r < 4.9 ? `Writing src/${active === 2 ? '' : 'scenes/'}${name}` : r < 6.1 ? 'Rendering with Remotion' : 'Done';
      const last = files[active].length - 1;
      lineEls[active].forEach((tx, i) => {
        const start = i ? lineDone(active, i - 1) : O + a, end = lineDone(active, i);
        const k = clamp01((t - start) / Math.max(0.001, end - start));
        tx.style.width = `${Math.round(files[active][i].length * k)}ch`;
        const typing = t >= start && t < end;
        const resting = i === last && t >= end && Math.floor(t * 3) % 2 === 0;
        curs[active][i].style.opacity = typing || resting ? '1' : '0';
      });
      treeNew.forEach((tn, f) => (tn.style.opacity = prog(r, PLAN[f][1], 0.2, EASE.standard).toFixed(3)));
      const showPayouts = r >= 2.75;
      co.el.style.display = showPayouts ? 'none' : '';
      po.el.style.display = showPayouts ? '' : 'none';
      route.textContent = showPayouts ? 'Payouts' : 'Checkout';
      if (!showPayouts) co.update(t, { reveal, tap: O + 2.25 });
      else po.update(t, { t0: O + 3.0, dur: 1.0, show: O + 2.8 });
      cmd.textContent = CMD.slice(0, Math.round(CMD.length * clamp01((r - 4.95) / 0.3)));
      l1.style.opacity = prog(r, 5.35, 0.15, EASE.standard).toFixed(3);
      l2.style.opacity = prog(r, 5.45, 0.15, EASE.standard).toFixed(3);
      const pk = clamp01((r - 5.45) / 0.6);
      pbar.style.transform = `scaleX(${pk.toFixed(4)})`;
      pn.textContent = `${Math.round(420 * pk)}/420`;
      l3.style.opacity = prog(r, 6.1, 0.2, EASE.standard).toFixed(3);
    },
  };
}

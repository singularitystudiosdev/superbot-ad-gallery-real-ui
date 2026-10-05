// The finished launch film (1920x1080, 14 s), cut to the Eleven Music take's measured grid:
// bars on 0.065 + 2n, breakdown gap 3.5-4.065, drop on bar 3, gap 11.5-12.065, final hit on bar 7.
// Every picture is a model output: DeepSeek's lines, the Blender turntable, Nano Banana Pro stills,
// Claude Opus 5.5's React scenes.
import { h } from './shell.c7e41a92.js';
import { EASE, prog, lerp, clamp01 } from './ease.c7e41a92.js';
import { PHASE, BAR } from './score.c7e41a92.js';
import { drawFrame } from './frames.c7e41a92.js';
import { checkout, payouts } from './pfui.c7e41a92.js';

const b = (n, beat = 0) => PHASE + n * BAR + beat * (BAR / 4);
const SCENES = [
  ['hook', 0, 3.5], ['drop', b(2), b(3)], ['nb1', b(3), b(3, 2)], ['nb2', b(3, 2), b(4)],
  ['co', b(4), b(5)], ['po', b(5), 11.5], ['poster', b(6), 14.2],
];

export function buildFilm() {
  const el = h(`<div class="film">
<section class="fs hook" data-s="hook"><div class="hl"><span data-w>Gumroad keeps</span><b data-w>$10.50</b></div>
  <div class="hl two"><span data-w>of every</span><b data-w>$100</b><span data-w>you sell.</span></div></section>
<section class="fs drop" data-s="drop"><canvas width="1920" height="1080" data-tt></canvas><div class="keeps" data-keeps>Pocketsflow keeps <b>$5.</b></div></section>
<section class="fs still" data-s="nb1"><img src="img/nb1.jpg" alt=""></section>
<section class="fs still" data-s="nb2"><img src="img/nb2.jpg" alt=""></section>
<section class="fs ui" data-s="co"></section>
<section class="fs ui" data-s="po"></section>
<section class="fs still" data-s="poster"><img src="img/nb4.jpg" alt=""></section>
<div class="fblack" data-black></div>
</div>`);
  const sec = Object.fromEntries([...el.querySelectorAll('[data-s]')].map((n) => [n.dataset.s, n]));
  const words = [...el.querySelectorAll('[data-w]')];
  const wordAt = [b(0), b(0, 1), b(1), b(1, 1), b(1, 2)];
  const lines = [...el.querySelectorAll('.hl')];
  const tt = el.querySelector('[data-tt]'), keeps = el.querySelector('[data-keeps]'), black = el.querySelector('[data-black]');
  const co = checkout(), po = payouts();
  sec.co.appendChild(co.el);
  sec.po.appendChild(po.el);
  let lastFrame = -1;

  return {
    el,
    update(ft) {
      for (const [id, a, z] of SCENES) sec[id].style.display = ft >= a && ft < z ? '' : 'none';
      // Bar 1-2: the hook, one word group per beat; bar 1 lifts away when bar 2 lands.
      words.forEach((w, i) => {
        const k = prog(ft, wordAt[i], 0.22, EASE.outCubic);
        const slam = w.tagName === 'B' ? lerp(1.35, 1, prog(ft, wordAt[i], 0.26, EASE.outBack)) : 1;
        w.style.opacity = k.toFixed(3);
        w.style.transform = `translateY(${((1 - k) * 28).toFixed(2)}px) scale(${slam.toFixed(4)})`;
      });
      const lift = prog(ft, b(1) - 0.08, 0.3, EASE.outCubic);
      lines[0].style.transform = `translateY(${(-150 * lift).toFixed(2)}px) scale(${lerp(1, 0.62, lift).toFixed(4)})`;
      lines[0].style.opacity = lerp(1, 0.38, lift).toFixed(3);
      // Bar 3, the drop: the Blender turntable at 30 fps, then the line on beat 3.
      if (ft >= b(2) && ft < b(3)) {
        const f = 1 + Math.min(59, Math.floor((ft - b(2)) * 30));
        if (f !== lastFrame) {
          drawFrame(tt, f);
          lastFrame = f;
        }
        const punch = 1 - prog(ft, b(2), 0.35, EASE.outCubic);
        tt.style.transform = `scale(${(1 + 0.08 * punch).toFixed(4)})`;
      }
      const kk = prog(ft, b(2, 2), 0.3, EASE.outCubic);
      keeps.style.opacity = kk.toFixed(3);
      keeps.style.transform = `translateY(${((1 - kk) * 30).toFixed(2)}px)`;
      // Bar 4: two stills, one cut on beat 3, each with a slow push.
      sec.nb1.firstElementChild.style.transform = `scale(${lerp(1.04, 1.12, clamp01((ft - b(3)) / 1)).toFixed(4)})`;
      sec.nb2.firstElementChild.style.transform = `scale(${lerp(1.12, 1.05, clamp01((ft - b(3, 2)) / 1)).toFixed(4)})`;
      // Bars 5-6: the coded product, checkout tapped on the downbeat of beat 3, payouts counting on the beat.
      if (ft >= b(4) && ft < b(5)) co.update(ft, { reveal: { page: b(4) - 0.3, card: b(4), img: b(4) + 0.08, title: b(4) + 0.14, price: b(4) + 0.2, btn: b(4) + 0.26, fine: b(4) + 0.32 }, tap: b(4, 2) });
      if (ft >= b(5) && ft < 11.5) po.update(ft, { t0: b(5) + 0.2, dur: 0.9, show: b(5) - 0.05 });
      // Bar 7: the poster slams in on the final hit, then a slow push to black.
      const hit = prog(ft, b(6), 0.32, EASE.outCubic);
      sec.poster.firstElementChild.style.transform = `scale(${(lerp(1.14, 1.02, hit) + 0.03 * clamp01((ft - b(6) - 0.32) / 1.6)).toFixed(4)})`;
      black.style.opacity = prog(ft, 13.5, 0.45, EASE.standard).toFixed(3);
    },
  };
}

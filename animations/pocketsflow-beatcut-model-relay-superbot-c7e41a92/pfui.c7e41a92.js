// The two product scenes Claude Opus 5.5 writes (Checkout.tsx, Payouts.tsx), as rendered markup.
// The same markup feeds the editor's live preview and the film, so the film shows what the code built.
// Figures follow pocketsflow.com's own demo: Lightroom Presets Vol. 3 at $29, LAUNCH20 to $23.20, $2,480 / 63 orders / +18%.
import { h } from './shell.c7e41a92.js';
import { EASE, prog, lerp, clamp01 } from './ease.c7e41a92.js';

const WEEK = [180, 240, 210, 420, 380, 510, 540]; // sums to 2,480
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function checkout() {
  const el = h(`<div class="pf-page pf-co"><div class="pf-card" data-p="card">
  <div class="pf-img" data-p="img"><img src="img/nb2.jpg" alt=""></div>
  <h1 data-p="title">Lightroom Presets Vol. 3</h1>
  <div class="pf-price" data-p="price"><span class="code">LAUNCH20</span><s>$29.00</s><b>$23.20</b></div>
  <div class="pf-btn" data-p="btn"><span class="a">Pay $23.20</span><span class="b">Payment complete ✓</span></div>
  <p class="pf-fine" data-p="fine">Tax and VAT handled by Pocketsflow</p>
  <div class="pf-pow"><img src="brand/pocketsflow-icon.png" alt="">Powered by Pocketsflow</div></div></div>`);
  const parts = Object.fromEntries([...el.querySelectorAll('[data-p]')].map((n) => [n.dataset.p, n]));
  const btn = parts.btn, ba = btn.querySelector('.a'), bb = btn.querySelector('.b');
  return {
    el,
    /** reveal: {part: time} or null for fully built; tap: time the button is pressed. */
    update(t, { reveal = null, tap = Infinity } = {}) {
      el.style.opacity = reveal ? prog(t, reveal.page, 0.25, EASE.standard).toFixed(3) : '1';
      for (const [name, node] of Object.entries(parts)) {
        const a = reveal ? prog(t, reveal[name], 0.3, EASE.outCubic) : 1;
        node.style.opacity = a.toFixed(3);
        node.style.transform = `translateY(${((1 - a) * 14).toFixed(2)}px)`;
      }
      const press = Math.sin(Math.PI * clamp01((t - tap) / 0.2));
      const paid = prog(t, tap + 0.12, 0.3, EASE.standard);
      btn.style.transform = `scale(${(1 - 0.05 * press).toFixed(4)})`;
      btn.style.background = `rgb(${Math.round(lerp(10, 22, paid))},${Math.round(lerp(10, 163, paid))},${Math.round(lerp(10, 74, paid))})`;
      ba.style.opacity = (1 - paid).toFixed(3);
      bb.style.opacity = paid.toFixed(3);
    },
  };
}

export function payouts() {
  const max = Math.max(...WEEK);
  const el = h(`<div class="pf-page pf-po"><div class="pf-card wide" data-p="card">
  <div class="pf-lab">This week <span class="pf-live"><i></i>Live</span></div>
  <div class="pf-big" data-big>$0</div>
  <div class="pf-delta">63 orders · <b>+18%</b></div>
  <div class="pf-bars">${WEEK.map((v, i) => `<div class="pfc"><i data-bar style="--h:${((v / max) * 100).toFixed(1)}%"></i><em>${DAYS[i]}</em></div>`).join('')}</div>
  <div class="pf-pow"><img src="brand/pocketsflow-icon.png" alt="">Payouts every week · 4.7% + 30¢ per sale</div></div></div>`);
  const big = el.querySelector('[data-big]'), bars = [...el.querySelectorAll('[data-bar]')], card = el.querySelector('[data-p]');
  return {
    el,
    /** t0: when the count starts; dur: how long it takes to reach $2,480. */
    update(t, { t0, dur = 1.1, show = t0 - 0.2 }) {
      const k = EASE.outCubic(clamp01((t - t0) / dur));
      big.textContent = `$${Math.round(2480 * k).toLocaleString('en-US')}`;
      bars.forEach((b, i) => (b.style.transform = `scaleY(${EASE.outCubic(clamp01((t - t0 - i * 0.07) / 0.6)).toFixed(4)})`));
      const a = prog(t, show, 0.3, EASE.outCubic);
      card.style.opacity = a.toFixed(3);
      card.style.transform = `translateY(${((1 - a) * 18).toFixed(2)}px)`;
    },
  };
}

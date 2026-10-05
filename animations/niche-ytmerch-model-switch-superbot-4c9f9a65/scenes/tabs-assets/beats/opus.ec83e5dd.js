// Link 4, Claude Opus 5.5: writes and ships the store. Left, the editor: app/page.tsx streams in (a Next.js page that
// mounts the Mug3D viewer with Blender's mug.glb and Gemini's design-1.png, the $24 DeepSeek priced it at, and a
// Stripe checkout), then the terminal builds and deploys it. Right, the browser: localhost becomes https://sam.shop and
// the page renders, the mug turning in the 3D viewer (48 REAL Blender Cycles frames of the textured mug, the view the
// three.js viewer gives of mug.glb).
import { seg, outCubic, lerp, esc } from '../../../lib.js';
import { ic } from '../icons.ec83e5dd.js?v=4c9f9a65';

// app/page.tsx as tokens: [class, text]; k keyword, f function/component, s string, p prop, t tag, c plain
const CODE = [
  [['k', 'import'], ['c', ' { '], ['f', 'Mug3D'], ['c', ' } '], ['k', 'from'], ['s', " '@/components/Mug3D'"]],
  [['k', 'import'], ['c', ' { '], ['f', 'checkout'], ['c', ' } '], ['k', 'from'], ['s', " '@/lib/stripe'"]],
  [],
  [['k', 'export default function'], ['f', ' Store'], ['c', '() {']],
  [['c', '  '], ['k', 'return'], ['c', ' (']],
  [['c', '    <'], ['t', 'main'], ['p', ' className'], ['c', '='], ['s', '"store"'], ['c', '>']],
  [['c', '      <'], ['f', 'Mug3D'], ['p', ' glb'], ['c', '='], ['s', '"/mug.glb"'], ['p', ' art'], ['c', '='], ['s', '"/design-1.png"'], ['c', ' />']],
  [['c', '      <'], ['t', 'h1'], ['c', '>One More Take Mug</'], ['t', 'h1'], ['c', '>']],
  [['c', '      <'], ['t', 'p'], ['p', ' className'], ['c', '='], ['s', '"price"'], ['c', '>$24</'], ['t', 'p'], ['c', '>']],
  [['c', '      <'], ['t', 'p'], ['c', '>11 oz ceramic · dishwasher safe</'], ['t', 'p'], ['c', '>']],
  [['c', '      <'], ['t', 'button'], ['p', ' onClick'], ['c', '={() => '], ['f', 'checkout'], ['c', '('], ['s', "'mug-omt'"], ['c', ')}>']],
  [['c', '        Buy now']],
  [['c', '      </'], ['t', 'button'], ['c', '>']],
  [['c', '    </'], ['t', 'main'], ['c', '>']],
  [['c', '  )']],
  [['c', '}']],
];
const TOTAL = CODE.reduce((n, l) => n + l.reduce((m, [, s]) => m + s.length, 0) + 1, 0);
const SPIN_FPS = 8, FRAMES = 48, SPIN_FROM = 44; // 7.5 deg a frame: it turns through the front, the print in view

function codeHtml(n) {
  let left = n, out = '';
  CODE.forEach((line, i) => {
    let row = '';
    for (const [c, s] of line) {
      if (left <= 0) break;
      const v = s.slice(0, left);
      left -= v.length;
      row += `<span class="op-${c}">${esc(v)}</span>`;
    }
    const caret = left <= 0 && left > -1 && n < TOTAL ? '<i class="op-caret"></i>' : '';
    out += `<div class="op-ln"><em>${i + 1}</em><span>${row}${caret}</span></div>`;
    left -= 1;
  });
  return out;
}

export default {
  times(done) {
    return { end: done + 2.25 };
  },
  build(k, ctx) {
    const im = ctx.img;
    const ws = ctx.el(`
<div class="op">
  <div class="op-ed">
    <div class="op-tabs"><span class="op-tab-on">${ic('description-outline')}page.tsx</span><span>${ic('description-outline')}Mug3D.tsx</span><span>${ic('description-outline')}stripe.ts</span>
      <b class="op-who"><img src="${ctx.brand('claude-logo.svg')}" alt=""/>Opus 5.5</b></div>
    <div class="op-path">app <i>›</i> page.tsx</div>
    <div class="op-code"></div>
    <div class="op-term"><div class="op-tl"><span>$</span> next build</div><div class="op-tl op-ok"><span>${ic('check')}</span> Compiled in 2.1s · 3 routes</div>
      <div class="op-tl"><span>$</span> vercel deploy --prod</div><div class="op-tl op-ok"><span>${ic('check')}</span> Production: https://sam.shop</div></div>
  </div>
  <div class="op-br">
    <div class="op-chrome"><i></i><i></i><i></i><span class="op-url">${ic('lock')}<b class="op-u0">localhost:3000</b><b class="op-u1">sam.shop</b></span><span class="op-dep">${ic('check-circle')}Deployed</span></div>
    <div class="op-page">
      <div class="op-skel"><i></i><i></i><i></i><i></i></div>
      <div class="op-site">
        <div class="op-nav"><b>SAM RIVERA</b><span>Shop</span><span>Videos</span><span>${ic('shopping-cart-outline')}</span></div>
        <div class="op-3d">${Array.from({ length: FRAMES }, (_, i) => `<img src="${im(`spin/f-${String(i).padStart(2, '0')}.webp`)}" alt=""/>`).join('')}<span class="op-3dt">${ic('view-in-ar-outline')}3D · drag to spin</span></div>
        <div class="op-info"><h3>One More Take Mug</h3><div class="op-pr">$24.00</div><p>11 oz ceramic · dishwasher safe · ships in 3 days</p>
          <div class="op-buy">Buy now</div><small>${ic('lock')}Secure checkout with Stripe</small></div>
      </div>
    </div>
  </div>
</div>`);
    const q = (s) => ws.querySelector(s);
    const code = q('.op-code'), lines = [...ws.querySelectorAll('.op-tl')], site = q('.op-site'), skel = q('.op-skel');
    const u0 = q('.op-u0'), u1 = q('.op-u1'), dep = q('.op-dep'), who = q('.op-who');
    const spin = [...ws.querySelectorAll('.op-3d img')];
    const d = k.done, CODE_END = d + 1.15;
    let lastN = -1, lastF = -1;
    return {
      ws,
      head: 'in superbot · writing and deploying sam.shop',
      say: 'sam.shop is live: the 3D mug, $24, Stripe checkout.',
      chips: ['sam.shop', 'page.tsx', 'Mug3D.tsx'],
      out: 'sam.shop',
      render(t) {
        const n = t < d ? 0 : Math.min(TOTAL, Math.floor(TOTAL * seg(t, d, CODE_END)));
        if (n !== lastN) { code.innerHTML = codeHtml(n); lastN = n; }
        who.classList.toggle('op-busy', t >= d && t < CODE_END);
        const at = [CODE_END + 0.05, CODE_END + 0.25, CODE_END + 0.4, CODE_END + 0.6];
        lines.forEach((l, i) => { l.style.opacity = outCubic(seg(t, at[i], at[i] + 0.15)).toFixed(3); });
        const pin = outCubic(seg(t, at[1], at[1] + 0.35));
        site.style.opacity = pin.toFixed(3);
        site.style.transform = pin >= 1 ? 'none' : `translateY(${((1 - pin) * 14).toFixed(2)}px)`;
        skel.style.opacity = (1 - pin).toFixed(3);
        const live = outCubic(seg(t, at[3], at[3] + 0.25));
        u0.style.opacity = (1 - live).toFixed(3);
        u1.style.opacity = live.toFixed(3);
        dep.style.opacity = live.toFixed(3);
        dep.style.transform = `scale(${lerp(0.85, 1, live).toFixed(4)})`;
        const f = (SPIN_FROM + Math.max(0, Math.floor((t - at[1]) * SPIN_FPS))) % FRAMES;
        if (f !== lastF) { spin.forEach((s, i) => { s.style.visibility = i === f ? 'visible' : 'hidden'; }); lastF = f; }
      },
    };
  },
};

// Claude Opus 5.5: what a frontier coding model does. It writes the store (the code streams in, line by line),
// wires Stripe and ships it; the last card is the live page, built only from what the chain made: Blender's
// spinning deck, Gemini's graphic, DeepSeek's price, ElevenLabs' spot. Then each part is tagged with the model
// that made it. The sprite is the real Cycles turntable (img/spin-render.webp, 8x4 tiles, one full turn), rocked.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Coding the store. Shipping it.';
const STEPS = [
  ['Writing app/page.tsx', 'app/page.tsx · 4 files · 212 lines'],
  ['Wiring Stripe Checkout', 'Stripe Checkout · $59 · live mode'],
  ['Deploying to Vercel', 'lowtide.shop · live in 38s'],
];
const k_ = (c, s) => `<span class="op-${c}">${s}</span>`;
const CODE = [
  `${k_('k', 'import')} { Deck3D, Spot, Buy } ${k_('k', 'from')} ${k_('s', "'@/components'")};`,
  '',
  `${k_('k', 'export default function')} ${k_('f', 'Drop')}() {`,
  `  ${k_('k', 'return')} (`,
  `    &lt;${k_('c', 'main')} ${k_('p', 'className')}=${k_('s', '"drop"')}&gt;`,
  `      &lt;${k_('c', 'Deck3D')} ${k_('p', 'src')}=${k_('s', '"/deck.glb"')} ${k_('p', 'spin')} /&gt;`,
  `      &lt;${k_('c', 'h1')}&gt;The Shark Deck&lt;/${k_('c', 'h1')}&gt;`,
  `      &lt;${k_('c', 'Spot')} ${k_('p', 'src')}=${k_('s', '"/lowtide_spot.mp3"')} /&gt;`,
  `      &lt;${k_('c', 'Buy')} ${k_('p', 'price')}={${k_('n', '59')}} ${k_('p', 'priceId')}=${k_('s', '"price_shark_825"')} /&gt;`,
  `    &lt;/${k_('c', 'main')}&gt;`,
  '  );',
  '}',
];
const TAGS = [
  ['gemini', 'Graphic', 'Gemini 3 Pro Image'],
  ['blender', '3D model', 'Blender'],
  ['deepseek', 'Price', 'DeepSeek V4 Flash'],
  ['elevenlabs', 'Voice spot', 'ElevenLabs'],
  ['claude', 'Code + deploy', 'Claude Opus 5.5'],
];
const COLS = 8, ROWS = 4, N = COLS * ROWS;

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.2;
    T.step = STEPS.map((_, i) => r + 0.42 + i * 0.3);
    T.code = r + 1.25;
    T.ln = CODE.map((_, i) => T.code + 0.15 + i * 0.1);
    T.codeEnd = T.ln[CODE.length - 1] + 0.15;
    T.site = T.codeEnd + 0.3;
    T.tag = TAGS.map((_, i) => T.site + 0.75 + i * 0.24);
    T.end = T.tag[TAGS.length - 1] + 2.3;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Writing code</span><b class="yt-count">0 lines</b></div></div>');
    const rows = STEPS.map(([run]) => x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const code = x.el(`<div class="op-code">
      <div class="op-tabs"><span class="on">page.tsx</span><span>Deck3D.tsx</span><span>checkout.ts</span><span>drop.css</span></div>
      <div class="op-pre">${CODE.map((l, i) => `<div class="op-ln"><em>${i + 1}</em><span class="op-lc">${l || '&nbsp;'}</span></div>`).join('')}<i class="op-caret"></i></div>
    </div>`);
    const tag = (i) => { const [app, what, who] = TAGS[i]; return `<span class="op-tag op-tag-${i}">${x.tile(app)}<b>${x.esc(what)}</b><small>${x.esc(who)}</small></span>`; };
    const site = x.el(`<div class="op-site">
      <div class="op-bar"><i></i><i></i><i></i><span class="op-url"><svg viewBox="0 0 24 24"><path d="M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z"/></svg>lowtide.shop</span><b class="op-live">Live</b></div>
      <div class="op-page">
        <div class="op-hero"><i class="op-deck"></i>${tag(1)}</div>
        <div class="op-copy">
          <small class="op-brand">LOW TIDE SKATE CO. · DROP 001</small>
          <h3>The Shark Deck</h3>
          <p>8.25 × 32 · 7-ply maple · screen-printed</p>
          <div class="op-art"><img src="${x.img('art-thumb.png')}" alt=""/><span><b>Sunset Shark</b><small>bottom graphic</small></span>${tag(0)}</div>
          <div class="op-buyrow"><span class="op-price">$59</span><span class="op-buy">Buy now</span>${tag(2)}</div>
          <div class="op-spot"><span class="op-spot-p"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg></span><b>Hear the drop</b><span class="op-mini">${Array.from({ length: 22 }, (_, i) => `<i style="--h:${(0.3 + 0.7 * Math.abs(Math.sin(i * 1.7))).toFixed(2)}"></i>`).join('')}</span><small>0:14</small>${tag(3)}</div>
        </div>
        ${tag(4)}
      </div>
    </div>`);
    const spin = chip.querySelector('.spin'), clab = chip.querySelector('.ch-tool-t'), count = chip.querySelector('.yt-count');
    const beats = rows.map((r) => r.firstElementChild);
    const lines = [...code.querySelectorAll('.op-ln')], caret = code.querySelector('.op-caret');
    const deck = site.querySelector('.op-deck');
    const tags = TAGS.map((_, i) => site.querySelector(`.op-tag-${i}`));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const stepDone = [T.codeEnd, T.codeEnd + 0.2, T.site + 0.2];
    let shown = -1;
    return {
      nodes: [say, chip, ...rows, code, site],
      marks: [[T.r, say], [T.chip, chip], ...rows.map((r, i) => [T.step[i], r]), [T.code, code], [T.site, site]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 90, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const cd = t >= T.site + 0.2;
        spin.classList.toggle('done', cd);
        spin.style.transform = cd ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = cd ? 'Shipped' : 'Writing code';
        if (clab.textContent !== cl) clab.textContent = cl;
        const lc = `${Math.round(212 * outCubic(seg(t, T.code, T.codeEnd + 0.1)))} lines`;
        if (count.textContent !== lc) count.textContent = lc;
        beats.forEach((c, i) => {
          rise(rows[i], seg(t, T.step[i], T.step[i] + 0.3), 8);
          const done = t >= stepDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.step[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? STEPS[i][1] : STEPS[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });

        // the code streams in line by line, each line wiping on left to right
        rise(code, seg(t, T.code, T.code + 0.35), 14);
        let last = null;
        lines.forEach((ln, i) => {
          const p = seg(t, T.ln[i], T.ln[i] + 0.14);
          ln.style.opacity = p > 0 ? '1' : '0';
          ln.lastElementChild.style.clipPath = p >= 1 ? 'none' : `inset(0 ${((1 - p) * 100).toFixed(1)}% 0 0)`;
          if (p > 0) last = ln;
        });
        if (last) {
          caret.style.top = `${last.offsetTop}px`;
          caret.style.left = `${last.offsetLeft + last.offsetWidth}px`;
        }
        caret.style.opacity = t < T.codeEnd && Math.floor(t * 4) % 2 === 0 ? '1' : t < T.codeEnd ? '0.4' : '0';

        // the live page: Cycles' turntable keeps turning on the page, then every part is tagged with its maker
        const si = outCubic(seg(t, T.site, T.site + 0.5));
        site.style.opacity = si.toFixed(3);
        site.style.transform = si >= 1 ? '' : `translateY(${((1 - si) * 24).toFixed(2)}px) scale(${lerp(0.97, 1, si).toFixed(4)})`;
        const w = deck.clientWidth, h = deck.clientHeight;
        if (w) {
          // a product-page viewer: the deck rocks 12 frames either side of three-quarter on, graphic always showing
          const u = Math.max(0, t - T.site) * 5;
          const f = (26 + Math.floor(12 - Math.abs((u % 24) - 12))) % N;
          deck.style.backgroundSize = `${COLS * w}px ${ROWS * h}px`;
          deck.style.backgroundPosition = `${-(f % COLS) * w}px ${-Math.floor(f / COLS) * h}px`;
        }
        if (!deck.dataset.on) { deck.style.backgroundImage = `url("${x.img('spin-render.webp')}")`; deck.dataset.on = '1'; }
        tags.forEach((g, i) => {
          const p = seg(t, T.tag[i], T.tag[i] + 0.4);
          g.style.opacity = outCubic(p).toFixed(3);
          g.style.transform = p >= 1 ? '' : `scale(${lerp(0.6, 1, outBack(p)).toFixed(4)})`;
        });
      },
    };
  },
};
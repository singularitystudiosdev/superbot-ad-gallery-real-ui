// Claude Opus 5.5 beat: writes the launch page (site/index.html + site/mando.css, 48 lines). The card streams the
// four real lines that wire in the other models' outputs, each tagged with the model it came from (the Blender can,
// the ElevenLabs spot, Gemini's label orange), then the page renders in a preview card with the can swaying in it.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { makeCan } from './can.js';

const SAY = 'Built your launch page.';
const CODE = [
  ['<img src="can.webp" alt="MANDO">', 'blender'],
  ['<audio id="spot" src="spot.mp3">', 'eleven'],
  ['<button onclick="spot.play()">', 'eleven'],
  ['.mando { background: #ff7a1a; }', 'gemini'],
];
const LINES = 48; // site/index.html (33) + site/mando.css (15)
const SCALE = 330 / 1280;

// HTML syntax colouring: split a raw line into tag names, attribute names, strings and text, escape each piece once
const TOKENS = /(<\/?[a-z0-9]+|\s[a-z-]+=|"[^"]*"|\/?>)/;
function hl(line, esc) {
  const css = /^(\.[a-z-]+) \{ ([a-z-]+): ([^;]+); \}$/.exec(line);
  if (css) return `<span class="op-tg">${esc(css[1])}</span> { <span class="op-at">${css[2]}</span>: <span class="op-st">${esc(css[3])}</span>; }`;
  return line.split(TOKENS).filter(Boolean).map((p) => {
    if (/^<\/?[a-z0-9]+$/.test(p)) { const name = p.replace(/^<\/?/, ''); return `${esc(p.slice(0, p.length - name.length))}<span class="op-tg">${name}</span>`; }
    if (/^\s[a-z-]+=$/.test(p)) return ` <span class="op-at">${p.trim().slice(0, -1)}</span>=`;
    if (/^"[^"]*"$/.test(p)) return `<span class="op-st">${esc(p)}</span>`;
    return esc(p);
  }).join('');
}

export default {
  times(r) {
    const T = { r };
    T.say = r + 0.02;
    T.code = r + 0.06;
    T.lines = CODE.map((_, i) => r + 0.08 + i * 0.07);
    T.saved = T.lines[CODE.length - 1] + 0.14;
    T.site = r + 1.08;
    T.landed = T.site + 0.3;
    T.end = T.site + 0.5;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const code = x.el(`<div class="op-code"><div class="op-hd"><span class="op-fn">index.html · mando.css</span><span class="op-n"></span></div><pre>${CODE.map(([l, from]) => `<code><span class="op-l">${hl(l, x.esc)}</span>${from === 'eleven' ? `<span class="qc-tile op-from op-dark"><img src="${x.brand('elevenlabs-logo.svg')}" alt=""/></span>` : x.tile(from, 'op-from')}</code>`).join('')}</pre></div>`);
    const site = x.el(`<div class="op-site"><div class="op-bar"><i></i><i></i><i></i><span>localhost:5173</span></div><div class="op-view"><main class="mando" style="transform:scale(${SCALE})">
      <nav><b>MANDO</b><a>Shop</a><a>Story</a><a>Bag (0)</a></nav>
      <section class="hero"><h1>MANDO</h1><p>Mandarin cream soda.</p><a class="buy">Order a 4-pack</a><button>▶ Play the ad</button></section>
      <div class="wave"></div></main></div></div>`);
    const can = makeCan('op-can');
    site.querySelector('.hero').appendChild(can.node);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const lines = [...code.querySelectorAll('code')], cnt = code.querySelector('.op-n');
    const h1 = site.querySelector('h1'), copy = [...site.querySelectorAll('.hero > p, .hero > a, .hero > button')];
    let shown = -1, lastCnt = '';
    return {
      nodes: [say, code, site],
      marks: [[T.say, say], [T.code, code], [T.site, site]],
      render(t) {
        const n = streamCount(SAY, T.say, 95, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.code, T.code + 0.26));
        code.style.opacity = ci.toFixed(3);
        code.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 10).toFixed(2)}px)`;
        lines.forEach((l, i) => {
          const p = seg(t, T.lines[i], T.lines[i] + 0.12);
          l.style.opacity = p.toFixed(3);
          l.style.clipPath = p >= 1 ? 'none' : `inset(0 ${((1 - p) * 100).toFixed(1)}% 0 0)`;
        });
        const c = t >= T.saved ? `+${LINES} lines ✓` : 'Writing…';
        if (c !== lastCnt) { cnt.textContent = c; lastCnt = c; }
        const si = outCubic(seg(t, T.site, T.site + 0.32));
        site.style.opacity = si.toFixed(3);
        const push = 1 + 0.03 * seg(t, T.site + 0.34, T.site + 1.3);
        site.style.transform = si >= 1 ? `scale(${push.toFixed(4)})` : `translateY(${((1 - si) * 14).toFixed(2)}px) scale(${lerp(0.95, 1, si).toFixed(4)})`;
        const hp = outCubic(seg(t, T.site + 0.06, T.site + 0.4));
        h1.style.transform = hp >= 1 ? 'none' : `translateY(${((1 - hp) * 40).toFixed(1)}px)`;
        h1.style.opacity = hp.toFixed(3);
        copy.forEach((node, i) => { node.style.opacity = outCubic(seg(t, T.site + 0.14 + i * 0.05, T.site + 0.42 + i * 0.05)).toFixed(3); });
        can.node.style.opacity = outCubic(seg(t, T.site + 0.04, T.site + 0.3)).toFixed(3);
        can.render(t, x.sway0, 5);
      },
    };
  },
};

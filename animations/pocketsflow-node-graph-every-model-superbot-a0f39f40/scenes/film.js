// The Pocketsflow launch film the flow renders, as a pure function of film time f (0..FILM_DUR). Every pixel is a real
// model output: Nano Banana Pro stills (img/gen/*.jpg), Claude Opus 5.5's BuyPage.tsx rendered in both states
// (gen-data.js BUYPAGE), Blender's Cycles turntable (img/gen/blender/turn), DeepSeek's fee line and VO script
// (DS.vo) captioned on ElevenLabs' word timings (VO.words, voiced from FILM_VO_AT). The tweet embed and the flow's
// render node both mount it; the caller scales it with fit(width).
import { BUYPAGE, VO, DS } from './tabs-assets/gen-data.js';
import { clamp, lerp, seg, outCubic, inOutCubic } from '../lib.js';

export const FILM_DUR = 8.6;
export const FILM_VO_AT = 0.3; // film time the ElevenLabs take starts (the mp4 mux uses the same offset)
const FW = 1920, FH = 1080, TURN_N = 36;
const gen = (f) => new URL('../img/gen/' + f, import.meta.url).href;

// shots, hard cuts on the VO's own words
const SHOTS = [
  { k: 'studio', a: 0, b: 2.05 },
  { k: 'ui', a: 2.05, b: 3.3 },
  { k: 'flatlay', a: 3.3, b: 5.05 },
  { k: 'notify', a: 5.05, b: 6.0 },
  { k: 'street', a: 6.0, b: 6.75 },
  { k: 'end', a: 6.75, b: FILM_DUR },
];
// DeepSeek's three claim lines, without the v3 audio tag, each held over its own spoken words
const LINES = DS.vo.slice(0, 3).map((s) => s.replace(/^\[[^\]]+\]\s*/, ''));
const wordsOf = (line) => line.split(/\s+/).length;
const CAPS = (() => {
  let i = 0;
  const out = [];
  LINES.forEach((line, n) => {
    const ws = VO.words.slice(i, i + wordsOf(line));
    i += ws.length;
    const hold = [[0.3, 2.02], [3.32, 5.02], [5.45, 6.72]][n];
    out.push({ ws: ws.map((w) => ({ w: w.w, at: w.s + FILM_VO_AT })), a: hold[0], b: hold[1] });
  });
  return out;
})();
const PAID_AT = VO.words.find((w) => /^sale/.test(w.w)).s + FILM_VO_AT; // the paid state lands on "sale."

const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountFilm(host) {
  const turn = Array.from({ length: TURN_N }, (_, i) => `<img src="${gen(`blender/turn/turn-${String(i).padStart(2, '0')}.webp`)}" alt="" decoding="sync"/>`).join('');
  const root = el(`<div class="pff" aria-hidden="true">
    <div class="pff-shot" data-k="studio"><img src="${gen('studio.jpg')}" alt=""/></div>
    <div class="pff-shot pff-ui" data-k="ui"><div class="pff-bpw"><div class="pff-bp">${BUYPAGE.idle}</div><div class="pff-bp pff-paid">${BUYPAGE.paid}</div></div></div>
    <div class="pff-shot" data-k="flatlay"><img src="${gen('flatlay.jpg')}" alt=""/></div>
    <div class="pff-shot" data-k="notify"><img src="${gen('notify.jpg')}" alt=""/></div>
    <div class="pff-shot" data-k="street"><img src="${gen('street.jpg')}" alt=""/></div>
    <div class="pff-shot pff-end" data-k="end">
      <div class="pff-turn">${turn}</div>
      <div class="pff-wm"><b>Pocketsflow</b><span>The payment infrastructure that you deserve</span><em>pocketsflow.com</em></div>
    </div>
    ${CAPS.map((c) => `<div class="pff-cap">${c.ws.map((w) => `<span>${w.w}</span>`).join(' ')}</div>`).join('')}
    <div class="pff-vig"></div>
  </div>`);
  host.appendChild(root);
  const q = (s) => root.querySelector(s);
  const f = {
    root,
    shots: SHOTS.map((s) => ({ ...s, n: q(`.pff-shot[data-k="${s.k}"]`) })),
    bpw: q('.pff-bpw'), paid: q('.pff-paid'),
    buy: q('.pff-bp:not(.pff-paid) .bp-btn.bp-black:not(.bp-apple)'),
    turn: [...root.querySelectorAll('.pff-turn img')],
    wm: q('.pff-wm'),
    caps: [...root.querySelectorAll('.pff-cap')].map((n, i) => ({ n, c: CAPS[i], words: [...n.children] })),
    lastTurn: -1, w: 0,
  };
  return f;
}

// scale the 1920x1080 film into a box of the given width (its height follows 16:9)
export function fitFilm(f, w) {
  if (w === f.w) return;
  f.w = w;
  f.root.style.transform = `scale(${(w / FW).toFixed(5)})`;
}

export function renderFilm(f, ft) {
  const t = clamp(ft, 0, FILM_DUR);
  f.shots.forEach((s) => {
    const on = t >= s.a && (t < s.b || s.k === 'end');
    s.n.style.visibility = on ? 'visible' : 'hidden';
    if (!on) return;
    if (f.root.dataset.shot !== s.k) f.root.dataset.shot = s.k;
    const p = seg(t, s.a, s.b);
    const img = s.n.firstElementChild;
    if (s.k === 'studio') img.style.transform = `scale(${lerp(1.0, 1.075, p).toFixed(4)}) translate(${lerp(0, -1.2, p).toFixed(3)}%, 0)`;
    if (s.k === 'flatlay') img.style.transform = `scale(1.08) translate(${lerp(-2.2, 2.2, inOutCubic(p)).toFixed(3)}%, ${lerp(1, -1, p).toFixed(3)}%)`;
    if (s.k === 'notify') img.style.transform = `scale(${lerp(1.02, 1.12, outCubic(p)).toFixed(4)})`;
    if (s.k === 'street') img.style.transform = `scale(${lerp(1.1, 1.03, outCubic(p)).toFixed(4)})`;
  });
  // the product: Opus's BuyPage, Buy now pressed, then its paid state
  const press = Math.sin(Math.PI * seg(t, PAID_AT - 0.22, PAID_AT - 0.02));
  if (f.buy) f.buy.style.transform = `scale(${(1 - 0.05 * press).toFixed(4)})`;
  const flip = seg(t, PAID_AT, PAID_AT + 0.16);
  f.paid.style.opacity = flip.toFixed(3);
  const ui = seg(t, 2.05, 3.3);
  f.bpw.style.transform = `translate(-50%, -50%) scale(${lerp(1.5, 1.58, ui).toFixed(4)})`;
  // the end title: Blender's turntable swings, the wordmark rises
  const e = seg(t, 6.75, FILM_DUR);
  const i = Math.round((0.5 - 0.5 * Math.cos(Math.PI * 2 * e * 0.62)) * (TURN_N - 1));
  if (i !== f.lastTurn) {
    f.turn.forEach((n, j) => { n.style.display = j === i ? 'block' : 'none'; });
    f.lastTurn = i;
  }
  const wm = outCubic(seg(t, 6.95, 7.55));
  f.wm.style.opacity = wm.toFixed(3);
  f.wm.style.transform = `translateY(${((1 - wm) * 24).toFixed(2)}px)`;
  f.wm.children[1].style.opacity = outCubic(seg(t, 7.25, 7.8)).toFixed(3);
  f.wm.children[2].style.opacity = outCubic(seg(t, 7.5, 8.0)).toFixed(3);
  // captions: each word lights on its ElevenLabs timestamp
  f.caps.forEach(({ n, c, words }) => {
    const vis = t >= c.a && t < c.b;
    n.style.visibility = vis ? 'visible' : 'hidden';
    if (!vis) return;
    words.forEach((w, j) => {
      const p = outCubic(seg(t, c.ws[j].at - 0.04, c.ws[j].at + 0.16));
      w.style.opacity = p.toFixed(3);
      w.style.transform = `translateY(${((1 - p) * 18).toFixed(2)}px)`;
    });
  });
}

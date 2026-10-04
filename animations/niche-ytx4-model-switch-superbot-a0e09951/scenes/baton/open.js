// ytx4 relay baton: the open. The real superbot hub (the original ad's cropped hub: scenes/tabs-assets/hub-markup.js,
// hub.css, ask.css, chat.css), in its empty state ("Good evening. Where do we go?" over the composer). The ask is
// typed into the composer and sent; relay.js lifts it out as the baton. Section id must be s-tabs (the hub's
// stylesheets are scoped under #s-tabs).
import { seg, lerp, outCubic, inOutCubic, esc, streamCount } from '../../lib.js';
import { hubMarkup } from '../tabs-assets/hub-markup.js';
import { ASK, OPEN } from './layout.js';

const H = 1080;
const asset = (f) => `scenes/tabs-assets/${f}`;

export function mountOpen(section) {
  section.innerHTML = `
<div class="ask-root">
  <div class="sbsite ask"><div class="stage"><div class="body"><div class="arena">${hubMarkup(asset)}</div></div></div></div>
  <div class="ask-edge" aria-hidden="true"></div>
</div>`;
  const q = (s) => section.querySelector(s);
  const hub = q('.sbsite .hub');
  const main = hub.querySelector('.main');
  const hero = document.createElement('div');
  hero.className = 'ask-hero';
  hero.innerHTML = `<img class="ask-cat" src="${asset('mark-clean.svg')}" alt=""/><h1>Good evening. Where do we go?</h1>`;
  main.appendChild(hero);
  const sup = hub.querySelector('.rc-super');
  sup.innerHTML = 'SUPER<i class="ask-tg"><b></b>OFF</i>';
  const o = {
    section, site: q('.sbsite'), hub, main, hero,
    composer: hub.querySelector('.composer'), pill: hub.querySelector('.composer .pill'),
    ph: hub.querySelector('.rc-ph'), send: hub.querySelector('.rc-send'), phText: hub.querySelector('.rc-ph').textContent,
    lastPh: null, geo: null,
  };
  return { o, render: (t) => render(o, t), origin: () => origin(o) };
}

function geo(o, W) {
  if (o.geo) return o.geo;
  const DW = Math.max(560, Math.min(960, W / 2));
  const k = W / DW, DH = H / k;
  o.site.style.width = DW + 'px';
  o.site.style.height = DH.toFixed(3) + 'px';
  o.site.style.setProperty('--dw', DW + 'px');
  o.geo = { W, DW, DH, k, lift: null };
  return o.geo;
}
// the composer sits just under the greeting, the pair centred in the frame (tabs.js lift)
function lift(o, g) {
  if (g.lift !== null) return g.lift;
  const main = o.main.getBoundingClientRect();
  if (!main.height) return 0;
  const s = main.height / g.DH;
  const comp = o.composer.getBoundingClientRect(), hero = o.hero.getBoundingClientRect();
  const compH = comp.height / s, heroH = hero.height / s;
  const groupTop = (g.DH - (heroH + 34 + compH)) / 2;
  o.hero.style.top = groupTop.toFixed(2) + 'px';
  g.lift = (comp.top - main.top) / s - (groupTop + heroH + 34);
  return g.lift;
}

// where the card is born: the centre of the composer pill, in stage px
let ORIGIN = null;
function origin(o) {
  if (ORIGIN) return ORIGIN;
  const stage = document.getElementById('stage').getBoundingClientRect();
  const k = stage.width / 1920;
  const b = o.pill.getBoundingClientRect();
  if (!b.width) return { cx: 960, cy: 600 };
  ORIGIN = { cx: (b.left + b.width / 2 - stage.left) / k, cy: (b.top + b.height / 2 - stage.top) / k };
  return ORIGIN;
}
export function resetOrigin() { ORIGIN = null; }

function render(o, t) {
  const g = geo(o, 1920);
  const up = lift(o, g);
  o.composer.style.transform = `translateY(${(-up).toFixed(2)}px)`;
  o.hero.style.opacity = '1';
  o.hero.style.transform = 'translate(-50%, 0px)';

  // the ask types in (part typed on frame 0), then the send press; on send the composer clears
  let ph;
  if (t < OPEN.send + 0.04) {
    const rest = ASK.length - OPEN.typedAt0;
    const n = Math.min(ASK.length, OPEN.typedAt0 + Math.floor(rest * seg(t, OPEN.type0, OPEN.type1) + 1e-6));
    ph = `<span class="qc-typed">${esc(ASK.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else ph = esc(o.phText);
  if (ph !== o.lastPh) { o.ph.innerHTML = ph; o.lastPh = ph; }
  o.send.classList.toggle('qc-on', t < OPEN.send + 0.04);
  const dip = t >= OPEN.send - 0.1 && t < OPEN.send + 0.16 ? Math.sin(Math.PI * seg(t, OPEN.send - 0.1, OPEN.send + 0.16)) : 0;
  o.send.style.transform = dip ? `scale(${(1 - 0.16 * dip).toFixed(4)})` : 'none';

  // camera: the empty state, a little pushed in; as the card lifts away the hub falls back and fades
  const away = inOutCubic(seg(t, OPEN.hubOut0, OPEN.hubOut1));
  const z = lerp(1.12, 0.94, away);
  const cx = g.DW / 2, cy = g.DH / 2;
  o.site.style.transform = `translate(960px,${H / 2}px) scale(${(g.k * z).toFixed(5)}) translate(${(-cx).toFixed(2)}px,${(-cy).toFixed(2)}px)`;
  o.section.style.opacity = (1 - away).toFixed(3);
  o.section.style.filter = away > 0 ? `blur(${(away * 6).toFixed(2)}px)` : 'none';
}

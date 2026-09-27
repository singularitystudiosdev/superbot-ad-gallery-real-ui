// every-model-one-chat (forked from it-does-what-you-ask): the real superbot hub, cropped to its thread and composer (rail, sidebar and chat header
// are hidden, ask.css), laid out at DW design px and scaled to the frame width. It opens on the empty state
// ("Good evening. Where do we go?" over a centred composer) with the camera pushed in; the first send drops the
// composer to the bottom, lifts the greeting away and eases the camera out while the seven-request chat plays
// (tabs-assets/chat.js, ?v=3 routing, which is also the default). render(lt) is a pure function of local time. The scene keeps the id "tabs" so the hub's
// generated stylesheets (scoped under #s-tabs) apply unchanged.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountChat, renderChat, BEATS, CHAT_T0, CHAT_END, CAPTIONS, CUTS, GRAIN, grainAt } from './tabs-assets/chat.js?v=li13a';
import { clamp, lerp, seg, outCubic, inOutCubic } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const H = 1080;
const FIRST = BEATS[0].k;

// ---------- the film's chrome, in frame px over the hub ----------
// THE LAST INVENTION letters its places bottom left in small Inter caps tracked wide ("A DATA CENTRE, SOMEWHERE
// COLD.", img/li/card-datacentre-caption.jpg): every department's beat plays under its own (chat.js CAPTIONS), at the
// film's inset from the left edge (5.2% of the frame width) in the strip between the composer and the frame's foot,
// cap line centred in it. Each rises with the beat's reply and is gone by the next switch. Every switch chip's cut
// (chat.js CUTS, the composer's model swap) takes a brief tungsten flash over the frame and a burst of film grain.
const CAP_IN = 0.35, CAP_OUT = 0.3;   // the film's caption fades
const FLASH = 0.28, GRAIN_LIFE = 0.42; // the cut's flash and grain, in seconds from the swap

function mountFilm(root) {
  const cut = document.createElement('div');
  cut.className = 'li-cut';
  const grain = document.createElement('div');
  grain.className = 'li-grain';
  grain.style.backgroundImage = GRAIN;
  const cap = document.createElement('div');
  cap.className = 'li-cap';
  cap.setAttribute('aria-hidden', 'true');
  root.append(cut, grain, cap);
  return { root, cut, grain, cap, text: null };
}

function renderFilm(f, t, W) {
  const c = CAPTIONS.find((x) => t >= x.t0 && t < x.t1);
  if (!c) f.cap.style.opacity = '0';
  else {
    if (f.text !== c.text) { f.cap.textContent = c.text; f.text = c.text; }
    // the strip under the composer, read off the laid out frame (the camera has settled by the first reply)
    const rr = f.root.getBoundingClientRect(), cr = el.composer.getBoundingClientRect();
    const yb = rr.height ? clamp((cr.bottom - rr.top) * (H / rr.height), 0, H) : H - 32;
    f.cap.style.left = (W * 0.052).toFixed(2) + 'px';
    f.cap.style.top = ((yb + H) / 2).toFixed(2) + 'px';
    f.cap.style.opacity = Math.min(outCubic(seg(t, c.t0, c.t0 + CAP_IN)), 1 - seg(t, c.t1 - CAP_OUT, c.t1)).toFixed(3);
  }
  // the cut: the last swap at or before t
  let S = -1;
  for (const x of CUTS) if (x <= t) S = x;
  const dt = S < 0 ? 1e9 : t - S;
  const fl = dt >= FLASH ? 0 : dt < 0.05 ? dt / 0.05 : (1 - (dt - 0.05) / (FLASH - 0.05)) ** 2;
  f.cut.style.opacity = fl.toFixed(3);
  const gr = dt >= GRAIN_LIFE ? 0 : 1 - outCubic(dt / GRAIN_LIFE);
  f.grain.style.opacity = gr.toFixed(3);
  if (gr > 0) f.grain.style.backgroundPosition = grainAt(t, 3);
}

let el = null;

// the design box: a thread-wide hub, scaled so it fills the frame width (narrow ratios keep a readable column)
function geo(W) {
  if (el.geo && el.geo.W === W) return el.geo;
  // framed like one-agent-full-degen: the thread column fills the frame instead of floating in empty sides
  const DW = Math.max(560, Math.min(960, W / 2));
  const k = W / DW, DH = H / k;
  el.site.style.width = DW + 'px';
  el.site.style.height = DH.toFixed(3) + 'px';
  el.site.style.setProperty('--dw', DW + 'px');
  el.geo = { W, DW, DH, k, lift: null };
  return el.geo;
}

// how far the composer sits above its resting place in the empty state: just under the greeting, as a group
// centred in the frame
// Heights are read as layout px (offsetHeight ignores the camera's scale) and the composer's resting top with its
// glide cleared, so a read taken mid-glide or under the push-in is still the resting geometry; the result is only
// cached once the page, its fonts and the hero's mark have settled (a read taken before the stylesheets applied
// parked the greeting BEHIND the lifted composer).
function lift(g) {
  if (g.lift !== null) return g.lift;
  const compH = el.composer.offsetHeight, heroH = el.hero.offsetHeight;
  if (!el.main.offsetHeight || !compH || !heroH) return 0;
  const prev = el.composer.style.transform;
  el.composer.style.transform = 'none';
  const main = el.main.getBoundingClientRect(), comp = el.composer.getBoundingClientRect();
  el.composer.style.transform = prev;
  const s = main.height / g.DH;
  const groupTop = (g.DH - (heroH + 34 + compH)) / 2;
  el.hero.style.top = groupTop.toFixed(2) + 'px';
  const up = (comp.top - main.top) / s - (groupTop + heroH + 34);
  const cat = el.hero.querySelector('img');
  if (document.readyState === 'complete' && document.fonts.status === 'loaded' && (!cat || cat.complete)) g.lift = up;
  return up;
}

export default {
  id: 'tabs',
  dur: CHAT_END + 0.4,

  mount(section) {
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
    // the composer as the empty state shows it: SUPER is a switch (off), the platform chip names the model
    const sup = hub.querySelector('.rc-super');
    sup.innerHTML = 'SUPER<i class="ask-tg"><b></b>OFF</i>';
    el = { site: q('.sbsite'), hub, main, hero, composer: hub.querySelector('.composer'), geo: null };
    el.chat = mountChat(hub);
    el.film = mountFilm(q('.ask-root'));
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    const g = geo(W);
    const up = lift(g);

    // camera: pushed in on the empty state, easing out once the thread starts
    // (a narrow column already fills the frame, so it pushes in less)
    const z0 = g.DW < 700 ? 1.08 : 1.2, z1 = g.DW < 700 ? 1.04 : 1.1;
    const z = lerp(z0, z1, inOutCubic(seg(t, 0, CHAT_T0))) * lerp(1, 1 / z1, inOutCubic(seg(t, FIRST.send - 0.1, FIRST.send + 0.7)));
    el.site.style.transform = `translate(${(W / 2).toFixed(2)}px,${H / 2}px) scale(${(g.k * z).toFixed(5)}) translate(${(-g.DW / 2).toFixed(2)}px,${(-g.DH / 2).toFixed(2)}px)`;

    // empty state -> thread: the composer glides down to the bottom and the greeting lifts away
    const drop = inOutCubic(seg(t, FIRST.send - 0.08, FIRST.send + 0.42));
    el.composer.style.transform = drop >= 1 ? 'none' : `translateY(${(-up * (1 - drop)).toFixed(2)}px)`;
    const heroIn = outCubic(seg(t, 0.15, 0.8));
    const heroOut = outCubic(seg(t, FIRST.send - 0.1, FIRST.send + 0.3));
    el.hero.style.opacity = (heroIn * (1 - heroOut)).toFixed(3);
    el.hero.style.transform = `translate(-50%, ${((1 - heroIn) * 10 - heroOut * 40).toFixed(2)}px)`;

    renderChat(el.chat, t);
    renderFilm(el.film, t, W);
  },
};

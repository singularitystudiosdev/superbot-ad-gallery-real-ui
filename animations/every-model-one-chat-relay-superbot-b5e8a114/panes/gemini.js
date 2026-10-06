// Pane 3: Gemini with Nano Banana Pro creating the five photos assets.json asked for. The chalk board is
// lettered with the site's own prices, which is the thing this model does best. All five are real outputs.
import { html, $, $$, enter, seg, show, easeOut } from '../engine.js';

const SHOTS = [
  ['hero', 'img/hero.jpg', 'hero.jpg', 1.3],
  ['menu', 'img/menu.jpg', 'menu.jpg', 1.65],
  ['iso', 'img/iso.jpg', 'burger.png', 2.0],
  ['sides', 'img/sides.jpg', 'sides.jpg', 2.35],
  ['truck', 'img/truck.jpg', 'truck.jpg', 2.7],
];

export function build() {
  const tiles = SHOTS.map(([id, src, name]) => `
    <figure class="gm-img g-${id}"><div class="gm-wait"><img src="brand/gemini-logo.svg" alt=""></div><img class="px" src="${src}" alt=""><span class="gm-name">${name}</span></figure>`).join('');
  const el = html(`
  <div class="pane p-gm">
    <aside class="gm-rail"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg><svg viewBox="0 0 24 24"><path d="M5 19l1-4L16 5l3 3L9 18z"/></svg></aside>
    <div class="gm-main">
      <header class="gm-top"><span class="gm-word">Gemini</span><span class="gm-model">3 Pro<svg viewBox="0 0 16 16"><path d="M4.5 6.5L8 10l3.5-3.5"/></svg></span><span class="gm-me">A</span></header>
      <div class="gm-col">
        <div class="gm-user">
          <span class="file gm-att"><svg viewBox="0 0 16 16"><path d="M4 1.5h5.5L13 5v9.5H4z M9.5 1.5V5H13"/></svg><b>assets.json</b><i>5 photo slots</i></span>
          <div class="gm-bubble">Fill the photo slots: a 16:9 hero, a chalk menu board with our prices ($9 smash, $12 double, $4 fries, $6 shake), the burger alone on white for 3D, sides, and the truck with its sign.</div>
        </div>
        <div class="gm-ans">
          <img class="gm-av" src="brand/gemini-logo.svg" alt="">
          <div class="gm-body">
            <span class="gm-status"><span class="lbl">Creating images with Nano Banana Pro</span></span>
            <p class="gm-done">Here are your 5 images, one per slot. The board is lettered with the site's prices.</p>
            <div class="gm-grid">${tiles}</div>
          </div>
        </div>
      </div>
      <div class="gm-input"><span class="ph">Ask Gemini</span><span class="gm-tool"><svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" rx="2"/><path d="M2.5 11l3.5-3.5 3 3 2-2 2.5 2.5"/></svg>Create images</span></div>
    </div>
  </div>`);
  return {
    el,
    user: $(el, '.gm-user'),
    att: $(el, '.gm-att'),
    av: $(el, '.gm-av'),
    status: $(el, '.gm-status'),
    done: $(el, '.gm-done'),
    tiles: $$(el, '.gm-img'),
    iso: $(el, '.g-iso'),
  };
}

export function render(c, t) {
  show(c.user, t >= 0);
  enter(c.user, t, 0, 0.3, 10);
  show(c.av, t >= 0.3);
  enter(c.av, t, 0.3);
  const gen = t < 2.95;
  show(c.status, t >= 0.3 && gen);
  enter(c.status, t, 0.3);
  $(c.status, '.lbl').style.setProperty('--sh', `${100 - (((t - 0.3) * 90) % 150)}%`);
  show(c.done, !gen);
  enter(c.done, t, 2.95);
  c.tiles.forEach((f, i) => {
    show(f, t >= 0.5 + i * 0.06);
    enter(f, t, 0.5 + i * 0.06, 0.3, 8);
    const k = easeOut(seg(t, SHOTS[i][3], SHOTS[i][3] + 0.6));
    const px = $(f, '.px');
    px.style.opacity = k;
    px.style.filter = k < 1 ? `blur(${(1 - k) * 18}px)` : '';
    $(f, '.gm-wait').style.setProperty('--sw', `${((t * 70) % 200) - 50}%`);
    $(f, '.gm-name').style.opacity = seg(t, SHOTS[i][3] + 0.4, SHOTS[i][3] + 0.7);
  });
  c.iso.classList.toggle('lit', t >= 3.6);
}

export const anchors = (c) => ({ in: c.att, out: $(c.iso, '.gm-name') });

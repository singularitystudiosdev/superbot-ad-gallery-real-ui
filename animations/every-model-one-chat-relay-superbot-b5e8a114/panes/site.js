// mainstreetburger.co, the page Claude Opus 5.5 builds in the spot. One builder serves both the
// localhost preview (slots empty, then filling) and the live pane. Page width 1560, height 1536.
import { HEADLINE, SUB, PEAKS, VO_DUR } from '../data.js';
import { html, $, $$, clamp, easeOut } from '../engine.js';

const TURN_FRAMES = 36;
const SWAY_PERIOD = 4.4; // seconds for one full left-right-left sway

const slot = (name, who) => `<div class="slot-ph"><span class="slot-file">${name}</span><span class="slot-who">waiting on ${who}</span></div>`;

export function buildSite() {
  const turn = Array.from({ length: TURN_FRAMES }, (_, i) => `<img src="img/turn/t_${String(i).padStart(2, '0')}.webp" alt="" draggable="false">`).join('');
  const bars = PEAKS.filter((_, i) => i % 4 === 0).map((p) => `<i style="height:${Math.max(8, p)}%"></i>`).join('');
  const el = html(`
  <div class="site">
    <nav class="s-nav">
      <span class="s-word">Main Street Burger Co.</span>
      <span class="s-links"><a>Menu</a><a>Find the truck</a><b class="s-btn">Order pickup</b></span>
    </nav>
    <section class="s-hero">
      <div class="s-copy">
        <h1>${HEADLINE.replace('. ', '.<br>')}</h1>
        <p>${SUB}</p>
        <div class="s-cta">
          <b class="s-btn s-btn-lg">Order pickup</b>
          <span class="s-radio" data-slot="radio">
            <span class="s-play"><svg viewBox="0 0 16 16"><path d="M5 3.5v9l7.5-4.5z"/></svg></span>
            <span class="s-radio-txt"><b>Play the radio spot</b><em>0:10</em></span>
            <span class="s-bars">${bars}</span>
            ${slot('spot.mp3', 'ElevenLabs')}
          </span>
        </div>
        <div class="s-stats">
          <span><b>$9</b>our smash burger</span>
          <span><b>$13.50</b>Mission median</span>
          <span><b>47</b>menus checked tonight</span>
        </div>
      </div>
      <div class="s-3d" data-slot="burger">
        <div class="s-disc"></div>
        <div class="s-turn">${turn}</div>
        <span class="s-spin-hint"><svg viewBox="0 0 24 24"><path d="M12 5c5 0 9 1.8 9 4.2 0 1.6-2 3-5 3.7M12 13.6c-5 0-9-1.9-9-4.4C3 6.8 7 5 12 5"/><path d="M14 10.6l2.2 2.3-2.4 2"/></svg>Drag to spin</span>
        ${slot('burger.glb', 'Blender')}
      </div>
    </section>
    <section class="s-photos">
      <figure data-slot="hero"><img src="img/hero.jpg" alt=""><figcaption>Golden hour on 24th Street</figcaption>${slot('hero.jpg', 'Nano Banana Pro')}</figure>
      <figure data-slot="menu"><img src="img/menu.jpg" alt=""><figcaption>The board</figcaption>${slot('menu.jpg', 'Nano Banana Pro')}</figure>
      <figure data-slot="truck"><img src="img/truck.jpg" alt=""><figcaption>24th and Mission, 5pm to midnight</figcaption>${slot('truck.jpg', 'Nano Banana Pro')}</figure>
    </section>
    <section class="s-price">
      <h2>Price check</h2>
      <p>From 47 menus scraped tonight</p>
      <div class="s-bar us"><span>Main Street</span><i style="width:${(9 / 15) * 100}%"></i><b>$9.00</b></div>
      <div class="s-bar"><span>Mission median</span><i style="width:${(13.5 / 15) * 100}%"></i><b>$13.50</b></div>
      <div class="s-bar"><span>Priciest nearby</span><i style="width:100%"></i><b>$15.00</b></div>
    </section>
  </div>`);
  return {
    el,
    slots: Object.fromEntries($$(el, '[data-slot]').map((s) => [s.dataset.slot, s])),
    turn: $$(el, '.s-turn img'),
    bars: $$(el, '.s-bars i'),
    radio: $(el, '.s-radio'),
    time: $(el, '.s-radio-txt em'),
  };
}

// st: { fill: {radio, burger, hero, menu, truck} 0..1, spin: seconds of turntable, vo: seconds into the spot or -1 }
export function renderSite(s, st) {
  for (const [name, node] of Object.entries(s.slots)) {
    const k = easeOut(clamp(st.fill[name] ?? 0));
    node.style.setProperty('--fill', k);
    node.classList.toggle('filled', k > 0.999);
  }
  // the frames sway -45..+45 degrees over the burger's front; ping-pong through them on a cosine
  const f = (0.5 - 0.5 * Math.cos((2 * Math.PI * Math.max(0, st.spin)) / SWAY_PERIOD)) * (TURN_FRAMES - 1);
  const i = Math.floor(f);
  const j = Math.min(TURN_FRAMES - 1, i + 1);
  const frac = f - i;
  s.turn.forEach((img, n) => {
    img.style.opacity = n === i ? 1 : n === j ? frac : 0;
    img.style.zIndex = n === j ? 2 : 1;
  });
  const playing = st.vo >= 0 && st.vo <= VO_DUR;
  s.radio.classList.toggle('playing', playing);
  const played = playing ? st.vo / VO_DUR : 0;
  s.bars.forEach((b, n) => b.classList.toggle('on', n / s.bars.length < played));
  const sec = Math.floor(playing ? st.vo : VO_DUR);
  s.time.textContent = playing ? `0:${String(sec).padStart(2, '0')}` : '0:10';
}

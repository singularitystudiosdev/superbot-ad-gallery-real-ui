// every-model-one-chat (forked from it-does-what-you-ask): the real superbot hub, cropped to its thread and composer (rail, sidebar and chat header
// are hidden, ask.css), laid out at DW design px and scaled to the frame width. It opens on the empty state
// ("Good evening. Where do we go?" over a centred composer) with the camera pushed in; the first send drops the
// composer to the bottom, lifts the greeting away and eases the camera out while the seven-request chat plays
// (tabs-assets/chat.js, ?v=3 routing, which is also the default). render(lt) is a pure function of local time. The scene keeps the id "tabs" so the hub's
// generated stylesheets (scoped under #s-tabs) apply unchanged.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountChat, renderChat, BEATS, CHAT_T0, CHAT_END, PASSES, PASS_T0, eraOf } from './tabs-assets/chat.js?v=0a738q';
import { clamp, lerp, seg, outCubic, inOutCubic } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const H = 1080;
const FIRST = BEATS[0].k;

// ---------- the chapter HUD (PROMETHEVS II's own overlay, in frame px so it stays crisp) ----------
// The clip's HUD chrome in its night register over the ad frame: hairline corner brackets; top left the chapter
// ("IV · CODE") over the model holding the fire; top right the film's title over its tempo and frame counter; ANNO over
// the era, whose characters roll like a ticker to each chapter's year the moment that chapter's fire pass lands;
// KARDASHEV over K, counting to the chapter's reading, over its K 0..3 scale bar; the timeline (500 BC to 2000, then
// the open end), its gold fill and marker advancing to the chapter's year. Sizes, colours and the top row are the
// clip's own 1920x1080 geometry, measured off /tmp/wc/post-1080.mp4 (img/prometheus/chapters.json hud.geometry_1080).
// The HUD never covers the product. At 16:9 (wide) the readouts live in the side margins beside the thread column
// (x 320..1600) and the timeline moves from over the composer (y 872..1048) into the bottom margin under it. Narrower
// crops have no side margins (the composer spans x 37..827 at 4:5), so there (compact) the top row sits on its own
// scrim that the thread scrolls under, and ANNO, the timeline and K run as one line on a shared baseline along the
// bottom edge, under the composer. It opens in the present (AD 2026, K 0.730: the ask is typed now), the first landing
// flings it back to Athens and each chapter after marches it forward to now. It fades in on the first send and out as
// the finale's render window grows in. Every value is written from t.
const LAST = BEATS[BEATS.length - 1].k;
// in once the first send has settled the frame: the composer's drop ends at send + 0.42 and the camera's ease out at
// send + 0.7 (render below), and until then the zoomed thread column still reaches under the title and the dropping
// composer under the compact readouts. From send + 0.55 (the ease out 97% home) it fades up by chapter I's landing.
const HUD_IN = PASS_T0 + 0.55;
const HUD_FADE = 0.3;
const HUD_OUT = LAST.T.v0 !== undefined ? LAST.T.v0 : LAST.T.end - 1;
const WIDE = 1800;     // frames this wide have side margins the readouts fit in (16:9); narrower ones are compact
const NOW = { year: 2026, k: 0.73, bpm: PASSES[0].bpm };
const TICKER = 0.42;   // one character column's roll
const STAGGER = 0.035; // columns start left to right
const COUNT = 0.3;     // the K counter's ease out: the clip's 8 to 10 frames
const MARCH = 0.5;     // the timeline marker's glide
// the timeline spans the clip's years: its track runs from 598.8 BC to AD 2301.6 (x 610..1310 at 1920, 0.2413 px a
// year, AD 0 at 754.5), so a year is a fraction of whatever width the layout gives the track
const TL_Y0 = -598.8, TL_Y1 = 2301.6;
const tlF = (year) => (year - TL_Y0) / (TL_Y1 - TL_Y0);
const pct = (f) => `${(f * 100).toFixed(3)}%`;
const TL_TICKS = [[-500, '500 BC'], [0, '0'], [500, '500'], [1000, '1000'], [1500, '1500'], [2000, '2000']];
const K_MAX = 3; // the K scale bar runs K 0..3, a tick at every whole K
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
// the chapter whose fire pass has landed by t (-1 before the first)
const chapterAt = (t) => { let n = -1; PASSES.forEach((r, i) => { if (t >= r.land) n = i; }); return n; };
const at = (n) => (n < 0 ? NOW : PASSES[n]);

// the ticker: one clipped column per character, each a short vertical reel from the old character to the new one.
// A digit counts forward to its new digit and goes once more round the dial, so every changing column visibly rolls;
// any other change (BC to AD, a new column) runs a few digits through the window first. Unchanged columns hold still.
const GLYPH = (c) => `<i>${c === ' ' ? '&nbsp;' : esc(c)}</i>`;
function tickerReels(from, to) {
  const n = Math.max(from.length, to.length);
  return Array.from({ length: n }, (_, i) => {
    const a = from[i] || ' ', b = to[i] || ' ';
    let chain;
    if (a === b) chain = [a];
    else if (/\d/.test(a) && /\d/.test(b)) {
      const d0 = +a, steps = ((+b - d0 + 10) % 10) + 10;
      chain = Array.from({ length: steps + 1 }, (_, j) => String((d0 + j) % 10));
    } else chain = [a, ...Array.from({ length: 6 }, (_, j) => String((i * 3 + j * 7) % 10)), b];
    return chain;
  });
}

function mountHud(root) {
  const hud = document.createElement('div');
  hud.className = 'pmh';
  hud.setAttribute('aria-hidden', 'true');
  const ticks = TL_TICKS.map(([y, s]) => `<i class="pmh-tk" style="left:${pct(tlF(y))}"></i><span class="pmh-tl-l" style="left:${pct(tlF(y))}">${s}</span>`).join('');
  hud.innerHTML = `<i class="pmh-band"></i><i class="pmh-c pmh-c-tl"></i><i class="pmh-c pmh-c-tr"></i><i class="pmh-c pmh-c-bl"></i><i class="pmh-c pmh-c-br"></i>
<div class="pmh-tag"><b></b><small></small></div>
<div class="pmh-ttl"><b>PROMETHEVS II</b><small></small></div>
<div class="pmh-anno"><small>ANNO</small><div class="pmh-yr"></div></div>
<div class="pmh-kd"><small>KARDASHEV</small><div class="pmh-k"></div><div class="pmh-kb"><i class="pmh-kf"></i>${[0, 1, 2, 3].map((k) => `<s style="left:${pct(k / K_MAX)}"></s>`).join('')}</div></div>
<div class="pmh-tl"><i class="pmh-tl-f"></i>${ticks}<span class="pmh-tl-l pmh-tl-inf" style="left:100%">∞</span><i class="pmh-mk"></i></div>`;
  root.appendChild(hud);
  const q = (s) => hud.querySelector(s);
  return {
    hud, tag: q('.pmh-tag'), tagB: q('.pmh-tag b'), tagS: q('.pmh-tag small'), sub: q('.pmh-ttl small'), yr: q('.pmh-yr'), k: q('.pmh-k'),
    kf: q('.pmh-kf'), tlf: q('.pmh-tl-f'), mk: q('.pmh-mk'),
    last: { tag: null, sub: null, k: null, key: null, split: false, compact: null }, reels: [],
  };
}

function renderHud(h, t, W, gt) {
  const vin = outCubic(seg(t, HUD_IN, HUD_IN + HUD_FADE));
  const vout = outCubic(seg(t, HUD_OUT, HUD_OUT + 0.5));
  const v = vin * (1 - vout);
  h.hud.style.opacity = v.toFixed(3);
  h.hud.style.visibility = v <= 0 ? 'hidden' : 'visible';
  // the layout: wide keeps the clip's corners with the readouts in the side margins, compact runs the bottom row as
  // one line under the composer (tabs.css .pmh-compact)
  const compact = W < WIDE;
  if (compact !== h.last.compact) { h.hud.classList.toggle('pmh-compact', compact); h.last.compact = compact; }
  if (v <= 0) return;
  const n = chapterAt(t);
  const cur = at(n), prev = at(n - 1);
  const land = n < 0 ? -1 : PASSES[n].land;

  // top left: the chapter over its model, a hard swap on the landing with the clip's two frame red/cyan split
  const tag = n < 0 ? '' : `${cur.roman} · ${cur.tag}`;
  if (tag !== h.last.tag) { h.tagB.textContent = tag; h.tagS.textContent = n < 0 ? '' : cur.name.toUpperCase(); h.last.tag = tag; }
  h.tag.style.opacity = n < 0 ? '0' : n === 0 ? outCubic(seg(t, land, land + 0.12)).toFixed(3) : '1';
  const r = n >= 0 && t < land + 0.066 ? 0.8 + 2.6 * (1 - (t - land) / 0.066) : 0;
  if (r > 0) { h.tag.style.textShadow = `-${r.toFixed(2)}px 0 0 rgba(255, 38, 38, .8), ${r.toFixed(2)}px 0 0 rgba(0, 226, 255, .75)`; h.last.split = true; }
  else if (h.last.split) { h.tag.style.textShadow = 'none'; h.last.split = false; }

  // top right sub line: the chapter's tempo and the ad's own frame counter, five digits like the clip's
  const frame = Math.max(0, Math.round((gt === undefined ? t : gt) * 30)) % 100000;
  const sub = `♩ = ${(n < 0 ? NOW : cur).bpm}   ${String(frame).padStart(5, '0')}`;
  if (sub !== h.last.sub) { h.sub.textContent = sub; h.last.sub = sub; }

  // bottom left: ANNO rolls from the previous era to this chapter's (rebuilt only when the chapter changes, so a
  // scrubbed frame is the same frame)
  const key = n;
  if (key !== h.last.key) {
    const chains = n < 0 ? tickerReels(eraOf(NOW.year), eraOf(NOW.year)) : tickerReels(eraOf(prev.year), eraOf(cur.year));
    h.yr.innerHTML = chains.map((c) => `<span class="pmh-col"><span>${c.map(GLYPH).join('')}</span></span>`).join('');
    h.reels = [...h.yr.querySelectorAll('.pmh-col > span')].map((el, i) => ({ el, len: chains[i].length, last: null }));
    h.last.key = key;
  }
  h.reels.forEach((c, i) => {
    const p = c.len > 1 && n >= 0 ? outCubic(seg(t, land + i * STAGGER, land + i * STAGGER + TICKER)) : 1;
    const y = c.len > 1 ? -(c.len - 1) * p : 0;
    const s = y === 0 ? 'none' : `translateY(${y.toFixed(3)}em)`;
    if (s !== c.last) { c.el.style.transform = s; c.last = s; }
  });

  // bottom right: K counts to the chapter's reading, and its scale bar fills with it
  const kp = n < 0 ? 1 : outCubic(seg(t, land, land + COUNT));
  const kv = lerp(prev.k, cur.k, kp);
  const kt = `K ${kv.toFixed(3)}`;
  if (kt !== h.last.k) { h.k.textContent = kt; h.last.k = kt; }
  h.kf.style.width = pct(clamp(kv / K_MAX));

  // the timeline: the gold fill and the marker glide to the chapter's year
  const mp = n < 0 ? 1 : inOutCubic(seg(t, land, land + MARCH));
  const f = pct(clamp(lerp(tlF(prev.year), tlF(cur.year), mp)));
  h.tlf.style.width = f;
  h.mk.style.left = f;
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
    el.hud = mountHud(q('.ask-root'));
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
    renderHud(el.hud, t, W, ctx && ctx.t);
  },
};

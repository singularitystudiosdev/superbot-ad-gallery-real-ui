// Gemini beat: the reply streams, then the art resolves while the camera pushes onto it. Pure function of t (the tabs
// scene's local time) and the variant (variant.9e82faf1.js): '1' lands one meme card the way the climbing variant's
// thumbnails land (thumb-land.309eb9c5.js: a shimmering skeleton, then the image fades in and settles); 'photoedit' lands
// the user's attached photo, edited (img/photoedit.2a3b1461/night.jpg), in that same card the same way; '10' lands ten
// tiles one after another in reading order, either as Default's grid (the same thumbnail landing, in the bakery artifact
// frame with a Download All that zips the ten as seen; zip.69098368.js) or as one platform's
// whole generation UI picked via appear() (appear.9e82faf1.js; reveals/); '3d' lands a finished zombie model on a
// turntable (zombie3d.9e82faf1.js) exactly as the 1-image card lands, in the bakery variant's artifact frame (title, Expand
// and a Download link to the model over a 560x350 view; bakery.005f5570.js); 'game' types out a zombie runner's code, then boots it
// into the running game (zombiegame.7b46b820.js); 'garden' draws a garden design template onto grid paper
// (garden.410879cc.js); 'roadtrip' draws a Google-Maps-style route card, LA to SF up the coast (roadtrip.9bc0f433.js), in the same artifact frame with Open in Maps; 'lawn'
// draws a Maps fly-to and pin drop on the address its ask names, then a before/after wipe from the plain front lawn to the planted garden (lawn.f5e1d276.js), in that same frame; 'logo'
// resolves a generated coffee shop logo (img/coffee-logo.a133a772.png) out of a blur under a sweeping band (resolve()).
// Every variant keeps the beat's length. All layouts are
// built once and the variant picks which one shows; the 3D viewer (and three.js) loads the first time its variant shows.
import { lerp, seg, outCubic, streamCount } from '../../../lib.9b47fc30.js';
import { variant } from '../../../variant.9e82faf1.js?v=3';
import { track } from '../../../loads.9e82faf1.js';
import { appear } from '../../../appear.9e82faf1.js?v=2';
import { gateImages } from './appear-fx.9e82faf1.js';
import { LAND, landing, shimmer, settle } from './thumb-land.309eb9c5.js';
import { REVEALS } from './reveals/index.9e82faf1.js?v=2';
import { makeZombieViewer } from './zombie3d.9e82faf1.js?v=3';
import { EXPAND, loadSheet as loadFrameSheet } from './bakery.005f5570.js?v=3';
import { makeZombieGame, gameState, codeFrame, CODE_CHARS, CODE_ROWS, CODE_LINE_H } from './zombiegame.7b46b820.js';
import { makeGarden } from './garden.410879cc.js';
import { makeRoadtrip } from './roadtrip.9bc0f433.js?v=2';
import { makeLawn, MAPS_QUERY } from './lawn.f5e1d276.js?v=3';
import { zipStore } from './zip.69098368.js';
// the Share control every output card carries (share.29a362ea.js): a header button on a framed card, a disc on an image
import { shareBtn, shareDisc } from './share.29a362ea.js';

// Google Maps URLs (developers.google.com/maps/documentation/urls/get-started): the card's drive, stop by stop
const MAPS_TRIP = 'https://www.google.com/maps/dir/?api=1&origin=Los+Angeles,CA&destination=San+Francisco,CA&waypoints=Santa+Barbara,CA%7CSan+Luis+Obispo,CA%7CBig+Sur,CA%7CMonterey,CA&travelmode=driving';

const SAY = { 1: 'Here’s your Muse meme.', 10: 'Here are 10 Muse memes.', '3d': 'Here’s your 3D zombie.', game: 'Here’s your zombie game.', garden: 'Here’s your garden design template.', roadtrip: 'Here’s a 3-day coastal drive from LA to SF.', logo: 'Here’s your coffee shop logo.', photoedit: 'Here’s your photo with the man in the back removed, now at night.', lawn: 'Here’s your front lawn with the garden added.' };
const ZOMBIE = new URL('../../../models/zombie-3d.9e82faf1.glb', import.meta.url).href; // the game's blocky runner
const ZOMBIE_3D = new URL('../../../models/zombie-meshy.4490ac01.glb', import.meta.url).href; // the 3D variant's Meshy 7.1 model
const BOOT = 0.75, BOOT_LEN = 0.2, PLAY = 0.8; // the code view hands over to the game at T.w0 + BOOT; play counts from T.w0 + PLAY
const SPIN0 = -0.75, SPIN = 0.55; // the turntable's angle as the card lands (a three-quarter view), and its turn in rad/s

// the ten generations: the one sourced meme (img/muse-meme.png) under a different crop and grade per tile until real
// renders replace it. They land one after another in reading order (left to right, top to bottom). Default's grid keeps
// the climbing results' cadence: tile i lands at T.w0 + GRID0 + i * GRID_STEP (climb.080da517.js VIDEOS[].at over its 1 s
// search window). A platform reveal runs on its own clock: tile i starts at T.card + TILE0 + i * STAGGER and takes
// TILE_LEN (ctx.win(i), and its non-overlapping ctx.seq(i), reveals/index.9e82faf1.js)
const TILE0 = 0.25, STAGGER = 0.11, TILE_LEN = 0.6;
const GRID0 = 0.4, GRID_STEP = 0.12;
const TILES = [
  { zoom: 1, origin: '50% 50%', grade: '' },
  { zoom: 1.18, origin: '50% 0%', grade: 'hue-rotate(32deg)' },
  { zoom: 1, origin: '50% 50%', grade: 'sepia(.5) saturate(1.25)' },
  { zoom: 1.22, origin: '0% 100%', grade: 'grayscale(1) contrast(1.12)' },
  { zoom: 1.1, origin: '100% 50%', grade: 'hue-rotate(-38deg) saturate(1.3)' },
  { zoom: 1, origin: '50% 50%', grade: 'contrast(1.2) saturate(1.45)' },
  { zoom: 1.25, origin: '50% 100%', grade: 'hue-rotate(95deg) saturate(1.1)' },
  { zoom: 1.14, origin: '0% 0%', grade: 'brightness(1.08) sepia(.25) hue-rotate(-12deg)' },
  { zoom: 1, origin: '50% 50%', grade: 'saturate(.55) contrast(1.1)' },
  { zoom: 1.2, origin: '100% 0%', grade: 'hue-rotate(60deg) brightness(1.05)' },
];

// one image resolving at progress p: blur and desaturation clear, the scale settles onto its crop, the band sweeps
// and fades out
function resolve(im, gen, p, { grade = '', zoom = 1, phase = 0, blur = 18 } = {}) {
  const e = outCubic(p);
  im.style.filter = e >= 1 ? grade || 'none' : `blur(${((1 - e) * blur).toFixed(2)}px) saturate(${lerp(0.3, 1, e).toFixed(3)}) ${grade}`.trim();
  im.style.opacity = lerp(0.3, 1, e).toFixed(3);
  const s = zoom * (e >= 1 ? 1 : lerp(1.08, 1, e));
  im.style.transform = s === 1 ? 'none' : `scale(${s.toFixed(4)})`;
  gen.style.transform = `translateX(${lerp(-110, 110, (p * 2 + phase) % 1).toFixed(1)}%)`;
  gen.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.8, 1)).toFixed(3);
}

// Gemini's Download button over a generated image's top right corner (chat.css .qc-dl): a real link to the file that
// fades in as its image lands and takes no clicks before it does
const dl = (href, name) => `<a class="qc-dl" href="${href}" download="${name}" aria-label="Download image" title="Download"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg></a>`;
function showDl(a, p) {
  a.style.opacity = p.toFixed(3);
  a.style.visibility = p > 0 ? '' : 'hidden';
}
// an image's Share disc lands with its download; one with no download to land beside takes the same fade
const showShare = (c, p) => { showDl(c.dl, p); showDl(c.share, p); };

// a grid tile shows the meme under its own crop and grade (TILES), so its Download saves the tile as seen: the image
// redrawn through the same zoom about the same origin and the same CSS filter, as a PNG data URL
function tilePng(im, { zoom, origin, grade }) {
  const W = im.naturalWidth, H = im.naturalHeight;
  const [ox, oy] = origin.split(' ').map((v) => parseFloat(v) / 100);
  const c = Object.assign(document.createElement('canvas'), { width: W, height: H });
  const cx = c.getContext('2d');
  cx.filter = grade || 'none';
  cx.drawImage(im, ox * W * (1 - 1 / zoom), oy * H * (1 - 1 / zoom), W / zoom, H / zoom, 0, 0, W, H);
  return c.toDataURL('image/png');
}

// Download All, the grid frame's header button: every tile as seen (the plain tile's own file, tilePng for the rest),
// one PNG each, saved as a single zip (zip.69098368.js)
async function downloadAll(tiles, src) {
  await Promise.all(tiles.map((tl) => tl.im.decode()));
  const files = await Promise.all(tiles.map(async (tl, i) => {
    const url = tl.g.zoom !== 1 || tl.g.grade ? tilePng(tl.im, tl.g) : src;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download All: tile ${i + 1} answered ${res.status} for ${url.slice(0, 80)}`);
    return { name: `muse-meme-${i + 1}.png`, bytes: new Uint8Array(await res.arrayBuffer()) };
  }));
  const href = URL.createObjectURL(zipStore(files));
  Object.assign(document.createElement('a'), { href, download: 'muse-memes.zip' }).click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.22;
    T.w0 = r + 0.3; T.w1 = T.w0 + 1.2;
    T.end = T.w1 + 0.85;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const src = x.img('muse-meme.png');
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY[variant()])}</span></div>`);
    const media = x.el('<div class="qc-media"></div>');
    media.dataset.v = variant();
    const oneCard = (img, w, h, alt, name, what) => x.el(`<div class="qc-img qc-skel"><img src="${img}" width="${w}" height="${h}" alt="${alt}"/><i class="qc-sk"></i><span class="qc-genl">${x.tile('gemini')}Creating image</span>${shareDisc(what, { file: img })}${dl(img, name)}</div>`);
    const card = oneCard(src, 870, 1024, 'Muse meme', 'muse-meme.png', 'Muse meme');
    const edit = oneCard(x.img('photoedit.2a3b1461/night.jpg'), 1200, 900, 'The photo with the man in the back removed, at night', 'photo-edited.jpg', 'Edited photo');
    const grid = x.el(`<div class="qc-grid">${TILES.map((g, i) => `<div class="qc-gt qc-skel"><img src="${src}" width="870" height="1024" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}; filter: ${g.grade || 'none'}"/><i class="qc-sk"></i>${shareDisc(`Muse meme ${i + 1}`, { file: src })}${dl(src, `muse-meme-${i + 1}.png`)}</div>`).join('')}</div>`);
    loadFrameSheet();
    // Default's grid in the bakery artifact frame, as the spending chart sits in it: title and Download All where spending
    // exports, no Expand; the view grows to the grid instead of the frame's fixed 350px (chat.css .qc-set)
    const set = x.el(`<div class="bk qc-set"><div class="bk-head"><b class="bk-title">Muse memes<small>${TILES.length} images</small></b>${shareBtn('Muse memes')}<button type="button" class="bk-btn bk-publish qc-dlall"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>Download All</button></div><div class="bk-view"></div></div>`);
    set.querySelector('.bk-view').append(grid);
    const dlAll = set.querySelector('.qc-dlall');
    // Space and Enter press the button, not the spot's clock (timeline.9b47fc30.js), as on the variant picker
    dlAll.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') e.stopPropagation(); });
    // likewise for every Share control on the cards below
    media.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && e.target.closest('.bk-share, .qc-share')) e.stopPropagation(); });
    const model = x.el(`<div class="bk"><div class="bk-head"><b class="bk-title">Zombie 3D model</b>${shareBtn('Zombie 3D model', { file: ZOMBIE_3D })}${EXPAND}<a class="bk-btn bk-publish" href="${ZOMBIE_3D}" download="zombie.glb"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>Download</a></div><div class="bk-view qc-3d qc-skel"><canvas width="1400" height="875" role="img" aria-label="3D zombie model"></canvas><i class="qc-sk"></i><span class="qc-genl">${x.tile(k.app || 'gemini')}Creating 3D model<b class="qc-genn"></b></span></div></div>`);
    const game = x.el(`<div class="qc-img qc-game"><canvas width="590" height="695" role="img" aria-label="Zombie runner game"></canvas><div class="qc-code"><div class="qc-tabs"><span>zombie-run.js</span></div><div class="qc-lines"><pre></pre></div></div><span class="qc-chip qc-score">Score <b>0000</b></span><span class="qc-chip qc-brains">Brains <b>0</b></span><span class="qc-genl">${x.tile('gemini')}Creating game<b class="qc-genn"></b></span>${shareDisc('Zombie runner game')}</div>`);
    const logo = x.el(`<div class="qc-img qc-logo"><img src="${x.img('coffee-logo.a133a772.png')}" width="720" height="720" alt="Hearth &amp; Bean coffee shop logo"/><i class="qc-gen"></i><span class="qc-genl">${x.tile('gemini')}Creating logo</span>${shareDisc('Hearth & Bean logo', { file: x.img('coffee-logo.a133a772.png') })}</div>`);
    media.append(card, edit, set, model, game, logo);
    const garden = makeGarden(x);
    media.append(garden.node);
    // the route card in the bakery artifact frame: 400x250 .bk-fit scaled into the 560x350 view, "Open in Maps"
    // where bakery publishes; the build pill sits on the unscaled view, as on the 3D frame
    const roadtrip = makeRoadtrip(x);
    const trip = x.el(`<div class="bk"><div class="bk-head"><b class="bk-title">LA to SF road trip</b>${shareBtn('LA to SF road trip')}${EXPAND}<a class="bk-btn bk-publish" href="${MAPS_TRIP}" target="_blank" rel="noopener"><img src="${x.brand('maps-logo.svg')}" alt=""/>Open in Maps</a></div><div class="bk-view"><div class="bk-fit"></div></div></div>`);
    trip.querySelector('.bk-fit').append(roadtrip.node);
    trip.querySelector('.bk-view').append(roadtrip.node.querySelector('.qc-genl'));
    media.append(trip);
    // the lawn card rides the same frame: the 400x250 map/photo card inside .bk-fit, its build pill on the unscaled
    // view, and "Open in Maps" pointing at the address the ask named (lawn.f5e1d276.js)
    const lawn = makeLawn(x);
    const frame = x.el(`<div class="bk"><div class="bk-head"><b class="bk-title">Front lawn garden</b>${shareBtn('Front lawn garden')}${EXPAND}<a class="bk-btn bk-publish" href="${MAPS_QUERY}" target="_blank" rel="noopener"><img src="${x.brand('maps-logo.svg')}" alt=""/>Open in Maps</a></div><div class="bk-view"><div class="bk-fit"></div></div></div>`);
    frame.querySelector('.bk-fit').append(lawn.node);
    frame.querySelector('.bk-view').append(lawn.node.querySelector('.qc-genl'));
    media.append(frame);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const cardParts = (c) => ({ im: c.querySelector('img'), sk: c.querySelector('.qc-sk'), genl: c.querySelector('.qc-genl'), dl: c.querySelector('.qc-dl'), share: c.querySelector('.qc-share') });
    const meme = cardParts(card), edited = cardParts(edit);
    const tiles = [...grid.querySelectorAll('.qc-gt')].map((n, i) => ({ im: n.querySelector('img'), sk: n.querySelector('.qc-sk'), dl: n.querySelector('.qc-dl'), share: n.querySelector('.qc-share'), g: TILES[i] }));
    // a Download click: a tile under a crop or grade saves what it shows (tilePng); a mouse click then lets go of the
    // link's focus so the keyboard stays on the spot's clock, as the variant picker does
    media.addEventListener('click', (e) => {
      if (e.target.closest('.qc-dlall')) {
        dlAll.disabled = true;
        downloadAll(tiles, src).catch((err) => console.error(err)).finally(() => { dlAll.disabled = false; });
        if (e.detail > 0) dlAll.blur();
        return;
      }
      const a = e.target.closest('.qc-dl');
      if (!a) return;
      const tl = tiles.find((tl) => tl.dl === a);
      if (tl && (tl.g.zoom !== 1 || tl.g.grade) && tl.im.naturalWidth) {
        e.preventDefault();
        Object.assign(document.createElement('a'), { href: tilePng(tl.im, tl.g), download: a.download }).click();
      }
      if (e.detail > 0) a.blur();
    });
    const canvas = model.querySelector('canvas'), modelSk = model.querySelector('.qc-sk'), modell = model.querySelector('.qc-genl'), pct = model.querySelector('.qc-genn');
    // the 1-image and 3D cards land as their generation window closes, settled by T.w1
    const landAt = T.w1 - LAND;
    const gcanvas = game.querySelector('canvas'), code = game.querySelector('.qc-code'), pre = game.querySelector('pre');
    const gamel = game.querySelector('.qc-genl'), gpct = game.querySelector('.qc-genn');
    const chips = [...game.querySelectorAll('.qc-chip')], scoreEl = game.querySelector('.qc-score b'), brainsEl = game.querySelector('.qc-brains b');
    const logoIm = logo.querySelector('img'), logoGen = logo.querySelector('.qc-gen'), logoL = logo.querySelector('.qc-genl');
    const gameShare = game.querySelector('.qc-share'), logoShare = logo.querySelector('.qc-share');
    let shown = -1, lastV = null, viewer = null, built = -1;
    // the 10-image variant's platform reveals (reveals/index.9e82faf1.js): a style's module is fetched the first time that
    // style shows (the registry holds only ids and labels, so no other variant downloads the ~200 reveal files), and a
    // frozen frame waits on the fetch (track). Its block is built once the module has arrived and display-toggled
    // after; until then the card stays empty for that style. Default keeps the grid above
    const reveals = {};
    const mods = {};
    let lastStyle = null;
    const modFor = (style) => {
      if (style in mods) return mods[style];
      mods[style] = null;
      const entry = REVEALS.find((r) => r.id === style);
      track(entry.load().then(
        (m) => { mods[style] = m.default; lastStyle = null; },
        (e) => console.error(new Error(`reveal module failed to load: ${style}`, { cause: e })),
      ));
      return null;
    };
    const ctxFor = () => ({
      src, tiles: TILES, count: TILES.length, cardIn: T.card, track, gate: gateImages,
      win: (i) => { const a = T.card + TILE0 + i * STAGGER; return [a, a + TILE_LEN]; },
      seq: (i) => { const a = T.card + TILE0, step = (T.card + TILE0 + (TILES.length - 1) * STAGGER + TILE_LEN - a) / TILES.length; return [a + i * step, a + (i + 1) * step]; },
      lastLand: T.card + TILE0 + (TILES.length - 1) * STAGGER + TILE_LEN,
    });
    const revealFor = (style) => {
      if (reveals[style]) return reveals[style];
      const mod = modFor(style);
      if (!mod) return null;
      const r = mod.build(x, ctxFor());
      r.root.style.display = 'none';
      media.append(r.root);
      return (reveals[style] = r);
    };
    let runner = null, typedN = -1, pcted = -1, scored = '', brained = -1;
    return {
      nodes: [say, media],
      marks: [[T.r, say], [T.card, media]],
      render(t) {
        const v = variant();
        const style = appear();
        if (v !== lastV || style !== lastStyle) {
          card.style.display = v === '1' ? '' : 'none';
          edit.style.display = v === 'photoedit' ? '' : 'none';
          set.style.display = v === '10' && style === 'default' ? '' : 'none';
          for (const id in reveals) reveals[id].root.style.display = 'none';
          const shownReveal = v === '10' && style !== 'default' ? revealFor(style) : null;
          if (shownReveal) shownReveal.root.style.display = '';
          model.style.display = v === '3d' ? '' : 'none';
          game.style.display = v === 'game' ? '' : 'none';
          garden.node.style.display = v === 'garden' ? '' : 'none';
          trip.style.display = v === 'roadtrip' ? '' : 'none';
          logo.style.display = v === 'logo' ? '' : 'none';
          frame.style.display = v === 'lawn' ? '' : 'none';
          media.dataset.v = v; // chat.css drops the feed's will-change while the 10-image variant shows
          lastV = v; lastStyle = style; shown = -1;
        }
        const text = SAY[v];
        const n = streamCount(text, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = text.slice(0, n); hid.textContent = text.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        media.style.opacity = ci.toFixed(3);
        media.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;
        const label = (1 - seg(t, T.w1 - 0.25, T.w1)).toFixed(3);
        if (v === 'garden') { garden.render(t, T, label); return; }
        if (v === 'roadtrip') { roadtrip.render(t, T, label); return; }
        if (v === 'lawn') { lawn.render(t, T, label); return; }
        if (v === 'game') {
          if (!runner) { runner = makeZombieGame(gcanvas, ZOMBIE); track(runner.ready); }
          const g = Math.max(0, t - (T.w0 + PLAY));
          runner.draw({ g });
          // code phase: the card lands on the editor and Gemini types the game into it
          const p = seg(t, T.card, T.w0 + BOOT);
          const n = Math.round(outCubic(p) * CODE_CHARS);
          if (n !== typedN) {
            const f = codeFrame(n);
            pre.innerHTML = f.html;
            pre.style.transform = `translateY(${-Math.round(Math.max(0, f.line - (CODE_ROWS - 1)) * CODE_LINE_H)}px)`;
            typedN = n;
          }
          const pc = Math.round(p * 100);
          if (pc !== pcted) { gpct.textContent = `${pc}%`; pcted = pc; }
          // boot: the editor lifts away and the runner settles into frame
          const b = outCubic(seg(t, T.w0 + BOOT, T.w0 + BOOT + BOOT_LEN));
          code.style.opacity = (1 - b).toFixed(3);
          code.style.transform = b > 0 ? `translateY(${(-12 * b).toFixed(2)}px)` : 'none';
          code.style.visibility = b >= 1 ? 'hidden' : '';
          gcanvas.style.opacity = b.toFixed(3);
          gcanvas.style.transform = b >= 1 ? 'none' : `scale(${lerp(1.04, 1, b).toFixed(4)})`;
          gamel.style.opacity = (1 - b).toFixed(3);
          showDl(gameShare, b);
          const hud = gameState(g);
          const sc = String(hud.score).padStart(4, '0');
          if (sc !== scored) { scoreEl.textContent = sc; scored = sc; }
          if (hud.brains !== brained) { brainsEl.textContent = hud.brains; brained = hud.brains; }
          for (const c of chips) c.style.opacity = b.toFixed(3);
          return;
        }
        if (v === '3d') {
          if (!viewer) { viewer = makeZombieViewer(canvas, ZOMBIE_3D); track(viewer.ready); }
          // the finished model turns on its stand from the moment the card lands; it appears exactly as the 1-image card does
          if (ci > 0) viewer.draw({ spin: SPIN0 + SPIN * (t - T.card) });
          const lp = landing(t, landAt);
          shimmer(modelSk, t, T.card, 0, lp);
          settle(canvas, lp);
          const p = Math.round(seg(t, T.w0, T.w1) * 100);
          if (p !== built) { pct.textContent = `${p}%`; built = p; }
          modell.style.opacity = label;
          return;
        }
        if (v === 'logo') {
          // the generated logo resolves out of a blur across the generation window
          resolve(logoIm, logoGen, seg(t, T.w0, T.w1));
          logoL.style.opacity = label;
          showDl(logoShare, 1 - label);
          return;
        }
        if (v !== '10') {
          // the meme (or the edited photo) shimmers as a skeleton while it generates, then lands as a climbing result's
          // thumbnail does
          const c = v === 'photoedit' ? edited : meme;
          const lp = landing(t, landAt);
          shimmer(c.sk, t, T.card, 0, lp);
          settle(c.im, lp);
          showShare(c, lp);
          c.genl.style.opacity = label;
          return;
        }
        // a platform's reveal draws its own whole block
        if (style !== 'default') { const r = revealFor(style); if (r) r.render(t); return; }
        // Default: every slot shimmers as a skeleton until its turn, then the ten land one after another in reading order,
        // each as a climbing result's thumbnail does, settling onto its crop
        tiles.forEach((tl, i) => {
          const p = landing(t, T.w0 + GRID0 + i * GRID_STEP);
          shimmer(tl.sk, t, T.card, i, p);
          settle(tl.im, p, tl.g.zoom);
          showShare(tl, p);
        });
      },
    };
  },
};

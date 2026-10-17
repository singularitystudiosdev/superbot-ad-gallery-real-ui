// Assets a frame cannot be drawn exactly without (the 3D variant's model): a frozen ?t= capture waits on __AD.ready
// (timeline.9b47fc30.js), which reads settled() here. A failed load settles too; its owner logs the error.
let pending = 0;
const done = () => { pending--; };

export function track(promise) {
  pending++;
  promise.then(done, done);
  return promise;
}

export const settled = () => pending === 0;

// ---- reveal tile images (#182) ------------------------------------------------------------------------------------------
// A reveal module's tiles are one 870x1024 picture drawn ten times at ten small crops, and Chromium rasterises such an image
// through its GPU decode cache. Two things in that cache made one landed block rasterise differently from page to page (every
// pixel on an image edge off by up to ~60/255), sporadically, mostly in the first pair of a fresh process:
//  - img.decode() (what this gate used to call once a tile had loaded) parks a full-size decode in the cache; a raster that
//    follows soon after reuses it, a later one rebuilds its own, so which of two renderings a block gets depended on the race
//    between the decode and the first paint. Nothing here calls decode(): a tile (decoding="sync") is decoded the one way, at paint.
//  - a tile painted in the first moments after its image arrived can differ again from the same tile painted a little later.
//    In a frozen ?t= capture the tiles are therefore held out of the first paint (data-rv-wait, below) until SETTLE ms after
//    every one has loaded, then painted together, and the gate stays closed AFTER ms more, so __AD.ready means "painted for good".
// A live (unfrozen) page keeps no hold: nobody compares it with another page, and a style pick must show its landing at once.
// Anything that picks a style in a frozen page and then captures must wait on __AD.ready again (it covers the hold).
const SETTLE = 1500, AFTER = 1000;
const WAIT = 'data-rv-wait';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const frames = (n) => new Promise((r) => { const step = () => (n-- <= 0 ? r() : requestAnimationFrame(step)); step(); });
let waitStyle = false;

export function gateTiles(imgs) {
  const list = [...imgs];
  const hold = new URLSearchParams(location.search).has('t');
  if (hold) {
    if (!waitStyle) {
      waitStyle = true;
      const s = document.createElement('style');
      s.dataset.rvGate = '';
      s.textContent = `img[${WAIT}] { visibility: hidden !important; }`;
      document.head.appendChild(s);
    }
    list.forEach((im) => im.setAttribute(WAIT, ''));
  }
  const loaded = list.map((im) => new Promise((resolve) => {
    if (im.complete && im.naturalWidth > 0) { resolve(); return; }
    im.addEventListener('load', resolve, { once: true });
    im.addEventListener('error', (e) => { console.error('reveal tile image failed to load', im.src, e); resolve(); }, { once: true });
  }));
  track(Promise.all(loaded)
    .then(() => (hold ? sleep(SETTLE) : undefined))
    .then(() => { list.forEach((im) => im.removeAttribute(WAIT)); return hold ? frames(2).then(() => sleep(AFTER)) : undefined; }));
}

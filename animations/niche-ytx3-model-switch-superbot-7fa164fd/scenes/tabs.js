// niche-ytx3: the story scene, B1 to B4 (marks.js). One section, four layers drawn from one clock:
//   hub    B1  the superbot hub, cropped to its thread (tabs-assets/beats/ask.js)
//   race   B2  three models race on the thumbnail, superbot picks slot b (beats/race.js)
//   studio B3  YouTube Studio > Content in a framed window, the winner flies into the row, the A/B test (beats/studio.js)
//   watch  B4  the watch page in the same frame, the player clip playing (beats/watch.js)
//   flyer      the winning thumbnail in flight between the race pane and the Studio row
// The scene keeps the id "tabs" so the hub's generated stylesheets (scoped under #s-tabs) apply unchanged. Every frame
// sequence is fetched and decoded in mount (the module's `ready` promise, which timeline.js awaits before the first
// frame), so render(lt) is a pure function of time: drawn by frame index, nothing carried between frames.
import { DATA } from '../ux/ux.js';
import { loadSeq } from './tabs-assets/frames.js';
import { B5 } from './tabs-assets/marks.js';
import { buildAsk, renderAsk } from './tabs-assets/beats/ask.js';
import { buildRace, renderRace, winnerCanvas } from './tabs-assets/beats/race.js';
import { buildStudio, renderStudio } from './tabs-assets/beats/studio.js';
import { buildWatch, renderWatch } from './tabs-assets/beats/watch.js';

const here = (p) => new URL(p, import.meta.url).href;
const TAIL = 0; // the scene's own fade to the end card is timeline.js SCENE_FADE, inside B4's last 0.2 s

let S = null;

async function load() {
  const [models, manifest] = await Promise.all([
    fetch(here('../img/models.json')).then((r) => r.json()),
    fetch(here('../media/manifest.json')).then((r) => r.json()),
  ]);
  const sq = manifest.sequences;
  const names = ['resolve-a', 'resolve-b', 'resolve-c', 'player'];
  const seqs = await Promise.all(names.map((n) => loadSeq(n, sq[n].frames)));
  return { models, manifest, seqs, finish: ['resolve-a', 'resolve-b', 'resolve-c'].map((n) => sq[n].finishFrame) };
}

async function decodeAll(root) {
  // an image that already failed is complete with no size: never wait on it (ux.js hides a missing file itself)
  await Promise.all([...root.querySelectorAll('img')].map((im) => (im.complete ? (im.naturalWidth ? im.decode().catch(() => {}) : null) : new Promise((res) => {
    im.addEventListener('load', () => im.decode().catch(() => {}).then(res), { once: true });
    im.addEventListener('error', res, { once: true });
  }))));
}

const mod = {
  id: 'tabs',
  dur: B5 + TAIL,
  ready: null,

  mount(section) {
    section.innerHTML = `<div class="x3-root">
  <div class="x3-layer x3-hub"></div>
  <div class="x3-layer x3-race"></div>
  <div class="x3-layer x3-win x3-studio"></div>
  <div class="x3-layer x3-win x3-watch"></div>
  <img class="x3-flyer" alt=""/>
</div>`;
    const q = (s) => section.querySelector(s);
    const root = q('.x3-root');
    mod.ready = (async () => {
      const L = await load();
      const ask = buildAsk(q('.x3-hub'), DATA);
      const race = buildRace(q('.x3-race'), L.models, L.seqs.slice(0, 3), L.finish);
      const studio = buildStudio(q('.x3-studio'), DATA, L.models);
      const watch = buildWatch(q('.x3-watch'), DATA, L.seqs[3]);
      const flyer = q('.x3-flyer');
      flyer.src = here('../img/' + L.models.slots.find((s) => s.slot === L.models.recommendedWinner).file);
      await decodeAll(section);
      await document.fonts.ready;
      S = { root, ask, race, studio, watch, flyer };
    })();
  },

  render(lt, ctx) {
    if (!S) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    renderAsk(S.ask, t, W);
    renderRace(S.race, t, W);
    renderStudio(S.studio, t, S.root, S.flyer, winnerCanvas(S.race));
    renderWatch(S.watch, t);
  },
};
export default mod;

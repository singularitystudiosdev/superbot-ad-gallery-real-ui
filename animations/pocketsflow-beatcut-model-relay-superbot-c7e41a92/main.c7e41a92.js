// Boot: build the spot, wait for fonts, images and the decoded turntable, then expose window.seek(t)
// (render contract). Outside render mode it loops; ?t=<s> freezes one frame, space pauses.
import { buildAd, DUR } from './script.c7e41a92.js';
import { loadFrames } from './frames.c7e41a92.js';

const stage = document.getElementById('stage');
const ad = buildAd(stage);

async function ready() {
  await document.fonts.load('700 80px "Averia Serif Libre"');
  await document.fonts.ready;
  await Promise.all([...document.images].map((img) => img.decode().catch((err) => {
    console.error('image failed to decode', img.src, err);
    throw err;
  })));
  await loadFrames();
  ad.measure();
}
const readyP = ready();

window.seek = async (t) => {
  await readyP;
  ad.seek(Math.min(Math.max(t, 0), DUR));
};
window.__AD = { CYCLE: DUR, seek: window.seek, ready: false, segments: [{ id: 'spot', start: 0, end: DUR }] };
readyP.then(() => (window.__AD.ready = true));

function fit() {
  if (window.__RENDER__) return;
  const s = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transform = `translate(${(innerWidth - 1920 * s) / 2}px, ${(innerHeight - 1080 * s) / 2}px) scale(${s})`;
}
fit();
addEventListener('resize', fit);

if (!window.__RENDER__) {
  const frozen = new URLSearchParams(location.search).get('t');
  readyP.then(() => {
    if (frozen !== null) {
      ad.seek(Number(frozen));
      return;
    }
    let origin = performance.now();
    let pausedAt = null;
    addEventListener('keydown', (e) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (pausedAt === null) pausedAt = performance.now();
      else {
        origin += performance.now() - pausedAt;
        pausedAt = null;
      }
    });
    const tick = (now) => {
      if (pausedAt === null) ad.seek(((now - origin) / 1000) % DUR);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

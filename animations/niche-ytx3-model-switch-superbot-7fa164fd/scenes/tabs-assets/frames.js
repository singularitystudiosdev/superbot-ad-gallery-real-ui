// frames.js: the rendered frame sequences (media/manifest.json), preloaded and decoded before the first frame is
// drawn, then drawn by frame index from t. Nothing here keeps a clock or carries state between frames: drawSeq(c, s, i)
// paints frame i of sequence s into canvas c, whatever was drawn before.
const media = (p) => new URL('../../media/' + p, import.meta.url).href;

/** load every frame of media/<name>/f001.jpg .. f<n>.jpg and wait until each is decoded */
export async function loadSeq(name, n) {
  const imgs = [];
  for (let i = 1; i <= n; i++) {
    const im = new Image();
    im.decoding = 'sync';
    im.src = media(`${name}/f${String(i).padStart(3, '0')}.jpg`);
    imgs.push(im);
  }
  await Promise.all(imgs.map((im) => im.decode().catch(() => new Promise((res) => {
    // decode() can reject on a busy page even when the file is fine: fall back to the load event
    if (im.complete && im.naturalWidth) res(); else { im.onload = res; im.onerror = res; }
  }))));
  return imgs;
}

/** paint frame i (0-based, clamped) of seq into canvas c, cover-fit */
export function drawSeq(c, seq, i) {
  const k = Math.max(0, Math.min(seq.length - 1, i | 0));
  if (c._drawn === seq[k]) return; // the same frame is already on this canvas
  const im = seq[k];
  const g = c.getContext('2d');
  const s = Math.max(c.width / im.naturalWidth, c.height / im.naturalHeight);
  const w = im.naturalWidth * s, h = im.naturalHeight * s;
  g.drawImage(im, (c.width - w) / 2, (c.height - h) / 2, w, h);
  c._drawn = im;
}

/** frame index of a 30 fps sequence that started at t0, at time t */
export const seqIndex = (t, t0, fps = 30) => Math.floor((t - t0) * fps + 1e-6);

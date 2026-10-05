// The Blender turntable (60 Cycles frames) decoded once into ImageBitmaps, so any seek draws the exact
// frame synchronously; shared by the Blender viewport and the film's drop shot.
export const NFR = 60;
const bitmaps = [];

export async function loadFrames() {
  const jobs = Array.from({ length: NFR }, async (_, i) => {
    const src = `blender/tt/tt_${String(i + 1).padStart(4, '0')}.jpg`;
    const res = await fetch(src);
    if (!res.ok) throw new Error(`turntable frame ${src}: HTTP ${res.status}`);
    bitmaps[i] = await createImageBitmap(await res.blob());
  });
  await Promise.all(jobs);
}

/** Draws 1-based frame n into the canvas, cover-fitted. */
export function drawFrame(canvas, n) {
  const bmp = bitmaps[Math.min(NFR, Math.max(1, n)) - 1];
  if (!bmp) return;
  const ctx = canvas.getContext('2d');
  const s = Math.max(canvas.width / bmp.width, canvas.height / bmp.height);
  const w = bmp.width * s, hh = bmp.height * s;
  ctx.drawImage(bmp, (canvas.width - w) / 2, (canvas.height - hh) / 2, w, hh);
}

// creator-video.js: Noa's video ("I turned a 9 m² closet into my dream studio") playing inside the watch page's
// player, rendered from code onto a canvas out of the generated stills.
//
//   import { mountCreatorVideo, LIGHT_BOX, frameBox } from './scenes/motion/creator-video.js';
//   const vid = mountCreatorVideo(watch.videoSlot, { frames: 'img/frames/' });
//   await vid.ready;                       // every still decoded
//   vid.render(461.3);                     // playing, video time in seconds (7:41.3)
//   vid.render(300, { scrubbing: true });  // seek preview while the scrubber is dragged
//
// Video time -> picture:
//   458 s (7:38) f0738   460 (7:40) f0740   462 (7:42) f0742   464 (7:44) f0744
// Between stills the shot keeps living: a slow push-in, seeded handheld drift (layered value noise, no randomness at
// render time), a jump cut with a short motion-blurred camera bump where the framing is the same (a vlog jump cut),
// and a motion-blurred match-move dissolve where the camera reframes (tilt up and push in toward the shelf). The warm
// light behind the top shelf breathes with a gentle seeded flicker and bloom, and a seeded grain plate changes every
// video frame. While scrubbing, the nearest storyboard frame is shown low-res and upscaled, the way YouTube shows its
// seek previews in the player (s0410 at 4:10, s0930 at 9:30, s1105 at 11:05, else the nearest f-frame).
//
// render() is a pure function of its arguments: no timers, no clock, no unseeded randomness. Any t, any order.

export const FRAME_W = 1920, FRAME_H = 1080;

/** [x, y, w, h] in f0742's 1920x1080 pixels: the warm lantern light behind the top shelf (Gemini's annotation box). */
export const LIGHT_BOX = [826, 60, 374, 372];   // measured on img/frames/f0742.jpg: paper lantern x 850..1175, y 78..412

// the stills, in video time. `light` = the lantern glow in that still's own pixels ([cx, cy, r]), null when it is off
const SHOTS = [
  { key: 'f0738', t: 458, light: null },                // seated, lantern still off
  { key: 'f0740', t: 460, light: [1022, 100, 130] },    // jump cut: standing, reaching up, lantern on
  { key: 'f0742', t: 462, light: [1012, 245, 190] },    // tilted up, pushed in on the lantern over the top shelf
  { key: 'f0744', t: 464, light: [992, 205, 190] },     // jump cut: turned to camera, presenting the shelf
];
// how the picture gets from one still to the next (index i -> i+1). cut: a jump cut with a camera bump.
// move: the camera travels by (x, y) of the frame and scales by s while the stills dissolve at peak speed.
const TRANSITIONS = [
  { type: 'cut', at: 459.0, bump: [0.010, -0.006] },
  // f0740 -> f0742 matched on the lantern: (1022, 95) w 220 -> (1012, 245) w 325, i.e. scale 1.48 about the centre
  // plus (-0.021, +0.337) of the frame. The camera tilts up and pushes in; the stills dissolve at peak speed.
  { type: 'move', at: 461.0, dur: 0.72, x: -0.021, y: 0.337, s: 0.48 },
  { type: 'cut', at: 463.0, bump: [-0.008, 0.005] },
];
// storyboard frames for seek previews: video time -> key
const SCRUB = [
  { key: 's0410', t: 250 },
  { key: 's0930', t: 570 },
  { key: 's1105', t: 665 },
];
const ALL_KEYS = [...SHOTS.map((s) => s.key), ...SCRUB.map((s) => s.key)];

const OVERSCAN = 1.05;        // base zoom so drift, bumps and rotation never show an edge
const PUSH = 0.0055;          // slow push-in, scale per second of video time
const SHUTTER = 1 / 60;       // 180 degree shutter at 30 fps
const STORYBOARD_W = 160;     // seek preview resolution (YouTube storyboards are about this size)

// ---------------------------------------------------------------- seeded math (pure)
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, f) => a + (b - a) * f;
const inOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const smooth = (x) => x * x * (3 - 2 * x);
function hash(i, seed) {
  let h = Math.imul(i | 0, 374761393) ^ Math.imul(seed | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
/** smooth 1D value noise in -1..1 */
function vnoise(t, seed) {
  const i = Math.floor(t), f = t - i;
  return lerp(hash(i, seed) * 2 - 1, hash(i + 1, seed) * 2 - 1, smooth(f));
}
function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** handheld drift at video time t: { x, y } as fractions of the frame, r in radians */
function handheld(t) {
  return {
    x: 0.0040 * vnoise(t * 0.55, 11) + 0.0015 * vnoise(t * 1.9, 12) + 0.0004 * vnoise(t * 5.3, 13),
    y: 0.0032 * vnoise(t * 0.5, 14) + 0.0013 * vnoise(t * 2.1, 15) + 0.0004 * vnoise(t * 6.1, 16),
    r: 0.0016 * vnoise(t * 0.42, 21) + 0.0005 * vnoise(t * 1.7, 22),
  };
}
/** a camera bump around a jump cut: a damped kick that peaks just after the cut */
function bump(t, at, [bx, by]) {
  const d = t - at;
  if (d < -0.05 || d > 0.6) return { x: 0, y: 0 };
  // ease into the cut over 50 ms, then a damped spring settle
  const k = d < 0 ? smooth((d + 0.05) / 0.05) : Math.exp(-d * 9) * Math.cos(d * 14);
  return { x: bx * k, y: by * k };
}
/** light flicker 0..1 around 0.5: slow breathing plus a faint fast shimmer */
const flicker = (t) => 0.5 + 0.32 * vnoise(t * 1.3, 31) + 0.12 * vnoise(t * 6.5, 32) + 0.06 * vnoise(t * 17, 33);

/**
 * The layers on screen at video time t: [{ shot, alpha, cam: { x, y, s, r } }], bottom first.
 * cam x/y are fractions of the frame (offset of the image centre), s the scale, r radians.
 */
function layersAt(t) {
  const hh = handheld(t);
  const push = OVERSCAN * (1 + PUSH * (t - SHOTS[0].t));
  const base = (extra = { x: 0, y: 0, s: 1 }) => ({
    x: hh.x + extra.x, y: hh.y + extra.y, s: push * extra.s, r: hh.r,
  });
  // which still is "current": the last one whose transition into it has started
  let i = 0;
  for (let k = 0; k < TRANSITIONS.length; k++) {
    const tr = TRANSITIONS[k];
    const start = tr.type === 'move' ? tr.at - tr.dur / 2 : tr.at;
    if (t >= start) i = k + 1;
  }
  // a move transition in flight: both stills on screen, riding one camera move
  for (let k = 0; k < TRANSITIONS.length; k++) {
    const tr = TRANSITIONS[k];
    if (tr.type !== 'move') continue;
    const a = tr.at - tr.dur / 2, b = tr.at + tr.dur / 2;
    if (t >= a && t < b) {
      const u = (t - a) / tr.dur;
      const m = inOutCubic(u);
      // outgoing: the camera travels away from its framing by m; incoming: arrives from (m - 1)
      const sOut = Math.pow(1 + tr.s, m), sIn = Math.pow(1 + tr.s, m - 1);
      const mix = smooth(clamp((u - 0.3) / 0.36));
      return [
        { shot: SHOTS[k], alpha: 1, cam: base({ x: tr.x * m, y: tr.y * m, s: sOut }) },
        { shot: SHOTS[k + 1], alpha: mix, feather: 1 - smooth(clamp((u - 0.62) / 0.3)), cam: base({ x: tr.x * (m - 1), y: tr.y * (m - 1), s: sIn }) },
      ];
    }
  }
  // a single still, plus any jump cut bump nearby
  let bx = 0, by = 0;
  for (const tr of TRANSITIONS) {
    if (tr.type !== 'cut') continue;
    const b = bump(t, tr.at, tr.bump);
    bx += b.x; by += b.y;
  }
  return [{ shot: SHOTS[clamp(i, 0, SHOTS.length - 1)], alpha: 1, cam: base({ x: bx, y: by, s: 1 }) }];
}

/** how fast the picture moves at t, in frame widths per second (drives the motion blur sample count) */
/** shutter length at t: 180 degrees, opened up to 300 degrees during a camera move (a whip smears more) */
function shutterAt(t) {
  for (const tr of TRANSITIONS) if (tr.type === 'move' && Math.abs(t - tr.at) < tr.dur / 2 + 0.05) return SHUTTER * 1.67;
  return SHUTTER;
}

/** keep a shutter sample on the same side of every jump cut as the frame's own time (blur never crosses a cut) */
function sameSide(ts, t) {
  for (const tr of TRANSITIONS) {
    if (tr.type !== 'cut') continue;
    if (t >= tr.at && ts < tr.at) ts = tr.at;
    else if (t < tr.at && ts >= tr.at) ts = tr.at - 1e-4;
  }
  return ts;
}

function speedAt(t) {
  const dt = 1 / 240;
  const a = layersAt(sameSide(t - dt, t)), b = layersAt(sameSide(t + dt, t));
  const la = a[a.length - 1], lb = b[b.length - 1];
  if (la.shot !== lb.shot) return 0;
  const dx = lb.cam.x - la.cam.x, dy = lb.cam.y - la.cam.y, ds = Math.log(lb.cam.s / la.cam.s);
  return Math.hypot(dx, dy, ds * 0.6) / (2 * dt);
}

/** map a point in a still's 1920x1080 pixels through a layer camera to output frame pixels */
function project(cam, px, py) {
  const x0 = px - FRAME_W / 2, y0 = py - FRAME_H / 2;
  const c = Math.cos(cam.r), s = Math.sin(cam.r);
  return [
    FRAME_W / 2 + cam.x * FRAME_W + cam.s * (x0 * c - y0 * s),
    FRAME_H / 2 + cam.y * FRAME_H + cam.s * (x0 * s + y0 * c),
  ];
}

/**
 * Where a box given in a still's pixels sits in the player's 1920x1080 picture at video time t (the camera push and
 * drift move it). Use it for the annotation: annotation.box = frameBox(LIGHT_BOX, 462).
 * Returns the axis-aligned [x, y, w, h] in 1920x1080 picture pixels.
 */
export function frameBox(box = LIGHT_BOX, t = 462) {
  const ls = layersAt(t);
  const cam = ls[ls.length - 1].cam;
  const [x, y, w, h] = box;
  const pts = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([a, b]) => project(cam, a, b));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys);
  return [x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0].map((v) => Math.round(v * 10) / 10);
}

/** the seek preview key for video time t: nearest storyboard frame among the scrub frames and the f-frames */
export function scrubKeyAt(t) {
  let best = null, bd = Infinity;
  for (const s of [...SCRUB, ...SHOTS]) {
    const d = Math.abs(s.t - t);
    if (d < bd) { bd = d; best = s.key; }
  }
  return best;
}

function resolveFrames(frames) {
  const def = new URL('../../img/frames/', import.meta.url).href;
  if (!frames || typeof frames === 'string') {
    const base = frames ? (frames.endsWith('/') ? frames : frames + '/') : def;
    return Object.fromEntries(ALL_KEYS.map((k) => [k, base + k + '.jpg']));
  }
  if (Array.isArray(frames)) {
    // a list of URLs: matched to keys by the key appearing in the URL
    return Object.fromEntries(ALL_KEYS.map((k) => [k, frames.find((u) => String(u).includes(k))]));
  }
  return Object.fromEntries(ALL_KEYS.map((k) => [k, frames[k] || frames[k + '.jpg'] || def + k + '.jpg']));
}

async function loadImage(url) {
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  await img.decode();
  try { return await createImageBitmap(img); } catch { return img; }
}

/**
 * Mount the creator video canvas into the player slot.
 * @param {HTMLElement} slotEl  the watch page's 16:9 player area (the canvas fills it)
 * @param {{ frames?: string|string[]|Record<string,string>, maxWidth?: number, scale?: number }} opts
 *   frames: a base URL holding f0738.jpg ... s1105.jpg, or a { key: url } map, or a URL list. Default: AD/img/frames/.
 *   maxWidth: cap on the canvas backing width in px (default 1920). scale: backing px per layout px (default dpr, min 1).
 * @returns {{ el: HTMLCanvasElement, canvas: HTMLCanvasElement, ready: Promise<void>,
 *            render: (videoTimeSec: number, o?: { scrubbing?: boolean }) => void, LIGHT_BOX: number[],
 *            frameBox: typeof frameBox }}
 */
export function mountCreatorVideo(slotEl, { frames, maxWidth = 1920, scale } = {}) {
  const urls = resolveFrames(frames);
  const canvas = document.createElement('canvas');
  canvas.className = 'cv-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', display: 'block', background: '#000',
  });
  if (getComputedStyle(slotEl).position === 'static') slotEl.style.position = 'relative';
  slotEl.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const work = document.createElement('canvas');   // one motion blur sample
  const wctx = work.getContext('2d');

  const bitmaps = {};
  const feathered = {};   // stills with soft alpha edges, for an incoming layer smaller than the frame
  const boards = {};    // low-res storyboard canvases
  let grain = null;

  function feather(bm) {
    const f = document.createElement('canvas');
    f.width = FRAME_W; f.height = FRAME_H;
    const fc = f.getContext('2d');
    fc.drawImage(bm, 0, 0, FRAME_W, FRAME_H);
    fc.globalCompositeOperation = 'destination-out';
    const edge = 260;
    const sides = [
      [0, 0, edge, 0, 0, 0, edge, FRAME_H], [FRAME_W, 0, FRAME_W - edge, 0, FRAME_W - edge, 0, edge, FRAME_H],
      [0, 0, 0, edge, 0, 0, FRAME_W, edge], [0, FRAME_H, 0, FRAME_H - edge, 0, FRAME_H - edge, FRAME_W, edge],
    ];
    for (const [x0, y0, x1, y1, rx, ry, rw, rh] of sides) {
      const g = fc.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      fc.fillStyle = g;
      fc.fillRect(rx, ry, rw, rh);
    }
    return f;
  }

  function makeGrain() {
    const n = 192, g = document.createElement('canvas');
    g.width = g.height = n;
    const gc = g.getContext('2d');
    const id = gc.createImageData(n, n);
    const rnd = mulberry32(7421);
    for (let p = 0; p < n * n; p++) {
      const v = 128 + (rnd() + rnd() + rnd() - 1.5) * 120;
      id.data[p * 4] = id.data[p * 4 + 1] = id.data[p * 4 + 2] = clamp(v, 0, 255);
      id.data[p * 4 + 3] = 255;
    }
    gc.putImageData(id, 0, 0);
    return g;
  }

  const ready = (async () => {
    const entries = await Promise.all(ALL_KEYS.map(async (k) => {
      try { return [k, await loadImage(urls[k])]; } catch (e) {
        console.warn('creator-video: could not load', k, urls[k], e);
        return [k, null];
      }
    }));
    for (const [k, bm] of entries) {
      if (!bm) continue;
      bitmaps[k] = bm;
      if (SHOTS.some((s) => s.key === k)) feathered[k] = feather(bm);
      const b = document.createElement('canvas');
      b.width = STORYBOARD_W; b.height = Math.round(STORYBOARD_W * 9 / 16);
      const bc = b.getContext('2d');
      bc.imageSmoothingQuality = 'high';
      bc.drawImage(bm, 0, 0, b.width, b.height);
      boards[k] = b;
    }
    grain = makeGrain();
  })();

  function fitCanvas() {
    const w = slotEl.clientWidth || FRAME_W, h = slotEl.clientHeight || FRAME_H;
    const k = scale || Math.max(1, (typeof devicePixelRatio === 'number' ? devicePixelRatio : 1));
    let W = Math.min(maxWidth, Math.round(w * k));
    let H = Math.round(W * h / w);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    if (work.width !== W || work.height !== H) { work.width = W; work.height = H; }
    return [W, H];
  }

  // draw the layers at video time t onto c (W x H, the picture's 1920x1080 scaled to fit)
  function drawScene(c, W, H, t) {
    const k = W / FRAME_W;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
    c.fillStyle = '#000';
    c.fillRect(0, 0, W, H);
    const fl = flicker(t);
    for (const L of layersAt(t)) {
      const bm = bitmaps[L.shot.key];
      if (!bm || L.alpha <= 0.001) continue;
      // an incoming still smaller than the frame is drawn soft-edged, then firmed up as it fills the frame
      const soft = L.feather > 0 ? feathered[L.shot.key] : null;
      const { x, y, s, r } = L.cam;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.translate(W / 2 + x * W, H / 2 + y * H);
      c.rotate(r);
      c.scale(s * k, s * k);
      c.globalAlpha = L.alpha;
      c.globalCompositeOperation = 'source-over';
      c.imageSmoothingQuality = 'high';
      if (soft) {
        c.drawImage(soft, -FRAME_W / 2, -FRAME_H / 2, FRAME_W, FRAME_H);
        if (L.feather < 1) {
          c.globalAlpha = L.alpha * (1 - L.feather);
          c.drawImage(bm, -FRAME_W / 2, -FRAME_H / 2, FRAME_W, FRAME_H);
        }
      } else {
        c.drawImage(bm, -FRAME_W / 2, -FRAME_H / 2, FRAME_W, FRAME_H);
      }
      if (L.shot.light) {
        // bloom on the shelf glow: a warm screen-blended halo whose strength breathes with the flicker
        const [cx, cy, rr] = L.shot.light;
        const gx = cx - FRAME_W / 2, gy = cy - FRAME_H / 2;
        const rad = rr * (0.96 + 0.08 * fl);
        const g = c.createRadialGradient(gx, gy, 0, gx, gy, rad);
        const a = (0.10 + 0.16 * fl) * L.alpha;
        g.addColorStop(0, `rgba(255, 206, 150, ${a.toFixed(3)})`);
        g.addColorStop(0.35, `rgba(255, 176, 104, ${(a * 0.55).toFixed(3)})`);
        g.addColorStop(1, 'rgba(255, 150, 80, 0)');
        c.globalAlpha = 1;
        c.globalCompositeOperation = 'screen';
        c.fillStyle = g;
        c.fillRect(gx - rad, gy - rad, rad * 2, rad * 2);
        // the room exposure follows the lamp a touch (very gentle)
        c.globalCompositeOperation = 'soft-light';
        c.fillStyle = `rgba(255, 190, 130, ${((fl - 0.5) * 0.10 * L.alpha + 0.03).toFixed(3)})`;
        c.fillRect(-FRAME_W / 2, -FRAME_H / 2, FRAME_W, FRAME_H);
      }
    }
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }

  function finish(W, H, t, still) {
    // grain plate, a new offset every video frame (seeded by the frame index), and a soft lens vignette
    if (grain) {
      const fi = Math.floor(t * 30 + 1e-6);
      const ox = still ? 0 : Math.floor(hash(fi, 51) * 192), oy = still ? 0 : Math.floor(hash(fi, 52) * 192);
      const pat = ctx.createPattern(grain, 'repeat');
      const gs = Math.max(1, W / 1280);
      pat.setTransform(new DOMMatrix([gs, 0, 0, gs, -ox * gs, -oy * gs]));
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, W, H);
    }
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  /**
   * Draw the video at videoTimeSec. scrubbing: show the seek preview (nearest storyboard frame, low-res, upscaled).
   * Pure: the same arguments always paint the same pixels.
   */
  function render(videoTimeSec, { scrubbing = false } = {}) {
    const t = Number(videoTimeSec) || 0;
    const [W, H] = fitCanvas();
    if (scrubbing) {
      const key = scrubKeyAt(t);
      const b = boards[key];
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      if (b) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'low';
        ctx.drawImage(b, 0, 0, W, H);
      }
      return;
    }
    // motion blur: average n samples across a 180 degree shutter, n from the picture's speed
    const sp = speedAt(t);
    const sh = shutterAt(t);
    const pxPerFrame = sp * W * sh;
    const n = clamp(Math.ceil(pxPerFrame / 1.5), 1, 12);
    if (n === 1) {
      drawScene(ctx, W, H, t);
    } else {
      for (let i = 0; i < n; i++) {
        const ts = sameSide(t + (i / (n - 1) - 0.5) * sh, t);
        drawScene(wctx, W, H, ts);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1 / (i + 1);
        ctx.drawImage(work, 0, 0);
      }
      ctx.globalAlpha = 1;
    }
    finish(W, H, t, false);
  }

  return { el: canvas, canvas, ready, render, LIGHT_BOX, frameBox };
}

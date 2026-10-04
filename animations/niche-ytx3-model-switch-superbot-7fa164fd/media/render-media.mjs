#!/usr/bin/env node
// ytx3 in-ad video moments, rendered from code at 30 fps.
//
//   node media/render-media.mjs            (run from the ad folder, or anywhere)
//
// Writes, next to this file:
//   resolve-a/f001.jpg..f066.jpg  576x324  Nano Banana Pro: diffusion denoise, coarse to fine, clean at f054
//   resolve-b/f001.jpg..f066.jpg  576x324  GPT-5.4 Image 2: low-res first pass, sharp top-to-bottom reveal, clean at f060
//   resolve-c/f001.jpg..f066.jpg  576x324  FLUX.2 Pro: blur + film grain resolving to sharp, clean at f066
//   player/f001.jpg..f036.jpg     1280x720 the video playing: frame-1 push-in + handheld drift, hard cut at f019 to frame-2
//   preview.mp4                   1920x1080 30 fps h264 yuv420p, review only (resolves side by side, then the player clip)
//   manifest.json                 per sequence {dir, frames, fps, width, height, finishFrame}
//
// Every frame is a pure function of its index: no carried state, no Math.random, no clock, no
// network. Noise comes from mulberry32 with a fixed seed per (slot, step). Inputs are ../img/*.jpg.
// Dependencies: sharp (resolved normally, else from $YTX3_SHARP_DIR, else /tmp/ytx3-media.b343d06b)
// and ffmpeg on PATH (preview.mp4 only).

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const AD = path.dirname(HERE);
const IMG = path.join(AD, 'img');

function loadSharp() {
  const candidates = [HERE, process.env.YTX3_SHARP_DIR, '/tmp/ytx3-media.b343d06b'].filter(Boolean);
  for (const dir of candidates) {
    try {
      return createRequire(path.join(dir, 'package.json'))('sharp');
    } catch {}
  }
  throw new Error('sharp not found: npm install sharp@0.34 in /tmp/ytx3-media.b343d06b or set YTX3_SHARP_DIR');
}
const sharp = loadSharp();
sharp.cache(false);
sharp.concurrency(1); // identical bytes on every run and every machine core count

const FPS = 30;
const JPEG = { quality: 88, chromaSubsampling: '4:2:0', mozjpeg: true };
const RW = 576, RH = 324, RN = RW * RH;
const RESOLVE_FRAMES = 66;
const PW = 1280, PH = 720, PLAYER_FRAMES = 36, PLAYER_CUT = 19;

// ---------- deterministic helpers ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussField(seed, n) {
  // Box-Muller, n standard normal values
  const r = mulberry32(seed), out = new Float32Array(n);
  for (let i = 0; i < n; i += 2) {
    const u = Math.max(r(), 1e-9), v = r();
    const m = Math.sqrt(-2 * Math.log(u));
    out[i] = m * Math.cos(2 * Math.PI * v);
    if (i + 1 < n) out[i + 1] = m * Math.sin(2 * Math.PI * v);
  }
  return out;
}
// low-res gaussian grid (gw x gh x ch) upsampled bilinearly to w x h, per channel
function gridNoise(seed, gw, gh, ch, w, h) {
  const g = gaussField(seed, gw * gh * ch), out = new Float32Array(w * h * ch);
  for (let y = 0; y < h; y++) {
    const gy = Math.min(gh - 1.0001, Math.max(0, (y + 0.5) * gh / h - 0.5));
    const y0 = Math.floor(gy), fy = gy - y0;
    for (let x = 0; x < w; x++) {
      const gx = Math.min(gw - 1.0001, Math.max(0, (x + 0.5) * gw / w - 0.5));
      const x0 = Math.floor(gx), fx = gx - x0;
      for (let c = 0; c < ch; c++) {
        const a = g[(y0 * gw + x0) * ch + c], b = g[(y0 * gw + x0 + 1) * ch + c];
        const d = g[((y0 + 1) * gw + x0) * ch + c], e = g[((y0 + 1) * gw + x0 + 1) * ch + c];
        out[(y * w + x) * ch + c] = (a * (1 - fx) + b * fx) * (1 - fy) + (d * (1 - fx) + e * fx) * fy;
      }
    }
  }
  return out;
}
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const pad = (n) => String(n).padStart(3, '0');

function toU8(f32) {
  const out = Buffer.alloc(f32.length);
  for (let i = 0; i < f32.length; i++) {
    const v = Math.round(f32[i] * 255);
    out[i] = v < 0 ? 0 : v > 255 ? 255 : v;
  }
  return out;
}
const toF32 = (u8) => { const o = new Float32Array(u8.length); for (let i = 0; i < u8.length; i++) o[i] = u8[i] / 255; return o; };
async function writeJpeg(u8, w, h, file) {
  await sharp(u8, { raw: { width: w, height: h, channels: 3 } }).jpeg(JPEG).toFile(file);
}
async function rawOf(input, w, h, opts = {}) {
  return sharp(input).removeAlpha().toColourspace('srgb')
    .resize(w, h, { fit: 'fill', kernel: 'lanczos3', ...opts }).raw().toBuffer();
}

// Blur pyramid: sigma levels of the target, interpolated linearly in sigma between levels.
const SIGMAS = [0, 0.5, 1, 1.6, 2.4, 3.5, 5, 7, 10, 14, 20, 28, 38, 50];
async function blurPyramid(targetU8) {
  const levels = [];
  for (const s of SIGMAS) {
    const buf = s === 0 ? targetU8
      : await sharp(targetU8, { raw: { width: RW, height: RH, channels: 3 } }).blur(s).raw().toBuffer();
    levels.push(toF32(buf));
  }
  return (sigma) => {
    if (sigma <= 0) return levels[0];
    let i = 0;
    while (i < SIGMAS.length - 2 && SIGMAS[i + 1] < sigma) i++;
    const t = clamp01((sigma - SIGMAS[i]) / (SIGMAS[i + 1] - SIGMAS[i]));
    const a = levels[i], b = levels[i + 1], out = new Float32Array(a.length);
    for (let k = 0; k < a.length; k++) out[k] = a[k] + (b[k] - a[k]) * t;
    return out;
  };
}

// ---------- slot a: diffusion denoise (Nano Banana Pro) ----------
// x_t = sqrt(abar) * blur(target, sigma) + sqrt(1 - abar) * noise. abar rises 0 -> 1, sigma falls
// coarse -> fine. The noise is latent-grid colour noise (72x41, the 8x latent scale) plus pixel
// noise, re-drawn every denoising step (3 frames) with a variance-preserving cross-fade, so it
// boils step by step the way a sampler preview does.
function slotA(pyr, f, finish) {
  const p = clamp01((f - 1) / (finish - 1));
  const abar = Math.pow(Math.sin((Math.PI / 2) * Math.pow(p, 0.62)), 2);
  const sigma = 30 * Math.pow(1 - p, 1.8);
  const img = pyr(sigma);
  const STEP = 3, sp = (f - 1) / STEP, k = Math.floor(sp), th = (sp - k) * (Math.PI / 2);
  const cA = Math.cos(th), cB = Math.sin(th);
  const latA = gridNoise(1100 + k, 72, 41, 3, RW, RH), latB = gridNoise(1100 + k + 1, 72, 41, 3, RW, RH);
  const pixA = gaussField(5100 + k, RN * 3), pixB = gaussField(5100 + k + 1, RN * 3);
  const sa = Math.sqrt(abar), sn = Math.sqrt(1 - abar);
  // early previews are muddy and low contrast; colour settles as abar rises
  const sat = 0.55 + 0.45 * smooth(0.15, 0.85, p);
  const out = new Float32Array(RN * 3);
  for (let i = 0; i < RN; i++) {
    const r = img[i * 3], g = img[i * 3 + 1], b = img[i * 3 + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    for (let c = 0; c < 3; c++) {
      const j = i * 3 + c;
      const v = l + (img[j] - l) * sat;
      const n = 1.3 * (cA * latA[j] + cB * latB[j]) + 0.2 * (cA * pixA[j] + cB * pixB[j]);
      out[j] = 0.5 + sa * (v - 0.5) + sn * 0.26 * n;
    }
  }
  return out;
}

// ---------- slot b: progressive reveal over a low-res first pass (GPT image) ----------
async function slotBSetup(targetU8) {
  const rawIn = { raw: { width: RW, height: RH, channels: 3 } };
  const lowres = async (w, h, blur) => {
    const small = await sharp(targetU8, rawIn).resize(w, h, { kernel: 'cubic' }).raw().toBuffer();
    return toF32(await sharp(small, { raw: { width: w, height: h, channels: 3 } })
      .resize(RW, RH, { kernel: 'cubic' }).blur(blur).raw().toBuffer());
  };
  return { L1: await lowres(24, 14, 6), L2: await lowres(64, 36, 1.6), T: toF32(targetU8) };
}
function slotB(S, f, finish) {
  const { L1, L2, T } = S;
  const BG = [0.165, 0.165, 0.175];
  const a1 = smooth(2, 12, f); // placeholder -> first low-res pass
  const a2 = smooth(13, 21, f); // first pass -> second, finer pass
  // feathered sharp edge sweeping top to bottom, f17 -> finish
  const FEATHER = 44;
  const e = easeInOut(clamp01((f - 17) / (finish - 17))) * (RH + FEATHER * 2) - FEATHER;
  const out = new Float32Array(RN * 3);
  for (let y = 0; y < RH; y++) {
    const rv = f < 17 ? 0 : 1 - smooth(e - FEATHER, e + FEATHER, y);
    for (let x = 0; x < RW; x++) {
      const i = (y * RW + x) * 3;
      for (let c = 0; c < 3; c++) {
        const low = L1[i + c] + (L2[i + c] - L1[i + c]) * a2;
        const pre = BG[c] + (low - BG[c]) * a1;
        out[i + c] = pre + (T[i + c] - pre) * rv;
      }
    }
  }
  return out;
}

// ---------- slot c: blur + grain resolving to sharp (FLUX.2 Pro) ----------
function slotC(pyr, f, finish) {
  const p = clamp01((f - 1) / (finish - 1));
  const sigma = 44 * Math.pow(1 - p, 2.3);
  const img = pyr(sigma);
  const grain = 0.17 * Math.pow(1 - p, 1.4);
  const expo = 0.55 + 0.45 * smooth(0, 0.55, p); // lifts out of the dark, a night shot developing
  const g1 = gaussField(9100 + f, RN), g2 = gridNoise(9900 + f, RW >> 1, RH >> 1, 1, RW, RH);
  const out = new Float32Array(RN * 3);
  for (let i = 0; i < RN; i++) {
    const n = (0.3 * g1[i] + 1.05 * g2[i]) * grain;
    for (let c = 0; c < 3; c++) out[i * 3 + c] = img[i * 3 + c] * expo + n;
  }
  return out;
}

// ---------- player clip ----------
// Output pixel -> source pixel through zoom z, offset (ox, oy) in output px, roll r in radians;
// 2x2 supersampled bilinear from the full-res 1920x1080 still.
function renderMove(src, sw, sh, z, ox, oy, roll) {
  const out = new Float32Array(PW * PH * 3);
  const k = sw / PW / z, cr = Math.cos(roll), sr = Math.sin(roll);
  const OFF = [-0.25, 0.25];
  for (let y = 0; y < PH; y++) {
    for (let x = 0; x < PW; x++) {
      let r = 0, g = 0, b = 0;
      for (const dy of OFF) for (const dx of OFF) {
        const X = x + 0.5 + dx - PW / 2 - ox, Y = y + 0.5 + dy - PH / 2 - oy;
        const u = sw / 2 + (X * cr - Y * sr) * k - 0.5, v = sh / 2 + (X * sr + Y * cr) * k - 0.5;
        const x0 = Math.max(0, Math.min(sw - 2, Math.floor(u))), y0 = Math.max(0, Math.min(sh - 2, Math.floor(v)));
        const fx = clamp01(u - x0), fy = clamp01(v - y0);
        const i00 = (y0 * sw + x0) * 3, i10 = i00 + 3, i01 = i00 + sw * 3, i11 = i01 + 3;
        const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
        r += src[i00] * w00 + src[i10] * w10 + src[i01] * w01 + src[i11] * w11;
        g += src[i00 + 1] * w00 + src[i10 + 1] * w10 + src[i01 + 1] * w01 + src[i11 + 1] * w11;
        b += src[i00 + 2] * w00 + src[i10 + 2] * w10 + src[i01 + 2] * w01 + src[i11 + 2] * w11;
      }
      const o = (y * PW + x) * 3;
      out[o] = r / 1020; out[o + 1] = g / 1020; out[o + 2] = b / 1020;
    }
  }
  return out;
}
// handheld: sum of incommensurate low-frequency sines, seeded phases, closed-form in t
function handheld(seed, t, amp) {
  const r = mulberry32(seed), ph = () => r() * Math.PI * 2;
  const p1 = ph(), p2 = ph(), p3 = ph(), p4 = ph(), p5 = ph();
  const ox = amp * (0.65 * Math.sin(2 * Math.PI * 0.61 * t + p1) + 0.35 * Math.sin(2 * Math.PI * 1.37 * t + p2));
  const oy = amp * 0.7 * (0.6 * Math.sin(2 * Math.PI * 0.83 * t + p3) + 0.4 * Math.sin(2 * Math.PI * 1.71 * t + p4));
  const roll = (0.11 * Math.PI / 180) * Math.sin(2 * Math.PI * 0.47 * t + p5);
  return { ox, oy, roll };
}
function playerShot(f) {
  if (f < PLAYER_CUT) {
    // frame-1: the finished $89 desk, slow push-in toward the monitor, handheld drift
    const t = (f - 1) / FPS; // 0 .. 0.567 s
    const z = 1.05 + 0.045 * (t / 0.6);
    const h = handheld(4242, t + 3.1, 5.5);
    return { which: 1, z, ox: h.ox, oy: h.oy - 6 * (t / 0.6), roll: h.roll };
  }
  // frame-2: b-roll of the clamp, its own move: lateral slide plus a gentle push
  const t = (f - PLAYER_CUT) / FPS; // 0 .. 0.567 s
  const z = 1.065 + 0.025 * (t / 0.6);
  const h = handheld(7331, t + 11.7, 4);
  return { which: 2, z, ox: 14 - 26 * (t / 0.6) + h.ox, oy: h.oy, roll: h.roll };
}

// ---------- main ----------
async function main() {
  const t0 = Date.now();
  const models = JSON.parse(fs.readFileSync(path.join(IMG, 'models.json'), 'utf8'));
  const slotInfo = Object.fromEntries(models.slots.map((s) => [s.slot, s]));
  const SPEC = [
    { slot: 'a', finish: 54, kind: 'diffusion denoise, coarse to fine' },
    { slot: 'b', finish: 60, kind: 'low-res first pass, sharp top-to-bottom progressive reveal' },
    { slot: 'c', finish: 66, kind: 'blur and film grain resolving to sharp' },
  ];
  const manifest = { id: path.basename(AD), fps: FPS, generatedBy: 'media/render-media.mjs', sequences: {} };

  for (const s of SPEC) {
    const dir = path.join(HERE, `resolve-${s.slot}`);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const targetU8 = await rawOf(path.join(IMG, slotInfo[s.slot].file), RW, RH);
    const pyr = s.slot === 'b' ? null : await blurPyramid(targetU8);
    const bS = s.slot === 'b' ? await slotBSetup(targetU8) : null;
    for (let f = 1; f <= RESOLVE_FRAMES; f++) {
      let u8;
      if (f >= s.finish) u8 = targetU8; // finish and hold: the exact final thumbnail, scaled
      else if (s.slot === 'a') u8 = toU8(slotA(pyr, f, s.finish));
      else if (s.slot === 'b') u8 = toU8(slotB(bS, f, s.finish));
      else u8 = toU8(slotC(pyr, f, s.finish));
      await writeJpeg(u8, RW, RH, path.join(dir, `f${pad(f)}.jpg`));
    }
    manifest.sequences[`resolve-${s.slot}`] = {
      dir: `media/resolve-${s.slot}`, pattern: 'f%03d.jpg', frames: RESOLVE_FRAMES, fps: FPS, width: RW, height: RH,
      finishFrame: s.finish, finishTime: +((s.finish - 1) / FPS).toFixed(4),
      holdsFinalFrom: s.finish, source: `img/${slotInfo[s.slot].file}`,
      model: slotInfo[s.slot].display_name, modelId: slotInfo[s.slot].model_id, character: s.kind,
    };
    console.log(`resolve-${s.slot}: ${RESOLVE_FRAMES} frames, clean at f${pad(s.finish)} (${Date.now() - t0} ms)`);
  }

  // player clip
  const pdir = path.join(HERE, 'player');
  fs.rmSync(pdir, { recursive: true, force: true });
  fs.mkdirSync(pdir, { recursive: true });
  const srcs = {};
  for (const n of [1, 2]) {
    const { data, info } = await sharp(path.join(IMG, `frame-${n}.jpg`)).removeAlpha().toColourspace('srgb')
      .raw().toBuffer({ resolveWithObject: true });
    srcs[n] = { data, w: info.width, h: info.height };
  }
  for (let f = 1; f <= PLAYER_FRAMES; f++) {
    const sh = playerShot(f), src = srcs[sh.which];
    const out = renderMove(src.data, src.w, src.h, sh.z, sh.ox, sh.oy, sh.roll);
    await writeJpeg(toU8(out), PW, PH, path.join(pdir, `f${pad(f)}.jpg`));
  }
  manifest.sequences.player = {
    dir: 'media/player', pattern: 'f%03d.jpg', frames: PLAYER_FRAMES, fps: FPS, width: PW, height: PH,
    finishFrame: PLAYER_FRAMES, cutFrame: PLAYER_CUT,
    shots: [
      { from: 1, to: PLAYER_CUT - 1, source: 'img/frame-1.jpg', move: 'slow push-in 1.050x to 1.093x, handheld drift' },
      { from: PLAYER_CUT, to: PLAYER_FRAMES, source: 'img/frame-2.jpg', move: 'lateral slide right to left plus push 1.065x to 1.089x, handheld drift' },
    ],
    note: 'pure picture, no player UI; the build adds the YouTube chrome',
  };
  console.log(`player: ${PLAYER_FRAMES} frames, cut at f${pad(PLAYER_CUT)} (${Date.now() - t0} ms)`);

  // preview.mp4 (review only): the three resolves side by side for 66 frames, then the player clip
  const preview = path.join(HERE, 'preview.mp4');
  const seq = (d) => ['-framerate', String(FPS), '-start_number', '1', '-i', path.join(HERE, d, 'f%03d.jpg')];
  const GAP = 48, X0 = (1920 - 3 * RW - 2 * GAP) / 2, Y0 = (1080 - RH) / 2;
  const fc = [
    `color=c=0x0f0f0f:s=1920x1080:r=${FPS}:d=${RESOLVE_FRAMES / FPS}[bg]`,
    `[bg][0:v]overlay=${X0}:${Y0}:shortest=1[o1]`,
    `[o1][1:v]overlay=${X0 + RW + GAP}:${Y0}:shortest=1[o2]`,
    `[o2][2:v]overlay=${X0 + 2 * (RW + GAP)}:${Y0}:shortest=1,format=yuv420p,setsar=1[race]`,
    `[3:v]scale=1920:1080:flags=lanczos,format=yuv420p,setsar=1[play]`,
    `[race][play]concat=n=2:v=1:a=0[v]`,
  ].join(';');
  const ff = spawnSync('ffmpeg', [
    '-y', '-loglevel', 'error', ...seq('resolve-a'), ...seq('resolve-b'), ...seq('resolve-c'), ...seq('player'),
    '-filter_complex', fc, '-map', '[v]', '-r', String(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '30',
    '-pix_fmt', 'yuv420p', '-threads', '1', '-bitexact', '-movflags', '+faststart', '-an', preview,
  ], { stdio: 'inherit' });
  if (ff.status !== 0) throw new Error('ffmpeg preview encode failed');
  manifest.preview = { file: 'media/preview.mp4', width: 1920, height: 1080, fps: FPS, frames: RESOLVE_FRAMES + PLAYER_FRAMES, reviewOnly: true };

  fs.writeFileSync(path.join(HERE, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`done in ${Date.now() - t0} ms`);
}

main().catch((e) => { console.error(e); process.exit(1); });

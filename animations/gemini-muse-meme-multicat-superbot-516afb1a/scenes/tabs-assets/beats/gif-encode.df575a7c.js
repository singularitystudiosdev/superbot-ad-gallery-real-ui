// A small self-contained GIF89a encoder (no dependencies, no network). The dancing-cat GIF export (catgif.df575a7c.js)
// hands it the rendered frames; it returns the file's bytes.
//   1. palette: one global 256-colour table by median cut over a 15-bit (5:5:5) histogram of EVERY pixel of EVERY frame,
//      so a colour that only shows in one frame still gets a say, and the table is the same for all frames (no flicker)
//   2. mapping: nearest palette colour (squared RGB distance), memoised in a 32768-entry lookup keyed by the pixel's
//      5:5:5 colour, plus a fixed 4 x 4 ordered dither so smooth gradients do not band and the pattern holds still
//      from frame to frame (an error-diffusion dither would shimmer on a static backdrop and bloat the LZW stream)
//   3. LZW with minimum code size 8, 12-bit codes, a clear code when the table fills, 255-byte sub-blocks
//   4. container: GIF89a header, global colour table, NETSCAPE2.0 loop-forever extension, then per frame a Graphic
//      Control Extension (delay in centiseconds) and an image descriptor
// encodeGif({ width, height, frames, delay, onFrame }) -> Promise<Uint8Array>. `frames` is an array of RGBA
// Uint8ClampedArrays (width * height * 4), `delay` the per-frame delay in centiseconds. `onFrame(done, total)` is
// called after each frame is encoded and awaited, which is where the caller yields to the page.

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]; // 4 x 4 ordered-dither thresholds, 0..15
const DITHER = 5;                                                   // peak offset, in 8-bit levels

// ---- palette: median cut over the 5:5:5 histogram ---------------------------------------------------------------------
function buildPalette(frames) {
  const cnt = new Float64Array(32768), sr = new Float64Array(32768), sg = new Float64Array(32768), sb = new Float64Array(32768);
  for (const px of frames) {
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      cnt[k]++; sr[k] += r; sg[k] += g; sb[k] += b;
    }
  }
  const keys = [];
  for (let k = 0; k < 32768; k++) if (cnt[k]) keys.push(k);
  // a box is a run keys[lo..hi) of the (re-ordered) key list; it knows its colour extent
  const box = (lo, hi) => {
    let rmin = 255, rmax = 0, gmin = 255, gmax = 0, bmin = 255, bmax = 0, n = 0;
    for (let i = lo; i < hi; i++) {
      const k = keys[i], c = cnt[k];
      const r = sr[k] / c, g = sg[k] / c, b = sb[k] / c;
      if (r < rmin) rmin = r; if (r > rmax) rmax = r;
      if (g < gmin) gmin = g; if (g > gmax) gmax = g;
      if (b < bmin) bmin = b; if (b > bmax) bmax = b;
      n += c;
    }
    return { lo, hi, n, rr: rmax - rmin, gr: gmax - gmin, br: bmax - bmin };
  };
  const boxes = [box(0, keys.length)];
  while (boxes.length < 256) {
    // split the box with the most pixels (weighted by its widest side) that still holds more than one colour
    let bi = -1, best = -1;
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      if (b.hi - b.lo < 2) continue;
      const score = b.n * (Math.max(b.rr, b.gr, b.br) + 1);
      if (score > best) { best = score; bi = i; }
    }
    if (bi < 0) break;
    const b = boxes[bi];
    const ch = b.rr >= b.gr && b.rr >= b.br ? sr : b.gr >= b.br ? sg : sb;
    const part = keys.slice(b.lo, b.hi).sort((x, y) => ch[x] / cnt[x] - ch[y] / cnt[y]);
    for (let i = 0; i < part.length; i++) keys[b.lo + i] = part[i];
    let half = b.n / 2, acc = 0, cut = b.lo + 1;
    for (let i = b.lo; i < b.hi - 1; i++) { acc += cnt[keys[i]]; cut = i + 1; if (acc >= half) break; }
    boxes.splice(bi, 1, box(b.lo, cut), box(cut, b.hi));
  }
  const pal = new Uint8Array(256 * 3);
  boxes.forEach((b, i) => {
    let n = 0, r = 0, g = 0, bl = 0;
    for (let j = b.lo; j < b.hi; j++) { const k = keys[j]; n += cnt[k]; r += sr[k]; g += sg[k]; bl += sb[k]; }
    pal[i * 3] = Math.round(r / n); pal[i * 3 + 1] = Math.round(g / n); pal[i * 3 + 2] = Math.round(bl / n);
  });
  return { pal, size: boxes.length };
}

// ---- mapping ---------------------------------------------------------------------------------------------------------
function makeMapper(pal, size) {
  const cache = new Int16Array(32768).fill(-1);
  return (r, g, b) => {
    const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let v = cache[k];
    if (v < 0) {
      // measure from the 5:5:5 cell's centre so every pixel of the cell agrees and the cache is exact for it
      const cr = (r & 0xf8) | 4, cg = (g & 0xf8) | 4, cb = (b & 0xf8) | 4;
      let bd = Infinity;
      for (let i = 0; i < size; i++) {
        const dr = pal[i * 3] - cr, dg = pal[i * 3 + 1] - cg, db = pal[i * 3 + 2] - cb;
        const d = dr * dr * 3 + dg * dg * 4 + db * db * 2; // the eye weighs green most, then red, then blue
        if (d < bd) { bd = d; v = i; }
      }
      cache[k] = v;
    }
    return v;
  };
}

function indexFrame(px, w, h, map) {
  const out = new Uint8Array(w * h);
  for (let y = 0, o = 0, i = 0; y < h; y++) {
    for (let x = 0; x < w; x++, o++, i += 4) {
      const d = ((BAYER[((y & 3) << 2) | (x & 3)] - 7.5) / 7.5) * DITHER;
      const r = px[i] + d, g = px[i + 1] + d, b = px[i + 2] + d;
      out[o] = map(r < 0 ? 0 : r > 255 ? 255 : r | 0, g < 0 ? 0 : g > 255 ? 255 : g | 0, b < 0 ? 0 : b > 255 ? 255 : b | 0);
    }
  }
  return out;
}

// ---- LZW (min code size 8) -------------------------------------------------------------------------------------------
const gen = new Int32Array(4096 * 256); // dictionary entry valid iff gen[key] === stamp (clearing = bumping the stamp)
const val = new Int16Array(4096 * 256);
let stamp = 0;

function lzw(index) {
  const CLEAR = 256, EOI = 257;
  const out = [];
  let buf = 0, nbits = 0;
  const put = (code, size) => {
    buf |= code << nbits; nbits += size;
    while (nbits >= 8) { out.push(buf & 255); buf >>>= 8; nbits -= 8; }
  };
  let size = 9, next = 258;
  stamp++;
  put(CLEAR, size);
  let prefix = index[0];
  for (let i = 1; i < index.length; i++) {
    const k = index[i], key = prefix * 256 + k;
    if (gen[key] === stamp) { prefix = val[key]; continue; }
    put(prefix, size);
    if (next < 4096) {
      gen[key] = stamp; val[key] = next;
      if (next === (1 << size) && size < 12) size++;   // the code just added needs one more bit from the next emit on
      next++;
    } else {
      put(CLEAR, size);
      stamp++; size = 9; next = 258;
    }
    prefix = k;
  }
  put(prefix, size);
  put(EOI, size);
  if (nbits > 0) out.push(buf & 255);
  return out;
}

// ---- container -------------------------------------------------------------------------------------------------------
export async function encodeGif({ width, height, frames, delay = 8, onFrame }) {
  const { pal, size } = buildPalette(frames);
  const map = makeMapper(pal, size);
  const bytes = [];
  const u16 = (n) => bytes.push(n & 255, (n >> 8) & 255);
  const str = (s) => { for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i)); };
  str('GIF89a');
  u16(width); u16(height);
  bytes.push(0xf7, 0, 0); // global colour table, 8 bits of colour resolution, 256 entries (2^(7+1)); background 0; aspect 0
  for (let i = 0; i < 256 * 3; i++) bytes.push(pal[i] || 0);
  bytes.push(0x21, 0xff, 11); str('NETSCAPE2.0'); bytes.push(3, 1, 0, 0, 0); // loop forever
  for (let f = 0; f < frames.length; f++) {
    bytes.push(0x21, 0xf9, 4, 0x04, delay & 255, (delay >> 8) & 255, 0, 0); // GCE: disposal 1, no transparency
    bytes.push(0x2c); u16(0); u16(0); u16(width); u16(height); bytes.push(0);  // image descriptor: whole canvas, no local table
    bytes.push(8);                                                              // LZW minimum code size
    const data = lzw(indexFrame(frames[f], width, height, map));
    for (let i = 0; i < data.length; i += 255) {
      const n = Math.min(255, data.length - i);
      bytes.push(n);
      for (let j = 0; j < n; j++) bytes.push(data[i + j]);
    }
    bytes.push(0);
    if (onFrame) await onFrame(f + 1, frames.length);
  }
  bytes.push(0x3b);
  return Uint8Array.from(bytes);
}

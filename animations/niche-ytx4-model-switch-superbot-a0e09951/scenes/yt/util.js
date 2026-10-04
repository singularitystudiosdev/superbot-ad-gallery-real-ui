// Shared helpers for the ytx4 YouTube screens. Pure functions only (seek-safe).

const CSS_URL = new URL('./yt.css', import.meta.url).href;
const AD_BASE = new URL('../../', import.meta.url).href; // the ad folder (AD/)

let cssPromise = null;
export function ensureCss() {
  if (typeof document === 'undefined') return Promise.resolve();
  if (cssPromise) return cssPromise;
  let link = [...document.querySelectorAll('link[rel="stylesheet"]')].find((l) => l.href === CSS_URL);
  if (link && link.sheet) { cssPromise = Promise.resolve(); return cssPromise; }
  if (!link) {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_URL;
    document.head.appendChild(link);
  }
  cssPromise = new Promise((res) => { link.addEventListener('load', res, { once: true }); link.addEventListener('error', res, { once: true }); if (link.sheet) res(); });
  return cssPromise;
}

// Resolve: CSS loaded, every font face used, every <img> under root decoded (missing images resolve too,
// they fall back to the grey .yt-img background). Await this once before the first frame is captured.
export async function ytReady(root) {
  await ensureCss();
  if (document.fonts) {
    await Promise.all([
      document.fonts.load('400 14px "YT Roboto"'), document.fonts.load('500 14px "YT Roboto"'),
      document.fonts.load('700 14px "YT Roboto"'), document.fonts.load('600 25px "YT Sans Sub"'),
    ]).catch(() => {});
    await document.fonts.ready;
  }
  const imgs = root ? [...root.querySelectorAll('img')] : [];
  await Promise.all(imgs.map((i) => (i.complete ? Promise.resolve() : i.decode().catch(() => {}))));
}

export function assetUrl(p, base) {
  if (!p) return '';
  if (/^(https?:|data:|blob:|\/)/.test(p)) return p;
  return new URL(p, base || AD_BASE).href;
}

export const clamp01 = (x) => (x <= 0 || !Number.isFinite(x) ? 0 : x >= 1 ? 1 : x);
export const mix = (a, b, k) => a + (b - a) * k;
// cubic ease in-out
export const ease = (x) => { const t = clamp01(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOut = (x) => { const t = clamp01(x); return 1 - Math.pow(1 - t, 3); };
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const fmtInt = (n) => Math.round(n).toLocaleString('en-US');
// typed 0..1 -> leading characters (code points, so "²" and "°" never split)
export function typedSlice(text, typed) {
  const chars = Array.from(text || '');
  return chars.slice(0, Math.round(clamp01(typed) * chars.length)).join('');
}
// seconds -> "7:42" / "16:24"
export function fmtTime(sec) {
  const s = Math.max(0, Math.floor(sec + 1e-6));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

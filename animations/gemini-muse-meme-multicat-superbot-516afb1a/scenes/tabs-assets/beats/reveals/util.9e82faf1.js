// Helpers every reveal module shares (index.9e82faf1.js lists the modules). Nothing here knows a platform.
// A module's render(t) is a pure function of t: any noise it draws comes from hash(), a seeded integer hash, never
// Math.random, so a seek to t draws the same pixels whatever came before.

// integer hash -> [0, 1): deterministic noise for a (seed, cell) pair
export function hash(seed, i) {
  let n = Math.imul(seed + 1, 73856093) ^ Math.imul(i + 1, 19349663);
  n = Math.imul(n ^ (n >>> 15), 2246822519);
  n = Math.imul(n ^ (n >>> 13), 3266489917);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

// a module adds its CSS from its own JS, once, so a new platform is one file plus one line in the index
const added = new Set();
export function injectStyle(id, css) {
  if (added.has(id)) return;
  added.add(id);
  const s = document.createElement('style');
  s.dataset.reveal = id;
  s.textContent = css;
  document.head.appendChild(s);
}

// the font stacks every reveal draws in: the system UI face, never a platform's own
export const UI_FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
export const MONO_FONT = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

// a tile's crop as the CSS it rests in (transform exactly 'none' at zoom 1, so a landed tile carries no raster residue)
export const restTransform = (g) => (g.zoom === 1 ? 'none' : `scale(${g.zoom.toFixed(4)})`);
export const restFilter = (g) => g.grade || 'none';

// m:ss
export const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// the image URL a module draws its tiles from: its own cache entry, not the Default grid's. Two blocks that decode one
// resource at different sizes share Chromium's decoded copy, and the grid then rasterises a hair differently after a
// live switch through a reveal; a module-private URL keeps every block's pixels independent of the others
export const ownSrc = (src, id) => `${src}${src.includes('?') ? '&' : '?'}rv=${id}`;

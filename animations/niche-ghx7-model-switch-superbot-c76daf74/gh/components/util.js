// Shared helpers for the ghx7 GitHub (light) components. Pure string builders, no DOM, no timers.
import { oct } from '../icons.js';
export { oct };

// Image agent output lives in <AD>/img/ (avatar-<login>.png, issue-attachment-*.png). Resolved from this module so the
// components work from any document (ad index.html, ux/preview.html).
export const IMG_BASE = new URL('../../img/', import.meta.url).href;

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Avatar slot. src: explicit URL, else data.avatars[login], else IMG_BASE/avatar-<login>.png. A missing file falls back to
// the neutral placeholder background (never a drawn face). square: bots/orgs use GitHub's rounded-square avatar.
export function av(login, size = 20, opts = {}) {
  const { avatars = {}, square = false, cls = '' } = opts;
  if (login === 'superbot-gg[bot]' || login === 'superbot-gg') return sbAvatar(size, cls);
  const src = opts.src || avatars[login] || `${IMG_BASE}avatar-${login}.png`;
  return `<span class="gh-av${square ? ' gh-av--sq' : ''} ${cls}" data-avatar="${esc(login)}" style="--s:${size}px;--src:url('${esc(src)}')"></span>`;
}

let maskSeq = 0;
// superbot-gg[bot] avatar: the real superbot mark (assets/sb-mark-live.js MARK_SVG, static copy: no animation classes
// running) on a dark rounded-square tile, as GitHub shows an app/bot avatar.
export function sbAvatar(size = 20, cls = '') {
  const id = `ghx7-sbm-${++maskSeq}`;
  return `<span class="gh-av gh-av--sq gh-av--sb ${cls}" data-avatar="superbot-gg[bot]" style="--s:${size}px"><svg viewBox="0 0 100 100" aria-hidden="true"><defs><mask id="${id}" maskUnits="userSpaceOnUse" x="-30" y="-30" width="160" height="160"><g fill="white"><rect x="14" y="32" width="72" height="54" rx="15"/><path d="M14 46V28Q14 20 21 21Q28 24 36 32Z"/><path d="M86 46V28Q86 20 79 21Q72 24 64 32Z"/></g><g fill="black"><ellipse cx="35" cy="58" rx="8" ry="11"/><ellipse cx="65" cy="58" rx="8" ry="11"/></g></mask></defs><g transform="translate(14 14) scale(.72)"><rect x="-30" y="-30" width="160" height="160" fill="#00e5c3" mask="url(#${id})" transform="translate(-1.2 -1.2)"/><rect x="-30" y="-30" width="160" height="160" fill="#c026d3" mask="url(#${id})" transform="translate(1.2 1.2)"/><rect x="-30" y="-30" width="160" height="160" fill="#ececec" mask="url(#${id})"/></g></svg></span>`;
}

// GitHub label colours (repo labels): bg = label hex, text picked for contrast exactly like GitHub's light theme.
export const LABELS = {
  bug: '#d73a4a',
  auth: '#1d76db',
  'priority: high': '#b60205',
  frontend: '#c5def5',
  dependencies: '#0366d6',
  'good first issue': '#7057ff',
  enhancement: '#a2eeef',
  docs: '#0075ca',
  javascript: '#168700',
};
export function labelTok(name, color) {
  const hex = color || LABELS[name] || '#ededed';
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const light = (r * 299 + g * 587 + b * 114) / 1000 > 150;
  return `<span class="gh-label" style="background:${hex};color:${light ? '#1f2328' : '#fff'}">${esc(name)}</span>`;
}

export const counter = (n, cls = '') => `<span class="gh-counter ${cls}" data-count="${esc(n)}">${esc(n)}</span>`;
export const branch = (name) => `<span class="gh-branch">${esc(name)}</span>`;
export const btn = (label, { icon, primary, caret, sm, cls = '' } = {}) =>
  `<span class="gh-btn${primary ? ' gh-btn--primary' : ''}${sm ? ' gh-btn--sm' : ''} ${cls}">${icon ? oct(icon) : ''}${label ? `<span>${label}</span>` : ''}${caret ? oct('triangle-down', 16, 'gh-btn-caret') : ''}</span>`;

// Image slot: <img> when a URL is given (object-fit cover), neutral placeholder otherwise.
export function imgSlot(src, { w, h, alt = '', cls = '' } = {}) {
  const style = `${w ? `width:${w}px;` : ''}${h ? `height:${h}px;` : ''}`;
  return src
    ? `<span class="gh-img ${cls}" data-slot="image" style="${style}"><img src="${esc(src)}" alt="${esc(alt)}"></span>`
    : `<span class="gh-img gh-img--empty ${cls}" data-slot="image" style="${style}"></span>`;
}

// Job/check status icon. state: queued|in_progress|success|failure|skipped|pending.
// in_progress is GitHub's amber ring spinner, held still; rotate it with --spin on any ancestor (motion agent).
export function statusIcon(state, size = 16) {
  switch (state) {
    case 'success': return `<span class="gh-st gh-st--success">${oct('check-circle-fill', size)}</span>`;
    case 'failure': return `<span class="gh-st gh-st--failure">${oct('x-circle-fill', size)}</span>`;
    case 'skipped': return `<span class="gh-st gh-st--skipped">${oct('skip', size)}</span>`;
    case 'pending': return `<span class="gh-st gh-st--queued">${oct('clock', size)}</span>`;
    case 'in_progress':
      return `<span class="gh-st gh-st--progress"><svg class="gh-spinner" viewBox="0 0 16 16" width="${size}" height="${size}" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="2"/><path d="M8 1.5A6.5 6.5 0 0 1 14.5 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>`;
    default: return `<span class="gh-st gh-st--queued">${oct('dot-fill', size)}</span>`;
  }
}
// All five icons stacked; CSS shows the one matching the nearest [data-state]. Lets the motion agent flip states by
// attribute alone without re-rendering.
export const statusStack = (size = 16) => `<span class="gh-ststack">${['queued', 'in_progress', 'success', 'failure', 'skipped'].map((s) => `<span data-for="${s}">${statusIcon(s, size)}</span>`).join('')}</span>`;

// Diffstat squares (5) like GitHub: green/red/neutral blocks proportional to +/-.
export function diffstat(add, del, { text = true } = {}) {
  const tot = add + del || 1;
  let g = Math.round((add / tot) * 5), r = Math.round((del / tot) * 5);
  if (g + r > 5) r = 5 - g;
  const sq = [...Array(5)].map((_, i) => `<span class="gh-ds-sq ${i < g ? 'add' : i < g + r ? 'del' : ''}"></span>`).join('');
  return `<span class="gh-diffstat">${text ? `<span class="add">+${add}</span><span class="del">−${del}</span>` : ''}<span class="gh-ds-sqs">${sq}</span></span>`;
}

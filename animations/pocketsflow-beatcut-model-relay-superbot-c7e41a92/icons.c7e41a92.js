// Icon and brand-mark SVG strings. Lucide geometry for UI icons; Superbot, Gemini and DoorDash
// marks copied from superbot-desktop packages/ui/src/marks (mark-superbot / mark-gemini / mark-doordash).

const LUCIDE = {
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  filter: '<path d="M3 6h18M7 12h10M10 18h4"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  checks: '<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
  listChecks: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  bug: '<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>',
  panel: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98"/><path d="m15.41 6.51-6.82 3.98"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
  arrowUp: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  spin: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  comment: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  card: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  share2: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>',
};

export function icon(name, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24">${LUCIDE[name]}</svg>`;
}

const SB_FACE = 'M29 32H71A15 15 0 0 1 86 47V71A15 15 0 0 1 71 86H29A15 15 0 0 1 14 71V47A15 15 0 0 1 29 32ZM35 47a8 11 0 1 0 0 22a8 11 0 1 0 0-22ZM65 47a8 11 0 1 0 0 22a8 11 0 1 0 0-22Z';
const SB_EAR_L = 'M14 46V28Q14 20 21 21Q28 24 36 32Z';
const SB_EAR_R = 'M86 46V28Q86 20 79 21Q72 24 64 32Z';

/** The compact Superbot glyph (currentColor), as the sidebar and composer chip draw it. */
export function mascot(cls = 'mk') {
  return `<svg class="${cls}" viewBox="0 0 100 100" fill="currentColor"><path fill-rule="evenodd" d="${SB_FACE}"/><path d="${SB_EAR_L}"/><path d="${SB_EAR_R}"/></svg>`;
}

/** The full Superbot app mark: black ground, storm ring, duo-tone face. */
export function superbotMark(cls = 'mark') {
  const face = (fill, dx, dy) =>
    `<g transform="translate(${dx} ${dy})" fill="${fill}"><path fill-rule="evenodd" d="${SB_FACE}"/><path d="${SB_EAR_L}"/><path d="${SB_EAR_R}"/></g>`;
  return `<svg class="${cls}" viewBox="0 0 100 100"><defs><linearGradient id="sbStorm" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#00e5c3"/><stop offset=".25" stop-color="#2b6bff"/><stop offset=".5" stop-color="#6a1fd8"/><stop offset=".75" stop-color="#c026d3"/><stop offset="1" stop-color="#ff3d9a"/></linearGradient></defs>
<rect width="100" height="100" rx="22.5" fill="#000"/><rect x="1.37" y="1.37" width="97.26" height="97.26" rx="21.1" fill="none" stroke="url(#sbStorm)" stroke-width="2.73"/>
${face('#00e5c3', -1.2, -1.2)}${face('#c026d3', 1.2, 1.2)}${face('#ffffff', 0, 0)}</svg>`;
}

const GEMINI_STAR = 'M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81';
let geminiSeq = 0;

export function geminiMark(cls = 'mk') {
  const id = `gm${geminiSeq++}`;
  return `<svg class="${cls}" viewBox="0 0 24 24"><defs><linearGradient id="${id}" x1="-4" y1="22" x2="26" y2="4" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#439ddf"/><stop offset=".25" stop-color="#4f87ed"/><stop offset=".5" stop-color="#9476c5"/><stop offset=".75" stop-color="#bc688e"/><stop offset="1" stop-color="#d6645d"/></linearGradient></defs>
<path d="${GEMINI_STAR}" fill="url(#${id})"/></svg>`;
}

export const DOORDASH_D =
  'M23.071 8.409a6.09 6.09 0 00-5.396-3.228H.584A.589.589 0 00.17 6.184L3.894 9.93a1.752 1.752 0 001.242.516h12.049a1.554 1.554 0 11.031 3.108H8.91a.589.589 0 00-.415 1.003l3.725 3.747a1.75 1.75 0 001.242.516h3.757c4.887 0 8.584-5.225 5.852-10.413';

export function doordashMark(cls = 'mk', fill = '#FF3008') {
  return `<svg class="${cls}" viewBox="0 0 24 24"><path d="${DOORDASH_D}" fill="${fill}"/></svg>`;
}

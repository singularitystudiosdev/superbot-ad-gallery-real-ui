// Material Symbols (Google, Apache License 2.0) via the Iconify API, https://api.iconify.design/material-symbols.json,
// fetched 2026-10-03; path data verbatim (24 x 24). YouTube Studio's own UI icon family (outlined), for the Studio
// screen, the checklist, the Gemini card's like glyph and the Opus panel's comment glyph (ytv10: pruned to the glyphs
// this spot draws).
export const MS = {
  "menu": "<path fill=\"currentColor\" d=\"M3 18v-2h18v2zm0-5v-2h18v2zm0-5V6h18v2z\"/>",
  "comment-outline": "<path fill=\"currentColor\" d=\"M6 14h12v-2H6zm0-3h12V9H6zm0-3h12V6H6zm16 14l-4-4H4q-.825 0-1.412-.587T2 16V4q0-.825.588-1.412T4 2h16q.825 0 1.413.588T22 4zM4 16h14.85L20 17.125V4H4zm0 0V4z\"/>",
  "thumb-up-outline": "<path fill=\"currentColor\" d=\"M18 21H7V8l7-7l1.25 1.25q.175.175.288.475t.112.575v.35L14.55 8H21q.8 0 1.4.6T23 10v2q0 .175-.05.375t-.1.375l-3 7.05q-.225.5-.75.85T18 21m-9-2h9l3-7v-2h-9l1.35-5.5L9 8.85zM9 8.85V19zM7 8v2H4v9h3v2H2V8z\"/>",
  "favorite": "<path fill=\"currentColor\" d=\"m12 21l-1.45-1.3q-2.525-2.275-4.175-3.925T3.75 12.812T2.388 10.4T2 8.15Q2 5.8 3.575 4.225T7.5 2.65q1.3 0 2.475.55T12 4.75q.85-1 2.025-1.55t2.475-.55q2.35 0 3.925 1.575T22 8.15q0 1.15-.387 2.25t-1.363 2.412t-2.625 2.963T13.45 19.7z\"/>",
  "keep": "<path fill=\"currentColor\" d=\"m16 12l2 2v2h-5v6l-1 1l-1-1v-6H6v-2l2-2V5H7V3h10v2h-1z\"/>",
};
export const ms = (name, cls = '') => `<svg class="yt-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${MS[name]}</svg>`;

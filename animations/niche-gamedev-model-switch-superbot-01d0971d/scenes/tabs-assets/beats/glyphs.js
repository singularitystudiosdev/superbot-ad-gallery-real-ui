// The few UI glyphs the gamedev beats use. Octicons (GitHub, MIT License, github.com/primer/octicons), path data
// carried over verbatim from the github sibling's gh-icons.js (Iconify API https://api.iconify.design/octicon.json,
// fetched 2026-10-03), plus itch.io's own "Run game" play icon, copied verbatim from the live itch.io game page markup
// (https://k-ramstack.itch.io/leaftaker, fetched 2026-10-03: <svg class="svgicon icon_play"> a circle and a triangle,
// stroke currentColor). 16 px Octicons sit in a 16 x 16 box.
const P = (d) => `<path fill="currentColor" d="${d}"/>`;
export const OCT = {
  'check-circle-fill': P('M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16m3.78-9.72a.75.75 0 0 0-.018-1.042a.75.75 0 0 0-1.042-.018L6.75 9.19L5.28 7.72a.75.75 0 0 0-1.042.018a.75.75 0 0 0-.018 1.042l2 2a.75.75 0 0 0 1.06 0Z'),
  'check': P('M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 .018-1.042a.75.75 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0'),
  'git-branch': P('M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.5 2.5 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25m-6 0a.75.75 0 1 0 1.5 0a.75.75 0 0 0-1.5 0m8.25-.75a.75.75 0 1 0 0 1.5a.75.75 0 0 0 0-1.5M4.25 12a.75.75 0 1 0 0 1.5a.75.75 0 0 0 0-1.5'),
  'comment': P('M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.75.75 0 0 1 .53-.22h4.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z'),
  'play': P('M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0M1.5 8a6.5 6.5 0 1 0 13 0a6.5 6.5 0 0 0-13 0m4.879-2.773l4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215'),
  'repo-push': P('M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V1.5h-8a1 1 0 0 0-1 1v6.708A2.5 2.5 0 0 1 4.5 9h2.25a.75.75 0 0 1 0 1.5H4.5a1 1 0 0 0 0 2h4.75a.75.75 0 0 1 0 1.5H4.5A2.5 2.5 0 0 1 2 11.5Zm12.23 7.79l-1.224-1.224v6.184a.75.75 0 0 1-1.5 0V9.066L10.28 10.29a.75.75 0 0 1-1.06-1.061l2.505-2.504a.75.75 0 0 1 1.06 0L15.29 9.23a.75.75 0 0 1-.018 1.042a.75.75 0 0 1-1.042.018'),
  'person': P('M10.561 8.073a6 6 0 0 1 3.432 5.142a.75.75 0 1 1-1.498.07a4.5 4.5 0 0 0-8.99 0a.75.75 0 0 1-1.498-.07a6 6 0 0 1 3.431-5.142a3.999 3.999 0 1 1 5.123 0M10.5 5a2.5 2.5 0 1 0-5 0a2.5 2.5 0 0 0 5 0'),
  'file': P('M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013l-2.914-2.914z'),
};
export const oct = (name, cls = '') => `<svg class="gd-i ${cls}" viewBox="0 0 16 16" aria-hidden="true">${OCT[name]}</svg>`;
// itch.io's icon_play, verbatim attributes (the Run game button)
export const ITCH_PLAY = '<svg class="svgicon icon_play" stroke-linejoin="round" version="1.1" stroke-width="2" stroke="currentColor" stroke-linecap="round" role="img" height="24" viewBox="0 0 24 24" fill="none" width="24" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>';

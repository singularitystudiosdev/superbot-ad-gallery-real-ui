// scenes/yt/watch-icons.js: the YouTube desktop glyphs and the signed-in masthead shared by watch.js and posts.js
// (UX-B). 24 px viewBox outline/filled glyphs drawn after the shipping desktop set (watch page refs captured
// 2026-10-03, see /tmp/ytx7-bde6fd89/ux/sources-b.txt). Pure strings: no state, no timers.
//
// API
//   I.<name>               an inline <svg> string (fill currentColor) for every glyph used on the two screens
//   ytLogo()               the masthead YouTube logo (red play tile + wordmark)
//   mastheadHtml(avatar)   the signed-in desktop masthead (menu, logo, search box + search button, voice search,
//                          Create, notifications, account avatar); 56 px tall at design scale
import { esc } from '../../lib.js';

const svg = (d, vb = '0 0 24 24', extra = '') => `<svg viewBox="${vb}" aria-hidden="true" focusable="false"${extra}><path d="${d}"/></svg>`;

export const I = {
  menu: svg('M21 6H3V5h18v1zm0 5H3v1h18v-1zm0 6H3v1h18v-1z'),
  search: svg('M16.296 16.996a8 8 0 11.707-.708l3.909 3.91-.707.707-3.909-3.909zM18 11a7 7 0 00-14 0 7 7 0 1014 0z'),
  mic: svg('M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3zm2 9a2 2 0 01-4 0V6a2 2 0 014 0v6zm4-1h-1a5 5 0 01-10 0H6a6 6 0 005.5 5.98V21h1v-3.02A6 6 0 0018 11z'),
  create: svg('M20 12h-8v8h-1v-8H3v-1h8V3h1v8h8v1z'),
  bell: svg('M10 20h4c0 1.1-.9 2-2 2s-2-.9-2-2zm10-2.65V19H4v-1.65l2-1.88v-5.15C6 7.4 7.56 5.1 10 4.34v-.38c0-1.42 1.49-2.5 2.99-1.76.65.32 1.01 1.03 1.01 1.76v.39c2.44.75 4 3.06 4 5.98v5.15l2 1.87zm-1 .42-2-1.88v-5.47c0-2.47-1.19-4.36-3.13-5.1-1.26-.53-2.64-.5-3.84.03C8.15 6.11 7 7.99 7 10.42v5.47l-2 1.88V18h14v-.23z'),
  like: svg('M18.77 11h-4.23l1.52-4.94C16.38 5.03 15.54 4 14.38 4c-.58 0-1.14.24-1.52.65L7 11H3v10h4h1h9.43c1.06 0 1.98-.67 2.19-1.61l1.34-6C21.23 12.15 20.18 11 18.77 11zM7 20H4v-8h3V20zM19.98 13.17l-1.34 6C18.54 19.65 18.03 20 17.43 20H8v-8.61l5.6-6.06C13.79 5.12 14.08 5 14.38 5c.26 0 .5.11.63.3.07.1.15.26.09.47l-1.52 4.94L13.18 12h1.35h4.23c.41 0 .8.17 1.03.46.13.15.26.42.19.71z'),
  dislike: svg('M17 4h-1H6.57C5.5 4 4.59 4.67 4.38 5.61l-1.34 6C2.77 12.85 3.82 14 5.23 14h4.23l-1.52 4.94C7.62 19.97 8.46 21 9.62 21c.58 0 1.14-.24 1.52-.65L17 14h4V4H17zM10.4 19.67C10.21 19.88 9.92 20 9.62 20c-.26 0-.5-.11-.63-.3-.07-.1-.15-.26-.09-.47l1.52-4.94.4-1.29H9.46H5.23c-.41 0-.8-.17-1.03-.46-.12-.15-.25-.42-.18-.72l1.34-6C5.46 5.35 5.97 5 6.57 5H16v8.61L10.4 19.67zM20 13h-3V5h3V13z'),
  share: svg('M15 5.63 20.66 12 15 18.37V14h-1c-3.96 0-7.14 1-9.75 3.09 1.84-4.07 5.11-6.4 9.89-7.1l.86-.13V5.63M14 3v6C6.22 10.13 3.11 15.33 2 21c2.78-3.97 6.44-6 12-6v6l8-9-8-9z'),
  save: svg('M18 4v15.06l-5.48-3.04-.52-.29-.52.29L6 19.06V4h12m1-1H5v18l7-3.89L19 21V3z'),
  more: svg('M7.5 12c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm4.5-1.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm6 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z'),
  moreV: svg('M12 16.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zM10.5 12c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5-1.5.67-1.5 1.5zm0-6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5-1.5.67-1.5 1.5z'),
  sort: svg('M21 6H3V5h18v1zm-6 5H3v1h12v-1zm-6 6H3v1h6v-1z'),
  chevDown: svg('m18 9.28-6.35 6.35-6.37-6.35.72-.71 5.64 5.65 5.65-5.65z'),
  chevUp: svg('M18.4 14.6 12 8.3l-6.4 6.3.8.8L12 9.7l5.6 5.7z'),
  chevRight: svg('m9.4 18.4-.7-.7 5.6-5.6-5.7-5.7.7-.7 6.4 6.4z'),
  heart: svg('M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'),
  pin: svg('M16 11V3h1V2H7v1h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2zm1 3H7v-.59l1.71-1.71.29-.29V3h6v9.41l.29.29L17 13.41V14z'),
  comment: svg('M8 7h8v1H8V7zm0 4h8v-1H8v1zm11-7H5c-.55 0-1 .45-1 1v11c0 .55.45 1 1 1h11.59l3.71 3.71.7-.71V5c0-.55-.45-1-1-1zm0 14.59L17 16.59V16H5V5h14v13.59z'),
  // player controls (filled, white)
  play: svg('M8 5.14v13.72c0 .79.87 1.27 1.54.84l10.78-6.86a1 1 0 000-1.68L9.54 4.3C8.87 3.87 8 4.35 8 5.14z'),
  pause: svg('M7 5h3.5v14H7zM13.5 5H17v14h-3.5z'),
  next: svg('M6.5 6.85v10.3c0 .63.7 1.01 1.23.66l7.6-5.15a.8.8 0 000-1.32l-7.6-5.15c-.53-.35-1.23.03-1.23.66zM16.5 6h2v12h-2z'),
  volume: svg('M11 5.27 6.5 9H3v6h3.5l4.5 3.73V5.27zM14 8.2v7.6c1.48-.73 2.5-2.25 2.5-3.8s-1.02-3.07-2.5-3.8zm0-4.2v2.06c2.89.86 5 3.54 5 5.94s-2.11 5.08-5 5.94V20c4.01-.91 7-4.49 7-8s-2.99-7.09-7-8z'),
  cc: svg('M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm-8.5 10.25c-.33.6-1.1 1.25-2.25 1.25C6.5 15.5 5.5 14 5.5 12s1-3.5 2.75-3.5c1.15 0 1.92.65 2.25 1.25l-1.2.6c-.17-.33-.55-.6-1.05-.6-.85 0-1.25.95-1.25 2.25s.4 2.25 1.25 2.25c.5 0 .88-.27 1.05-.6l1.2.6zm7 0c-.33.6-1.1 1.25-2.25 1.25-1.75 0-2.75-1.5-2.75-3.5s1-3.5 2.75-3.5c1.15 0 1.92.65 2.25 1.25l-1.2.6c-.17-.33-.55-.6-1.05-.6-.85 0-1.25.95-1.25 2.25s.4 2.25 1.25 2.25c.5 0 .88-.27 1.05-.6l1.2.6z'),
  gear: svg('M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 00.12-.64l-2-3.46a.5.5 0 00-.61-.22l-2.49 1a7.3 7.3 0 00-1.69-.98l-.38-2.65A.49.49 0 0014 2h-4a.49.49 0 00-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.5.5 0 00-.61.22l-2 3.46a.49.49 0 00.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 00-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46a.5.5 0 00-.12-.64l-2.11-1.65zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z'),
  theater: svg('M19 6H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2zm0 10H5V8h14v8z'),
  full: svg('M13 4h7v7h-2V7.41l-4.29 4.3-1.42-1.42L16.59 6H13V4zM4 13h2v3.59l4.29-4.3 1.42 1.42L7.41 18H11v2H4v-7z'),
  // composer and guide
  image: svg('M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm1 16a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1h14a1 1 0 011 1v14zM8.5 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM14 12l-3.5 4.5-2-2.5L5 18h14l-5-6z'),
  imagePoll: svg('M3 4h8v8H3V4zm1 1v6h6V5H4zm9-1h8v8h-8V4zm1 1v6h6V5h-6zM3 14h8v6H3v-6zm1 1v4h6v-4H4zm9-1h8v6h-8v-6zm1 1v4h6v-4h-6z'),
  textPoll: svg('M4 5h16v1H4V5zm0 4h11v3H4V9zm1 1v1h9v-1H5zm-1 4h7v3H4v-3zm1 1v1h5v-1H5zm-1 4h16v1H4v-1z'),
  quiz: svg('M12 3a9 9 0 100 18 9 9 0 000-18zm0 17a8 8 0 110-16 8 8 0 010 16zm-.6-4.6h1.2V17h-1.2v-1.6zM12 7c-1.66 0-3 1.12-3 2.6h1.2c0-.83.8-1.5 1.8-1.5s1.8.67 1.8 1.5c0 1.6-2.4 1.45-2.4 4.2h1.2c0-2.1 2.4-2.3 2.4-4.2C15 8.12 13.66 7 12 7z'),
  video: svg('M10 8v8l6-4-6-4zm11-5v18H3V3h18zm-1 1H4v16h16V4z'),
  home: svg('M4 21V10.08l8-6.96 8 6.96V21h-6v-6h-4v6H4z'),
  shorts: svg('M10 14.65v-5.3L15 12l-5 2.65zm7.77-4.33c-.77-.32-1.2-.5-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.06-2.04 1.99-3.49-.07-1.42-.94-2.68-2.23-3.25zm-.23 5.86-8.5 4.5c-1.34.71-3.01.2-3.72-1.14-.71-1.34-.2-3.01 1.14-3.72l2.04-1.08v-1.21l-.69-.28-1.11-.46c-.99-.41-1.65-1.35-1.7-2.41-.05-1.06.52-2.06 1.46-2.56l8.5-4.5c1.34-.71 3.01-.2 3.72 1.14.71 1.34.2 3.01-1.14 3.72L15.5 9.26v1.21l1.8.74c.99.41 1.65 1.35 1.7 2.41.05 1.06-.52 2.06-1.46 2.56z'),
  subs: svg('M10 18v-6l5 3-5 3zm7-15H7v1h10V3zm3 3H4v1h16V6zm2 3H2v12h20V9zM3 10h18v10H3V10z'),
  you: svg('M4 20h14v1H3V6h1v14zM6 3v15h15V3H6zm2.02 14c.36-2.13 1.93-4.1 5.48-4.1s5.12 1.97 5.48 4.1H8.02zM11 8.5a2.5 2.5 0 015 0 2.5 2.5 0 01-5 0zm3.21 3.43A3.5 3.5 0 1012.79 12c-2.3.1-4.15.96-5.11 2.61V4h12v10.6c-.96-1.65-2.81-2.51-5.47-2.67z'),
  link: svg('M14 7h3a5 5 0 010 10h-3v-1h3a4 4 0 000-8h-3V7zM7 8a4 4 0 000 8h3v1H7A5 5 0 017 7h3v1H7zm1 3.5h8v1H8v-1z'),
  close: svg('m12.71 12 8.15 8.15-.71.71L12 12.71l-8.15 8.15-.71-.71L11.29 12 3.15 3.85l.71-.71L12 11.29l8.15-8.15.71.71L12.71 12z'),
  arrowDrop: svg('M7 10l5 5 5-5z'),
};

/** the masthead logo: red rounded play tile + "YouTube" wordmark (the shipping light-theme lock-up) */
export function ytLogo() {
  return `<span class="ytm-logo"><svg class="ytm-tile" viewBox="0 0 28 20" aria-hidden="true"><path fill="#FF0033" d="M27.97 3.12A3.5 3.5 0 0025.5.6C23.3 0 14 0 14 0S4.7 0 2.5.6A3.5 3.5 0 00.03 3.12C0 5.3 0 10 0 10s0 4.7.6 6.88A3.5 3.5 0 003.1 19.4c2.2.6 10.9.6 10.9.6s9.3 0 11.5-.6a3.5 3.5 0 002.47-2.52C28 14.7 28 10 28 10s0-4.7-.03-6.88z"/><path fill="#fff" d="M11.2 14.28 18.47 10 11.2 5.72v8.56z"/></svg><b class="ytm-word">YouTube</b></span>`;
}

const SIGNIN_ICON = svg('M12 1C5.92 1 1 5.92 1 12s4.92 11 11 11 11-4.92 11-11S18.08 1 12 1zm0 1c5.52 0 10 4.48 10 10 0 2.33-.8 4.47-2.14 6.17-1.3-1.56-4.4-2.42-7.86-2.42s-6.56.86-7.86 2.42A9.95 9.95 0 012 12C2 6.48 6.48 2 12 2zm0 3.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm0 1a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM12 16.75c3.1 0 5.73.76 6.93 2.15A9.96 9.96 0 0112 22a9.96 9.96 0 01-6.93-3.1c1.2-1.39 3.83-2.15 6.93-2.15z');

/** mastheadHtml(avatarUrl) -> the desktop masthead (56 px design height). With an avatar: signed in as that channel
 *  (Create, notifications, account avatar). Without: the public signed-out masthead (settings kebab, Sign in). */
export function mastheadHtml(avatar) {
  const end = avatar
    ? `<span class="ytm-create">${I.create}<b>Create</b></span><span class="ytm-ib ytm-bell">${I.bell}</span><img class="ytm-av" src="${esc(avatar)}" alt="">`
    : `<span class="ytm-ib">${I.moreV}</span><span class="ytm-signin">${SIGNIN_ICON}<b>Sign in</b></span>`;
  return `<div class="ytm-mast">
    <div class="ytm-start"><span class="ytm-ib">${I.menu}</span>${ytLogo()}</div>
    <div class="ytm-center"><div class="ytm-search"><span class="ytm-ph">Search</span></div><span class="ytm-sbtn">${I.search}</span><span class="ytm-voice">${I.mic}</span></div>
    <div class="ytm-end">${end}</div>
  </div>`;
}

/** the default avatar a signed-out viewer sees beside "Add a comment..." */
export const GUEST_AVATAR = `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="20" fill="#7b9ee8"/><circle cx="20" cy="15.5" r="6.5" fill="#fff" opacity=".9"/><path d="M8 32c2.4-5 6.8-7.5 12-7.5S29.6 27 32 32a16 16 0 01-24 0z" fill="#fff" opacity=".9"/></svg>`;

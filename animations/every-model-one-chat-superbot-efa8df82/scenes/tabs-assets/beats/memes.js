// The five Muse memes the scrape turns up (beats/scrape.js makes them, beats/post.js and beats/xpost.js post them).
// The stills are frames of the official trailer (img/tsn-*.jpg, see img/CREDITS.txt); the captions are set over
// them here.
export const MEMES = [
  { img: 'tsn-1.jpg', cap: 'me texting Muse at 3am', title: 'me texting Muse at 3am' },
  { img: 'tsn-2.jpg', cap: 'A million users isn’t cool. You know what’s cool? Muse.', title: 'You know what’s cool? Muse.' },
  { img: 'tsn-3.jpg', cap: '40 unread from Muse. mid deposition.', title: '40 unread from Muse, mid deposition' },
  { img: 'tsn-4.jpg', cap: 'the group chat finding out I have Muse', title: 'the group chat finding out I have Muse' },
  { img: 'tsn-5.jpg', cap: '“You built what?” “Muse.”', title: '“You built what?” “Muse.”' },
];

export const memeHTML = (x, m, cls = '') => `<span class="mm ${cls}"><span class="mm-cap">${x.esc(m.cap)}</span><span class="mm-pic"><img src="${x.img(m.img)}" alt=""/></span></span>`;

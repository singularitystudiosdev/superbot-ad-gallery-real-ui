// The story's copy, in one place so every surface agrees: the superbot thread, Google's consent popup and the
// YouTube Studio page all read the same people, numbers and replies. The channel and its viewers are fictional.

export const ASK = 'Reply to the top comments on my latest video';

export const VIDEO = {
  title: 'I tested 12 budget mics under $100',
  length: '14:21',
  seconds: 861,
  comments: '1,284',
  commentCount: 1284,
  id: 'Xk3mP9qL2aE',
};

// handles checked free on youtube.com (404) on 2026-10-05 so no real channel is named; no email address is shown
// anywhere (Google's account chip carries the name), same privacy line as the base ad
export const CREATOR = { name: 'Sam Rivera', handle: '@samrivera.mics' };

// ranked by DeepSeek V4: the three repeated questions carry the repeat count (214 + 96 + 61 = the 371 it grouped),
// the two one-off comments carry their likes
export const TOP = [
  { who: 'Priya', handle: '@priyanair2291', color: '#ef6c00', text: 'Which one would you get for an untreated bedroom?', badge: '214 asked this', likes: '482', when: '1 day ago' },
  { who: 'Lena', handle: '@lenafischer5730', color: '#7b1fa2', text: 'What boom arm is that at 4:38?', badge: '96 asked this', likes: '156', when: '1 day ago' },
  { who: 'Marco', handle: '@marco.ruiz.81', color: '#0097a7', text: 'The blind test at 6:12 got me. I was sure B was the expensive one.', badge: '1.1K likes', likes: '1.1K', when: '2 days ago' },
  { who: 'Dee', handle: '@deeokafor_', color: '#c2185b', text: 'Do budget headsets next please', badge: '870 likes', likes: '870', when: '2 days ago' },
  { who: 'Tom', handle: '@tomhale4417', color: '#2e7d32', text: 'USB or XLR for someone just starting?', badge: '61 asked this', likes: '97', when: '2 days ago' },
];
export const REPEATS = 371;

// what Gemini 3.1 Pro found in the video, each tied to the comment that asked about it (frames in img/)
export const MOMENTS = [
  { at: 278, ts: '4:38', what: 'Boom arm in shot', for: '@lenafischer5730', img: 'img/f438.jpg' },
  { at: 372, ts: '6:12', what: 'Blind test reveal: B is the $34 mic', for: '@marco.ruiz.81', img: 'img/f612.jpg' },
  { at: 580, ts: '9:40', what: 'Room test winner: #7, a dynamic', for: '@priyanair2291', img: 'img/f940.jpg' },
];

// Claude Opus 5.5's replies, in the creator's voice, built on what Gemini found (same order as TOP)
export const REPLIES = [
  'The #7 dynamic. It ignored my echoey room in the 9:40 test, nothing else came close.',
  "It's a low-profile arm that sits under the screen. Linked it in the description!",
  "Same! B was the $34 mic. That's the whole video in one clip.",
  'Already filming it. Six headsets, same tests.',
  'USB. Plug it in and record today, move to XLR later if you want.',
];

// the models and the service, with the real superbot tile art (brand/tile-*, from the desktop app's marks/tiles)
export const MODELS = {
  superbot: { label: 'superbot', tile: null },
  deepseek: { label: 'DeepSeek V4', tile: 'brand/tile-deepseek.svg' },
  gemini: { label: 'Gemini 3.1 Pro', tile: 'brand/tile-gemini.png' },
  claude: { label: 'Claude Opus 5.5', tile: 'brand/tile-claude.png' },
  youtube: { label: 'YouTube', tile: 'brand/tile-youtube.png' },
};

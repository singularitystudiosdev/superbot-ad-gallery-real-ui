// The one story every beat tells, in one place so the numbers agree from the first card to the last frame: Sam's
// video, the 1,284 comments GPT-6 Luna sorts, the two answers Gemini 3.1 Pro finds in the video, the five replies Claude
// Opus 5.5 writes, and the order YouTube lists the comments in. Every person and number here is made up for the spot.
const img = (f) => new URL('../../../img/' + f, import.meta.url).href;

export const VIDEO = {
  title: 'I tested 12 budget mics under $100', len: '14:32', lenS: 14 * 60 + 32,
  views: '248K views', age: '3 days ago', likes: '12K', thumb: img('thumb.jpg'), frame: img('mic-frame.jpg'),
  desc: 'Twelve mics, one untreated bedroom, a blind test and a room echo test. Every mic in this video was bought with my own money.',
};
export const SAM = { name: 'Sam Rivera', handle: '@samrivera', subs: '412K subscribers', avatar: img('av-sam.jpg') };
export const TOTAL = 1284;

// the five comments superbot answers, in Luna's priority order. av: a photo, or YouTube's default letter avatar (c, l)
export const COMMENTS = [
  { key: 'priya', handle: '@priyanair', text: 'Which one would you actually buy for a small untreated room?', likes: '1.1K', age: '2 days ago', tag: 'Asked 214×', video: true, c: '#00897b', l: 'P' },
  { key: 'lena', handle: '@lenafischer', text: 'What\'s that boom arm at 4:38? Looks so clean on the desk.', likes: '1.5K', age: '2 days ago', tag: 'Asked 61×', video: true, c: '#1967d2', l: 'L' },
  { key: 'marco', handle: '@marcoruiz', text: 'The blind test at 6:12 got me. Picked the $29 one every single time.', likes: '2.4K', age: '3 days ago', tag: 'Praise', av: img('av-marco.jpg') },
  { key: 'dee', handle: '@deeokafor', text: 'Headsets next please, half of us stream on them', likes: '742', age: '1 day ago', tag: 'Asked 48×', c: '#9334e6', l: 'D' },
  { key: 'tom', handle: '@tomhale', text: 'Didn\'t expect the USB one to beat the XLR ones. Great video.', likes: '1.3K', age: '3 days ago', tag: 'Praise', av: img('av-tom.jpg') },
];
export const byKey = Object.fromEntries(COMMENTS.map((c) => [c.key, c]));

// what Gemini finds in the video (picture and sound: Sam names the arm out loud at 4:38), in playhead order: the frame,
// the timestamp and the answer it hands Opus
export const MOMENTS = [
  { at: 4 * 60 + 38, ts: '4:38', for: 'lena', frame: img('at-438.jpg'), q: 'For Lena: the boom arm', a: 'You name it at 4:38: the $39 LP-1 low-profile arm' },
  { at: 7 * 60 + 5, ts: '7:05', for: 'priya', frame: img('at-705.jpg'), q: 'For Priya: a mic for an untreated room', a: 'Room echo test at 7:05: the $49 dynamic wins' },
];

// the replies Opus writes as Sam (replies.md in its panel). Priya's uses Gemini's 7:05, Lena's the arm Gemini heard at 4:38
export const REPLIES = {
  priya: 'The $49 dynamic. It ignores most of the room echo, you can hear it side by side at 7:05.',
  lena: 'It\'s the $39 LP-1 low-profile arm. I hang the mic underneath so it stays out of the shot.',
  marco: 'My editor fell for the $29 one too. It\'s the sleeper of the whole video.',
  dee: 'Headsets are already on the list. They\'re next.',
  tom: 'Same here, the USB one surprised me most.',
};
export const PIN = 'priya';
// the threads superbot leaves open at the end, so both video answers read on the page: the pin, then Lena's
export const OPEN = ['priya', 'lena'];

// YouTube's "Top comments" order before the pin (by likes): Priya's question sits fourth until Sam pins it
export const YT_ORDER = ['marco', 'lena', 'tom', 'priya', 'dee'];

// the watch page's sidebar: [thumbnail, title, channel, verified, views, age, length]
export const SIDEBAR = [
  ['r01', 'Is a $400 mic worth it? I tested it against a $49 one', 'Sam Rivera', true, '1.2M', '8mo ago', '16:08'],
  ['r02', 'Best Podcast Mics in 2026: Every Budget Tested', 'Audio Bench', true, '389K', '2mo ago', '21:44'],
  ['r03', 'I treated my room for $50 (before and after)', 'Sam Rivera', true, '640K', '1y ago', '11:57'],
  ['r04', 'USB vs XLR: which one should you actually buy?', 'Desk Theory', false, '212K', '5mo ago', '13:20'],
  ['r05', 'Streaming headsets ranked from worst to best', 'Clipline', true, '1.8M', '3mo ago', '24:03'],
  ['r06', 'My $300 YouTube desk setup (full tour)', 'Sam Rivera', true, '930K', '6mo ago', '9:41'],
  ['r07', 'Why your mic sounds bad (it\'s not the mic)', 'Mixdown Mike', false, '2.4M', '2y ago', '12:19'],
  ['r08', 'Boom arms under $100, tested on a real desk', 'Desk Theory', false, '77K', '3wk ago', '10:02'],
  ['r09', 'Lav mics for YouTube: I tested 8 of them', 'Audio Bench', true, '154K', '9mo ago', '18:30'],
  ['r10', 'The cheapest mic that sounds expensive', 'Mixdown Mike', false, '3.1M', '1y ago', '8:55'],
  ['r11', 'How I edit my voice in 5 minutes', 'Sam Rivera', true, '410K', '4mo ago', '7:12'],
  ['r12', 'Audio interfaces for beginners (2026)', 'Clipline', true, '98K', '1mo ago', '15:47'],
].map(([id, title, ch, ver, views, age, len]) => ({ thumb: img(`side/${id}.jpg`), title, ch, ver, views, age, len }));

// a YouTube avatar: the photo, or the default letter avatar on its colour
export const avatar = (c, cls) => (c.av
  ? `<img class="${cls}" src="${c.av}" alt=""/>`
  : `<span class="${cls} yl" style="--c: ${c.c}">${c.l}</span>`);
// comment text as YouTube renders it: timestamps become blue links
export const linkTimes = (s, esc) => esc(s).replace(/\b(\d{1,2}:\d{2})\b/g, '<a class="yts">$1</a>');

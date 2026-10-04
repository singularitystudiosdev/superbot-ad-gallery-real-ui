// The one script every beat reads, so the four hand-offs tell one story about one ask ("Answer the top comments on my
// latest video and pin the best one"). Each model's switch does one clause of it, in order:
//   Gemini (beats/rank.js)            finds the top comments and the moment in the video that answers each one
//   Claude Opus 5.5 (beats/drafts.js) answers them in the creator's voice, each reply pointing at its moment
//   GPT-6 Astra (beats/pick.js)       scores the top five and picks the one to pin
//   YouTube Studio (beats/studio.js)  posts the replies, hearts the comments and pins the pick
// Image paths are relative to the ad's img/ folder (pass them through x.img()). All numbers here are the ad's own
// fiction and are the only source for any figure a beat shows.

export const OWNER = { name: 'Sam Rivera', handle: '@samrivera.audio', initial: 'S', color: '#c2410c' };

export const VIDEO = {
  title: 'I tested 12 budget mics under $100',
  len: '14:32',
  lenS: 14 * 60 + 32,
  views: '48K views',
  age: '2 days ago',
  thumb: 'thumb.jpg', // 1280x720, the video's own thumbnail
};

export const TOTAL = 1284; // comments on the video

// what the 1,284 comments are, by kind (sums to TOTAL)
export const MIX = [
  { kind: 'Questions', n: 412 },
  { kind: 'Praise', n: 538 },
  { kind: 'Requests', n: 196 },
  { kind: 'Other', n: 138 },
];

// the moments in the video that answer the questions (frames are 640x360 stills from the video)
export const MOMENTS = {
  '4:38': { s: 278, label: 'Desk setup', img: 'at-438.jpg' },
  '6:12': { s: 372, label: 'Blind test', img: 'at-612.jpg' },
  '7:05': { s: 425, label: 'Room echo test', img: 'at-705.jpg' },
};
// chapter marks on the 14:32 bar (seconds)
export const CHAPTERS = [118, 278, 372, 425, 640];

// the ranked top five, by likes and repeats. `repeats` = how many other comments ask the same thing;
// `at` = the moment that answers it (null when the video does not need to answer it)
export const TOP = [
  { name: 'Priya Nair', text: 'Which one would you actually buy for a small untreated room?', likes: '2.1K', kind: 'Question', repeats: 214, at: '7:05', color: '#00897b' },
  { name: 'Marco Ruiz', text: 'The blind test at 6:12 got me. Picked the $29 one every single time.', likes: '1.4K', kind: 'Praise', repeats: 0, at: '6:12', color: '#e8710a' },
  { name: 'Lena Fischer', text: 'What\'s that boom arm at 4:38? Looks so clean on the desk.', likes: '986', kind: 'Question', repeats: 131, at: '4:38', color: '#1967d2' },
  { name: 'Dee Okafor', text: 'Headsets next please, half of us stream on them', likes: '742', kind: 'Request', repeats: 96, at: null, color: '#9334e6' },
  { name: 'Tom Hale', text: 'Didn\'t expect the USB one to beat the XLR ones. Great video.', likes: '515', kind: 'Praise', repeats: 0, at: null, color: '#d01884' },
];

// what the creator's past replies sound like, learned before Opus writes (shown as Opus's voice profile)
export const VOICE = {
  sample: 200, // replies read
  traits: ['1 to 2 sentences', 'No emojis', 'Names the timestamp'],
  avgWords: 17,
};

// the reply to each TOP entry, same order. `at` marks the timestamp inside the text (YouTube renders it as a link)
export const REPLIES = [
  { to: 'Priya', text: 'The $49 dynamic. It ignores most of the room echo, you can hear it side by side at 7:05.', at: '7:05' },
  { to: 'Marco', text: 'My editor fell for the $29 one too. It\'s the sleeper of the whole video.', at: null },
  { to: 'Lena', text: 'Low-profile boom arm, mic mounted underneath. It\'s at 4:38 and linked in the description.', at: '4:38' },
  { to: 'Dee', text: 'Headsets are already on the list. They\'re next.', at: null },
  { to: 'Tom', text: 'Same here, the USB one surprised me most.', at: null },
];

// the pin decision: three criteria, each 0..100, weighted into the total (same order as TOP). reach = likes / 2.1K,
// repeats = repeats / 214, answered = how directly the reply settles it. total = round(.4 reach + .35 repeats + .25 answered)
export const PIN = {
  criteria: [
    { key: 'reach', label: 'Reach', weight: 0.4 },
    { key: 'repeats', label: 'Asked again', weight: 0.35 },
    { key: 'answered', label: 'Answered in video', weight: 0.25 },
  ],
  scores: [
    { reach: 100, repeats: 100, answered: 92, total: 98 },
    { reach: 67, repeats: 0, answered: 80, total: 47 },
    { reach: 47, repeats: 61, answered: 100, total: 65 },
    { reach: 35, repeats: 45, answered: 0, total: 30 },
    { reach: 25, repeats: 0, answered: 0, total: 10 },
  ],
  winner: 0,
  why: 'Pin Priya\'s question: 214 people asked it, one reply answers them all',
};

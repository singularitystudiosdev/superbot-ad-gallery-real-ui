// ytx4 story data, transcribed verbatim from the binding story spec
// (/tmp/ytx4-work.4613766c/story-spec.4613766c.md). Import from here; never retype.
// Image paths are relative to the ad folder (AD/), so callers resolve them against their own base.

export const creator = {
  name: 'Noa Builds',
  person: 'Noa',
  handle: '@noabuilds',
  subscribers: 412000,
  subscribersLabel: '412K subscribers',
  avatar: 'img/avatars/noa.jpg',
};

export const video = {
  title: 'I turned a 9 m² closet into my dream studio',
  length: '16:24',
  durationSec: 16 * 60 + 24,
  views: 182000,
  viewsLabel: '182K views',
  age: '2 days ago',
  likes: 9800,
  likesLabel: '9.8K',
  commentCount: 1284,
  commentCountLabel: '1,284',
  thumb: 'img/thumb/latest-video.jpg',
};

// [startSec, title]
export const chapters = [
  { t: 0, label: '0:00', title: 'Intro' },
  { t: 72, label: '1:12', title: 'Emptying the closet' },
  { t: 250, label: '4:10', title: 'Door rail' },
  { t: 450, label: '7:30', title: 'Lighting the shelf' },
  { t: 570, label: '9:30', title: 'Acoustic panels' },
  { t: 665, label: '11:05', title: 'Cooling' },
  { t: 880, label: '14:40', title: 'Final tour' },
];

export const askedTime = { sec: 462, label: '7:42', chapter: 'Lighting the shelf' };

export const frameRead = {
  timeSec: 462,
  label: 'Amaran 60x S in a lantern softbox on the top shelf',
};

// sentiment: 'question' | 'love' | 'critique' | 'spam'  (bucket keys match the state.filter keys below)
export const comments = [
  { id: 'c1', handle: '@danokafor', time: '3 hours ago', sentiment: 'question', likes: '2.1K', avatar: 'img/avatars/a01.jpg',
    text: "What's the light at 7:42? The glow on that shelf is unreal" },
  { id: 'c2', handle: '@priya.makes', time: '5 hours ago', sentiment: 'love', likes: '1.4K', avatar: 'img/avatars/a02.jpg',
    text: 'The door rail trick at 4:10 saved my tiny apartment setup. Thank you!!' },
  { id: 'c3', handle: '@jonah.records', time: '6 hours ago', sentiment: 'critique', likes: '612', avatar: 'img/avatars/a03.jpg',
    text: 'Great build but the fan hum at 11:05 is rough on headphones' },
  { id: 'c4', handle: '@leafandlens', time: '2 hours ago', sentiment: 'question', likes: '488', avatar: 'img/avatars/a04.jpg',
    text: 'How do you keep a closet this small from overheating with the PC in there?' },
  { id: 'c5', handle: '@mira_cuts', time: '4 hours ago', sentiment: 'love', likes: '356', avatar: 'img/avatars/a05.jpg',
    text: '9 m² and it looks bigger than my living room. Instant sub' },
  { id: 'c6', handle: '@tobyfixesthings', time: '7 hours ago', sentiment: 'question', likes: '301', avatar: 'img/avatars/a06.jpg',
    text: 'Is the desk custom or an IKEA hack? Need the plans' },
  { id: 'c7', handle: '@samwise.audio', time: '1 hour ago', sentiment: 'love', likes: '244', avatar: 'img/avatars/a07.jpg',
    text: 'The acoustic panel layout at 9:30 is genuinely smart' },
  { id: 'c8', handle: '@kc.studios', time: '8 hours ago', sentiment: 'critique', likes: '190', avatar: 'img/avatars/a08.jpg',
    text: 'Would love a cost breakdown on screen next time' },
  { id: 'c9', handle: '@gearwins.daily', time: '1 hour ago', sentiment: 'spam', likes: '0', avatar: 'img/avatars/a09.jpg',
    text: 'Free mic giveaway on my channel, first 100 only' },
  { id: 'c10', handle: '@rowan.builds', time: '9 hours ago', sentiment: 'love', likes: '97', avatar: 'img/avatars/a10.jpg',
    text: 'Watching this from my own closet studio lol' },
];

export const commentById = Object.fromEntries(comments.map((c) => [c.id, c]));

// Grok's sentiment buckets (sum 1,284). Keys are the studio state.filter / state.counts keys.
export const sentimentCounts = { love: 912, questions: 214, critique: 131, spam: 27 };
export const sentimentBuckets = [
  { key: 'love', label: 'Love', sentiment: 'love' },
  { key: 'questions', label: 'Questions', sentiment: 'question' },
  { key: 'critique', label: 'Critique', sentiment: 'critique' },
  { key: 'spam', label: 'Spam', sentiment: 'spam' },
];
export const bucketOf = { question: 'questions', love: 'love', critique: 'critique', spam: 'spam' };

// Opus 5.5 writes these in Noa's voice; superbot posts them as @noabuilds with the creator badge.
export const replies = {
  c1: 'Amaran 60x S in a lantern softbox on the top shelf, dimmed to 20%. Whole kit is linked in the description!',
  c2: 'Priya!! That rail took me three tries. So happy it worked in your place',
  c3: 'Fair, that hum bugged me too. Swapped in a quieter fan right after filming',
  c4: 'Door vent plus a 120 mm intake fan. It stays around 24°C even on long renders',
};
export const replyOrder = ['c1', 'c2', 'c3', 'c4'];

export const pinnedId = 'c1';
export const pinnedLabel = 'Pinned by @noabuilds';
export const heartedIds = ['c1', 'c2'];

// Baton stamps (for the build worker; not YouTube UI).
export const stamps = {
  grok: 'Sorted 1,284 comments',
  gemini: 'Read the frame at 7:42',
  opus: '4 replies written',
  superbot: 'Posted and pinned',
};

export const ask = 'Answer the top comments on my latest video and pin the best one';

const data = { creator, video, chapters, askedTime, frameRead, comments, commentById, sentimentCounts,
  sentimentBuckets, bucketOf, replies, replyOrder, pinnedId, pinnedLabel, heartedIds, stamps, ask };
export default data;

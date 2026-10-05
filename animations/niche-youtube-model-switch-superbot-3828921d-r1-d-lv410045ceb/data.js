// What the spot says. Same creator as the source spot (Sam Rivera, budget streaming gear; he reviewed mics last), a
// different chore he does by hand on every upload day: filling in YouTube Studio's upload dialog.
// One ask, four hand-offs, each one making the part of the upload it is best at:
// Gemini 3.1 Pro watches the whole file (video-native) and writes the chapters and picks the thumbnail frame;
// Claude Opus 5.5 writes the title and description in Sam's voice with those chapters; Nano Banana Pro (Google's
// Gemini 3 Pro Image) turns the picked frame into the thumbnail; superbot's YouTube Studio connection reads when his
// viewers are on YouTube (Analytics) and walks Studio's own upload flow to schedule it.
export const ASK_LINES = ['Upload this to YouTube: title, chapters, thumbnail,', 'and schedule it for when my viewers are online'];
export const ASK = ASK_LINES.join(' ');

export const FILE = { name: 'headphones-final-v3.mp4', meta: 'Video · 18:42 · 3.1 GB', poster: 'img/ch-intro.jpg' };   // the video's own 0:00 frame, the same everywhere it shows

export const VIDEO = {
  title: 'I tested budget headphones for streaming',
  length: '18:42', lengthS: 1122,
  channel: 'Sam Rivera', link: 'https://youtu.be/q7Hd2xL9vRk',
};

// YouTube's chapter rules: the first at 0:00, at least three, each at least 10 s long
export const CHAPTERS = [
  { s: 0, at: '0:00', name: 'Intro', img: 'img/ch-intro.jpg' },
  { s: 70, at: '1:10', name: 'The lineup', img: 'img/ch-lineup.jpg' },
  { s: 262, at: '4:22', name: 'Blind sound test', img: 'img/ch-mictest.jpg' },
  { s: 588, at: '9:48', name: 'Comfort after 4 hours', img: 'img/ch-comfort.jpg' },
  { s: 845, at: '14:05', name: 'The $29 winner', img: 'img/frame-1431.jpg' },
  { s: 1010, at: '16:50', name: 'Which one to buy', img: 'img/ch-buy.jpg' },
];
export const THUMB_FRAME = { s: 871, at: '14:31', img: 'img/frame-1431.jpg' };

// details.md as Claude writes it: the title, two lines in Sam's voice, then Gemini's chapters
export const DETAILS = [
  `Title: ${VIDEO.title}`,
  'Description:',
  'I streamed with every pair under $60 for a week.',
  'The $29 pair beat ones that cost twice as much.',
  '',
  ...CHAPTERS.map((c) => `${c.at} ${c.name}`),
];
export const DESCRIPTION = DETAILS.slice(2);
export const DETAILS_DONE = `${VIDEO.title.length}/100 title · 6 chapters, first at 0:00`;

export const THUMB = { img: 'img/thumb.jpg', spec: '1280×720 JPG · 1.4 MB' };

// Thursday Oct 8, 2026, an hour before the 5 PM peak, so the video is processed and indexed when the audience arrives
export const SCHEDULE = { date: 'Oct 8, 2026', day: 8, time: '4:00 PM', long: 'October 8, 2026 at 4:00 PM', uploaded: 'Uploaded Oct 5, 2026' };

export const POSTED = [
  { icon: 'avatar', text: 'Connected as <b>Sam Rivera</b>' },
  { icon: 'chart', text: 'Viewers peak <b>Thu 5 PM</b> · live at <b>4 PM</b>, an hour early' },
  { icon: 'youtube', text: 'Starting the upload…', done: 'Upload started' },
];

// Google's consent strings for the two scopes the upload needs, verbatim from
// https://developers.google.com/identity/protocols/oauth2/scopes (fetched 2026-10-05): youtube.upload, yt-analytics.readonly
export const ACCOUNT = 'Sam Rivera';
export const EMAIL = 'sam.rivera.reviews@gmail.com';
export const SCOPES = ['Manage your YouTube videos', 'View YouTube Analytics reports for your YouTube content'];

// the one-line summary under each model header, as the real app writes it
export const SAY = {
  gemini: 'Watching all 18:42 to write the chapters and pick the thumbnail frame.',
  geminiDone: 'Watched all 18:42, wrote 6 chapters and picked the thumbnail frame.',
  claude: 'Writing the title and description in your voice, chapters included…',
  claudeDone: 'Wrote the title and description in your voice, chapters included.',
  banana: 'Making the thumbnail from the 14:31 frame…',
  bananaDone: 'Made the thumbnail from the 14:31 frame.',
  youtube: 'Uploading from your own YouTube Studio, as you.',
};

export const MODELS = {
  gemini: { name: 'Gemini 3.1 Pro', icon: 'brand/gemini.svg' },
  claude: { name: 'Claude Opus 5.5', icon: 'brand/claude.svg' },
  banana: { name: 'Nano Banana Pro', emoji: '🍌' },   // Google's Gemini image model (Gemini 3 Pro Image), shown with its banana
  youtube: { name: 'YouTube Studio', icon: 'brand/youtube-icon.svg' },
};

// The facts of the spot, in one place, so every scene says the same thing: the file Sam attaches, its 7 chapters, the
// title / description / tags Opus writes, the 6:41 thumbnail Astra picks, and the slot superbot schedules in YouTube
// Studio. Every person, channel, product and price is made up for the spot. Counters are computed from the strings
// themselves (the title is 49 characters, the tags 224 of 500 as Studio counts them, comma-joined), never typed in.
export const CHANNEL = 'Sam Rivera';
export const FILE = { name: 'desk-tour-2026.mp4', base: 'desk-tour-2026', len: '16:08', secs: 16 * 60 + 8, size: '2.41 GB' };

// [start in seconds, label]: every chapter is 72 s or longer, the first starts at 0:00
export const CHAPTERS = [
  [0, 'The $89 rule'],
  [72, 'Desk and frame'],
  [220, 'Monitor arm'],
  [365, 'Lighting under $20'],
  [528, 'Cable management'],
  [690, 'The mic I kept'],
  [842, 'What it all cost'],
];
export const clock = (s) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}`;
// the frame Gemini sees at each chapter (img/frames/, generated for the spot, img/CREDITS.txt)
export const CHAPTER_FRAME = ['desk-000', 'desk-000', 'desk-340', 'desk-641', 'desk-848', 'desk-1130', 'desk-000'];
export const SHORTEST = Math.min(...CHAPTERS.map(([s], i) => (CHAPTERS[i + 1] ? CHAPTERS[i + 1][0] : FILE.secs) - s));

export const TITLE = 'My Entire Desk Setup Cost $89. Here\'s Everything.';
// the 9 things Sam bought, $89 all in (the mic was kept, so it is not a link)
export const GEAR = [
  ['Desk frame', 25], ['Birch top', 9], ['Monitor arm', 16], ['LED light bar', 14], ['Cable tray', 7],
  ['Velcro ties', 3], ['Desk mat', 6], ['Power strip', 5], ['Headphone hook', 4],
];
export const GEAR_TOTAL = GEAR.reduce((a, [, p]) => a + p, 0); // 89
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
export const DESC_P1 = 'I gave myself one rule for this desk: $89, all in. Every piece is below, with what it cost and what I\'d skip.';
export const DESC_GEAR = `Everything I bought (9 links, $${GEAR_TOTAL} total):`;
export const DESC_P3 = 'New desk videos every Thursday at 5 PM. Next week: the $40 chair test.';
export const DESC = [
  DESC_P1, '',
  ...CHAPTERS.map(([s, l]) => `${clock(s)} ${l}`), '',
  DESC_GEAR,
  ...GEAR.map(([n, p]) => `${n} ($${p}): https://samrivera.link/${slug(n)}`), '',
  DESC_P3,
].join('\n');

export const TAGS = [
  'desk setup', 'budget desk setup', 'cheap desk setup 2026', '$89 desk setup', 'desk tour', 'desk tour 2026',
  'budget desk', 'small desk setup', 'minimal desk setup', 'monitor arm', 'led light bar', 'cable management',
  'desk upgrades', 'home office setup', 'sam rivera',
];
export const TAG_CHARS = TAGS.join(',').length; // 224

export const THUMB_AT = 6 * 60 + 41;     // 6:41, inside "Lighting under $20" (6:05 to 8:48)
export const PLAYLIST = 'Desk Setups';
export const LAST_VIDEO = 'I tested 12 budget mics under $100';
export const VIDEO_LINK = 'https://youtu.be/k3Rv9DeskT8';
export const SCHEDULE = { date: 'Oct 8, 2026', day: 'Thu, Oct 8, 2026', time: '5:00 PM', zone: 'Los Angeles' };
export const fmt = (n) => n.toLocaleString('en-US');

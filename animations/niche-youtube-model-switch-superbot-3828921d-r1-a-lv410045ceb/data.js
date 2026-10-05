// What the spot says. One ask, three hand-offs, each one making the part of the ask it is best at:
// Gemini 3.1 Pro watches the video and reads every comment (video-native, 1M-token context) and ranks the five
// that need Sam; Claude Opus 5.5 writes the five answers in Sam's voice and picks the one to pin; superbot's
// YouTube Studio connection posts them and pins it, shown on the public watch page. Nothing beyond the ask: no hearts.
// Every reply only says what the video or its description shows (the 7:05 echo test, the 6:12 blind test, the 4:38
// desk shot, the 9:40 result): no invented people, links, reactions or promises.
export const ASK = 'Answer the top comments on my latest video and pin the best one';

export const VIDEO = {
  title: 'I tested 12 budget mics under $100',
  channel: 'Sam Rivera', handle: '@samrivera', subs: '48.2K subscribers',
  length: '14:32', lengthS: 872, comments: '1,284', posted: '1 day ago', likes: '12K',
};

// chip: what Gemini found about the comment, its intent and the moment in the video it is about (the reference's
// neutral outline chips). Claude's replies only use what Gemini saw in the video.
export const TOP = [
  { name: 'Priya Nair', handle: '@priyanair', init: 'P', color: '#0f9d8a', likes: '2.1K', ago: '1 day ago',
    text: 'Which one would you actually buy for a small untreated room?', chip: 'Asked 214 times',
    reply: ['The $49 dynamic. It rejects most of the room echo.', 'You can hear it side by side at 7:05.'], pin: true },
  { name: 'Marco Ruiz', handle: '@marcoruiz', init: 'M', color: '#e8710a', likes: '1.4K', ago: '1 day ago',
    text: 'The blind test at 6:12 got me. Picked the $29 one every single time.', chip: 'Praise · 6:12',
    reply: ['Right? The $29 one is the sleeper of the whole test.'] },
  { name: 'Lena Fischer', handle: '@lenafischer', init: 'L', color: '#1a73e8', likes: '986', ago: '1 day ago',
    text: "What's that boom arm at 4:38? Looks so clean on the desk.", chip: 'Gear · 4:38',
    reply: ['A low-profile boom arm, mic mounted underneath (4:38).'] },
  { name: 'Dee Okafor', handle: '@deeokafor', init: 'D', color: '#9334e6', likes: '742', ago: '1 day ago',
    text: 'Headsets next please, half of us stream on them', chip: 'Request · 96 asks',
    reply: ['Love that idea. Would you want USB or wireless ones?'] },
  { name: 'Tom Hale', handle: '@tomhale', init: 'T', color: '#d01884', likes: '515', ago: '1 day ago',
    text: "Didn't expect the USB one to beat the XLR ones.", chip: 'Praise',
    reply: ['Surprised me too. The USB one at 9:40 was the upset.'] },
];

// the moments Gemini ticks on the timeline as the playhead passes them
export const TICKS = [{ s: 278, label: '4:38' }, { s: 372, label: '6:12' }, { s: 425, label: '7:05 answers Priya', up: true }, { s: 580, label: '9:40' }];

export const PIN_DECISION = "Pin Priya's question: 214 people asked it, one reply answers them all";

export const POSTED = [
  { icon: 'avatar', text: 'Connected as <b>Sam Rivera</b>' },
  { icon: 'youtube', text: '5 replies posted in your voice' },
  { icon: 'pin', text: "Pinned Priya's comment" },
];

// the one-line summary under each model header, as the real app writes it
export const SAY = {
  gemini: 'Watching your latest video and reading all 1,284 comments.',
  geminiDone: 'Watched your latest video and read all 1,284 comments.',
  claude: 'Writing five replies in your voice and picking the one to pin…',
  claudeDone: 'Wrote all five replies in your voice and picked the one to pin.',
};

export const SAY_YT = 'Posting from your own YouTube Studio, as you.';

export const MODELS = {
  gemini: { name: 'Gemini 3.1 Pro', icon: 'brand/gemini.svg' },
  claude: { name: 'Claude Opus 5.5', icon: 'brand/claude.svg' },
  youtube: { name: 'YouTube Studio', icon: 'brand/youtube-icon.svg' },
};

// The spot's one dataset. Gemini ranks these comments (rank.js), Claude Opus 5.5 writes these replies (drafts.js),
// GPT-6 Sol scores them for the pin (pin.js) and YouTube Studio posts them (studio.js), so every beat shows the same
// people, numbers and words. Every commenter, count and reply is made up for the spot.

export const ACCOUNT = 'Sam Rivera';
export const VIDEO = {
  title: 'I tested 12 budget mics under $100', len: '14:32', views: '48K views', age: '2 hours ago',
  thumb: 'thumb-12mics.jpg',      // img/: the composed thumbnail over the Pexels photo (img/CREDITS.txt)
  frame: 'mic-frame.jpg',         // img/: the raw photo, cropped per moment for the "answered at" frames
  comments: 1284, questions: 38,
};

// The top five as Gemini ranks them. same: viewers who asked or said the same thing (merged repeats); at: the moment
// in the video that answers it (null: nothing in the video does); what: that moment's chapter; crop: where the
// moment's frame sits in img/mic-frame.jpg (object-position, zoom)
export const TOP = [
  { name: 'Priya Nair', text: 'Which one would you actually buy for a small untreated room?', likes: '2.1K', c: '#00897b',
    same: 214, at: '7:05', what: 'Room echo test', crop: ['34% 72%', 2.2] },
  { name: 'Marco Ruiz', text: 'The blind test at 6:12 got me. Picked the $29 one every single time.', likes: '1.4K', c: '#e8710a',
    same: 96, at: '6:12', what: 'Blind test', crop: ['42% 30%', 1.8] },
  { name: 'Lena Fischer', text: 'What\'s that boom arm at 4:38? Looks so clean on the desk.', likes: '986', c: '#1967d2',
    same: 61, at: '4:38', what: 'Desk setup', crop: ['78% 20%', 1.5] },
  { name: 'Dee Okafor', text: 'Headsets next please, half of us stream on them', likes: '742', c: '#9334e6',
    same: 48, at: null, what: 'Next video', crop: null },
  { name: 'Tom Hale', text: 'Didn\'t expect the USB one to beat the XLR ones. Great video.', likes: '515', c: '#d01884',
    same: 22, at: '8:15', what: 'USB vs XLR', crop: ['40% 82%', 2.6] },
];

// Sam's reply to each, in TOP order. m:ss renders as YouTube's blue timestamp link (rich); \n is a line break.
// Priya's is the one that gets pinned, so it carries the short buyer's guide the top questions keep asking for.
export const REPLY = [
  'Small untreated room: the $49 dynamic. It ignores the echo the condensers pick up, side by side at 7:05.\nStreaming on a budget: the $29 USB, the blind-test winner at 6:12.\nThe boom arm from 4:38 is linked in the description.',
  'My editor picked it blind too. The $29 one won 9 of 12 rounds, full scores at 6:40.',
  'Low-profile arm with the mic hung underneath, so it stays out of frame. Linked in the description, full desk tour at 4:38.',
  'Headsets are next. Eight of them are on my desk right now, video in two weeks.',
  'Same here. The USB one beat two of the XLR mics at 8:15 and nobody on set saw it coming.',
];

// GPT-6 Sol's pin scorecard, in TOP order: likes (k), viewers asking the same thing, top-five questions the reply
// answers, and the score. The pick is the highest score.
export const SCORE = [
  { likes: 2.1, same: 214, covers: 3, score: 94 },
  { likes: 1.4, same: 96, covers: 1, score: 68 },
  { likes: 0.986, same: 61, covers: 1, score: 57 },
  { likes: 0.742, same: 48, covers: 0, score: 31 },
  { likes: 0.515, same: 22, covers: 1, score: 24 },
];
export const PIN = 0;
// what the pinned reply answers, as chips under the scorecard
export const COVERS = ['Small room', 'Blind test', 'Boom arm'];

const TS = /\b(\d{1,2}:\d\d)\b/g;
// a reply as HTML: escaped, timestamps as links, line breaks kept
export const rich = (s, esc) => esc(s).replace(TS, '<a class="yt-ts">$1</a>').replace(/\n/g, '<br>');

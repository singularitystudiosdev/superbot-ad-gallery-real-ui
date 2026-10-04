// The one script every beat reads, so the four hand-offs tell one consistent story. The ask is "Answer the top
// comments on my latest video and pin the best one", and each switch makes one part of that deliverable:
//   GPT-6 Astra   ranks the 1,284 comments and finds the top five          (rank.js)
//   Gemini        watches the 14:32 video and finds the fact behind each   (answers.js)
//   Claude Opus   writes the five replies in the creator's voice, picks pin (replies.js)
//   YouTube Studio posts the five replies and pins the best one            (studio.js)
// Every number below is internally consistent (the intents sum to TOTAL, the repeats sit inside their intent, every
// timestamp is inside LEN_S). Change a figure here and every beat follows.

export const CHANNEL = { name: 'Sam Rivera', handle: '@samrivera', subs: '212K' };
export const VIDEO = {
  title: 'I tested 12 budget mics under $100',
  len: '14:32',
  views: '48.2K',
  posted: '2 days ago',
  likes: '3.9K',
};
export const LEN_S = 14 * 60 + 32;
export const TOTAL = 1284;

// what all 1,284 comments are, by intent (sums to TOTAL)
export const INTENTS = [
  { key: 'question', label: 'Questions', n: 412 },
  { key: 'praise', label: 'Praise', n: 538 },
  { key: 'request', label: 'Requests', n: 221 },
  { key: 'other', label: 'Other', n: 113 },
];

// the moments commenters point at: [seconds into the video, what is on screen, comments citing it]
export const MOMENTS = [
  { s: 118, at: '1:58', what: 'Unboxing', n: 21 },
  { s: 278, at: '4:38', what: 'Desk setup', n: 96 },
  { s: 372, at: '6:12', what: 'Blind test', n: 187 },
  { s: 425, at: '7:05', what: 'Side by side', n: 164 },
  { s: 580, at: '9:40', what: 'Score chart', n: 58 },
  { s: 842, at: '14:02', what: 'Outro', n: 44 },
];

// the ranked top five. score = likes + repeats weighting (Astra's rank); repeats = other comments asking the same
export const TOP = [
  { id: 'priya', name: 'Priya Nair', color: '#00897b', when: '1 day ago', likes: '2.1K', intent: 'question', repeats: 214,
    text: 'Which one would you actually buy for a small untreated room?' },
  { id: 'marco', name: 'Marco Ruiz', color: '#e8710a', when: '2 days ago', likes: '1.4K', intent: 'praise', repeats: 0,
    text: 'The blind test at 6:12 got me. Picked the $29 one every single time.' },
  { id: 'lena', name: 'Lena Fischer', color: '#1967d2', when: '1 day ago', likes: '986', intent: 'question', repeats: 61,
    text: 'What\'s that boom arm at 4:38? Looks so clean on the desk.' },
  { id: 'dee', name: 'Dee Okafor', color: '#9334e6', when: '1 day ago', likes: '742', intent: 'request', repeats: 133,
    text: 'Headsets next please, half of us stream on them' },
  { id: 'tom', name: 'Tom Hale', color: '#d01884', when: '2 days ago', likes: '515', intent: 'praise', repeats: 0,
    text: 'Didn\'t expect the USB one to beat the XLR ones. Great video.' },
];

// what Gemini found in the video for each top comment: where, what kind of evidence, the line or reading, the fact
export const ANSWERS = [
  { id: 'priya', at: '7:05', s: 425, kind: 'Transcript',
    quote: 'In my untreated bedroom the $49 dynamic had the lowest noise floor of all twelve.',
    fact: '$49 dynamic: noise floor -61 dB, best of 12 (condenser average -47 dB)' },
  { id: 'marco', at: '6:12', s: 372, kind: 'On screen',
    quote: 'Blind test scoreboard, 10 rounds',
    fact: '$29 mic won 7 of 10 blind rounds' },
  { id: 'lena', at: '4:38', s: 278, kind: 'Frame',
    quote: 'Mic hangs under a low-profile arm; desk clamp out of shot',
    fact: 'Low-profile boom arm, already linked in the description' },
  { id: 'dee', at: '14:02', s: 842, kind: 'Transcript',
    quote: 'Headsets are next, I\'m filming them this month.',
    fact: 'Headset test announced in the outro' },
  { id: 'tom', at: '9:40', s: 580, kind: 'On screen',
    quote: 'Final score chart',
    fact: 'USB mic scored 8.6, ahead of 3 of the 4 XLR mics' },
];

// the creator's voice, learned from their last 50 replies
export const VOICE = { from: 50, traits: ['Short, first person', 'Timestamp when it helps', 'No emoji'] };

// the five replies Opus writes (the timestamps become links in Studio)
export const REPLIES = [
  { id: 'priya', at: '7:05', text: 'The $49 dynamic. In my untreated bedroom it had the lowest noise floor of all 12, hear it side by side at 7:05.' },
  { id: 'marco', at: '6:12', text: 'Same as the blind rounds: the $29 one won 7 of 10. Sleeper of the whole video.' },
  { id: 'lena', at: null, text: 'Low-profile boom arm with the mic hung underneath, so the desk stays clear. Linked in the description.' },
  { id: 'dee', at: null, text: 'Headsets are next, filming them this month. Tell me the one you stream on and I\'ll add it.' },
  { id: 'tom', at: '9:40', text: 'Me neither. The USB one scored 8.6 and beat 3 of the 4 XLR mics, full chart at 9:40.' },
];

// the pin decision: which reply thread goes to the top, and the evidence for it
export const PIN = {
  id: 'priya',
  why: ['Asked 214 times', 'Most liked, 2.1K', 'One reply answers all 214'],
};

export const byId = (list, id) => list.find((x) => x.id === id);

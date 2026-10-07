// The one story every beat tells, in one place so the hub cards and the Studio page never disagree: Sam Rivera's
// latest video, its frames (one shoot, img/f*.jpg), the four comments that matter with the moment each one points
// at, and the replies Claude drafts in Sam's voice. Gemini finds the moments (it watched the video), Claude writes
// the words, Studio shows them posted.
export const ACCOUNT = { name: 'Sam Rivera', handle: '@samrivera', avatar: 'av-sam.jpg' };
export const VIDEO = { title: 'I tested 12 budget mics under $100', len: '14:32', secs: 14 * 60 + 32, meta: '48K views • 2 days ago', thumb: 'thumb.jpg' };
export const TOTAL = 1284;

// the moments Gemini notes while it watches, in video order: [seconds, label, frame]
export const MOMENTS = [
  [42, '12 mics', 'f0042.jpg'],
  [278, 'desk setup', 'f0438.jpg'],
  [372, 'blind test', 'f0612.jpg'],
  [425, '$49 dynamic', 'f0705.jpg'],
];
export const ts = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// the comments that matter, as Gemini ranks them: who, what, likes, when, the moment it is about (or a tag), avatar
export const COMMENTS = [
  { first: 'Priya', name: 'Priya Nair', handle: '@priyanair', av: 'av-priya.jpg', likes: '2.1K', ago: '1 day ago',
    text: 'Which one would you actually buy for a small untreated room?', tag: 'asked 214×', at: 425 },
  { first: 'Marco', name: 'Marco Ruiz', handle: '@marco.ruiz', av: 'av-marco.jpg', likes: '1.4K', ago: '1 day ago',
    text: 'The blind test at 6:12 got me. Picked the $29 one every single time.', at: 372 },
  { first: 'Lena', name: 'Lena Fischer', handle: '@lenafischer', av: 'av-lena.jpg', likes: '986', ago: '21 hours ago',
    text: "What's that boom arm at 4:38? Looks so clean on the desk.", at: 278 },
  { first: 'Dee', name: 'Dee Okafor', handle: '@deeokafor', av: 'av-dee.jpg', likes: '742', ago: '18 hours ago',
    text: 'Headsets next please, half of us stream on them', tag: 'request' },
];
export const PINNED = 0; // Priya: the most-asked question, so its answer is the one worth pinning

// Claude's drafts, by first name
export const REPLY = {
  Priya: 'The $49 dynamic. It ignores the most room echo, you can hear them side by side at 7:05.',
  Marco: 'Ha, my editor picked the $29 one too. Sleeper of the whole test.',
  Lena: 'Low-profile boom arm with the mic hung underneath. Linked it in the description!',
  Dee: "Headsets are already on the list. They're next.",
};

// Gemini's detection on the 4:38 frame, box_2d as the Gemini API returns it: [ymin, xmin, ymax, xmax] on 0-1000
export const BOX = { label: 'boom arm', box: [205, 52, 985, 775] };

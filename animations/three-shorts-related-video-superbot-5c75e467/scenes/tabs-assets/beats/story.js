// The one story every beat reads, so a name, a number or a timestamp is the same in every scene: Theo Outside's long
// video "I Biked the Whole Carretera Austral in 21 Days" (31:04, 640K views), its three most-replayed moments, the
// three Shorts cut from them, their titles, and the Fri / Sat / Sun 12:00 PM schedule. The spot's "today" is
// Mon, Oct 5, 2026 (Oct 1, 2026 is a Thursday), so Fri is Oct 9, Sat Oct 10, Sun Oct 11. Every person, channel and
// video is made up for the spot.
export const CHANNEL = 'Theo Outside';
export const HANDLE = '@theooutside';
export const SUBS = '412K';
export const VIDEO = {
  title: 'I Biked the Whole Carretera Austral in 21 Days', len: '31:04', lenS: 31 * 60 + 4,
  views: '640K views', viewsN: '640,318', comments: '2,917', likes: '98.4%', lk: '31,206 likes',
  date: 'Sep 21, 2026', ago: '2 weeks ago', desc: '1,240 km of gravel from Puerto Montt to Cochrane, 21 days, one bike.',
};
export const TIME = '12:00 PM';
// the three moments (start in seconds of the long video, length in seconds), the Short each becomes, and its day
export const MOMENTS = [
  { at: '8:12', s: 8 * 60 + 12, len: '0:42', d: 42, what: 'Flat tire in the rain', img: 'flat',
    title: 'Day 9: flat tire, 40 km to the next town', file: 'short-1-flat-tire', day: 'Fri', date: 'Oct 9', dd: 9,
    cap: ['40', 'KM', 'TO', 'THE', 'NEXT', 'TOWN'], fx: 0.445 },
  { at: '17:55', s: 17 * 60 + 55, len: '0:38', d: 38, what: 'The hanging glacier at Queulat', img: 'glacier',
    title: 'The glacier nobody told me about', file: 'short-2-queulat-glacier', day: 'Sat', date: 'Oct 10', dd: 10,
    cap: ['NOBODY', 'TOLD', 'ME', 'THIS', 'WAS', 'HERE'], fx: 0.655, top: true },
  { at: '26:30', s: 26 * 60 + 30, len: '0:45', d: 45, what: 'The last climb into Cochrane', img: 'climb',
    title: 'The climb that almost ended the trip', file: 'short-3-cochrane-climb', day: 'Sun', date: 'Oct 11', dd: 11,
    cap: ['THIS', 'CLIMB', 'ALMOST', 'ENDED', 'THE', 'TRIP'], fx: 0.505 },
];
export const TOTAL = '2:05';       // 0:42 + 0:38 + 0:45
export const clock = (s) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}`;

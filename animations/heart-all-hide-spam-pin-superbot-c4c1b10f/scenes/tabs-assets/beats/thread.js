// The one source of truth for every number and name the heart-all spot shows: Sam Rivera's newest upload, its comment
// count as DeepSeek V4 Flash splits it (real / spam), and the comment thread as YouTube Studio lists it. The split card
// (split.js) and the Studio page (studio.js) both read from here, so the totals can never disagree on screen; the
// module asserts REAL + SPAM = TOTAL. The channel, the video, the handles and every comment are made up for the spot.
// The video thumbnail is img/mic-thumb.jpg (composed over an Unsplash photo, img/CREDITS.txt).
export const CHANNEL = 'Sam Rivera';
export const VIDEO = { title: 'Every Budget Mic I Own, Ranked', thumb: 'mic-thumb.jpg', len: '18:24' };
export const TOTAL = 3912;
export const REAL = 3781;
export const SPAM = 131;
if (REAL + SPAM !== TOTAL) console.error('[heart-all] totals drifted', REAL, SPAM, TOTAL);
export const fmt = (n) => n.toLocaleString('en-US');

// the favorite superbot pins (DeepSeek flags it on the split card; Studio pins it as the closer)
export const FAV = 'ruthiecasts';

// Impersonators copy Sam's name into their handle (@SamRiveraGiveaway) and his green "S" avatar (studio.js).
// [handle, comment, likes (Studio's short form), posted, avatar colour, spam?]. Studio's Published tab, Top comments,
// filtered to the video, in the order it lists them before superbot acts. Spam rows sit where Studio surfaced them.
export const ROWS = [
  ['devonmakes', 'The $49 dynamic beating the $120 condenser in an untreated bedroom is the real lesson here', '2.4K', '2 days ago', '#c2185b'],
  ['lena.voiceover', 'Finally someone tested them in a room that echoes like mine does', '1.9K', '2 days ago', '#00838f'],
  ['ruthiecasts', 'Bought the $29 one after your last video and my podcast finally sounds right', '1.8K', '1 day ago', '#ef6c00'],
  ['SamRiveraGiveaway', 'Congratulations, you were picked as a winner! DM me on Telegram to claim your prize', '0', '5 hours ago', '#455a64', 'imp'],
  ['tobi_streams', 'Ranking the $15 lav above the $60 USB one was bold. You were right', '976', '1 day ago', '#6a1b9a'],
  ['kiraplays', 'Ordered your #3 pick before the video even ended', '702', '1 day ago', '#2e7d32'],
  ['coinvault.daily', 'I turned $500 into $9,400 in 2 weeks with this app: coinvault-x9.io', '0', '4 hours ago', '#5d4037', 'crypto'],
  ['owenreads', 'Can you do budget audio interfaces next?', '588', '22 hours ago', '#1565c0'],
  ['nadia.cooks', 'The sound test at 6:42 sold me. The difference is wild', '431', '20 hours ago', '#ad1457'],
  ['Sam.Rivera.Giveaway', 'Winners announced! Message me on Telegram to claim your new mic', '0', '3 hours ago', '#37474f', 'imp'],
  ['jules.pod', 'My whole setup comes from your lists now', '389', '18 hours ago', '#00695c'],
  ['benfixesthings', 'The hiss on mic #7 is so real, I returned mine last month', '274', '15 hours ago', '#4e342e'],
  ['tg.prizedesk', 'Free Shure SM7B for the first 50 on Telegram, link in my bio', '0', '2 hours ago', '#424242', 'tg'],
  ['aria.sings', 'Love that you read the same sentence into every mic', '196', '9 hours ago', '#7b1fa2'],
].map(([handle, text, likes, at, c, spam]) => ({ handle, text, likes, at, c, spam: spam || null }));


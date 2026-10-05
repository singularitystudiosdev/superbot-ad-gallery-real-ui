// The one source of truth for every number the captions spot shows: Jonah Plays' ten latest uploads (newest first),
// as the Scribe card counts them and the Studio Subtitles page lists them. Durations sum to 2:41:00 (9,660 s) and the
// word counts to 24,118; the module asserts both, so a typo can never put two different totals on screen. The games
// (Hollow Crown, Driftwake, Lantern Deep), the channel and every title are made up for the spot. Thumbnails are
// img/thumb-NN.jpg (composed over Unsplash photos, img/CREDITS.txt).
export const CHANNEL = 'Jonah Plays';
export const TODAY = 'Oct 5, 2026';
// [title, length, words, uploaded (Studio's "Modified on" before the captions land), description line]
export const VIDEOS = [
  ['Varrak the Hollow, no hits | Hollow Crown #14', '21:38', 3241, 'Oct 4, 2026', 'Phase two, still no hits. The run I promised in #13.'],
  ['Ser Odile broke me | Hollow Crown #13', '18:52', 2826, 'Oct 1, 2026', '41 attempts at Ser Odile, the parry knight of the Gilded Nave.'],
  ['Day 100 on a raft | Driftwake', '24:06', 3610, 'Sep 28, 2026', 'One hundred days, one raft, zero fresh water left.'],
  ['Don\'t go below 400 m | Lantern Deep #3', '12:47', 1915, 'Sep 26, 2026', 'The lantern flickers at 400 m. Something is down there.'],
  ['The Sunken Choir is NOT fair | Hollow Crown #12', '16:21', 2449, 'Sep 23, 2026', 'Three bosses, one arena, no checkpoint.'],
  ['I built a lighthouse | Driftwake', '15:09', 2270, 'Sep 20, 2026', 'Six hours of building so the storm can find me.'],
  ['The Ashen Stair, blind | Hollow Crown #11', '13:44', 2057, 'Sep 17, 2026', 'Going in blind. No guides, no summons.'],
  ['Something answered | Lantern Deep #2', '11:18', 1693, 'Sep 14, 2026', 'I called out in the flooded cave. Something called back.'],
  ['The storm patch is brutal | Driftwake', '9:57', 1491, 'Sep 11, 2026', 'Patch 1.4 storms, tested on day 61.'],
  ['The Keep | Hollow Crown #10', '17:08', 2566, 'Sep 8, 2026', 'The castle opens up. First look at the Keep.'],
].map(([title, len, words, up, desc], i) => ({ title, len, words, up, desc, thumb: `thumb-${String(i + 1).padStart(2, '0')}.jpg` }));

const secs = (s) => s.split(':').reduce((a, b) => a * 60 + +b, 0);
export const TOTAL_S = VIDEOS.reduce((a, v) => a + secs(v.len), 0);
export const TOTAL_WORDS = VIDEOS.reduce((a, v) => a + v.words, 0);
export const TOTAL_LEN = `${Math.floor(TOTAL_S / 3600)}h ${Math.floor((TOTAL_S % 3600) / 60)}m`; // "2h 41m"
if (TOTAL_S !== 9660 || TOTAL_WORDS !== 24118) console.error('[captions] totals drifted', TOTAL_S, TOTAL_WORDS);
export const fmt = (n) => n.toLocaleString('en-US');
// the boss names Scribe is told to spell the way Jonah does (Scribe v2 keyterm prompting)
export const KEYTERMS = ['Varrak the Hollow', 'Ser Odile'];

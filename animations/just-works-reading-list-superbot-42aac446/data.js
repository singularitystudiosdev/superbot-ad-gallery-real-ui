/* data.js - the numbers behind superbot.app/p/reading-list, "Reading list".
   One read-only sync on Sat Sep 26 at 8:41 AM for a reader with two Libby cards (Seattle Public Library and
   King County Library System), a Goodreads want-to-read shelf of 48 titles, a Kindle library of 212 books and
   an Audible library of 64 titles. 420 lines were read: 96 availability checks (48 titles at 2 libraries), 48
   shelf entries, and 276 books and audiobooks already owned, 9 of which matched a shelf title. That leaves one
   reading overview of 48 titles: 8 you can borrow right now, 14 already on hold, 9 already owned and 17 in the
   catalog behind a waitlist, which were looked at but not joined. On top of the shelf sit 5 current loans, 3 of
   them due in the week ahead.
   The person, the queue positions, the due dates and the holdings are invented for the spot; Libby, Goodreads,
   Kindle, Audible, Seattle Public Library and King County Library System are the real services named, and the
   titles and authors are real books. Every figure the page, the hub and the steps print is derived here, so
   they never disagree. */

const n0 = (n) => Number(n).toLocaleString('en-US');
export { n0 };

export const meta = {
  user: 'Maya Okonkwo',
  person: 'Maya Okonkwo',
  city: 'Seattle, WA',
  day: 'Sat, Sep 26',
  synced: '8:41 AM',
  cards: '2 library cards',
  // the clock the top bar prints: the sync starts at 8:40:54 AM and lands at 8:41:36 AM, 42 s in
  syncStart: 8 * 3600 + 40 * 60 + 54,
  syncSecs: 42,
};

/* the five places the reading list came out of: what each one held, and what it contributed to the overview.
   Seattle Public Library and King County Library System answered for every want-to-read title (48 checks
   each). Goodreads supplied the 48 titles themselves. The Kindle and Audible libraries were compared against
   the shelf: 6 Kindle books and 3 audiobooks were already there, so those titles need no hold at all. */
export const accounts = [
  { id: 'spl', name: 'Seattle Public Library', short: 'SPL', what: 'availability checks', handle: 'Libby card · 98104', logo: './brand/libby.svg', pulled: 48, kept: 48, note: 'Live availability and hold queue for all 48 titles' },
  { id: 'kcls', name: 'King County Library System', short: 'KCLS', what: 'availability checks', handle: 'Libby card · 98004', logo: './brand/libby.svg', pulled: 48, kept: 48, note: 'Live availability and hold queue for all 48 titles' },
  { id: 'goodreads', name: 'Goodreads want-to-read', short: 'Goodreads', what: 'shelf entries', handle: 'goodreads.com/mayaokonkwo', logo: './brand/goodreads.svg', pulled: 48, kept: 48, note: 'Every title on the want-to-read shelf' },
  { id: 'kindle', name: 'Kindle library', short: 'Kindle', what: 'books', handle: '276 books and audiobooks compared', logo: './brand/kindle.svg', pulled: 212, kept: 6, note: '6 want-to-read titles already in the library' },
  { id: 'audible', name: 'Audible library', short: 'Audible', what: 'titles', handle: '276 books and audiobooks compared', logo: './brand/audible.svg', pulled: 64, kept: 3, note: '3 want-to-read titles already owned as audiobooks' },
];

export const accOf = (id) => accounts.find((a) => a.id === id);
const sum = (ids, k) => ids.reduce((a, id) => a + accOf(id)[k], 0);
const CARDS = ['spl', 'kcls'];

/* the 48 want-to-read titles by outcome: 8 + 14 + 9 + 17 = 48 */
const OUTCOME = { available: 8, hold: 14, owned: 9, waitlist: 17 };

/* the 8 titles you can borrow right now, and where the copy is */
const READY = [
  ['intermezzo', 'Intermezzo', 'Sally Rooney', 'spl', 'Ebook', 'Available now, no wait'],
  ['james', 'James', 'Percival Everett', 'kcls', 'Ebook', 'Available now, no wait'],
  ['orbital', 'Orbital', 'Samantha Harvey', 'spl', 'Audiobook', 'Available now, 5 h 12 m'],
  ['all-fours', 'All Fours', 'Miranda July', 'kcls', 'Audiobook', 'Available now, 10 h 40 m'],
  ['north-woods', 'North Woods', 'Daniel Mason', 'spl', 'Audiobook', 'Available now, 9 h 54 m'],
  ['martyr', 'Martyr!', 'Kaveh Akbar', 'kcls', 'Ebook', 'Available now, no wait'],
  ['playground', 'Playground', 'Richard Powers', 'spl', 'Ebook', 'Available now, no wait'],
  ['serviceberry', 'The Serviceberry', 'Robin Wall Kimmerer', 'spl', 'Ebook', 'Available now, 2 h 48 m'],
];

export const ready = READY.map(([key, title, author, at, format, note]) => ({ key, title, author, at, format, note }));

/* the 14 titles already on hold: place in line, copies, estimated wait and the shorter of the two queues.
   Every hold was placed on the shelf's own date; the queue figures are as of this sync. */
const HOLDS = [
  ['project-hail-mary', 'Project Hail Mary', 'Andy Weir', 'spl', 8, 96, 14, 1, 'Aug 12', 'Fastest of the 14 queues'],
  ['demon-copperhead', 'Demon Copperhead', 'Barbara Kingsolver', 'kcls', 12, 140, 20, 2, 'Aug 3', 'Audiobook queue is shorter'],
  ['the-frozen-river', 'The Frozen River', 'Ariel Lawhon', 'kcls', 6, 88, 15, 1, 'Aug 19', 'Shorter than the other card'],
  ['tomorrow-and-tomorrow-and-tomorrow', 'Tomorrow, and Tomorrow, and Tomorrow', 'Gabrielle Zevin', 'spl', 21, 205, 26, 3, 'Jul 29', ''],
  ['the-women', 'The Women', 'Kristin Hannah', 'kcls', 19, 168, 22, 3, 'Aug 22', ''],
  ['the-god-of-the-woods', 'The God of the Woods', 'Liz Moore', 'spl', 112, 431, 54, 4, 'Jul 27', 'Longest line on the shelf'],
  ['onyx-storm', 'Onyx Storm', 'Rebecca Yarros', 'kcls', 37, 212, 18, 6, 'Jul 26', 'Six week estimate, 18 copies'],
  ['sunrise-on-the-reaping', 'Sunrise on the Reaping', 'Suzanne Collins', 'spl', 248, 512, 61, 5, 'Jul 26', ''],
  ['fourth-wing', 'Fourth Wing', 'Rebecca Yarros', 'spl', 44, 260, 24, 4, 'Aug 6', ''],
  ['iron-flame', 'Iron Flame', 'Rebecca Yarros', 'kcls', 51, 238, 21, 5, 'Aug 6', ''],
  ['the-wedding-people', 'The Wedding People', 'Alison Espach', 'spl', 33, 176, 19, 2, 'Aug 14', ''],
  ['blue-sisters', 'Blue Sisters', 'Coco Mellors', 'kcls', 27, 154, 16, 2, 'Aug 10', ''],
  ['creation-lake', 'Creation Lake', 'Rachel Kushner', 'spl', 16, 122, 14, 2, 'Aug 24', ''],
  ['the-message', 'The Message', 'Ta-Nehisi Coates', 'kcls', 9, 104, 12, 3, 'Sep 2', ''],
];

export const holds = HOLDS.map(([key, title, author, at, place, queued, copies, wait, joined, note]) => ({
  key, title, author, at, place, queued, copies, wait, joined, note,
}));

/* the 9 titles already in the Kindle or Audible library: no hold, no wait */
const OWNED = [
  ['the-midnight-library', 'The Midnight Library', 'Matt Haig', 'kindle', 'Ebook'],
  ['educated', 'Educated', 'Tara Westover', 'kindle', 'Ebook'],
  ['the-bee-sting', 'The Bee Sting', 'Paul Murray', 'kindle', 'Ebook'],
  ['the-thursday-murder-club', 'The Thursday Murder Club', 'Richard Osman', 'kindle', 'Ebook'],
  ['pachinko', 'Pachinko', 'Min Jin Lee', 'kindle', 'Ebook'],
  ['remarkably-bright-creatures', 'Remarkably Bright Creatures', 'Shelby Van Pelt', 'kindle', 'Ebook'],
  ['trust', 'Trust', 'Hernan Diaz', 'audible', 'Audiobook'],
  ['piranesi', 'Piranesi', 'Susanna Clarke', 'audible', 'Audiobook'],
  ['klara-and-the-sun', 'Klara and the Sun', 'Kazuo Ishiguro', 'audible', 'Audiobook'],
];

export const owned = OWNED.map(([key, title, author, at, format]) => ({ key, title, author, at, format }));

/* the 17 titles that sit in the catalog behind a waitlist: read, not joined (the shelf stays join-free) */
const WAITLIST = [
  ['the-grey-wolf', 'The Grey Wolf', 'Louise Penny'],
  ['sandwich', 'Sandwich', 'Catherine Newman'],
  ['the-ministry-of-time', 'The Ministry of Time', 'Kaliane Bradley'],
  ['real-americans', 'Real Americans', 'Rachel Khong'],
  ['grief-is-for-people', 'Grief Is for People', 'Sloane Crosley'],
  ['small-things-like-these', 'Small Things Like These', 'Claire Keegan'],
  ['the-safekeep', 'The Safekeep', 'Yael van der Wouden'],
  ['colored-television', 'Colored Television', 'Danzy Senna'],
  ['enlightenment', 'Enlightenment', 'Sarah Perry'],
  ['same-as-it-ever-was', 'Same As It Ever Was', 'Claire Lombardo'],
  ['the-lion-women-of-tehran', 'The Lion Women of Tehran', 'Marjan Kamali'],
  ['fire-exit', 'Fire Exit', 'Morgan Talty'],
  ['knife', 'Knife', 'Salman Rushdie'],
  ['there-is-no-ethan', 'There Is No Ethan', 'Anna Akbari'],
  ['the-bright-sword', 'The Bright Sword', 'Lev Grossman'],
  ['bear', 'Bear', 'Julia Phillips'],
  ['the-hunter', 'The Hunter', 'Tana French'],
];

export const waitlist = WAITLIST.map(([key, title, author]) => ({ key, title, author }));

/* the five loans out right now, and the three that come due this week (Sep 28, Sep 29, Oct 1) */
const LOANS = [
  ['creative-act', 'The Creative Act', 'Rick Rubin', 'spl', 'Audiobook', 'Sun, Sep 28', 'in 2 days', 'due'],
  ['the-housemaid', 'The Housemaid', 'Freida McFadden', 'kcls', 'Ebook', 'Mon, Sep 29', 'in 3 days', 'due'],
  ['crying-in-h-mart', 'Crying in H Mart', 'Michelle Zauner', 'spl', 'Audiobook', 'Thu, Oct 1', 'in 5 days', 'due'],
  ['the-anxious-generation', 'The Anxious Generation', 'Jonathan Haidt', 'kcls', 'Ebook', 'Thu, Oct 8', 'in 12 days', ''],
  ['the-wager', 'The Wager', 'David Grann', 'spl', 'Audiobook', 'Mon, Oct 12', 'in 16 days', ''],
];

export const loans = LOANS.map(([key, title, author, at, format, due, left, flag]) => ({
  key, title, author, at, format, due, left, due_this_week: flag === 'due',
}));

/* the shelf grid: the nine want-to-read titles shown with their covers, one per outcome. `figure` is the
   number the card prints large (the place in line, or the wait the catalog quotes); `note` is the row of
   text under the card. */
const SHELF = [
  ['intermezzo', 'Intermezzo', 'Sally Rooney', 'available', 'Free', 'Borrow now, SPL', './img/covers/intermezzo.jpg'],
  ['james', 'James', 'Percival Everett', 'available', 'Free', 'Borrow now, KCLS', './img/covers/james.jpg'],
  ['the-god-of-the-woods', 'The God of the Woods', 'Liz Moore', 'hold', '#112 of 431', 'SPL, longest queue', './img/covers/the-god-of-the-woods.jpg'],
  ['project-hail-mary', 'Project Hail Mary', 'Andy Weir', 'hold', '#8 of 96', 'SPL, shortest wait', './img/covers/project-hail-mary.jpg'],
  ['the-women', 'The Women', 'Kristin Hannah', 'hold', '#19 of 168', 'KCLS, about 3 weeks', './img/covers/the-women.jpg'],
  ['onyx-storm', 'Onyx Storm', 'Rebecca Yarros', 'hold', '#37 of 212', 'KCLS, about 6 weeks', './img/covers/onyx-storm.jpg'],
  ['remarkably-bright-creatures', 'Remarkably Bright Creatures', 'Shelby Van Pelt', 'owned', 'Owned', 'On your Kindle', './img/covers/remarkably-bright-creatures.jpg'],
  ['the-ministry-of-time', 'The Ministry of Time', 'Kaliane Bradley', 'waitlist', '~8 wk', 'About 8 weeks, not joined', './img/covers/the-ministry-of-time.jpg'],
  ['sandwich', 'Sandwich', 'Catherine Newman', 'waitlist', '~5 wk', 'About 5 weeks, not joined', './img/covers/sandwich.jpg'],
];

export const shelf = SHELF.map(([key, title, author, kind, figure, note, cover]) => ({ key, title, author, kind, figure, note, cover }));

const CHECKS = sum(CARDS, 'kept');                                        // 96
const TITLES = accOf('goodreads').pulled;                                 // 48
const OWNED_N = sum(['kindle', 'audible'], 'kept');                       // 9
const PULLED = accounts.reduce((a, x) => a + x.pulled, 0);                // 420

export const counts = {
  sources: accounts.length,
  cards: CARDS.length,
  libraries: CARDS.length,
  pulled: PULLED,
  dupes: PULLED - TITLES,                                                 // 372 lines merged onto a title
  rows: TITLES,
  titles: TITLES,
  checks: CHECKS,
  available: OUTCOME.available,
  hold: OUTCOME.hold,
  owned: OWNED_N,
  waitlist: OUTCOME.waitlist,
  decided: OUTCOME.available + OUTCOME.hold + OWNED_N,                    // 31 titles settled
  loans: loans.length,
  dueThisWeek: loans.filter((l) => l.due_this_week).length,               // 3
  kindle: accOf('kindle').pulled,                                         // 212
  audible: accOf('audible').pulled,                                       // 64
  ownChecked: accOf('kindle').pulled + accOf('audible').pulled,           // 276
  soonest: holds.reduce((a, h) => (h.wait < a.wait ? h : a), holds[0]),   // Project Hail Mary, 1 wk
  longest: holds.reduce((a, h) => (h.place > a.place ? h : a), holds[0]), // The God of the Woods
};

/* the four counters in the status strip: what each outcome means and the rows the page names first */
export const flags = [
  { kind: 'available', label: 'Borrow now', icon: 'circle-check', n: counts.available, rule: 'A copy is free at one of your cards',
    examples: ready.slice(0, 3).map((r) => ({ name: r.title, v: `${r.format}, ${accOf(r.at).short}` })) },
  { kind: 'hold', label: 'Already on hold', icon: 'hourglass', n: counts.hold, rule: 'You are in the queue at one library',
    examples: holds.slice(0, 3).map((h) => ({ name: h.title, v: `#${h.place}, about ${h.wait} wk` })) },
  { kind: 'due', label: 'Due this week', icon: 'calendar-days', n: counts.dueThisWeek, rule: 'Loans out now that expire by Oct 1',
    examples: loans.filter((l) => l.due_this_week).map((l) => ({ name: l.title, v: l.due.replace(/^\w+, /, '') })) },
  { kind: 'owned', label: 'Already own', icon: 'bookmark', n: counts.owned, rule: 'In your Kindle or Audible library',
    examples: owned.slice(0, 3).map((o) => ({ name: o.title, v: accOf(o.at).short })) },
];

/* the holds panel: one row per hold, the shorter queue across the two cards, and the estimated wait */
export const holdRows = holds.map((h) => ({
  ...h,
  library: `${accOf(h.at).short} · ${accOf(h.at).name}`,
  placeText: `#${n0(h.place)} of ${n0(h.queued)}`,
  waitText: h.wait === 1 ? 'about 1 week' : `about ${h.wait} weeks`,
  has: true,
}));

/* the loans panel: what the click on the second tab swaps in */
export const loanRows = loans.map((l) => ({
  ...l,
  library: accOf(l.at).short,
  state: l.due_this_week ? `Due ${l.due} · ${l.left}` : `Due ${l.due} · ${l.left}`,
  action: l.due_this_week ? 'Return or renew by then' : 'Nothing to do yet',
}));

/* the rows the hub's live card previews while the sync runs */
export const items = [
  { img: './brand/book.svg', title: 'Intermezzo', price: 'Borrow now', meta: 'Sally Rooney · ebook free at Seattle Public Library', source: 'spl' },
  { img: './brand/book.svg', title: 'Project Hail Mary', price: '#8 of 96', meta: 'Andy Weir · hold about 1 week out', source: 'spl' },
  { img: './brand/book.svg', title: 'The Housemaid', price: 'Due Sep 29', meta: 'Freida McFadden · loan expires Monday', source: 'kcls' },
  { img: './brand/book.svg', title: 'Remarkably Bright Creatures', price: 'On Kindle', meta: 'Shelby Van Pelt · already owned, no hold needed', source: 'kindle' },
  { img: './brand/book.svg', title: 'Onyx Storm', price: 'Waitlist', meta: 'Rebecca Yarros · 6 week wait, not joined', source: 'kcls' },
];

/* prose the page prints about its own numbers */
export const copy = {
  kicker: `Libby + Goodreads + Kindle + Audible, synced ${meta.synced}`,
  heroH1: `${counts.titles} want-to-read titles, ${counts.checks} library checks, one reading overview.`,
  heroDek: `Superbot signed in to Libby with both your library cards, read the 48 titles on your Goodreads want-to-read shelf, checked each one at Seattle Public Library and King County Library System, and compared them with your Kindle and Audible libraries. Read-only, nothing was borrowed, held, returned or rated.`,
  flagsH: 'Where the 48 titles stand',
  flagsDek: `${counts.checks} availability checks at ${counts.libraries} libraries, plus what you already own.`,
  roomsH: 'From the want-to-read shelf',
  roomsDek: `Nine of the ${counts.titles} titles: ${counts.available} ready to borrow, ${counts.hold} on hold, ${counts.owned} owned, ${counts.waitlist} waitlisted and not joined.`,
  holdsH: 'The hold queue, shortest wait first',
  holdsDek: `${counts.hold} titles already on hold. Place in line and estimate are for the library that moves fastest.`,
  loansH: 'Ready now, and due this week',
  loansDek: `${counts.available} titles free to borrow, and ${counts.loans} loans out now, ${counts.dueThisWeek} of them due by Oct 1.`,
  worstNote: 'Project Hail Mary is about a week out at Seattle Public Library, the soonest hold on your shelf.',
  watchH: 'This week',
  watchDek: 'Due dates and the hold closest to arriving. Read straight off the sync.',
};

/* what the week holds, read off the loans and the hold queue */
export const watch = [
  { icon: 'calendar-days', k: 'Sun, Sep 28', v: 'The Creative Act is due', note: '2 days left, Seattle Public Library' },
  { icon: 'calendar-days', k: 'Mon, Sep 29', v: 'The Housemaid is due', note: 'One renewal left at King County' },
  { icon: 'calendar-days', k: 'Thu, Oct 1', v: 'Crying in H Mart is due', note: 'No renewals used on this one' },
  { icon: 'hourglass', k: 'Soonest hold', v: `${counts.soonest.title}, about ${counts.soonest.wait} week`, note: `#${counts.soonest.place} of ${counts.soonest.queued} holds at Seattle Public Library` },
];
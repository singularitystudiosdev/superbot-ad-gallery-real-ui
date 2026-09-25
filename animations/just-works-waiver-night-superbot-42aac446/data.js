/* data.js - the numbers behind superbot.app/p/waiver-night, Week 4 waiver night.
   Every count on the page comes from here, so the chat ticker, the waiver board and the claim cards
   can never disagree. Player names are invented for this spot; team codes are only shorthand for a
   matchup, the same way a real fantasy line sits next to a defense it plays. Photos are sourced, see
   CREDITS.txt. Nothing in this file is a live feed. */

/* the ask's clock: what is left before the Thursday kickoff the ad holds at */
export const meta = {
  week: 4,
  kickoffLabel: 'Kickoff Thu 8:15 PM ET',
  kickoffShort: 'Thu 8:15 PM',
  countdown: 4 * 3600 + 12 * 60 + 38,   // seconds on the clock when the page beat opens
  lockLabel: 'Claims lock at kickoff',
  synced: 'Synced 2 min ago',
  scanned: 184,
  leagues: 3,
  claimsPlaced: 3,
  lineupsSet: 3,
  faabLeft: 86,      // 28 + 21 + 37, the three leagues' remaining budgets
};

/* the free agent board, ranked by rest of season value. rank 1 is the player every league was told to
   bid on first. This is the list the page's board renders and the claim cards quote from. */
export const wire = [
  { rank: 1, name: 'Cal Merrow', pos: 'RB', team: 'BUF', opp: 'MIA', ros: 118, proj: 15.6, rostered: 41, trend: 12 },
  { rank: 2, name: 'Nico Harkness', pos: 'WR', team: 'CIN', opp: 'PIT', ros: 104, proj: 12.9, rostered: 38, trend: 9 },
  { rank: 3, name: 'Quentin Halloway', pos: 'TE', team: 'DAL', opp: 'PHI', ros: 96, proj: 10.8, rostered: 52, trend: 7 },
  { rank: 4, name: 'Hollis Merrick', pos: 'RB', team: 'GB', opp: 'DET', ros: 92, proj: 13.2, rostered: 33, trend: 6 },
  { rank: 5, name: 'Casimir Volkov', pos: 'WR', team: 'MIN', opp: 'CHI', ros: 121, proj: 15.2, rostered: 29, trend: 5 },
  { rank: 6, name: 'Ivo Petrakis', pos: 'RB', team: 'LAC', opp: 'DEN', ros: 88, proj: 11.1, rostered: 24, trend: 4 },
  { rank: 7, name: 'Dmitri Sahl', pos: 'WR', team: 'SEA', opp: 'SF', ros: 81, proj: 9.9, rostered: 22, trend: 3 },
  { rank: 8, name: 'Paxton Nyland', pos: 'K', team: 'PHI', opp: 'DAL', ros: 64, proj: 7.6, rostered: 18, trend: 2 },
  { rank: 9, name: 'Bram Wexler', pos: 'TE', team: 'MIN', opp: 'CHI', ros: 74, proj: 8.8, rostered: 12, trend: -4 },
  { rank: 10, name: 'Anders Pike', pos: 'TE', team: 'CAR', opp: 'ATL', ros: 58, proj: 6.2, rostered: 15, trend: -3 },
];

/* The three league panels. Claims and lineups are per league: the page swaps the whole panel when the
   header tab for that league is clicked, and the swap is pure CSS (:has() + sibling), so the site runs
   no JS on the click. Lineup rows are the same nine slots in every league. */
const raw = [
  {
    key: 1,
    id: 'espn',
    platform: { name: 'ESPN Fantasy', short: 'ESPN', logo: './brand/espn.svg' },
    league: 'Office League',
    club: 'Short Week',
    record: '5-3',
    place: '3rd of 12',
    budgetLeft: 28,
    budgetOf: 42,
    claim: {
      at: '4 min ago',
      why: 'Top of the board after the Sallinger news. Started him in 9 of 12 weeks, so the bench drop is the cheap one.',
      pick: 'Best available back',
      add: { name: 'Cal Merrow', pos: 'RB', team: 'BUF', opp: 'MIA', proj: 15.6, ros: 118, rostered: 41 },
      drop: { name: 'Deke Sallinger', pos: 'RB', team: 'NYJ', note: 'ruled out, ankle', proj: 7.4 },
      bid: 14,
      beat: 17,
    },
    lineup: {
      old: 101.4,
      bench: 'Bench 33.8',
      rows: [
        { slot: 'QB', name: 'Jonah Pfister', pos: 'QB', team: 'PHI', opp: 'DAL', proj: 22.4 },
        { slot: 'RB', name: 'Cal Merrow', pos: 'RB', team: 'BUF', opp: 'MIA', proj: 15.6, moved: true },
        { slot: 'RB', name: 'Tobias Renn', pos: 'RB', team: 'SF', opp: 'SEA', proj: 13.9 },
        { slot: 'WR', name: 'Emory Kade', pos: 'WR', team: 'DET', opp: 'GB', proj: 14.1 },
        { slot: 'WR', name: 'Silas Boone', pos: 'WR', team: 'MIA', opp: 'BUF', proj: 11.8, moved: true },
        { slot: 'TE', name: 'Weston Faye', pos: 'TE', team: 'KC', opp: 'LV', proj: 9.4 },
        { slot: 'FLEX', name: 'Reggie Vallo', pos: 'RB', team: 'ATL', opp: 'NO', proj: 10.6 },
        { slot: 'K', name: 'Marek Dolan', pos: 'K', team: 'BAL', opp: 'CIN', proj: 7.9 },
        { slot: 'DST', name: 'Broncos', pos: 'DST', team: 'DEN', opp: 'LAC', proj: 7.2 },
      ],
    },
  },
  {
    key: 2,
    id: 'yahoo',
    platform: { name: 'Yahoo Fantasy', short: 'Yahoo', logo: './brand/yahoo.svg' },
    league: 'Family League',
    club: 'Uncle Rico FC',
    record: '6-2',
    place: '1st of 10',
    budgetLeft: 21,
    budgetOf: 30,
    claim: {
      at: '7 min ago',
      why: 'Kalisz is on the bye and the waiver wire here is thin at receiver, so the bid went to the one target with three weeks of routes.',
      pick: 'Best available receiver',
      add: { name: 'Nico Harkness', pos: 'WR', team: 'CIN', opp: 'PIT', proj: 12.9, ros: 104, rostered: 38 },
      drop: { name: 'Brody Kalisz', pos: 'WR', team: 'TEN', note: 'bye week, no targets', proj: 6.8 },
      bid: 9,
      beat: 11,
    },
    lineup: {
      old: 99.7,
      bench: 'Bench 30.4',
      rows: [
        { slot: 'QB', name: 'Marek Ostrow', pos: 'QB', team: 'CIN', opp: 'PIT', proj: 21.7 },
        { slot: 'RB', name: 'Emil Sandoval', pos: 'RB', team: 'LAR', opp: 'ARI', proj: 14.8 },
        { slot: 'RB', name: 'Hollis Merrick', pos: 'RB', team: 'GB', opp: 'DET', proj: 13.2, moved: true },
        { slot: 'WR', name: 'Nico Harkness', pos: 'WR', team: 'CIN', opp: 'PIT', proj: 12.9, moved: true },
        { slot: 'WR', name: 'Amos Leclair', pos: 'WR', team: 'TB', opp: 'NO', proj: 11.4 },
        { slot: 'TE', name: 'Bram Wexler', pos: 'TE', team: 'MIN', opp: 'CHI', proj: 8.8 },
        { slot: 'FLEX', name: 'Dmitri Sahl', pos: 'WR', team: 'SEA', opp: 'SF', proj: 9.9 },
        { slot: 'K', name: 'Paxton Nyland', pos: 'K', team: 'PHI', opp: 'DAL', proj: 7.6 },
        { slot: 'DST', name: 'Bills', pos: 'DST', team: 'BUF', opp: 'MIA', proj: 8.1 },
      ],
    },
  },
  {
    key: 3,
    id: 'sleeper',
    platform: { name: 'Sleeper', short: 'Sleeper', logo: './brand/sleeper.svg' },
    league: 'Dynasty Degens',
    club: 'Third and Fifteen',
    record: '4-4',
    place: '6th of 14',
    budgetLeft: 37,
    budgetOf: 58,
    claim: {
      at: '9 min ago',
      why: 'Deep rosters, so tight ends are thin here. Halloway cleared the protocol this morning and the room still has no one else.',
      pick: 'Best available tight end',
      add: { name: 'Quentin Halloway', pos: 'TE', team: 'DAL', opp: 'PHI', proj: 10.8, ros: 96, rostered: 52 },
      drop: { name: 'Anders Pike', pos: 'TE', team: 'CAR', note: 'limited practice, quad', proj: 5.9 },
      bid: 21,
      beat: 24,
    },
    lineup: {
      old: 107.2,
      bench: 'Bench 41.2',
      rows: [
        { slot: 'QB', name: 'Tobin Ashcroft', pos: 'QB', team: 'JAX', opp: 'HOU', proj: 23.1 },
        { slot: 'RB', name: 'Ty Okafor', pos: 'RB', team: 'DET', opp: 'GB', proj: 16.4 },
        { slot: 'RB', name: 'Lennox Bramwell', pos: 'RB', team: 'IND', opp: 'TEN', proj: 14.7 },
        { slot: 'WR', name: 'Casimir Volkov', pos: 'WR', team: 'MIN', opp: 'CHI', proj: 15.2, moved: true },
        { slot: 'WR', name: 'Rory Tallis', pos: 'WR', team: 'DAL', opp: 'PHI', proj: 12.6 },
        { slot: 'TE', name: 'Quentin Halloway', pos: 'TE', team: 'DAL', opp: 'PHI', proj: 10.8, moved: true },
        { slot: 'FLEX', name: 'Ivo Petrakis', pos: 'RB', team: 'LAC', opp: 'DEN', proj: 11.1 },
        { slot: 'K', name: 'Santiago Voss', pos: 'K', team: 'KC', opp: 'LV', proj: 8.3 },
        { slot: 'DST', name: 'Dolphins', pos: 'DST', team: 'MIA', opp: 'BUF', proj: 6.9 },
      ],
    },
  },
];

const round1 = (n) => Math.round(n * 10) / 10;

/* totals are summed from the rows, never typed twice: a lineup's projected total is its own nine rows.
   The opponent each club plays this week rides here too, so the matchup card quotes a number the league
   data already carries. */
const opp = {
  1: { opponent: 'Gridiron Goblins', oppProj: 104.2 },
  2: { opponent: "Aunt Carol's Team", oppProj: 98.6 },
  3: { opponent: 'Fourth Quarter Club', oppProj: 111.5 },
};

export const leagues = raw.map((l) => {
  const total = round1(l.lineup.rows.reduce((a, r) => a + r.proj, 0));
  return {
    ...l,
    ...opp[l.key],
    lineup: {
      ...l.lineup,
      total,
      delta: round1(total - l.lineup.old),
      moved: l.lineup.rows.filter((r) => r.moved).length,
    },
  };
});

/* the wire: what the injury desk said while the claims were being placed */
export const news = [
  {
    img: './img/goal.jpg',
    team: 'BUF',
    when: '2h ago',
    head: 'Cal Merrow takes the first team reps',
    body: 'Two backs split the first series, then Merrow took every rep with the first group. Atlanta on the schedule next, and the Bills still have a Week 9 bye open.',
    tag: 'Practice',
  },
  {
    img: './img/field.jpg',
    team: 'DAL',
    when: '4h ago',
    head: 'Halloway clears the protocol',
    body: 'Out since Week 2. Cleared this morning and lined up with the starters, which is what put him at the top of the tight end board in every format.',
    tag: 'Injury',
  },
  {
    img: './img/stands.jpg',
    team: 'NYJ',
    when: '5h ago',
    head: 'Sallinger ruled out, two backs listed',
    body: 'The Jets listed two backs behind him and called up a practice squad player, which is what made him the drop in the Office League.',
    tag: 'Injury',
  },
];

/* the hub aggregation card reads this shape: five rows off the top of the board */
export const items = [
  { img: './img/goal.jpg', title: 'Cal Merrow, RB', price: '118', meta: 'BUF, 41% rostered', source: 'espn' },
  { img: './img/field.jpg', title: 'Nico Harkness, WR', price: '104', meta: 'CIN, 38% rostered', source: 'yahoo' },
  { img: './img/stands.jpg', title: 'Quentin Halloway, TE', price: '96', meta: 'DAL, 52% rostered', source: 'sleeper' },
  { img: './img/strip.jpg', title: 'Hollis Merrick, RB', price: '92', meta: 'GB, 33% rostered', source: 'espn' },
  { img: './img/hero.jpg', title: 'Casimir Volkov, WR', price: '121', meta: 'MIN, 29% rostered', source: 'sleeper' },
];

/* prose the page prints about its own numbers */
export const copy = {
  heroH1: 'Three leagues, one waiver night.',
  heroDek:
    'Superbot read 184 free agents, ranked them by rest of season value, and filed one claim in each league. Thursday kickoff at 8:15 PM ET.',
  boardHead: 'Free agent board',
  boardDek: 'Ranked by rest of season value, and by how much of the week they are projected to play.',
  claimsHead: 'Waiver claims',
  claimsDek: 'One claim per league. Every bid is already in and it holds until the claim runs.',
  lineupHead: 'Optimal lineup',
  lineupDek: 'The best legal lineup in each league after the claim. Players moved up from the bench are marked.',
  kickoffHead: 'Locked before kickoff',
  kickoffDek: 'Nothing left to set. Superbot checks both lineups again at 7:00 PM ET and only moves a player if the injury report changes.',
  footNote:
    'These projections are worked out on this page, not pulled from a sportsbook. Rostered percentages are of 12 team leagues unless the league says otherwise.',
};

export const counts = {
  scanned: meta.scanned,
  rostered: 63,
  claims: 3,
  totalProj: leagues.reduce((a, l) => a + l.lineup.total, 0),
};
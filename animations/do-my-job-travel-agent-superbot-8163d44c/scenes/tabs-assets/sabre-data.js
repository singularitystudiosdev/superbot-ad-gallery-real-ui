// sabre-data.js: everything static the rebuilt Sabre Red 360 travel-agent desk shows, plus its UI furniture icon set.
//
// THE DATA IS THE SOURCED PACK (PLACEHOLDER = false), researched 2026-09-29 (.tmp/ta-ad.8163d44c/research, outside the
// repo): every flight, time, aircraft, rule, amount, Sabre entry, status code, queue number and ticket prefix below is
// REAL and cited. research/sources.md holds one line per fact with a verbatim quote, research/snap/ the saved copies,
// and research/verify.8163d44c.mjs (for the pack) plus audit/verify-shipped.8163d44c.mjs (for this file) re-check each
// one. Every wording change made to fit the desk at 16x9 / 4x3 / 1x1 / 4x5 is logged in audit/changes.md.
//
// The three worked PNRs:
//   (a) schedule change: UA852 TPE-SFO on 03NOV26, retimed from 25OCT26 to 23:20 / 19:00 (AeroRoutes 13JUL26), 7 h 45
//       later on arrival than today's 11:15, past the 6 h international line of 14 CFR 260.2; segment TK1, cancelled
//       and rebooked on UA872 TPE 11:10 / SFO 06:45 with Sabre X1‡01Y1; standard Sabre queue 6.
//   (b) EU261: LH440 FRA-IAH flown 02SEP26, landed 18:14 against 13:35 (4 h 39 min late, planemapper), 8,402 km
//       (OurAirports), so EUR 600 under Regulation (EC) 261/2004 Art. 7 as summarised on Your Europe.
//       superbot displays the e-ticket the claim quotes (*T, Sabre's ticket field); the issue date / time on it are part
//       of the fictional booking, the pseudo city code T3K7 and sine ASB part of the agent (superbot).
//   (c) UK ETA: UA934 EWR-LHR on 13OCT26, a US passport holder needs a UK ETA, £20 on GOV.UK; the passport SSR is added
//       in Sabre's 3DOCS/P field order and the PNR is ended and redisplayed (ER).
//
// FICTIONAL ON PURPOSE (and nothing else is):
//   - traveler names (GDS 'SURNAME/FIRST MR|MS'; the source desk's own fictional callers, never a real private person)
//   - 6-letter record locators (pnr, OLD_ITEMS ids)
//   - ticket serial digits after the real 3-digit airline prefix
//   - the booking class letter 'Y' is a real full-fare economy code, chosen, not looked up per traveler
//   - desk timings: QUEUE wait/tIn/tAns/tRes/call copied verbatim from the source desk (e360-data.js QUEUE),
//     ACTIVITY handle times copied verbatim, in order, from the source desk's ACTIVITY
//   - the agent (superbot) and the fact that these travelers booked these flights
//   - the passport data in case (c)'s 3DOCS line: passport number, date of birth, gender and expiry (the field order,
//     the P document type and the US country codes follow the sourced Sabre format)
//
// The queue timings are the call-center spot's (do-my-job-callcenter-superbot-497a61f3), verbatim: the desk's motion
// engine (sabre.js) is that spot's, beat for beat.
// The icons are UI chrome drawn by hand in a 1.6 to 2px round-cap line style, not marks of any product. The only
// third-party artwork in this spot is the Sabre logo file in ../../img (see ../../img/CREDITS.txt).
// NB: U+00A0 sits between a number and the unit it counts (the spot's copy rule); no em or en dash, no '--' anywhere.

const NB = '\u00a0';

const ico = (inner, w = 2) => `<svg class="sr-i" viewBox="0 0 24 24" aria-hidden="true" style="--sw:${w}">${inner}</svg>`;

// ---------- icons (app bar, trip-summary drawers, panel chrome, queue) ----------
export const I = {
  chevron: ico('<path d="m6 9 6 6 6-6"/>'),
  bell: ico('<path d="M6 9a6 6 0 0 1 12 0c0 4.4 1.4 5.6 1.9 6.1H4.1C4.6 14.6 6 13.4 6 9Z"/><path d="M10 18.6a2.2 2.2 0 0 0 4 0"/>'),
  search: ico('<circle cx="11" cy="11" r="6.6"/><path d="m20.5 20.5-4.4-4.4"/>'),
  air: ico('<path d="M10.2 20.5 12 14.6l-5.4-.1-1.9 2.4H3l1.2-4.9L3 7.1h1.7l1.9 2.4 5.4-.1-1.8-5.9h2.2l3.6 5.9h4.2a1.9 1.9 0 0 1 0 3.8H16l-3.6 7.3Z"/>', 1.7),
  hotel: ico('<path d="M3 18.5V6"/><path d="M3 14h18v4.5"/><path d="M21 14v-2.6A2.4 2.4 0 0 0 18.6 9H11v5"/><circle cx="7" cy="10.6" r="1.9"/>', 1.8),
  car: ico('<path d="M5 16.5h14v-4.1l-1.9-4.9H6.9L5 12.4Z"/><path d="M5 12.4h14"/><path d="M6.6 16.5v2h2.2v-2"/><path d="M15.2 16.5v2h2.2v-2"/>', 1.8),
  queue: ico('<rect x="4" y="4" width="16" height="4.4" rx="1"/><rect x="4" y="10" width="16" height="4.4" rx="1"/><path d="M4 18.6h10"/>', 1.8),
  trip: ico('<path d="M5 3.6h9.6L19 8v12.4H5z"/><path d="M14.2 3.6V8H19"/><path d="M8 12.4h7"/><path d="M8 16h4.6"/>', 1.8),
  cmd: ico('<rect x="3" y="4.5" width="18" height="15" rx="1.6"/><path d="m7 10 3 2.5L7 15"/><path d="M12.5 15H17"/>', 1.8),
  expand: ico('<path d="M14.5 4h5.5v5.5"/><path d="M20 4l-6.2 6.2"/><path d="M9.5 20H4v-5.5"/><path d="M4 20l6.2-6.2"/>', 1.8),
  check: ico('<path d="M4.8 12.6 9 16.8 19.2 6.6"/>', 2.6),
  clock: ico('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.4V12l3 1.9"/>', 1.9),
  alert: ico('<circle cx="12" cy="12" r="8.6"/><path d="M12 7.8v5.2"/><path d="M12 16.2v.1"/>', 1.7),
  okc: ico('<circle cx="12" cy="12" r="8.6"/><path d="m8.2 12.3 2.6 2.6 5-5.2"/>', 1.7),
  avatar: ico('<circle cx="12" cy="8.6" r="3.9"/><path d="M4.6 20.4a7.6 7.6 0 0 1 14.8 0"/>', 1.8),
  plus: ico('<path d="M12 5v14"/><path d="M5 12h14"/>', 2),
  close: ico('<path d="m6.5 6.5 11 11"/><path d="m17.5 6.5-11 11"/>', 1.9),
  menu: ico('<path d="M4 6.5h16"/><path d="M4 12h16"/><path d="M4 17.5h16"/>', 1.9),
};

// the small green "done" disc
export const checkDisc = (cls = '') => `<svg class="sr-cd ${cls}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11"/><path d="M6.6 12.4 10.4 16.2 17.4 8.4"/></svg>`;

// the length caps every string below is held to (the desk is laid out to show each one whole). respWrap is the cap
// for a command-pane line longer than resp (the 3DOCS SSR, the *T ticket line): it wraps at the pane width the way
// Sabre's display continues a line.
export const CAPS = { reason: 22, says: 60, cause: 44, solution: 22, cmd: 24, resp: 40, respWrap: 64, reply: 95, relCode: 12, relText: 80,
  relWhen: 12, task: 48, disposition: 18, rule: 26, step: 26 };

// ================================= DATA (sourced) =================================
export const PLACEHOLDER = false;

// ---------- the three PNRs the main pane works, in order ----------
// Each one drives: the PNR header (locator, name, segments, ticket), the rule panel's two statements, the pressed
// action, the command typed into the Sabre entry line and its response, the traveler / superbot lines, the PNR
// task that flips to DONE, and the disposition its queue row lands on.
export const CASES = [
  {
    // (a) SCHEDULE CHANGE. AeroRoutes 13JUL26: eff 25OCT26 UA852 from Taipei shifts from daytime to evening,
    // "UA852 TPE2320 - 1900SFO 777" and "UA872 TPE1110 - 0645SFO 77W" (schedule 01NOV26 to 13MAR27).
    // Today (Sep 2026) UA852 is scheduled 14:30 TPE, 11:15 SFO (planemapper). 11:15 to 19:00 is 7 h 45 later on
    // arrival, past the 6 h international line of 14 CFR 260.2 "significantly delayed or changed flight".
    // TK = "Schedule Change. Advise passenger of new scheduled times." (Travelport) / "Confirming, advise passenger
    // of new times" (Amadeus). 03NOV26 is a Tuesday, Sabre weekday digit 2. The entry cancels segment 1 and sells one
    // Y seat from availability line 1 ("X1‡02Y1 Cancel segment 1 and rebook 2 seats from line number 1 of
    // availability", Sabre quick reference), so the new UA872 segment prints as segment 1. Every segment line in the
    // command pane uses the layout of Sabre's own *I itinerary display (Basic Pricing quick reference: "1 LH 400Y 02FEB 4
    // FRAJFK SS1 1025 1315"): segment, carrier + flight + class, date, weekday digit, city pair, status + count, times.
    pnr: 'HVQTRM',
    name: 'BENNETT/NORA MS',
    initials: 'NB',
    pax: `1${NB}ADT`,
    segs: [
      { flt: 'UA 852', cls: 'Y', date: '03NOV', from: 'TPE', to: 'SFO', st: 'TK1', dep: '2320', arr: '1900', eq: '777' },
    ],
    prefix: '016',
    ticket: '016 2418 390517',
    reason: 'Schedule change UA852',
    says: 'My Nov 3 Taipei flight now leaves at 11:20 PM?',
    cause: 'UA852 retimed to 23:20 from 25OCT26',
    solutions: ['Accept TK change', 'Rebook UA872', 'Refund, 14 CFR 260'],
    press: 1,
    cmd: 'X1‡01Y1',
    resp: ['1 UA 872Y 03NOV 2 TPESFO SS1 1110 0645'],
    reply: 'Moved you to UA872: leaves Taipei 11:10 AM Nov 3, lands SFO 6:45 AM the same day.',
    related: [
      ['14 CFR 260.2', `International arrival 6+${NB}h later is a significant change, refund if declined`, 'Apr 26, 2024'],
      ['AeroRoutes', 'UA852 from Taipei shifts from daytime to evening hours, eff 25OCT26', 'Jul 13, 2026'],
    ],
    task: 'Schedule change · Rebooked UA872 · Reissued',
    disposition: 'Rebooked UA872',
    src: [
      'https://www.aeroroutes.com/eng/260713-uanw26inc',
      'https://www.planemapper.com/flights/UA852',
      'https://www.ecfr.gov/current/title-14/section-260.2',
      'https://support.travelport.com/webhelp/uapi/Content/Air/Shared_Air_Topics/PNR_Status_Codes.htm',
      'https://airts.ru/upload/Manuals_and_Installers/Manuals/en/Building_PNR.PDF',
      'https://idoc.pub/documents/sabre-quick-reference-k6nqm1w8pp4w',
      'https://airts.ru/upload/Manuals_and_Installers/Manuals/en/Queue_Numbers.pdf',
      'https://www.iata-codes.com/en/airline-prefixes',
    ],
  },
  {
    // (b) COMPENSATION. LH440 FRA-IAH on Wed 02 Sep 2026: scheduled 10:00 CEST / 13:35 CDT, flown 15:15 / 18:14
    // on D-ABVY (Boeing 747-400) per planemapper history: arrival 4 h 39 min late. FRA-IAH great circle
    // 8,402 km (haversine on OurAirports EDDF/KIAH). Regulation (EC) 261/2004 as in force (the 2026 reform was
    // adopted 13 Jul 2026 but applies only 12 months and 20 days after OJ publication): over 3,500 km and
    // 4 hours or more late = EUR 600 (Your Europe table). Departure from the EU, so EU261 applies to any carrier.
    // The entry displays the PNR's ticket field (*T), the e-ticket the claim quotes, in the layout of Sabre's Issue
    // Tickets quick reference ("1.T-10FEB-C6E1*AET" / "2.TK 0254692507094-AT SMITH/J C6E1*AET 2332/8FEB I"; TE =
    // electronic ticket, I = international). The issue date / time belong to the fictional booking, the pseudo city
    // code T3K7 and the sine ASB to the agent (superbot).
    pnr: 'QBRLMN',
    name: 'REED/MARCUS MR',
    initials: 'MR',
    pax: `1${NB}ADT`,
    segs: [
      { flt: 'LH 440', cls: 'Y', date: '02SEP', from: 'FRA', to: 'IAH', st: 'HK1', dep: '1000', arr: '1335', eq: '744' },
    ],
    prefix: '220',
    ticket: '220 2418 552903',
    reason: 'EU261 claim LH440',
    says: 'LH440 on Sep 2 got me into Houston at 6:14 PM.',
    cause: `EU261 Art. 7: 8,402${NB}km, 4${NB}h 39${NB}min late`,
    solutions: ['Check delay cause', 'File EU261 claim', 'Offer travel credit'],
    press: 1,
    cmd: '*T',
    resp: ['1.T-14AUG-T3K7*ASB', '2.TE 2202418552903-AT REED/M T3K7*ASB 1402/14AUG I'],
    reply: `Filed your EU261 claim with Lufthansa for EUR${NB}600: 8,402${NB}km, landed 4${NB}h 39${NB}min late.`,
    related: [
      ['EU261 Art. 7', `Over 3,500${NB}km and 4${NB}hours or more late on arrival: EUR${NB}600`, 'In force'],
      ['EU reform', `Adopted 13 Jul 2026, applies 12${NB}months and 20${NB}days after OJ publication`, 'Jul 13, 2026'],
    ],
    task: 'Delay claim · EU261 · Filed with Lufthansa',
    disposition: `Claim EUR${NB}600`,
    src: [
      'https://www.planemapper.com/flights/LH440',
      'https://ourairports.com/data/airports.csv',
      'https://europa.eu/youreurope/citizens/travel/passenger-rights/air/index_en.htm',
      'https://www.consilium.europa.eu/en/press/press-releases/2026/07/13/council-gives-final-clearance-for-stronger-air-passenger-rights/',
      'https://airts.ru/upload/Manuals_and_Installers/Manuals/en/Issue_Tickets.pdf',
      'https://www.iata-codes.com/en/airline-prefixes',
    ],
  },
  {
    // (c) ENTRY DOCUMENT. US passport holder on UA934 EWR-LHR Tue 13 Oct 2026 (summer season, before 25OCT):
    // the daytime flight, scheduled 08:20 EDT, 20:40 BST same day, Boeing 767-300 (planemapper, daily).
    // superbot adds the passport SSR in the Sabre field order of "3DOCS/P/AU/M2345678/AU/30JUN73/M/14APR20/BAKER/JOHN/
    // MICHAEL-1.1" (Qantas Agency Connect, Sabre formats: document type P, issuing country, number, nationality, date of
    // birth, gender, expiry, surname/first, name number), then ends and redisplays the PNR (ER); the response shows the
    // segment and the new DOCS line. GOV.UK: "You usually need an ETA rather than a visa if you're from Europe, the
    // USA..."; "It costs £20 to apply online or through the UK ETA app"; "usually get a decision by email within a
    // day, but it can take up to 3 working days". It points to gov.uk/eta, the official page, never a reseller
    // ("Other websites may charge more to apply").
    pnr: 'ZKWTPA',
    name: 'SHAH/PRIYA MS',
    initials: 'PS',
    pax: `1${NB}ADT`,
    segs: [
      { flt: 'UA 934', cls: 'Y', date: '13OCT', from: 'EWR', to: 'LHR', st: 'HK1', dep: '0820', arr: '2040', eq: '763' },
    ],
    prefix: '016',
    ticket: '016 2418 774160',
    reason: 'UK ETA, US passport',
    says: 'Anything I need before London on Oct 13?',
    cause: 'US passports need a UK ETA, £20 on GOV.UK',
    solutions: ['Check passport SSR', 'Add DOCS, flag ETA', 'Request seat'],
    press: 1,
    cmd: 'ER',
    resp: ['1 UA 934Y 13OCT 2 EWRLHR HK1 0820 2040', '3DOCS/P/US/A47203915/US/14MAR88/F/09JUN31/SHAH/PRIYA-1.1'],
    reply: 'You need a UK ETA before Oct 13. Apply at gov.uk/eta, it costs £20, usually decided in a day.',
    related: [
      ['GOV.UK ETA', 'It costs £20 to apply online or through the UK ETA app', 'Sep 29, 2026'],
      ['GOV.UK ETA', `Lasts 2${NB}years or until the passport expires, whichever is sooner`, 'Sep 29, 2026'],
    ],
    task: 'Entry docs · UK ETA · DOCS added',
    disposition: 'ETA link sent',
    src: [
      'https://www.planemapper.com/flights/UA934',
      'https://www.gov.uk/eta',
      'https://www.gov.uk/eta/apply',
      'https://agencyconnect.qantas.com/en/policies/agent-information/gds-formats/sabre',
      'https://airts.ru/upload/Manuals_and_Installers/Manuals/en/Building_PNR.PDF',
      'https://www.iata-codes.com/en/airline-prefixes',
    ],
  },
];

// ---------- the Sabre queues: 12 PNRs, newest first ----------
// wait / tIn / tAns / tRes / call copied verbatim from the source desk (fictional desk timings; see sabre.js ANSWER /
// WINS: the three rows with `call` are opened exactly when their PNR takes the main pane and are done when its task
// closes). Every row is Queued, then Working, then Done. Rows 3 to 11: real United NW26 changes (AeroRoutes 13JUL26 /
// 17MAY26) and real rules.
// q: the standard Sabre queue the row sits on, only where sourced: Q6 "Airline schedule changes beyond 17 days" (Sabre
// Queue Numbers quick reference). Every schedule-change row's flight is on or after 24OCT26, 25 days or more after the
// desk's Sep 29, 2026, so it is Q6, never Q5 ("within 17 days"). The claim, ETA and 24 h rows carry no number.
// disp: the footer counts a row as "Rebooked" when its disp contains "rebook" and as "Claims filed" when it contains
// "claim" (sabre.js counts them from these strings).
export const QUEUE = [
  { pnr: 'HVQTRM', name: 'BENNETT/NORA MS', initials: 'NB', reason: 'Schedule change UA852', wait: '0:12', tIn: 8.70, tAns: 8.90, tRes: 11.06, disp: 'Rebooked UA872', call: 0, q: 6 },
  { pnr: 'QBRLMN', name: 'REED/MARCUS MR', initials: 'MR', reason: 'EU261 claim LH440', wait: '0:21', tIn: 9.30, tAns: 11.60, tRes: 13.52, disp: `Claim EUR${NB}600`, call: 1 },
  { pnr: 'ZKWTPA', name: 'SHAH/PRIYA MS', initials: 'PS', reason: 'UK ETA, US passport', wait: '0:34', tIn: 9.90, tAns: 14.00, tRes: 15.68, disp: 'ETA link sent', call: 2 },
  { pnr: 'MWXKDP', name: 'WHITFIELD/DANA MS', initials: 'DW', reason: 'EWR-VCE off 24OCT', wait: '0:46', tIn: 10.40, tAns: 10.95, tRes: 12.60, disp: 'Refunded', q: 6 },
  { pnr: 'TRNBQE', name: 'PIKE/OWEN MR', initials: 'OP', reason: 'IAD-EDI off till 04MAR', wait: '1:02', tIn: 10.90, tAns: 11.35, tRes: 13.10, disp: 'Refunded', q: 6 },
  { pnr: 'GJVLSA', name: 'LIN/GRACE MS', initials: 'GL', reason: 'UA805 now 777-200ER', wait: '1:18', tIn: 11.40, tAns: 11.80, tRes: 13.45, disp: 'Seats reassigned', q: 6 },
  { pnr: 'KDFZRY', name: 'ALVAREZ/TOM MR', initials: 'TA', reason: 'IAH-EZE paused 24OCT', wait: '1:31', tIn: 11.90, tAns: 12.30, tRes: 14.20, disp: 'Rebooked', q: 6 },
  { pnr: 'PLCHWU', name: 'KIM/RACHEL MS', initials: 'RK', reason: 'UA058 now 777-200ER', wait: '1:44', tIn: 12.40, tAns: 12.85, tRes: 14.55, disp: 'Seats reassigned', q: 6 },
  { pnr: 'BXQTMJ', name: 'IDRIS/HASSAN MR', initials: 'HI', reason: `24${NB}h free cancel`, wait: '1:56', tIn: 12.90, tAns: 13.35, tRes: 15.20, disp: 'Cancelled, no fee' },
  { pnr: 'SVHNDK', name: 'NOVAK/ERIN MS', initials: 'EN', reason: 'EWR-FRA 11 to 7 wkly', wait: '2:08', tIn: 13.40, tAns: 13.85, tRes: 15.60, disp: 'Rebooked', q: 6 },
  { pnr: 'YQMRLF', name: 'MORENO/LUIS MR', initials: 'LM', reason: 'UK ETA, US passport', wait: '2:19', tIn: 13.90, tAns: 14.35, tRes: 15.92, disp: 'ETA link sent' },
  { pnr: 'NZCTWG', name: 'COTTRELL/BEA MS', initials: 'BC', reason: 'ORD-CDG now 787-10', wait: '2:31', tIn: 14.40, tAns: 14.75, tRes: 16.02, disp: 'Seats reassigned', q: 6 },
];

// ---------- past PNR work superbot reads on the LEARN beat: [traveler, reason, action, result, handle] ----------
// Reasons are real events: United NW26 filings (AeroRoutes), real flown delays (planemapper history: LH440 02SEP
// +4:39, VS19 01SEP +3:11, UA989 27AUG +2:52) and real rules. VS19 LHR-SFO 8,616 km, 3 to 4 h late: GBP 260 (CAA).
// UA989 IAD-FRA: under 3 h and a non-EU carrier flying into the EU, so no EU261. Handle times: fictional desk timings,
// copied in order from the source desk.
export const ACTIVITY = [
  ['WHITFIELD/DANA MS', 'EWR-VCE off 24OCT', 'Refund, 14 CFR 260', 'Refunded', '4:12'],
  ['PIKE/OWEN MR', 'IAD-EDI off till 04MAR', 'Refund, 14 CFR 260', 'Refunded', '2:47'],
  ['LIN/GRACE MS', `LH440 4${NB}h 39 late`, 'File EU261 claim', `EUR${NB}600 claimed`, '6:03'],
  ['KIM/RACHEL MS', `UA989 2${NB}h 52 late`, 'Check EU261', 'Not eligible', '1:58'],
  ['ALVAREZ/TOM MR', `VS19 3${NB}h 11 late`, 'File UK261 claim', `GBP${NB}260 claimed`, '5:21'],
  ['IDRIS/HASSAN MR', 'UK ETA, US passport', 'Add DOCS, flag ETA', 'ETA link sent', '3:34'],
  ['NOVAK/ERIN MS', `24${NB}h free cancel`, `Cancel within 24${NB}h`, 'No fee', '4:48'],
  ['MORENO/LUIS MR', 'UA805 now 777-200ER', 'Recheck seat map', 'Seats reassigned', '2:16'],
  ['COTTRELL/BEA MS', 'IAH-EZE paused 24OCT', 'Rebook, 14 CFR 260', 'Rebooked', '7:02'],
  ['IYER/SAM MR', 'UA852 retimed 25OCT', 'Rebook, 14 CFR 260', 'Rebooked', '2:39'],
  ['FONTAINE/JULES MR', 'UK ETA, US passport', 'Add DOCS, flag ETA', 'ETA link sent', '3:11'],
  ['REED/MARCUS MR', 'SFO-CDG paused 05JAN', 'Refund, 14 CFR 260', 'Refunded', '5:55'],
  ['SHAH/PRIYA MS', 'IAD-LIS paused 05JAN', 'Rebook, 14 CFR 260', 'Rebooked', '4:05'],
  ['BENNETT/NORA MS', 'IAD-MAD paused 05JAN', 'Refund, 14 CFR 260', 'Refunded', '2:52'],
];

// ---------- what the HUD lifts out of those rows on the LEARN beat: four real rules, and where each is published ----------
export const RULES = [
  `DOT: 6${NB}h intl = refund`,
  `EUR${NB}600: 3,500${NB}km+, 4${NB}h+`,
  'UK ETA: £20, gov.uk only',
  `24${NB}h free cancel, 7+${NB}days`,
];

export const RULE_SRC = [
  { label: RULES[0], cite: `14 CFR 260.2, significantly delayed or changed flight (6${NB}hours or more, international)`, url: 'https://www.ecfr.gov/current/title-14/section-260.2' },
  { label: RULES[1], cite: `Regulation (EC) No 261/2004 Art. 7, as summarised on Your Europe: EUR${NB}600 for more than 3,500${NB}km when the arrival is 4${NB}hours or more late ("600 More than 3 500${NB}km (non-EU countries) 4${NB}hours or more")`, url: 'https://europa.eu/youreurope/citizens/travel/passenger-rights/air/index_en.htm' },
  { label: RULES[2], cite: 'GOV.UK, Get an electronic travel authorisation (ETA): "An ETA costs £20."', url: 'https://www.gov.uk/eta' },
  { label: RULES[3], cite: `14 CFR 259.5(b)(4), hold or cancel without penalty for 24${NB}hours if booked one week or more before departure`, url: 'https://www.ecfr.gov/current/title-14/section-259.5' },
];

// ---------- the standard Sabre queue numbers the queue rows carry (QUEUE[].q) ----------
export const QUEUE_NO = {
  6: { label: `Airline schedule changes beyond 17${NB}days`, url: 'https://airts.ru/upload/Manuals_and_Installers/Manuals/en/Queue_Numbers.pdf' },
};

// ---------- the four HUD checklist rows ('14' = ACTIVITY.length) ----------
export const STEPS = [
  'Signed in to Sabre',
  'Remarks style matched',
  `Read ${ACTIVITY.length}${NB}past PNRs`,
  'Working your queues',
];

// ---------- the header the desk carries when no PNR is displayed (same keys as the source IDLE) ----------
export const IDLE = {
  name: 'No PNR displayed',
  account: 'Awaiting record locator',
  plan: '',
  phone: '',
  tenure: '',
  city: '',
  temp: '',
  date: 'Tue, Sep 29, 2026',
  time: '9:12 AM ET',
};

// ---------- older, already-worked queue items: both filed in United's 17MAY26 schedule update (AeroRoutes) ----------
export const OLD_ITEMS = [
  ['Schedule change · IAD-EDI cancelled', 'May 17, 2026', 'PXDLNW'],
  ['Schedule change · EWR-VCE cancelled', 'May 17, 2026', 'TJMRQE'],
];
// ================================ end of DATA ================================

export const NBSP = NB;

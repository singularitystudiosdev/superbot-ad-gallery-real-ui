// qx-ui.js: the Qualtrics desk's own chrome: its icons and its UI strings. Kept apart from qx-data.js, whose survey
// content comes from the research (never hand-edited here); nothing in this file is survey content, and every count
// it formats is handed in from qx-data.js by the caller.
//
// Strings: the Qualtrics labels (Q below) are verbatim from Qualtrics' own support pages; each one is listed with the
// page it came from in the reference folder kept outside the repo (.tmp/mr-ad.5aa2de03/ref/strings.txt). The rest
// (S below) is the spot's own copy, written for this ad, never presented as Qualtrics UI text. No em or en dashes.
// Icons: plain UI glyphs drawn for this rebuild in one stroke style (no Qualtrics icon artwork is copied).
import { QUEUE } from './qx-data.js';

const g = (body, cls = 'qx-i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;

export const I = {
  chevronDown: g('<path d="M6.5 9.5 12 15l5.5-5.5"/>'),
  chevronRight: g('<path d="M9.5 6.5 15 12l-5.5 5.5"/>'),
  search: g('<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>'),
  help: g('<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6"/><path d="M12 16.9v.2"/>'),
  bell: g('<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z"/><path d="M10.2 20a2 2 0 0 0 3.6 0"/>'),
  menu: g('<path d="M4.5 7h15M4.5 12h15M4.5 17h15"/>'),
  grid: g('<path d="M5 5h3v3H5zM10.5 5h3v3h-3zM16 5h3v3h-3zM5 10.5h3v3H5zM10.5 10.5h3v3h-3zM16 10.5h3v3h-3zM5 16h3v3H5zM10.5 16h3v3h-3zM16 16h3v3h-3z"/>'),
  gear: g('<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6"/>'),
  check: g('<path d="m5.5 12.5 4.2 4.2 8.8-9.2"/>'),
  close: g('<path d="m7 7 10 10M17 7 7 17"/>'),
  table: g('<rect x="4" y="5" width="16" height="14" rx="1"/><path d="M4 10h16M10 10v9"/>'),
  text: g('<path d="M6 6.5h12M12 6.5V18M9.5 18h5"/>'),
  plus: g('<path d="M12 6v12M6 12h12"/>'),
  info: g('<circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 8v.2"/>'),
  download: g('<path d="M12 4.5v10M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>'),
  cols: g('<path d="M7 5v14M12 5v14M17 5v14"/>'),
  rows: g('<path d="M5 7h14M5 12h14M5 17h14"/>'),
  list: g('<path d="M9 7h10M9 12h10M9 17h10M5 7h.5M5 12h.5M5 17h.5"/>'),
  // circles drawn as SVG (an avatar disc, a selected radio), so the stylesheet keeps its two radii
  dot: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12"/></svg>',
  radio: '<svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="7" cy="7" r="3.2" fill="currentColor"/></svg>',
  dots: g('<circle cx="6.5" cy="12" r="1.1"/><circle cx="12" cy="12" r="1.1"/><circle cx="17.5" cy="12" r="1.1"/>'),
  // superbot's HUD check (the call-center spot's stroke glyph)
  hudCheck: '<svg class="qx-hi" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.8 12.6 9 16.8 19.2 6.6"/></svg>',
};

const N = QUEUE.length;

// Qualtrics' own labels (verbatim; the URL of each is in ref/strings.txt)
export const Q = {
  // project tabs and the current Data & Analysis sub-tabs (screenshot: the Data & Analysis overview's banner)
  navSurvey: 'Survey',
  navWorkflows: 'Workflows',
  navDist: 'Distributions',
  navData: 'Data & Analysis',
  navResults: 'Results',
  navReports: 'Reports',
  subData: 'Data',
  subText: 'Text iQ',
  subStats: 'Stats iQ',
  subCrosstabs: 'Crosstabs iQ',
  subWeighting: 'Weighting',
  subAV: 'Audio & Video',
  // the Crosstabs toolbar and its three boxes (screenshots)
  newCrosstab: 'New Crosstab',
  addFilter: 'Add Filter',
  responses: 'Responses:',
  export: 'Export',
  settings: 'Settings',
  banner: 'Columns (Banner)',
  stub: 'Rows (Stubs)',
  dragHere: 'Drag variables here',
  cells: 'Cells',
  cellList: ['Counts', 'Column Percentages (All)', 'Column Stat Tests (All)'],
  cellOn: ['Column Percentages (All)', 'Column Stat Tests (All)'],
  weights: 'Weights',
  // the report editor's toolbar (screenshot: the Advanced-Reports toolbar)
  report: 'Report',
  menus: ['File', 'Share', 'Edit', 'View', 'Insert'],
  responsesN: (n) => `${n} Responses`,
  insert: 'Insert',
  options: 'Options',
  saved: 'Saved less than a minute ago',
  // the table
  stubPrefix: 'Stub:',
  total: 'Total',
};

// the spot's own copy
export const STR = {
  productXM: 'Qualtrics XM',
  navData: Q.navData,
  subCrosstabs: Q.subCrosstabs,
  author: 'Sam',
  // the saved-crosstab list (the tab plan) and its statuses
  plan: 'Tab plan',
  queued: 'queued',
  tabbed: 'tabbed',
  inReport: 'in report',
  planClear: 'Tab plan clear',
  inReportOf: (n, of) => `${n} / ${of} in report`,
  crosstabsWord: 'saved crosstabs',
  listEmpty: 'Saved crosstabs land here.',
  // the crosstab
  idleTitle: 'No crosstab open',
  idleHint: 'Open a saved crosstab to run it.',
  questionAsks: 'The question asks',
  baseLine: (base, n) => `Base: ${base} · n = ${n}`,
  unweighted: 'Unweighted n',
  sigNote: 'Letters mark a column significantly higher than the lettered column.',
  // the report page
  report: 'Topline report',
  reportEmpty: 'Findings you add to the report land on this page.',
  addToReport: 'Add to report',
  added: 'Added to report',
  fedCheck: 'Fed report check',
  published: 'Published',
  crosstab: 'Crosstab',
  match: 'Match',
  checking: 'Checking',
  // the codebook (LEARN)
  codebookTitle: 'What the codebook says',
  notesRead: 'notes read',
  colNote: 'Note',
  colSrc: 'Source',
  codebookEmpty: 'No codebook notes loaded.',
  // the footer's counters
  fTabbed: 'Questions tabbed',
  fCells: 'Cells tested',
  fMatched: 'Matched to published',
  // superbot's HUD
  hud: ['Opening your survey data in Qualtrics', 'Qualtrics connected, tab plan loading', 'Matching your topline style',
    'Topline style matched', 'Reading the codebook', 'Working the tab plan', `Tab plan clear · ${N} questions in report`],
  laneYou: 'Your toplines',
  laneStyle: 'Topline style',
  hudLearn: 'What the codebook says',
};

// the four HUD checklist rows
export const STEPS = ['Connected to Qualtrics', 'Topline style matched', 'Read the codebook', 'Tabbing questions'];

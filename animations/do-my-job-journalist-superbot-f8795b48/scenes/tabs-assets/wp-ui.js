// wp-ui.js: the WordPress desk's own chrome: its icons and its UI strings. Kept apart from wp-data.js, whose story
// content is generated from the research (never hand-edited); nothing here is story content.
//
// Icons: the editor's are the @wordpress/icons paths the current release renders (read from the live editor DOM in
// a WordPress Playground render of WordPress 7.1.2, /tmp/jr-ad.f8795b48/icons-dom.json; the ones not on that screen
// from packages/icons/src/library at Gutenberg c5cdf2a8, the fill-based set 7.1 ships). The admin bar's are
// Dashicons (github.com/WordPress/dashicons, svg-min). Both are GPL-2.0-or-later; see ../../img/CREDITS.txt.
// The HUD keeps the call-center spot's stroke check (superbot's own chrome, not WordPress's).
//
// Strings: WordPress's are verbatim from Gutenberg / WordPress core source (file and line in
// /tmp/jr-ad.f8795b48/ref/strings.txt); the story-budget statuses are Edit Flow's (editflow.txt there). The rest is
// the spot's own copy. No em or en dashes.
import { STORIES } from './wp-data.js';

const g = (d, vb = '0 0 24 24', extra = '') => `<svg class="wp-i" viewBox="${vb}" aria-hidden="true"${extra}><path d="${d}"/></svg>`;

export const I = {
  // editor header (live DOM)
  back: g('M14.6 7l-1.2-1L8 12l5.4 6 1.2-1-4.6-5z'),
  plus: g('M11 12.5V17.5H12.5V12.5H17.5V11H12.5V6H11V11H6V12.5H11Z'),
  undo: g('M18.3 11.7c-.6-.6-1.4-.9-2.3-.9H6.7l2.9-3.3-1.1-1-4.5 5L8.5 16l1-1-2.7-2.7H16c.5 0 .9.2 1.3.5 1 1 1 3.4 1 4.5v.3h1.5v-.2c0-1.5 0-4.3-1.5-5.7z'),
  redo: g('M15.6 6.5l-1.1 1 2.9 3.3H8c-.9 0-1.7.3-2.3.9-1.4 1.5-1.4 4.2-1.4 5.6v.2h1.5v-.3c0-1.1 0-3.5 1-4.5.3-.3.7-.5 1.3-.5h9.2L14.5 15l1.1 1.1 4.6-4.6-4.6-5z'),
  listView: g('M3 6h11v1.5H3V6Zm3.5 5.5h11V13h-11v-1.5ZM21 17H10v1.5h11V17Z'),
  desktop: g('M20.5 16h-.7V8c0-1.1-.9-2-2-2H6.2c-1.1 0-2 .9-2 2v8h-.7c-.8 0-1.5.7-1.5 1.5h20c0-.8-.7-1.5-1.5-1.5zM5.7 8c0-.3.2-.5.5-.5h11.6c.3 0 .5.2.5.5v7.6H5.7V8z'),
  drawerRight: `<svg class="wp-i" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-4 14.5H6c-.3 0-.5-.2-.5-.5V6c0-.3.2-.5.5-.5h8v13zm4.5-.5c0 .3-.2.5-.5.5h-2.5v-13H18c.3 0 .5.2.5.5v12z"/></svg>`,
  moreVertical: g('M13 19h-2v-2h2v2zm0-6h-2v-2h2v2zm0-6h-2V5h2v2z'),
  post: g('M17.8 2l-.9.3c-.1 0-3.6 1-5.2 2.1C10 5.5 9.3 6.5 8.9 7.1c-.6.9-1.7 4.7-1.7 6.3l-.9 2.3c-.2.4 0 .8.4 1 .1 0 .2.1.3.1.3 0 .6-.2.7-.5l.6-1.5c.3 0 .7-.1 1.2-.2.7-.1 1.4-.3 2.2-.5.8-.2 1.6-.5 2.4-.8.7-.3 1.4-.7 1.9-1.2s.8-1.2 1-1.9c.2-.7.3-1.6.4-2.4.1-.8.1-1.7.2-2.5 0-.8.1-1.5.2-2.1V2zm-1.9 5.6c-.1.8-.2 1.5-.3 2.1-.2.6-.4 1-.6 1.3-.3.3-.8.6-1.4.9-.7.3-1.4.5-2.2.8-.6.2-1.3.3-1.8.4L15 7.5c.3-.3.6-.7 1-1.1 0 .4 0 .8-.1 1.2zM6 20h8v-1.5H6V20z'),
  // the panel toggle arrows (live DOM: chevron-down on a closed panel; chevron-up on an open one)
  chevronDown: g('M17.5 11.6L12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z'),
  chevronUp: g('M6.5 12.4L12 8l5.5 4.4-.9 1.2L12 10l-4.5 3.6-1-1.2z'),
  // library (Gutenberg c5cdf2a8)
  close: g('M12 13.06l3.712 3.713 1.061-1.06L13.061 12l3.712-3.712-1.06-1.06L12 10.938 8.288 7.227l-1.061 1.06L10.939 12l-3.712 3.712 1.06 1.061L12 13.061z'),
  check: g('M16.5 7.5 10 13.9l-2.5-2.4-1 1 3.5 3.6 7.5-7.6z'),
  drafts: `<svg class="wp-i" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 18.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13ZM4 12a8 8 0 1 1 16 0 8 8 0 0 1-16 0Zm8 4a4 4 0 0 0 4-4H8a4 4 0 0 0 4 4Z"/></svg>`,
  pending: `<svg class="wp-i" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 18.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13ZM4 12a8 8 0 1 1 16 0 8 8 0 0 1-16 0Zm8 4a4 4 0 0 1-4-4h4V8a4 4 0 0 1 0 8Z"/></svg>`,
  chevronRight: g('M10.8622 8.04053L14.2805 12.0286L10.8622 16.0167L9.72327 15.0405L12.3049 12.0286L9.72327 9.01672L10.8622 8.04053Z'),
  arrowRight: g('m14.5 6.5-1 1 3.7 3.7H4v1.6h13.2l-3.7 3.7 1 1 5.6-5.5z'),
  // the W mark: Gutenberg's `wordpress` icon (packages/icons/src/library/wordpress.svg at c5cdf2a8), drawn where the
  // admin bar draws its W (the live bar uses the Dashicons font glyph of the same mark)
  wordpress: g('M20 10c0-5.51-4.49-10-10-10C4.48 0 0 4.49 0 10c0 5.52 4.48 10 10 10 5.51 0 10-4.48 10-10zM7.78 15.37L4.37 6.22c.55-.02 1.17-.08 1.17-.08.5-.06.44-1.13-.06-1.11 0 0-1.45.11-2.37.11-.18 0-.37 0-.58-.01C4.12 2.69 6.87 1.11 10 1.11c2.33 0 4.45.87 6.05 2.34-.68-.11-1.65.39-1.65 1.58 0 .74.45 1.36.9 2.1.35.61.55 1.36.55 2.46 0 1.49-1.4 5-1.4 5l-3.03-8.37c.54-.02.82-.17.82-.17.5-.05.44-1.25-.06-1.22 0 0-1.44.12-2.38.12-.87 0-2.33-.12-2.33-.12-.5-.03-.56 1.2-.06 1.22l.92.08 1.26 3.41zM17.41 10c.24-.64.74-1.87.43-4.25.7 1.29 1.05 2.71 1.05 4.25 0 3.29-1.73 6.24-4.4 7.78.97-2.59 1.94-5.2 2.92-7.78zM6.1 18.09C3.12 16.65 1.11 13.53 1.11 10c0-1.3.23-2.48.72-3.59C3.25 10.3 4.67 14.2 6.1 18.09zm4.03-6.63l2.58 6.98c-.86.29-1.76.45-2.71.45-.79 0-1.57-.11-2.29-.33.81-2.38 1.62-4.74 2.42-7.1z', '-2 -2 24 24'),
  // admin bar (Dashicons, 20px grid)
  abSearch: g('M12.14 4.18c1.87 1.87 2.11 4.75.72 6.89.12.1.22.21.36.31.2.16.47.36.81.59.34.24.56.39.66.47.42.31.73.57.94.78.32.32.6.65.84 1 .25.35.44.69.59 1.04.14.35.21.68.18 1-.02.32-.14.59-.36.81s-.49.34-.81.36c-.31.02-.65-.04-.99-.19-.35-.14-.7-.34-1.04-.59-.35-.24-.68-.52-1-.84-.21-.21-.47-.52-.77-.93-.1-.13-.25-.35-.47-.66-.22-.32-.4-.57-.56-.78-.16-.2-.29-.35-.44-.5-2.07 1.09-4.69.76-6.44-.98-2.14-2.15-2.14-5.64 0-7.78 2.15-2.15 5.63-2.15 7.78 0zm-1.41 6.36c1.36-1.37 1.36-3.58 0-4.95-1.37-1.37-3.59-1.37-4.95 0-1.37 1.37-1.37 3.58 0 4.95 1.36 1.37 3.58 1.37 4.95 0z', '0 0 20 20'),
  abComments: g('M5 2h9c1.1 0 2 .9 2 2v7c0 1.1-.9 2-2 2h-2l-5 5v-5H5c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2z', '0 0 20 20'),
  abPlus: g('M17 7v3h-5v5H9v-5H4V7h5V2h3v5h5z', '0 0 20 20'),
  // superbot's HUD check (the call-center spot's stroke glyph)
  hudCheck: '<svg class="wp-hi" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.8 12.6 9 16.8 19.2 6.6"/></svg>',
};

const N = STORIES.length;

export const STR = {
  // WordPress (verbatim; see strings.txt)
  noTitle: 'No title',
  postType: '· Post',
  addTitle: 'Add title',
  typeSlash: 'Type / to choose a block',
  saveDraft: 'Save draft',
  saved: 'Saved',
  submit: 'Submit for Review',
  tabPost: 'Post',
  tabBlock: 'Block',
  rowStatus: 'Status',
  rowSlug: 'Slug',
  statusDraft: 'Draft',
  statusPending: 'Pending',
  categories: 'Categories',
  tags: 'Tags',
  // post-content-information: hidden at 0 words; reading time = round(words / 189), "1 minute" at or under one
  contentInfo: (w) => { const m = Math.round(w / 189); return `${Number(w).toLocaleString('en-US')} ${w === 1 ? 'word' : 'words'}, ${m <= 1 ? '1 minute' : `${m} minutes`} read time.`; },
  crumbPost: 'Post',
  uncategorized: 'Uncategorized',
  crumbPara: 'Paragraph',
  crumbQuote: 'Quote',
  crumbHeading: 'Heading',
  crumbList: 'List',
  snack: 'Draft saved.',
  snackLink: 'View Preview',
  howdy: 'Howdy,',
  newItem: 'New',
  // the signed-in user (admin bar, sign-in card): the hub persona
  author: 'Sam',
  // the newsroom's own fields and panels (the spot's copy)
  rowDateline: 'Dateline',
  factCheck: 'Fact check',
  apStyle: 'AP style',
  fcEmpty: 'Open a story to check its numbers against the release.',
  apEmpty: 'No style fixes yet.',
  fcNone: 'No numbers to check in this story.',
  styleEmpty: 'No Stylebook entries loaded.',
  factsMatch: (n, of) => `${n} of ${of} facts match the release`,
  checking: 'Checking',
  checked: 'Checked',
  // the story budget (Edit Flow's statuses)
  budget: 'Story budget',
  assigned: 'Assigned',
  inProgress: 'In Progress',
  pendingReview: 'Pending Review',
  budgetClear: 'Budget clear',
  storiesWord: 'stories',
  colStory: 'Story',
  colStatus: 'Status',
  budgetEmpty: 'Stories assigned to you land here.',
  // the canvas
  releaseSays: 'The release says',
  headlineOpts: 'Headline options',
  characters: 'characters',
  sources: 'Sources',
  // the Stylebook (LEARN)
  styleTitle: 'AP Stylebook',
  entriesRead: 'entries read',
  colEntry: 'Entry',
  colRule: 'What it says',
  colShort: 'In short',
  // the footer's counters
  fFiled: 'Stories filed',
  fFacts: 'Facts checked',
  fFixes: 'Style fixes',
  // superbot's HUD
  hud: ['Opening your story budget in WordPress', 'WordPress connected, stories loading', 'Matching your writing',
    'Writing style matched', 'Reading the AP Stylebook', 'Filing your stories', `Budget clear · ${N} stories filed`],
  laneYou: 'Your stories',
  laneStyle: 'Writing style',
  hudRules: 'What the AP Stylebook says',
};

// the four HUD checklist rows
export const STEPS = ['Connected to WordPress', 'Writing style matched', 'Learned AP style', 'Filing stories'];

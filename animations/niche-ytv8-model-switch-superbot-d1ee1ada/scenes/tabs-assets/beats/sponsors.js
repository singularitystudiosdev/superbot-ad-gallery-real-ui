// The sponsor job, the ONE source of every text that appears on screen about it: the sponsor emails Gemini sorts
// (beats/watch.js, the inbox), the photo GPT-6 Astra checks (beats/frame.js reads DANA), the drafts Claude Opus 5.5
// writes in Sam's voice (beats/pairs.js, the draft board) and the rate card superbot fills from YouTube Studio
// (beats/studio.js). Never retype one of these strings anywhere else: import it from here.
// Every person and brand is fictional (letter avatars only, no real company names or logos). Display names only: no
// handles, no email addresses, no times or dates anywhere. The prices are the creator's own asks, never earnings.

export const CREATOR = 'Sam Rivera';
export const CHANNEL = 'Budget audio gear reviews';

// the category labels, in group order, each a coloured dot + plain text (never a pill or a chip)
export const CATS = {
  good: { label: 'Good fit', count: 4, c: '#34d399' },
  details: { label: 'Needs details', count: 6, c: '#fbbc04' },
  pass: { label: 'Not a fit', count: 9, c: '#9aa0a6' },
  scam: { label: 'Scam', count: 4, c: '#f28b82' },
};
export const CAT_ORDER = ['good', 'details', 'pass', 'scam'];

// the sponsor emails, in the order the drafts are written (and the order they sort into): sender, brand, the email
// line shown, category, avatar colour, the draft (null: no reply)
export const EMAILS = [
  { id: 'dana', sender: 'Dana Kim', brand: 'Hollow Oak Audio', line: 'Would you review our new HX-2 dynamic mic in a paid video?', cat: 'good', c: '#e8710a',
    draft: 'Hi Dana, the HX-2 fits my budget mic tests. A dedicated review is $9,500, rate card attached.' },
  { id: 'ines', sender: 'Ines Duarte', brand: 'Kitepath VPN', line: 'We\'d love a 60 second read in your next video. Budget is $3,000.', cat: 'good', c: '#1967d2',
    draft: 'Hi Ines, thanks! My integrated segment is $3,800. Rate card attached, send the brief if that works.' },
  { id: 'theo', sender: 'Theo Marsh', brand: 'Lumen Desk', line: 'Collab on a desk lamp for your next setup video?', cat: 'details', c: '#00897b',
    draft: 'Hi Theo, sounds fun. What budget do you have in mind? Rate card attached.' },
  { id: 'maya', sender: 'Maya Chen', brand: 'Fernway Coffee', line: 'Coffee subscription partnership for your channel?', cat: 'pass', c: '#9334e6',
    draft: 'Hi Maya, thank you! Coffee is outside what my audience watches for, so I\'ll pass this time.' },
  { id: 'viral', sender: 'Brand Deals Team', brand: 'ViralBoost Media', line: 'Your brand deal contract is ready. Open contract.exe to sign.', cat: 'scam', c: '#d01884',
    draft: null },
];
// the order the emails sit in the inbox before Gemini sorts them (indexes into EMAILS)
export const INBOX_ORDER = [2, 4, 0, 3, 1];
export const SCAM_NOTE = 'No reply. Flagged as a scam: the contract is an .exe file.';

export const INBOX_TITLE = 'Sponsor emails';
export const SORTING = 'Sorting 23 sponsor emails';
export const SORTED = 'Sorted 23 sponsor emails into 4 groups';
export const DRAFTS_DONE = '3 replies drafted, 1 polite pass, 1 scam flagged';

// GPT-6 Astra: the photo Dana attached (img/mic-frame.jpg)
export const DANA = EMAILS[0];
export const PHOTO_LINE = 'Dana attached a photo of the HX-2';
export const PHOTO_VERDICT = 'Fits your channel: a budget dynamic mic';

// the rate card, filled from YouTube Studio
export const RATE = {
  title: 'Rate card',
  statsHead: 'Channel stats',
  source: 'From YouTube Studio',
  stats: [
    ['Subscribers', '212K'],
    ['Average views per video', '86K'],
    ['Top countries', 'US 41%, UK 12%, Canada 8%'],
    ['Viewers aged 18 to 34', '68%'],
  ],
  pricesHead: 'Prices',
  prices: [
    ['Integrated segment', '$3,800'],
    ['Dedicated review video', '$9,500'],
    ['YouTube Short', '$1,600'],
    ['Link in a pinned comment', '$500'],
  ],
  foot: 'Prices based on 86K average views per video.',
  done: 'Rate card attached to 3 drafts',
};

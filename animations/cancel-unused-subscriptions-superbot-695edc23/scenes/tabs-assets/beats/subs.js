// cancel-unused-subscriptions: the facts every beat shares, written once so a name, date or price never drifts between
// scenes. statement_sep.pdf (the September statement, 6 pages) holds 214 transactions; 9 are subscriptions and these 4
// have not been used for 60+ days. Prices are monthly; the savings are their sum ($48.93) and twelve times it ($587.16).
// Accents are each service's own colour, used for its name as plain text (no logo artwork): Peacock #fccc12 (its
// yellow), Audible #f7991c, Calm #60b4e7 (the light end of its #60b4e7 to #6461e0 gradient, legible on the dark chat),
// NYT Cooking #df321b (brightened to #f0503a on the dark chat). Button labels are the ones each account page uses.
import { esc } from '../../../lib.js';

export const ASK = "cancel the subscriptions i don't use";
export const PDF = { file: 'statement_sep.pdf', pages: 6 };
export const SCAN = { tx: 214, subs: 9, unused: 4, days: 60 };

export const SUBS = [
  { id: 'peacock', name: 'Peacock', plan: 'Premium', price: 13.99, last: 'Jun 28', c: '#fccc12',
    host: 'peacocktv.com/account', page: 'Plans & Payment', pp: 'Premium', btn: 'Cancel Plan' },
  { id: 'audible', name: 'Audible', plan: 'Premium Plus', price: 14.95, last: 'May 3', c: '#f7991c',
    host: 'audible.com/account', page: 'Account Details', pp: 'Premium Plus', btn: 'Cancel membership' },
  { id: 'calm', name: 'Calm', plan: '', price: 14.99, last: 'Mar 11', c: '#60b4e7',
    host: 'calm.com/settings', page: 'Manage Subscription', pp: 'Calm Premium', btn: 'Cancel Subscription' },
  { id: 'nyt', name: 'NYT Cooking', plan: '', price: 5.0, last: 'Jul 2', c: '#f0503a',
    host: 'myaccount.nytimes.com', page: 'Subscription overview', pp: 'Cooking', btn: 'Cancel subscription' },
];
export const MONTHLY = 48.93;
export const YEARLY = 587.16;
export const money = (v) => '$' + v.toFixed(2);

// the Superbot beat writes the moments each row flips to Cancelled; DeepSeek's rows read them while rendering
export const CLOCK = { flips: [] };

const PDF_ICON = '<svg class="sb-pdf-svg" viewBox="0 0 28 34" aria-hidden="true">'
  + '<path d="M4 1h14l8 8v22a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z" fill="#f1f1f3"/>'
  + '<path d="M18 1v6a2 2 0 0 0 2 2h6z" fill="#c9c9ce"/>'
  + '<path d="M6 8.5h8M6 12h14M6 29h14" stroke="#c4c4c9" stroke-width="1.3"/>'
  + '<rect x="0" y="15.5" width="21" height="10" rx="2" fill="#e5484d"/>'
  + '<text x="10.5" y="23.3" text-anchor="middle" font-size="7.2" font-weight="800" fill="#fff" font-family="Inter,Helvetica,Arial,sans-serif">PDF</text>'
  + '</svg>';

/** the statement attachment: in the composer before send, on the sent message after */
export function pdfChipHTML(cls = '') {
  return `<span class="sb-pdf ${cls}"><span class="sb-pdf-ic">${PDF_ICON}</span><span class="vr-att-t"><b>${esc(PDF.file)}</b><small>PDF · ${PDF.pages} pages</small></span></span>`;
}
export const pdfIcon = () => PDF_ICON;

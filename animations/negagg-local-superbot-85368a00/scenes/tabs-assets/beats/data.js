// The numbers every beat of the spot talks about, so the thread visibly carries over: the September statement's
// category breakdown (beats/spend.js) has a Subscriptions line of $94, the subscription audit (beats/subs.js) lists the
// five subscriptions that make up exactly that $94, and the two unused ones it flags ($31 a month) are the ones the
// cancel beat (beats/cancel.js) closes. Everything here is invented demo content: the statement, the service names and
// the prices. check() asserts the sums at load, so a typo can never ship.
export const FILE = { name: 'statement-sept.pdf', tx: 86 };

// the breakdown of the statement's 86 transactions; the bars are each category's share of TOTAL
export const CATS = [
  { k: 'rent', label: 'Rent', amt: 1450, color: '#5d91ec' },
  { k: 'groc', label: 'Groceries', amt: 412, color: '#34d399' },
  { k: 'eat', label: 'Eating out', amt: 286, color: '#f5a524' },
  { k: 'trans', label: 'Transport', amt: 128, color: '#b269e8' },
  { k: 'subs', label: 'Subscriptions', amt: 94, color: '#00e5c3' },
  { k: 'other', label: 'Other', amt: 230, color: '#8e8e93' },
];
export const TOTAL = CATS.reduce((s, c) => s + c.amt, 0); // 2,600

// the five subscriptions behind the $94 line; `last` is when it was last used, `idle` flags the two unused 3+ months
export const SUBS = [
  { name: 'Northlight Video', kind: 'Video streaming', price: 28, last: 'Used today', icon: 'play', idle: false },
  { name: 'Tunebird Music', kind: 'Music streaming', price: 16, last: 'Used yesterday', icon: 'note', idle: false },
  { name: 'Skyvault Storage', kind: 'Cloud storage', price: 19, last: 'Used 3 days ago', icon: 'cloud', idle: false },
  { name: 'Pulsefit', kind: 'Workout app', price: 19, last: 'Last used 5 months ago', icon: 'bolt', idle: true },
  { name: 'Pagelit Audio', kind: 'Audiobooks', price: 12, last: 'Last used 4 months ago', icon: 'book', idle: true },
];
export const SUBS_TOTAL = SUBS.reduce((s, x) => s + x.price, 0);                      // 94
export const UNUSED = SUBS.filter((s) => s.idle);                                      // Pulsefit, Pagelit Audio
export const UNUSED_TOTAL = UNUSED.reduce((s, x) => s + x.price, 0);                   // 31 a month
export const SAVED_YEAR = UNUSED_TOTAL * 12;                                            // 372

export const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

// every figure on screen is derived from the lists above; these are the sums the ad promises
function check() {
  const sub = CATS.find((c) => c.k === 'subs').amt;
  const ok = TOTAL === 2600 && SUBS_TOTAL === sub && UNUSED_TOTAL === 31 && SAVED_YEAR === 372 && UNUSED.length === 2;
  if (!ok) throw new Error(`negagg-local: figures do not add up (total ${TOTAL}, subs ${SUBS_TOTAL} vs ${sub}, unused ${UNUSED_TOTAL}, year ${SAVED_YEAR})`);
}
check();

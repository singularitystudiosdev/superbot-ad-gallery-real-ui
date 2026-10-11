// The numbers and names every beat of the spot talks about, so the thread visibly carries over: the three connected AI
// plans (beats/connect.js), the bakery poster ChatGPT makes on the user's own plan (beats/poster.js) and the Instagram
// caption Claude writes for that same poster, then schedules (beats/schedule.js). Everything here is invented demo content
// (the bakery, its address, the sale, the times). The photographs are real, sourced Unsplash photos (img/CREDITS.txt).
// check() asserts the figures at load, so a typo never ships: the discount, the sale hours and the posting time read the
// same on the poster, in the caption and on the scheduled-post card.

// the AI accounts the user already pays for (the plan names are the vendors' own; no prices are shown anywhere)
export const PLANS = [
  { app: 'gpt', name: 'ChatGPT', plan: 'ChatGPT Plus' },
  { app: 'claude', name: 'Claude', plan: 'Claude Pro' },
  { app: 'gemini', name: 'Gemini', plan: 'Google AI Pro' },
];
export const SB_PLAN = { name: 'Free plan', price: '$0' };   // superbot's own plan: superbot.gg/api.md "Superbot Free, $0 a month"

// the sale
export const BAKERY = { name: 'Maple Street Bakery', handle: 'maplestreetbakery', address: '14 Maple St' };
export const SALE = { off: 20, day: 'Saturday', hours: '10am to 3pm', headline: 'Saturday Sale', tagline: 'Fresh bread, warm rolls, 20% off every loaf' };
export const POST = { day: 'Sat', time: '9:00 AM' };   // the scheduled slot
export const CREDITS = 0;                               // superbot credits the poster costs: the plan the user already pays for does the work

export const CAPTION = `Saturday is for fresh bread. Join us ${SALE.hours} at ${BAKERY.name} for ${SALE.off}% off every loaf, plus warm rolls out of the oven all morning. Come early, the seeded rye goes first.`;
export const TAGS = ['#maplestreetbakery', '#saturdaysale', '#freshbread'];

function check() {
  const ids = new Set(PLANS.map((p) => p.app));
  const ok = PLANS.length === 3 && ids.size === 3 && PLANS.every((p) => p.plan.startsWith(p.name) || p.app === 'gemini')
    && SB_PLAN.price === '$0' && CREDITS === 0
    && SALE.tagline.includes(`${SALE.off}%`) && CAPTION.includes(`${SALE.off}%`) && CAPTION.includes(SALE.hours) && CAPTION.includes(BAKERY.name)
    && TAGS.length === 3 && TAGS[0] === '#' + BAKERY.handle
    && POST.day === SALE.day.slice(0, 3) && /^9:00 AM$/.test(POST.time);
  if (!ok) throw new Error('negagg-cost: data does not add up (plans, discount, hours or posting time disagree)');
}
check();

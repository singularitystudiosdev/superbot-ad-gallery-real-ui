// amazon-defect-return-ups: every name, number, time and label the spot shows, in one place so the clip, the Gmail
// search, the comparison, the comment and the Amazon / UPS / Calendar screens agree. The ask is sent Sunday evening,
// October 4 (2026): the blender was delivered Saturday, September 12, Amazon's 30-day window closes Monday, October 12
// (8 days left) and the UPS pickup is the next morning, Monday, October 5.

export const ASK = 'this blender broke after 3 weeks. get my money back';
export const CLIP = { file: 'IMG_4471.MOV', len: '0:08', dur: 8, kind: 'Video' };

// Gemini: the three frames it marks on the clip's scrubber; box = the region it outlines on that frame (% of the frame)
export const MARKS = [
  { at: 2, ts: '0:02', label: 'crack at the jar base', box: [41, 35, 18, 13] },
  { at: 4, ts: '0:04', label: 'leaking on the counter', box: [16, 68, 66, 24] },
  { at: 6, ts: '0:06', label: 'motor still runs', box: [42, 54, 17, 12] },
];
export const VERDICT = 'Cracked jar base, leaking on every blend. This is a defect, not damage.';

export const ITEM = {
  name: 'Vortexa 1400W Pro Blender, 72 oz',
  price: '$109.99',
  order: '113-4829104-7731852',
  placed: 'September 9, 2026',
  delivered: 'Sat, Sep 12',
  deliveredLong: 'Delivered September 12',
  eligible: 'Eligible through October 12',
};

// DeepSeek: the Gmail search
export const MAIL = {
  total: 3412,
  query: 'from:amazon.com blender',
  rows: [
    { from: 'Amazon.com', subj: 'Ordered: "Vortexa 1400W Pro Blender..."', snip: 'Order #113-4829104-7731852. Arriving Saturday.', date: 'Sep 9' },
    { from: 'Amazon.com', subj: 'Your Amazon.com order has shipped', snip: 'Vortexa 1400W Pro Blender, 72 oz. $109.99', date: 'Sep 10', hit: true },
    { from: 'Amazon.com', subj: 'Delivered: Your Amazon.com order', snip: 'Your package was left near the front door.', date: 'Sep 12' },
  ],
};
export const WINDOW = 'Return window closes Oct 12. 8 days left.';

// Perplexity: the two ways out
export const WAYS = [
  { name: 'Amazon return', sub: 'Defective item, within 30 days', win: true,
    rows: ['Full refund $109.99', 'Free UPS pickup', 'Refund on scan'] },
  { name: 'Maker warranty', sub: 'Vortexa 1-year limited', win: false,
    rows: ['Replacement jar only', '2 to 3 weeks', 'You pay $14 to ship'] },
];
export const SOURCES = 6;

// Claude: the comment it writes for the return form
export const COMMENT = 'The jar cracked at the base after 3 weeks of normal use and leaks on every blend. Video attached. Requesting a refund to the original card.';

// Superbot: the return
export const REASON = "Item defective or doesn't work";
export const CARD = 'Visa ending 4242';
export const ADDR = '1480 Market St';
export const PICKUP = { day: 'Mon, Oct 5', win: '9 AM to 1 PM', note: 'Driver brings the label' };
export const METHODS = [
  { name: 'UPS Store drop off', sub: 'No box or label needed', fee: 'Free' },
  { name: 'Whole Foods Market drop off', sub: 'No box or label needed', fee: 'Free' },
  { name: 'UPS pickup', sub: `${PICKUP.day}, ${PICKUP.win}`, fee: 'Free', pick: true },
];
export const RETURN_ID = 'D8kQ2pR7vS';
export const REMIND = { title: 'Leave blender box by the door', when: 'Mon, Oct 5', time: '8:45 AM' };

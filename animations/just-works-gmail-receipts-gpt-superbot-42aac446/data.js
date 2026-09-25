/* data.js - everything the "2026 spend" page is built from, read out of Gmail.
   The hub's aggregation card reads `items` (the receipt emails themselves, newest first).
   The page reads `summary`, `months`, `categories`, `merchants`, `subscriptions` and `receipts`.
   Amounts are the receipt's own totals. Amounts, dates and counts are internal-consistent:
   the 12 months sum to summary.total, the categories sum to summary.total, and the two
   subscription groups sum to subscriptions.monthly. Photos are sourced real photos (CREDITS.txt). */

export const query = {
  ask: 'Find every receipt in my Gmail from this year',
  window: 'Jan 1 to Sep 25, 2026',
  read: 14902,
  receipts: 612,
  inbox: 'sam@gmail.com',
  parser: 'receipts, invoices and renewal notices from 1,874 senders',
};

export const summary = {
  total: 12885.98,
  tax: 1284.31,
  taxLabel: 'sales tax read off the receipts',
  lastYear: 13442.10,
  delta: -556.12,
  deltaPct: -4.1,
  avgMonth: 1431.78,
  months: 9,
  biggest: { month: 'Jun', amount: 1794.25 },
  biggestOne: { what: 'Airbnb, 3 nights in Portland', amount: 612.00 },
  spendDays: 214,
  baseline: 'the same nine months in 2025',
};

/* Jan to Sep 2026. The rest of the year has not happened yet: later bars are empty, not zero spend. */
export const months = [
  { m: 'Jan', label: 'January', total: 1418.20, n: 71, top: 'Amazon' },
  { m: 'Feb', label: 'February', total: 1206.85, n: 58, top: 'Whole Foods Market' },
  { m: 'Mar', label: 'March', total: 1622.40, n: 74, top: 'Home Depot' },
  { m: 'Apr', label: 'April', total: 1478.15, n: 66, top: 'Target' },
  { m: 'May', label: 'May', total: 1530.60, n: 69, top: 'Whole Foods Market' },
  { m: 'Jun', label: 'June', total: 1794.25, n: 78, top: 'Airbnb' },
  { m: 'Jul', label: 'July', total: 1218.90, n: 55, top: 'Lyft' },
  { m: 'Aug', label: 'August', total: 1682.35, n: 79, top: 'Amazon' },
  { m: 'Sep', label: 'September', total: 934.28, n: 62, top: 'Trader Joe’s', to: 'Sep 25' },
  { m: 'Oct', label: 'October', total: 0, n: 0, top: '' },
  { m: 'Nov', label: 'November', total: 0, n: 0, top: '' },
  { m: 'Dec', label: 'December', total: 0, n: 0, top: '' },
];

/* the same 12,885.98 split by what the money bought */
export const categories = [
  { name: 'Grocery', total: 2748.10, color: '#1f6b4a' },
  { name: 'Shopping', total: 2540.90, color: '#2f5d8a' },
  { name: 'Home', total: 2113.44, color: '#8a6a1f' },
  { name: 'Dining', total: 1905.30, color: '#a3541c' },
  { name: 'Travel', total: 1632.80, color: '#5b3f8a' },
  { name: 'Transport', total: 884.20, color: '#3f6f6a' },
  { name: 'Health', total: 620.44, color: '#8a3f52' },
  { name: 'Pets', total: 440.80, color: '#6d6a2f' },
];

export const merchants = [
  { name: 'Amazon', total: 1742.18, n: 86 },
  { name: 'Whole Foods Market', total: 1208.65, n: 74 },
  { name: 'Target', total: 884.30, n: 41 },
  { name: 'Trader Joe’s', total: 704.22, n: 52 },
  { name: 'Lyft', total: 612.40, n: 58 },
  { name: 'Airbnb', total: 612.00, n: 1 },
  { name: 'Chewy', total: 586.10, n: 34 },
  { name: 'Home Depot', total: 521.88, n: 12 },
  { name: 'Apple', total: 480.20, n: 4 },
  { name: 'Netflix', total: 149.94, n: 6 },
];

/* 11 renewals the receipts repeat on. The page shows six; five stay folded.
   shown (6) = 84.95 and folded (5) = 81.92, so monthly = 166.87. */
export const subscriptions = {
  count: 11,
  monthly: 166.87,
  yearly: 2002.44,
  cancelled: 154.88,           // monthly once Spotify is cancelled
  shown: [
    { name: 'Netflix Standard', logo: './brand/netflix.svg', amount: 24.99, next: 'Sep 28', since: 'Mar 2021', mails: 66 },
    { name: 'Spotify Premium', logo: './brand/spotify.svg', amount: 11.99, next: 'Oct 3', since: 'Aug 2019', mails: 84 },
    { name: 'Adobe Creative Cloud', logo: './brand/adobecreativecloud.svg', amount: 22.99, next: 'Oct 9', since: 'Jan 2022', mails: 45 },
    { name: 'iCloud+ 2 TB', logo: './brand/apple.svg', amount: 9.99, next: 'Oct 12', since: 'Feb 2018', mails: 102 },
    { name: 'Notion Plus', logo: './brand/notion.svg', amount: 10.00, next: 'Oct 15', since: 'Apr 2023', mails: 30 },
    { name: '1Password Families', logo: './brand/1password.svg', amount: 4.99, next: 'Oct 18', since: 'Jun 2020', mails: 62 },
  ],
  folded: [
    { name: 'Hulu', logo: './brand/hulu.svg', amount: 17.99 },
    { name: 'The New York Times', logo: null, amount: 25.00 },
    { name: 'Audible', logo: './brand/audible.svg', amount: 14.95 },
    { name: 'Dropbox Plus', logo: './brand/dropbox.svg', amount: 11.99 },
    { name: 'Strava', logo: './brand/strava.svg', amount: 11.99 },
  ],
};

/* the receipts as the page lists them: the Gmail subject line is the row's title */
export const receipts = [
  { subject: 'Your Whole Foods Market order receipt (#4471-8820)', merchant: 'Whole Foods Market', sender: 'Whole Foods Market', date: 'Sep 24', amount: 128.44, cat: 'Grocery', img: './img/groceries.jpg' },
  { subject: 'Order confirmed: Brooks Ghost 16, size 10.5', merchant: 'Brooks', sender: 'Brooks Running', date: 'Sep 23', amount: 139.95, cat: 'Shopping', img: './img/shoes.jpg' },
  { subject: 'Your Lyft ride on Sep 22 was $23.18', merchant: 'Lyft', sender: 'Lyft', date: 'Sep 22', amount: 23.18, cat: 'Transport', img: './img/ride.jpg' },
  { subject: 'Your Bookshop.org order A-88213 has shipped', merchant: 'Bookshop.org', sender: 'Bookshop.org', date: 'Sep 21', amount: 54.90, cat: 'Shopping', img: './img/books.jpg' },
  { subject: 'Order confirmed: DeWalt 20V drill, two batteries', merchant: 'Home Depot', sender: 'Home Depot', date: 'Sep 20', amount: 189.00, cat: 'Home', img: './img/tools.jpg' },
  { subject: 'Chewy order 7712 has shipped (Suki and Birdie)', merchant: 'Chewy', sender: 'Chewy', date: 'Sep 18', amount: 86.30, cat: 'Pets', img: './img/dogfood.jpg' },
  { subject: 'Your reservation in Portland, Sep 18 to 21', merchant: 'Airbnb', sender: 'Airbnb', date: 'Sep 18', amount: 612.00, cat: 'Travel', img: './img/hotel.jpg' },
  { subject: 'Your Sweet Lady Jane order 4471 is confirmed', merchant: 'Sweet Lady Jane', sender: 'Sweet Lady Jane', date: 'Sep 16', amount: 74.00, cat: 'Dining', img: './img/cake.jpg' },
  { subject: 'Your Blue Bottle Coffee subscription is on the way', merchant: 'Blue Bottle Coffee', sender: 'Blue Bottle Coffee', date: 'Sep 14', amount: 32.00, cat: 'Grocery', img: './img/coffee.jpg' },
  { subject: 'Order confirmation: Warby Parker, two pairs', merchant: 'Warby Parker', sender: 'Warby Parker', date: 'Sep 11', amount: 190.00, cat: 'Health', img: './img/glasses.jpg' },
  { subject: 'Your order from The Sill has shipped', merchant: 'The Sill', sender: 'The Sill', date: 'Sep 9', amount: 68.00, cat: 'Home', img: './img/plant.jpg' },
  { subject: 'Flower delivery confirmed for Sep 6', merchant: 'Bloom & Wild', sender: 'Bloom & Wild', date: 'Sep 6', amount: 106.00, cat: 'Home', img: './img/flowers.jpg' },
  { subject: 'Receipt for your Soundcore Space One order', merchant: 'Anker', sender: 'Anker Direct', date: 'Sep 4', amount: 99.00, cat: 'Shopping', img: './img/headphones.jpg' },
  { subject: 'Order shipped: State Bicycle 4130, 55 cm', merchant: 'State Bicycle Co.', sender: 'State Bicycle Co.', date: 'Sep 2', amount: 459.00, cat: 'Shopping', img: './img/bicycle.jpg' },
];

/* the hub's aggregation card reads this: first six are previewed with photo, subject, total and sender */
export const items = receipts.map((r) => ({
  img: r.img,
  title: r.subject,
  price: '$' + r.amount.toFixed(2),
  meta: r.date + ' · ' + r.sender + ' · ' + r.cat,
  source: 'gmail',
}));
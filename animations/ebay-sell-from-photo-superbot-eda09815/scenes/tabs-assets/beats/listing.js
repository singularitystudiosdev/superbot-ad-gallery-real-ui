// The one listing every beat shows: the camera, its condition, the sold comps, the photos and the eBay fields.
// Every number on screen comes from here so the chat, the chart and the eBay screens never disagree.
export const ASK = 'sell this on ebay';
export const PHOTOS = [
  { f: 'desk1.jpg', file: 'IMG_4417.jpg' },
  { f: 'desk2.jpg', file: 'IMG_4418.jpg' },
];
export const ITEM = 'Canon AE-1 Program, black, with FD 50mm f/1.8 lens.';
export const COND = 'Light brassing on the top plate, clean shutter curtains, no lens haze.';
// 38 eBay sold prices over the last 90 days: median (213 + 215) / 2 = 214, range 165 to 289
export const SOLD = [165, 172, 178, 183, 187, 190, 193, 196, 198, 200, 202, 204, 206, 207, 209, 210, 211, 212, 213,
  215, 216, 218, 220, 222, 224, 226, 229, 232, 235, 238, 242, 246, 251, 257, 264, 271, 280, 289];
export const STATS = { n: SOLD.length, days: 90, median: 214, lo: 165, hi: 289, price: 219 };
export const SHOTS = [
  { f: 'front.jpg', label: 'Front' },
  { f: 'back.jpg', label: 'Back' },
  { f: 'top.jpg', label: 'Top plate' },
  { f: 'lens.jpg', label: 'Lens' },
];
export const TITLE = 'Canon AE-1 Program 35mm SLR Film Camera Black + FD 50mm f/1.8 Lens, Tested';
export const SPECS = [['Brand', 'Canon'], ['Model', 'AE-1 Program'], ['Format', '35mm']];
export const PRICE = '$219.00';
export const ACCEPT = '$200.00';
export const SHIP = 'USPS Ground Advantage';
export const WATCHERS = 3;

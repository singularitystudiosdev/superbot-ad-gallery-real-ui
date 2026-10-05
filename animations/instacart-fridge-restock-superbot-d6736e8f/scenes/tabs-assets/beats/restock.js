// The one restock list both beats read from, so every name, size and price on screen stays the same: GPT-6 Astra's
// fridge boxes and checklist (beats/fridge.js) and the Instacart cart (beats/instacart.js), in this order.
// box: the item's spot on img/fridge.jpg as fractions [x0, y0, x1, y1]; tag: where its label sits (t above, b below,
// i inside; r right-aligns it to the box's right edge); dash: the item is missing, so the box marks the empty spot.
export const ITEMS = [
  { key: 'eggs', name: 'Large brown eggs', size: '12 ct', price: '$4.79', st: 'out', label: 'Egg carton: empty', box: [0.075, 0.163, 0.444, 0.344], tag: 't' },
  { key: 'oatmilk', name: 'Oat milk, full fat', size: '64 oz', price: '$5.99', st: 'low', label: 'Oat milk: nearly empty', box: [0.556, 0.206, 0.853, 0.338], tag: 'tr' },
  { key: 'spinach', name: 'Organic baby spinach', size: '5 oz', price: '$3.99', st: 'out', label: 'No spinach', box: [0.167, 0.765, 0.494, 0.905], tag: 'i', dash: true },
  { key: 'yogurt', name: 'Greek yogurt, plain', size: '32 oz', price: '$6.79', st: 'low', label: 'Yogurt: 1 cup left', box: [0.291, 0.427, 0.403, 0.52], tag: 'tr' },
  { key: 'lemons', name: 'Lemons', size: '2 lb bag', price: '$4.49', st: 'out', label: 'No lemons', box: [0.506, 0.765, 0.833, 0.905], tag: 'i', dash: true },
  { key: 'butter', name: 'Unsalted butter', size: '8 oz', price: '$4.29', st: 'out', label: 'Butter: almost gone', box: [0.5, 0.419, 0.814, 0.549], tag: 'b' },
  { key: 'cheddar', name: 'Sharp cheddar', size: '8 oz', price: '$4.99', st: 'out', label: 'Cheddar: end piece', box: [0.398, 0.593, 0.589, 0.714], tag: 'b' },
];
// 4.79 + 5.99 + 3.99 + 6.79 + 4.49 + 4.29 + 4.99 = 35.33; + 3.99 delivery + 2.85 service = 42.17
export const TOTALS = [['Subtotal', '$35.33'], ['Delivery', '$3.99'], ['Service fee', '$2.85']];
export const TOTAL = '$42.17';
export const STORE = { name: 'Sprouts Farmers Market', dist: '0.9 mi' };
export const WINDOW = 'Today, 6-7 PM';
export const ADDRESS = '1480 Market St';
export const CARD = 'Visa ending 4242';
export const PHOTO = { file: 'IMG_2208.jpg', meta: 'Photo · 2.4 MB' };

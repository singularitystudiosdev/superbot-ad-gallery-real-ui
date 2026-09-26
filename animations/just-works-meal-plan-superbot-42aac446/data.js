// data.js - the plan behind superbot.app/p/meal-plan, "Meal Plan".
// One Saturday afternoon's read-only plan of next week's dinners for a family of four: saved recipes in Mealie,
// Paprika and NYT Cooking, this week's live prices, sale flyers and stock at Kroger, Instacart and Costco, and
// Google Calendar for the nights with no time to cook. Superbot picks a dinner per night (Mon Sep 28 to Sun
// Oct 4, 2026), puts a quick one on each busy night, swaps what is out of stock and merges every recipe into one
// grocery list at the cheapest in-stock store. It never orders, never touches a cart, never edits a recipe or
// the calendar.
// Every figure the page shows is derived here from these records: the list, the store subtotals, the week
// total, each dinner's cost, the sale savings and the swap deltas cannot disagree with each other.

const n0 = (n) => Number(n).toLocaleString('en-US');
export const money = (n) => '$' + Number(n).toFixed(2);
const cents = (n) => Math.round(n * 100) / 100;

// "4:18 PM" from seconds after midnight (wraps past midnight).
export function hm(sec) {
  const s = ((Math.round(sec) % 86400) + 86400) % 86400;
  const h24 = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const h = h24 % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

export const meta = {
  user: 'Maya',
  household: 'family of 4',
  serves: 4,
  date: 'Sat, Sep 26',
  week: 'Mon Sep 28 to Sun Oct 4',
  syncStart: 16 * 3600 + 18 * 60 + 7, // 4:18:07 PM
  syncSecs: 41,
  quickMax: 25, // minutes: the most a busy night's dinner may take
};

// Where Superbot reads from. `kind` decides the verb the sync card and the source strip use.
export const accounts = [
  { id: 'mealie', name: 'Mealie', short: 'Mealie', logo: './brand/mealie.svg', kind: 'recipes', pulled: 142, what: 'self-hosted recipe box' },
  { id: 'paprika', name: 'Paprika Recipe Manager', short: 'Paprika', logo: './brand/paprika.svg', kind: 'recipes', pulled: 318, what: 'saved recipes' },
  { id: 'nyt', name: 'NYT Cooking', short: 'NYT Cooking', logo: './brand/nytcooking.svg', kind: 'recipes', pulled: 87, what: 'recipe box' },
  { id: 'kroger', name: 'Kroger', short: 'Kroger', logo: './brand/kroger.svg', kind: 'store', pulled: 486, what: 'prices, flyer and stock' },
  { id: 'instacart', name: 'Instacart', short: 'Instacart', logo: './brand/instacart.svg', kind: 'store', pulled: 412, what: 'prices, deals and stock' },
  { id: 'costco', name: 'Costco', short: 'Costco', logo: './brand/costco.svg', kind: 'store', pulled: 173, what: 'prices, savings and stock' },
  { id: 'gcal', name: 'Google Calendar', short: 'Calendar', logo: './brand/gcal.svg', kind: 'calendar', pulled: 23, what: 'next week' },
];
export const accOf = (id) => accounts.find((a) => a.id === id);
export const stores = accounts.filter((a) => a.kind === 'store');

// Every ingredient the week touches. `unit` is how the recipes measure it; each offer is one store's pack of
// `pack` units at `price`, `was` when the store's flyer marks it down, `stock: 'out'` when the store shows it
// sold out. `pantry` items are already in the kitchen and never reach the list. `sub` is the substitute
// Superbot reaches for when every store is out.
export const ingredients = [
  // Produce
  { id: 'greenbeans', name: 'Green beans', aisle: 'Produce', unit: 'lb', offers: [
    { store: 'costco', pack: 2, label: '2 lb bag', price: 4.49, stock: 'out' },
    { store: 'kroger', pack: 1, label: '1 lb', price: 2.49 },
    { store: 'instacart', pack: 1, label: '1 lb', price: 2.99 },
  ] },
  { id: 'scallions', name: 'Scallions', aisle: 'Produce', unit: 'bunch', offers: [
    { store: 'kroger', pack: 1, label: 'bunch', price: 0.99 },
    { store: 'instacart', pack: 1, label: 'bunch', price: 1.29 },
  ] },
  { id: 'ginger', name: 'Fresh ginger', aisle: 'Produce', unit: 'oz', offers: [
    { store: 'kroger', pack: 4, label: '4 oz knob', price: 1.25 },
    { store: 'instacart', pack: 4, label: '4 oz knob', price: 1.59 },
  ] },
  { id: 'garlic', name: 'Garlic', aisle: 'Produce', unit: 'head', offers: [
    { store: 'kroger', pack: 1, label: 'head', price: 0.69 },
    { store: 'instacart', pack: 3, label: '3 heads', price: 2.29 },
  ] },
  { id: 'onions', name: 'Yellow onions', aisle: 'Produce', unit: 'ct', offers: [
    { store: 'kroger', pack: 1, label: 'each', price: 0.99 },
    { store: 'instacart', pack: 6, label: '3 lb bag', price: 3.79 },
    { store: 'costco', pack: 20, label: '10 lb bag', price: 7.99 },
  ] },
  { id: 'peppers', name: 'Bell peppers', aisle: 'Produce', unit: 'ct', offers: [
    { store: 'kroger', pack: 1, label: 'each', price: 1.29 },
    { store: 'instacart', pack: 3, label: '3 pack', price: 3.99 },
    { store: 'costco', pack: 6, label: '6 pack', price: 6.99 },
  ] },
  { id: 'avocados', name: 'Avocados', aisle: 'Produce', unit: 'ct', offers: [
    { store: 'kroger', pack: 1, label: 'each', price: 1.25 },
    { store: 'instacart', pack: 4, label: '4 pack bag', price: 4.99 },
    { store: 'costco', pack: 6, label: '6 pack bag', price: 6.49 },
  ] },
  { id: 'cilantro', name: 'Cilantro', aisle: 'Produce', unit: 'bunch', offers: [
    { store: 'kroger', pack: 1, label: 'bunch', price: 0.79 },
    { store: 'instacart', pack: 1, label: 'bunch', price: 0.99 },
  ] },
  { id: 'limes', name: 'Limes', aisle: 'Produce', unit: 'ct', offers: [
    { store: 'kroger', pack: 1, label: 'each', price: 0.39 },
    { store: 'instacart', pack: 1, label: 'each', price: 0.49 },
  ] },
  { id: 'lemons', name: 'Lemons', aisle: 'Produce', unit: 'ct', offers: [
    { store: 'kroger', pack: 1, label: 'each', price: 0.79 },
    { store: 'instacart', pack: 6, label: '2 lb bag', price: 3.99 },
    { store: 'costco', pack: 12, label: '4 lb bag', price: 6.99 },
  ] },
  { id: 'spinach', name: 'Baby spinach', aisle: 'Produce', unit: 'oz', offers: [
    { store: 'kroger', pack: 5, label: '5 oz box', price: 3.49 },
    { store: 'instacart', pack: 5, label: '5 oz box', price: 2.99, was: 3.99 },
    { store: 'costco', pack: 16, label: '1 lb box', price: 4.29 },
  ] },
  { id: 'potatoes', name: 'Yukon Gold potatoes', aisle: 'Produce', unit: 'lb', offers: [
    { store: 'kroger', pack: 3, label: '3 lb bag', price: 3.99, was: 4.99 },
    { store: 'instacart', pack: 3, label: '3 lb bag', price: 4.79 },
    { store: 'costco', pack: 10, label: '10 lb bag', price: 7.99 },
  ] },
  { id: 'carrots', name: 'Carrots', aisle: 'Produce', unit: 'lb', offers: [
    { store: 'kroger', pack: 2, label: '2 lb bag', price: 1.79 },
    { store: 'instacart', pack: 2, label: '2 lb bag', price: 2.29 },
  ] },
  // Meat and seafood
  { id: 'salmon', name: 'Salmon fillets', aisle: 'Meat and seafood', unit: 'lb', offers: [
    { store: 'kroger', pack: 1, label: '1 lb', price: 12.99 },
    { store: 'instacart', pack: 1, label: '1 lb', price: 13.49 },
    { store: 'costco', pack: 2, label: '2 lb pack', price: 21.98, was: 25.98 },
  ] },
  { id: 'thighs', name: 'Boneless chicken thighs', aisle: 'Meat and seafood', unit: 'lb', offers: [
    { store: 'kroger', pack: 1, label: '1 lb', price: 4.49 },
    { store: 'instacart', pack: 1, label: '1 lb', price: 4.99 },
    { store: 'costco', pack: 4, label: '4 lb pack', price: 15.96 },
  ] },
  { id: 'sausage', name: 'Italian sausage', aisle: 'Meat and seafood', unit: 'lb', offers: [
    { store: 'kroger', pack: 1, label: '1 lb', price: 4.99, was: 5.99 },
    { store: 'instacart', pack: 1, label: '1 lb', price: 5.79 },
  ] },
  { id: 'turkey', name: 'Ground turkey', aisle: 'Meat and seafood', unit: 'lb', offers: [
    { store: 'kroger', pack: 1, label: '1 lb', price: 5.49, stock: 'out' },
    { store: 'instacart', pack: 1, label: '1 lb', price: 5.99, stock: 'out' },
  ], sub: { name: 'Ground chicken', offers: [
    { store: 'kroger', pack: 1, label: '1 lb', price: 4.99 },
    { store: 'instacart', pack: 1, label: '1 lb', price: 5.49 },
  ] } },
  { id: 'shrimp', name: 'Peeled shrimp', aisle: 'Meat and seafood', unit: 'lb', offers: [
    { store: 'kroger', pack: 1, label: '1 lb', price: 8.99 },
    { store: 'instacart', pack: 1, label: '1 lb', price: 7.99, was: 10.99 },
    { store: 'costco', pack: 2, label: '2 lb bag', price: 17.99 },
  ] },
  { id: 'chicken', name: 'Whole chicken', aisle: 'Meat and seafood', unit: 'ct', offers: [
    { store: 'kroger', pack: 1, label: 'about 5 lb', price: 7.45 },
    { store: 'costco', pack: 2, label: '2 pack', price: 12.49 },
  ] },
  // Dairy and eggs
  { id: 'eggs', name: 'Large eggs', aisle: 'Dairy and eggs', unit: 'ct', offers: [
    { store: 'kroger', pack: 12, label: '12 count', price: 3.29 },
    { store: 'instacart', pack: 12, label: '12 count', price: 3.79 },
    { store: 'costco', pack: 24, label: '24 count', price: 6.99 },
  ] },
  { id: 'feta', name: 'Feta', aisle: 'Dairy and eggs', unit: 'oz', offers: [
    { store: 'kroger', pack: 6, label: '6 oz', price: 3.99 },
    { store: 'instacart', pack: 6, label: '6 oz', price: 4.49 },
  ] },
  { id: 'parmesan', name: 'Parmesan wedge', aisle: 'Dairy and eggs', unit: 'oz', offers: [
    { store: 'kroger', pack: 5, label: '5 oz', price: 4.99 },
    { store: 'instacart', pack: 5, label: '5 oz', price: 5.29 },
    { store: 'costco', pack: 24, label: '1.5 lb', price: 11.99 },
  ] },
  { id: 'sourcream', name: 'Sour cream', aisle: 'Dairy and eggs', unit: 'oz', offers: [
    { store: 'kroger', pack: 16, label: '16 oz', price: 2.29 },
    { store: 'instacart', pack: 16, label: '16 oz', price: 2.99 },
  ] },
  { id: 'cheddar', name: 'Shredded cheddar', aisle: 'Dairy and eggs', unit: 'oz', offers: [
    { store: 'kroger', pack: 8, label: '8 oz', price: 2.5, was: 3.29 },
    { store: 'instacart', pack: 8, label: '8 oz', price: 3.19 },
  ] },
  // Pantry aisles
  { id: 'miso', name: 'White miso', aisle: 'Pantry', unit: 'tub', offers: [
    { store: 'kroger', pack: 1, label: '14 oz tub', price: 4.99 },
    { store: 'instacart', pack: 1, label: '14 oz tub', price: 5.49 },
  ] },
  { id: 'chipotle', name: 'Chipotles in adobo', aisle: 'Pantry', unit: 'can', offers: [
    { store: 'kroger', pack: 1, label: '7 oz can', price: 2.29 },
    { store: 'instacart', pack: 1, label: '7 oz can', price: 2.79 },
  ] },
  { id: 'tomatoes', name: 'Crushed tomatoes', aisle: 'Pantry', unit: 'can', offers: [
    { store: 'kroger', pack: 1, label: '28 oz can', price: 1.89, was: 2.49 },
    { store: 'instacart', pack: 1, label: '28 oz can', price: 2.39 },
    { store: 'costco', pack: 6, label: '6 cans', price: 8.49 },
  ] },
  { id: 'beans', name: 'Kidney beans', aisle: 'Pantry', unit: 'can', offers: [
    { store: 'kroger', pack: 1, label: '15 oz can', price: 0.99 },
    { store: 'costco', pack: 8, label: '8 cans', price: 7.49 },
  ] },
  { id: 'broth', name: 'Chicken broth', aisle: 'Pantry', unit: 'carton', offers: [
    { store: 'kroger', pack: 1, label: '32 oz', price: 2.49 },
    { store: 'instacart', pack: 1, label: '32 oz', price: 1.99, was: 2.79 },
    { store: 'costco', pack: 6, label: '6 cartons', price: 11.99 },
  ] },
  { id: 'orzo', name: 'Orzo', aisle: 'Pantry', unit: 'lb', offers: [
    { store: 'kroger', pack: 1, label: '1 lb box', price: 1.79 },
    { store: 'instacart', pack: 1, label: '1 lb box', price: 2.19 },
  ] },
  { id: 'gnocchi', name: 'Potato gnocchi', aisle: 'Pantry', unit: 'lb', offers: [
    { store: 'kroger', pack: 1, label: '1 lb pack', price: 2.29, stock: 'out' },
    { store: 'instacart', pack: 1, label: '1 lb pack', price: 3.29 },
    { store: 'costco', pack: 3, label: '3 pack', price: 6.49 },
  ] },
  { id: 'tortillas', name: 'Corn tortillas', aisle: 'Pantry', unit: 'pack', offers: [
    { store: 'kroger', pack: 1, label: '30 count', price: 2.99 },
    { store: 'instacart', pack: 1, label: '30 count', price: 3.49 },
  ] },
  // Frozen
  { id: 'peas', name: 'Frozen peas and carrots', aisle: 'Frozen', unit: 'bag', offers: [
    { store: 'kroger', pack: 1, label: '12 oz bag', price: 1.25 },
    { store: 'instacart', pack: 1, label: '12 oz bag', price: 1.69 },
  ] },
  // Already in the kitchen: named by the recipes, never on the list
  { id: 'oil', name: 'Olive oil', pantry: true },
  { id: 'soy', name: 'Soy sauce', pantry: true },
  { id: 'rice', name: 'Jasmine rice', pantry: true },
  { id: 'sesame', name: 'Toasted sesame oil', pantry: true },
  { id: 'honey', name: 'Honey', pantry: true },
  { id: 'butter', name: 'Butter', pantry: true },
  { id: 'chili', name: 'Chili powder', pantry: true },
  { id: 'cumin', name: 'Ground cumin', pantry: true },
];
export const ingOf = (id) => ingredients.find((i) => i.id === id);

// Next week in Google Calendar, as Superbot reads it: only the evening events that land on dinner.
export const events = [
  { day: 'tue', title: 'Soccer practice', when: '5:30 to 7:15 PM', from: 17.5, to: 19.25 },
  { day: 'thu', title: 'Late team meeting', when: 'until 7:30 PM', from: 16.5, to: 19.5 },
];

// The seven dinners, one per night, each a saved recipe. `uses` is [ingredient id, quantity in its unit].
export const days = [
  {
    id: 'mon', dow: 'Mon', date: 'Sep 28', recipe: 'Miso-Glazed Salmon with Sesame Green Beans', short: 'Miso salmon',
    src: 'nyt', mins: 30, img: './img/dishes/salmon.jpg',
    uses: [['salmon', 2], ['miso', 0.5], ['greenbeans', 1.5], ['scallions', 0.5], ['ginger', 2], ['garlic', 0.25], ['soy'], ['honey'], ['rice'], ['sesame']],
  },
  {
    id: 'tue', dow: 'Tue', date: 'Sep 29', recipe: 'Chicken Tinga Tacos', short: 'Chicken tinga tacos',
    src: 'nyt', mins: 25, img: './img/dishes/tacos.jpg',
    uses: [['thighs', 2], ['chipotle', 1], ['tomatoes', 1], ['onions', 1], ['tortillas', 1], ['avocados', 2], ['cilantro', 0.5], ['limes', 2], ['sourcream', 8], ['garlic', 0.25], ['oil'], ['cumin']],
  },
  {
    id: 'wed', dow: 'Wed', date: 'Sep 30', recipe: 'One-Pot Lemony Chicken Orzo', short: 'Lemony chicken orzo',
    src: 'paprika', mins: 35, img: './img/dishes/orzo.jpg',
    uses: [['thighs', 1.5], ['orzo', 1], ['broth', 1], ['spinach', 5], ['lemons', 2], ['feta', 4], ['parmesan', 2], ['onions', 1], ['garlic', 0.25], ['oil'], ['butter']],
  },
  {
    id: 'thu', dow: 'Thu', date: 'Oct 1', recipe: 'Sheet-Pan Gnocchi with Sausage and Peppers', short: 'Sheet-pan gnocchi',
    src: 'nyt', mins: 20, img: './img/dishes/gnocchi.jpg',
    uses: [['gnocchi', 2], ['sausage', 1], ['peppers', 3], ['onions', 1], ['parmesan', 2], ['oil']],
  },
  {
    id: 'fri', dow: 'Fri', date: 'Oct 2', recipe: 'Weeknight Turkey Chili', short: 'Turkey chili',
    src: 'mealie', mins: 50, img: './img/dishes/chili.jpg',
    uses: [['turkey', 2], ['beans', 2], ['tomatoes', 1], ['onions', 1], ['peppers', 1], ['broth', 0.5], ['cheddar', 8], ['sourcream', 8], ['scallions', 0.5], ['garlic', 0.25], ['chili'], ['cumin']],
  },
  {
    id: 'sat', dow: 'Sat', date: 'Oct 3', recipe: 'Shrimp Fried Rice', short: 'Shrimp fried rice',
    src: 'paprika', mins: 30, img: './img/dishes/friedrice.jpg',
    uses: [['shrimp', 1], ['eggs', 4], ['peas', 1], ['scallions', 0.5], ['ginger', 1], ['rice'], ['soy'], ['sesame']],
  },
  {
    id: 'sun', dow: 'Sun', date: 'Oct 4', recipe: 'Lemon-Herb Roast Chicken with Potatoes', short: 'Roast chicken',
    src: 'mealie', mins: 75, img: './img/dishes/roastchicken.jpg',
    uses: [['chicken', 1], ['potatoes', 2], ['carrots', 1], ['lemons', 1], ['garlic', 1], ['oil'], ['butter']],
  },
];

// ---- derived: the list ----

// what the whole week needs of every bought ingredient
const needOf = (id) => days.reduce((t, d) => t + d.uses.filter((u) => u[0] === id).reduce((a, u) => a + (u[1] || 0), 0), 0);
const priced = (o, need) => {
  const packs = Math.ceil(need / o.pack - 1e-9);
  return { ...o, packs, cost: cents(packs * o.price) };
};
const cheapest = (list) => list.slice().sort((a, b) => a.cost - b.cost)[0];

// one list line per bought ingredient: the cheapest in-stock offer by what the needed packs cost. When the
// cheapest offer on the shelf is sold out the line carries a swap: another store, or the substitute when
// every store is out.
export const lines = ingredients
  .filter((i) => !i.pantry)
  .map((i) => {
    const need = needOf(i.id);
    const all = i.offers.map((o) => priced(o, need));
    const nominal = cheapest(all);
    const inStock = all.filter((o) => o.stock !== 'out');
    const subbed = !inStock.length && i.sub;
    const pick = subbed ? cheapest(i.sub.offers.map((o) => priced(o, need))) : cheapest(inStock);
    const swap = nominal.stock === 'out'
      ? {
          kind: subbed ? 'sub' : 'store',
          outAt: all.filter((o) => o.stock === 'out').map((o) => o.store),
          from: nominal.store, fromCost: nominal.cost,
          to: subbed ? i.sub.name : pick.store,
          delta: cents(pick.cost - nominal.cost),
        }
      : null;
    return {
      id: i.id, name: subbed ? i.sub.name : i.name, asked: i.name, aisle: i.aisle, unit: i.unit, need,
      store: pick.store, label: pick.label, pack: pick.pack, packs: pick.packs, price: pick.price, cost: pick.cost,
      was: pick.was || null, save: pick.was ? cents((pick.was - pick.price) * pick.packs) : 0,
      swap,
    };
  });
export const lineOf = (id) => lines.find((l) => l.id === id);
export const pantry = ingredients.filter((i) => i.pantry);

// "1.5 lb", "4", "2 cans": what the week needs, in the recipes' unit
export function qty(l) {
  const n = +l.need.toFixed(2);
  if (l.unit === 'ct') return n0(n);
  const plural = { bunch: 'bunches', head: 'heads', can: 'cans', carton: 'cartons', tub: 'tubs', bag: 'bags', pack: 'packs' };
  return `${n} ${n > 1 && plural[l.unit] ? plural[l.unit] : l.unit}`;
}

export const sales = lines.filter((l) => l.save > 0).sort((a, b) => b.save - a.save);
export const swaps = lines.filter((l) => l.swap);

// each store's share of the list, in the order the list prints them (the store with most lines first)
export const byStore = stores
  .map((s) => {
    const ls = lines.filter((l) => l.store === s.id);
    return { id: s.id, lines: ls, subtotal: cents(ls.reduce((t, l) => t + l.cost, 0)) };
  })
  .filter((s) => s.lines.length)
  .sort((a, b) => b.lines.length - a.lines.length);

const total = cents(lines.reduce((t, l) => t + l.cost, 0));

// ---- derived: the week ----

// a dinner's cost is its share of every line it draws on (the line's cost split by quantity), so the seven
// dinners add up to the week total
export const week = days.map((d) => {
  const ev = events.find((e) => e.day === d.id) || null;
  const bought = d.uses.filter((u) => u[1]);
  const cost = bought.reduce((t, [id, q]) => {
    const l = lineOf(id);
    return t + (l.cost * q) / l.need;
  }, 0);
  const onSale = bought.map(([id]) => lineOf(id)).filter((l) => l.save > 0).map((l) => l.name);
  const swapped = bought.map(([id]) => lineOf(id)).filter((l) => l.swap).map((l) => l.name);
  return {
    ...d, busy: ev, quick: d.mins <= meta.quickMax,
    cost: cents(cost), perServing: cents(cost / meta.serves),
    items: bought.length, fromPantry: d.uses.length - bought.length, onSale, swapped,
  };
});
export const busyNights = week.filter((d) => d.busy);

// every figure the hub, the steps and the page count
const recipesRead = accounts.filter((a) => a.kind === 'recipes').reduce((t, a) => t + a.pulled, 0);
const pricesRead = stores.reduce((t, a) => t + a.pulled, 0);
export const counts = {
  records: accounts.reduce((t, a) => t + a.pulled, 0),
  recipes: recipesRead,
  prices: pricesRead,
  events: accOf('gcal').pulled,
  dinners: week.length,
  busy: busyNights.length,
  clear: week.length - busyNights.length,
  ingredients: lines.length + pantry.length,
  lines: lines.length,
  pantry: pantry.length,
  stores: byStore.length,
  onSale: sales.length,
  saved: cents(sales.reduce((t, l) => t + l.save, 0)),
  swaps: swaps.length,
  swapDelta: cents(swaps.reduce((t, l) => t + l.swap.delta, 0)),
  total,
  perDinner: cents(total / week.length),
  perServing: cents(total / (week.length * meta.serves)),
};

// The hub's preview rows: each night's dinner, with its cost and the recipe app it came from.
export const items = week.map((d) => ({
  img: d.img,
  title: d.short,
  meta: `${d.dow} ${d.date}, ${d.mins} min` + (d.busy ? `, ${d.busy.title.toLowerCase()}` : ''),
  price: money(d.cost),
  source: d.src,
}));

// Every line of page copy that is not a record. Read-only in every word: found, read, checked, never ordered.
export const copy = {
  brand: 'Meal Plan',
  kicker: `${meta.week}, ${meta.household}, planned at ${hm(meta.syncStart)}`,
  heroH1: `${counts.dinners} dinners, ${counts.busy} busy nights covered, ${money(counts.total)} for the week`,
  heroDek: `Superbot read your saved recipes in Mealie, Paprika and NYT Cooking, checked live prices, sale flyers and stock at Kroger, Instacart and Costco, and fit the week around Google Calendar. Nothing was ordered and no cart was touched.`,
  syncNow: `Reading ${accounts.length} sources`,
  syncDone: 'All sources read',
  syncClose: 'Ingredients matched',
  weekK: 'Next week',
  weekNote: 'Read from Google Calendar. No event edited, nothing added.',
  statsH: 'The week at a glance',
  statsDek: 'Four answers, read from the recipes, the stores and the calendar',
  weekH: 'A dinner for every night',
  weekDek: `Quick dinners of ${meta.quickMax} minutes or less on the nights the calendar is full`,
  panelsH: 'What to buy, and where',
  panelsDek: `${counts.ingredients} ingredients across ${counts.dinners} recipes, ${counts.pantry} already in the pantry, the rest merged into one list`,
  salesH: `On sale this week`,
  swapsH: `Out of stock, swapped`,
  salesFoot: `Sale prices save ${money(counts.saved)} this week`,
  listNote: 'Prices and stock read live from each store. Nothing added to a cart, nothing ordered.',
  totalLabel: `Week total, ${counts.lines} items at ${counts.stores} stores`,
  foot: `Read-only. Superbot read 3 recipe apps, 3 stores and 1 calendar. Nothing was ordered, carted, edited or booked.`,
};

export default { meta, accounts, stores, ingredients, events, days, lines, pantry, sales, swaps, byStore, week, busyNights, counts, items, copy };

// The numbers every beat of the spot talks about, so the thread visibly carries over: the itinerary and its $1,460
// total from the plan (beats/plan.js) are the same figures the second opinion audits (beats/budget.js), and the hotel
// it books (beats/book.js) is night one of the same stay. Everything here is invented demo content: the hotel, the
// prices, the line items and the booking number. The places are real Lisbon sights used only as day titles.
// Photos: img/CREDITS.txt.
export const BUDGET = 1500;

export const DAYS = [
  { n: 1, title: 'Praça do Comércio and Tram 28', sub: 'Check in, Baixa walk, dinner in Chiado', cost: 340, photo: 'day1.jpg' },
  { n: 2, title: 'Belém Tower and Jerónimos', sub: 'Pastéis de nata, river walk, LX Factory', cost: 360, photo: 'day2.jpg' },
  { n: 3, title: 'Pena Palace, Sintra', sub: 'Guided day tour, lunch in the old town', cost: 390, photo: 'day3.jpg' },
  { n: 4, title: 'Alfama at sunset', sub: 'Miradouros, fado dinner, late checkout', cost: 370, photo: 'day4.jpg' },
];
export const TOTAL = DAYS.reduce((s, d) => s + d.cost, 0); // 1,460

// the 14 line items behind the plan (they add up to TOTAL); the audit finds the one that is not in the list
export const ITEMS = [
  ['Hotel, 3 nights', 520], ['Dinners, 4 nights', 260],
  ['Lunches, 4 days', 130], ['Breakfasts', 60],
  ['Sintra day tour', 120], ['Fado dinner show', 90],
  ['Souvenirs', 80], ['Belém and Jerónimos', 44],
  ['Metro passes', 36], ['São Jorge Castle', 32],
  ['Gulbenkian Museum', 28], ['Cascais train', 28],
  ['Tram 28 rides', 16], ['Pastéis tasting', 16],
];
export const MISSED = ['Airport transfers', 60];
export const FIXED_TOTAL = TOTAL + MISSED[1];            // 1,520
export const SWAP = { text: 'Sintra by train with entry, not the guided tour', was: 120, now: 70 };
export const FINAL_TOTAL = FIXED_TOTAL - (SWAP.was - SWAP.now); // 1,470

export const HOTEL = { name: 'Casa Andorinha Alfama', area: 'Alfama, Lisbon', night: 173, dates: 'Mar 12 to Mar 13', guests: 2, ref: 'LX-48213', photo: 'hotel.jpg' };
export const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

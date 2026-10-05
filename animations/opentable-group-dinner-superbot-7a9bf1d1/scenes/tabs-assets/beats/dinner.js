// opentable-group-dinner: every name, number, time and label the spot shows, in one place so the screenshot,
// Gemini's constraints, Perplexity's results, Claude's pick and the OpenTable / Calendar / Messages screens agree.
// The dinner is Friday, October 9 (2026), the ask is sent the Monday before.

export const ASK = 'book dinner for the 6 of us friday, somewhere everyone can eat';
export const SHOT = { file: 'IMG_2214.PNG', kind: 'Screenshot' };

// the "Fri crew" group chat as the attached screenshot shows it (iOS Messages, light)
export const GROUP = 'Fri crew';
export const PEOPLE = [
  { name: 'Priya', init: 'P', msg: 'vegan now btw', col: '#e8710a' },
  { name: 'Leo', init: 'L', msg: 'gluten free pls, celiac', col: '#1e8e3e' },
  { name: 'Dana', init: 'D', msg: 'near williamsburg? off at 7', col: '#9334e6' },
  { name: 'Theo', init: 'T', msg: 'nothing over like $60 a head', col: '#d01884' },
];
// the sixth seat: in the group and on the invite, quiet in the screenshot
export const MAYA = { name: 'Maya', init: 'M', col: '#12b5cb' };
export const SHOT_TIME = { clock: '5:51', stamp: 'Today 5:48 PM' };

// Gemini: what everyone needs, in order; `from` is the bubble (PEOPLE index) it came from, -1 = the ask itself
export const NEEDS = [
  { label: '6 people', ic: 'ppl', from: -1 },
  { label: 'Fri, Oct 9', ic: 'cal', from: -1 },
  { label: 'After 7:30 PM', ic: 'clock', from: 2 },
  { label: '1 vegan', ic: 'leaf', from: 0 },
  { label: '1 celiac', ic: 'wheat', from: 1 },
  { label: 'Williamsburg', ic: 'pin', from: 2 },
  { label: 'Under $60 a head', ic: 'tag', from: 3 },
];

// Perplexity Sonar: menus and reviews within 0.8 mi; 4 + 3 + 4 + 3 + 4 = 18 sources
export const RADIUS = '0.8 mi';
export const SOURCES = 18;
export const RESULTS = [
  { name: 'Casa Lumbre', img: 'tacos.jpg', rating: '4.7', price: '$$', cuisine: 'Mexican', mi: '0.3 mi',
    tags: [['8 vegan mains', 'ok'], ['Dedicated GF fryer', 'ok']], src: 4, verdict: ['Fits all 6', 'ok'] },
  { name: 'Fig & Ember', img: 'bowl.jpg', rating: '4.6', price: '$$$', cuisine: 'Mediterranean', mi: '0.5 mi',
    tags: [['$72 avg', 'bad']], src: 3, verdict: ['Over budget', 'bad'], strike: true },
  { name: 'Ortolano', img: 'pasta.jpg', rating: '4.5', price: '$$', cuisine: 'Italian', mi: '0.4 mi',
    tags: [['GF pasta', 'ok'], ['2 vegan mains', 'ok']], src: 4, verdict: ['Backup', 'mid'] },
  { name: 'Nori Lane', img: 'sushi.jpg', rating: '4.6', price: '$$', cuisine: 'Japanese', mi: '0.6 mi',
    tags: [['No table for 6 Friday', 'bad']], src: 3, verdict: ['Full Friday', 'bad'], strike: true },
  { name: 'Bell & Barley', img: 'burger.jpg', rating: '4.4', price: '$$', cuisine: 'Gastropub', mi: '0.8 mi',
    tags: [['Shared fryer', 'warn']], src: 4, verdict: ['Celiac risk', 'warn'], flag: true },
];

// Claude Opus 5.5: the pick and the text for the group
export const PICK = 'Casa Lumbre: 8 vegan mains, a dedicated gluten-free fryer, about $48 a head, and a 7:45 table for 6.';
export const DRAFT = 'Booked Casa Lumbre, Fri 7:45, table for 6. Vegan and GF menus, about $48 a head. 214 Grand St. Invite is in your calendar.';

// the booking itself
export const PLACE = {
  name: 'Casa Lumbre', rating: '4.7', reviews: '1,284', price: '$31 to $50', cuisine: 'Mexican', hood: 'Williamsburg',
  addr: '214 Grand St, Brooklyn', party: '6 people', date: 'Fri, Oct 9', ask: '7:30 PM',
  slots: ['7:00 PM', '7:45 PM', '8:30 PM'], pick: 1,
};
export const REQUEST = 'One vegan guest, one celiac guest (needs dedicated fryer)';
export const CONF = '2047 1186';
export const EVENT = { title: 'Dinner at Casa Lumbre', when: 'Friday, October 9', time: '7:45-9:45 PM', where: 'Casa Lumbre, 214 Grand St, Brooklyn' };
export const GUESTS = [...PEOPLE, MAYA];
export const REPLY = { from: PEOPLE[0], msg: 'yesss' };

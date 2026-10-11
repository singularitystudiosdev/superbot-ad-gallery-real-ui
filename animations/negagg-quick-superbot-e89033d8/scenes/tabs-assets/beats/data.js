// The numbers and names every beat of the spot talks about, so the thread visibly carries over: the 12 dropped photos
// (beats/rename.js renames them by date and place), the best one of those (beats/caption.js captions it) and that
// caption in three languages (beats/translate.js). Everything here is invented demo content: the camera file names,
// the dates, the caption and the translations. The photos are real, sourced Unsplash photographs (img/CREDITS.txt) and
// every place in a new file name is what its photo shows. check() asserts the figures at load, so a typo never ships.

// the 12 photos, in the order the camera took them (IMG numbers), each with its new name
export const FILES = [
  { from: 'IMG_4471.jpg', date: '2026-06-12', place: 'Porto, Ribeira', img: 'ribeira' },
  { from: 'IMG_4472.jpg', date: '2026-06-12', place: 'Porto, Dom Luis Bridge', img: 'bridge' },
  { from: 'IMG_4473.jpg', date: '2026-06-12', place: 'Porto, Sunset', img: 'sunset' },
  { from: 'IMG_4475.jpg', date: '2026-06-13', place: 'Douro Valley, Vineyards', img: 'vineyards' },
  { from: 'IMG_4476.jpg', date: '2026-06-13', place: 'Douro Valley, Terraces', img: 'terraces' },
  { from: 'IMG_4478.jpg', date: '2026-06-14', place: 'Aveiro, Canal Boats', img: 'aveiro' },
  { from: 'IMG_4481.jpg', date: '2026-06-15', place: 'Lisbon, Baixa Tram', img: 'tram' },
  { from: 'IMG_4482.jpg', date: '2026-06-15', place: 'Lisbon, Pasteis de Nata', img: 'pastel' },
  { from: 'IMG_4484.jpg', date: '2026-06-16', place: 'Lisbon, Belem Tower', img: 'belem' },
  { from: 'IMG_4485.jpg', date: '2026-06-16', place: 'Lisbon, Azulejos', img: 'azulejos' },
  { from: 'IMG_4487.jpg', date: '2026-06-17', place: 'Sintra, Pena Palace', img: 'pena' },
  { from: 'IMG_4490.jpg', date: '2026-06-18', place: 'Lisbon, Alfama Rooftops', img: 'alfama' },
].map((f) => ({ ...f, to: `${f.date} ${f.place}.jpg` }));
export const SHOWN = 5;                                 // the before/after list shows this many rows
export const MORE = FILES.length - SHOWN;               // and "+7 more"
export const GROUP = { name: '12 photos', n: FILES.length };

// the best one of the 12, and its caption
export const BEST = FILES[10];                          // Sintra, Pena Palace
export const CAPTION = 'Pena Palace, Sintra. Straight out of a storybook.';
export const TAGS = ['#Sintra', '#PenaPalace', '#PortugalTrip'];

// the caption in Spanish, French and Japanese
export const LANGS = [
  { flag: '🇪🇸', name: 'Spanish', text: 'Palacio da Pena, Sintra. Sacado de un libro de cuentos.' },
  { flag: '🇫🇷', name: 'French', text: 'Palais de Pena, Sintra. Tout droit sorti d’un livre de contes.' },
  { flag: '🇯🇵', name: 'Japanese', text: 'シントラのペーナ宮殿。まるで絵本の世界。' },
];

function check() {
  const sorted = FILES.every((f, i) => i === 0 || FILES[i - 1].date <= f.date);
  const uniq = new Set(FILES.map((f) => f.from)).size === 12 && new Set(FILES.map((f) => f.to)).size === 12 && new Set(FILES.map((f) => f.img)).size === 12;
  const ok = FILES.length === 12 && SHOWN + MORE === 12 && MORE === 7 && sorted && uniq && BEST.img === 'pena' && TAGS.length === 3 && LANGS.length === 3 && LANGS.every((l) => l.text.length > 8);
  if (!ok) throw new Error(`negagg-quick: data does not add up (files ${FILES.length}, shown ${SHOWN}+${MORE}, sorted ${sorted}, unique ${uniq})`);
}
check();

// Shared copy and numbers for the relay spot. Spots and review counts are made up; the photos, the 3D model
// and the voice track are real model output (img/CREDITS.txt).

export const ASK = "Launch Main Street Burger Co.'s site tonight. Beat every burger spot in the Mission.";

// The relay, in switch order. `out` is what each model hands to the next one.
export const RELAY = [
  { id: 'deepseek', name: 'DeepSeek V4 Pro', logo: 'brand/deepseek-logo.svg', tag: 'scrapes what others refuse', task: 'Scrape every rival: menus, prices, reviews', out: 'competitors.json' },
  { id: 'opus', name: 'Claude Opus 5.5', logo: 'brand/claude-logo.svg', tag: 'codes the site', task: 'Build the site around that data, leave slots', out: 'assets.json' },
  { id: 'gemini', name: 'Nano Banana Pro', logo: 'brand/gemini-logo.svg', tag: 'best at text inside images', task: 'Shoot every photo slot', out: '5 photos' },
  { id: 'blender', name: 'Blender 5.2', logo: 'brand/blender-logo.svg', tag: 'real 3D, real viewport', task: 'Turn the burger photo into a 3D model', out: 'burger.glb' },
  { id: 'eleven', name: 'Eleven v3', logo: 'brand/elevenlabs-logo.svg', tag: 'voice with emotion tags', task: 'Voice a 10 second radio spot', out: 'spot.mp3' },
  { id: 'live', name: 'Live', logo: null, tag: 'superbot ships it', task: 'Deploy', out: 'mainstreetburger.co' },
];

export const SPOTS = [
  ['Patty Wagon 24', '$14.50', '4.4', '812', 'bun falls apart'],
  ['Mission Smash Co.', '$13.75', '4.5', '1,204', 'soggy bun'],
  ['Valencia Grill', '$15.00', '4.1', '377', '40 min wait'],
  ['Lucky Bun', '$11.50', '3.9', '541', 'soggy bun'],
  ['Dolores Burger Bar', '$13.50', '4.2', '693', 'soggy bun'],
  ['Red Line Burgers', '$12.95', '4.0', '266', 'overpriced'],
];

export const SCRAPE = [
  ['yelp.com/search?find_desc=burgers&find_loc=Mission', 47, 'spots'],
  ['doordash.com/store/*/menu', 47, 'menus'],
  ['ubereats.com/store/*', 44, 'price lists'],
  ['google.com/maps/place/*/reviews', 3412, 'reviews'],
  ['reddit.com/r/AskSF  "best burger mission"', 212, 'threads'],
  ['dedupe + normalize prices', 47, 'rows'],
];

export const HEADLINE = 'No soggy buns. Ever.';
export const SUB = '$9 smash burgers on toasted brioche. Cheaper than all 47 burger spots in the Mission.';

// Eleven v3 take (voice "Mark"), timed from the real file: assets-src/audio/vo-Mark.mp3, 10.48 s
export const VO_SCRIPT = [
  ['[excited]', 'Main Street Burger Co. is open tonight!', 0, 3.28],
  ['[short pause]', 'Nine-dollar smash burgers on toasted brioche.', 3.28, 6.16],
  ['[confident]', 'No soggy buns. Ever.', 6.16, 8.56],
  ['[chuckles]', 'Twenty-fourth and Mission. Come hungry.', 8.56, 10.48],
];
export const VO_DUR = 10.48;
export const PEAKS = [39,78,83,78,62,30,74,55,17,79,80,34,80,23,73,86,82,57,74,84,50,7,7,91,73,29,84,54,55,21,7,77,62,74,75,36,5,7,11,12,3,0,0,0,0,0,0,0,0,0,1,43,64,75,72,78,79,72,68,27,64,76,71,29,47,79,37,80,79,22,27,51,36,20,17,74,67,7,72,34,72,76,59,29,28,34,27,8,0,0,0,0,0,0,19,39,49,76,51,47,100,80,58,75,63,56,26,14,7,9,6,0,0,0,0,0,0,0,37,91,43,30,14,11,6,1,0,0,0,0,1,5,19,44,75,74,14,81,80,49,65,67,60,35,34,15,8,2,0,0,0,0,17,79,65,78,59,50,40,27];

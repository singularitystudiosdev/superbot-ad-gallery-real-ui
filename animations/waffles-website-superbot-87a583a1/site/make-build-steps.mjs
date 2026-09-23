#!/usr/bin/env node
/* Regenerate build-steps.json.
   Every snippet is sliced out of the shipped file, located by a needle, so the
   animation streams code that really runs. Run from this directory:

       node make-build-steps.mjs

   The script exits with an error if a needle cannot be found, so a refactor that
   moves a block is caught here instead of producing a stale animation. */

import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/* order matters: this is the order the site would be written in */
const STEPS = [
  { file: 'index.html', kind: 'write', title: 'doctype, head and the icon sprite',
    from: '<!doctype html>', count: 22 },
  { file: 'index.html', kind: 'write', title: 'topbar with the live counters',
    from: '<header class="topbar">', count: 16 },
  { file: 'index.html', kind: 'write', title: 'hero and its three actions',
    from: '<section class="hero">', count: 22 },
  { file: 'index.html', kind: 'write', title: 'syrup board shell with the sort tabs',
    from: '<section class="board"', count: 14 },
  { file: 'index.html', kind: 'write', title: 'gallery and the search box',
    from: '<section class="gallery"', count: 12 },
  { file: 'index.html', kind: 'write', title: 'the two overlay sheets',
    from: '<!-- add a waffle -->', count: 16 },
  { file: 'styles.css', kind: 'write', title: 'theme tokens: espresso, cream, syrup gold',
    from: ':root {', count: 19 },
  { file: 'styles.css', kind: 'write', title: 'waffle grid backdrop',
    from: '.grid-backdrop {', count: 14 },
  { file: 'styles.css', kind: 'write', title: 'cards and the fractional syrup meter',
    from: '.card {', count: 14 },
  { file: 'styles.css', kind: 'write', title: 'rating drops and the pulse',
    from: '.rate { display: flex', count: 16 },
  { file: 'styles.css', kind: 'write', title: 'phone widths',
    from: '@media (max-width: 760px)', count: 14 },
  { file: 'app.js', kind: 'write', title: 'seed gallery: ten real waffles with their votes',
    from: 'var SEEDS = [', count: 14 },
  { file: 'app.js', kind: 'write', title: 'storage with an in-memory fallback',
    from: 'function storage()', count: 14 },
  { file: 'app.js', kind: 'write', title: 'rating maths: base votes plus yours',
    from: 'function statsFor(photo)', count: 12 },
  { file: 'app.js', kind: 'write', title: 'sorting the board three ways',
    from: 'function sorted()', count: 18 },
  { file: 'app.js', kind: 'write', title: 'card markup with the score widget',
    from: 'function cardHtml(photo, rank)', count: 20 },
  { file: 'app.js', kind: 'write', title: 'upload: downscale to 1200 pixels, then store',
    from: 'function readPhoto(file)', count: 20 },
  { file: 'app.js', kind: 'write', title: 'scoring a waffle and saving it',
    from: 'function rate(id, score)', count: 22 },
  { file: 'app.js', kind: 'write', title: 'the API another page can call',
    from: 'window.WaffleRank = {', count: 14 },
  { file: 'img', kind: 'fetch', title: 'download ten Commons waffle photos at 1100 pixels',
    text: 'curl -L "commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1100" > img/sources.json' },
  { file: 'CREDITS.txt', kind: 'write', title: 'author and license for every photo',
    from: '1. img/berlin-waffle-ice-cream.jpg', count: 7 },
  { file: 'README.md', kind: 'write', title: 'what it is, how to run it, how to embed it',
    from: '## Run it', count: 12 }
];

const EM_DASH = '\u2014';

function linesOf(file) {
  const path = join(here, file);
  const text = readFileSync(path, 'utf8');
  return { path, text, lines: text.split('\n') };
}

const cache = new Map();
function src(file) {
  if (!cache.has(file)) cache.set(file, linesOf(file));
  return cache.get(file);
}

const steps = [];
let totalChars = 0;

STEPS.forEach((def, index) => {
  const entry = {
    step: index + 1,
    file: def.file,
    kind: def.kind,
    title: def.title
  };
  if (def.kind === 'write') {
    const { lines } = src(def.file);
    const at = lines.findIndex((line) => line.includes(def.from));
    if (at === -1) {
      console.error(`needle not found: ${def.file} :: ${def.from}`);
      process.exit(1);
    }
    const slice = lines.slice(at, at + def.count);
    const snippet = slice.join('\n').replace(/\s+$/, '');
    if (snippet.includes(EM_DASH)) {
      console.error(`em dash inside snippet for ${def.file}: ${def.from}`);
      process.exit(1);
    }
    entry.startLine = at + 1;
    entry.endLine = at + slice.length;
    entry.snippet = snippet;
  } else {
    entry.snippet = def.text;
  }
  entry.chars = entry.snippet.length;
  totalChars += entry.chars;
  steps.push(entry);
});

/* every file the animation names must exist on disk */
for (const def of STEPS) {
  if (def.kind !== 'write') continue;
  try {
    statSync(join(here, def.file));
  } catch (err) {
    console.error(`missing file named by a step: ${def.file}`);
    process.exit(1);
  }
}

const out = {
  app: 'Waffle Rank',
  entry: 'index.html',
  servedFrom: 'the site/ directory',
  description:
    'Build steps in the order the site would be written. Each snippet is a real slice of the shipped file, ' +
    'so an animation can stream them one after another to look like the site generating itself.',
  generator: 'make-build-steps.mjs',
  totals: { steps: steps.length, snippetChars: totalChars },
  steps
};

writeFileSync(join(here, 'build-steps.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`build-steps.json written: ${steps.length} steps, ${totalChars} snippet characters`);
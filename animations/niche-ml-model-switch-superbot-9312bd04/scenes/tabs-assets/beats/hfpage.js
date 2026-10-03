// The Hugging Face model page of the finale (beats/hfhub.js mounts it): the data and the markup, no clock.
// A stripped model page in Hugging Face's light theme with NO controls: the header bar carries only the Hugging Face mark
// and its name; the title row "wrenfield / backyard-birds-vit" (no copy icon, no like, no follow); one plain muted tag
// line (no pills); no tabs; a thin rule, then the model card (HF's rendered-README prose: H1, a paragraph, the results
// table, the sample predictions with real photos) and, on 16:9, a right column with the confusion matrix, the Training
// chart and the model size. Every colour, size and face is measured from huggingface.co (hfhub.css has the values).
//
// The confusion matrix is built ONCE at module load from a fixed seed (mulberry32(6)), so it is the same every frame
// and every load: 24 species, 230 held-out photos (21 species with 10 or 11 photos, the 3 rare species with 4 each),
// 217 on the diagonal (94.3%), 13 off it: house finch -> purple finch 3, purple finch -> house finch 2, and 8 single
// mix-ups elsewhere (two of them in rare species). Macro F1 from this matrix is 0.933 (shown as 0.93).
const photo = (f) => new URL('../../../photos/' + f, import.meta.url).href;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const OWNER = 'wrenfield', REPO = 'backyard-birds-vit';
export const TAGS = 'Image Classification, Transformers, PyTorch, Safetensors, 24 classes';
export const H1 = 'Backyard Birds ViT';
export const PARA = 'Fine-tuned from google/vit-base-patch16-224 on 2,302 of my own backyard photos of 24 species.';
export const H2_RES = 'Results on 230 held-out photos';
export const RESULTS = [['Accuracy', '94.3%'], ['Macro F1', '0.93'], ['Top-3 accuracy', '99.1%']];
export const H2_SMP = 'Sample predictions';
export const SAMPLES = [
  ['sample-northern-cardinal.jpg', 'Northern cardinal', '0.99'],
  ['sample-blue-jay.jpg', 'Blue jay', '0.98'],
  ['sample-purple-finch.jpg', 'Purple finch', '0.91'],
  ['sample-carolina-wren.jpg', 'Carolina wren', '0.97'],
];
export const MX_LABEL = 'Confusion matrix';
export const MX_NOTE = 'house finch and purple finch: 5 mix-ups';
export const TRAIN_LABEL = 'Training';
export const SIZE = 'Model size 85.8M params';
export const ACC = 94.3;

// ---- the matrix (rows: the true species, columns: the predicted one) ----
// the 24 classes (never drawn as axis labels; named here so the data reads): the finch pair sits at 20 and 21, next to
// each other on the diagonal, so their two mix-up cells touch it
export const CLASSES = [
  'Northern cardinal', 'Blue jay', 'American robin', 'Black-capped chickadee', 'American goldfinch', 'Downy woodpecker',
  'Song sparrow', 'House sparrow', 'Mourning dove', 'Cedar waxwing', 'Carolina wren', 'Eastern bluebird',
  'Tufted titmouse', 'White-breasted nuthatch', 'Dark-eyed junco', 'Red-winged blackbird', 'European starling',
  'Hairy woodpecker', 'Red-bellied woodpecker', 'Northern mockingbird', 'House finch', 'Purple finch',
  'Baltimore oriole', 'Rose-breasted grosbeak',
];
export const N = 24, HF = 20, PF = 21, RARE = [9, 22, 23];
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const MATRIX = (() => {
  const R = mulberry32(6);
  const n = Array(N).fill(10);
  RARE.forEach((i) => { n[i] = 4; });
  [0, 1, 2, 4, 6, HF, PF, 12].forEach((i) => { n[i] = 11; });
  const M = [...Array(N)].map(() => Array(N).fill(0));
  M[HF][PF] = 3; M[PF][HF] = 2;
  const rows = new Set([HF, PF]);
  const pickRow = (pool) => { for (;;) { const r = pool[Math.floor(R() * pool.length)]; if (!rows.has(r)) { rows.add(r); return r; } } };
  const common = [...Array(N).keys()].filter((i) => !RARE.includes(i) && i !== HF && i !== PF);
  const errRows = [pickRow(RARE), pickRow(RARE), ...[...Array(6)].map(() => pickRow(common))];
  for (const r of errRows) {
    let c;
    do { c = Math.floor(R() * N); } while (c === r || (r === HF && c === PF) || (r === PF && c === HF));
    M[r][c] += 1;
  }
  for (let i = 0; i < N; i++) M[i][i] = n[i] - M[i].reduce((a, b, j) => a + (j === i ? 0 : b), 0);
  // the cell's value on the ramp: the share of the row's photos, eased so a single mix-up still reads
  const V = M.map((row, i) => row.map((c) => (c ? Math.pow(c / n[i], 0.6) : 0)));
  const total = n.reduce((a, b) => a + b, 0), diag = M.reduce((a, r, i) => a + r[i], 0);
  return { n, M, V, total, diag };
})();

// ---- the Training chart: 8 epochs, train loss falling, validation accuracy rising to 94.3% ----
export const LOSS = [1.92, 0.88, 0.52, 0.36, 0.27, 0.21, 0.17, 0.15];
export const VACC = [71.4, 84.8, 89.6, 91.7, 92.6, 93.5, 93.9, 94.3];

// ---- markup ----
export function pageHtml(logo) {
  const cells = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) cells.push(`<rect data-i="${i}" data-j="${j}"/>`);
  return `<div class="hf-full" aria-hidden="true"><div class="hf-app">
  <div class="hf-bar"><img class="hf-logo" src="${logo}" alt=""/><span class="hf-brand">Hugging Face</span></div>
  <div class="hf-head">
    <div class="hf-title"><span class="hf-own">${esc(OWNER)}</span><span class="hf-sl">/</span><span class="hf-repo">${esc(REPO)}</span></div>
    <div class="hf-tags">${esc(TAGS)}</div>
  </div>
  <div class="hf-body">
    <div class="hf-intro hf-e"><div class="hf-h1">${esc(H1)}</div><p class="hf-p">${esc(PARA)}</p></div>
    <div class="hf-res hf-e"><div class="hf-h2">${esc(H2_RES)}</div>
      <table class="hf-tb"><tbody>${RESULTS.map(([k, v], i) => `<tr><td>${esc(k)}</td><td class="hf-v">${esc(v)}</td></tr>`).join('')}</tbody></table></div>
    <div class="hf-stats hf-e">${RESULTS.map(([k, v], i) => `<div class="hf-stat"><span class="hf-sv">${esc(v)}</span><span class="hf-sk">${esc(k)}</span></div>`).join('')}</div>
    <div class="hf-smp hf-e"><div class="hf-h2">${esc(H2_SMP)}</div>
      <div class="hf-grid">${SAMPLES.map(([f, name, p]) => `<figure class="hf-fig"><span class="hf-im"><img src="${photo(f)}" alt="" decoding="sync"/></span><figcaption>${esc(name)} <span class="hf-pr">${esc(p)}</span></figcaption></figure>`).join('')}</div></div>
    <div class="hf-mxw hf-e">
      <div class="hf-mh"><span class="hf-lab">${esc(MX_LABEL)}</span><span class="hf-mac"><b class="hf-acc">0.0%</b> accuracy</span></div>
      <svg class="hf-mx" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g class="hf-grid-bg"><rect class="hf-frame"/></g>
        <g class="hf-cells">${cells.join('')}</g>
        <g class="hf-note"><path class="hf-lead"/><text class="hf-nt">${esc(MX_NOTE)}</text></g>
      </svg>
    </div>
    <div class="hf-trw hf-e">
      <div class="hf-lab">${esc(TRAIN_LABEL)}</div>
      <svg class="hf-ch" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g class="hf-ax"></g>
        <polyline class="hf-loss"/><polyline class="hf-vacc"/>
        <g class="hf-lg"><text class="hf-lt hf-lt-l">training loss</text><text class="hf-lt hf-lt-a">validation accuracy</text></g>
      </svg>
      <div class="hf-size">${esc(SIZE)}</div>
    </div>
  </div>
</div></div>`;
}

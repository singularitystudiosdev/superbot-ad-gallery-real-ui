'use strict';

// ---- data ----
let ITEMS = [];
let filter = 'All';
let typeFilter = localStorage.getItem('gallery.type') || 'all'; // 'all' | 'animation' | 'image'
if (!['all', 'animation', 'image'].includes(typeFilter)) typeFilter = 'all';
let openIdx = -1; // index into filtered list currently shown in the lightbox

const $ = (id) => document.getElementById(id);

// ---- aspect ratio (the animations read ?ar= through assets/ar.js) ----
const RATIOS = [['4x5', '4:5', 4 / 5], ['16x9', '16:9', 16 / 9], ['4x3', '4:3', 4 / 3], ['1x1', '1:1', 1]];
let ar = localStorage.getItem('gallery.ar') || '16x9';
if (!RATIOS.some(r => r[0] === ar)) ar = '16x9';

// the download link: assets/video/<id>.<ratio>.mp4, rendered offline by .tmp/ar-render (one loop, 1080 high)
function renderDl() {
  const a = $('lbDl');
  const it = $('lb').hidden ? null : filtered()[openIdx];
  if (!it) { a.hidden = true; return; }
  if (it.type === 'image') { // a static ad downloads as the PNG for the picked ratio
    const k = arOf(it);
    a.href = srcFor(it, it.src);
    a.download = `${it.id}-${k}.png`;
    const s = sizeOf(it, k);
    a.textContent = s ? `⤓ download ${s.w}×${s.h}` : '⤓ download png';
    a.hidden = false;
    return;
  }
  const label = RATIOS.find(x => x[0] === ar)[1];
  a.href = `assets/video/${it.id}.${ar}.mp4`;
  a.download = `${it.id}-${label.replace(':', 'x')}.mp4`;
  a.textContent = `⤓ download ${label}`;
  a.hidden = false;
}

// a static ad ships one PNG per ratio (assets/ads/<id>.<ar>.png) and its src
// carries a {ar} slot; an item without `ars` is served as-is
function arOf(it) {
  if (!it.ars || !it.ars.length) return ar;
  return it.ars.includes(ar) ? ar : it.ars[0];
}
function srcFor(it, path) {
  return it.ars ? path.replace('{ar}', arOf(it)) : path;
}
function sizeOf(it, key) {
  const s = it.sizes && it.sizes[key || arOf(it)];
  return s || (it.w ? { w: it.w, h: it.h } : null);
}

function renderAr() {
  const box = $('lbAr');
  box.innerHTML = '';
  document.documentElement.style.setProperty('--tile-ar', RATIOS.find(x => x[0] === ar)[1].replace(':', '/'));
  for (const [key, label] of RATIOS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = key === ar ? 'on' : '';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(key === ar));
    b.textContent = label;
    b.onclick = () => setAr(key);
    box.appendChild(b);
  }
}

function setAr(key) {
  if (key === ar) return;
  ar = key;
  localStorage.setItem('gallery.ar', key);
  renderAr();
  renderGrid(); // the static ads swap to the PNG rendered at this ratio
  if (!$('lb').hidden) renderStage(); // reloads the open frame at the new ratio; every spot loops anyway
  renderDl();
}

// the frame fits the same box the 16:9 frame used (92vw x 82vh, capped at 1280x720) at the chosen ratio
function frameSize() {
  const r = RATIOS.find(x => x[0] === ar)[2];
  const bw = Math.min(innerWidth * 0.92, 1280), bh = Math.min(innerHeight * 0.82, 720);
  const w = Math.min(bw, bh * r);
  return { w: Math.round(w), h: Math.round(w / r) };
}

function sizeFrame() {
  const f = $('lbStage').querySelector('iframe');
  if (!f) return;
  const { w, h } = frameSize();
  f.style.width = `${w}px`;
  f.style.height = `${h}px`;
}
addEventListener('resize', sizeFrame);

// group filter and type filter apply together (AND); each picker's own
// counts are computed against the OTHER filter's current selection, so the
// numbers shown always match what picking that option would actually show
function byGroup(list) { return list.filter(i => filter === 'All' || i.group === filter); }
function byType(list) { return list.filter(i => typeFilter === 'all' || i.type === typeFilter); }
function filtered() {
  return byType(byGroup(ITEMS));
}

// ---- grid + filters ----
function renderChips() {
  const base = byType(ITEMS);
  const counts = { All: base.length };
  for (const it of base) counts[it.group] = (counts[it.group] || 0) + 1;
  if (!(filter in counts)) filter = 'All'; // the active group vanished under the current type filter
  const chips = $('chips');
  chips.innerHTML = '';
  if (Object.keys(counts).length < 3) { chips.hidden = true; return; } // one real group: no filters
  for (const [name, n] of Object.entries(counts)) {
    const b = document.createElement('button');
    b.className = 'chip' + (filter === name ? ' on' : '');
    b.textContent = `[${name.toLowerCase()} ${n}]`;
    b.onclick = () => { filter = name; renderChips(); renderGrid(); };
    chips.appendChild(b);
  }
}

// the media-type picker: All / Videos (animation) / Images, same chip look
function renderTypePicker() {
  const base = byGroup(ITEMS);
  const counts = {
    all: base.length,
    animation: base.filter(i => i.type === 'animation').length,
    image: base.filter(i => i.type === 'image').length,
  };
  const box = $('typePick');
  box.innerHTML = '';
  const LABELS = [['all', 'all'], ['animation', '▶ videos'], ['image', '⤢ images']];
  for (const [key, label] of LABELS) {
    const b = document.createElement('button');
    b.className = 'chip' + (typeFilter === key ? ' on' : '');
    b.textContent = `[${label} ${counts[key]}]`;
    b.onclick = () => {
      typeFilter = key;
      localStorage.setItem('gallery.type', key);
      renderTypePicker();
      renderChips();
      renderGrid();
    };
    box.appendChild(b);
  }
}

function renderGrid() {
  const list = filtered();
  const grid = $('grid');
  grid.innerHTML = '';
  $('empty').hidden = list.length > 0;
  $('count').textContent = `${list.length} items`;
  for (const it of list) {
    const t = document.createElement('button');
    t.className = 'tile' + (it.type === 'animation' ? ' anim' : '');
    const s = sizeOf(it);
    const wh = s ? ` width="${s.w}" height="${s.h}"` : '';
    t.innerHTML =
      `<img src="${srcFor(it, it.thumb)}" alt="${it.title}" loading="lazy"${wh}>` +
      `<span class="meta"><span class="badge">${it.type === 'animation' ? '▶ play' : '⤢ zoom'}</span>` +
      `<span class="g">${it.group}</span><br><span class="t">${it.title}</span></span>`;
    const im = t.querySelector('img');
    if (im.complete) im.classList.add('loaded');
    else im.onload = () => im.classList.add('loaded');
    t.onclick = (e) => open(it, e);
    grid.appendChild(t);
  }
}

// ---- lightbox ----
function renderStage() {
  const list = filtered();
  const it = list[openIdx];
  const stage = $('lbStage');
  stage.innerHTML = '';
  if (it.type === 'image') {
    const img = document.createElement('img');
    img.src = srcFor(it, it.src);
    img.alt = it.title;
    img.onclick = (e) => { // click-to-zoom, origin follows the click
      img.style.setProperty('--zx', `${(e.clientX / innerWidth) * 100}%`);
      img.style.setProperty('--zy', `${(e.clientY / innerHeight) * 100}%`);
      img.classList.toggle('zoomed');
    };
    stage.appendChild(img);
  } else {
    const f = document.createElement('iframe');
    f.src = `${it.src}${it.src.includes('?') ? '&' : '?'}ar=${ar}`;
    f.allow = 'autoplay';
    f.title = it.title;
    // refocus the parent so ESC/arrows keep working after the frame grabs focus
    f.addEventListener('load', () => $('lbClose').focus());
    // a click or key in the lightbox is a user gesture the spot can use to
    // unmute its clips (Safari and Chrome refuse sound before one)
    const nudge = () => { try { f.contentWindow.postMessage({ type: 'unmute' }, '*'); } catch {} };
    $('lb').addEventListener('pointerdown', nudge, { passive: true });
    $('lb').addEventListener('keydown', nudge);
    stage.appendChild(f);
    sizeFrame();
  }
  renderDl();
  $('lbTitle').textContent = it.title;
  const arLabel = RATIOS.find(x => x[0] === (it.type === 'image' ? arOf(it) : ar))[1];
  $('lbPos').textContent = `${openIdx + 1} / ${list.length} · ${it.group}${it.type === 'animation' || it.ars ? ` · ${arLabel}` : ''}`;
}

function open(item, e) {
  openIdx = filtered().indexOf(item);
  if (e) { // open transition grows from the clicked tile
    $('lbStage').style.setProperty('--ox', `${(e.clientX / innerWidth) * 100}%`);
    $('lbStage').style.setProperty('--oy', `${(e.clientY / innerHeight) * 100}%`);
  }
  $('lb').hidden = false;
  document.body.classList.add('lb-open');
  document.body.style.overflow = 'hidden';
  renderStage();
}

function close() {
  $('lb').hidden = true;
  document.body.classList.remove('lb-open');
  $('lbDl').hidden = true;
  $('lbStage').innerHTML = ''; // kills the iframe rAF + audio
  document.body.style.overflow = '';
}

function step(d) {
  const list = filtered();
  openIdx = (openIdx + d + list.length) % list.length;
  renderStage();
}

$('lbClose').onclick = close;
$('lbPrev').onclick = () => step(-1);
$('lbNext').onclick = () => step(1);
$('lb').addEventListener('click', (e) => { if (e.target === $('lb')) close(); });
document.addEventListener('keydown', (e) => {
  if ($('lb').hidden) return;
  if (e.key === 'Escape') close();
  else if (e.key === 'ArrowLeft') step(-1);
  else if (e.key === 'ArrowRight') step(1);
});

// ---- boot ----
fetch('manifest.json')
  .then(r => r.json())
  .then(data => { ITEMS = data; renderAr(); renderTypePicker(); renderChips(); renderGrid(); })
  .catch(err => {
    console.error(err);
    document.getElementById('empty').hidden = false;
    document.getElementById('empty').textContent = 'failed to load manifest.json — serve over http';
  });

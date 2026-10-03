// Vault beat, the finale: superbot opens the user's own Obsidian vault and writes the notes into it. Obsidian is a
// local app whose vault is a folder of Markdown files, so there is no consent screen, account or cloud API here: a
// connect card lands in the chat (the superbot mark and the official Obsidian mark side by side, a thin line drawing
// between them, the vault "Second Brain" and its folder "~/Notes/Second Brain"), then four rows tick green ("Opened
// your vault Second Brain, 1,284 notes", "Added 46 notes to Sources/Sleep", "Linked them to 31 notes you already
// had", "Made a map note: Sleep and Memory"). A mini window under the rows holds the vault; the card holds and the
// window opens to the full frame (the base's grow machinery). Full frame is Obsidian's default dark theme, three panes
// and no chrome controls at all (no ribbon, tab strip, title-bar buttons, toolbar, search or status bar): the file
// explorer as plain text with folder glyphs (16:9 only; the 12 new notes cascade into Sources/Sleep, then "+34 more"
// as muted text), the map note "Sleep and Memory" in reading view (links in the accent, no underline, no brackets),
// and the graph: ~60 existing grey notes in clusters. The ONE bold moment: the 46 new notes bloom in the accent from
// the map note outwards, their 212 links draw to each other and to 31 notes the user already had (those brighten),
// the plain-text count lands on "212 links", the chime fires as the last link lands (window.__AD_MARKS.chime) and the
// camera pushes into the graph. The final state holds (READ).
//
// There is ONE Obsidian client, on a layer in the scene root (outside the camera). While the connect card sits in the
// chat the layer is pinned over the card's window; GROW interpolates it to the whole frame. The client is laid out
// once per frame size at a design size (the frame divided by APP_SCALE) and scaled to the layer. On a portrait frame
// (4:5) it drops the explorer and stacks the map note (45%) over the graph (55%). The graph layout is a seeded force
// layout computed ONCE at module load (mulberry32, fixed iterations), then fitted to the graph pane per frame size:
// every node, link and opacity is a pure function of t.
import { lerp, seg, outCubic, outQuint, inOutCubic } from '../../../lib.js';
import { oi } from './obsidian-icons.js?v=d1018d78';

const VAULT = 'Second Brain';
const PATH = '~/Notes/Second Brain';
const STEPS = [
  ['folder-open', `Opened your vault <b>${VAULT}</b>, 1,284 notes`],
  ['file-plus', 'Added 46 notes to <b>Sources/Sleep</b>'],
  ['link', 'Linked them to 31 notes you already had'],
  ['map', 'Made a map note: <b>Sleep and Memory</b>'],
];
// the explorer, A to Z as Obsidian sorts it. The 12 new notes shown under Sources/Sleep (A to Z), then the rest as text
const NEW_NOTES = [
  'Deep sleep moves memories to the cortex', 'REM sleep softens hard memories', 'Naps before learning beat naps after',
  'A 20 minute nap avoids grogginess', 'Caffeine lingers six hours', 'All-nighters cut recall the next day',
  'Sleep spindles lock in new skills', 'Screens delay melatonin', 'Morning light sets the body clock',
  'Cool rooms deepen sleep', 'Alcohol fragments REM', 'Consistent wake time beats sleeping in',
].sort((a, b) => a.localeCompare(b, 'en'));
const MORE = '+34 more';
const MAP = 'Sleep and Memory';
// the map note, reading view
const NOTE = {
  h1: MAP,
  sub: '46 notes from 40 articles, linked to 31 you already had',
  secs: [
    ['How sleep stores memory', ['Deep sleep moves memories to the cortex', 'Sleep spindles lock in new skills', 'REM sleep softens hard memories']],
    ['Naps', ['Naps before learning beat naps after', 'A 20 minute nap avoids grogginess']],
    ['Already in your vault', ['Spaced repetition', 'Exam prep 2026', 'Hippocampus', 'Morning routine']],
  ],
};
const LINKS = 212, NEW_N = 46, LINKED = 31;

const APP_SCALE = { wide: 1.3, tall: 1.0 };      // full frame: the client's px to frame px
// timing (seconds from the reply start, or from the card where noted)
const CARD_AT = 0.12;                           // reply start to the connect card rising
const CARD_IN = 0.3;                            // a card rising into the thread
const LINE_AT = 0.18;                           // the card landing to the line drawing between the two marks
const LINE = 0.35;                              // the line drawing
const CHECK_AT = 0.55;                          // the card landing to the first row's check
const CHECK_STAGGER = 0.16;                     // one row to the next
const POP = 0.16;                               // a check popping in
const CARD_HOLD = 0.3; /* deliberate */         // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */             // the window opens to full frame
const CAS_AT = 0.2;                             // full frame to the first new note in the explorer
const CAS = 0.06;                               // one note to the next (quick)
const ROW_IN = 0.18;                            // a note's row fading up
const BLOOM_AT = 0.55; /* deliberate */         // full frame to the map note's node blooming (the panes read first)
const BLOOM_SPAN = 0.95; /* deliberate */       // the other 45 nodes bloom outwards from the map note over this
const NODE_IN = 0.22;                           // a node scaling up
const EDGE_AT = 0.06;                           // both ends in, then a link starts drawing
const EDGE_IN = 0.22;                           // a link drawing
const PUSH_AT = 0.12; /* deliberate */          // the last link in (the chime), then the push into the graph
const PUSH_IN = 0.5; /* deliberate */           // the push, outQuint
const PUSH = { wide: 1.12, tall: 1.08 };        // the push's scale: about the graph's centre on 4:5, about the graph's
                                                // centre column at the top edge on 16:9 (the map note's title stays in)
const SHIFT = { wide: 0.3, tall: 0.22 };        // ...and the graph travels this share of the way to the frame's centre
const READ = 1.3; /* deliberate */              // the final state holds, readable, before the scene's fade
const RADIUS = 8;                               // the window's radius in the card (Obsidian's --radius-m), eased to 0

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="vc-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

// ---------------- the graph: built and laid out once, deterministic ----------------
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const GRAPH = (() => {
  const R = mulberry32(1018);
  // the vault: 60 notes in five clusters; the first of each is its hub. Clusters 0 and 1 and the first 5 of cluster 2
  // are the 31 notes the new ones link to
  const SIZES = [14, 12, 12, 11, 11];
  const NAMES = [['Spaced repetition', 'Exam prep 2026'], ['Hippocampus', 'Neocortex'], ['Morning routine'], ['Weekly review'], ['Reading notes']];
  const nodes = [], edges = [];
  SIZES.forEach((n, c) => {
    const first = nodes.length;
    for (let i = 0; i < n; i++) {
      nodes.push({ c, old: true, label: NAMES[c][i] || null, linked: c < 2 || (c === 2 && i < 5) });
      if (i > 0) {
        // each note links to its hub or to an earlier note in its cluster, sometimes both
        const j = first + (R() < 0.5 ? 0 : Math.floor(R() * i));
        edges.push([first + i, j, true]);
        if (R() < 0.35) { const k = first + Math.floor(R() * i); if (k !== j) edges.push([first + i, k, true]); }
      }
    }
  });
  // a few links between clusters (hub to hub, and strays)
  [[0, 14], [0, 26], [14, 26], [26, 38], [38, 49], [0, 49]].forEach(([a, b]) => edges.push([a, b, true]));
  for (let i = 0; i < 6; i++) { const a = Math.floor(R() * 60), b = Math.floor(R() * 60); if (nodes[a].c !== nodes[b].c) edges.push([a, b, true]); }
  const OLD = nodes.length;
  // the 46 new notes: the map note first (linked to every other new note), then 45
  for (let i = 0; i < NEW_N; i++) nodes.push({ c: -1, old: false, label: i === 0 ? MAP : null, linked: false });
  const linkedIds = nodes.map((n, i) => (n.linked ? i : -1)).filter((i) => i >= 0);
  const newE = [];
  for (let i = 1; i < NEW_N; i++) newE.push([OLD, OLD + i]);                                   // 45: the map note
  linkedIds.forEach((e, i) => newE.push([OLD + 1 + (i * 7) % (NEW_N - 1), e]));                  // 31: one per linked note
  const seen = new Set(newE.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`));
  while (newE.length < LINKS) {                                                                 // the rest: new to new, new to linked
    const a = OLD + 1 + Math.floor(R() * (NEW_N - 1));
    const b = R() < 0.55 ? OLD + 1 + Math.floor(R() * (NEW_N - 1)) : linkedIds[Math.floor(R() * linkedIds.length)];
    const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
    if (a === b || seen.has(key)) continue;
    seen.add(key); newE.push([a, b]);
  }
  newE.forEach(([a, b]) => edges.push([a, b, false]));

  // force layout (Fruchterman-Reingold), fixed iterations: the vault first, then the new notes with the vault fixed
  const P = nodes.map((n) => {
    const ang = (n.c >= 0 ? n.c : 0) * (2 * Math.PI / 5) + 0.6;
    return n.old ? { x: Math.cos(ang) * 0.8 + (R() - 0.5) * 0.35, y: Math.sin(ang) * 0.8 + (R() - 0.5) * 0.35 } : { x: 0, y: 0 };
  });
  const run = (ids, E, iters, k, grav, cx, cy) => {
    let temp = 0.1;
    for (let it = 0; it < iters; it++) {
      const D = ids.map(() => ({ x: 0, y: 0 }));
      const at = new Map(ids.map((id, i) => [id, i]));
      ids.forEach((a, ia) => {
        for (let b = 0; b < P.length; b++) {
          if (a === b) continue;
          const dx = P[a].x - P[b].x, dy = P[a].y - P[b].y;
          const d2 = Math.max(1e-4, dx * dx + dy * dy);
          const f = (k * k) / d2;
          D[ia].x += dx * f; D[ia].y += dy * f;
        }
      });
      E.forEach(([a, b]) => {
        const dx = P[a].x - P[b].x, dy = P[a].y - P[b].y, d = Math.sqrt(dx * dx + dy * dy) || 1e-3;
        const f = d / k;
        if (at.has(a)) { D[at.get(a)].x -= dx * f; D[at.get(a)].y -= dy * f; }
        if (at.has(b)) { D[at.get(b)].x += dx * f; D[at.get(b)].y += dy * f; }
      });
      ids.forEach((id, i) => {
        D[i].x -= (P[id].x - cx) * grav; D[i].y -= (P[id].y - cy) * grav;
        const l = Math.sqrt(D[i].x * D[i].x + D[i].y * D[i].y) || 1e-6;
        const s = Math.min(l, temp) / l;
        P[id].x += D[i].x * s; P[id].y += D[i].y * s;
      });
      temp = Math.max(0.002, temp * 0.988);
    }
  };
  const oldIds = nodes.map((_, i) => i).filter((i) => i < OLD);
  run(oldIds, edges.filter((e) => e[2]), 400, 0.2, 0.16, 0, 0);
  // the new notes start around the notes they link to
  const lc = linkedIds.reduce((s, i) => ({ x: s.x + P[i].x / linkedIds.length, y: s.y + P[i].y / linkedIds.length }), { x: 0, y: 0 });
  for (let i = OLD; i < nodes.length; i++) { P[i].x = lc.x + (R() - 0.5) * 0.5; P[i].y = lc.y + (R() - 0.5) * 0.5; }
  P[OLD].x = lc.x; P[OLD].y = lc.y;
  const newIds = nodes.map((_, i) => i).filter((i) => i >= OLD);
  run(newIds, edges.filter((e) => !e[2]), 400, 0.27, 0.08, lc.x, lc.y);

  // degree -> radius (Obsidian sizes a node by its links)
  const deg = nodes.map(() => 0);
  edges.forEach(([a, b]) => { deg[a]++; deg[b]++; });
  nodes.forEach((n, i) => { n.r = 2.4 + 1.05 * Math.sqrt(deg[i]); n.x = P[i].x; n.y = P[i].y; });
  // bloom order: the map note, then outwards by distance from it
  const m = P[OLD];
  const order = newIds.slice(1).sort((a, b) => Math.hypot(P[a].x - m.x, P[a].y - m.y) - Math.hypot(P[b].x - m.x, P[b].y - m.y));
  nodes[OLD].rank = 0;
  order.forEach((id, i) => { nodes[id].rank = 1 + i; });
  return { nodes, edges, OLD };
})();

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the connect card lands
    T.line = T.card + LINE_AT;
    T.ok = STEPS.map((_, i) => T.card + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame
    T.cas = NEW_NOTES.map((_, i) => T.full + CAS_AT + i * CAS);
    T.more = T.full + CAS_AT + NEW_NOTES.length * CAS;
    T.b0 = T.full + BLOOM_AT;                          // the map note's node blooms
    // every new node's bloom, every link's start and end
    T.bloom = GRAPH.nodes.map((n) => (n.old ? -Infinity : n.rank === 0 ? T.b0 : T.b0 + 0.12 + ((n.rank - 1) / (NEW_N - 2)) * BLOOM_SPAN));
    T.edge = GRAPH.edges.map(([a, b, old]) => (old ? null : Math.max(T.bloom[a], T.bloom[b]) + EDGE_AT));
    T.zero = Math.max(...T.edge.filter((e) => e !== null)) + EDGE_IN; // the last link lands: the chime
    T.push = T.zero + PUSH_AT;
    T.settle = T.push + PUSH_IN;
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.zero });

    // ---- the connect card (superbot's own, the hub's greys and green check), the mini window under the rows ----
    const card = x.el(`<div class="vc-card">
      <div class="vc-top">
        <div class="vc-marks">${x.tile('superbot', 'vc-sb')}<i class="vc-line"><i></i></i><img class="vc-ob" src="${x.brand('obsidian-mark.svg')}" alt=""/></div>
        <div class="vc-vault"><b>${esc(VAULT)}</b><span>${esc(PATH)}</span></div>
      </div>
      ${STEPS.map(([ic, txt]) => `<div class="vc-step"><span class="vc-ic">${oi(ic)}</span><span class="vc-tx">${txt}</span><span class="vc-ok"><i class="vc-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="vc-shot"></div>
    </div>`);
    const shot = card.querySelector('.vc-shot');
    const lineFill = card.querySelector('.vc-line i');
    const checks = [...card.querySelectorAll('.vc-ok')].map((n) => ({ spin: n.querySelector('.vc-spin'), ck: n.querySelector('.vc-ck') }));

    // ---- the full-frame Obsidian client ----
    const row = (ic, name, cls = '') => `<div class="ob-row ${cls}">${ic ? oi(ic, 'ob-fi') : '<i class="ob-sp"></i>'}<span>${esc(name)}</span></div>`;
    const G = GRAPH;
    const layer = x.el(`<div class="ob-full" aria-hidden="true"><div class="ob-app">
      <aside class="ob-side">
        <div class="ob-vname">${esc(VAULT)}</div>
        ${row('folder', 'Courses')}
        ${row('folder', 'Daily')}
        ${row('folder-open', 'Maps')}
        <div class="ob-kids">${row('', MAP, 'ob-file ob-on')}</div>
        ${row('folder', 'Projects')}
        ${row('folder-open', 'Sources')}
        <div class="ob-kids">
          ${row('folder-open', 'Sleep')}
          <div class="ob-kids ob-new">${NEW_NOTES.map((n) => row('', n, 'ob-file ob-cas')).join('')}<div class="ob-row ob-file ob-more"><i class="ob-sp"></i><span>${esc(MORE)}</span></div></div>
        </div>
      </aside>
      <section class="ob-note"><div class="ob-read">
        <h1 class="ob-h1 ob-e">${esc(NOTE.h1)}</h1>
        <p class="ob-sub ob-e">${esc(NOTE.sub)}</p>
        ${NOTE.secs.map(([h, items]) => `<h2 class="ob-h2 ob-e">${esc(h)}</h2><ul class="ob-ul">${items.map((it) => `<li class="ob-e"><span class="ob-ln">${esc(it)}</span></li>`).join('')}</ul>`).join('')}
      </div></section>
      <section class="ob-gp">
        <div class="ob-gh ob-e"><span class="ob-gl">Graph view</span><span class="ob-gc"><b>0</b> links</span></div>
        <svg class="ob-g" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <g class="ob-eo">${G.edges.map(([, , old]) => (old ? '<line/>' : '')).join('')}</g>
          <g class="ob-en">${G.edges.map(([, , old]) => (old ? '' : '<line/>')).join('')}</g>
          <g class="ob-nd">${G.nodes.map((n) => `<circle class="${n.old ? (n.linked ? 'ob-o ob-lk' : 'ob-o') : 'ob-n'}"/>`).join('')}</g>
          <g class="ob-lb">${G.nodes.map((n, i) => (n.label ? `<text data-i="${i}">${esc(n.label)}</text>` : '')).join('')}</g>
        </svg>
      </section>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const svg = $('.ob-g'), gp = $('.ob-gp');
    const oldLines = [...layer.querySelectorAll('.ob-eo line')], newLines = [...layer.querySelectorAll('.ob-en line')];
    const circles = [...layer.querySelectorAll('.ob-nd circle')];
    const labels = [...layer.querySelectorAll('.ob-lb text')].map((n) => ({ n, i: +n.dataset.i }));
    const cas = [...layer.querySelectorAll('.ob-cas')], more = $('.ob-more');
    const count = $('.ob-gc b');
    const side = $('.ob-side');
    const fades = [side, ...layer.querySelectorAll('.ob-e')];
    // edges split into the vault's own and the new ones, each with its index into GRAPH.edges
    const EO = [], EN = [];
    G.edges.forEach((e, i) => (e[2] ? EO : EN).push(i));

    let geo = '', AW = 1477, AH = 831, pushS = PUSH.wide, shiftK = SHIFT.wide;
    let L = null; // per frame size: node positions in the graph pane (design px), the push focus, faded edges
    let edgeOut = null, last = '';

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      const tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('ob-narrow', tall);
      card.classList.toggle('vc-tall', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      pushS = tall ? PUSH.tall : PUSH.wide; shiftK = tall ? SHIFT.tall : SHIFT.wide;
      edgeOut = null;
      // fit the graph into its pane (below its header), margins for the node radii and labels
      const gw = svg.clientWidth, gh = svg.clientHeight;
      svg.setAttribute('viewBox', `0 0 ${gw} ${gh}`);
      // turn the layout so its long axis lies along the pane's long axis (principal axis of the node cloud)
      const mx = G.nodes.reduce((a, n) => a + n.x, 0) / G.nodes.length, my = G.nodes.reduce((a, n) => a + n.y, 0) / G.nodes.length;
      let sxx = 0, syy = 0, sxy = 0;
      G.nodes.forEach((n) => { sxx += (n.x - mx) ** 2; syy += (n.y - my) ** 2; sxy += (n.x - mx) * (n.y - my); });
      const th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
      const rot = (gh > gw ? Math.PI / 2 : 0) - th, cr = Math.cos(rot), sr = Math.sin(rot);
      const RP = G.nodes.map((n) => ({ x: (n.x - mx) * cr - (n.y - my) * sr, y: (n.x - mx) * sr + (n.y - my) * cr }));
      const xs = RP.map((q) => q.x), ys = RP.map((q) => q.y);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const M = 36;
      let sx = (gw - 2 * M) / (x1 - x0), sy = (gh - 2 * M) / (y1 - y0);
      // fill the pane, but never stretch one axis more than 1.5x the other
      if (sx > sy * 1.5) sx = sy * 1.5; else if (sy > sx * 1.5) sy = sx * 1.5;
      const ox = (gw - (x1 - x0) * sx) / 2, oy = (gh - (y1 - y0) * sy) / 2;
      const rs = tall ? 1.15 : 1.25;
      const pos = G.nodes.map((n, i) => ({ x: ox + (RP[i].x - x0) * sx, y: oy + (RP[i].y - y0) * sy, r: n.r * rs }));
      G.edges.forEach(([a, b, old], i) => {
        const ln = old ? oldLines[EO.indexOf(i)] : newLines[EN.indexOf(i)];
        if (old) { ln.setAttribute('x1', pos[a].x.toFixed(1)); ln.setAttribute('y1', pos[a].y.toFixed(1)); ln.setAttribute('x2', pos[b].x.toFixed(1)); ln.setAttribute('y2', pos[b].y.toFixed(1)); }
      });
      circles.forEach((c, i) => { c.setAttribute('cx', pos[i].x.toFixed(1)); c.setAttribute('cy', pos[i].y.toFixed(1)); if (G.nodes[i].old) c.setAttribute('r', pos[i].r.toFixed(2)); });
      // labels under their nodes; a label that would overlap one placed before it (the map note's first) is not drawn
      const placed = [];
      [...labels].sort((a, b) => (G.nodes[a.i].old ? 1 : 0) - (G.nodes[b.i].old ? 1 : 0) || G.nodes[b.i].r - G.nodes[a.i].r).forEach((lb) => {
        const { n, i } = lb;
        const w = n.textContent.length * 5.8 + 6, h = 14, cx = pos[i].x, cy = pos[i].y + pos[i].r + 9;
        const box = { l: cx - w / 2, r: cx + w / 2, t: cy, b: cy + h };
        lb.hide = placed.some((q) => !(box.r < q.l || box.l > q.r || box.b < q.t || box.t > q.b)) || box.l < 2 || box.r > gw - 2;
        if (!lb.hide) placed.push(box);
        n.setAttribute('x', cx.toFixed(1)); n.setAttribute('y', (cy + 10).toFixed(1));
        n.style.display = lb.hide ? 'none' : '';
      });
      // the push's focus: the graph's centre, in the app's design px
      // (an <svg> has no offsetLeft/Top: it fills the pane under the header, so its box is the pane's lower gh px)
      const fx = gp.offsetLeft + gp.clientWidth / 2, fy = tall ? gp.offsetTop + (gp.clientHeight - gh) + gh / 2 : 0;
      L = { pos, fx, fy, tall };
    };

    const ok = (t, a) => outCubic(seg(t, a, a + POP));

    return {
      nodes: [card],
      marks: [[T.card, card]],
      render(t) {
        layout();
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        lineFill.style.transform = `scaleX(${inOutCubic(seg(t, T.line, T.line + LINE)).toFixed(4)})`;
        checks.forEach((c, i) => {
          const o = ok(t, T.ok[i]);
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // the explorer: the new notes cascade into Sources/Sleep, then "+34 more"
        cas.forEach((n, i) => {
          const o = outCubic(seg(t, T.cas[i], T.cas[i] + ROW_IN));
          n.style.opacity = o.toFixed(3);
          n.style.transform = o >= 1 ? 'none' : `translateX(${((1 - o) * -8).toFixed(2)}px)`;
        });
        more.style.opacity = outCubic(seg(t, T.more, T.more + ROW_IN)).toFixed(3);

        // the graph: the vault as it was, then the bloom
        if (!L) return;
        circles.forEach((c, i) => {
          const n = G.nodes[i];
          if (n.old) return;
          const p = outQuint(seg(t, T.bloom[i], T.bloom[i] + NODE_IN));
          c.setAttribute('r', (L.pos[i].r * p).toFixed(2));
        });
        // the vault's own nodes keep their size; a linked one brightens when its first new link lands
        const lit = new Set();
        let landed = 0;
        EN.forEach((ei, j) => {
          const [a, b] = G.edges[ei];
          const t0 = T.edge[ei];
          const p = inOutCubic(seg(t, t0, t0 + EDGE_IN));
          const ln = newLines[j];
          if (p <= 0) { ln.setAttribute('x1', '0'); ln.setAttribute('y1', '0'); ln.setAttribute('x2', '0'); ln.setAttribute('y2', '0'); ln.style.opacity = '0'; return; }
          // a link draws from the node that bloomed later towards the other
          const [from, to] = T.bloom[a] >= T.bloom[b] ? [a, b] : [b, a];
          const A = L.pos[from], B = L.pos[to];
          ln.setAttribute('x1', A.x.toFixed(1)); ln.setAttribute('y1', A.y.toFixed(1));
          ln.setAttribute('x2', lerp(A.x, B.x, p).toFixed(1)); ln.setAttribute('y2', lerp(A.y, B.y, p).toFixed(1));
          ln.style.opacity = '';
          if (t >= t0 + EDGE_IN - 1e-6) { landed++; if (G.nodes[to].old) lit.add(to); if (G.nodes[from].old) lit.add(from); }
        });
        circles.forEach((c, i) => {
          const n = G.nodes[i];
          if (!n.old) return;
          c.classList.toggle('on', lit.has(i));
        });
        labels.forEach(({ n, i }) => {
          const nd = G.nodes[i];
          n.style.opacity = nd.old ? '' : outCubic(seg(t, T.bloom[i] + 0.1, T.bloom[i] + 0.35)).toFixed(3);
        });
        const shown = t < T.b0 ? '' : String(landed);
        if (shown !== last) { count.textContent = shown || '0'; last = shown; }
        count.parentNode.style.opacity = outCubic(seg(t, T.b0 + 0.25, T.b0 + 0.45)).toFixed(3);
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame
      after(t) {
        if (t < T.card) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        const root = x.root;
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const Lx = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        layer.style.left = `${Lx.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        const k0 = Wd / AW;
        // the push into the graph: scaled about the graph's centre, which also travels part of the way to the frame's
        // centre; anything the pushed frame would only half show fades out with it
        const pz = g >= 1 ? outQuint(seg(t, T.push, T.push + PUSH_IN)) : 0;
        const ps = lerp(1, pushS, pz);
        const fx = L ? L.fx : 0, fy = L ? L.fy : 0;
        const dx = (AW / 2 - fx) * shiftK * pz, dy = L && L.tall ? (AH / 2 - fy) * shiftK * pz : 0;
        app.style.transform = pz > 0
          ? `translate(${(k0 * (fx * (1 - ps) + dx)).toFixed(2)}px, ${(k0 * (fy * (1 - ps) + dy)).toFixed(2)}px) scale(${(k0 * ps).toFixed(5)})`
          : `scale(${k0.toFixed(5)})`;
        if (g >= 1 && !edgeOut && L && pz === 0) {
          // in design px, at the push's end: which elements would sit partly outside the frame
          const ar = app.getBoundingClientRect(), kk = ar.width / AW;
          const map = (v, f, d) => f + (v - f) * pushS + d;
          const DX = (AW / 2 - fx) * shiftK, DY = L.tall ? (AH / 2 - fy) * shiftK : 0;
          edgeOut = fades.filter((n) => {
            const r = n.getBoundingClientRect();
            if (!r.width || !r.height) return false;
            const l = map((r.left - ar.left) / kk, fx, DX), rr = map((r.right - ar.left) / kk, fx, DX);
            const tt = map((r.top - ar.top) / kk, fy, DY), bb = map((r.bottom - ar.top) / kk, fy, DY);
            return l < -1 || rr > AW + 1 || tt < -1 || bb > AH + 1;
          });
        }
        fades.forEach((n) => { n.style.opacity = edgeOut && edgeOut.includes(n) ? (1 - pz).toFixed(3) : ''; });
        // while in the card, clip the window to the thread's visible band
        const feed = card.closest('.feed');
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};

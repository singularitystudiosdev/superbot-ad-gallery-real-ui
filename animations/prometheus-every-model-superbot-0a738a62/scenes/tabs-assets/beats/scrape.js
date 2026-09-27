// Scrape beat, chapter V · ARCHIVE: the routed model (DeepSeek V4 Flash) sweeps two open archives for what the
// PROMETHEUS film still needs: its parchment line-art plates and the artifacts of its later chapters. Its line
// streams, the "Sweeping 2 open archives" chip spins, and the sweep card rises: each archive row crawls (a thin HUD
// timeline fills in Roman red under its moving marker while its record count climbs, then its public-domain or
// Creative Commons hit count lands), and what it kept pops into two strips, each item on a parchment transparency
// swatch, labelled with what it is and the year the clip dates it: six plates (Euclid I.1, the Archimedes lever, the
// ROMA AETERNA arch, the IN PRINCIPIO page, the Hamlet quill, the Watt engine) and six artifacts (the monks' candle,
// the penicillin dish, the double helix, the moon boot print, the Intel 4004 die, the iPhone). Each artifact lands
// with a fact the sweep checks against the record. Every swatch is a real crop of the source clip
// (img/prometheus/assets.json decal[] and find[]); years are the clip's own (its sub-lines and the HUD ANNO reading
// over that frame, img/prometheus/chapters.json); nothing is drawn by hand.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = "Sweeping open archives for the film's plates and artifacts.";
// [archive, records swept, hits, licence]: archive.org for the plates (public-domain scans of the Elements, the
// Gutenberg Bible, the First Folio, Watt's engines), Wikimedia Commons for the artifacts
const SITES = [
  ['archive.org', 214, 6, 'PD'],
  ['commons.wikimedia.org', 187, 6, 'CC'],
];
const RECORDS = SITES.reduce((s, [, p]) => s + p, 0);
// [plate, what it is, year as the clip dates it, w, h, fit, alt]: img/prometheus/assets.json decal[]. Plates sit in
// landscape swatches: the quill plate is a full parchment square that fills its swatch ('fill'); the others are
// contained whole ('fit'), Euclid's square too, so the apex of its triangle is never cropped.
const DECALS = [
  ['prometheus/decal-1.png', 'Euclid I.1', '300 BC', 256, 256, 'fit', 'Euclid I.1, red equilateral triangle on AB between two construction circles'],
  ['prometheus/decal-2.png', 'Archimedes', '250 BC', 256, 256, 'fit', 'Archimedes lever on its fulcrum lifting the globe'],
  ['prometheus/decal-3.png', 'Constantine', 'AD 315', 256, 256, 'fit', 'Arch of Constantine inscribed ROMA AETERNA'],
  ['prometheus/decal-4.png', 'Gutenberg', 'AD 1455', 256, 256, 'fit', 'Gutenberg printed page, IN PRINCIPIO ERAT VERBVM'],
  ['prometheus/decal-5.png', 'Hamlet', 'AD 1600', 256, 256, 'fill', 'quill pen on parchment before the first word is written'],
  ['prometheus/decal-6.png', 'Watt engine', 'AD 1769', 256, 256, 'fit', 'Watt beam engine, governor, cylinder, beam and flywheel'],
];
// [artifact, what it is, year as the clip dates it, w, h, fit, alt, the fact checked]: img/prometheus/assets.json find[]
const FINDS = [
  ['prometheus/find-1.png', 'Candle', 'AD 800', 76, 544, 'fit', 'lit candle', 'monks copied the Vulgate'],
  ['prometheus/find-2.png', 'Penicillin', 'AD 1928', 349, 349, 'fit', 'penicillin petri dish', 'penicillin found in 1928'],
  ['prometheus/find-3.png', 'DNA helix', 'AD 1953', 276, 378, 'fit', 'DNA double helix', 'double helix published 1953'],
  ['prometheus/find-4.png', 'Boot print', '1969-1972', 172, 406, 'fit', 'lunar boot print', '12 men walked on the moon'],
  ['prometheus/find-5.png', 'Intel 4004', 'AD 1971', 440, 333, 'fit', '1971 chip die', '4004 held 2,300 transistors'],
  ['prometheus/find-6.png', 'iPhone', 'AD 2007', 216, 416, 'fit', 'iPhone', 'iPhone shipped in 2007'],
];
const CRAWL = 0.75;   // one archive's crawl, bar empty to full
const num = (n) => Math.round(n).toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.12;
    T.card = r + 0.22;
    T.site = SITES.map((_, i) => r + 0.3 + i * 0.08);
    T.decal = DECALS.map((_, i) => r + 0.7 + i * 0.09);
    T.find = FINDS.map((_, i) => r + 0.86 + i * 0.09);
    T.fact = T.find.map((a) => a + 0.18);         // each artifact's fact flips to checked
    T.done = T.find[FINDS.length - 1] + 0.22;   // the chip resolves: Swept 2 archives
    T.end = T.done + 0.3;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const swatch = ([src, name, year, w, h, fit, alt], cls) => `<div class="sc-find ${cls}"><span class="sc-sw${fit === 'fill' ? ' sc-fill' : ''}"><img src="${x.img(src)}" alt="${x.esc(alt)}" width="${w}" height="${h}"/></span><span class="sc-cap"><b>${x.esc(name)}</b><small>${x.esc(year)}</small></span></div>`;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Sweeping ${SITES.length} open archives</span><b class="sc-count">0 records</b></div></div>`);
    const card = x.el(`<div class="sc-card">
      <div class="sc-sites">${SITES.map(([site]) => `<div class="sc-row"><span class="sc-site">${x.esc(site)}</span><span class="sc-bar"><i></i><s></s></span><span class="sc-pg">0 records</span><span class="sc-hit">crawling</span></div>`).join('')}</div>
      <div class="sc-kept sc-kept-d"><span>Kept ${DECALS.length} plates</span><small>/prometheus/plates</small></div>
      <div class="sc-finds">${DECALS.map((d) => swatch(d, 'sc-d')).join('')}</div>
      <div class="sc-kept sc-kept-f"><span>Kept ${FINDS.length} artifacts</span><small>/prometheus/artifacts</small></div>
      <div class="sc-finds">${FINDS.map((f) => swatch(f, 'sc-f')).join('')}</div>
      <div class="sc-facts">${FINDS.map(([, , , , , , , fact]) => `<div class="sc-fx"><code>${x.esc(fact)}</code><em>checking</em></div>`).join('')}</div>
    </div>`);
    const rows = [...card.querySelectorAll('.sc-row')].map((row) => ({
      row, bar: row.querySelector('.sc-bar i'), mark: row.querySelector('.sc-bar s'), pg: row.querySelector('.sc-pg'), hit: row.querySelector('.sc-hit'),
    }));
    const decals = [...card.querySelectorAll('.sc-d')];
    const finds = [...card.querySelectorAll('.sc-f')];
    const facts = [...card.querySelectorAll('.sc-fx')].map((row) => ({ row, st: row.querySelector('em') }));
    const keptD = card.querySelector('.sc-kept-d'), keptF = card.querySelector('.sc-kept-f'), factsEl = card.querySelector('.sc-facts');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin');
    const clab = chipEl.querySelector('.ch-tool-t'), ccount = chipEl.querySelector('.sc-count');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const set = (n, s) => { if (n.textContent !== s) n.textContent = s; };
    const pop = (f, a, t) => {
      const p = seg(t, a, a + 0.22);
      f.style.opacity = outCubic(p).toFixed(3);
      f.style.transform = p >= 1 ? '' : `scale(${(0.82 + 0.18 * outBack(p)).toFixed(4)})`;
    };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 85, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the chip: spinner and a climbing record total, then a check and "Swept 2 archives"
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('sc-done', done);
        set(clab, done ? `Swept ${SITES.length} archives` : `Sweeping ${SITES.length} open archives`);

        rise(card, seg(t, T.card, T.card + 0.4), 14);

        // archive rows: each lands, crawls (red HUD timeline + marker, record count), then stamps its hit count
        let recs = 0;
        rows.forEach((m, i) => {
          const a = T.site[i], [, pg, hits, lic] = SITES[i];
          rise(m.row, seg(t, a, a + 0.24), 5);
          const c = seg(t, a + 0.05, a + 0.05 + CRAWL), e = outCubic(c);
          m.bar.style.transform = `scaleX(${Math.max(0.02, e).toFixed(4)})`;
          m.mark.style.left = `${(Math.max(0.02, e) * 100).toFixed(2)}%`;
          recs += pg * e;
          set(m.pg, `${num(pg * e)} records`);
          const fin = c >= 1;
          m.row.classList.toggle('on', fin);
          set(m.hit, fin ? `${hits} ${lic}` : 'crawling');
        });
        set(ccount, `${num(done ? RECORDS : recs)} records`);

        // the kept strips: each label, then its swatches pop in one after another; each artifact brings its fact,
        // which reads "checking" until the sweep has matched it against the record
        rise(keptD, seg(t, T.decal[0] - 0.08, T.decal[0] + 0.2), 4);
        decals.forEach((f, i) => pop(f, T.decal[i], t));
        rise(keptF, seg(t, T.find[0] - 0.08, T.find[0] + 0.2), 4);
        finds.forEach((f, i) => pop(f, T.find[i], t));
        rise(factsEl, seg(t, T.find[0] - 0.02, T.find[0] + 0.26), 4);
        facts.forEach((m, i) => {
          rise(m.row, seg(t, T.find[i] + 0.04, T.find[i] + 0.24), 3);
          const ok = t >= T.fact[i];
          m.row.classList.toggle('on', ok);
          set(m.st, ok ? 'checked' : 'checking');
        });
      },
    };
  },
};

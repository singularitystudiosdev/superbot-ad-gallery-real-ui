/* variants.js — the two picked takes on one script: "FREE FREE FREE FREE" -> "FREE BETA SUPERBOT
   FLASH" -> hard cut to the end card (engine.js). Each take is
   { title, group, file, D (the cut, in s), build(root, x), render(t, x) }, and render is a pure
   function of story time so ?t= can hold any frame. */
(function () {
  'use strict';
  const B = ['FREE', 'BETA', 'SUPERBOT', 'FLASH'];
  const V = (window.FBF_VARIANTS = {});

  // strobe beats: one word at a time on inverting grounds (every beat >= .35s, under 3 flashes/s)
  V.strobe = {
    title: 'strobe beats', group: 'Picked', file: 'v04.html', D: 3.8,
    build(r, x) { this.r = r; this.solo = x.el('div', 'fb-w', null, r); this.b = x.stack(r, B, 220); this.b[2].classList.add('storm'); },
    render(t, x) {
      const beats = [['FREE', 0, 0], ['FREE', 0.35, 1], ['FREE', 0.7, 0], ['FREE', 1.05, 1], ['BETA', 1.5, 1], ['SUPERBOT', 1.85, 2], ['FLASH', 2.2, 0]], P = 2.6;
      let cur = beats[0];
      for (const b of beats) if (t >= b[1]) cur = b;
      const solo = t < P;
      this.solo.style.display = solo ? '' : 'none';
      if (solo) {
        const [w, st, mode] = cur;
        x.setText(this.solo, w);
        this.solo.style.setProperty('--fs', w.length > 5 ? '280px' : '400px');
        this.r.style.background = mode === 0 ? '#fff' : mode === 2 ? 'var(--storm)' : '#000';
        this.solo.style.color = mode === 0 ? '#000' : '#fff';
        this.solo.style.transform = `translate(-50%, -50%) scale(${x.lerp(1.22, 1, x.outCubic(x.seg(t, st, st + 0.2))).toFixed(3)})`;
      } else this.r.style.background = '#000';
      this.b.forEach((e, i) => {
        const p = x.seg(t, P + 0.05 * i, P + 0.25 + 0.05 * i);
        x.op(e, solo ? 0 : p);
        e.style.transform = `scale(${x.lerp(1.3, 1, x.outCubic(p)).toFixed(3)})`;
      });
    },
  };

  // box logo ticker: rows of FREE box logos (white heavy oblique in a box, after Supreme / Kruger)
  // scroll against each other, a flash, and they brake onto the phrase, SUPERBOT in the storm box
  const ROWS = [
    { to: 'FREE', a: 'ink', b: 'ink' },
    { to: 'BETA', a: '', b: 'ink' },
    { to: 'SUPERBOT', a: 'ink', b: '' },
    { to: 'FLASH', a: '', b: 'ink' },
  ];
  V['box-ticker'] = {
    title: 'box logo ticker', group: 'Picked', file: 'box-ticker.html', D: 3.9,
    build(r, x) {
      const s = x.el('div', 'fb-stack', null, r);
      this.rows = ROWS.map((spec, i) => {
        const row = x.el('div', 'fb-ln fb-row fb-boxrow', null, s);
        row.style.setProperty('--fs', '150px');
        const cp = [];
        for (let j = -9; j <= 9; j++) cp.push(x.el('span', 'fb-cp', 'FREE', row));
        return { row, cp, spec, dir: i % 2 ? 1 : -1, cls: '' };
      });
    },
    render(t, x) {
      const B1 = 1.95, STOP = 3.05, inB = t >= B1;
      this.rows.forEach((r, i) => {
        const word = inB ? r.spec.to : 'FREE', cls = 'fb-cp fb-box ' + (inB ? r.spec.b : r.spec.a);
        if (cls !== r.cls) { r.cls = cls; r.cp.forEach((c) => { c.className = cls; }); }
        r.cp.forEach((c) => x.setText(c, word));
        const w = r.cp[9].offsetWidth, sp = w + parseFloat(getComputedStyle(r.row).fontSize) * 0.3;
        let off;
        if (!inB) { off = r.dir * (560 * t + i * 170); off = ((off % sp) + sp) % sp - sp / 2; }
        else off = r.dir * 3.2 * sp * (1 - x.outCubic(x.seg(t, B1, STOP)));
        const dim = !inB ? 1 : 1 - 0.82 * x.seg(t, STOP - 0.25, STOP + 0.25);
        r.cp.forEach((c, k) => {
          const j = k - 9;
          c.style.transform = `translateX(${(off + j * sp - w / 2).toFixed(1)}px)`;
          x.op(c, j === 0 ? 1 : dim);
        });
        x.op(r.row, x.seg(t, 0.05 + 0.12 * i, 0.35 + 0.12 * i));
      });
      if (inB) x.flash(1 - x.seg(t, B1, B1 + 0.3));
    },
  };
})();

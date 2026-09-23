/* variants.js — takes on one script: "FREE FREE FREE FREE" -> "FREE BETA SUPERBOT FLASH" -> hard
   cut to the end card (engine.js). One registry, one envelope: each take is
   { title, group, file?, D (the cut, in s), build(root, x), render(t, x) }, and render is a pure
   function of story time so ?t= can hold any frame. Page = file, else `<key>.html`; the picker
   lists them in key order under their group. Every lockup fits the narrowest stage (864 wide, 4:5). */
(function () {
  'use strict';
  const A = ['FREE', 'FREE', 'FREE', 'FREE'];
  const B = ['FREE', 'BETA', 'SUPERBOT', 'FLASH'];
  const V = (window.FBF_VARIANTS = {});

  // ---------- picked: v4 strobe beats (one word at a time on inverting grounds, every beat >= .35s) ----------
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

  // ---------- picked: v8 ticker brake (four FREE tapes scroll against each other, a flash, brake to the phrase) ----------
  V.ticker = {
    title: 'ticker brake', group: 'Picked', file: 'v08.html', D: 3.9,
    build(r, x) {
      const s = x.el('div', 'fb-stack', null, r);
      this.rows = [0, 1, 2, 3].map((i) => {
        const row = x.el('div', 'fb-ln fb-row', null, s);
        row.style.setProperty('--fs', '190px');
        const cp = [];
        for (let j = -9; j <= 9; j++) cp.push(x.el('span', 'fb-cp', 'FREE', row));
        return { row, cp, dir: i % 2 ? 1 : -1 };
      });
    },
    render(t, x) {
      const B1 = 1.95, STOP = 3.05;
      this.rows.forEach((o, i) => {
        const word = t < B1 ? 'FREE' : B[i];
        o.cp.forEach((c) => {
          x.setText(c, word);
          c.classList.toggle('storm', t >= B1 && i === 2);
          c.classList.toggle('fb-hollow', t < B1 && i % 2 === 1);
        });
        const w = o.cp[0].offsetWidth, sp = w + parseFloat(getComputedStyle(o.row).fontSize) * 0.4;
        let off;
        if (t < B1) { off = o.dir * (t * 560 + i * 170); off = ((off % sp) + sp) % sp - sp / 2; }
        else off = o.dir * 3.2 * sp * (1 - x.outCubic(x.seg(t, B1, STOP)));
        const dim = t < B1 ? 1 : 1 - 0.82 * x.seg(t, STOP - 0.25, STOP + 0.25);
        o.cp.forEach((c, k) => {
          const j = k - 9;
          c.style.transform = `translateX(${(off + j * sp - w / 2).toFixed(1)}px)`;
          x.op(c, j === 0 ? 1 : dim);
        });
        x.op(o.row, x.seg(t, 0.05 + 0.12 * i, 0.35 + 0.12 * i));
      });
      if (t >= B1) x.flash(1 - x.seg(t, B1, B1 + 0.3));
    },
  };

  // ---------- shared: the phrase lockup ----------
  // lines of words (SUPERBOT in the storm), or with o.box each line one box logo (o.box: true for
  // the storm box, a class, or a class per line)
  function lockup(r, x, lines, o) {
    const s = x.el('div', 'fb-stack' + (o.gap ? ' fb-gap' : ''), null, r);
    return lines.map((words, i) => {
      const ln = x.el('div', 'fb-ln' + (o.box ? ' fb-lrow' : ''), null, s);
      ln.style.setProperty('--fs', o.fs + 'px');
      words.forEach((w, j) => {
        if (o.box) x.el('span', 'fb-box ' + (Array.isArray(o.box) ? o.box[i] : o.box === true ? '' : o.box), w, ln);
        else { x.el('span', w === 'SUPERBOT' ? 'storm' : '', w, ln); if (j < words.length - 1) ln.append(' '); }
      });
      return ln;
    });
  }
  // lines pop (scale down from o.from) or slide in from alternate sides, o.stagger apart from o.at
  function landLockup(lines, t, x, o) {
    lines.forEach((e, i) => {
      const a = o.at + (o.stagger || 0) * i, p = x.seg(t, a, a + (o.dur || 0.25));
      x.op(e, p);
      e.style.transform = o.slide
        ? `translateX(${((1 - x.outQuint(p)) * (i % 2 ? 1 : -1) * x.W).toFixed(1)}px)`
        : `scale(${x.lerp(o.from || 1.3, 1, x.outCubic(p)).toFixed(3)})`;
    });
  }

  // ---------- strobe family: one word per beat on its own ground, then the lockup at P ----------
  // beat: { w, t, bg, fg ('storm' = gradient text), box? (solo box fill), fs?, x?, y? (stage fractions), rot? }
  function strobeTake(o) {
    return {
      title: o.title, group: o.group || 'Strobe variants', D: o.D,
      build(r, x) {
        this.r = r;
        this.solo = x.el('div', 'fb-w ' + (o.soloCls || ''), null, r);
        this.lines = lockup(r, x, o.lines, o.lock);
      },
      render(t, x) {
        let cur = o.beats[0];
        for (const b of o.beats) if (t >= b.t) cur = b;
        const solo = t < o.P;
        this.solo.style.display = solo ? '' : 'none';
        this.r.style.background = solo ? cur.bg : '#000';
        if (solo) {
          x.setText(this.solo, cur.w);
          this.solo.style.setProperty('--fs', (cur.fs || (cur.w.length > 5 ? 280 : 400)) + 'px');
          this.solo.classList.toggle('storm', cur.fg === 'storm');
          this.solo.style.color = cur.fg === 'storm' ? '' : cur.fg;
          if (cur.box) this.solo.style.background = cur.box;
          const k = x.outCubic(x.seg(t, cur.t, cur.t + 0.2));
          this.solo.style.transform = `translate(-50%, -50%) translate(${((cur.x || 0) * x.W).toFixed(1)}px, ${((cur.y || 0) * x.H).toFixed(1)}px) rotate(${cur.rot || 0}deg) scale(${x.lerp(1.22, 1, k).toFixed(3)})`;
        }
        landLockup(this.lines, t, x, { at: o.P, ...o.lock });
      },
    };
  }

  V['strobe-storm'] = strobeTake({
    title: 'strobe · storm grounds', D: 3.8, P: 2.6,
    beats: [
      { w: 'FREE', t: 0, bg: '#00e5c3', fg: '#000' },
      { w: 'FREE', t: 0.35, bg: '#2b6bff', fg: '#fff' },
      { w: 'FREE', t: 0.7, bg: '#6a1fd8', fg: '#fff' },
      { w: 'FREE', t: 1.05, bg: '#c026d3', fg: '#fff' },
      { w: 'BETA', t: 1.5, bg: '#ff3d9a', fg: '#000' },
      { w: 'SUPERBOT', t: 1.85, bg: '#000', fg: 'storm' },
      { w: 'FLASH', t: 2.2, bg: '#fff', fg: '#000' },
    ],
    lines: B.map((w) => [w]), lock: { fs: 220, stagger: 0.05 },
  });

  V['strobe-jump'] = strobeTake({
    title: 'strobe · jump cuts', D: 3.8, P: 2.55,
    beats: [
      { w: 'FREE', t: 0, bg: '#fff', fg: '#000', fs: 330, x: -0.2, y: -0.18, rot: -6 },
      { w: 'FREE', t: 0.35, bg: '#000', fg: '#fff', fs: 330, x: 0.2, y: 0.18, rot: 5 },
      { w: 'FREE', t: 0.7, bg: '#fff', fg: '#000', fs: 330, x: -0.18, y: 0.2, rot: 4 },
      { w: 'FREE', t: 1.05, bg: '#000', fg: '#fff', fs: 330, x: 0.2, y: -0.18, rot: -5 },
      { w: 'BETA', t: 1.45, bg: '#fff', fg: '#000', fs: 440 },
      { w: 'SUPERBOT', t: 1.8, bg: '#000', fg: 'storm', fs: 280 },
      { w: 'FLASH', t: 2.15, bg: '#fff', fg: '#000', fs: 400 },
    ],
    lines: [['FREE', 'BETA'], ['SUPERBOT', 'FLASH']], lock: { fs: 170, stagger: 0.12, slide: true, dur: 0.4 },
  });

  // the stack builds a line per beat on inverting grounds, then lines 2-4 swap to the phrase per beat
  V['strobe-build'] = {
    title: 'strobe · stack build', group: 'Strobe variants', D: 3.5,
    build(r, x) { this.r = r; this.l = x.stack(r, A, 220); },
    render(t, x) {
      const beats = [0, 0.35, 0.7, 1.05, 1.5, 1.85, 2.2, 2.55];
      let n = 0;
      for (const b of beats) if (t >= b) n++;
      const light = n < 8 && n % 2 === 1;
      this.r.style.background = light ? '#fff' : '#000';
      this.l.forEach((e, i) => {
        const swap = i > 0 && n >= 4 + i, w = swap ? B[i] : 'FREE', at = swap ? beats[3 + i] : beats[i];
        x.setText(e, w);
        e.classList.toggle('storm', w === 'SUPERBOT');
        e.style.color = light ? '#000' : '#fff';
        x.op(e, n > i ? 1 : 0);
        e.style.transform = `scale(${x.lerp(1.25, 1, x.outCubic(x.seg(t, at, at + 0.18))).toFixed(3)})`;
      });
    },
  };

  // ---------- ticker family: rows of copies scroll against each other, then brake onto the phrase ----------
  // row: { fs, to (the word it lands on; none = a FREE row that dims away), a / b (copy classes before / after B1) }
  function tickerTake(o) {
    return {
      title: o.title, group: o.group || 'Ticker variants', D: o.D,
      build(r, x) {
        this.r = r;
        const s = x.el('div', 'fb-stack', null, r);
        if (o.tilt) s.style.transform = `rotate(${o.tilt}deg) scale(1.15)`;
        this.rows = o.rows.map((spec, i) => {
          const row = x.el('div', 'fb-ln fb-row ' + (o.rowCls || ''), null, s);
          row.style.setProperty('--fs', spec.fs + 'px');
          const cp = [];
          for (let j = -9; j <= 9; j++) cp.push(x.el('span', 'fb-cp', 'FREE', row));
          return { row, cp, spec, dir: i % 2 ? 1 : -1, cls: '' };
        });
      },
      render(t, x) {
        const inB = t >= o.B1, n = this.rows.length;
        this.rows.forEach((r, i) => {
          const { spec } = r, stop = o.STOP + (o.stagger || 0) * i;
          const word = inB && spec.to ? spec.to : 'FREE', cls = 'fb-cp ' + ((inB ? spec.b : spec.a) || '');
          if (cls !== r.cls) { r.cls = cls; r.cp.forEach((c) => { c.className = cls; }); }
          r.cp.forEach((c) => x.setText(c, word));
          const w = r.cp[9].offsetWidth, sp = w + parseFloat(getComputedStyle(r.row).fontSize) * (o.space || 0.4);
          let off, skew = 0;
          if (!inB) {
            off = r.dir * ((o.ramp ? 140 * t + 300 * t * t * t : 560 * t) + i * 170);
            off = ((off % sp) + sp) % sp - sp / 2;
            if (o.ramp) skew = -r.dir * Math.min(24, (140 + 900 * t * t) / 160);
          } else {
            const p = x.seg(t, o.B1, stop);
            off = r.dir * 3.2 * sp * (1 - (o.ramp ? x.outBack(p) : x.outCubic(p)));
          }
          const dim = !inB ? 1 : 1 - (spec.to ? 0.82 : 0.9) * x.seg(t, stop - 0.25, stop + 0.25);
          r.cp.forEach((c, k) => {
            const j = k - 9;
            c.style.transform = `translateX(${(off + j * sp - w / 2).toFixed(1)}px) skewX(${skew.toFixed(1)}deg)`;
            x.op(c, j === 0 && spec.to ? 1 : dim);
          });
          x.op(r.row, x.seg(t, 0.05 + (0.48 / n) * i, 0.35 + (0.48 / n) * i));
        });
        if (inB && o.flash !== false) x.flash(1 - x.seg(t, o.B1, o.B1 + 0.3));
        if (o.ramp) { const [dx, dy] = x.shake(t, [o.STOP], 30); this.r.style.transform = `translate(${dx}px, ${dy}px)`; }
      },
    };
  }

  V['ticker-tilt'] = tickerTake({
    title: 'ticker · tilted, staggered stop', D: 4.0, B1: 1.95, STOP: 2.8, stagger: 0.14, tilt: -8, flash: false,
    rows: [
      { fs: 190, to: 'FREE' },
      { fs: 190, to: 'BETA', a: 'fb-hollow' },
      { fs: 190, to: 'SUPERBOT', a: 'storm', b: 'storm' },
      { fs: 190, to: 'FLASH', a: 'fb-hollow' },
    ],
  });

  V['ticker-wall'] = tickerTake({
    title: 'ticker · full wall', D: 4.0, B1: 1.95, STOP: 3.05,
    rows: [
      { fs: 100, a: 'fb-hollow', b: 'fb-hollow' },
      { fs: 100 },
      { fs: 170, to: 'FREE' },
      { fs: 170, to: 'BETA', a: 'fb-hollow' },
      { fs: 170, to: 'SUPERBOT', b: 'storm' },
      { fs: 170, to: 'FLASH', a: 'fb-hollow' },
      { fs: 100, a: 'fb-hollow', b: 'fb-hollow' },
      { fs: 100 },
    ],
  });

  V['ticker-ramp'] = tickerTake({
    title: 'ticker · speed ramp', D: 3.9, B1: 1.95, STOP: 2.85, ramp: true,
    rows: B.map((w, i) => ({ fs: 190, to: w, a: i % 2 ? 'fb-hollow' : '', b: w === 'SUPERBOT' ? 'storm' : '' })),
  });

  // ---------- Supreme: the box logo (white heavy oblique in a box, after Barbara Kruger), ours in the storm ----------
  const PHRASE_BOXES = [['FREE BETA'], ['SUPERBOT FLASH']];
  function pin(r, x, text, cls, fs) {
    const e = x.el('div', 'fb-box fb-pin ' + cls, text, r);
    e.style.setProperty('--fs', fs + 'px');
    return e;
  }
  const place = (e, x, o, extra) => {
    e.style.transform = `translate(-50%, -50%) translate(${(o.dx * x.W).toFixed(1)}px, ${(o.dy * x.H).toFixed(1)}px) ${extra}`;
  };

  // four FREE boxes stamp onto a pile, then the phrase stamps on as a two-box lockup
  V['box-stamp'] = {
    title: 'box logo stamp', group: 'Supreme', D: 3.4,
    build(r, x) {
      this.r = r;
      this.a = [[-0.05, -0.07, -4], [0.04, 0.03, 3], [-0.03, 0.08, -2], [0.03, -0.02, 5]].map(([dx, dy, rot], i) =>
        ({ e: pin(r, x, 'FREE', i % 2 ? 'ink' : '', 260), dx, dy, rot }));
      this.b = lockup(r, x, PHRASE_BOXES, { fs: 150, box: ['ink', ''], gap: true });
    },
    render(t, x) {
      const hitsA = [0.2, 0.5, 0.8, 1.1], hitsB = [1.75, 2.05], inB = t >= 1.6;
      this.a.forEach((o, i) => {
        const p = x.seg(t, hitsA[i] - 0.12, hitsA[i]);
        x.op(o.e, inB ? 0 : p);
        place(o.e, x, o, `rotate(${o.rot}deg) scale(${x.lerp(2.4, 1, x.outCubic(p)).toFixed(3)})`);
      });
      this.b.forEach((e, i) => {
        const p = x.seg(t, hitsB[i] - 0.12, hitsB[i]);
        x.op(e, p);
        e.style.transform = `scale(${x.lerp(2.2, 1, x.outCubic(p)).toFixed(3)})`;
      });
      const [dx, dy] = x.shake(t, inB ? hitsB : hitsA, 24);
      this.r.style.transform = `translate(${dx}px, ${dy}px)`;
    },
  };

  // box-logo wallpaper: FREE boxes tile the frame in scattered order, a white hit clears it, and
  // the phrase runs in as four stacked boxes
  V['box-wall'] = {
    title: 'box logo wallpaper', group: 'Supreme', D: 3.6,
    build(r, x) {
      const k = Math.min(1, (x.W / 1920) * 1.25), cols = Math.floor(x.W / (80 * k * 4)), rows = Math.floor(x.H / (80 * k * 1.55));
      const g = x.el('div', 'fb-tiles', null, r);
      g.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      g.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
      const N = cols * rows, order = [...Array(N).keys()].sort((p, q) => x.hash(p + 11) - x.hash(q + 11));
      this.tiles = [];
      order.forEach((cell, rank) => { this.tiles[cell] = { rank }; });
      for (let c = 0; c < N; c++) this.tiles[c].e = x.el('span', 'fb-box' + (((c % cols) + Math.floor(c / cols)) % 2 ? ' ink' : ''), 'FREE', g);
      this.N = N;
      this.b = lockup(r, x, B.map((w) => [w]), { fs: 150, box: ['ink', 'ink', '', 'ink'], gap: true });
    },
    render(t, x) {
      const C = 1.55;
      this.tiles.forEach(({ e, rank }) => {
        const a = 0.1 + (1.25 * rank) / this.N, p = x.seg(t, a, a + 0.12);
        x.op(e, t < C ? p : 0);
        e.style.transform = `scale(${x.lerp(0.4, 1, x.outBack(p)).toFixed(3)})`;
      });
      if (t >= C) x.flash(0.8 * (1 - x.seg(t, C, C + 0.3)));
      landLockup(this.b, t, x, { at: C + 0.1, stagger: 0.12, slide: true, dur: 0.4 });
    },
  };

  V['box-strobe'] = strobeTake({
    title: 'box logo strobe', group: 'Supreme', D: 3.8, P: 2.6, soloCls: 'fb-box',
    beats: [
      { w: 'FREE', t: 0, bg: '#000', fg: '#fff', box: 'var(--storm)', fs: 300 },
      { w: 'FREE', t: 0.35, bg: '#fff', fg: '#fff', box: '#000', fs: 300 },
      { w: 'FREE', t: 0.7, bg: '#000', fg: '#000', box: '#fff', fs: 300 },
      { w: 'FREE', t: 1.05, bg: '#fff', fg: '#fff', box: 'var(--storm)', fs: 300 },
      { w: 'BETA', t: 1.5, bg: '#000', fg: '#fff', box: 'var(--storm)', fs: 300 },
      { w: 'SUPERBOT', t: 1.85, bg: '#fff', fg: '#fff', box: '#000', fs: 220 },
      { w: 'FLASH', t: 2.2, bg: '#000', fg: '#000', box: '#fff', fs: 300 },
    ],
    lines: PHRASE_BOXES, lock: { fs: 150, box: ['ink', ''], gap: true, stagger: 0.1 },
  });

  V['box-ticker'] = tickerTake({
    title: 'box logo ticker', group: 'Supreme', D: 3.9, B1: 1.95, STOP: 3.05, rowCls: 'fb-boxrow', space: 0.3,
    rows: [
      { fs: 150, to: 'FREE', a: 'fb-box ink', b: 'fb-box ink' },
      { fs: 150, to: 'BETA', a: 'fb-box', b: 'fb-box ink' },
      { fs: 150, to: 'SUPERBOT', a: 'fb-box ink', b: 'fb-box' },
      { fs: 150, to: 'FLASH', a: 'fb-box', b: 'fb-box ink' },
    ],
  });

  // Barbara Kruger's red captions, where the box logo came from: FREE captions hard-cut onto a
  // grainy frame one per beat (no easing, Kruger is static), then the phrase as two red strips
  V.kruger = {
    title: 'Kruger red captions', group: 'Supreme', D: 3.5,
    build(r, x) {
      this.grain = x.el('div', 'fb-grain', null, r);
      this.a = [[-0.2, -0.28], [0.17, -0.08], [-0.15, 0.12], [0.19, 0.32]].map(([dx, dy]) => ({ e: pin(r, x, 'FREE', 'red', 150), dx, dy }));
      this.b = lockup(r, x, PHRASE_BOXES, { fs: 150, box: 'red', gap: true });
    },
    render(t, x) {
      const f = Math.floor(t * 12), hits = [0.15, 0.5, 0.85, 1.2], inB = t >= 1.7;
      this.grain.style.backgroundPosition = `${x.hash(f) % 200}px ${x.hash(f + 7) % 200}px, 0 0`;
      this.a.forEach((o, i) => { x.op(o.e, !inB && t >= hits[i] ? 1 : 0); place(o.e, x, o, ''); });
      this.b.forEach((e, i) => x.op(e, t >= 1.7 + 0.35 * i ? 1 : 0));
    },
  };
})();

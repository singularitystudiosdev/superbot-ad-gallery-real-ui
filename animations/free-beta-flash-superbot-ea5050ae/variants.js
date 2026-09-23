/* variants.js — ten takes on one script: "FREE FREE FREE FREE" -> "FREE BETA SUPERBOT FLASH"
   -> hard cut to the end card (engine.js). One registry, one envelope: each take is
   { title, D (the cut, in s), build(root, x), render(t, x) }, and render is a pure function of
   story time so ?t= can hold any frame. The key order is the vNN.html numbering. */
(function () {
  'use strict';
  const A = ['FREE', 'FREE', 'FREE', 'FREE'];
  const B = ['FREE', 'BETA', 'SUPERBOT', 'FLASH'];
  const V = (window.FBF_VARIANTS = {});

  // 01 · stamp slam: each FREE slams in with a camera kick, then the phrase slams the same way
  V.stamp = {
    title: 'stamp slam', D: 3.9,
    build(r, x) { this.r = r; this.a = x.stack(r, A, 230); this.b = x.stack(r, B, 230); this.b[2].classList.add('storm'); },
    render(t, x) {
      const hitsA = [0.2, 0.5, 0.8, 1.1], hitsB = [2.1, 2.4, 2.7, 3.0], inB = t >= 1.95;
      const slam = (lines, hits, on) => lines.forEach((e, i) => {
        const p = x.seg(t, hits[i] - 0.12, hits[i]);
        x.op(e, on ? p : 0);
        e.style.transform = `scale(${x.lerp(2.6, 1, x.outCubic(p)).toFixed(3)})`;
      });
      slam(this.a, hitsA, !inB);
      slam(this.b, hitsB, inB);
      const [dx, dy] = x.shake(t, inB ? hitsB : hitsA, 26);
      this.r.style.transform = `translate(${dx}px, ${dy}px)`;
    },
  };

  // 02 · slot flip: four FREEs slide in from alternate sides, lines 2-4 flip over to the phrase
  V.flip = {
    title: 'slot flip', D: 3.7,
    build(r, x) { this.l = x.stack(r, A, 230); this.l[0].parentNode.style.perspective = '1400px'; },
    render(t, x) {
      this.l.forEach((e, i) => {
        const a = x.seg(t, 0.1 + 0.2 * i, 0.55 + 0.2 * i), dir = i % 2 ? 1 : -1;
        let rx = 0, txt = 'FREE';
        if (i > 0) {
          const p = x.seg(t, 1.85 + 0.18 * (i - 1), 2.3 + 0.18 * (i - 1));
          rx = p < 0.5 ? p * 180 : (p - 1) * 180;
          if (p >= 0.5) txt = B[i];
        }
        x.setText(e, txt);
        e.classList.toggle('storm', txt === 'SUPERBOT');
        x.op(e, a);
        e.style.transform = `translateX(${((1 - x.outQuint(a)) * dir * x.W * 0.8).toFixed(1)}px) rotateX(${rx.toFixed(1)}deg)`;
      });
    },
  };

  // 03 · decode: a 2x2 mono grid of FREEs, words 2-4 scramble and lock letter by letter
  const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&@$!?';
  V.decode = {
    title: 'glitch decode', D: 3.7,
    build(r, x) {
      const g = x.el('div', 'fb-grid', null, r);
      const rows = [x.el('div', 'fb-grow', null, g), x.el('div', 'fb-grow', null, g)];
      this.w = A.map((w, i) => x.el('span', 'fb-gw', w, rows[i >> 1]));
    },
    render(t, x) {
      const f = Math.floor(t * 30);
      this.w.forEach((e, i) => {
        const a = x.seg(t, 0.15 + 0.28 * i, 0.35 + 0.28 * i);
        x.op(e, a);
        e.style.transform = `scale(${x.lerp(1.35, 1, x.outCubic(a)).toFixed(3)})`;
        const st = 1.75 + 0.15 * (i - 1);
        if (i === 0 || t < st) { x.setText(e, 'FREE'); e.classList.remove('storm'); return; }
        const tgt = B[i];
        let s = '';
        for (let c = 0; c < tgt.length; c++) s += t >= st + 0.35 + c * 0.07 ? tgt[c] : POOL[x.hash(i * 31 + c * 7 + f * 131) % POOL.length];
        x.setText(e, s);
        e.classList.toggle('storm', i === 2 && s === tgt);
      });
    },
  };

  // 04 · strobe: one word at a time on inverting grounds (every beat >= .35s, under 3 flashes/s)
  V.strobe = {
    title: 'strobe beats', D: 3.8,
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

  // 05 · outline fill: hollow FREEs rise, fill with the storm gradient, then lines 2-4 roll over
  V.fill = {
    title: 'outline fill + roll', D: 3.7,
    build(r, x) {
      const s = x.el('div', 'fb-stack', null, r);
      this.s = A.map((w, i) => {
        const slot = x.el('div', 'fb-ln fb-slot', null, s);
        slot.style.setProperty('--fs', '230px');
        return {
          slot,
          o: x.el('span', 'fb-o', w, slot),
          f: x.el('span', 'fb-f storm', w, slot),
          n: x.el('span', 'fb-n' + (i === 2 ? ' storm' : ''), B[i], slot),
        };
      });
    },
    render(t, x) {
      this.s.forEach((o, i) => {
        const a = x.seg(t, 0.1 + 0.2 * i, 0.5 + 0.2 * i);
        x.op(o.slot, a);
        o.slot.style.transform = `translateY(${((1 - x.outCubic(a)) * 60).toFixed(1)}px)`;
        const p = x.seg(t, 0.95 + 0.14 * i, 1.4 + 0.14 * i);
        o.f.style.clipPath = `inset(0 ${(100 - p * 100).toFixed(1)}% 0 0)`;
        const roll = i ? x.outQuint(x.seg(t, 2.0 + 0.14 * (i - 1), 2.5 + 0.14 * (i - 1))) : 0;
        o.o.style.transform = o.f.style.transform = `translateY(${(-115 * roll).toFixed(1)}%)`;
        o.n.style.transform = `translateX(-50%) translateY(${(115 * (1 - roll)).toFixed(1)}%)`;
      });
    },
  };

  // 06 · tunnel: FREEs fly out of the distance through the camera, the phrase lands from depth
  V.tunnel = {
    title: 'depth tunnel', D: 3.6,
    build(r, x) {
      this.z = A.map((w, i) => { const e = x.el('div', 'fb-w' + (i % 2 ? ' storm' : ''), w, r); e.style.setProperty('--fs', '260px'); return e; });
      this.b = x.stack(r, B, 220); this.b[2].classList.add('storm');
    },
    render(t, x) {
      this.z.forEach((e, i) => {
        const s = x.seg(t, 0.05 + 0.32 * i, 1.0 + 0.32 * i);
        x.op(e, s <= 0 || s >= 1 ? 0 : x.seg(s, 0, 0.12) * (1 - x.seg(s, 0.72, 1)));
        e.style.transform = `translate(-50%, -50%) scale(${(0.04 * Math.pow(160, s)).toFixed(3)})`;
      });
      this.b.forEach((e, i) => {
        const q = x.seg(t, 1.95 + 0.06 * i, 2.45 + 0.06 * i);
        x.op(e, q);
        e.style.transform = `scale(${x.lerp(0.15, 1, x.outBack(q)).toFixed(3)})`;
      });
      if (t >= 1.95) x.flash(0.5 * (1 - x.seg(t, 1.95, 2.2)));
    },
  };

  // 07 · split flap: a departures board clacks to FREE x4, rows 2-4 clack on to the phrase
  const pad = (w) => { const n = 8 - w.length, l = Math.floor(n / 2); return ' '.repeat(l) + w + ' '.repeat(n - l); };
  const STORM8 = ['#00e5c3', '#1fb3d9', '#2b6bff', '#4a45eb', '#6a1fd8', '#9523d6', '#c026d3', '#ff3d9a'];
  const FLAPS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  V.flap = {
    title: 'split-flap board', D: 3.8,
    build(r, x) {
      const b = x.el('div', 'fb-board', null, r);
      this.rows = [0, 1, 2, 3].map(() => { const row = x.el('div', 'fb-frow', null, b); return Array.from({ length: 8 }, () => x.el('span', 'fb-cell', ' ', row)); });
    },
    render(t, x) {
      const f = Math.floor(t * 30);
      this.rows.forEach((cells, i) => {
        const sA = 0.05 + 0.16 * i, sB = 1.8 + 0.15 * (i - 1), inB = i > 0 && t >= sB;
        const tgt = pad(inB ? B[i] : A[i]), start = inB ? sB : sA;
        cells.forEach((c, k) => {
          const land = start + (inB ? 0.35 : 0.3) + 0.06 * k;
          let ch = ' ', spin = false;
          if (t >= land) ch = tgt[k];
          else if (t >= start) { ch = FLAPS[x.hash(i * 97 + k * 13 + (f >> 1) * 7919) % FLAPS.length]; spin = true; }
          x.setText(c, ch === ' ' ? ' ' : ch);
          c.style.transform = spin && f % 2 ? 'scaleY(.82)' : '';
          c.style.color = inB && i === 2 ? STORM8[k] : '#fff';
        });
      });
    },
  };

  // 08 · ticker: four FREE tapes scroll against each other, a flash, and they brake to the phrase
  V.ticker = {
    title: 'ticker brake', D: 3.9,
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

  // 09 · stickers + tape: red FREE stickers slap the frame, then the phrase runs in as tape strips
  V.tape = {
    title: 'stickers + tape', D: 3.8,
    build(r, x) {
      this.r = r;
      this.stk = [[-0.24, -0.2, -9], [0.22, -0.19, 7], [-0.2, 0.21, 6], [0.23, 0.2, -8]].map(([dx, dy, rot]) => {
        const e = x.el('div', 'fb-sticker', 'FREE', r); e.style.setProperty('--fs', '170px');
        return { e, dx, dy, rot };
      });
      const s = x.el('div', 'fb-stack', null, r);
      this.tp = B.map((w, i) => { const e = x.el('div', `fb-ln fb-tape fb-tape-${i}`, w, s); e.style.setProperty('--fs', '180px'); return e; });
    },
    render(t, x) {
      const hits = [0.15, 0.45, 0.75, 1.05], T = 1.6;
      this.stk.forEach((o, i) => {
        const p = x.seg(t, hits[i] - 0.14, hits[i]);
        x.op(o.e, t < T ? p : 0);
        o.e.style.transform = `translate(-50%, -50%) translate(${(o.dx * x.W).toFixed(1)}px, ${(o.dy * 1080).toFixed(1)}px) rotate(${o.rot}deg) scale(${x.lerp(2.1, 1, x.outCubic(p)).toFixed(3)})`;
      });
      this.tp.forEach((e, i) => {
        const p = x.outQuint(x.seg(t, T + 0.05 + 0.2 * i, T + 0.5 + 0.2 * i)), dir = i % 2 ? 1 : -1;
        x.op(e, t < T ? 0 : 1);
        e.style.transform = `translateX(${((1 - p) * dir * x.W * 1.1).toFixed(1)}px) skewX(-8deg) rotate(${i % 2 ? 1.5 : -1.5}deg)`;
      });
      const [dx, dy] = x.shake(t, t < T ? hits : [T + 0.5, T + 0.7, T + 0.9, T + 1.1], 20);
      this.r.style.transform = `translate(${dx}px, ${dy}px)`;
    },
  };

  // 10 · terminal: `superbot --price` prints FREE x4, then `superbot flash --beta` types the phrase
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  V.terminal = {
    title: 'terminal', D: 3.9,
    build(r, x) {
      const term = x.el('div', 'fb-term', null, r);
      this.p1 = x.el('div', 'fb-prompt', null, term);
      this.out = A.map((w) => x.el('div', 'fb-out', w, term));
      this.p2 = x.el('div', 'fb-prompt', null, term);
      this.big = B.map((w, i) => x.el('div', 'fb-big' + (i === 2 ? ' fb-big-storm' : ''), null, term));
      this.cache = new Map();
    },
    line(e, text, cursor) {
      const html = esc(text) + (cursor ? '<span class="fb-cur">▌</span>' : '');
      if (this.cache.get(e) !== html) { e.innerHTML = html; this.cache.set(e, html); }
    },
    render(t, x) {
      const CUT = 2.0, c1 = 'superbot --price', c2 = 'superbot flash --beta';
      const blink = Math.floor(t * 2.5) % 2 === 0, inA = t < CUT;
      [this.p1, ...this.out].forEach((e) => { e.style.display = inA ? '' : 'none'; });
      [this.p2, ...this.big].forEach((e) => { e.style.display = inA ? 'none' : ''; });
      if (inA) {
        const n = Math.floor(x.seg(t, 0.1, 0.7) * c1.length);
        this.line(this.p1, '$ ' + c1.slice(0, n), t < 0.95 && (n < c1.length || blink));
        this.out.forEach((e, i) => x.op(e, t >= 0.95 + 0.18 * i ? 1 : 0));
        return;
      }
      const n2 = Math.floor(x.seg(t, 2.05, 2.4) * c2.length);
      this.line(this.p2, '$ ' + c2.slice(0, n2), t < 2.5);
      let left = Math.floor(x.seg(t, 2.5, 3.3) * 21), placed = false;
      this.big.forEach((e, i) => {
        const k = Math.min(left, B[i].length); left -= k;
        const typing = !placed && t >= 2.5 && (k < B[i].length || i === 3);
        if (typing) placed = true;
        this.line(e, B[i].slice(0, k), typing && (k < B[i].length || blink));
      });
    },
  };
})();

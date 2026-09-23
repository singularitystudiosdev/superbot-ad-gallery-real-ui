// Live layout tuner for the hub-real ads. tools/tune-server.mjs injects it; the published pages never load it.
// Widths and X offsets are in the ad's own pixels (before the stage scale).
(() => {
  const VARS = [
    { key: 'bubble', label: 'User bubble max width', prop: '--hub-bubble' },
    { key: 'reply', label: 'Response max width', prop: '--hub-reply' },
    { key: 'inset', label: 'Response left inset', prop: '--hub-reply-inset' },
    { key: 'column', label: 'Composer width', prop: '--hub-column' },
  ];
  const TARGETS = [
    { key: 'user', label: 'User bubble', sel: '.hub .msg:not(:has(.avatar.sb)) .m-main, .hub .f-q .bub', wrap: true },
    { key: 'response', label: 'Response', sel: '.hub .msg:has(.avatar.sb) .m-main, .hub .f-a .m-main' },
    { key: 'thinking', label: 'Thinking + tools', sel: '.hub .f-think' },
  ];
  const PICK_ROOTS = ['m-main', 'bub', 'f-think', 'f-q', 'f-a', 'msg', 'composer'];
  const STATE_CLASS = /^(_.*|done|on|off|show|shown|in|out|active|hot|live|typing|pressed|open)$/;
  const LS = 'hub-tune:v2'; // v1 held x offsets against the old centered column
  const POS = 'hub-tune:pos';
  const q = new URLSearchParams(location.search);
  const held = q.has('t') && !q.has('play');

  let state = { vars: {}, targets: {}, picks: [] };
  let dirty = false;
  let active = null;
  let picking = false;

  const live = document.head.appendChild(document.createElement('style'));
  const hl = document.head.appendChild(document.createElement('style'));

  function ruleFor(sel, t, wrap) {
    const d = [];
    if (t.w != null) d.push(wrap ? `max-width: ${t.w}px; flex: none;` : `box-sizing: border-box; width: ${t.w}px; max-width: none; flex: none;`);
    if (t.x) d.push(`translate: ${t.x}px 0;`);
    return d.length ? `${sel} { ${d.join(' ')} }` : '';
  }

  function toCss(s) {
    const out = [];
    const vars = VARS.filter((v) => s.vars[v.key] != null).map((v) => `${v.prop}: ${s.vars[v.key]}px;`);
    if (vars.length) out.push(`.hub { ${vars.join(' ')} }`);
    for (const t of TARGETS) if (s.targets[t.key]) out.push(ruleFor(t.sel, s.targets[t.key], t.wrap));
    for (const p of s.picks) out.push(ruleFor(p.sel, p, false));
    return out.filter(Boolean).join('\n');
  }

  function apply(persist = true) {
    live.textContent = toCss(state);
    if (persist) {
      dirty = true;
      localStorage.setItem(LS, JSON.stringify(state));
    }
    status();
  }

  const hubEl = () => document.querySelector('.hub');
  const firstWidth = (sel) => {
    try {
      return document.querySelector(sel)?.offsetWidth || 0;
    } catch {
      return 0;
    }
  };
  const varWidth = (prop) => parseFloat(getComputedStyle(hubEl()).getPropertyValue(prop)) || 0;
  const highlight = (sel) => (hl.textContent = sel ? `${sel} { outline: 1px dashed #4cc2ff !important; outline-offset: 2px; }` : '');

  // ---------- panel ----------
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;z-index:2147483647;top:12px;right:12px;';
  const pos = JSON.parse(localStorage.getItem(POS) || 'null');
  if (pos) Object.assign(host.style, { left: `${pos.x}px`, top: `${pos.y}px`, right: 'auto' });
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    :host { all: initial; }
    .p { width: 320px; max-height: calc(100vh - 24px); overflow: auto; background: rgba(18,18,20,.97); color: #ddd; border: 1px solid #333; border-radius: 10px; font: 12px/1.35 -apple-system, BlinkMacSystemFont, sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,.5); }
    .hd { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-bottom: 1px solid #2a2a2e; cursor: move; user-select: none; }
    .hd b { flex: 1; font-weight: 600; }
    .bd { padding: 8px 10px; display: grid; gap: 8px; }
    .bar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    button, select { font: inherit; color: #eee; background: #26262a; border: 1px solid #3a3a40; border-radius: 6px; padding: 3px 8px; cursor: pointer; }
    button:hover { background: #303036; }
    button.pri { background: #1f5f3f; border-color: #2c7a52; }
    button.on { background: #1d4a6b; border-color: #2d6d99; }
    .row { border: 1px solid #2a2a2e; border-radius: 8px; padding: 6px 8px; display: grid; gap: 4px; }
    .row.act { border-color: #4cc2ff; }
    .rh { display: flex; align-items: center; gap: 6px; }
    .rh .nm { flex: 1; font-weight: 600; }
    .rh button { padding: 0 6px; }
    .ctl { display: grid; grid-template-columns: 14px 1fr 64px; gap: 6px; align-items: center; }
    input[type=range] { width: 100%; accent-color: #4cc2ff; }
    input[type=number], input.sel { font: inherit; color: #eee; background: #111; border: 1px solid #333; border-radius: 5px; padding: 2px 4px; width: 100%; box-sizing: border-box; }
    input.sel { font-family: ui-monospace, Menlo, monospace; font-size: 11px; }
    .st { font-size: 11px; color: #999; }
    .st.dirty { color: #f0b34a; }
    .st.ok { color: #4cd08a; }
    .sec { font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: #777; margin-top: 2px; }
    .hint { font-size: 11px; color: #777; }
  </style>
  <div class="p">
    <div class="hd"><b>Layout tuner</b><button class="fold" title="Collapse">–</button></div>
    <div class="bd">
      <div class="bar">
        <button class="mode">${held ? 'Play' : 'Hold frame'}</button>
        <select class="ar"><option>16x9</option><option>4x5</option><option>9x16</option></select>
        <button class="reaim" title="Reload so the cursor re-measures its targets">Re-aim cursor</button>
      </div>
      <div class="ctl frame" style="grid-template-columns: 14px 1fr 58px"><span>t</span><input type="range" class="t" step="0.0333"><input type="number" class="tn" step="0.1"></div>
      <div class="sec">Layout</div>
      <div class="rows"></div>
      <div class="sec">Picked elements</div>
      <div class="picks"></div>
      <div class="bar"><button class="pick">Pick element</button><span class="hint">click anything in the chat</span></div>
      <div class="bar">
        <button class="save pri">Save to hub-real.css</button>
        <button class="copy">Copy CSS</button>
        <button class="reset">Reset all</button>
      </div>
      <div class="st"></div>
      <div class="hint">Arrows nudge the selected row: ←/→ X, ↑/↓ width (Shift = 10px).</div>
    </div>
  </div>`;
  const $ = (s) => root.querySelector(s);

  function status(msg, cls) {
    const el = $('.st');
    el.className = `st ${cls || (dirty ? 'dirty' : 'ok')}`;
    el.textContent = msg || (dirty ? 'Unsaved changes (kept in this browser)' : 'Matches assets/hub-real.css');
  }

  function makeRow({ label, sel, get, set, hasX = true, measure, editable, onSel, onRemove }) {
    const el = document.createElement('div');
    el.className = 'row';
    el.innerHTML = `<div class="rh"><span class="nm"></span>${editable ? '<button class="up" title="Select the parent element instead">↑</button>' : ''}<button class="clr" title="Back to auto">↺</button>${onRemove ? '<button class="rm" title="Remove">×</button>' : ''}</div>
      ${editable ? '<input class="sel" spellcheck="false">' : ''}
      <div class="ctl"><span>W</span><input type="range" class="w" min="60" max="1400" step="1"><input type="number" class="wn" placeholder="auto"></div>
      ${hasX ? '<div class="ctl"><span>X</span><input type="range" class="x" min="-700" max="700" step="1"><input type="number" class="xn"></div>' : ''}`;
    const f = (s) => el.querySelector(s);
    f('.nm').textContent = label;
    const selIn = f('.sel');
    if (selIn) {
      selIn.value = sel();
      selIn.onchange = () => {
        onSel(selIn.value.trim());
        apply();
      };
      f('.up').onclick = () => {
        const parts = sel().split(' > ');
        if (parts.length < 2) return;
        onSel(parts.slice(0, -1).join(' > '));
        apply();
        build();
      };
    }
    const refresh = () => {
      const v = get();
      f('.w').value = v.w ?? measure();
      f('.wn').value = v.w ?? '';
      f(".wn").placeholder = String(Math.round(measure()));
      if (hasX) f('.x').value = f('.xn').value = v.x || 0;
    };
    const change = (patch) => {
      set(patch);
      apply();
      refresh();
    };
    f('.w').oninput = () => change({ w: +f('.w').value });
    f('.wn').oninput = () => change({ w: f('.wn').value === '' ? null : +f('.wn').value });
    if (hasX) {
      f('.x').oninput = () => change({ x: +f('.x').value });
      f('.xn').oninput = () => change({ x: +f('.xn').value || 0 });
    }
    f('.clr').onclick = () => change({ w: null, x: 0 });
    if (onRemove) f('.rm').onclick = onRemove;
    el.onmouseenter = () => highlight(sel());
    el.onmouseleave = () => highlight(null);
    const api = {
      el,
      nudge(dw, dx) {
        const v = get();
        if (dw) change({ w: Math.round((v.w ?? measure()) + dw) });
        if (dx && hasX) change({ x: (v.x || 0) + dx });
      },
    };
    el.onmousedown = () => {
      active?.el.classList.remove('act');
      active = api;
      el.classList.add('act');
    };
    refresh();
    return api;
  }

  function build() {
    active = null;
    const rows = $('.rows');
    rows.textContent = '';
    for (const v of VARS) {
      rows.appendChild(
        makeRow({
          label: v.label,
          sel: () => (v.key === 'column' ? '.hub .composer' : v.key === 'bubble' ? TARGETS[0].sel : TARGETS[1].sel),
          get: () => ({ w: state.vars[v.key] ?? null }),
          set: (p) => {
            if ('w' in p) state.vars[v.key] = p.w;
          },
          hasX: false,
          measure: () => varWidth(v.prop),
        }).el,
      );
    }
    for (const t of TARGETS) {
      if (!document.querySelector(t.sel)) continue;
      rows.appendChild(
        makeRow({
          label: t.label,
          sel: () => t.sel,
          get: () => state.targets[t.key] || {},
          set: (p) => (state.targets[t.key] = { ...state.targets[t.key], ...p }),
          measure: () => firstWidth(t.sel),
        }).el,
      );
    }
    const picks = $('.picks');
    picks.textContent = '';
    state.picks.forEach((p, i) => {
      picks.appendChild(
        makeRow({
          label: p.sel.replace(/^\.hub /, '').split(' > ').pop(),
          sel: () => p.sel,
          get: () => p,
          set: (patch) => Object.assign(p, patch),
          measure: () => firstWidth(p.sel),
          editable: true,
          onSel: (s) => (p.sel = s),
          onRemove: () => {
            state.picks.splice(i, 1);
            apply();
            build();
          },
        }).el,
      );
    });
    if (!state.picks.length) picks.innerHTML = '<div class="hint">None yet.</div>';
  }

  // ---------- picking ----------
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;border:1.5px solid #4cc2ff;background:rgba(76,194,255,.08);display:none;';
  document.documentElement.appendChild(box);

  function pickTarget(e) {
    let el = e.target;
    while (el && !(el instanceof HTMLElement)) el = el.parentElement;
    return el && el.closest('.hub') && el !== hubEl() ? el : null;
  }

  function selectorFor(el) {
    const parts = [];
    for (let e = el; e && e !== hubEl(); e = e.parentElement) {
      const cls = [...e.classList].filter((c) => !STATE_CLASS.test(c));
      const tag = e.tagName.toLowerCase();
      parts.unshift(cls.length ? (tag === 'div' ? '' : tag) + '.' + cls[0] : e.id ? '#' + e.id : tag);
      if (PICK_ROOTS.some((c) => e.classList.contains(c))) break;
    }
    return '.hub ' + parts.join(' > ');
  }

  function setPicking(on) {
    picking = on;
    $('.pick').classList.toggle('on', on);
    $('.pick').textContent = on ? 'Click an element… (Esc)' : 'Pick element';
    box.style.display = 'none';
  }

  document.addEventListener(
    'mousemove',
    (e) => {
      if (!picking) return;
      const el = pickTarget(e);
      if (!el) return (box.style.display = 'none');
      const r = el.getBoundingClientRect();
      Object.assign(box.style, { display: 'block', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    },
    true,
  );
  document.addEventListener(
    'click',
    (e) => {
      if (!picking || e.composedPath().includes(host)) return;
      const el = pickTarget(e);
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!el) return;
      state.picks.push({ sel: selectorFor(el), w: null, x: 0 });
      setPicking(false);
      apply();
      build();
    },
    true,
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && picking) return setPicking(false);
    const inField = e.composedPath().some((n) => n instanceof HTMLInputElement || n instanceof HTMLSelectElement);
    if (!active || inField) return;
    const step = e.shiftKey ? 10 : 1;
    const map = { ArrowLeft: [0, -step], ArrowRight: [0, step], ArrowUp: [step, 0], ArrowDown: [-step, 0] };
    if (!map[e.key]) return;
    e.preventDefault();
    active.nudge(...map[e.key]);
  });

  // ---------- controls ----------
  $('.pick').onclick = () => setPicking(!picking);
  $('.fold').onclick = () => {
    const bd = $('.bd');
    bd.style.display = bd.style.display === 'none' ? '' : 'none';
    $('.fold').textContent = bd.style.display === 'none' ? '+' : '–';
  };
  $('.ar').value = q.get('ar') || '16x9';
  $('.ar').onchange = () => {
    q.set('ar', $('.ar').value);
    location.search = q.toString();
  };
  $('.reaim').onclick = () => location.reload();

  const loop = typeof LOOP === 'number' ? LOOP : 20; // eslint-disable-line no-undef
  const t = $('.t');
  const tn = $('.tn');
  t.max = loop;
  t.value = tn.value = held ? parseFloat(q.get('t')) || 0 : 0;
  const seek = (v) => {
    t.value = tn.value = (+v).toFixed(2);
    if (held && typeof render === 'function') render(+v); // eslint-disable-line no-undef
  };
  t.oninput = () => seek(t.value);
  tn.onchange = () => seek(tn.value);
  t.onchange = tn.onchange = () => {
    if (!held) return;
    q.set('t', (+t.value).toFixed(2));
    history.replaceState(null, '', `?${q}`);
  };
  $('.frame').style.opacity = held ? 1 : 0.45;
  t.disabled = tn.disabled = !held;
  $('.mode').onclick = () => {
    if (held) q.set('play', '1');
    else {
      q.delete('play');
      if (!q.has('t')) q.set('t', '6');
    }
    location.search = q.toString();
  };

  $('.save').onclick = async () => {
    try {
      const res = await fetch('/__tune/save', { method: 'POST', body: JSON.stringify({ state, css: toCss(state) }) });
      if (!res.ok) throw new Error(await res.text());
      localStorage.removeItem(LS);
      dirty = false;
      status('Saved to assets/hub-real.css. Push to publish.', 'ok');
    } catch (err) {
      console.error(err);
      status(`Save failed: ${err.message}`, 'dirty');
    }
  };
  $('.copy').onclick = async () => {
    await navigator.clipboard.writeText(toCss(state));
    status('CSS copied', 'ok');
  };
  $('.reset').onclick = () => {
    state = { vars: {}, targets: {}, picks: [] };
    apply();
    build();
  };

  // drag the panel by its header
  $('.hd').onmousedown = (e) => {
    if (e.target.closest('button')) return;
    const r = host.getBoundingClientRect();
    const dx = e.clientX - r.left;
    const dy = e.clientY - r.top;
    const move = (m) => {
      const x = Math.max(0, m.clientX - dx);
      const y = Math.max(0, m.clientY - dy);
      Object.assign(host.style, { left: `${x}px`, top: `${y}px`, right: 'auto' });
      localStorage.setItem(POS, JSON.stringify({ x, y }));
    };
    const up = () => {
      removeEventListener('mousemove', move);
      removeEventListener('mouseup', up);
    };
    addEventListener('mousemove', move);
    addEventListener('mouseup', up);
  };

  // ---------- load ----------
  const normalize = (s) => ({ vars: s?.vars || {}, targets: s?.targets || {}, picks: s?.picks || [] });
  fetch('/__tune/state')
    .then((r) => r.json())
    .then((saved) => {
      const local = localStorage.getItem(LS);
      state = normalize(local ? JSON.parse(local) : saved);
      dirty = !!local;
      apply(false);
      build();
    })
    .catch((err) => {
      console.error(err);
      status(`Could not load saved state: ${err.message}`, 'dirty');
      build();
    });
})();

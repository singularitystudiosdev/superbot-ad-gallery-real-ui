/* ktr-lib: helpers for the keep-the-thread ad, layered on the real-UI kit (engine.js + rows.js). Everything here still CLONES captured
 * app markup (palette rows, diff table rows, outcome/step rows, composer) and only swaps text, so classes, spacing and type are the
 * app's own. It adds: fixture-tell neutralising, a retargetable search palette, diff/outcome builders for a different file, a block-aware
 * streaming reveal (a code block or table appears when the stream reaches it), the busy composer, and the end card.
 */
(() => {
  const SB = window.SB, $ = SB.$, $$ = SB.$$
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild }
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  /* ------------------------------------------------------------ fixture tells */
  SB.neutralize = () => {
    for (const e of $$('.awc-nm')) { e.textContent = 'Sam'; e.title = 'Sam' }
    for (const e of $$('.hub-side-row-badge, .awc-tool-dot')) e.style.display = 'none'
  }
  const baseState = SB.state
  SB.state = (name) => { baseState(name); SB.neutralize() }

  /* ----------------------------------------------------------------- palette */
  const PAL = { marks: null, rowOn: null, rowOff: null, rowSnipOff: null, hit: null }
  function palProtos() {
    if (PAL.marks) return
    const t = SB.tpl('list-search', 'dialog[data-testid="command-palette"]')
    const rows = $$('[data-slot="palette-row"]', t)
    PAL.marks = rows.map((r) => $('[data-slot="palette-mark"]', r).innerHTML)
    PAL.rowOn = rows[0]; PAL.rowOff = rows[1]; PAL.rowSnipOff = rows[3]
    PAL.hit = $('mark', rows[0]).className
  }
  const hit = (text, tokens) => {
    // one pass over the escaped text with every token as an alternative, so a short token can never match inside markup already inserted
    const alts = tokens.map((tk) => tk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    if (!alts.length) return esc(text)
    return esc(text).replace(new RegExp('(' + alts.join('|') + ')', 'gi'), `<mark data-slot="palette-hit" class="${PAL.hit}">$1</mark>`)
  }
  /** results: [{mark: 0..5 (captured glyph index), title, vendor, meta, snippet?}]; active = highlighted row. Rebuilds the real palette rows. */
  SB.paletteResults = (results, query, active = 0) => {
    palProtos()
    const d = $('dialog[data-testid="command-palette"]'); if (!d) return
    const tokens = query.trim().split(/\s+/).filter((x) => x.length >= 2)
    const show = query.trim().length >= 3
    const tabbar = $('[data-slot="command-palette-tabbar"]', d), list = $('#command-palette-list', d)
    tabbar.style.display = show ? '' : 'none'; list.style.display = show ? '' : 'none'
    for (const c of $$('.hub-palette-tab-count', d)) if (c.closest('[role="tab"]')) c.textContent = String(results.length)
    const wrap = list.firstElementChild; wrap.innerHTML = ''
    results.forEach((r, i) => {
      const base = (r.snippet ? PAL.rowSnipOff : PAL.rowOff).cloneNode(true)
      base.id = 'command-palette-option-' + i
      if (i === active) { base.className = PAL.rowOn.className; base.setAttribute('aria-selected', 'true') } else base.setAttribute('aria-selected', 'false')
      $('[data-slot="palette-mark"]', base).innerHTML = PAL.marks[r.mark]
      const line = $('.block.truncate', base); line.innerHTML = hit(r.title, tokens) + `<span class="ml-8 text-muted">${esc(r.vendor)}</span>`
      $('[data-slot="palette-meta"]', base).textContent = r.meta
      const sn = $('[data-slot="palette-snippet"]', base); if (sn) sn.innerHTML = hit(r.snippet, tokens)
      wrap.appendChild(base)
    })
  }

  /* ------------------------------------------------------------- diff builder */
  const KW = new Set('const let var function return if else for while import export from new class extends async await try catch throw typeof of in default switch case break continue interface type enum'.split(' '))
  const h = (cls, s) => `<span class="${cls}">${esc(s)}</span>`
  function hl(line) {
    const out = []; const re = /(\/\/.*$|\/\*.*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\/(?:[^\/\\\n]|\\.)+\/)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)(\()?|(\s+)|([^\sA-Za-z0-9_$]+)/g
    let m
    while ((m = re.exec(line))) {
      if (m[1]) out.push(h('hljs-comment', m[1]))
      else if (m[2]) out.push(h('hljs-string', m[2]))
      else if (m[3]) out.push(h('hljs-number', m[3]))
      else if (m[4]) {
        if (KW.has(m[4])) out.push(h('hljs-keyword', m[4]))
        else if (m[5]) out.push(h('hljs-title function_', m[4]))
        else if (/^[A-Z]/.test(m[4])) out.push(h('hljs-title class_', m[4]))
        else out.push(esc(m[4]))
        if (m[5]) out.push('(')
      } else out.push(esc(m[6] || m[7]))
    }
    return out.join('')
  }
  /** Replace the rows of a captured tool-diff with `lines` ([{t:'ctx'|'del'|'add', o, n, code}]), header file/dir and +/- counts. */
  function retargetDiff(diff, d) {
    const tb = $('tbody', diff); const rows = $$('tr', tb)
    const proto = { ctx: rows[0], del: rows[1], add: rows[3] }
    tb.innerHTML = ''
    for (const l of d.lines) {
      const tr = proto[l.t].cloneNode(true); tr.setAttribute('data-line', String(l.o ?? l.n))
      const nums = $$('.diff-line-num span.inline-block', tr)
      nums[0].textContent = l.o == null ? '' : String(l.o); nums[1].textContent = l.n == null ? '' : String(l.n)
      for (const s of nums) { s.removeAttribute('data-line-old-num'); s.removeAttribute('data-line-new-num') }
      if (l.o != null) nums[0].setAttribute('data-line-old-num', String(l.o)); if (l.n != null) nums[1].setAttribute('data-line-new-num', String(l.n))
      $('.diff-line-syntax-raw', tr).innerHTML = `<span data-template="true">${hl(l.code)}</span>`
      tb.appendChild(tr)
    }
    const path = $('[data-slot="tool-diff-path"]', diff); path.children[0].textContent = d.file; path.children[1].textContent = d.dir
    const sum = $('[data-slot="tool-diff-summary"]', diff); sum.children[0].textContent = '+' + d.add; sum.children[1].textContent = '-' + d.del
    const tg = $('.sb-tool-diff-toggle', diff); if (tg) tg.setAttribute('aria-label', `${d.dir}${d.file}: ${d.add} added, ${d.del} removed`)
  }
  /** A "Worked for …" outcome for a different task: open = 'steps' (diff folded) | 'diff' (diff unfolded). spec = {label, read:{n,names,ms}, diff, ran:{cmd,ms}} */
  SB.workOutcome = (spec, open = 'diff') => {
    const o = SB.outcome(open === 'diff' ? 'diff-open' : 'tools-open', spec.label)
    const grp = $('.sb-step-group', o)
    $('.sb-line-target', grp).textContent = `${spec.read.n} file${spec.read.n === 1 ? '' : 's'}`
    $('.sb-step-arg-val', grp).textContent = ' · ' + spec.read.names
    $('.sb-step-line', grp).setAttribute('data-count', String(spec.read.n))
    const ms = $('.sb-step-ms', grp); ms.textContent = spec.read.ms; ms.style.setProperty('--sb-ms-chars', String(spec.read.ms.length))
    const diff = $('[data-slot="tool-diff"]', o)
    if (open === 'diff' && spec.diff.lines.length) retargetDiff(diff, spec.diff)
    else if (open !== 'diff') {
      const path = $('[data-slot="tool-diff-path"]', diff); path.children[0].textContent = spec.diff.file; path.children[1].textContent = spec.diff.dir
      const sum = $('[data-slot="tool-diff-summary"]', diff); sum.children[0].textContent = '+' + spec.diff.add; sum.children[1].textContent = '-' + spec.diff.del
    }
    const ran = $('.sb-step[data-kind="execute"]', o)
    $('.sb-line-target', ran).textContent = spec.ran.cmd
    const rms = $('.sb-step-ms', ran); rms.textContent = spec.ran.ms; rms.style.setProperty('--sb-ms-chars', String(spec.ran.ms.length))
    return o
  }

  /* ------------------------------------------------------- streaming reveal */
  const orig = new WeakMap()
  const textNodes = (root) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const a = []; let n; while ((n = w.nextNode())) { if (!orig.has(n)) orig.set(n, n.textContent); if (/\S/.test(orig.get(n))) a.push(n) } return a }
  /** Reveal an answer row as a stream: text blocks type in; a code block shows its header at once and types its code; a table card lands whole. */
  SB.stream = (row, p) => {
    const body = $('[data-answer-body]', row); const blocks = [...body.children]
    const info = blocks.map((b) => {
      const code = $('[data-slot="code-block-body"] code', b)
      if (b.matches('[data-slot="code-block"]')) { const n = textNodes(code); return { b, kind: 'code', nodes: n, w: Math.max(30, n.reduce((a, x) => a + orig.get(x).length, 0)) } }
      if (b.matches('[data-slot="table-card"]')) return { b, kind: 'table', nodes: [], w: 60 }
      const n = textNodes(b); return { b, kind: 'text', nodes: n, w: n.reduce((a, x) => a + orig.get(x).length, 0) }
    })
    const total = info.reduce((a, x) => a + x.w, 0); let left = total * SB.clamp01(p)
    for (const x of info) {
      if (p >= 1) { x.b.style.display = ''; for (const n of x.nodes) n.textContent = orig.get(n); continue }
      if (left <= 0) { x.b.style.display = 'none'; for (const n of x.nodes) n.textContent = ''; continue }
      x.b.style.display = ''
      if (x.kind === 'table') { left -= x.w; continue }
      let k = Math.min(left, x.w); left -= x.w
      if (x.kind === 'code') k = Math.round(k * (x.nodes.reduce((a, n) => a + orig.get(n).length, 0) / x.w))
      for (const n of x.nodes) { const full = orig.get(n); const c = Math.max(0, Math.min(full.length, Math.round(k))); n.textContent = full.slice(0, c); k -= full.length }
    }
    // an inline `code` / **bold** the stream has not reached yet must not show as an empty pill
    for (const e of $$('code.rounded-8, strong, span:not([class])', body)) e.style.display = (p < 1 && !e.textContent) ? 'none' : ''
  }

  /* ---------------------------------------------------------- busy composer */
  /** The composer while a turn runs: the app's own busy state (queue placeholder, stop button) with the current model chip kept. */
  SB.composerBusy = (busy) => {
    const cur = $('[data-testid="composer"]'); const chip = $('[data-testid="composer-plat"]', cur).cloneNode(true)
    const nc = busy ? SB.tpl('rich-live', '[data-testid="composer"]') : (SB._emptyComposer ? SB._emptyComposer.cloneNode(true) : SB.tpl('rich-answer', '[data-testid="composer"]'))
    $('[data-testid="composer-plat"]', nc).replaceWith(chip)
    cur.replaceWith(nc); SB._typedMode = false; SB._lastLen = 0
  }

  /* ---------------------------------------------------------------- end card */
  SB.keepCard = ({ title, site, note, px = 150 }) => {
    SB.closeEndCard()
    const c = document.createElement('div'); c.setAttribute('data-sb-endcard', '')
    c.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:var(--color-bg,#0d0d0d);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:0'
    c.appendChild(SB.mascot(px)); c.firstChild.style.marginBottom = Math.round(px * 0.28) + 'px'
    const t = document.createElement('div'); t.style.cssText = 'font-family:var(--font-serif);font-weight:400;font-size:min(78px,9.2vw);line-height:1.04;letter-spacing:-0.02em;color:#e6e8ee'
    t.innerHTML = title.map((l) => `<div>${esc(l)}</div>`).join(''); c.appendChild(t)
    const s = document.createElement('div'); s.textContent = site; s.style.cssText = 'margin-top:min(40px,4.4vw);font:600 min(34px,4vw)/1.1 var(--font-ui);letter-spacing:-0.01em;color:#fff'; c.appendChild(s)
    const n = document.createElement('div'); n.textContent = note; n.style.cssText = 'margin-top:12px;font:400 min(21px,2.5vw)/1.2 var(--font-ui);color:#9aa0ad'; c.appendChild(n)
    document.body.appendChild(c); return c
  }
})()

/* Thread rows for the real-UI stage: user bubbles, assistant answers (lead, paragraphs, lists, code, tables), "Worked for"
 * outcomes with real step/diff rows, the live "editing …" status, streaming reveal, retitling. Every builder CLONES captured
 * app markup (templates come from rich-answer / rich-tools / rich-tools-open / rich-diff-open / rich-long / rich-live) and only
 * swaps text, so classes, spacing and typography are the app's own.
 */
(() => {
  const SB = window.SB, $ = SB.$, $$ = SB.$$
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild }
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  let uid = 0
  SB.REQUIRED_STATES = ['rich-answer', 'rich-tools', 'rich-tools-open', 'rich-diff-open', 'rich-long', 'rich-live']

  /* ----------------------------------------------------------------- inline markdown */
  /** "**bold** and `code`" -> the app's own inline markup (strong.font-semibold / code.rounded-8 …). */
  SB.inline = (text) => {
    const frag = document.createDocumentFragment()
    for (const part of text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)) {
      if (!part) continue
      if (part.startsWith('**')) frag.appendChild(el(`<strong class="font-semibold text-fg">${esc(part.slice(2, -2))}</strong>`))
      else if (part.startsWith('`')) frag.appendChild(el(`<code class="rounded-8 bg-raised px-4 font-mono text-code">${esc(part.slice(1, -1))}</code>`))
      else frag.appendChild(el(`<span>${esc(part)}</span>`))
    }
    return frag
  }

  /* ---------------------------------------------------------------- feed management */
  SB.feed = () => $('[data-testid="feed"]')
  /** Drop every message / outcome / live row from the feed (keeps the sticky prompt + the date divider): a thread with no turns yet. */
  SB.feedClear = () => { const f = SB.feed(); for (const c of [...f.children]) if (/message-row|turn-outcome|turn-reasoning/.test(c.dataset.slot || '')) c.remove(); SB.scrollFeed(0) }
  SB.feedAppend = (node) => { SB.feed().appendChild(node); node.style.setProperty('--row-i', String($$('[data-slot="message-row"]', SB.feed()).length)); return node }
  /** Begin a new thread in a captured thread state (default rich-answer): that state's real chrome, sidebar and composer, empty feed. */
  SB.threadBegin = (state = 'rich-answer', title) => { SB.state(state); SB.feedClear(); if (title) SB.retitle(title); SB.feedToEnd() }
  SB.feedToEnd = () => SB.scrollFeed('end')
  /** Rename the open chat everywhere the app shows it: sidebar active row + the header title. */
  SB.retitle = (title) => {
    const short = title.length > 47 ? title.slice(0, 47) + '...' : title
    for (const row of $$('[data-testid="chat-row"][data-active="true"], [data-slot="chat-row"][data-active="true"]')) { const t = $('[data-slot="chat-row-title"]', row); if (t) { t.textContent = short; t.title = short } }
    for (const t of $$('.chat-title-trigger')) t.textContent = short
    for (const t of $$('.hub-main-head-quiet [data-slot="chat-title"]')) t.textContent = short
  }

  /* ---------------------------------------------------------------------- bubbles */
  SB.userRow = (text) => {
    const r = SB.tpl('rich-answer', '[data-testid="feed"] > [data-slot="message-row"][data-variant="bubble"]')
    const p = $('[data-slot="markdown-para"]', r); p.textContent = ''; p.appendChild(SB.inline(text))
    r.dataset.messageId = 'sb-u' + ++uid
    return r
  }

  /* ----------------------------------------------------------------- code highlighting */
  const KW = new Set('const let var function return if else for while import export from new class extends async await try catch throw typeof of in default switch case break continue interface type enum def self None True False lambda yield with as pass raise'.split(' '))
  const tok = (cls, s) => `<span style="color:var(--shiki-${cls})">${esc(s)}</span>`
  /** A deliberately small tokenizer (comments, strings, numbers, keywords, calls, punctuation) painting with the app's own --shiki-* tokens. */
  function highlightLine(line) {
    const out = []; const re = /(\/\/.*$|#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\/(?:[^\/\\\n]|\\.)+\/)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)(\()?|([{}()\[\],.;:=<>+\-*\/!&|?]+)|(\s+)/g
    let m, last = 0
    while ((m = re.exec(line))) {
      if (m.index > last) out.push(tok('foreground', line.slice(last, m.index)))
      if (m[1]) out.push(tok('token-comment', m[1]))
      else if (m[2]) out.push(tok('token-string-expression', m[2]))
      else if (m[3]) out.push(tok('token-constant', m[3]))
      else if (m[4]) { if (KW.has(m[4])) out.push(tok('token-keyword', m[4])); else if (m[5]) out.push(tok('token-function', m[4])); else out.push(tok('foreground', m[4])); if (m[5]) out.push(tok('foreground', '(')) }
      else if (m[6]) out.push(tok(/^[=<>+\-*\/!&|?]+$/.test(m[6]) ? 'token-keyword' : 'token-punctuation', m[6]))
      else out.push(tok('foreground', m[7]))
      last = re.lastIndex
    }
    if (last < line.length) out.push(tok('foreground', line.slice(last)))
    return out.join('')
  }
  SB.codeBlock = ({ lang = 'ts', text, run = true }) => {
    const cb = SB.tpl('rich-tools', '[data-slot="code-block"]'); cb.dataset.lang = lang
    const lines = text.replace(/\n$/, '').split('\n')
    $('[data-slot="code-block-head"] > span', cb).textContent = `${lang} – ${lines.length} ${lines.length === 1 ? 'line' : 'lines'}`
    $('code', cb).innerHTML = lines.map((l) => `<span>${highlightLine(l)}</span>`).join('\n')
    if (!run) { const b = $('[data-testid="code-block-run"]', cb); if (b) b.remove() }
    return cb
  }

  /* ------------------------------------------------------------------------ tables */
  SB.table = ({ head, rows }) => {
    const t = SB.tpl('rich-long', '[data-slot="markdown-table"]')
    const th = $$('thead th', t), tr0 = $('tbody tr', t), tb = $('tbody', t)
    const cells = (tag, vals, proto) => { const c = proto.cloneNode(true); c.innerHTML = ''; if (vals) c.appendChild(el(`<span>${esc(vals)}</span>`)); return c }
    const headRow = $('thead tr', t); const thProto = th[1]; headRow.innerHTML = ''
    head.forEach((h) => headRow.appendChild(cells('th', h, thProto)))
    const trProto = tr0.cloneNode(true); const tdProto = $('td', trProto); tb.innerHTML = ''
    for (const r of rows) { const tr = trProto.cloneNode(false); r.forEach((v) => tr.appendChild(cells('td', v, tdProto))); tb.appendChild(tr) }
    // the app wraps the table in its card (row count, Copy, CSV); keep that wrapper when the template had it
    return t
  }
  /** The table inside the app's card (row count, Copy, CSV). */
  SB.tableCard = (spec) => {
    const c = SB.tpl('rich-long', '[data-slot="table-card"]')
    const n = spec.rows.length
    $('[data-slot="table-card-head"] > span', c).textContent = `${n} ${n === 1 ? 'row' : 'rows'}`
    $('[data-slot="markdown-table"]', c).replaceWith(SB.table(spec))
    return c
  }

  /* ----------------------------------------------------------------- assistant answer */
  /** blocks: [{lead}, {p}, {ol:[…]}, {ul:[…]}, {code:{lang,text}}, {table:{head,rows}}]  (strings take **bold** / `code`). */
  SB.answerRow = (blocks, { pending = false } = {}) => {
    const r = SB.tpl('rich-answer', '[data-testid="feed"] > [data-slot="message-row"][data-variant="prose"]')
    r.dataset.messageId = 'sb-a' + ++uid
    const body = $('[data-answer-body]', r); body.innerHTML = ''
    for (const b of blocks) {
      if (b.lead !== undefined) { const p = el('<p data-slot="answer-lead"></p>'); p.appendChild(SB.inline(b.lead)); body.appendChild(p) }
      else if (b.p !== undefined) { const p = el('<p data-slot="markdown-para" class="text-body text-fg"></p>'); p.appendChild(SB.inline(b.p)); body.appendChild(p) }
      else if (b.ol || b.ul) {
        const l = el(`<${b.ol ? 'ol' : 'ul'} data-slot="markdown-list" class="flex flex-col gap-4 pl-16" style="list-style-type: ${b.ol ? 'decimal' : 'disc'};"></${b.ol ? 'ol' : 'ul'}>`)
        for (const it of b.ol || b.ul) { const li = el('<li class="text-body text-fg"></li>'); li.appendChild(SB.inline(it)); l.appendChild(li) }
        body.appendChild(l)
      } else if (b.code) body.appendChild(SB.codeBlock(b.code))
      else if (b.table) body.appendChild(SB.tableCard(b.table))
    }
    if (!pending) r.removeAttribute('data-streaming')
    return r
  }

  /* --------------------------------------------------------------------- outcomes */
  /** A captured "Worked for …" outcome. which: 'answer' (0s · 2 steps, collapsed), 'tools' (4s · 4 steps, collapsed),
   *  'tools-open' (steps expanded: Read 2 files / diff rows / Ran npm test), 'diff-open' (…with the first diff unfolded). Label is editable. */
  SB.outcome = (which = 'tools', label) => {
    const src = { answer: ['rich-answer', 0], tools: ['rich-tools', 1], 'tools-open': ['rich-tools-open', 1], 'diff-open': ['rich-diff-open', 1] }[which]
    const o = SB.tpl(src[0], '[data-testid="feed"] > [data-slot="turn-outcome"]', src[1])
    if (label) { $('.sb-outcome-label', o).textContent = label; const b = $('.sb-outcome-trigger', o); if (b) b.setAttribute('aria-label', label) }
    return o
  }
  /** Stagger the open outcome's step rows in (each li fades/rises by its own --i), as the app does on open: p = 0..1. */
  SB.stepsReveal = (outcome, p) => {
    const lis = $$('.sb-steps > li', outcome); const n = lis.length
    lis.forEach((li, i) => { const q = SB.clamp01(p * (n + 1) - i); li.style.opacity = String(q); li.style.transform = `translateY(${(1 - SB.ease.out(q)) * 6}px)` })
  }
  /** The in-flight turn: a captured live row ("editing <target> · Ns" + finished step lines). */
  SB.liveRow = ({ verb = 'editing', target = 'date.test.ts', secs = 6, steps } = {}) => {
    const r = SB.tpl('rich-live', '[data-testid="feed"] > [data-slot="message-row"][data-status="pending"]')
    const line = $('[data-slot="thinking-line-text"]', r); line.textContent = `${verb} ${target}`; line.dataset.text = `${verb} ${target}`
    $('[data-slot="sonar-clock"] .sb-sonar-clock-digits', r).textContent = `${secs}s`
    if (steps) { const feed = $('[data-slot="sonar-feed"]', r); const proto = $('li', feed); feed.innerHTML = ''; for (const s of steps) { const li = proto.cloneNode(true); $('.sb-line-verb', li).textContent = s.verb; $('.sb-line-target', li).textContent = s.target; const res = $('.sb-line-result', li); if (res) res.textContent = s.result ? ` · ${s.result}` : ''; feed.appendChild(li) } }
    return r
  }

  /* ------------------------------------------------------------------ streaming reveal */
  const orig = new WeakMap()
  /** Reveal the text of `root` progressively (p 0..1) in document order; blocks with nothing revealed yet are hidden so the row grows as it streams. */
  SB.reveal = (root, p) => {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const nodes = []; let n
    while ((n = w.nextNode())) { if (!orig.has(n)) orig.set(n, n.textContent); if (orig.get(n).trim() || /\S/.test(orig.get(n))) nodes.push(n) }
    const total = nodes.reduce((a, x) => a + orig.get(x).length, 0); let left = Math.round(total * SB.clamp01(p))
    for (const x of nodes) { const full = orig.get(x); const k = Math.max(0, Math.min(full.length, left)); x.textContent = full.slice(0, k); left -= full.length }
    for (const blk of $$('p, li, ol, ul, [data-slot="code-block"], [data-slot="markdown-table"], [data-slot="markdown-table"] ~ *', root)) {
      const t = blk.textContent; blk.style.display = (t.length === 0 && p < 1) ? 'none' : ''
    }
  }
  /** Fade + rise a freshly appended row (p 0..1). */
  SB.rise = (node, p, px = 10) => { const q = SB.ease.out(SB.clamp01(p)); node.style.opacity = String(q); node.style.transform = `translateY(${(1 - q) * px}px)` }
})()

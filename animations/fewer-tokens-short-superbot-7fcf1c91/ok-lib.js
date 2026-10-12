/* ok-lib: helpers for the one-key-every-model ad, layered on the real-UI kit (engine.js + rows.js + ktr-lib.js + ext.js).
 *
 *  1. SB.brandSafe(): X halted both real-UI 16:9s of the earlier ads as "Unacceptable Content" (Unauthorized References: third-party brand logos
 *     and product names as chat titles). The real app DOM, CSS and layout stay; this only neutralises what a third party owns:
 *       - sidebar chat rows: third-party product titles become plain task titles, source icons / source badges become the app's own generic chat glyph
 *       - header account stack: only the superbot cat disc is kept
 *       - provider artwork in the model picker and the composer chip (img tiles, inline logo svgs, provider tags): replaced by the app's own
 *         avatar-fallback tile with an initial; the vendor / model NAMES stay as text (GPT-5 Codex, Sonnet 4.6 ...)
 *     It is idempotent and cheap (every node it touches is stamped), and runs inside SB.decorate so every state / overlay / chip swap is covered.
 *  2. SB.apiTidy(): the Settings > Connections > API access sheet (captured fixture) gets coherent numbers, the drop-in snippet gains the
 *     request line that carries `model`, the call log is rebuilt with calls across models.
 */
(() => {
  const SB = window.SB, $ = SB.$, $$ = SB.$$
  const css = document.createElement('style')
  css.textContent = `
.sb-neutral{display:inline-grid;place-items:center;flex:0 0 auto;border-radius:24%;background:var(--color-avatar-fallback, var(--color-raised));color:var(--color-fg-secondary, var(--color-muted));font:600 11px/1 var(--font-ui, Inter, system-ui);letter-spacing:0;text-transform:uppercase;overflow:hidden}
.sb-neutral[data-size="tile"]{width:100%;height:100%;font-size:12px}
.sb-neutral[data-size="dot"]{width:100%;height:100%;border-radius:50%;font-size:0}
.sb-neutral[data-size="sec"]{width:var(--spacing-16, 16px);height:var(--spacing-16, 16px);font-size:9px}
.sb-neutral[data-size="chip"]{width:100%;height:100%;font-size:9px}
.sb-ask-hl{background:color-mix(in oklch, var(--color-brand-storm-1, #2b6bff) 38%, transparent);border-radius:4px;box-shadow:0 0 0 2px color-mix(in oklch, var(--color-brand-storm-1, #2b6bff) 38%, transparent)}
.developer-row-mask,[data-testid="developer-budget"]{display:none !important}
`
  document.head.appendChild(css)

  /* ------------------------------------------------------------ titles */
  const TITLES = [
    [/^Zazen: session summary/, 'Weekly session summary'],
    [/^Draft the changelog.*/, 'Draft the changelog'],
    [/^Draft notes offline.*/, 'Draft notes offline'],
    [/^Refactor the ingest pipeline/, 'Plan the data import'],
    [/^\/doctor --plan run/, 'Check the nightly run'],
    [/^Gemini CLI: refactor a script/, 'Refactor a shell script'],
    [/^Muse onboarding copy/, 'Onboarding copy'],
    [/^Codex CLI refactor/, 'Refactor the CLI'],
    [/^Kiro: spec a new endpoint/, 'Spec a new endpoint'],
    [/^Cowork: the billing refactor/, 'Billing refactor notes'],
    [/^Review the pull request.*/, 'Review the pull request'],
    [/^Amazon Q CLI: IAM policy review/, 'IAM policy review'],
    [/^Copilot CLI: explain a git command/, 'Explain a git command'],
    [/^Roo Code: fix a failing test/, 'Fix a failing test'],
    [/^Qwen Code: optimize a loop/, 'Optimize a loop'],
    [/^Gemini workspace audit/, 'Workspace audit'],
    [/^Summarize the meeting.*/, 'Summarize the meeting'],
    [/^Windsurf: wire a new route/, 'Wire a new route'],
    [/^Explain the build error.*/, 'Explain the build error'],
    [/^opencode: add a CLI flag/, 'Add a CLI flag'],
    [/^Cherry Studio prompt tuning/, 'Prompt tuning'],
    [/^Grok launch checklist/, 'Launch checklist'],
    [/^Zed: format-on-save setup/, 'Format-on-save setup'],
    [/^Write unit tests.*/, 'Write unit tests'],
    [/^Chatbox .*/, 'Trip planning notes'],
    [/^Continue: .*/, 'Tidy the config'],
    [/^Jan .*/, 'Offline chat notes'],
    [/^AnythingLLM .*/, 'Handbook Q&A']
  ]
  const retitle = (s) => { for (const [re, to] of TITLES) if (re.test(s)) return s.replace(re, to); return s }
  // any leftover "(model-name)" suffix or "Vendor: " prefix naming a third-party tool
  const BRAND = /\b(Zazen|Gemini|Codex|Kiro|Cowork|Muse|Amazon Q|Copilot|Roo|Qwen|Windsurf|opencode|Cherry Studio|Grok|Zed|Chatbox|AnythingLLM|Claude|ChatGPT|OpenAI|Anthropic|Cursor|Devin|Ollama|llama|mistral|phi-4)\b/i

  /* a neutral provider mark: the app's avatar-fallback tile with an initial (the vendor / model NAME stays as text next to it) */
  const neutral = (initial, size) => { const s = document.createElement('span'); s.className = 'sb-neutral'; s.setAttribute('data-size', size); s.setAttribute('aria-hidden', 'true'); s.textContent = initial; return s }
  const genericGlyph = () => {
    // the app's own generic chat glyph (lucide message-square), cloned from a sidebar row that carries it; fall back to a literal copy of the same svg
    const src = $('[data-slot="chat-row-mark"] > svg.lucide-message-square')
    if (src) return src.cloneNode(true)
    const t = document.createElement('template')
    t.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'
    return t.content.firstElementChild
  }
  const initialOf = (s) => ((s || '').replace(/^[^A-Za-z0-9]+/, '')[0] || '•').toUpperCase()

  SB.brandSafe = () => {
    /* fixture identity + red badges (the kit's ktr-lib neutraliser is replaced by ext.js's, so repeat it here) */
    for (const e of $$('.awc-nm')) { if (e.textContent !== 'Sam') { e.textContent = 'Sam'; e.title = 'Sam' } }
    for (const e of $$('.awc-pop-email')) { e.textContent = 'sam@example.com'; e.title = 'sam@example.com' }
    for (const e of $$('.hub-side-row-badge, .awc-tool-dot')) e.style.display = 'none'
    /* sidebar chat rows */
    for (const row of $$('[data-slot="chat-row"]:not([data-sb-safe])')) {
      row.setAttribute('data-sb-safe', '1')
      const title = $('[data-slot="chat-row-title"]', row)
      if (title) { const t = retitle(title.textContent); if (t !== title.textContent) { title.textContent = t; title.title = t } }
      const mark = $('[data-slot="chat-row-mark"]', row)
      if (mark) {
        const third = $('img[data-provider-tile]', mark) || $('svg > image', mark)
        const badge = $('[data-slot="chat-row-badge"]', mark)
        if (badge) badge.remove()
        if (third && !/superbot/.test(third.getAttribute('src') || third.getAttribute('href') || '')) {
          const progress = $('[data-slot="chat-row-progress"]', row)
          if (!progress) { for (const c of [...mark.children]) c.remove(); mark.appendChild(genericGlyph()) }
          else { const sv = third.closest('svg') || third; sv.replaceWith(genericGlyph()) }
        }
      }
    }
    /* any later retitle (SB.retitle writes the visible title) must not bring a brand back: sweep titles of rows we stamped */
    for (const t of $$('[data-slot="chat-row-title"]')) if (BRAND.test(t.textContent)) { const n = retitle(t.textContent); if (n !== t.textContent) { t.textContent = n; t.title = n } }

    /* header account stack: only the superbot cat disc */
    for (const li of $$('[data-testid="hud-disc"]:not([data-sb-safe])').map((b) => b.closest('li'))) {
      if (!li) continue
      const b = $('[data-testid="hud-disc"]', li); b.setAttribute('data-sb-safe', '1')
      const img = $('img[data-provider-tile]', li)
      if (img && !/superbot/.test(img.getAttribute('src') || '')) li.style.display = 'none'
    }

    /* the "Pick up" chip on the hero and any other bare third-party image mark outside chat rows */
    for (const im of $$('svg > image:not([data-sb-safe]), img[src*="cosmos-"]:not([data-sb-safe])')) {
      im.setAttribute('data-sb-safe', '1')
      if (/superbot/.test(im.getAttribute('href') || im.getAttribute('src') || '')) continue
      const host = im.closest('svg') || im
      if (host.closest('[data-slot="chat-row"]')) continue
      const g = genericGlyph(); g.setAttribute('width', host.getAttribute('width') || '16'); g.setAttribute('height', host.getAttribute('height') || '16'); g.style.cssText = host.getAttribute('style') || ''; g.setAttribute('class', (g.getAttribute('class') || '') + ' ' + (host.getAttribute('class') || ''))
      host.replaceWith(g)
    }

    /* project rows (Code tab): same rule as chat rows */
    for (const im of $$('[data-slot="chat-row-mark"] img[data-provider-tile]:not([data-sb-safe])')) { im.setAttribute('data-sb-safe', '1'); const m = im.parentElement; im.replaceWith(genericGlyph()); m.setAttribute('data-sb-safe', '1') }

    /* model picker + composer chip: provider artwork -> neutral tile (names stay) */
    const rowName = (el) => { const r = el.closest('[role="option"],[data-slot="composer-plat"],[data-testid="composer-plat"]'); const nm = r && ($('.bc-platname > span', r) || r.querySelector('span.min-w-0.truncate')); return nm ? nm.textContent : (r && r.getAttribute('aria-label')) || '' }
    for (const im of $$('img[data-provider-tile]:not([data-sb-safe])')) {
      if (im.closest('[data-slot="chat-row-mark"]') || im.closest('[data-testid="hud-disc"]')) continue
      im.setAttribute('data-sb-safe', '1')
      const host = im.parentElement
      const box = host.classList.contains('bc-platicon') ? 'chip' : 'tile'
      const n = neutral(initialOf(rowName(im)), box); n.setAttribute('data-sb-safe', '1'); im.replaceWith(n)
    }
    /* inline vendor logo svgs: section headers in the picker (ChatGPT Plus / Claude Pro ...), provider tags on rows, the chip's own mark */
    for (const sec of $$('[data-slot="composer-plat-section"]:not([data-sb-safe])')) {
      sec.setAttribute('data-sb-safe', '1')
      const holder = sec.firstElementChild; const label = holder && holder.nextElementSibling
      if (holder && $('svg', holder) && label && !/superbot/i.test(label.textContent)) { for (const c of [...holder.children]) c.remove(); holder.appendChild(neutral(initialOf(label.textContent), 'sec')) }
    }
    for (const tag of $$('.sb-provider-tag-mark:not([data-sb-safe])')) {
      tag.setAttribute('data-sb-safe', '1')
      if (tag.getAttribute('data-mark') === 'superbot') continue
      for (const c of [...tag.children]) c.remove()
      tag.style.background = 'var(--color-avatar-fallback, var(--color-raised))'; tag.style.color = 'var(--color-fg-secondary, var(--color-muted))'
    }
    for (const mk of $$('[data-row-mark]:not([data-sb-safe])')) {
      mk.setAttribute('data-sb-safe', '1')
      if (mk.getAttribute('data-row-mark') === 'superbot') continue
      const sv = $(':scope > svg', mk)
      if (sv && sv.getAttribute('viewBox') && !/^0 0 (100 100|24 24)/.test(sv.getAttribute('viewBox'))) sv.replaceWith(neutral(initialOf(rowName(mk)), 'chip'))
    }
    for (const sv of $$('svg[viewBox="0 0 42 42"]:not([data-sb-safe]),svg[viewBox="0 0 2406 2406"]:not([data-sb-safe])')) {
      sv.setAttribute('data-sb-safe', '1')
      const host = sv.parentElement
      if (host.closest('[data-slot="composer-plat-popover"],[data-testid="composer-plat"],[data-testid="composer-plat-scroll"]')) sv.replaceWith(neutral(initialOf(rowName(sv)), 'chip'))
    }
  }

  const decorate = SB.decorate
  SB.decorate = () => { decorate(); SB.brandSafe(); SB.apiTidy && SB.apiTidy() }

  /* ================================================================ API access sheet */
  /* the numbers the sheet shows (fixture-style, calm, coherent with each other): 140 calls this week = 61 + 52 + 27, 1.2M tokens = 540k + 410k + 250k, $4.86 = 2.31 + 1.84 + 0.71 */
  const DAYS = [0.46, 0.62, 0.39, 0.71, 0.55, 0.34, 1]
  const DAY_CALLS = [14, 19, 11, 22, 17, 10, 47]
  const LOG = [
    { key: 'Laptop agent', model: 'superbot', tok: '9.6k', when: 'just now', usd: '$0.01' },
    { key: 'Laptop agent', model: 'claude-sonnet-4-6', tok: '12.4k', when: 'just now', usd: '$0.05' },
    { key: 'Laptop agent', model: 'gpt-5-codex', tok: '8.1k', when: 'just now', usd: '$0.03' },
    { key: 'Support bot', model: 'gpt-5', tok: '2.1k', when: '2m ago', usd: '$0.04' },
    { key: 'Nightly jobs', model: 'superbot-fast', tok: '3.4k', when: '6m ago', usd: '$0.01' },
    { key: 'Support bot', model: 'claude-sonnet-4-6', tok: '960', when: '11m ago', usd: '$0.02' },
    { key: 'Nightly jobs', model: 'gpt-5-codex', tok: '2.7k', when: '14m ago', usd: '$0.06' },
    { key: 'Support bot', model: 'superbot', tok: '1.4k', when: '21m ago', usd: '$0.03' }
  ]
  SB.apiLog = LOG
  const setText = (el, s) => { if (el) el.textContent = s }

  SB.apiTidy = () => {
    for (const o of $$('[data-testid="settings-overlay"]:not([data-sb-tidy])')) {
      o.setAttribute('data-sb-tidy', '1')
      // identity
      const w = document.createTreeWalker(o, NodeFilter.SHOW_TEXT); let n
      while ((n = w.nextNode())) if (/(alex|stub)@example/.test(n.textContent)) n.textContent = n.textContent.replace(/(alex|stub)@example\.(com|test)/g, 'sam@example.com')
      for (const e of $$('[aria-label*="example.com"],[title*="example.com"]', o)) for (const a of ['aria-label', 'title']) { const v = e.getAttribute(a); if (v && /(alex|stub)@example/.test(v)) e.setAttribute(a, v.replace(/(alex|stub)@example\.(com|test)/g, 'sam@example.com')) }
      for (const e of $$('[data-testid^="settings-nav-"] .lucide, .hub-unread-dot', o)) if (e.classList.contains('hub-unread-dot')) e.style.display = 'none'
      // the red "1" on Subscriptions & keys (a fixture "needs attention" count) is not part of this story
      for (const b of $$('[data-testid^="settings-nav-"] span, [data-testid^="settings-nav-"] i', o)) if (/^\d+$/.test(b.textContent.trim()) && b.children.length === 0) b.style.display = 'none'
      const inp = $('[data-testid="settings-filter"]', o); if (inp) { inp.removeAttribute('data-sb-focus'); inp.blur() }
      // header strip of the pane
      const tiles = $$('[data-slot="stat-tile"]', o)
      for (const t of tiles) {
        const lab = $('[data-slot="stat-label"]', t), val = $('[data-slot="stat-value"]', t)
        if (!lab || !val) continue
        const l = lab.textContent.trim()
        if (l === 'calls this week') val.textContent = '140'
        else if (l === 'spend this week') val.textContent = '$4.86'
        else if (l === 'calls') val.textContent = '140'
        else if (l === 'tokens') val.textContent = '1.2M'
        else if (l === 'spend') val.textContent = '$4.86'
        else if (l === 'saved') val.textContent = '$1.20'
      }
      // usage: per-day columns, by-key rows
      const days = $$('[data-testid="api-usage-day"]', o)
      days.forEach((d, i) => { const b = $('.api-usage-bar', d); if (b && DAYS[i] != null) b.style.setProperty('--share', String(DAYS[i])); const lab = $('.api-usage-day-label', d); if (lab) d.title = `${lab.textContent}: ${DAY_CALLS[i]} calls` })
      const byKey = [['Laptop agent', '61 calls', '$2.31', '540k tokens'], ['Support bot', '52 calls', '$1.84', '410k tokens'], ['Nightly jobs', '27 calls', '$0.71', '250k tokens']]
      $$('[data-testid="api-usage-key-row"]', o).forEach((r, i) => {
        const b = byKey[i]; if (!b) return
        setText($('[data-slot="row-title"]', r), b[0]); setText($('[data-slot="row-meta"]', r), b[1]); setText($('[data-slot="row-value"]', r), b[2])
        setText($('.api-usage-key-tokens', r.closest('li')), b[3])
      })
      // call log: rebuild with calls across models (tokens + cost per call)
      const rows = $$('[data-testid="api-usage-recent-row"]', o)
      if (rows.length) {
        const ul = rows[0].closest('ul'); const proto = rows[0].closest('li')
        for (const li of [...ul.children]) if (li !== proto) li.remove()
        LOG.forEach((c, i) => {
          const li = i === 0 ? proto : proto.cloneNode(true)
          if (i) ul.appendChild(li)
          setText($('[data-slot="row-title"]', li), c.key)
          setText($('[data-slot="row-meta"]', li), `${c.model} ${c.tok} ${c.when}`)
          setText($('[data-slot="row-value"]', li), c.usd)
          setText($('[data-slot="row-status"]', li), 'ok')
        })
        const head = $('[data-slot="row-group-count"]', ul.closest('section')); setText(head, String(LOG.length))
      }
    }
  }

  /* ------------------------------------------------ the drop-in snippet: the request line that carries `model` */
  const SNIP_MODELS = ['gpt-5-codex', 'claude-sonnet-4-6', 'superbot']
  /** The curl snippet gets the request line from docs (api.md): -d '{"model":"<id>","messages":[...]}'. `idx` (float) picks the id; the id is typed over from the previous one. */
  SB.snippetModel = (idx) => {
    const code = $('[data-testid="developer-snippet-curl"] code > span'); if (!code) return
    const i = Math.max(0, Math.min(SNIP_MODELS.length - 1, Math.floor(idx))); const f = idx - Math.floor(idx)
    let target = SNIP_MODELS[i]
    if (idx >= SNIP_MODELS.length) { target = SNIP_MODELS[SNIP_MODELS.length - 1] }
    const prev = i > 0 ? SNIP_MODELS[i - 1] : ''
    // erase the previous id for the first 40 % of the step, then type the new one
    let shown
    if (!prev) shown = target.slice(0, Math.round(target.length * Math.min(1, f * 1.6)))
    else if (f < 0.4) shown = prev.slice(0, Math.round(prev.length * (1 - f / 0.4)))
    else shown = target.slice(0, Math.round(target.length * Math.min(1, (f - 0.4) / 0.5)))
    if (idx >= SNIP_MODELS.length) shown = target
    let line = code.querySelector('[data-sb-model-line]')
    if (!line) {
      const first = code.querySelector('span[style*="shiki-foreground"]') // the trailing " \" after the URL
      const auth = [...code.querySelectorAll('span')].find((s) => /Authorization/.test(s.textContent))
      if (auth && !/\\$/.test(auth.textContent)) auth.textContent = auth.textContent + ' \\'
      line = document.createElement('span'); line.setAttribute('data-sb-model-line', '1')
      line.innerHTML = '<br><span style="color:var(--shiki-token-string)">  -d</span><span style="color:var(--shiki-token-string-expression)"> \'{"model": "</span><span data-sb-model-id class="sb-ask-hl" style="color:var(--shiki-token-string-expression)"></span><span style="color:var(--shiki-token-string-expression)">", "messages": [...]}\'</span>'
      code.appendChild(line)
    }
    $('[data-sb-model-id]', line).textContent = shown || '​'
    return shown
  }
})()

/* sp-lib: helpers for the one-spend-number ad, layered on the real-UI kit (engine.js + rows.js + ktr-lib.js + ext.js).
 *
 *  1. SB.brandSafe(): keeps the real app DOM, logos and layout. It only renames what a third party's product name sits in as FIXTURE text:
 *     sidebar chat titles (Zazen, Gemini CLI, Codex CLI, Kiro, Amazon Q CLI, Cowork, Muse, /doctor ...) become plain task titles, and the
 *     fixture identity stays neutral ('Sam', sam@example.com). Provider logos in the picker, the composer chip and the Spend rows are the app's own, untouched.
 *  2. SB.spendTidy(): the Spend modal (captured fixture) is made coherent with the API access pane: 140 calls = 61 + 52 + 27, $4.86 = 2.31 + 1.84 + 0.71,
 *     of $17.55 paid this week. The savings tiles / lines / group are hidden (this ad claims no savings).
 *  3. SB.apiTidy(): the Settings > Connections > API access > Usage pane gets the same numbers and a call log with tokens + cost per call.
 */
(() => {
  const SB = window.SB, $ = SB.$, $$ = SB.$$
  const css = document.createElement('style')
  css.textContent = `
.developer-row-mask,[data-testid="developer-budget"]{display:none !important}
.sb-sp-hide{display:none !important}
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

  SB.brandSafe = () => {
    for (const e of $$('.awc-nm')) { if (e.textContent !== 'Sam') { e.textContent = 'Sam'; e.title = 'Sam' } }
    for (const e of $$('.awc-pop-email')) { e.textContent = 'sam@example.com'; e.title = 'sam@example.com' }
    for (const e of $$('.hub-side-row-badge, .awc-tool-dot')) e.style.display = 'none'
    for (const t of $$('[data-slot="chat-row-title"]')) { const n = retitle(t.textContent); if (n !== t.textContent) { t.textContent = n; t.title = n } }
  }

  const decorate = SB.decorate
  SB.decorate = () => { decorate(); SB.brandSafe(); SB.apiTidy && SB.apiTidy(); SB.spendTidy && SB.spendTidy() }

  /* ================================================================ API access sheet */
  /* the numbers the sheet shows (fixture-style, calm, coherent with each other): 140 calls this week = 61 + 52 + 27, 1.2M tokens = 540k + 410k + 250k, $4.86 = 2.31 + 1.84 + 0.71 */
  const DAYS = [0.46, 0.62, 0.39, 0.71, 0.55, 0.34, 1]
  const DAY_CALLS = [14, 19, 11, 22, 17, 10, 47]
  const LOG = [
    { key: 'Laptop agent', model: 'claude-sonnet-4-6', tok: '12.4k', when: 'just now', usd: '$0.05' },
    { key: 'Laptop agent', model: 'gpt-5-codex', tok: '8.1k', when: '2m ago', usd: '$0.03' },
    { key: 'Support bot', model: 'gpt-5', tok: '2.1k', when: '6m ago', usd: '$0.04' },
    { key: 'Nightly jobs', model: 'superbot-fast', tok: '3.4k', when: '9m ago', usd: '$0.01' },
    { key: 'Support bot', model: 'claude-sonnet-4-6', tok: '960', when: '11m ago', usd: '$0.02' },
    { key: 'Nightly jobs', model: 'gpt-5-codex', tok: '2.7k', when: '14m ago', usd: '$0.06' },
    { key: 'Laptop agent', model: 'superbot', tok: '9.6k', when: '18m ago', usd: '$0.01' },
    { key: 'Support bot', model: 'superbot', tok: '1.4k', when: '21m ago', usd: '$0.03' }
  ]
  SB.apiLog = LOG

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
        else if (l === 'saved') t.classList.add('sb-sp-hide')
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

  const setText = (el, s) => { if (el) el.textContent = s }

  /* ================================================================ Spend modal */
  const KEYS = [['Laptop agent', 2.31, 61, '540k tokens'], ['Support bot', 1.84, 52, '410k tokens'], ['Nightly jobs', 0.71, 27, '250k tokens']]
  const PAID = 17.55
  SB.spendTidy = () => {
    for (const d of $$('dialog[data-sb-modal]:not([data-sb-sptidy])')) {
      if (!$('[data-testid="stuff-modal-spend"]', d)) continue
      d.setAttribute('data-sb-sptidy', '1')
      // week strip: paid this week | providers | calls (the two savings tiles and the savings line go)
      const tiles = $$('[data-slot="stat-tile"]', d)
      for (const t of tiles) {
        const lab = $('.sb-stat-label', t), val = $('.sb-stat-value', t); if (!lab || !val) continue
        const l = lab.textContent.trim()
        if (l === 'kept off list price') { val.textContent = '5'; lab.textContent = 'providers'; t.removeAttribute('data-tone') }
        else if (l === 'could save / month') t.classList.add('sb-sp-hide')
      }
      for (const p of $$('.stuff-spend-line', d)) if (/off list price/.test(p.textContent)) p.classList.add('sb-sp-hide')
      for (const g of $$('[data-slot="row-group"]', d)) { const t = $('[data-slot="row-group-head"] .sb-group-title', g); if (t && /Savings/.test(t.textContent)) g.classList.add('sb-sp-hide') }
      // paid by key: same numbers as the API pane (61 + 52 + 27 calls, $4.86 of $17.55); the rest is unattributed
      const other = PAID - KEYS.reduce((a, k) => a + k[1], 0)
      const pct = (v) => Math.round((v / PAID) * 100) + '%'
      const legend = $$('[data-slot="stack-bar-legend-row"]', d)
      const rowsData = [...KEYS.map((k) => [k[0], k[1]]), ['Unattributed', other]]
      legend.forEach((li, i) => { const r = rowsData[i]; if (!r) return; setText($('.sb-stack-legend-label', li), r[0]); setText($('.sb-stack-legend-value', li), '$' + r[1].toFixed(2)); setText($('.sb-stack-legend-pct', li), pct(r[1])) })
      const segs = $$('[data-slot="stack-bar-segment"]', d)
      segs.forEach((s, i) => { const r = rowsData[i]; if (r) s.style.flex = ((r[1] / PAID) * 100).toFixed(4) + ' 0 0px' })
      const keyRows = $$('[data-slot="grouped-row"]', d).filter((r) => /calls/.test(r.textContent) && $('[data-slot="row-status"]', r))
      keyRows.forEach((r, i) => {
        const k = KEYS[i]; if (!k) return
        setText($('[data-slot="row-title"]', r), k[0]); setText($('[data-slot="row-value"]', r), '$' + k[1].toFixed(2))
        const sp = $$('[data-slot="row-meta"] > span', r); if (sp[0]) sp[0].textContent = k[2] + ' calls'; if (sp[1]) sp[1].textContent = k[3]
      })
    }
  }
})()

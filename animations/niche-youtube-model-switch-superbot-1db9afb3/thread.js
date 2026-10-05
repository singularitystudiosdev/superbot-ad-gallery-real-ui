// The thread, built inside the real app document (superbot desktop main, captured DOM) by cloning the app's own
// rows and blocks out of the captured states and changing only their words, tiles and media:
//   the user bubble ............ message-row[data-variant=bubble]           (t2-list)
//   the working turn ........... message-row[data-variant=prose] + live turn head (sonar mark, status swap, clock)
//   a model hand-off ........... live-provider-switch: pill + nest + who row  (04-t1-live)
//   a service hand-off ......... live-provider-switch with its step list      (18-t3-step3)
//   tool lines ................. sonar-live-feed step lines ("Searched", "Read ... · Read N pages")
//   answer prose ............... answer-lead, markdown-para, markdown-list, markdown-link with its favicon
//   generated image ............ image-card-frame + "via <model>" provenance  (06-t1-done)
// Media the captured states never showed are drawn from the components' own markup and classes
// (packages/ui/src/components/embeds/audio-row.tsx, media-embed.tsx; code-block.tsx): app/extra.css carries the
// few utility rules the pruned capture stylesheet lacks. Every block grows in (its height eases open) so the
// bottom-pinned feed scrolls smoothly, like the app's own enter. Pure function of t.
import { B, T, ASK, seg, lerp, clamp, outCubic, inOutCubic } from './tl.js?v=1db9afb3';
import { LINES, CODE_FILE, CODE_LINES } from './code.js?v=1db9afb3';
import { PEAKS48 } from './audio.js?v=1db9afb3';

const LU = {
  check: '<path d="M20 6 9 17l-5-5"></path>',
  loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56"></path>',
  play: '<polygon points="6 3 20 12 6 21 6 3"></polygon>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>',
  download: '<path d="M12 15V3"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path>',
  film: '<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M7 3v18"></path><path d="M3 7.5h4"></path><path d="M3 12h18"></path><path d="M3 16.5h4"></path><path d="M17 3v18"></path><path d="M17 7.5h4"></path><path d="M17 16.5h4"></path>',
  chevron: '<path d="m9 18 6-6-6-6"></path>',
};
const svg = (k, cls, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-${k} ${cls}" aria-hidden="true">${LU[k]}</svg>`;

// who answers each hand-off, and the tile the app draws for it
export const WHO = {
  deepseek: { kind: 'model', name: 'DeepSeek V4 Pro', tile: 'app/tile-deepseek.svg', key: 'deepseek' },
  blender: { kind: 'service', name: 'Blender', site: 'app/fav-blender.svg', mark: 'www.blender.org' },
  eleven: { kind: 'model', name: 'Eleven v3', tile: 'app/tile-elevenlabs.svg', key: 'elevenlabs' },
  opus: { kind: 'model', name: 'Claude Opus 5.5', tile: 'app/anthropic-BvxDmc1_.png', key: 'anthropic' },
  nano: { kind: 'model', name: 'Gemini 3 Pro Image', tile: 'app/google-Dj8W2UDz.png', key: 'google' },
  youtube: { kind: 'service', name: 'YouTube', site: 'app/fav-youtube.com.png', mark: 'www.youtube.com' },
};
const pillText = (id, landed) => {
  const w = WHO[id];
  if (w.kind === 'service') return `${landed ? 'Connected' : 'Connecting'} to ${w.name}`;
  return `${landed ? 'Switched' : 'Switching'} to ${w.name}`;
};

// the turn head's live status line, phase by phase (the app's status swap names what the turn is doing)
const STATUS = [
  [0, 'Thinking'],
  [B.deepseek.reply, 'Reading 1,284 comments'],
  [B.deepseek.back + 2.4, 'Searching the web'],
  [B.deepseek.back + 3.65, 'Writing the answer'],
  [B.blender.reply, 'Building the scene in Blender'],
  [B.eleven.reply, 'Voicing the answer'],
  [B.opus.reply, 'Writing the Short in Remotion'],
  [B.nano.reply, 'Making the thumbnail'],
  [B.youtube.reply, 'Posting to YouTube'],
];

export function buildThread(doc, tpl) {
  const q = (s, r = doc) => r.querySelector(s);
  const feed = q('.hub-feed');
  // keep the sticky prompt and the date divider; drop the captured rows and the turn chrome after them
  const divider = q('[data-slot=date-divider]', feed);
  for (const n of [...feed.children]) if (n !== divider && n.dataset.slot !== 'sticky-prompt') n.remove();
  const sticky = q('[data-slot=sticky-prompt-text]', feed);
  const stickyRow = q('[data-slot=sticky-prompt]', feed);
  if (sticky) sticky.textContent = ASK;
  divider.querySelectorAll('span').forEach((s) => { if (/2026/.test(s.textContent)) s.textContent = 'Monday, Oct 5, 2026, 7:42 PM CDT'; });

  const grow = (node, parent = feed) => {
    const wrap = doc.createElement('div');
    wrap.className = 'adg';
    wrap.appendChild(node);
    parent.appendChild(wrap);
    return wrap;
  };

  // ---- the ask
  const user = tpl.userRow.cloneNode(true);
  q('[data-slot=markdown-para] span', user).textContent = ASK;
  const time = q('[data-slot=message-row-time]', user);
  if (time) time.textContent = 'Today at 7:42 PM';
  const userW = grow(user);
  userW.dataset.t0 = String(T.send);

  // ---- the working turn (live head) and its prose body
  const turn = tpl.workingRow.cloneNode(true);
  const prose = q('[data-slot=message-row-prose]', turn);
  prose.innerHTML = '';
  const body = doc.createElement('div');
  body.className = 'flex flex-col gap-8';
  body.setAttribute('data-answer-body', '');
  prose.appendChild(body);
  const turnW = grow(turn);
  turnW.dataset.t0 = String(T.send + 0.3);
  const swapLine = q('[data-slot=thinking-line-text]', turn);
  const clocks = [...turn.querySelectorAll('.sb-sonar-clock-digits')];
  const head = q('[data-slot=message-row-turn-head]', turn);
  const settledHead = tpl.settledHead.cloneNode(true);
  settledHead.style.display = 'none';
  head.after(settledHead);
  const settledClock = q('.turn-head-meta', settledHead);
  // the sidebar row of this chat carries the same live clock
  const sideClock = (() => {
    const w = doc.createTreeWalker(doc.querySelector('.hub-sidebar') || doc.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) if (/^\d+s$/.test(w.currentNode.textContent.trim())) return w.currentNode;
    return null;
  })();

  const parts = [];      // { wrap, at }
  let cur = body;        // the hand-off whose output is being built: its block and everything it answers with
  const add = (node, at, parent = cur) => { const wrap = grow(node, parent); wrap.dataset.t0 = String(at); parts.push({ wrap, at }); return node; };
  const el = (html) => { const t = doc.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

  // ---- one hand-off block per beat
  const blocks = {};
  for (const id of Object.keys(WHO)) {
    const w = WHO[id];
    const k = B[id];
    const src = w.kind === 'service' ? tpl.serviceSwitch : tpl.modelSwitch;
    const blk = src.cloneNode(true);
    blk.querySelectorAll('[data-slot=media-pending], [data-slot=provider-switch-steps]').forEach((n) => n.remove());
    const pill = q('[data-slot=provider-switch-pill]', blk);
    const ink = q('.sb-switch-ink', pill);
    const tileHtml = w.kind === 'service'
      ? `<span aria-hidden="true" data-slot="provider-switch-tile" data-mark-source="site" data-mark="${w.mark}" class="flex shrink-0 items-center justify-center p-2 sb-switch-tile size-(--spacing-20) overflow-hidden rounded-8" style="background: var(--color-brand-tile); color: var(--color-brand-tile-ink);"><img data-slot="provider-switch-site-favicon" alt="" decoding="sync" class="block size-full object-contain" src="${w.site}"></span>`
      : `<img aria-hidden="true" data-slot="provider-switch-tile" data-mark-source="tile" data-provider-tile="${w.key}" alt="" draggable="false" decoding="sync" class="block shrink-0 object-cover sb-switch-tile size-(--spacing-20) overflow-hidden rounded-8" src="${w.tile}">`;
    q('[data-slot=provider-switch-tile]', pill).replaceWith(el(tileHtml));
    pill.dataset.kind = w.kind;
    const who = q('[data-slot=provider-switch-who]', blk);
    const whoTile = w.kind === 'service'
      ? `<span aria-hidden="true" data-slot="provider-switch-who-tile" data-mark-source="site" data-mark="${w.mark}" class="flex shrink-0 items-center justify-center p-2 size-(--spacing-20) overflow-hidden rounded-8" style="background: var(--color-brand-tile); color: var(--color-brand-tile-ink);"><img data-slot="provider-switch-site-favicon" alt="" decoding="sync" class="block size-full object-contain" src="${w.site}"></span>`
      : `<img aria-hidden="true" data-slot="provider-switch-who-tile" data-mark-source="tile" data-provider-tile="${w.key}" alt="" draggable="false" decoding="sync" class="block shrink-0 object-cover size-(--spacing-20) overflow-hidden rounded-8" src="${w.tile}">`;
    q('[data-slot=provider-switch-who-tile]', who).replaceWith(el(whoTile));
    q('.text-body.font-semibold', who).textContent = w.name;
    const nest = q('[data-slot=provider-switch-nest]', blk);
    const steps = w.kind === 'service' ? el('<ol data-slot="provider-switch-steps" aria-live="polite" class="flex min-w-0 max-w-full flex-col gap-4"></ol>') : null;
    if (steps) nest.appendChild(steps);
    const box = doc.createElement('div');
    box.className = 'flex flex-col gap-8';
    body.appendChild(box);
    add(blk, k.sw, box);
    blocks[id] = { blk, pill, ink, who, nest, steps, k, stepRows: [], box };
  }

  // a service step (check when done, spinner while running)
  const stepRow = (id, label, from, to) => {
    const b = blocks[id];
    const li = tpl.serviceStep.cloneNode(true);
    q('[data-slot=provider-switch-step-label]', li).textContent = label;
    b.steps.appendChild(li);
    const row = { li, from, to };
    b.stepRows.push(row);
    return row;
  };
  // a tool line in the sonar feed ("Searched x", "Read host +7 · Read 8 pages")
  const sonars = [];
  const sonar = (at, parent = cur) => {
    const s = tpl.sonar.cloneNode(true);
    const ul = q('.sb-sonar-feed', s);
    ul.innerHTML = '';
    add(s, at, parent);
    const fe = { s, ul, lines: [] };
    sonars.push(fe);
    return fe;
  };
  const sonarLine = (fe, verb, target, result, from, to) => {
    const li = tpl.sonarStep.cloneNode(true);
    q('.sb-line-verb', li).textContent = verb;
    q('.sb-line-target', li).textContent = target;
    const words = q('.sb-line-words', li);
    q('.sb-line-result', li)?.remove();
    if (result) words.after(el(`<span class="sb-line-result"> · ${result}</span>`));
    fe.ul.appendChild(li);
    fe.lines.push({ li, from, to });
  };
  const para = (text, at, parent = cur) => {
    const p = tpl.para.cloneNode(true);
    p.innerHTML = `<span>${text}</span>`;
    return add(p, at, parent);
  };
  const lead = (text, at) => {
    const p = tpl.lead.cloneNode(true);
    p.innerHTML = `<span>${text}</span>`;
    return add(p, at);
  };
  const link = (href, fav, text) => {
    const a = tpl.link.cloneNode(true);
    a.setAttribute('href', href);
    a.innerHTML = `<img data-slot="link-favicon" alt="" aria-hidden="true" decoding="async" referrerpolicy="no-referrer" class="mr-4 inline-block size-(--spacing-16) shrink-0 rounded-8 object-cover align-[-0.125em]" src="${fav}">${text}`;
    return `<span class="relative contents">${a.outerHTML}</span>`;
  };

  // ================= 1. DeepSeek V4 Pro: scrape the comments, search the web, answer with sources
  {
    const k = B.deepseek;
    cur = blocks.deepseek.box;
    const fe = sonar(k.back + 0.05);
    sonarLine(fe, 'Read', 'youtube.com', '1,284 comments', k.back + 0.05, k.back + 2.3);
    sonarLine(fe, 'Searched', 'shock mount desk thump boom arm', null, k.back + 2.4, k.back + 2.9);
    sonarLine(fe, 'Read', 'ulanzi.com +7', 'Read 8 pages', k.back + 3.0, k.back + 3.6);
    blocks.deepseek.lead = lead('63 of your 1,284 comments ask one thing: does a shock mount stop desk thumps?', k.back + 3.7);
    para('It stops the bumps, not the clicks:', k.back + 3.85);
    const ol = tpl.list.cloneNode(true);
    ol.innerHTML = [
      ['A knock travels desk, clamp, arm, shock mount, then capsule', 'https://www.ulanzi.com/blogs/knowledges/stop-desk-thumping-boom-arm-microphone', 'app/fav-ulanzi.com.png', 'ulanzi.com'],
      ['Most of that energy is low, so it lands as a thump', 'https://www.studiorescue.net/blog/how-to-stop-mic-bumps-and-handling-noise-in-reaper/', 'app/fav-studiorescue.net.png', 'studiorescue.net'],
      ['The mount must resonate far lower: about 2 to 3 Hz for a 100 to 200 g mic', 'https://www.ulanzi.com/blogs/knowledges/vlogging-mic-vibration-damping-weight-guide', 'app/fav-ulanzi.com.png', 'ulanzi.com'],
      ['It only stops vibration; key clicks reach the mic as sound in the air', 'https://www.dpamicrophones.com/mic-university/technology/measuring-how-vibrations-affect-microphones/', 'app/fav-dpamicrophones.com.png', 'dpamicrophones.com'],
      ['High-pass what is left, starting around 80 to 120 Hz', 'https://www.studiorescue.net/blog/how-to-stop-mic-bumps-and-handling-noise-in-reaper/', 'app/fav-studiorescue.net.png', 'studiorescue.net'],
    ].map(([t, href, fav, host]) => `<li class="text-body text-fg">${link(href, fav, t)}<span> · ${host}</span></li>`).join('');
    blocks.deepseek.list = add(ol, k.back + 4.0);
    para('Script for the Short:', k.back + 4.6);
    blocks.deepseek.script = para('“Desk bumps travel through the clamp and boom arm straight into the mic, producing a low thump. A shock mount absorbs those vibrations if it’s soft enough for your mic’s weight, but it won’t silence the acoustic click of your keys. Add a high-pass filter at 100 Hz and move the keyboard away from the mic.”', k.back + 4.75);
  }

  // ================= 2. Blender: model, animate and render the answer in 3D (on this Mac)
  {
    const k = B.blender;
    cur = blocks.blender.box;
    stepRow('blender', 'Opened shockmount.blend', k.back + 0.0, k.back + 0.3);
    stepRow('blender', 'Modeled the desk, boom arm, shock mount and mic', k.back + 0.3, k.back + 0.9);
    stepRow('blender', 'Keyed 3 desk knocks and 5 key taps', k.back + 0.9, k.back + 1.4);
    stepRow('blender', 'Rendered 630 frames at 1080 × 1920 in EEVEE', k.back + 1.4, k.back + 4.1);
    blocks.blender.video = add(mediaEmbed(el, 'app/fav-blender.svg', 'Blender 5.2', '0:21', 'shockmount', 'site'), k.back + 4.3);
  }

  // ================= 3. ElevenLabs v3: voice the answer (one AudioRow), timed word by word
  {
    const k = B.eleven;
    cur = blocks.eleven.box;
    const row = el(`<div data-testid="embed-media" data-slot="embed-media" data-media="audio" class="w-full max-w-(--size-answer-image)">
      <div data-slot="audio-row" data-state="paused" class="flex w-full min-w-0 items-center gap-12 rounded-8 border border-line bg-raised px-12 py-8">
        <button type="button" data-slot="audio-row-play" aria-label="Play Voiceover" class="focus-ring flex size-(--size-send) shrink-0 cursor-pointer items-center justify-center rounded-pill bg-accent text-accent-ink">${svg('play', 'size-(--spacing-12)', 24).replace('fill="none"', 'fill="currentColor"')}</button>
        <span class="flex min-w-0 flex-1 flex-col">
          <span data-slot="audio-row-title" class="truncate text-body text-fg">Voiceover</span>
          <span class="flex min-w-0 items-center gap-4"><span data-slot="audio-row-mark" data-mark="elevenlabs" class="flex shrink-0"><img alt="" class="size-(--spacing-12) rounded-pill block" src="app/tile-elevenlabs.svg"></span><span data-slot="audio-row-source" class="truncate font-mono text-caption text-muted">Eleven v3</span></span>
        </span>
        <span data-slot="audio-row-wave" data-state="ready" aria-hidden="true" class="relative h-(--spacing-24) min-w-0 flex-1 overflow-hidden">
          <span class="flex size-full items-center justify-between gap-(--spacing-2)">${PEAKS48.map((p) => `<span data-slot="audio-row-bar" class="min-h-(--spacing-2) flex-1 rounded-pill bg-line-strong" style="height:${(p * 100).toFixed(1)}%"></span>`).join('')}</span>
          <span data-slot="audio-row-played" class="absolute inset-0 overflow-hidden" style="transform: translateX(-100%)"><span class="absolute inset-0" style="transform: translateX(100%)"><span class="flex size-full items-center justify-between gap-(--spacing-2)">${PEAKS48.map((p) => `<span data-slot="audio-row-bar" class="min-h-(--spacing-2) flex-1 rounded-pill bg-accent" style="height:${(p * 100).toFixed(1)}%"></span>`).join('')}</span></span></span>
        </span>
        <span data-slot="audio-row-duration" class="shrink-0 font-mono text-caption text-muted tabular-nums">0:18</span>
      </div></div>`);
    const fe = sonar(k.back + 0.05);
    sonarLine(fe, 'Voiced', 'DeepSeek’s script', '0:18', k.back + 0.05, k.back + 0.6);
    add(row, k.back + 0.65);
    const fe2 = sonar(k.back + 1.0);
    sonarLine(fe2, 'Timed', '56 words with Scribe v2', null, k.back + 1.0, k.back + 1.6);
    blocks.eleven.audio = row;
  }

  // ================= 4. Claude Opus 5.5: the Short as Remotion code, previewed in Studio, rendered
  {
    const k = B.opus;
    cur = blocks.opus.box;
    const fe = sonar(k.back + 0.05);
    sonarLine(fe, 'Wrote', CODE_FILE, null, k.back + 0.05, k.back + 1.0);
    const code = el(`<div data-slot="code-block" data-lang="tsx" class="max-w-full overflow-hidden rounded-8 border border-line bg-raised">
      <div data-slot="code-block-head" class="flex items-center gap-8 border-b border-line px-8 py-4">
        <span class="min-w-0 truncate whitespace-nowrap font-mono text-caption text-muted">tsx · ${CODE_LINES} lines</span>
        <span class="ml-auto flex items-center gap-4"><span class="ad-chip">${svg('copy', 'size-(--spacing-12)', 24)}Copy</span><span class="ad-chip">${svg('download', 'size-(--spacing-12)', 24)}Download</span></span>
      </div>
      <pre data-slot="code-block-body" data-overflow="true" class="overflow-x-auto p-8 font-mono text-code text-fg max-h-(--size-code-body-max) overflow-y-auto"><code></code></pre>
      <button type="button" data-slot="code-block-fold" class="flex w-full items-center gap-8 border-t border-line px-8 py-4 text-left text-caption text-muted">${svg('chevron', 'code-block-fold-chevron', 16)}<span class="whitespace-nowrap">Show all ${CODE_LINES} lines</span><span class="ml-auto whitespace-nowrap font-mono text-muted">+${CODE_LINES - 20} more lines</span></button>
    </div>`);
    add(code, k.back + 0.1);
    const fe2 = sonar(k.back + 1.9);
    sonarLine(fe2, 'Ran', 'npx remotion studio', null, k.back + 1.9, k.back + 2.2);
    sonarLine(fe2, 'Rendered', 'short-reply.mp4', '630 frames', k.back + 4.2, k.back + 4.9);
    blocks.opus.code = { node: code, pre: q('pre code', code), body: q('pre', code), fold: q('[data-slot=code-block-fold]', code), from: k.back + 0.1, to: k.back + 1.0, n: -1 };
    blocks.opus.video = add(mediaEmbed(el, null, 'short-reply.mp4', '0:21', 'short', 'generic'), k.back + 5.0);
  }

  // ================= 5. Nano Banana Pro: the Short's custom thumbnail, from a Blender frame
  {
    const k = B.nano;
    cur = blocks.nano.box;
    blocks.nano.lead = lead('Thumbnail from frame 226 of the render:', k.back + 0.05);
    const frame = tpl.imageFrame.cloneNode(true);
    const img = q('img', frame);
    img.setAttribute('src', 'media/thumb.jpg');
    img.setAttribute('alt', 'Does a shock mount work? thumbnail');
    img.classList.add('ad-thumb');
    q('[data-slot=image-card-provenance] [data-slot=markdown-inline] span', frame).textContent = 'via Gemini 3 Pro Image';
    blocks.nano.image = add(frame, k.back + 0.3);
  }

  // ================= 6. YouTube: post it as the creator, reply, pin
  {
    const k = B.youtube;
    cur = blocks.youtube.box;
    stepRow('youtube', 'Uploaded the Short', k.back + 0.0, k.back + 0.7);
    stepRow('youtube', 'Set the custom thumbnail', k.back + 0.7, k.back + 1.1);
    stepRow('youtube', 'Replied to @priyanair with it', k.back + 1.1, k.back + 1.6);
    stepRow('youtube', 'Pinned a comment that links it', k.back + 1.6, k.back + 2.0);
    para('It’s live. Priya has her answer, and the pinned comment sends the 62 others who asked to the Short.', k.back + 4.3);
  }

  const foot = tpl.turnFoot.cloneNode(true);
  const footBtn = q('[data-slot=reply-footer-outcome]', foot);
  footBtn.textContent = '14 steps';
  footBtn.setAttribute('aria-label', '14 steps');
  const END = B.youtube.back + 4.8;
  const footW = grow(foot);

  // ---------------------------------------------------------------- render
  const show = (wrap, at, t, dy = 8) => {
    const p = outCubic(seg(t, at, at + 0.32));
    if (p <= 0) { wrap.style.display = 'none'; return 0; }
    wrap.style.display = '';
    const inner = wrap.firstElementChild;
    if (p >= 1) { wrap.style.height = ''; wrap.style.overflow = ''; inner.style.opacity = ''; inner.style.transform = ''; return 1; }
    wrap.style.overflow = 'hidden';
    wrap.style.height = (inner.offsetHeight * p).toFixed(2) + 'px';
    inner.style.opacity = p.toFixed(3);
    inner.style.transform = `translateY(${((1 - p) * dy).toFixed(2)}px)`;
    return p;
  };
  const glyph = (li, running) => {
    const g = q('[data-slot=provider-switch-step-glyph]', li);
    const want = running ? 'spinner' : 'check';
    if (g.dataset.glyph !== want) {
      g.dataset.glyph = want;
      g.innerHTML = running ? svg('loader', 'sb-switch-spin size-(--spacing-12)') : svg('check', 'sb-switch-step-check size-(--spacing-12)');
    }
    li.dataset.state = running ? 'running' : 'done';
    if (running) li.setAttribute('aria-busy', 'true'); else li.removeAttribute('aria-busy');
    q('[data-slot=provider-switch-step-label]', li).className = `min-w-0 truncate ${running ? 'text-fg' : 'text-muted'}`;
  };
  const lineState = (li, running) => {
    const line = q('.sb-line', li);
    const want = running ? 'running' : 'done';
    if (li.dataset.state === want) return;
    li.dataset.state = want;
    line.dataset.state = want;
    q('.sb-line-mark', li).innerHTML = running ? '<span class="sb-line-dot"></span>' : svg('check', 'sb-line-check');
    const verb = q('.sb-line-verb', li);
    const map = { Read: 'Reading', Searched: 'Searching', Voiced: 'Voicing', Timed: 'Timing', Wrote: 'Writing', Ran: 'Running' };
    if (!li.__verb) li.__verb = verb.textContent;
    verb.textContent = running ? (map[li.__verb] || li.__verb) : li.__verb;
  };

  return {
    feed, turn, blocks,
    nodes: { user, turn },
    render(t) {
      show(userW, T.send, t, 10);
      show(turnW, T.send + 0.3, t, 10);
      // the live head: status swap + the clock; then the settled head once the turn is done
      let status = 'Thinking';
      for (const [a, s] of STATUS) if (t >= a) status = s;
      if (swapLine && swapLine.textContent !== status) { swapLine.textContent = status; swapLine.dataset.text = status; }
      const secs = Math.max(1, Math.floor(t - T.send + 1));
      const digits = `${secs}s`;
      clocks.forEach((c) => { if (c.textContent !== digits) { c.textContent = digits; c.style.setProperty('--sb-clock-chars', String(digits.length)); } });
      if (sideClock) sideClock.textContent = t >= END ? '' : digits;
      const settled = t >= END;
      head.style.display = settled ? 'none' : '';
      settledHead.style.display = settled ? '' : 'none';
      if (settled && settledClock) settledClock.innerHTML = `<span class="turn-head-sep"> · </span>${Math.floor(END - T.send + 1)}s`;
      turn.dataset.turnPhase = settled ? 'answer' : 'working';
      show(footW, END, t, 4);

      for (const id of Object.keys(blocks)) {
        const b = blocks[id];
        const landed = t >= b.k.done;
        b.pill.dataset.state = t >= b.k.end ? 'done' : landed ? 'live' : 'switching';
        b.pill.dataset.t0 = String(landed ? b.k.done : b.k.sw);
        if (landed) b.pill.dataset.check = 'true'; else b.pill.removeAttribute('data-check');
        const label = pillText(id, landed);
        if (b.ink.textContent !== label) b.ink.textContent = label;
        const wp = outCubic(seg(t, b.k.reply, b.k.reply + 0.3));
        b.nest.style.display = wp > 0 ? '' : 'none';
        b.nest.style.opacity = wp.toFixed(3);
        for (const r of b.stepRows) {
          r.li.style.display = t >= r.from ? '' : 'none';
          if (t >= r.from) { glyph(r.li, t < r.to); r.li.dataset.t0 = String(t < r.to ? r.from : r.to); }
        }
      }
      // the fence streams in while Opus writes it (the body pinned to its newest line), then settles folded at
      // --size-code-fold-lines (20) with the app's "Show all N lines" control
      const c = blocks.opus.code;
      if (c) {
        const writing = t < c.to;
        const n = writing ? Math.max(1, Math.round(LINES.length * seg(t, c.from, c.to))) : 20;
        if (n !== c.n) {
          c.pre.innerHTML = LINES.slice(0, n).join('\n');
          c.n = n;
        }
        c.fold.style.display = writing ? 'none' : '';
        c.body.style.maxHeight = writing ? '' : 'none';
        c.body.scrollTop = writing ? c.body.scrollHeight : 0;
      }
      for (const p of parts) show(p.wrap, p.at, t);
      // tool lines: hidden until their call starts, a running dot until it returns
      for (const fe of sonars) for (const l of fe.lines) {
        l.li.style.display = t >= l.from ? '' : 'none';
        if (t >= l.from) { lineState(l.li, t < l.to); l.li.dataset.t0 = String(t < l.to ? l.from : l.to); }
      }
      // the audio row plays from when it lands: the accent share and the mono clock follow the voice
      const a = blocks.eleven.audio;
      if (a) {
        const t0 = B.eleven.back + 0.95, dur = 18.53;
        const e = clamp(t - t0, 0, dur);
        const p = e / dur;
        const row = q('[data-slot=audio-row]', a);
        const playing = t >= t0 && t < t0 + dur;
        row.dataset.state = playing ? 'playing' : 'paused';
        const clip = q('[data-slot=audio-row-played]', a);
        clip.style.transform = `translateX(${(-100 + p * 100).toFixed(2)}%)`;
        clip.firstElementChild.style.transform = `translateX(${(100 - p * 100).toFixed(2)}%)`;
        const clockEl = q('[data-slot=audio-row-duration]', a);
        const s = Math.floor(e);
        clockEl.textContent = t >= t0 ? `0:${String(s).padStart(2, '0')}` : '0:18';
        const play = q('[data-slot=audio-row-play]', a);
        const want = playing ? 'pause' : 'play';
        if (play.dataset.icon !== want) {
          play.dataset.icon = want;
          play.innerHTML = playing
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pause size-(--spacing-12)" aria-hidden="true"><rect x="14" y="3" width="5" height="18" rx="1"></rect><rect x="5" y="3" width="5" height="18" rx="1"></rect></svg>'
            : svg('play', 'size-(--spacing-12)', 24).replace('fill="none"', 'fill="currentColor"');
        }
      }
      // the feed stays pinned to its newest line, the way the app follows a streaming turn
      feed.scrollTop = feed.scrollHeight - feed.clientHeight;
      // the sticky prompt only shows once the ask has scrolled out of view
      if (stickyRow) {
        const fr = feed.getBoundingClientRect(), ur = user.getBoundingClientRect();
        stickyRow.style.visibility = ur.height && ur.bottom < fr.top + 4 ? '' : 'hidden';
      }
    },
  };

  function mediaEmbed(make, markSrc, label, meta, kind, markKind) {
    const mark = markKind === 'generic'
      ? `<span class="flex items-center justify-center size-(--size-favicon) rounded-8 bg-raised text-fg-secondary">${svg('film', 'size-(--spacing-12)', 24)}</span>`
      : `<span class="flex items-center justify-center p-2 size-(--size-favicon) rounded-8 overflow-hidden" style="background: var(--color-brand-tile)"><img alt="" class="block size-full object-contain" src="${markSrc}"></span>`;
    return make(`<figure data-testid="embed-media" data-slot="embed-media" data-media="video" class="m-0 flex w-full max-w-(--size-answer-image) flex-col gap-8">
      <div data-slot="embed-media-header" class="flex min-w-0 items-center gap-8 text-caption"><span data-slot="embed-media-mark" data-mark="${markKind}" class="flex shrink-0">${mark}</span><span data-slot="embed-media-model" class="min-w-0 truncate text-fg-secondary">${label}</span><span data-slot="embed-media-duration" class="shrink-0 font-mono text-muted tabular-nums">${meta}</span></div>
      <div data-slot="embed-media-surface" data-state="ready" role="group" class="group/media relative max-h-(--size-answer-media-max-h) overflow-hidden rounded-16 border border-line bg-card ad-portrait" data-video="${kind}"></div>
    </figure>`);
  }
}

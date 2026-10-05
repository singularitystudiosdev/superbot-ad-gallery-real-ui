// pf-markup: the thread's DOM in superbot-desktop main's own anatomy. The turn's switches are ONE
// ProviderSwitchBlock (provider-switch.tsx:739, :885-940): each switch's pill, then its nest (the who header
// only on the latest switch, the steps), then the live MediaPending surfaces last; the page shots and the
// answer (the media cards, the step rows, the lead, the body, the film) sit under the block. pf-chat toggles
// which parts are drawn at t (structure) and moves the rest with opacity / transform only.
import { ASK, SAY, BODY, MEDIA, TILE, SITE, SWITCHES, PENDING, SCORE, CODE } from './pf-plan.f108143e.js';

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const SVG = (cls, d, fill = 'none') => `<svg class="${cls}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const D = {                                   // lucide: loader-circle, check, play
  spin: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
};
const SPIN = SVG('hwc-spin', D.spin), CHECK = SVG('hwc-check', D.check);

// a switch tile (switch-mark.tsx): a tile file, or the site's favicon contained on the neutral ground
export function tile(key, cls) {
  const t = TILE[key];
  if (t.site) return `<span class="${cls} pfc-site"><img src="${t.site}" alt="" draggable="false"/></span>`;
  return `<img class="${cls}" src="${t.img}" width="128" height="128" alt="" draggable="false" decoding="async"/>`;
}

// ProviderSwitchPill + ProviderSwitchNest (the who header, then ProviderSwitchStepRow per step)
const pill = (key, ink) => `<span class="hwc-pill">${tile(key, 'hwc-pill-tile')}<span class="hwc-pill-label"><span class="hwc-sweep"><span class="hwc-mask"><span class="hwc-ink">${esc(ink)}</span></span></span></span><span class="hwc-status">${SPIN}${CHECK}</span></span>`;
const step = ([run, , detail]) => `<li class="hwc-step" data-state="running"><span class="hwc-step-g">${SPIN}${CHECK}</span>` +
  `<span class="hwc-step-x"><span class="hwc-step-l">${esc(run)}</span>${detail ? `<span class="hwc-step-d">${esc(detail)}</span>` : ''}</span></li>`;
const who = (key, name) => `<div class="hwc-who">${tile(key, 'hwc-who-tile')}<span class="hwc-who-name">${esc(name)}</span><span class="hwc-who-sub">in superbot</span></div>`;
const sw = (k, key, ink, name, steps = []) => `<div class="pfc-sw" data-k="${k}">${pill(key, ink)}` +
  `<div class="hwc-nest">${who(key, name)}${steps.length ? `<ol class="hwc-steps">${steps.map(step).join('')}</ol>` : ''}</div></div>`;

// MediaPending (embeds/media-pending.tsx): the reserved box breathing --color-raised, the header naming the work
const pendHead = (key, task) => `<span class="pfc-ph">${tile(key, 'pfc-ph-tile')}<span class="pfc-ph-l">${PENDING[task]}</span><span class="pfc-ph-clock">0:00</span></span>`;
const pending = (d) => d.task === 'audio'
  ? `<div class="pfc-apend" data-k="${d.key}"><span class="pfc-abreath"></span><span class="pfc-acol">${pendHead(d.tile, 'audio')}<span class="pfc-abar"></span></span></div>`
  : `<div class="pfc-pend" data-k="${d.key}" data-task="${d.task}"><span class="pfc-breath"></span>${pendHead(d.tile, d.task)}</div>`;

// TurnShots (hub/turn-shots): one shot = the mini window, two or more = the fanned deck, one fixed slot
const shots = () => `<div class="pfc-shots" data-form="window" data-nested="true">
  <span class="pfc-win"><span class="pfc-win-bar"><i></i><i></i><i></i><span class="pfc-win-addr">${SITE.host}</span></span><img class="pfc-win-page" src="${MEDIA.shots[0]}" alt=""/></span>
  <span class="pfc-deck"><span class="pfc-stack">${MEDIA.shots.map((s, i) => `<span class="pfc-card" data-i="${i}"><img src="${s}" alt=""/></span>`).reverse().join('')}</span>
    <span class="pfc-src">${tile('pocketsflow', 'pfc-src-fav')}<span class="pfc-src-host">${SITE.host}</span></span></span>
</div>`;

// MediaEmbed (embeds/media-embed.tsx): the header outside the surface; AudioRow (embeds/audio-row.tsx) for sound
const mediaHead = (key, label, meta) => `<div class="pfc-head">${tile(key, 'pfc-head-tile')}<span class="pfc-head-l">${esc(label)}</span>${meta ? `<span class="pfc-head-m">${meta}</span>` : ''}</div>`;
const WAVE = Array.from({ length: 48 }, (_, i) => {   // a music bed's 48-bar envelope: soft intro, the drop, a breath
  const env = i < 12 ? 0.3 + i * 0.04 : i > 28 && i < 33 ? 0.45 : 0.9;
  return Math.max(0.18, Math.min(1, env * (0.62 + 0.38 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45))))).toFixed(2);
});
function card(d) {
  if (d.task === 'audio') {
    return `<div class="pfc-audio" data-k="${d.key}"><div class="pfc-arow"><span class="pfc-play">${SVG('pfc-play-ic', D.play, 'currentColor')}</span>
    <span class="pfc-atext"><span class="pfc-atitle">${esc(SCORE.title)}</span><span class="pfc-asrc">${tile(d.tile, 'pfc-asrc-tile')}<span>${esc(SCORE.source)}</span></span></span>
    <span class="pfc-wave"><span class="pfc-bars">${WAVE.map((h) => `<i style="--h:${h}"></i>`).join('')}</span></span>
    <span class="pfc-adur">0:${String(SCORE.len).padStart(2, '0')}</span></div></div>`;
  }
  const surface = d.task === 'model3d'
    ? `<div class="pfc-surface pfc-3d"><div class="pfc-3d-canvas"></div><div class="pfc-3d-foot"></div></div>`
    : `<div class="pfc-surface pfc-vid"><video class="pfc-video" muted playsinline preload="auto" poster="${MEDIA.h3.poster}" src="${MEDIA.h3.src}"></video></div>`;
  return `<figure class="pfc-fig" data-k="${d.key}" data-task="${d.task}">${mediaHead(d.tile, d.label, d.task === 'video' ? '0:05' : '')}${surface}</figure>`;
}

// StepLine (hub/step-line.tsx): the mark (a breathing accent dot running, a muted Check done), the verb in fg,
// the target muted, both regular weight; outside Developer Mode no args and no clock (StepList.tsx:1258, :1416)
const codeRow = ([run, , target]) => `<li class="pfc-step" data-status="running"><span class="pfc-mark"><i class="pfc-dot"></i>${SVG('pfc-check', D.check)}</span>` +
  `<span class="pfc-words"><span class="pfc-verb">${run}</span> <span class="pfc-target">${esc(target)}</span></span></li>`;

export function threadMarkup(dateLabel) {
  return `<div class="hwc-in">
  <div class="hwc-date" role="separator"><span class="hwc-date-line"></span><span class="hwc-date-chip">${dateLabel}</span><span class="hwc-date-line"></span></div>
  <div class="hwc-row hwc-user" data-variant="bubble"><span class="hwc-bubble"><p class="hwc-p">${esc(ASK)}</p></span></div>
  <div class="pfc-attach"><span class="pfc-thumb"><img src="${MEDIA.mascot.src}" width="${MEDIA.mascot.w}" height="${MEDIA.mascot.h}" alt="${MEDIA.mascot.name}"/></span></div>
  <div class="hwc-row hwc-bot" data-variant="prose"><div class="hwc-prose">
    <div class="hwc-think" role="status"><span class="hwc-sonar-label"></span></div>
    <div class="hwc-sw pfc-block">
      ${sw('site', SITE.tile, `Connecting to ${SITE.name}`, SITE.name, SITE.steps)}
      ${SWITCHES.map((d) => sw(d.key, d.tile, `Switching to ${d.label}`, d.label)).join('\n      ')}
      ${SWITCHES.map(pending).join('\n      ')}
    </div>
    ${shots()}
    ${SWITCHES.map(card).join('\n    ')}
    <ol class="pfc-steps">${CODE.steps.map(codeRow).join('')}</ol>
    <p class="hwc-say"><span class="hwc-say-vis"></span><span class="hwc-caret"></span><span class="hwc-say-hid">${esc(SAY)}</span></p>
    <p class="pfc-body">${esc(BODY)}</p>
    <figure class="pfc-fig pfc-film" data-task="video">${mediaHead('generic', MEDIA.film.name, '0:15')}
      <div class="pfc-surface pfc-vid"><video class="pfc-video" muted playsinline preload="auto" poster="${MEDIA.film.poster}" src="${MEDIA.film.src}"></video></div></figure>
  </div></div>
</div>`;
}

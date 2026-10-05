// superbot's own surfaces: the home composer, the ask, the routing card, switch pills,
// the Strava hand-off note and the closing line.
import { T, E, seg, lerp, css, show, rise, typeText, el, $, tile, spinner, check } from './core.a6734000.js'

export const ASK = 'Build me a 12-week half marathon plan and sync it to my Strava'

const ROUTES = [
  ['ds', 'DeepSeek V4', 'Search the web and scrape every published plan'],
  ['gm', 'Gemini 3.1 Pro', 'Read the plans that only exist as images'],
  ['op', 'Claude Opus 5.5', 'Code the plan and build a page for it'],
  ['sb', 'superbot', 'Save each long run as a Strava route, in the browser'],
]

const SWITCHES = [
  ['b-sw1', 'ds', 'DeepSeek V4', 'search + scrape', T.sw1],
  ['b-sw2', 'gm', 'Gemini 3.1 Pro', 'images', T.sw2],
  ['b-sw3', 'op', 'Claude Opus 5.5', 'code + frontend', T.sw3],
]

const SB2 = "Strava can't import planned workouts, so each long run goes in as a route with that week's runs in its description."

export function buildAsk() {
  return el(`<div class="blk" id="b-ask"><div class="ask">${ASK}</div></div>`)
}

export function buildRoute() {
  const rows = ROUTES.map(
    ([k, name, job], i) =>
      `<div class="rt-row" data-i="${i}"><span class="rt-n">${i + 1}</span>${tile(k)}<span class="rt-tx"><b>${name}</b><span class="rt-job">${job}</span></span></div>`,
  ).join('')
  return el(`<div class="blk" id="b-route">
    <div class="ahead">${tile('sb')}<b>superbot</b><span class="st">planned 4 steps</span></div>
    <p class="say">Each step goes to the model that's best at it.</p>
    <div class="rt">${rows}</div>
  </div>`)
}

export function buildSwitch(i) {
  const [id, k, name, why] = SWITCHES[i]
  return el(`<div class="blk sw" id="${id}">
    <div class="swpill">${tile(k)}<span class="sw-t">Switching to <b>${name}</b></span><span class="sw-why">${why}</span><span class="sw-r">${spinner()}${check()}</span></div>
  </div>`)
}

export function buildSb2() {
  return el(`<div class="blk" id="b-sb2">
    <div class="ahead">${tile('sb')}<b>superbot</b></div>
    <p class="say"><span class="sb2-typed"></span><span class="sb2-ghost">${SB2}</span></p>
    <div class="tool">${tile('sv')}<span class="tool-l">Connecting to Strava</span><span class="tool-d">strava.com</span><span class="sw-r">${spinner()}${check()}</span></div>
  </div>`)
}

export function buildFin() {
  return el(`<div class="blk" id="b-fin"><div class="fin">${check()}<span>Saved <b>12 routes</b> to your Strava, <b>48 runs</b> in their descriptions. Race day is <b>Sun, Dec 27</b>.</span></div></div>`)
}

// Spinner turns, then the check pops in at `done`.
export function spinDone(root, t, a, done) {
  const sp = $('.spin', root)
  const ok = $('.ok', root)
  const d = E.outBack(seg(t, done, done + 0.35))
  if (sp) css(sp, 'transform', `rotate(${(Math.max(0, t - a) * 420) % 360}deg) scale(${(1 - E.out(seg(t, done, done + 0.2))).toFixed(3)})`)
  css(ok, 'transform', `scale(${d.toFixed(3)})`)
  show(ok, seg(t, done, done + 0.12))
}

function animSwitch(t, i) {
  const [id, , , , a] = SWITCHES[i]
  const root = $('#' + id)
  rise(root, t, a, 0.5, 10, 0.94)
  const pill = $('.swpill', root)
  // a soft light sweep crosses the pill while the switch is in flight
  css(pill, '--sweep', `${lerp(-30, 130, E.inOutSine(seg(t, a + 0.05, a + 0.85))).toFixed(1)}%`)
  spinDone(root, t, a, a + 0.55)
}

function animRoute(t) {
  const root = $('#b-route')
  rise(root, t, T.route, 0.5)
  root.querySelectorAll('.rt-row').forEach((row, i) => rise(row, t, T.route + 0.22 + i * 0.15, 0.5, 12))
}

function animSb2(t) {
  const root = $('#b-sb2')
  rise(root, t, T.sb2, 0.5)
  typeText($('.sb2-typed', root), SB2, seg(t, T.sb2 + 0.15, T.sb2 + 0.95))
  const tool = $('.tool', root)
  rise(tool, t, T.sb2 + 0.55, 0.45, 10)
  spinDone(tool, t, T.sb2 + 0.55, T.sb2 + 0.95)
  const lab = $('.tool-l', tool)
  const txt = t >= T.sb2 + 0.95 ? 'Connected to Strava' : 'Connecting to Strava'
  if (lab.textContent !== txt) lab.textContent = txt
}

export function animThread(t) {
  rise($('#b-ask'), t, T.ask, 0.55, 22)
  animRoute(t)
  for (let i = 0; i < SWITCHES.length; i++) animSwitch(t, i)
  animSb2(t)
  const fin = $('#b-fin')
  rise(fin, t, T.fin, 0.55, 14, 0.97)
  spinDone(fin, t, T.fin, T.fin)
}

// Composer: types the ask on the home screen, sends, then glides to the bottom dock.
const CHIP = [
  [0, 'sb', 'superbot'],
  [T.sw1 + 0.4, 'ds', 'DeepSeek V4'],
  [T.sw2 + 0.4, 'gm', 'Gemini 3.1 Pro'],
  [T.sw3 + 0.4, 'op', 'Claude Opus 5.5'],
  [T.sb2 + 0.1, 'sb', 'superbot'],
]
const CHIP_FADE = 0.12

export function animComposer(t, geo) {
  const cmp = $('#composer')
  const dock = E.inOut(seg(t, T.dock0, T.dock1))
  css(cmp, 'transform', `translate3d(0,${lerp(geo.homeTop, geo.dockTop, dock).toFixed(2)}px,0)`)
  const sent = t >= T.send + 0.12
  const typed = $('#cmp-typed')
  typeText(typed, sent ? '' : ASK, seg(t, T.type0, T.type1))
  show($('#cmp-ph'), t < T.type0 || sent ? 1 : 0)
  const blink = t < T.type0 || (t > T.type1 && !sent) ? Math.floor(t * 2.2) % 2 === 0 : !sent
  show($('#caret'), blink ? 1 : 0)
  css($('#caret'), 'order', sent || t < T.type0 ? '0' : '2')
  const press = seg(t, T.send, T.send + 0.16)
  const send = $('#send')
  css(send, 'transform', `scale(${(1 - Math.sin(press * Math.PI) * 0.12).toFixed(3)})`)
  send.classList.toggle('on', t > T.type0 + 0.1 && !sent)
  let cur = CHIP[0]
  for (const c of CHIP) if (t >= c[0]) cur = c
  const chip = $('#chip')
  if (chip.dataset.k !== cur[1]) {
    chip.dataset.k = cur[1]
    $('#chip-name').textContent = cur[2]
    $('#chip-tile').className = `tile sm ${cur[1]}`
    $('#chip-tile').innerHTML = cur[1] === 'sb' ? '<span class="sbm"></span>' : $(`.tile.${cur[1]}`, $('#feed')).innerHTML
    geo.mountMarks($('#chip-tile'))
  }
  // label and icon cross-fade through the swap instead of cutting
  const dip = Math.max(...CHIP.slice(1).map((c) => Math.sin(seg(t, c[0] - CHIP_FADE, c[0] + CHIP_FADE) * Math.PI)))
  css($('#chip-tile'), 'opacity', (1 - dip).toFixed(3))
  css($('#chip-name'), 'opacity', (1 - dip).toFixed(3))
  const pop = Math.max(...CHIP.slice(1).map((c) => Math.sin(seg(t, c[0] - CHIP_FADE, c[0] + 0.3) * Math.PI)))
  css(chip, 'transform', `scale(${(1 + pop * 0.04).toFixed(3)})`)
  const hero = $('#hero')
  const ho = E.inOut(seg(t, T.dock0, T.dock0 + 0.5))
  show(hero, (1 - ho) * E.out(seg(t, 0, 0.45)))
  css(hero, 'transform', `translate3d(0,${(-40 * ho + 14 * (1 - E.out(seg(t, 0, 0.6)))).toFixed(2)}px,0)`)
}

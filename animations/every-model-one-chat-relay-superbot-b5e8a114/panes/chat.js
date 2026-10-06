// Pane 0: the superbot chat. One ask, Super mode on, and the relay plan it routes.
import { ASK, RELAY } from '../data.js';
import { html, $, $$, enter, typed, show } from '../engine.js';

export const sbTile = (cls = '') => `<span class="tile t-superbot ${cls}"><i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i></span>`;
export const tile = (m, cls = '') => (m.logo ? `<span class="tile t-${m.id} ${cls}"><img src="${m.logo}" alt=""></span>` : sbTile(cls));
const CHECK = '<svg class="ok" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7"/></svg>';

// The superbot routing chip, "Switching to X" shimmering until it resolves to a check.
export const switchChip = (m) => `
  <span class="sw">${tile(m, 'sm')}<span class="swl">Switching to ${m.name}</span><span class="st"><i class="spin"></i>${CHECK}</span></span>`;

export function renderSwitch(chip, t, at, done) {
  const on = t >= at;
  show(chip, on);
  if (!on) return;
  enter(chip, t, at, 0.28, 6);
  const fin = t >= done;
  chip.classList.toggle('done', fin);
  $(chip, '.swl').style.setProperty('--sh', `${100 - (((t - at) * 90) % 150)}%`);
  $(chip, '.spin').style.transform = `rotate(${(t - at) * 540}deg)`;
}

export function build() {
  const rows = RELAY.slice(0, 5).map((m, i) => `
    <li><span class="n">${i + 1}</span>${tile(m)}<b>${m.name}</b><span class="task">${m.task}</span><span class="file">${m.out}</span></li>`).join('');
  const rail = ['deepseek', 'opus', 'gemini', 'blender', 'eleven'].map((id) => tile(RELAY.find((m) => m.id === id))).join('');
  const el = html(`
  <div class="pane p-chat">
    <aside class="c-rail">${sbTile('lg on')}<hr>${rail}</aside>
    <div class="c-main">
      <header class="c-top"><span>New chat</span><span class="c-top-r">Super mode routes each step to the model built for it</span></header>
      <div class="c-thread">
        <div class="c-user">${ASK}</div>
        <div class="c-bot">
          <div class="who">${sbTile('sm')}<b>superbot</b></div>
          <p>Five models, one chat. Each one hands its work to the next:</p>
          <ol class="c-plan">${rows}</ol>
          ${switchChip(RELAY[0])}
        </div>
      </div>
      <div class="c-composer">
        <div class="c-input"><span class="c-typed"></span><i class="caret"></i><span class="c-ph">Ask superbot anything</span></div>
        <div class="c-tools">
          <span class="c-plus">+</span>
          <span class="c-super"><i></i>SUPER</span>
          <span class="c-model">${sbTile('xs')}Auto</span>
          <span class="c-send"><svg viewBox="0 0 16 16"><path d="M8 13V3M3.5 7.5L8 3l4.5 4.5"/></svg></span>
        </div>
      </div>
    </div>
  </div>`);
  return {
    el,
    user: $(el, '.c-user'),
    bot: $(el, '.c-bot'),
    who: $(el, '.c-bot .who'),
    intro: $(el, '.c-bot p'),
    rows: $$(el, '.c-plan li'),
    chip: $(el, '.c-bot .sw'),
    typedEl: $(el, '.c-typed'),
    caret: $(el, '.caret'),
    ph: $(el, '.c-ph'),
    send: $(el, '.c-send'),
    sup: $(el, '.c-super'),
  };
}

const SEND = 2.15;

export function render(c, t) {
  const txt = t < SEND ? typed(ASK, t, 0.35, 52) : '';
  c.typedEl.textContent = txt;
  c.ph.style.display = txt ? 'none' : '';
  c.caret.style.opacity = t < SEND && Math.floor(t * 2.4) % 2 === 0 ? 1 : 0;
  c.send.classList.toggle('on', txt.length > 0);
  c.sup.classList.toggle('on', t >= 0.15);
  show(c.user, t >= SEND);
  enter(c.user, t, SEND, 0.3, 12);
  show(c.bot, t >= SEND + 0.25);
  enter(c.who, t, SEND + 0.25);
  enter(c.intro, t, SEND + 0.4);
  c.rows.forEach((r, i) => {
    // rows join the plan one by one, so the card grows instead of showing an empty box
    r.style.display = t >= SEND + 0.6 + i * 0.17 ? '' : 'none';
    enter(r, t, SEND + 0.6 + i * 0.17, 0.3, 8);
    r.classList.toggle('next', i === 0 && t >= 3.9);
  });
  renderSwitch(c.chip, t, 3.75, 4.35);
}

export const anchors = (c) => ({ in: c.user, out: c.user });

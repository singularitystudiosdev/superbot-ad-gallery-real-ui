// The variant selector: a segmented control pinned top right, outside #stage so it is not scaled with the frame, and
// hidden on a frozen capture (body.freeze) like the hint. Arrow keys move the choice; a mouse pick drops focus so
// space, the arrows and R go back to the spot's own clock (timeline.9b47fc30.js).
import { VARIANTS, variant, setVariant } from './variant.9e82faf1.js?v=3';
import { APPEARS, appear, setAppear } from './appear.9e82faf1.js?v=2';
// variants left out of the pill: still reachable by ?variant=, just not offered as a button or an arrow-key stop
const HIDDEN = new Set(['game', 'garden', 'bedtime', 'podcast', 'catgif', 'logo']);
const SHOWN = VARIANTS.filter((v) => !HIDDEN.has(v.id));
const bar = document.createElement('div');
bar.className = 'variant-select';
bar.setAttribute('role', 'radiogroup');
bar.setAttribute('aria-label', 'Variant');
bar.innerHTML = '<span class="vs-label" aria-hidden="true">Variant</span>'
  + SHOWN.map((v) => `<button type="button" role="radio" data-v="${v.id}">${v.label}</button>`).join('');
document.body.appendChild(bar);
const buttons = [...bar.querySelectorAll('button')];

// A user pick skips the wait: the clock jumps to just before the reply's art and plays on. Never on load, and never on a
// frozen capture (body.freeze), where the controls are hidden anyway.
function jump() {
  const ad = window.__AD;
  if (!ad || document.body.classList.contains('freeze')) return;
  ad.play(Math.max(0, ad.ART - 0.15));
}

function sync() {
  buttons.forEach((b) => {
    const on = b.dataset.v === variant();
    b.setAttribute('aria-checked', String(on));
    b.tabIndex = on ? 0 : -1;
  });
  // a narrow window scrolls the options sideways inside the pill: keep the chosen one in view, never moving the page
  if (bar.scrollWidth > bar.clientWidth) {
    const on = buttons.find((b) => b.getAttribute('aria-checked') === 'true');
    if (on) {
      const pad = 8;
      if (on.offsetLeft - pad < bar.scrollLeft) bar.scrollLeft = on.offsetLeft - pad;
      else if (on.offsetLeft + on.offsetWidth + pad > bar.scrollLeft + bar.clientWidth) bar.scrollLeft = on.offsetLeft + on.offsetWidth + pad - bar.clientWidth;
    }
  }
}

bar.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  setVariant(b.dataset.v);
  jump();
  if (e.detail > 0) b.blur();
});

bar.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') { e.stopPropagation(); return; }
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  e.preventDefault();
  e.stopPropagation();
  const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
  const i = SHOWN.findIndex((v) => v.id === variant());
  const next = SHOWN[(i + step + SHOWN.length) % SHOWN.length].id;
  setVariant(next);
  jump();
  buttons.find((b) => b.dataset.v === next).focus();
});

addEventListener('variantchange', sync);
sync();

// The appear sub-selector: a second pill right under the variant selector, shown only on the '10 images' variant, that
// picks how the ten generations arrive (appear.9e82faf1.js). A native select, so the keyboard is complete; its keys must
// not reach the spot's clock (space pauses, arrows step, R restarts), and a mouse pick drops focus so they work again.
const sub = document.createElement('div');
sub.className = 'appear-select';
sub.innerHTML = '<span class="vs-label" aria-hidden="true">Appear</span><span class="as-wrap"><select aria-label="Appear style">'
  + APPEARS.map((a) => `<option value="${a.id}">${a.label}</option>`).join('')
  + '</select></span>';
document.body.appendChild(sub);
const pick = sub.querySelector('select');

function syncAppear() {
  sub.hidden = variant() !== '10';
  document.body.classList.toggle('has-appear', !sub.hidden);
  pick.value = appear();
}

pick.addEventListener('change', () => { setAppear(pick.value); jump(); });
pick.addEventListener('keydown', (e) => { delete pick.dataset.mouse; e.stopPropagation(); });
pick.addEventListener('pointerup', () => { pick.dataset.mouse = '1'; });
pick.addEventListener('change', () => {
  if (pick.dataset.mouse) { delete pick.dataset.mouse; pick.blur(); }
});

addEventListener('variantchange', syncAppear);
addEventListener('appearchange', syncAppear);
syncAppear();

// The speed pill: a third pill, fixed under the variant selector (under the appear pill when that shows), that sets the
// playback speed of the spot's clock (timeline.9b47fc30.js owns the rate; ',' and '.' step it and fire 'speedchange', which
// keeps this select in step). Same native-select pattern as above: its keys do not reach the clock, a mouse pick drops focus.
const speedBar = document.createElement('div');
speedBar.className = 'speed-select';
speedBar.innerHTML = '<span class="vs-label" aria-hidden="true">Speed</span><span class="as-wrap"><select aria-label="Playback speed"></select></span>';
document.body.appendChild(speedBar);
const speedPick = speedBar.querySelector('select');
const speeds = (window.__AD && window.__AD.SPEEDS) || [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
speedPick.innerHTML = speeds.map((r) => `<option value="${r}">${r}×</option>`).join('');

function syncSpeed() {
  const ad = window.__AD;
  if (ad) speedPick.value = String(ad.speed);
}

speedPick.addEventListener('change', () => {
  if (window.__AD) window.__AD.setSpeed(parseFloat(speedPick.value));
});
speedPick.addEventListener('keydown', (e) => { delete speedPick.dataset.mouse; e.stopPropagation(); });
speedPick.addEventListener('pointerup', () => { speedPick.dataset.mouse = '1'; });
speedPick.addEventListener('change', () => {
  if (speedPick.dataset.mouse) { delete speedPick.dataset.mouse; speedPick.blur(); }
});

addEventListener('speedchange', syncSpeed);
syncSpeed();

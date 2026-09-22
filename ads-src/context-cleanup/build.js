'use strict';
// Builds the ad picked by ?id= into .poster. Every scene is a template
// string; the frame decides whether it lands inside the phone or as flat
// cards, and fitHead() sizes the flat headline rows to the frame.

const ICON = {
  warn: '<svg class="warn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2.5 20h19L12 3z"/><path d="M12 9.5v4.5M12 17.2v.1"/></svg>',
  spark: '<svg class="ico" viewBox="0 0 24 24" fill="#ffb800"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z"/><path d="M19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9z" fill="#ffd166"/><path d="M4.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" fill="#ffd166"/></svg>',
  clock: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="#6a1fd8" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></svg>',
  tick: '<svg class="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  tickS: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  cross: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  chat: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5h12v9H9l-4 3v-3H4z"/><path d="M9 14h11v6l-3-2h-8z"/></svg>',
  repeat: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  rules: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  file: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/></svg>',
  task: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l2.5 2.5L14 7"/><path d="M7 15h10"/></svg>',
  broom: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3l7 7"/><path d="M11 6l7 7-3 3-7-7z"/><path d="M8 13l-5 8 8-5"/></svg>',
  doc: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6" stroke-linecap="round"/></svg>',
};

const RULES = [
  ['use pnpm, never npm'],
  ['never touch supabase.ts'],
  ['tabs, not spaces'],
  ['ask before a migration'],
];

const meter = (kind, used, extra) => `
  <div class="meter ${kind}">
    <div class="row"><span>context window</span>
      <span class="val">${kind === 'bad' ? ICON.warn : ''}<b>${used}</b>&nbsp;of 200k used</span></div>
    <div class="bar"><i style="--p:${extra}"></i></div>
  </div>`;

const party = (line1, big1, line2a, big2, line2b) => `
  <div class="party">
    <img class="face" src="face.svg" alt="superbot">
    <div class="congrats">Congratulations!</div>
    <div class="stats">
      <div class="stat">${ICON.spark}<div>${line1}<br><b>${big1}</b></div></div>
      <div class="stat">${ICON.clock}<div>${line2a} <b>${big2}</b><br>${line2b}</div></div>
    </div>
  </div>`;

// the rule lines with their file header; `flat` drops the phone card wrapper
// because the flat frame's .card is the container
const rulesInner = (kind, n, headCls, count = RULES.length) => `
    <div class="${headCls}">
      <span class="file">${ICON.doc} AGENTS.md</span>
      <span class="val">${kind === 'bad' ? ICON.warn : ''}<b>${n} of 12</b>&nbsp;kept</span>
    </div>
    ${RULES.slice(0, count).map(([r]) => `<div class="rule"><code>${r}</code>
      <span class="tag">${kind === 'bad' ? ICON.cross + 'ignored' : ICON.tickS + 'kept'}</span></div>`).join('')}`;
// the phone shows three rules so both cards and the button fit above the bleed
const rulesCard = (kind, n) => `<div class="rules ${kind}">${rulesInner(kind, n, 'row', 3)}</div>`;

const PHONE = {
  optimize: {
    t1: 'Optimize', t2: 'Context',
    screen: `
      <h3>Before</h3>${meter('bad', '197k', '98.5%')}
      <h3>After</h3>${meter('good', '38k', '19%')}
      ${party('You have freed', '159k tokens', 'Saved', '1.2 hours', 'of re-explaining')}`,
  },
  cleaner: {
    t1: 'Clean', t2: 'Context & Keep the Rules',
    screen: `
      <h2>Context Cleaner</h2>
      <div class="list">
        <div class="item on">${ICON.chat}<span class="name">Stale chat history</span><span class="count">68k tokens ${ICON.tick}</span></div>
        <div class="item on">${ICON.repeat}<span class="name">Repeated instructions</span><span class="count">21k tokens ${ICON.tick}</span></div>
        <div class="item off">${ICON.rules}<span class="name">Your rules</span><span class="count">12 kept <i class="ring"></i></span></div>
        <div class="item on">${ICON.file}<span class="name">Old file dumps</span><span class="count">70k tokens ${ICON.tick}</span></div>
        <div class="item off">${ICON.task}<span class="name">The task at hand</span><span class="count">kept <i class="ring"></i></span></div>
      </div>
      <div class="cta">${ICON.broom} Free 159k tokens</div>`,
  },
  rules: {
    t1: 'Remember', t2: 'Rules, every session',
    screen: `
      <h3>Before</h3>${rulesCard('bad', 0)}
      <h3>After</h3>${rulesCard('good', 12)}
      <div class="cta">${ICON.tickS} Rules loaded, every session</div>`,
  },
};

const FLAT = {
  optimize: {
    l1: 'context <span class="pain">bloated</span>?', l2: '<span class="brand">superbot</span> can fix it!',
    scene: `
      <div class="card bad"><span class="chip">before</span>
        <div class="row"><span>context window</span><span class="val">${ICON.warn}<b>197k</b>&nbsp;of 200k used</span></div>
        <div class="bar"><i style="--p:98.5%"></i></div></div>
      <div class="card good"><span class="chip">after</span>
        <div class="row"><span>context window</span><span class="val"><b>38k</b>&nbsp;of 200k used</span></div>
        <div class="bar"><i style="--p:19%"></i></div></div>`,
    foot: '<b>159k tokens</b> freed. <b>1.2 hours</b> of re-explaining saved.',
  },
  rules: {
    l1: 'rules <span class="pain">ignored</span>?', l2: '<span class="brand">superbot</span> can fix it!',
    scene: `
      <div class="card bad"><span class="chip">before</span>${rulesInner('bad', 0, 'filehead')}</div>
      <div class="card good"><span class="chip">after</span>${rulesInner('good', 12, 'filehead')}</div>`,
    foot: '<b>12 of 12</b> rules loaded into every session.',
  },
  breakdown: {
    l1: 'what fills your <span class="hl">context</span>?', l2: '<span class="brand">superbot</span> cleans it.',
    scene: `
      <div class="card bad"><span class="chip">before</span>
        <div class="row"><span>context window</span><span class="val">${ICON.warn}<b>197k</b>&nbsp;of 200k used</span></div>
        <div class="seg">
          <i style="--p:41%;--c:#ff3d9a"></i><i style="--p:27%;--c:#c026d3"></i>
          <i style="--p:18%;--c:#6a1fd8"></i><i style="--p:12.5%;--c:#2b6bff"></i><i class="free" style="--p:1.5%"></i></div>
        <div class="legend">
          <span style="--c:#ff3d9a">stale history <b>82k</b></span><span style="--c:#c026d3">file dumps <b>54k</b></span>
          <span style="--c:#6a1fd8">repeated instructions <b>36k</b></span><span style="--c:#2b6bff">your task <b>25k</b></span></div></div>
      <div class="card good"><span class="chip">after</span>
        <div class="row"><span>context window</span><span class="val"><b>38k</b>&nbsp;of 200k used</span></div>
        <div class="seg">
          <i style="--p:12.5%;--c:#2b6bff"></i><i style="--p:6.5%;--c:#6a1fd8"></i><i class="free" style="--p:81%"></i></div>
        <div class="legend">
          <span style="--c:#2b6bff">your task <b>25k</b></span><span style="--c:#6a1fd8">your rules <b>13k</b></span>
          <span class="free">free <b>162k</b></span></div></div>`,
    foot: '<b>197k</b> down to <b>38k</b>. The rules stay, the noise goes.',
  },
};

const status = `
  <div class="status"><span>9:41</span><span class="island"></span>
    <svg class="sig" viewBox="0 0 64 14" fill="currentColor">
      <rect x="0" y="8" width="3" height="6" rx=".8"/><rect x="5" y="5.5" width="3" height="8.5" rx=".8"/>
      <rect x="10" y="3" width="3" height="11" rx=".8"/><rect x="15" y=".5" width="3" height="13.5" rx=".8"/>
      <path d="M22 5.5a11.5 11.5 0 0 1 16 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M25.5 9a6.5 6.5 0 0 1 9 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="30" cy="12.3" r="1.7"/>
      <rect x="44" y="1.2" width="17" height="11.6" rx="3" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".4"/>
      <rect x="46" y="3.2" width="13" height="7.6" rx="1.6"/><rect x="62.2" y="4.8" width="1.6" height="4.4" rx=".6" opacity=".5"/>
    </svg></div>
  <div class="nav"><span class="back"></span><span class="pill"><img src="face.svg" alt="">superbot</span></div>`;

function build(ad) {
  const poster = document.querySelector('.poster');
  poster.dataset.frame = ad.frame;
  poster.dataset.scene = ad.scene;
  if (ad.frame === 'phone') {
    const s = PHONE[ad.scene];
    poster.innerHTML = `
      <header class="title"><div class="t1">${s.t1}</div><div class="t2">${s.t2}</div></header>
      <div class="phone">${status}<div class="screen">${s.screen}</div></div>`;
  } else {
    const s = FLAT[ad.scene];
    poster.innerHTML = `
      <div class="head"><div class="line" id="l1">${s.l1}</div><div class="line" id="l2">${s.l2}</div></div>
      <div class="scene">${s.scene}</div>
      <div class="foot">${s.foot}</div>
      <img class="face" src="face.svg" alt="superbot">`;
  }
}

// Sizes the flat headline: the widest row spans 78% of the frame width,
// capped so the two rows take no more than 22% of the height.
function fitHead() {
  const poster = document.querySelector('.poster');
  const rows = [...document.querySelectorAll('.head .line')];
  if (!rows.length) return;
  const avail = poster.clientWidth * 0.78;
  const PROBE = 100;
  rows.forEach((r, i) => { r.style.fontSize = `${PROBE * (i ? 1.12 : 1)}px`; });
  const widest = () => Math.max(...rows.map(r => r.getBoundingClientRect().width));
  let base = avail / (widest() / PROBE);
  base = Math.min(base, poster.clientHeight * 0.22 / 2.25);
  rows.forEach((r, i) => { r.style.fontSize = `${base * (i ? 1.12 : 1)}px`; });
}

(function main() {
  const params = new URLSearchParams(location.search);
  if (params.has('export')) document.documentElement.dataset.export = '1';
  const id = params.get('id') || window.CTX_ADS[0].id;
  const ad = window.CTX_ADS.find(a => a.id === id) || window.CTX_ADS[0];
  build(ad);
  document.title = `superbot · ${ad.id}`;
  const dl = document.getElementById('dl');
  if (dl) dl.href = `../../assets/ads/${ad.id}.16x9.png`;
  const done = () => { fitHead(); document.documentElement.dataset.fitted = '1'; };
  addEventListener('resize', fitHead);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(done); else done();
})();

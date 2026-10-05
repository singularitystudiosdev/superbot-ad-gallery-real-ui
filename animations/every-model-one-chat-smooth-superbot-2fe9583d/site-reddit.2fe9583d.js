// reddit.com search results (dark theme) as the live tab superbot drives during the scrape.
// Laid out at 720x450 and scaled into the live embed frame.
import { icon } from './icons.2fe9583d.js';
import { h } from './shell.2fe9583d.js';
import { EASE, keys, prog } from './ease.2fe9583d.js';

const POSTS = [
  { sub: 'memes', color: '#ff4500', age: '6 hr. ago', title: 'Muse at 2am be like', votes: '12K', comments: '318', img: 'img/meme-bed.jpg' },
  { sub: 'ProgrammerHumor', color: '#46d160', age: '9 hr. ago', title: 'When Muse replies before you finish typing', votes: '8.1K', comments: '204', img: 'img/meme-desk.jpg' },
  { sub: 'me_irl', color: '#0dd3bb', age: '14 hr. ago', title: 'me_irl', votes: '5.6K', comments: '97', img: 'img/meme-notes.jpg' },
  { sub: 'teenagers', color: '#ffb000', age: '1 day ago', title: 'Muse passed me a note in lecture', votes: '3.2K', comments: '141', img: 'img/muse-meme.jpg' },
  { sub: 'wholesomememes', color: '#7193ff', age: '2 days ago', title: 'My Muse plush finally arrived and it already has opinions', votes: '2.4K', comments: '66', img: '' },
  { sub: 'ChatGPT', color: '#10a37f', age: '3 days ago', title: 'Does anyone else name their Muse?', votes: '1.1K', comments: '312', img: '' },
];

const CSS = `
.rd { position:absolute; inset:0; background:#0e1113; color:#f2f4f5; font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
.rd-top { height:56px; display:flex; align-items:center; gap:12px; padding:0 16px; border-bottom:1px solid rgba(255,255,255,.1); background:#0e1113; position:relative; z-index:2; }
.rd-logo { display:flex; align-items:center; gap:7px; font-weight:800; font-size:23px; letter-spacing:-.8px; }
.rd-logo img { width:32px; height:32px; border-radius:50%; }
.rd-search { flex:1; margin:0 18px; height:40px; border-radius:20px; background:#2a3236; display:flex; align-items:center; gap:10px; padding:0 14px; font-size:14px; color:#f2f4f5; }
.rd-search .ic { width:18px; height:18px; color:#b7cad4; }
.rd-search .x { margin-left:auto; width:20px; height:20px; border-radius:50%; background:#3e4a4f; display:grid; place-items:center; font-size:12px; color:#b7cad4; }
.rd-act { display:flex; align-items:center; gap:14px; color:#f2f4f5; }
.rd-act .ic { width:20px; height:20px; }
.rd-create { display:flex; align-items:center; gap:6px; font-size:14px; font-weight:600; }
.rd-av { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,#ff8717,#ff4500); }
.rd-body { position:absolute; left:0; right:0; top:56px; bottom:0; overflow:hidden; }
.rd-list { position:absolute; left:0; right:0; top:0; padding:12px 24px 0 24px; }
.rd-tabs { display:flex; gap:6px; margin-bottom:12px; }
.rd-tabs span { height:34px; padding:0 14px; border-radius:17px; display:flex; align-items:center; font-size:13.5px; font-weight:600; color:#b7cad4; }
.rd-tabs span.on { background:#2a3236; color:#f2f4f5; }
.rd-sort { display:flex; gap:16px; font-size:12px; color:#8ba2ad; margin:0 0 6px 4px; }
.rd-post { position:relative; display:flex; gap:16px; padding:12px 10px; border-top:1px solid rgba(255,255,255,.08); border-radius:10px; }
.rd-post .hl { position:absolute; inset:0; border-radius:10px; background:#181c1f; }
.rd-post .tx { position:relative; flex:1; min-width:0; }
.rd-post .meta { display:flex; align-items:center; gap:6px; font-size:12px; color:#8ba2ad; }
.rd-post .meta b { color:#d7dadc; font-weight:600; }
.rd-post .meta i { width:20px; height:20px; border-radius:50%; display:block; }
.rd-post .ttl { margin-top:6px; font-size:16px; line-height:21px; font-weight:600; color:#f2f4f5; }
.rd-post .rd-st { margin-top:8px; font-size:12px; color:#8ba2ad; }
.rd-post img { position:relative; width:112px; height:84px; object-fit:cover; border-radius:8px; flex:none; }
`;

export function buildReddit() {
  const posts = POSTS.map(
    (p) => `<div class="rd-post"><span class="hl" style="opacity:0"></span><div class="tx">
<div class="meta"><i style="background:${p.color}"></i><b>r/${p.sub}</b>• ${p.age}</div>
<div class="ttl">${p.title}</div><div class="rd-st">${p.votes} votes · ${p.comments} comments</div></div>
${p.img ? `<img src="${p.img}" alt="">` : ''}</div>`,
  ).join('');
  const el = h(`<div class="rd"><style>${CSS}</style>
<div class="rd-top"><div class="rd-logo"><img src="img/reddit.png" alt="">reddit</div>
<div class="rd-search">${icon('search')}muse meme<span class="x">✕</span></div>
<div class="rd-act">${icon('comment')}<span class="rd-create">${icon('plus')}Create</span>${icon('bell')}<span class="rd-av"></span></div></div>
<div class="rd-body"><div class="rd-list"><div class="rd-tabs"><span class="on">Posts</span><span>Communities</span><span>Comments</span><span>Media</span><span>People</span></div>
<div class="rd-sort"><span>Relevance ▾</span><span>Past week ▾</span></div>${posts}</div></div></div>`);
  const list = el.querySelector('.rd-list');
  const hls = [...el.querySelectorAll('.rd-post .hl')];
  const results = el.querySelector('.rd-body');

  /** cue: { load, read0, read1 }: results fade in on load, then the reader scrolls and highlights each post. */
  function update(t, cue) {
    results.style.opacity = prog(t, cue.load, 0.35, EASE.standard);
    const scroll = keys(t, [[cue.read0, 0], [cue.read1, -330]], EASE.inOut);
    list.style.transform = `translateY(${scroll.toFixed(2)}px)`;
    const span = (cue.read1 - cue.read0) / hls.length;
    hls.forEach((hl, i) => {
      const a = cue.read0 + i * span;
      const on = prog(t, a, 0.18, EASE.standard) * (1 - prog(t, a + span, 0.3, EASE.standard));
      hl.style.opacity = on.toFixed(3);
    });
  }
  return { el, update };
}

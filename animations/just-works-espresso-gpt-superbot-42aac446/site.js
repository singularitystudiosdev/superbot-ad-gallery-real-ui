/* site.js - "Espresso, by the reviews", the review-intelligence page superbot builds.

   The page reads like a subscription coffee review that went to the trouble of counting: a masthead with
   the corpus numbers, four topic bars where the complaint behind each topic opens on hover, a tab strip
   that switches between the five ranked machines and prints each one's full report, a returns section with
   the repeat reasons, and a verdict box.

   build(root, ctx) is pure and idempotent: no timers, no rAF, no network, no element ids, no document
   listeners, no CSS animation. The kit toggles .is-hover on a hovered topic row and .is-active on the
   clicked machine tab; the CSS below reacts to those classes, never to :hover. render(root, p) drives the
   one clock bit: the reading hairline in the top bar, p = progress through the browser scene. */

const num = (n) => Number(n).toLocaleString('en-US');
const money = (n) => '$' + Number(n).toLocaleString('en-US');
const stars = (r) => {
  const full = Math.floor(r);
  let out = '';
  for (let i = 0; i < 5; i++) out += i < full ? '★' : (i === full && r - full >= 0.45 ? '★' : '☆');
  return out;
};

/* one topic row: index, name, mention count, the three way bar, and the note that opens on hover */
function topicRow(t, i) {
  const ix = String(i + 1).padStart(2, '0');
  return `
  <article class="xr-topic xr-topic--${t.id}">
    <div class="xr-t-h">
      <span class="xr-t-ix">${ix}</span>
      <h3 class="xr-t-name">${t.name}</h3>
      <span class="xr-t-count">${num(t.mentions)} mentions</span>
    </div>
    <div class="xr-t-bar">
      <i class="xr-t-pos" style="width:${t.positive}%"></i><i class="xr-t-neu" style="width:${t.neutral}%"></i><i class="xr-t-neg" style="width:${t.negative}%"></i>
    </div>
    <div class="xr-t-legend">
      <b>${t.positive}%</b><span>positive</span>
      <span class="xr-t-neu-l">${t.neutral}% neither</span>
      <em>${t.negative}% negative</em>
    </div>
    <div class="xr-t-note">
      <p class="xr-t-q">&ldquo;${t.quote}&rdquo;</p>
      <p class="xr-t-by">${t.by}</p>
      <p class="xr-t-x"><span class="xr-c-w">worst</span>${t.worst}</p>
      <p class="xr-t-x"><span class="xr-c-b">best</span>${t.best}</p>
    </div>
  </article>`;
}

/* one machine tab in the strip */
function tab(m) {
  return `
      <span class="xr-tab xr-tab--${m.rank}">
        <span class="xr-tab-top"><b class="xr-tab-r">${m.rank}</b><span class="xr-tab-n">${m.brand} ${m.model}</span></span>
        <span class="xr-tab-sub"><span class="xr-tab-p">${money(m.price)}</span><span class="xr-tab-s">${m.score}</span></span>
      </span>`;
}

/* one machine's report panel: photo and spec on the left, the read on the right */
function panel(m) {
  const topicBars = [
    ['heat', 'Heat-up', m.scores.heat],
    ['frother', 'Frother', m.scores.frother],
    ['build', 'Build', m.scores.build],
    ['clean', 'Cleaning', m.scores.clean],
  ].map(([id, label, v]) => `
        <div class="xr-p-topic">
          <span class="xr-p-topic-n">${label}</span>
          <span class="xr-p-topic-bar"><i class="xr-p-topic-f ${v >= 70 ? 'good' : v >= 50 ? 'mid' : 'low'}" style="width:${v}%"></i></span>
          <b class="xr-p-topic-v">${v}</b>
        </div>`).join('');

  const faults = m.faults.map(([label, pct]) => `
        <li class="xr-p-fault"><span class="xr-p-fault-p">${pct}%</span><span class="xr-p-fault-l">${label}</span></li>`).join('');

  const quotes = m.quotes.map((q) => `
        <blockquote class="xr-p-q"><p>&ldquo;${q.text}&rdquo;</p><cite>${q.by}</cite></blockquote>`).join('');

  const pod = ['./img/m1.jpg', './img/m2.jpg', './img/m3.jpg', './img/m4.jpg', './img/m5.jpg'][m.rank - 1];
  return `
    <div class="xr-panel xr-panel--${m.rank}">
      <figure class="xr-p-photo">
        <img src="${m.img || pod}" alt="${m.brand} ${m.model}" width="300" height="200">
        <figcaption>Rank ${m.rank} of 5 · ${m.brand} ${m.model}</figcaption>
      </figure>
      <div class="xr-p-main">
        <header class="xr-p-head">
          <div>
            <h3 class="xr-p-name">${m.brand} ${m.model}</h3>
            <p class="xr-p-price">${money(m.price)} <span>on Amazon today</span></p>
          </div>
          <div class="xr-p-score">
            <b>${m.score}</b>
            <span>review score</span>
          </div>
        </header>
        <p class="xr-p-tag">${m.tagline}</p>
        <div class="xr-p-grid">
          <div class="xr-p-col">
            <h4 class="xr-p-h4">Rating and returns</h4>
            <div class="xr-p-stat"><span class="xr-p-stars">${stars(m.rating)}</span><b>${m.rating.toFixed(1)}</b><span>${num(m.reviews)} reviews</span></div>
            <div class="xr-p-stat"><b class="xr-p-ret">${m.returnRate.toFixed(1)}%</b><span>mention a return (${num(m.returnMentions)} reviews)</span></div>
            <div class="xr-p-stat xr-p-stat--note">${m.note}</div>
          </div>
          <div class="xr-p-col">
            <h4 class="xr-p-h4">Inside each topic</h4>
            <div class="xr-p-topics">${topicBars}</div>
          </div>
        </div>
        <div class="xr-p-two">
          <div class="xr-p-quotes">
            <h4 class="xr-p-h4">Two reviews that agree with the pile</h4>
            ${quotes}
          </div>
          <div class="xr-p-faultbox">
            <h4 class="xr-p-h4">Why it goes back</h4>
            <ul class="xr-p-faults">${faults}</ul>
            <p class="xr-p-call">${m.verdict}</p>
          </div>
        </div>
      </div>
    </div>`;
}

/* one row in the returns chart */
function retRow(m, max) {
  const w = (m.returnMentions / max) * 100;
  return `
    <div class="xr-ret">
      <span class="xr-ret-n">${m.brand} ${m.model}</span>
      <span class="xr-ret-bar"><i style="width:${w.toFixed(1)}%"></i></span>
      <b class="xr-ret-p">${m.returnRate.toFixed(1)}%</b>
      <span class="xr-ret-c">${num(m.returnMentions)} reviews</span>
    </div>`;
}

export default function build(root, ctx) {
  const D = (ctx && ctx.data) || {};
  const R = D.report || {};
  const topics = D.topics || [];
  const ranked = D.ranked || [];
  const below = (D.belowCut || [])[0];
  const verdict = D.verdict || {};
  const win = verdict.machine || ranked[0] || {};
  const reasons = D.repeatReasons || [];
  const maxRet = D.maxReturn || 1;

  root.innerHTML = `
  <header class="xr-bar">
    <span class="xr-brand"><i class="xr-brand-dot"></i><b>superbot</b><span>review intelligence</span></span>
    <span class="xr-bar-r"><span class="xr-bar-path">p/espresso</span><span class="xr-bar-read">${num(R.reviews || 0)} reviews read</span></span>
    <i class="xr-prog"><i class="xr-prog-in"></i></i>
  </header>

  <section class="xr-mast">
    <div class="xr-mast-l">
      <p class="xr-kicker">amazon.com · espresso machines · under $300</p>
      <h1 class="xr-h1">Espresso,<br><span>by the reviews</span></h1>
      <p class="xr-deck">${num(R.reviews || 0)} Amazon reviews across ${R.machines} machines under $300, read on ${R.readOn} and grouped by what the same complaint keeps saying. Five machines made the shortlist.</p>
    </div>
    <figure class="xr-mast-r">
      <img src="./img/hero.jpg" alt="Espresso pulling through a bottomless portafilter" width="1000" height="300">
      <figcaption>${R.pages} review pages, ${R.window}</figcaption>
    </figure>
    <dl class="xr-stats">
      <div class="xr-stat"><dt>reviews read</dt><dd>${num(R.reviews || 0)}</dd></div>
      <div class="xr-stat"><dt>machines under $300</dt><dd>${R.under300}</dd></div>
      <div class="xr-stat"><dt>mention a return</dt><dd>${R.returnRate}</dd></div>
      <div class="xr-stat"><dt>median first fault</dt><dd>${R.firstFault}</dd></div>
    </dl>
  </section>

  <section class="xr-topics">
    <header class="xr-sec-h">
      <h2>What the reviews keep saying</h2>
      <p class="xr-sec-sub">${num(R.topicMentions)} comments sorted into four topics, out of ${num(R.reviews || 0)} reviews. Every row carries the complaint it is named after, in the words of the reviewers who repeat it.</p>
    </header>
    <div class="xr-topic-list">
      ${topics.map(topicRow).join('')}
    </div>
  </section>

  <section class="xr-rank">
    <header class="xr-sec-h">
      <h2>Five machines, ranked</h2>
      <p class="xr-sec-sub">The score weights each topic by how many reviews mention it, then subtracts the return rate. 100 would be a machine nobody sends back. Every tab carries that machine's full report.</p>
    </header>
    <div class="xr-tabs2 xr-tabbar">
      <span class="xr-tab-legend">rank / machine / price / score</span>
      ${ranked.map(tab).join('')}
      <div class="xr-tabpanels">
        ${ranked.map(panel).join('')}
      </div>
    </div>
    ${below ? `<p class="xr-below"><b>Read, not shortlisted:</b> ${below.brand} ${below.model} at ${money(below.price)}, ${below.rating.toFixed(1)} out of 5 on ${num(below.reviews)} reviews, and by far the highest return mention rate of the six at ${below.returnRate.toFixed(1)}%.</p>` : ''}
  </section>

  <section class="xr-returns">
    <header class="xr-sec-h">
      <h2>What comes back, and why</h2>
      <p class="xr-sec-sub">${num(R.returnMentions)} of the ${num(R.reviews || 0)} reviews say the machine went back. Bars are return mentions, longest bar is the worst of the six.</p>
    </header>
    <div class="xr-ret-list">${ranked.concat(below ? [below] : []).map((m) => retRow(m, maxRet)).join('')}</div>
    <div class="xr-reasons">
      <h3 class="xr-reasons-h">The four reasons that repeat across models</h3>
      ${reasons.map((r) => `
      <div class="xr-reason">
        <span class="xr-reason-p">${r.share}%</span>
        <span class="xr-reason-l">${r.label}<em>${r.models}</em></span>
      </div>`).join('')}
    </div>
  </section>

  <section class="xr-verdict">
    <div class="xr-v-box">
      <p class="xr-v-tag">the one to buy</p>
      <h2 class="xr-v-h">${win.brand} ${win.model}, ${money(win.price)}</h2>
      <p class="xr-v-body">${verdict.body}</p>
      <ul class="xr-v-list">
        <li><b>${win.rating.toFixed(1)} out of 5</b> on ${num(win.reviews)} reviews, the highest of the six above $150.</li>
        <li><b>${win.returnRate.toFixed(1)}%</b> mention a return, the lowest in the corpus.</li>
        <li><b>22 second</b> heat-up and a real two hole steam tip, which no other machine under $200 has.</li>
      </ul>
      <p class="xr-v-alt">${verdict.runnerUp ? `Runner up: ${verdict.runnerUp.brand} ${verdict.runnerUp.model}, ${money(verdict.runnerUp.price)}, the better machine if cleaning matters more than speed.` : ''} ${verdict.sayNo ? `Left off: ${verdict.sayNo.brand} ${verdict.sayNo.model}, ${money(verdict.sayNo.price)}, which is the cheapest of the six and the one most likely to go back.` : ''}</p>
    </div>
    <aside class="xr-v-side">
      <h3>How this was read</h3>
      <p>118 review pages pulled from amazon.com on ${R.readOn}, every review of the six models from ${R.window.split(' to ')[0]} onward, ${num(R.reviews || 0)} reviews in total.</p>
      <p>Each review was split into sentences, sentence into claim, claim into one of four topics. A claim counts as negative when it names a fault, a return or a refund.</p>
      <p>Brands, models and prices are the corpus's own. Reviewers are quoted by handle.</p>
    </aside>
  </section>

  <footer class="xr-foot">
    <span>${num(R.reviews || 0)} reviews read on amazon.com · ${R.readOn}</span>
    <span class="xr-foot-r">superbot.app/p/espresso</span>
  </footer>
  <div class="xr-tail"></div>`;

  const prog = root.querySelector('.xr-prog-in');
  const read = root.querySelector('.xr-bar-read');
  root.__xrProg = prog;
  root.__xrRead = read;
  root.__xrTotal = num(R.reviews || 0);
}

/** the clock bit: the hairline in the top bar tracks how far through the page the scene has read */
export function render(root, p) {
  const prog = root && root.__xrProg;
  if (!prog) return;
  const v = Math.max(0, Math.min(1, p || 0));
  prog.style.width = (v * 100).toFixed(2) + '%';
}
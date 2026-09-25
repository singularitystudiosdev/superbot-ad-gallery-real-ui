// "Your 10 dresses" lookbook frontend.
// Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners,
// no CSS animations or transitions. Every hover and click state is a class the kit toggles
// (.is-hover on a look, .is-active on the clicked element), and the shortlist tray is driven
// from those classes with :has(), so calling build() twice renders the same page twice.

const HEART =
  'M12 21.2 3.4 13.1A6.4 6.4 0 0 1 12 4.3a6.4 6.4 0 0 1 8.6 8.8Z';

function starRow(rating) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return `<span class="stars" aria-hidden="true"><i class="stars-on" style="width:${pct.toFixed(1)}%">★★★★★</i>★★★★★</span>`;
}

function swatches(item) {
  return item.colors
    .map(
      (c, i) =>
        `<span class="swatch${i === item.chosen ? ' is-on' : ''}" style="--sw:${c.hex}"><span class="swatch-name">${c.name}</span></span>`
    )
    .join('');
}

function sizes(item) {
  return item.sizes
    .map((s) => {
      const out = item.soldOut.includes(s);
      const on = !out && s === item.size;
      const cls = out ? 'size is-out' : on ? 'size is-on' : 'size';
      return `<span class="${cls}">${s}</span>`;
    })
    .join('');
}

function look(item, index) {
  const alt = `${item.brand} ${item.title.toLowerCase()} worn on a model`;
  return `
  <li class="look" data-n="${item.n}">
    <figure class="look-shot">
      <img class="look-img" src="${item.img}" alt="${alt}" width="900" height="1200" loading="eager" decoding="sync">
      <figcaption class="look-flag">${item.style}</figcaption>
      <span class="look-badge">${item.badge}</span>
    </figure>
    <div class="look-body">
      <div class="look-topline">
        <span class="look-no">${String(item.n).padStart(2, '0')}</span>
        <span class="look-count">${index + 1} / 10</span>
      </div>
      <p class="look-brand">${item.brand}</p>
      <h2 class="look-name">${item.title}</h2>
      <div class="look-rate">
        ${starRow(item.rating)}
        <span class="look-score">${item.rating}</span>
        <span class="look-rev">${item.reviews} ratings</span>
        <span class="badge-prime">prime</span>
      </div>
      <p class="look-price">${item.price}</p>
      <p class="look-line">${item.fabric}</p>
      <p class="look-why">${item.why}</p>
      <div class="look-quick">
        <span class="quick"><b>Fit</b> ${item.fit}</span>
        <span class="quick"><b>Delivery</b> ${item.delivery}</span>
        <span class="quick"><b>Returns</b> Free within 30 days</span>
      </div>
      <div class="look-pick">
        <div class="pick">
          <p class="pick-label">Colour</p>
          <div class="swatches">${swatches(item)}</div>
        </div>
        <div class="pick">
          <p class="pick-label">Size</p>
          <div class="sizes">${sizes(item)}</div>
        </div>
      </div>
      <div class="look-act">
        <button class="heart" type="button" aria-label="Shortlist the ${item.title}">
          <svg class="heart-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${HEART}"/></svg>
          <span class="hw hw-add">Shortlist</span>
          <span class="hw hw-done">Shortlisted</span>
        </button>
        <span class="look-cta">View on Amazon</span>
      </div>
      <p class="look-seller">Sold by ${item.brand}<span class="look-slash">/</span>Ships from Amazon</p>
    </div>
  </li>`;
}

function slot(item) {
  return `<li class="slot" data-n="${item.n}"><img src="${item.img}" alt="" width="31" height="46"><span class="slot-no">${String(item.n).padStart(2, '0')}</span></li>`;
}

export default function build(root, ctx) {
  const data = ctx.data;
  const items = data.items;
  const q = data.query;

  root.innerHTML = `
  <div class="lb-wrap">
    <header class="lb-head">
      <div class="lb-stamp">
        <span class="lb-mark">SB</span>
        <span class="lb-stamp-text">Lookbook ${q.searched} dresses</span>
      </div>
      <div class="lb-head-l">
        <p class="lb-kicker">${q.site}<span class="lb-slash">/</span>${q.department}<span class="lb-slash">/</span>4.3 stars and up</p>
        <h1 class="lb-title">Your <em>10</em> dresses</h1>
      </div>
      <div class="lb-head-r">
        <p class="lb-lede">${data.note}</p>
        <dl class="lb-stats">
          <div class="lb-stat"><dt>Dresses searched</dt><dd>${q.searched}</dd></div>
          <div class="lb-stat"><dt>Held 4.3 stars and up</dt><dd>${q.filtered}</dd></div>
          <div class="lb-stat"><dt>Laid out here</dt><dd>10</dd></div>
          <div class="lb-stat"><dt>Price from</dt><dd>$35.99</dd></div>
        </dl>
      </div>
      <nav class="lb-filters" aria-label="Filter the lookbook by style">
        ${data.filters
          .map((f, i) => `<span class="lb-filter${i === 0 ? ' is-on' : ''}">${f}</span>`)
          .join('')}
      </nav>
    </header>
    <ol class="looks">
      ${items.map((item, i) => look(item, i)).join('')}
    </ol>
    <footer class="tray">
      <div class="tray-in">
        <p class="tray-title">Shortlist</p>
        <p class="tray-empty">Nothing shortlisted yet</p>
        <ol class="tray-slots">${items.map(slot).join('')}</ol>
        <div class="tray-open">
          <span class="tray-saved">Saved to your shortlist</span>
          <span class="tray-cta">Open all on Amazon</span>
        </div>
      </div>
    </footer>
  </div>`;
}
// The launch film's markup: six shots laid out at 1280x720 film px, every element absolutely placed so the layout
// never depends on the host's size (film.js scales the whole root). Copy, prices, creators and numbers are the ones
// pocketsflow.com publishes (fetched 2026-10-06): the demo creators (Inês Duarte, Studio Nord, Hana Park, Kofi Mensah)
// and their products, the "This week $2,480, 63 orders, +18%" answer, 65K+ people, 160+ countries, $70M+ processed.
// Product covers, the phone, the checkout and the dashboard are drawn here in HTML/CSS (film.css); the only image is
// the real Pocketsflow icon (brand/pocketsflow-icon.svg, from pocketsflow.com/icon.svg).

export const SHOTS = [0, 2.4, 5.0, 7.6, 10.2, 12.8, 15];

const ICON = new URL('../brand/pocketsflow-icon.svg', import.meta.url).href;
const ic = (d) => `<svg class="pf-ico" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  home: ic('<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>'),
  box: ic('<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>'),
  cart: ic('<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/>'),
  user: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  bank: ic('<path d="M3 10h18L12 4zM5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/>'),
  chart: ic('<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-7"/>'),
  copy: ic('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  check: ic('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  file: ic('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>'),
  lock: ic('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  link: ic('<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>'),
};
export const CURSOR = '<svg class="pf-cur" viewBox="0 0 28 28" aria-hidden="true"><path d="M5 3v19.5l5.3-5 3.6 8.3 3.4-1.5-3.6-8.1H21z" fill="#0a0a0a" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';

// product covers: each creator's product art, built from gradients and shapes
const COVER = {
  portra: `<div class="pf-cv pf-cv-portra"><i class="pf-cv-sun"></i><i class="pf-cv-hill"></i><span class="pf-cv-strip"></span><b class="pf-cv-iso">400</b></div>`,
  nord: `<div class="pf-cv pf-cv-nord">${Array.from({ length: 12 }, (_, i) => `<i class="pf-cv-n pf-cv-n${i % 4}"></i>`).join('')}</div>`,
  brush: `<div class="pf-cv pf-cv-brush"><i class="pf-cv-b1"></i><i class="pf-cv-b2"></i><i class="pf-cv-b3"></i></div>`,
  drum: `<div class="pf-cv pf-cv-drum">${Array.from({ length: 22 }, (_, i) => `<i style="height:${(18 + Math.abs(Math.sin(i * 1.7)) * 62).toFixed(0)}%"></i>`).join('')}</div>`,
  film: `<div class="pf-cv pf-cv-film"><i class="pf-cv-f1"></i><i class="pf-cv-f2"></i><i class="pf-cv-f3"></i></div>`,
};

const card = (cls, cover, name, price) => `<div class="pf-pc ${cls}">${COVER[cover]}<div class="pf-pc-b"><b>${name}</b><span>${price}</span></div></div>`;

// ---------- S1: the hook ----------
const s1 = `<div class="pf-s pf-s1">
  <div class="pf-grid"></div>
  <div class="pf-s1-cam">
    <span class="pf-tag pf-s1-tag">// pocketsflow</span>
    ${card('pf-pc1', 'portra', 'Portra 400 Preset Pack', '$29')}
    ${card('pf-pc2', 'nord', 'Nord Icons 2.0', '$49')}
    ${card('pf-pc3', 'brush', 'Procreate Brush Box', '$18')}
    ${card('pf-pc4', 'drum', 'Log Drum Vol. 3', '$39')}
    <h1 class="pf-hook"><span class="pf-l"><i>Got</i> <i>something</i></span><span class="pf-l"><i>to</i> <i class="pf-blue">sell?</i></span></h1>
  </div>
</div>`;

// ---------- S2: the product form ----------
const s2 = `<div class="pf-s pf-s2">
  <div class="pf-s2-cam">
    <div class="pf-left">
      <span class="pf-tag">// sell</span>
      <h2 class="pf-h pf-s2-h"><span class="pf-hl">Name it.</span><span class="pf-hl">Price it.</span><span class="pf-hl">Add the files.</span></h2>
    </div>
    <div class="pf-form">
      <div class="pf-form-hd"><b>New product</b><span class="pf-pill pf-form-st">Draft</span></div>
      <label class="pf-fl">Name</label>
      <div class="pf-in pf-in-name"><span class="pf-typed"></span><i class="pf-caret"></i></div>
      <div class="pf-row2">
        <div><label class="pf-fl">Price</label><div class="pf-in pf-in-price"><em>$</em><span class="pf-typed"></span><i class="pf-caret"></i><small>USD</small></div></div>
        <div><label class="pf-fl">Type</label><div class="pf-in pf-in-type">Digital download</div></div>
      </div>
      <label class="pf-fl">Files</label>
      <div class="pf-drop">
        <div class="pf-file">${I.file}<div class="pf-file-t"><b>Portra-400-Presets.zip</b><small class="pf-file-s">48 MB</small></div><span class="pf-file-ok">${I.check}</span></div>
        <div class="pf-bar"><i></i></div>
      </div>
      <div class="pf-form-ft"><span class="pf-prev">${I.link}inesonfilm.pocketsflow.com/portra-400</span><span class="pf-btn pf-pub"><span class="pf-pub-a">Publish</span><span class="pf-pub-b">${I.check}Published</span></span></div>
    </div>
  </div>
</div>`;

// ---------- S3: the creator page on a phone ----------
const s3 = `<div class="pf-s pf-s3">
  <div class="pf-s3-cam">
    <div class="pf-left">
      <span class="pf-tag">// creator page</span>
      <h2 class="pf-h pf-s3-h"><span class="pf-hl">One link.</span><span class="pf-hl pf-mut">Everything</span><span class="pf-hl pf-mut">you sell.</span></h2>
      <div class="pf-link">${I.link}<span>inesonfilm.pocketsflow.com</span><span class="pf-link-c">${I.copy}</span><span class="pf-toast">${I.check}Copied</span></div>
    </div>
    <div class="pf-phone"><div class="pf-scr"><div class="pf-scroll">
      <div class="pf-url">${I.lock}inesonfilm.pocketsflow.com</div>
      <div class="pf-ban"><i class="pf-cv-sun"></i><i class="pf-cv-hill"></i></div>
      <div class="pf-av">ID</div>
      <b class="pf-nm">Inês Duarte</b><span class="pf-bio">Film photographer in Lisbon</span>
      <span class="pf-lk">Book a portfolio review</span>
      <span class="pf-lk">Film stock cheat sheet</span>
      <span class="pf-lk">Latest roll: Alfama at dusk</span>
      <div class="pf-ph">${COVER.portra}<div class="pf-ph-b"><b>Portra 400 Preset Pack</b><span>$29</span></div><span class="pf-buy">Buy now</span></div>
      <div class="pf-ph">${COVER.film}<div class="pf-ph-b"><b>Shooting Film in 2026</b><span>Free</span></div><span class="pf-buy pf-buy-o">Get it free</span></div>
    </div><i class="pf-tap"></i></div><i class="pf-isl"></i></div>
  </div>
</div>`;

// ---------- S4: checkout in any currency ----------
const s4 = `<div class="pf-s pf-s4">
  <div class="pf-s4-cam">
    <div class="pf-left">
      <span class="pf-tag">// global checkout</span>
      <h2 class="pf-h"><span class="pf-hl">Any currency.</span><span class="pf-hl">Tax handled.</span></h2>
      <div class="pf-mor"><b>Merchant of Record</b><span>VAT, GST and sales tax calculated, collected and remitted.</span></div>
    </div>
    <div class="pf-co">
      <div class="pf-co-hd"><img src="${ICON}" alt=""/><b>Pocketsflow Checkout</b><span class="pf-co-sec">${I.lock}Secure</span></div>
      <div class="pf-co-geo"><span class="pf-co-cc">US</span><span class="pf-co-cur">USD</span><small>Paying from</small><b class="pf-co-city">Austin</b></div>
      <div class="pf-co-it">${COVER.portra}<div><b>Portra 400 Preset Pack</b><small>Inês Duarte</small></div><span class="pf-roll pf-co-p"></span></div>
      <div class="pf-co-ln"><span>Subtotal</span><span class="pf-roll pf-co-sub"></span></div>
      <div class="pf-co-ln"><span class="pf-co-taxl"></span><span class="pf-roll pf-co-tax"></span></div>
      <div class="pf-co-ln pf-co-tot"><span>Total</span><span class="pf-roll pf-co-total"></span></div>
      <div class="pf-ap"><span class="pf-ap-a">Pay with Apple Pay</span><span class="pf-ap-b">${I.check}Paid</span></div>
      <div class="pf-co-alt"><span>Card</span><span>Google Pay</span><span>PayPal</span></div>
    </div>
    <div class="pf-sales">
      <div class="pf-sale"><i></i><span>Tokyo</span><b>¥4,840</b></div>
      <div class="pf-sale"><i></i><span>Berlin</span><b>€32.13</b></div>
      <div class="pf-sale"><i></i><span>London</span><b>£27.60</b></div>
      <div class="pf-sale"><i></i><span>Austin</span><b>$31.39</b></div>
    </div>
  </div>
</div>`;

// ---------- S5: the dashboard ----------
const FEED = [
  ['Order', 'Portra 400 Preset Pack', '$29.00', 'Tokyo'],
  ['Order', 'Nord Icons 2.0', '$49.00', 'Berlin'],
  ['Subscriber', 'Producer Circle', '$12/mo', 'Accra'],
  ['Payout', 'Sent to bank •• 4821', '$2,184.60', 'Friday'],
];
const s5 = `<div class="pf-s pf-s5">
  <div class="pf-s5-cam">
    <div class="pf-left">
      <span class="pf-tag">// analytics</span>
      <h2 class="pf-h"><span class="pf-hl">You watch</span><span class="pf-hl pf-blue">it flow.</span></h2>
    </div>
    <div class="pf-db">
      <div class="pf-db-side"><div class="pf-db-br"><img src="${ICON}" alt=""/><b>Pocketsflow</b></div>
        <span class="pf-nav on">${I.home}Home</span><span class="pf-nav">${I.box}Products</span><span class="pf-nav">${I.cart}Orders</span>
        <span class="pf-nav">${I.user}Customers</span><span class="pf-nav">${I.chart}Analytics</span><span class="pf-nav">${I.bank}Payouts</span></div>
      <div class="pf-db-main">
        <div class="pf-db-hd"><b>This week</b><span class="pf-pill">Sep 29 to Oct 5</span></div>
        <div class="pf-kpis">
          <div class="pf-kpi"><small>Revenue</small><b class="pf-k-rev">$0</b><em>+18%</em></div>
          <div class="pf-kpi"><small>Orders</small><b class="pf-k-ord">0</b><em>+11</em></div>
          <div class="pf-kpi"><small>Page conversion</small><b class="pf-k-cv">0.0%</b><em>+0.6</em></div>
        </div>
        <div class="pf-chart"><svg viewBox="0 0 520 180" preserveAspectRatio="none"><defs><linearGradient id="pfg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2563eb" stop-opacity=".22"/><stop offset="1" stop-color="#2563eb" stop-opacity="0"/></linearGradient></defs>
          <path class="pf-ch-grid" d="M0 45H520M0 90H520M0 135H520"/>
          <path class="pf-ch-area" d="M0 150 C40 146 60 128 87 124 S140 132 173 110 S230 70 260 84 S320 96 347 64 S400 44 433 50 S490 22 520 14 V180 H0Z" fill="url(#pfg)"/>
          <path class="pf-ch-line" pathLength="1" d="M0 150 C40 146 60 128 87 124 S140 132 173 110 S230 70 260 84 S320 96 347 64 S400 44 433 50 S490 22 520 14"/>
          <circle class="pf-ch-dot" r="5" cx="520" cy="14"/></svg>
          <div class="pf-ch-x"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div>
      </div>
      <div class="pf-db-feed"><b class="pf-feed-h"><i></i>Live</b>${FEED.map(([k, n, v, w]) => `<div class="pf-fd pf-fd-${k.toLowerCase()}"><span class="pf-fd-k">${k}</span><b>${n}</b><span class="pf-fd-v">${v}</span><small>${w}</small></div>`).join('')}</div>
    </div>
  </div>
</div>`;

// ---------- S6: the lockup ----------
const s6 = `<div class="pf-s pf-s6">
  <div class="pf-s6-cam">
    <div class="pf-lock"><img class="pf-lock-ic" src="${ICON}" alt=""/><b class="pf-lock-wm">Pocketsflow</b></div>
    <p class="pf-lock-line">The payment infrastructure that you deserve.</p>
    <div class="pf-stats"><span><b>65K+</b> people</span><span><b>160+</b> countries</span><span><b>$70M+</b> processed</span></div>
    <span class="pf-url-pill"><i></i>pocketsflow.com</span>
  </div>
</div>`;

export const FILM_HTML = `<div class="pf-film">${s1}${s2}${s3}${s4}${s5}${s6}<div class="pf-curw">${CURSOR}</div></div>`;

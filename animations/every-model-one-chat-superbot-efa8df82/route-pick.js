// The variant selector: each link reloads the ad on one routing of the burger ask (chat.js reads ?route=), keeping
// every other query param (?t=, ?play=) as it is.
(() => {
  const q = new URLSearchParams(location.search);
  const cur = q.get('route') || 'doordash';
  document.querySelectorAll('.route-pick a').forEach((a) => {
    const p = new URLSearchParams(q);
    p.set('route', a.dataset.route);
    a.href = '?' + p.toString();
    a.setAttribute('aria-current', String(a.dataset.route === cur));
  });
})();

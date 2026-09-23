/* Waffle Rank
   A static waffle photo gallery: rate pictures from 1 to 5 syrup drops,
   upload your own, and keep a live leaderboard. No backend, no build step.
   Photos are seeded from Wikimedia Commons (see CREDITS.txt); everything a
   visitor does is stored in localStorage. */

(function () {
  'use strict';

  var STORE_KEY = 'waffleRank.v1';
  var VERSION = 1;
  var MAX_EDGE = 1200;
  var JPEG_QUALITY = 0.82;
  var LEADER_LIMIT = 5;

  var DROP = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-drop"/></svg>';

  /* ---------------------------------------------------------------- seeds */

  var SEEDS = [
    {
      id: 'berlin-cherry-sundae',
      name: 'Berlin Cherry Sundae',
      note: 'Hot cherries, vanilla ice cream and a small tower of cream over one waffle.',
      src: 'img/berlin-waffle-ice-cream.jpg',
      author: 'Susanne Nilsson',
      license: 'CC BY-SA 2.0',
      page: 'https://commons.wikimedia.org/wiki/File:Berlin_Waffle_with_ice_cream.jpg',
      base: { count: 24, sum: 111 },
      addedAt: '2026-09-02T09:10:00Z'
    },
    {
      id: 'double-belgian-chocolate',
      name: 'Double Belgian Chocolate',
      note: 'Chocolate in the batter, chocolate on top. A two front chocolate approach.',
      src: 'img/belgian-chocolate-waffles.jpg',
      author: 'Gpkp',
      license: 'CC BY-SA 4.0',
      page: 'https://commons.wikimedia.org/wiki/File:Belgian_chocolate_waffles_(2026)_02.jpg',
      base: { count: 19, sum: 84 },
      addedAt: '2026-09-05T11:40:00Z'
    },
    {
      id: 'theme-park-trio',
      name: 'Theme Park Trio',
      note: 'Three little ears of waffle with fruit, sausages and a syrup packet nearby.',
      src: 'img/mickey-waffles.jpg',
      author: 'Slamforeman',
      license: 'CC BY 4.0',
      page: 'https://commons.wikimedia.org/wiki/File:Mickey_Mouse_Waffles_with_Fruit_and_Sausages.jpg',
      base: { count: 31, sum: 132 },
      addedAt: '2026-08-28T14:05:00Z'
    },
    {
      id: 'georgia-diner-classic',
      name: 'Georgia Diner Classic',
      note: 'One plain grid, one pat of butter, syrup arriving in a small warm jug.',
      src: 'img/diner-waffle-plate.jpg',
      author: 'Michael Rivera',
      license: 'CC BY-SA 4.0',
      page: 'https://commons.wikimedia.org/wiki/File:Waffle,_Baytree_Waffle_House,_Remerton.jpg',
      base: { count: 27, sum: 126 },
      addedAt: '2026-09-08T07:25:00Z'
    },
    {
      id: 'cheddar-chive-savoury',
      name: 'Cheddar and Chive Savoury',
      note: 'Wilted spinach, sage and walnut pesto, fried eggs. Waffles with opinions.',
      src: 'img/savoury-waffle.jpg',
      author: 'Andy Li',
      license: 'CC0',
      page: 'https://commons.wikimedia.org/wiki/File:Savoury_Waffle_-_Malt_Cafe_2025-11-30.jpg',
      base: { count: 14, sum: 65 },
      addedAt: '2026-09-10T12:00:00Z'
    },
    {
      id: 'pistachio-raspberry-fold',
      name: 'Pistachio Raspberry Fold',
      note: 'Folded waffle, pistachio cream inside, fresh raspberries doing the bright thing.',
      src: 'img/pistachio-raspberry-waffle.jpg',
      author: 'Attonio',
      license: 'CC BY-SA 4.0',
      page: 'https://commons.wikimedia.org/wiki/File:Pistachio_and_raspberry_waffle.jpg',
      base: { count: 22, sum: 101 },
      addedAt: '2026-09-12T16:30:00Z'
    },
    {
      id: 'powdered-strawberry-morning',
      name: 'Powdered Strawberry Morning',
      note: 'Strawberries and confectioner sugar, photographed in soft hotel window light.',
      src: 'img/strawberry-sugar-waffle.jpg',
      author: 'Ralph Daily',
      license: 'CC BY 2.0',
      page: 'https://commons.wikimedia.org/wiki/File:Waffle_with_strawberries_and_confectioner%27s_sugar.jpg',
      base: { count: 35, sum: 151 },
      addedAt: '2026-08-21T08:15:00Z'
    },
    {
      id: 'egg-waffle-taco',
      name: 'Egg Waffle Taco',
      note: 'A sweet bubble waffle living dangerously as a taco shell in a Tokyo cafe.',
      src: 'img/egg-waffle-taco.jpg',
      author: 'Syced',
      license: 'CC0',
      page: 'https://commons.wikimedia.org/wiki/File:Egg_waffle_taco_meat_burger.jpg',
      base: { count: 12, sum: 52 },
      addedAt: '2026-09-14T10:45:00Z'
    },
    {
      id: 'granola-breakfast-stack',
      name: 'Granola Breakfast Stack',
      note: 'Banana, Greek yoghurt, granola, honey and pumpkin seeds on an American waffle.',
      src: 'img/granola-breakfast-waffle.jpg',
      author: 'Andy Li',
      license: 'CC0',
      page: 'https://commons.wikimedia.org/wiki/File:%22granola_breakfast%22_waffle_-_Wafflemeister_2024-08-25.jpg',
      base: { count: 17, sum: 74 },
      addedAt: '2026-09-16T09:05:00Z'
    },
    {
      id: 'himeji-street-waffle',
      name: 'Himeji Street Waffle',
      note: 'Chosen from the case in the shop window on Otemae street and eaten walking.',
      src: 'img/waffle-shop-counter.jpg',
      author: 'DimiTalen',
      license: 'CC0',
      page: 'https://commons.wikimedia.org/wiki/File:Manneken_Belgian_waffle_shop,_Otemae-dori,_Himeji,_2016.jpg',
      base: { count: 9, sum: 41 },
      addedAt: '2026-09-18T13:20:00Z'
    }
  ];

  /* -------------------------------------------------------------- helpers */

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function slugFile(name) {
    return String(name || 'waffle').toLowerCase().replace(/\.[a-z0-9]+$/, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'waffle';
  }

  function nowIso() { return new Date().toISOString(); }

  /* -------------------------------------------------------------- storage */

  var memoryState = null;

  function storage() {
    try {
      var probe = '__waffleRankProbe';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return window.localStorage;
    } catch (err) {
      return null;
    }
  }

  var store = storage();

  function blankState() { return { v: VERSION, ratings: {}, uploads: [], sort: 'top' }; }

  function readState() {
    if (!store) {
      if (!memoryState) memoryState = blankState();
      return memoryState;
    }
    var raw = null;
    try { raw = store.getItem(STORE_KEY); } catch (err) { raw = null; }
    if (!raw) return blankState();
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.v !== VERSION) return blankState();
      return {
        v: VERSION,
        ratings: parsed.ratings && typeof parsed.ratings === 'object' ? parsed.ratings : {},
        uploads: Array.isArray(parsed.uploads) ? parsed.uploads : [],
        sort: parsed.sort || 'top'
      };
    } catch (err) {
      return blankState();
    }
  }

  function saveState() {
    if (!store) { memoryState = state; return true; }
    try {
      store.setItem(STORE_KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      return false;
    }
  }

  var state = readState();
  var persistent = !!store;

  /* ------------------------------------------------------- gallery + math */

  function uploadToPhoto(item) {
    return {
      id: item.id,
      name: item.name,
      note: item.note || '',
      src: item.src,
      author: item.author || 'You',
      license: '',
      page: '',
      base: { count: 0, sum: 0 },
      addedAt: item.addedAt || nowIso(),
      mine: true
    };
  }

  function photos() { return SEEDS.concat(state.uploads.map(uploadToPhoto)); }

  function statsFor(photo) {
    var mine = state.ratings[photo.id];
    var count = photo.base.count + (mine ? 1 : 0);
    var sum = photo.base.sum + (mine || 0);
    var avg = count ? sum / count : 0;
    return { count: count, sum: sum, avg: avg, mine: mine || 0 };
  }

  function totals() {
    var list = photos();
    var count = 0, sum = 0;
    list.forEach(function (p) { var s = statsFor(p); count += s.count; sum += s.sum; });
    return { photos: list.length, ratings: count, avg: count ? sum / count : 0 };
  }

  function sorted() {
    var list = photos();
    var sort = state.sort;
    list.sort(function (a, b) {
      var sa = statsFor(a), sb = statsFor(b);
      if (sort === 'rated') {
        if (sb.count !== sa.count) return sb.count - sa.count;
        if (sb.avg !== sa.avg) return sb.avg - sa.avg;
      } else if (sort === 'new') {
        if (a.addedAt !== b.addedAt) return a.addedAt < b.addedAt ? 1 : -1;
      } else {
        if (sb.avg !== sa.avg) return sb.avg - sa.avg;
        if (sb.count !== sa.count) return sb.count - sa.count;
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  }

  function matches(photo, term) {
    if (!term) return true;
    var hay = (photo.name + ' ' + photo.author + ' ' + (photo.note || '')).toLowerCase();
    return hay.indexOf(term) !== -1;
  }

  function find(id) {
    var list = photos();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  /* ------------------------------------------------------------- snippets */

  function avgText(s) { return s.count ? s.avg.toFixed(1) : 'new'; }

  function countText(n) { return n === 0 ? 'no ratings yet' : n === 1 ? '1 rating' : n + ' ratings'; }

  function meter(value) {
    var pct = Math.max(0, Math.min(100, (value / 5) * 100));
    var five = DROP + DROP + DROP + DROP + DROP;
    return '<span class="meter" style="--fill:' + pct.toFixed(1) + '%" role="img" aria-label="' +
      value.toFixed(1) + ' out of 5 syrup drops">' +
      '<span class="ghost" aria-hidden="true">' + five + '</span>' +
      '<span class="fill" aria-hidden="true">' + five + '</span></span>';
  }

  function rateWidget(photo, mine, big) {
    var html = '<div class="rate' + (big ? ' is-big' : '') + '" role="radiogroup" aria-label="Rate ' + esc(photo.name) + '">';
    for (var i = 1; i <= 5; i++) {
      html += '<button class="drop-btn' + (mine >= i ? ' is-on' : '') + '" type="button" role="radio"' +
        ' aria-checked="' + (mine === i ? 'true' : 'false') + '"' +
        ' data-id="' + esc(photo.id) + '" data-score="' + i + '"' +
        ' aria-label="' + i + ' out of 5 syrup drops" title="' + i + ' out of 5">' + DROP + '</button>';
    }
    return html + '</div>';
  }

  function cardHtml(photo, rank) {
    var s = statsFor(photo);
    var badge = photo.mine ? '<span class="badge is-mine">YOURS</span>' : '<span class="badge">#' + rank + '</span>';
    var mineTag = s.mine ? '<span class="mine-tag">your ' + s.mine + ' of 5</span>' : '';
    return '' +
      '<article class="card' + (photo.mine ? ' is-mine' : '') + '" data-id="' + esc(photo.id) + '">' +
        '<div class="shot">' +
          '<img src="' + esc(photo.src) + '" alt="' + esc(photo.name + ', waffle photo by ' + photo.author) + '" loading="lazy">' +
          badge +
          '<button class="open" type="button" data-open="' + esc(photo.id) + '" aria-label="Open ' + esc(photo.name) + '"></button>' +
        '</div>' +
        '<div class="card-body">' +
          '<h3>' + esc(photo.name) + '</h3>' +
          '<p class="credit">photo by ' + esc(photo.author) + (photo.license ? ', ' + esc(photo.license) : '') + '</p>' +
          '<div class="score">' + meter(s.avg) +
            '<span class="avg">' + avgText(s) + '</span>' +
            '<span class="count">' + countText(s.count) + '</span>' + mineTag +
          '</div>' +
          rateWidget(photo, s.mine, false) +
        '</div>' +
      '</article>';
  }

  function leaderHtml(photo, place) {
    var s = statsFor(photo);
    return '' +
      '<li>' +
        '<button class="leader" type="button" data-open="' + esc(photo.id) + '">' +
          '<span class="place">' + place + '</span>' +
          '<img src="' + esc(photo.src) + '" alt="" loading="lazy">' +
          '<span class="leader-name"><strong>' + esc(photo.name) + '</strong><small>photo by ' + esc(photo.author) + '</small></span>' +
          '<span class="leader-score"><b>' + avgText(s) + '</b><span>' + countText(s.count) + '</span></span>' +
        '</button>' +
      '</li>';
  }

  /* -------------------------------------------------------------- render */

  var searchTerm = '';

  function render() {
    var list = sorted();
    var filtered = list.filter(function (p) { return matches(p, searchTerm); });
    var rankOf = {};
    list.forEach(function (p, i) { rankOf[p.id] = i + 1; });

    var t = totals();
    $('#stat-photos').textContent = t.photos;
    $('#stat-ratings').textContent = t.ratings;
    $('#stat-avg').textContent = t.avg.toFixed(1);

    $('#leaders').innerHTML = filtered.slice(0, LEADER_LIMIT)
      .map(function (p, i) { return leaderHtml(p, i + 1); }).join('') ||
      '<li><p class="leaders-note">Nothing matches that search yet.</p></li>';

    $('#cards').innerHTML = filtered.map(function (p) { return cardHtml(p, rankOf[p.id]); }).join('');
    $('#empty').hidden = filtered.length > 0;

    $$('.seg-btn').forEach(function (btn) {
      var on = btn.getAttribute('data-sort') === state.sort;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    var extra = state.uploads.length ? ' plus ' + state.uploads.length + ' of your own.' : '';
    $('#hero-note').textContent = SEEDS.length + ' seeded waffles are already in the running' + extra;
    $('#hero-note').hidden = false;
  }

  /* --------------------------------------------------------------- toast */

  var toastTimer = null;

  function toast(message) {
    var el = $('#toast');
    el.textContent = message;
    el.classList.add('is-on');
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { el.classList.remove('is-on'); }, 2400);
  }

  /* --------------------------------------------------------------- modal */

  var openOverlay = null;
  var lastFocus = null;

  function overlayEl(id) { return id === 'detail' ? $('#detail-overlay') : $('#add-overlay'); }

  function showOverlay(which) {
    if (openOverlay) hideOverlay();
    lastFocus = document.activeElement;
    openOverlay = which;
    var el = overlayEl(which);
    el.hidden = false;
    document.body.style.overflow = 'hidden';
    var first = $('.sheet', el).querySelector('input, button, [href], [tabindex]:not([tabindex="-1"])');
    if (first) first.focus();
  }

  function hideOverlay() {
    if (!openOverlay) return;
    var el = overlayEl(openOverlay);
    el.hidden = true;
    openOverlay = null;
    document.body.style.overflow = '';
    if (openOverlay === null && lastFocus && document.contains(lastFocus)) lastFocus.focus();
    lastFocus = null;
  }

  function trapFocus(event) {
    if (!openOverlay || event.key !== 'Tab') return;
    var sheet = $('.sheet', overlayEl(openOverlay));
    var items = $$('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])', sheet)
      .filter(function (n) { return n.offsetParent !== null; });
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  /* -------------------------------------------------- add waffle overlay */

  var pending = null;

  function setPending(dataUrl, label, warn) {
    pending = dataUrl ? { src: dataUrl, label: label } : null;
    var preview = $('#drop-preview');
    var copy = $('#drop-copy');
    if (dataUrl) {
      preview.src = dataUrl;
      preview.hidden = false;
      copy.hidden = true;
    } else {
      preview.hidden = true;
      preview.removeAttribute('src');
      copy.hidden = false;
    }
    var hint = $('#add-hint');
    hint.textContent = warn || 'The photo is resized to 1200 pixels and saved in this browser only.';
    hint.classList.toggle('is-warn', !!warn);
    $('#btn-save').disabled = !dataUrl;
  }

  function openAdd() {
    setPending(null, '');
    $('#name').value = state.uploads.length && state.uploads[0].author ? state.uploads[0].author : '';
    showOverlay('add');
  }

  function readPhoto(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { setPending(null, '', 'That file is not an image. Choose a JPG, PNG or WebP photo.'); return; }
    var reader = new FileReader();
    reader.onerror = function () { setPending(null, '', 'That photo could not be read. Try another one.'); };
    reader.onload = function () {
      var img = new Image();
      img.onerror = function () { setPending(null, '', 'That photo could not be opened. Try another one.'); };
      img.onload = function () {
        var scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        var w = Math.max(1, Math.round(img.width * scale));
        var h = Math.max(1, Math.round(img.height * scale));
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        var dataUrl;
        try { dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY); }
        catch (err) { setPending(null, '', 'That photo could not be prepared. Try another one.'); return; }
        setPending(dataUrl, file.name);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* A descriptive file name ("blueberry-stack.jpg") becomes the title.
     Camera names (IMG_1234, DSC0042, PXL_2026...) carry no meaning, so those
     fall back to the kitchen name: "Test Kitchen's waffle". */
  function uploadName(fileLabel, author) {
    var words = slugFile(fileLabel || '').replace(/-/g, ' ').trim();
    var meaningful = words
      .replace(/\b(img|image|dsc|dscn|dcim|pxl|mvimg|photo|pic|screenshot|screen|shot|whatsapp|signal|copy|edited)\b/g, '')
      .replace(/\d+/g, '').trim();
    if (meaningful.length < 3) {
      return author && author !== 'You' ? author + '’s waffle' : 'My waffle';
    }
    var title = words.charAt(0).toUpperCase() + words.slice(1);
    return /\bwaffles?\b/i.test(title) ? title : title + ' waffle';
  }

  function addPhoto() {
    if (!pending) return null;
    var author = $('#name').value.trim() || 'You';
    var id = 'mine-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    var photo = {
      id: id,
      name: uploadName(pending.label, author),
      note: 'Uploaded from this browser.',
      src: pending.src,
      author: author,
      addedAt: nowIso()
    };
    var before = state.uploads.slice();
    state.uploads.unshift(photo);
    if (!saveState()) {
      state.uploads = before;
      setPending(pending.src, pending.label, 'This browser is out of room for another photo. Remove one first, or pick a smaller picture.');
      return null;
    }
    render();
    toast('Added. Give it a score.');
    return photo;
  }

  /* ------------------------------------------------------- detail overlay */

  function openDetail(id) {
    var photo = find(id);
    if (!photo) return;
    var s = statsFor(photo);
    var credit = photo.mine
      ? 'Uploaded by ' + esc(photo.author)
      : 'photo by <a href="' + esc(photo.page) + '" target="_blank" rel="noopener noreferrer">' +
        esc(photo.author) + '</a>, ' + esc(photo.license) + ' (Wikimedia Commons)';
    var html = '' +
      '<img src="' + esc(photo.src) + '" alt="' + esc(photo.name + ', waffle photo by ' + photo.author) + '">' +
      '<div class="detail-side">' +
        '<h3>' + esc(photo.name) + '</h3>' +
        '<p class="credit">' + credit + '</p>' +
        '<p class="detail-note">' + esc(photo.note || '') + '</p>' +
        '<div class="score">' + meter(s.avg) + '<span class="avg">' + avgText(s) + '</span>' +
          '<span class="count">' + countText(s.count) + '</span>' +
          (s.mine ? '<span class="mine-tag">your ' + s.mine + ' of 5</span>' : '') + '</div>' +
        '<p class="detail-note" id="detail-pick">' +
          (s.mine ? 'You gave this ' + s.mine + ' syrup drops. Tap another number to change it.'
                  : 'Your score is private to this browser.') + '</p>' +
        rateWidget(photo, s.mine, true) +
        '<div class="detail-actions">' +
          (photo.mine ? '<button class="btn btn-quiet" type="button" data-delete="' + esc(photo.id) + '">Delete this waffle</button>' : '') +
          '<a class="btn btn-ghost" href="' + esc(photo.src) + '" target="_blank" rel="noopener noreferrer">Open the photo</a>' +
        '</div>' +
      '</div>';
    $('#detail-body').innerHTML = html;
    if (openOverlay !== 'detail') showOverlay('detail');
  }

  function refreshDetail(id) {
    if (openOverlay === 'detail') openDetail(id);
  }

  /* ---------------------------------------------------------------- rating */

  var pulseTarget = null;

  function rate(id, score) {
    var photo = find(id);
    if (!photo) return false;
    var was = state.ratings[id];
    if (was === score) {
      delete state.ratings[id];
      toast('Score cleared from ' + photo.name + '.');
    } else {
      state.ratings[id] = score;
      toast('Saved: ' + photo.name + ' gets ' + score + ' of 5.');
    }
    pulseTarget = { id: id, score: score };
    if (!saveState()) {
      if (was) state.ratings[id] = was; else delete state.ratings[id];
      toast('Could not save that score in this browser.');
      return false;
    }
    render();
    refreshDetail(id);
    applyPulse();
    document.dispatchEvent(new CustomEvent('wafflerank:change', {
      detail: { id: id, score: state.ratings[id] || 0, stats: statsFor(photo) }
    }));
    return true;
  }

  function applyPulse() {
    if (!pulseTarget) return;
    var target = pulseTarget;
    pulseTarget = null;
    var sheet = openOverlay === 'detail' ? $('.sheet', overlayEl('detail')) : null;
    function pick(root) {
      return $$('.drop-btn[data-score="' + target.score + '"]', root)
        .filter(function (b) { return b.getAttribute('data-id') === target.id; })[0] || null;
    }
    var btn = (sheet && pick(sheet)) || pick(document);
    if (!btn) return;
    btn.classList.add('is-pulse');
    if (document.activeElement === document.body || document.activeElement === null) btn.focus();
    window.setTimeout(function () { btn.classList.remove('is-pulse'); }, 460);
  }

  function removePhoto(id) {
    var idx = -1;
    state.uploads.forEach(function (u, i) { if (u.id === id) idx = i; });
    if (idx === -1) return;
    var before = state.uploads[idx];
    var beforeRating = state.ratings[id];
    state.uploads.splice(idx, 1);
    delete state.ratings[id];
    if (!saveState()) {
      state.uploads.splice(idx, 0, before);
      if (beforeRating) state.ratings[id] = beforeRating;
      toast('Could not remove that waffle.');
      return;
    }
    hideOverlay();
    render();
    toast('Waffle removed.');
  }

  /* ---------------------------------------------------------------- events */

  document.addEventListener('click', function (event) {
    var t = event.target;

    var dropBtn = t.closest && t.closest('.drop-btn');
    if (dropBtn) {
      rate(dropBtn.getAttribute('data-id'), parseInt(dropBtn.getAttribute('data-score'), 10));
      return;
    }

    var open = t.closest && t.closest('[data-open]');
    if (open) { openDetail(open.getAttribute('data-open')); return; }

    var seg = t.closest && t.closest('.seg-btn');
    if (seg) { state.sort = seg.getAttribute('data-sort'); saveState(); render(); return; }

    var del = t.closest && t.closest('[data-delete]');
    if (del) { removePhoto(del.getAttribute('data-delete')); return; }

    if (t.closest && t.closest('[data-close]')) { hideOverlay(); return; }

    if (t.classList && t.classList.contains('overlay')) hideOverlay();
  });

  document.addEventListener('mouseover', function (event) {
    var btn = event.target.closest && event.target.closest('.drop-btn');
    if (!btn) return;
    var group = btn.parentElement;
    var score = parseInt(btn.getAttribute('data-score'), 10);
    $$('.drop-btn', group).forEach(function (b) {
      b.classList.toggle('is-peek', parseInt(b.getAttribute('data-score'), 10) <= score);
    });
  });

  document.addEventListener('mouseout', function (event) {
    var btn = event.target.closest && event.target.closest('.drop-btn');
    if (!btn) return;
    $$('.drop-btn', btn.parentElement).forEach(function (b) {
      if (b !== btn) b.classList.remove('is-peek');
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && openOverlay) { hideOverlay(); return; }
    trapFocus(event);

    var btn = document.activeElement;
    if (!btn || !btn.classList || !btn.classList.contains('drop-btn')) return;
    if (!/^(ArrowLeft|ArrowRight|Home|End)$/.test(event.key)) return;
    event.preventDefault();
    var current = parseInt(btn.getAttribute('data-score'), 10);
    var next = current;
    if (event.key === 'ArrowLeft') next = Math.max(1, current - 1);
    if (event.key === 'ArrowRight') next = Math.min(5, current + 1);
    if (event.key === 'Home') next = 1;
    if (event.key === 'End') next = 5;
    var group = btn.parentElement;
    var target = $('.drop-btn[data-score="' + next + '"]', group);
    if (target) target.focus();
  });

  /* Enter and Space on a drop button arrive here through the click handler above,
     so no separate key handler is needed for scoring. */

  $('#btn-add').addEventListener('click', openAdd);

  $('#btn-random').addEventListener('click', function () {
    var list = photos();
    if (!list.length) { toast('No waffles to rate yet.'); return; }
    var pick = list[Math.floor(Math.random() * list.length)];
    openDetail(pick.id);
  });

  $('#q').addEventListener('input', function (event) {
    searchTerm = event.target.value.trim().toLowerCase();
    render();
  });

  $('#file').addEventListener('change', function (event) {
    readPhoto(event.target.files && event.target.files[0]);
  });

  var drop = $('#drop');
  ['dragenter', 'dragover'].forEach(function (type) {
    drop.addEventListener(type, function (event) {
      event.preventDefault();
      drop.classList.add('is-over');
    });
  });
  ['dragleave', 'drop'].forEach(function (type) {
    drop.addEventListener(type, function (event) {
      event.preventDefault();
      drop.classList.remove('is-over');
    });
  });
  drop.addEventListener('drop', function (event) {
    var files = event.dataTransfer && event.dataTransfer.files;
    readPhoto(files && files[0]);
  });

  $('#btn-save').addEventListener('click', function () {
    var photo = addPhoto();
    if (!photo) return;
    hideOverlay();
    openDetail(photo.id);
  });

  var resetBtn = $('#btn-reset');
  var resetTimer = null;

  resetBtn.addEventListener('click', function () {
    if (!resetBtn.classList.contains('is-armed')) {
      resetBtn.classList.add('is-armed');
      resetBtn.textContent = 'Tap again to erase everything';
      resetTimer = window.setTimeout(function () {
        resetBtn.classList.remove('is-armed');
        resetBtn.textContent = 'Clear my ratings and uploads';
      }, 5000);
      return;
    }
    if (resetTimer) window.clearTimeout(resetTimer);
    resetBtn.classList.remove('is-armed');
    resetBtn.textContent = 'Clear my ratings and uploads';
    state = blankState();
    saveState();
    hideOverlay();
    render();
    toast('Cleared. The board is back to its seeded scores.');
  });

  /* ------------------------------------------------------------------ boot */

  if (!persistent) {
    toast('This browser is hiding local storage, so scores last for this visit only.');
  }

  render();

  window.WaffleRank = {
    version: VERSION,
    getState: function () { return JSON.parse(JSON.stringify(state)); },
    photos: function () { return photos().map(function (p) {
      var s = statsFor(p);
      return { id: p.id, name: p.name, author: p.author, mine: !!p.mine,
               ratings: s.count, average: Number(s.avg.toFixed(2)), yourScore: s.mine };
    }); },
    rate: rate,
    open: openDetail,
    reset: function () { state = blankState(); saveState(); render(); },
    toast: toast
  };
})();
/* Huddle marketing site – behaviour. No dependencies. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Sticky nav border */
  var nav = $('#nav');
  var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile menu */
  var menuBtn = $('#menuBtn'), menu = $('#mobileMenu');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      var open = menu.getAttribute('data-open') === 'true';
      menu.setAttribute('data-open', String(!open));
      menuBtn.setAttribute('aria-expanded', String(!open));
      menuBtn.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    });
    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () {
        menu.setAttribute('data-open', 'false');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Tabs */
  var tabs = $$('[role="tab"]');
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      var p = document.getElementById(t.getAttribute('aria-controls'));
      if (p) p.setAttribute('data-active', String(on));
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? i - 1 : null;
      if (n === null) return;
      e.preventDefault();
      var nt = tabs[(n + tabs.length) % tabs.length];
      nt.focus(); selectTab(nt);
    });
  });

  /* ROI calculator */
  var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var fmtK = function (n) {
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e4) return '$' + Math.round(n / 1000) + 'k';
    return fmt(n);
  };
  var r = { p: $('#r-practices'), h: $('#r-hours'), r: $('#r-rate'), a: $('#r-ar') };
  function calc() {
    if (!r.p) return;
    var practices = +r.p.value, hours = +r.h.value, rate = +r.r.value, ar = +r.a.value;
    $('#o-practices').value = practices;
    $('#o-hours').value = hours;
    $('#o-rate').value = fmt(rate);
    $('#o-ar').value = fmt(ar);
    $('#o-pcount').textContent = practices;
    var hrsMonth = practices * hours * 4.33 * 0.70;          // 70% of "finding" time recovered
    var hrsValue = hrsMonth * 12 * rate;
    var arValue = practices * ar * 12 * 0.15 * 0.60;         // 15% more aged AR worked, 60% collected
    $('#o-hrs').textContent = Math.round(hrsMonth).toLocaleString('en-US') + ' hrs';
    $('#o-hval').textContent = fmt(hrsValue);
    $('#o-arval').textContent = fmt(arValue);
    $('#o-total').innerHTML = fmtK(hrsValue + arValue) + '<small>/ year</small>';
  }
  Object.keys(r).forEach(function (k) { if (r[k]) r[k].addEventListener('input', calc); });
  calc();

  /* Count-up for the stats band */
  var counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, end = +el.getAttribute('data-count'), start = performance.now(), dur = 1100;
        (function step(now) {
          var t = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(end * e).toLocaleString('en-US');
          if (t < 1) requestAnimationFrame(step);
        })(start);
        cio.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* Demo form: front-end only until a form endpoint is wired up */
  var form = $('#demoForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var required = $$('[required]', form), ok = true;
      required.forEach(function (f) {
        var valid = f.checkValidity();
        f.style.outline = valid ? '' : '2px solid var(--accent)';
        if (!valid) ok = false;
      });
      if (!ok) { required.filter(function (f) { return !f.checkValidity(); })[0].focus(); return; }
      /* TODO (launch): POST the FormData to your form endpoint (Formspree, Netlify Forms, HubSpot, or your own API). */
      form.setAttribute('data-sent', 'true');
    });
  }

  var y = $('#year'); if (y) y.textContent = String(new Date().getFullYear());
})();

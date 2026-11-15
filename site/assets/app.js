/* Huddle marketing site, preview (website/next/): behaviour. Forked from ../assets/app.js; same ids and queue data.
   Changes: no middle-dot strings, the progress bar moves by transform, the mark pulses by transform only,
   the form marks invalid fields with aria-invalid. No dependencies. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    var closeMenu = function () { menu.setAttribute('data-open', 'false'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Open menu'); };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.getAttribute('data-open') === 'true') { closeMenu(); menuBtn.focus(); } });
    /* widening past the phone layout closes the menu, so its links never show twice */
    var wide = window.matchMedia('(min-width: 60.0625rem)'), onWide = function (e) { if (e.matches) closeMenu(); };
    if (wide.addEventListener) wide.addEventListener('change', onWide); else if (wide.addListener) wide.addListener(onWide);
    $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
  }

  /* ---------- Hero: interactive queue demo ---------- */
  var QUEUES = {
    ar: {
      title: 'Insurance AR: 23 open claims', total: 23,
      hint: 'One press. Huddle checks the payer portals, pulls the EOBs, fixes the codes and resubmits. You get the few that need a human.',
      items: [
        { t: 'Delta Dental, D2740 crown, $1,185', s: 'Denied: missing attachment', d: 'Attached PA x-ray and narrative from the chart. Resubmitted.', r: 'done' },
        { t: 'Horizon NJ Health, D4341, $212 short', s: 'Underpaid vs. contract', d: 'Fee schedule mismatch found. Appeal filed at the contracted rate.', r: 'done' },
        { t: 'Cigna, D0274, $96', s: 'No response, 47 days', d: 'Status pulled from portal: in process. Follow-up set for day 60.', r: 'done' },
        { t: 'MetLife, D6010 implant, $2,400', s: 'Denied: not a covered benefit', d: 'Plan excludes implants. Patient conversation and financing offer drafted for you.', r: 'human' },
        { t: 'Aetna, D2392, $240', s: 'Denied: wrong tooth number', d: 'Tooth #19 corrected from the chart. Corrected claim sent.', r: 'done' },
        { t: 'Guardian, D7210, $310', s: 'Needs narrative', d: 'Narrative drafted from the clinical note. Resubmitted.', r: 'done' },
        { t: 'United Concordia, D1110, $98', s: 'Frequency limit', d: 'Second cleaning in 6 months. Patient balance created with text offer.', r: 'done' },
        { t: 'Medicaid, D2930, $180', s: 'Denied: missing prior auth', d: 'No auth on file and service already rendered. Needs your call on a write-off or appeal.', r: 'human' }
      ],
      more: 15, moreDone: 13
    },
    bal: {
      title: 'Patient balances: 18 accounts', total: 18,
      hint: 'One press. Statements go out, payment plans and financing are offered by text, and payments post back to your PMS.',
      items: [
        { t: 'Sam G., $1,147, 42 days', s: 'Balance after insurance', d: 'Statement sent by text and email with a two-tap pay link.', r: 'done' },
        { t: 'Casey D., $557, 61 days', s: 'No response to statement 2', d: 'Offered a 3-month plan by text. Accepted. First payment posted.', r: 'done' },
        { t: 'Avery C., $951, 15 days', s: 'Copay not collected', d: 'Paid in full from the text link at 7:12 PM. Posted to the ledger.', r: 'done' },
        { t: 'Jordan H., $2,396, 90+ days', s: 'Disputed charge', d: 'Patient says insurance should have paid. Claim history pulled. Needs a conversation.', r: 'human' },
        { t: 'Taylor B., $1,170, 28 days', s: 'Payment plan requested', d: 'Sunbit pre-qualification sent. Approved for $1,170 over 12 months.', r: 'done' },
        { t: 'Riley H., $528, 35 days', s: 'Left voicemail twice', d: 'Text sent with the statement. Paid $528.', r: 'done' },
        { t: 'Morgan C., $1,427, 70 days', s: 'Returned mail', d: 'Address updated from the insurance file. Statement re-sent.', r: 'done' },
        { t: 'Alex B., $107, 12 days', s: 'Small balance', d: 'Under your $150 threshold. Added to the next statement cycle.', r: 'done' }
      ],
      more: 10, moreDone: 9
    },
    pa: {
      title: 'Pre-auths: 9 requests', total: 9,
      hint: 'One press. Pre-determinations go out with the x-rays and narrative attached the first time, and approvals land back on the treatment plan.',
      items: [
        { t: 'Crown #19, Delta, $1,050', s: 'Not yet submitted', d: 'PA x-ray, perio chart and narrative attached. Submitted.', r: 'done' },
        { t: 'Implant #30, MetLife, $2,400', s: 'Info requested', d: 'Payer asked for the panoramic. Pulled from imaging and sent.', r: 'done' },
        { t: 'Scaling 4 quads, Horizon, $880', s: 'Not yet submitted', d: 'Perio charting attached with pocket depths. Submitted.', r: 'done' },
        { t: 'Bridge #3–5, Cigna, $3,200', s: 'Denied: alternate benefit', d: 'Payer will cover a partial instead. Patient needs the choice explained. Drafted for you.', r: 'human' },
        { t: 'Night guard, Aetna, $450', s: 'Approved', d: 'Approval posted to the treatment plan. Patient texted two openings.', r: 'done' },
        { t: 'Extraction #17, Medicaid, $220', s: 'Not yet submitted', d: 'X-ray attached. Submitted.', r: 'done' }
      ],
      more: 3, moreDone: 3
    },
    oc: {
      title: 'Open Chair: 6 openings tomorrow', total: 6,
      hint: 'One press. Open Chair calls the patients who are due, offers each of them two real times, books the one they pick, and texts the ones who didn\'t answer. You get the chairs filled and the one caller who asked for you.',
      items: [
        { t: 'Thu 9:20, hygiene, Dr. Lopez', s: 'Open since a cancellation', d: 'Called Maria R., due 4 months. "Thursday at nine twenty works." Booked, reminder sent.', r: 'done' },
        { t: 'Thu 10:20, hygiene', s: 'Open', d: 'Called 4 due patients. Two voicemails texted with "reply 1 or 2". Priya L. replied 1. Booked.', r: 'done' },
        { t: 'Thu 2:00, hygiene, Dr. Chen', s: 'Open', d: 'Called James T., due 7 months. Booked with Dr. Chen. Insurance card reminder read back.', r: 'done' },
        { t: 'Fri 8:00, hygiene', s: 'Open', d: 'Dana K. asked about a balance before booking. Callback logged for the manager at 9 AM. Needs you.', r: 'human' },
        { t: 'Fri 11:40, short visit', s: 'Open', d: 'Alex B. mentioned a sore tooth. Booked the short visit instead of a cleaning, nothing clinical discussed.', r: 'done' },
        { t: 'Fri 3:20, hygiene', s: 'Open', d: 'Three patients reached, none free Friday. Two accepted next week instead. Slot still open; two more being texted.', r: 'human' }
      ],
      more: 0, moreDone: 0
    }
  };
  var list = $('#demoList'), runBtn = $('#runQueue'), runLabel = $('#runLabel'), runBar = $('#runBar'), demoSum = $('#demoSum'), demoTitle = $('#demoTitle'), runHint = $('#runHint');
  var current = 'ar', running = false, timers = [];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function render(q) {
    var Q = QUEUES[q]; current = q;
    timers.forEach(clearTimeout); timers = []; running = false;
    if (ball) { ball.getAnimations().forEach(function (a) { a.cancel(); }); ball.hidden = true; }
    demoTitle.textContent = Q.title; runHint.textContent = Q.hint;
    runLabel.textContent = 'Work this queue'; runBtn.disabled = false; runBar.style.transform = 'scaleX(0)';
    demoSum.innerHTML = '<span class="fig">0</span> resolved, <span class="fig">0</span> need you';
    list.innerHTML = Q.items.map(function (it) {
      return '<li><span class="ck"></span><span><b>' + esc(it.t) + '</b><small class="st">' + esc(it.s) + '</small></span><span class="chip wait">Open</span></li>';
    }).join('') + (Q.more ? '<li class="more"><span class="ck"></span><span><b>' + Q.more + ' more</b><small class="st">Waiting</small></span><span class="chip wait">Open</span></li>' : '');
  }
  /* The orange mark becomes a ball and hops down the queue */
  var demoEl = $('#demo'), ball = null;
  function ensureBall() {
    if (ball) return ball;
    ball = document.createElement('div'); ball.className = 'ball'; ball.hidden = true;
    ball.innerHTML = '<svg class="hd-mark" viewBox="0 0 32 32" aria-hidden="true"><rect class="hd-tile" width="32" height="32" rx="8" fill="var(--mark-bg)"/><g class="hd-h" fill="var(--mark-glyph)" transform="translate(5.6 5.6) scale(.65)"><circle cx="9" cy="5.6" r="3.4"/><circle cx="23" cy="5.6" r="3.4"/><rect x="5.8" y="10.4" width="6.4" height="19.6" rx="3.2"/><rect x="19.8" y="10.4" width="6.4" height="19.6" rx="3.2"/><rect x="10" y="17" width="12" height="4.4" rx="2.2"/></g></svg>';
    demoEl.appendChild(ball); return ball;
  }
  function centerOf(el) {
    var r = el.getBoundingClientRect(), d = demoEl.getBoundingClientRect();
    return { x: r.left - d.left + r.width / 2 - 15, y: r.top - d.top + r.height / 2 - 15 };
  }
  function hop(from, to, dur, squash) {
    var midY = Math.min(from.y, to.y) - 46, midX = (from.x + to.x) / 2;
    return ball.animate([
      { transform: 'translate(' + from.x + 'px,' + from.y + 'px) scale(1,1)' },
      { transform: 'translate(' + midX + 'px,' + midY + 'px) scale(.92,1.08)', offset: .5 },
      { transform: 'translate(' + to.x + 'px,' + to.y + 'px) scale(' + (squash ? '1.25,.75' : '1,1') + ')', offset: .88 },
      { transform: 'translate(' + to.x + 'px,' + to.y + 'px) scale(1,1)' }
    ], { duration: dur, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' });
  }
  function pulseLogos() {
    $$('.lockup .hd-mark').forEach(function (m) {
      m.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18) rotate(-12deg)', offset: .4 }, { transform: 'scale(1)' }], { duration: 700, easing: 'ease-out' });
    });
  }

  function run() {
    if (running) return; running = true;
    var Q = QUEUES[current], lis = $$('li', list), done = 0, human = 0, step = reduce ? 0 : 650;
    runBtn.disabled = true; runLabel.textContent = 'Working…';
    var useBall = !reduce && 'animate' in Element.prototype;
    if (useBall) {
      ensureBall(); pulseLogos();
      var tile = $('.run-tile', runBtn) || runBtn, pos = centerOf(tile); ball.hidden = false;
      ball.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px)';
      ball.animate([{ transform: 'translate(' + pos.x + 'px,' + pos.y + 'px) scale(0)' }, { transform: 'translate(' + pos.x + 'px,' + pos.y + 'px) scale(1.2)', offset: .7 }, { transform: 'translate(' + pos.x + 'px,' + pos.y + 'px) scale(1)' }], { duration: 260, fill: 'forwards' });
      var prev = pos;
      lis.forEach(function (li, i) {
        timers.push(setTimeout(function () {
          var to = centerOf($('.ck', li)); hop(prev, to, Math.max(240, step * 0.78), true); prev = to;
        }, Math.max(0, i * step - step * 0.1)));
      });
      timers.push(setTimeout(function () {
        var back = centerOf(tile); hop(prev, back, 520, false).onfinish = function () {
          ball.animate([{ transform: 'translate(' + back.x + 'px,' + back.y + 'px) scale(1)', opacity: 1 }, { transform: 'translate(' + back.x + 'px,' + back.y + 'px) scale(0)', opacity: 0 }], { duration: 220, fill: 'forwards' }).onfinish = function () { ball.hidden = true; };
          pulseLogos();
        };
      }, lis.length * step + 60));
    }
    lis.forEach(function (li, i) {
      timers.push(setTimeout(function () {
        if (i > 0) lis[i - 1].classList.remove('working');
        li.classList.add('working');
        runBar.style.transform = 'scaleX(' + ((i + .5) / lis.length).toFixed(3) + ')';
      }, i * step));
      timers.push(setTimeout(function () {
        li.classList.remove('working');
        var isMore = li.classList.contains('more');
        var it = isMore ? null : Q.items[i];
        var chip = $('.chip', li), ck = $('.ck', li), st = $('.st', li);
        if (isMore) {
          var h = Q.more - Q.moreDone; done += Q.moreDone; human += h;
          if (!h) { li.classList.add('done'); ck.textContent = '✓'; }
          st.textContent = Q.moreDone + ' resolved' + (h ? ', ' + h + ' need you' : '');
          if (h) { li.classList.add('human'); ck.textContent = '!'; chip.className = 'chip todo'; chip.textContent = 'Needs you'; } else { chip.className = 'chip done'; chip.textContent = 'Resolved'; }
        } else if (it.r === 'done') {
          done++; li.classList.add('done'); ck.textContent = '✓'; st.textContent = it.d;
          chip.className = 'chip done'; chip.textContent = 'Resolved';
        } else {
          human++; li.classList.add('human'); ck.textContent = '!'; st.textContent = it.d;
          chip.className = 'chip todo'; chip.textContent = 'Needs you';
        }
        demoSum.innerHTML = '<span class="fig">' + done + '</span> resolved, <span class="fig">' + human + '</span> need you';
        if (i === lis.length - 1) {
          runBar.style.transform = 'scaleX(1)';
          runLabel.textContent = 'Done: ' + human + ' need you';
          runHint.textContent = Q.total + ' items worked in ' + (reduce ? 'a moment' : Math.round(lis.length * step / 1000) + ' seconds') + '. ' + done + ' resolved and written back to your PMS. ' + human + ' need a human, each with the fix drafted. Pick another queue to run it again.';
          running = false;
        }
      }, i * step + step * 0.8));
    });
  }
  if (list) {
    render('ar');
    runBtn.addEventListener('click', run);
    var tabs = $$('.demo-tab');
    var pick = function (t, focus) {
      tabs.forEach(function (x) { x.setAttribute('aria-selected', 'false'); x.setAttribute('tabindex', '-1'); });
      t.setAttribute('aria-selected', 'true'); t.removeAttribute('tabindex'); list.setAttribute('aria-labelledby', t.id);
      if (focus) t.focus();
      render(t.getAttribute('data-q'));
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { pick(t, false); });
      /* the tablist pattern: arrows move between queues, Home and End jump to the ends */
      t.addEventListener('keydown', function (e) {
        var n = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (n === undefined) return;
        e.preventDefault(); pick(tabs[(n + tabs.length) % tabs.length], true);
      });
    });
  }

  /* Demo form. Until data-endpoint names a form endpoint, it never claims to have sent anything:
     it opens the visitor's e-mail app with the request addressed to admin@huddle.dental. */
  var form = $('#demoForm');
  if (form) {
    /* a corrected field loses its invalid mark at once */
    form.addEventListener('input', function (e) { if (e.target.hasAttribute('aria-invalid') && e.target.checkValidity()) e.target.removeAttribute('aria-invalid'); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var required = $$('[required]', form), ok = true;
      required.forEach(function (f) {
        var valid = f.checkValidity();
        if (valid) f.removeAttribute('aria-invalid'); else f.setAttribute('aria-invalid', 'true');
        if (!valid) ok = false;
      });
      var help = $('#formHelp');
      if (!ok) { if (help) help.textContent = 'Fill in the marked fields: name, work email and practice.'; required.filter(function (f) { return !f.checkValidity(); })[0].focus(); return; }
      var endpoint = form.getAttribute('data-endpoint');
      if (form.dataset.busy) return;
      form.dataset.busy = '1'; setTimeout(function () { delete form.dataset.busy; }, 2000);
      if (!endpoint) {
        var v = function (id) { var el = $('#' + id); return el ? el.value.trim() : ''; };
        var body = ['Name: ' + v('f-first') + ' ' + v('f-last'), 'Work email: ' + v('f-email'), 'Group or practice: ' + v('f-org'), 'Number of practices: ' + v('f-size'), 'Role: ' + v('f-role'), 'Interested in: ' + v('f-prod'), 'What hurts most: ' + v('f-note')].join('\n');
        if (help) help.innerHTML = 'Nothing was sent yet: this form is not connected. Your e-mail app opens with the request; send it from there, or write to <a href="mailto:admin@huddle.dental">admin@huddle.dental</a>.';
        window.location.href = 'mailto:admin@huddle.dental?subject=' + encodeURIComponent('Demo request: ' + v('f-org')) + '&body=' + encodeURIComponent(body);
        return;
      }
      fetch(endpoint, { method: 'POST', body: new FormData(form) })
        .then(function (r) { if (r.ok) form.setAttribute('data-sent', 'true'); else if (help) help.textContent = 'That did not go through. Try again in a minute, or write to admin@huddle.dental.'; })
        .catch(function () { if (help) help.textContent = 'That did not go through. Try again in a minute, or write to admin@huddle.dental.'; });
    });
  }

  var y = $('#year'); if (y) y.textContent = String(new Date().getFullYear());

  /* Phone: the sticky Book a demo bar shows once the hero (and its own button) has scrolled away */
  var bar = $('.sticky-cta'), hero = $('.hero');
  if (bar && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { bar.classList.toggle('is-on', !es[0].isIntersecting); }).observe(hero);
  } else if (bar) { bar.classList.add('is-on'); }
})();

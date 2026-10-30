/* Huddle marketing site – behaviour. No dependencies. */
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
    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () {
        menu.setAttribute('data-open', 'false');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Hero: interactive queue demo ---------- */
  var QUEUES = {
    ar: {
      title: 'Insurance AR · 23 open claims', total: 23,
      hint: 'One press. Huddle checks the payer portals, pulls the EOBs, fixes the codes and resubmits. You get the few that need a human.',
      items: [
        { t: 'Delta Dental · D2740 crown · $1,185', s: 'Denied: missing attachment', d: 'Attached PA x-ray and narrative from the chart. Resubmitted.', r: 'done' },
        { t: 'Horizon NJ Health · D4341 · $212 short', s: 'Underpaid vs. contract', d: 'Fee schedule mismatch found. Appeal filed at the contracted rate.', r: 'done' },
        { t: 'Cigna · D0274 · $96', s: 'No response, 47 days', d: 'Status pulled from portal: in process. Follow-up set for day 60.', r: 'done' },
        { t: 'MetLife · D6010 implant · $2,400', s: 'Denied: not a covered benefit', d: 'Plan excludes implants. Patient conversation and financing offer drafted for you.', r: 'human' },
        { t: 'Aetna · D2392 · $240', s: 'Denied: wrong tooth number', d: 'Tooth #19 corrected from the chart. Corrected claim sent.', r: 'done' },
        { t: 'Guardian · D7210 · $310', s: 'Needs narrative', d: 'Narrative drafted from the clinical note. Resubmitted.', r: 'done' },
        { t: 'United Concordia · D1110 · $98', s: 'Frequency limit', d: 'Second cleaning in 6 months. Patient balance created with text offer.', r: 'done' },
        { t: 'Medicaid · D2930 · $180', s: 'Denied: missing prior auth', d: 'No auth on file and service already rendered. Needs your call on a write-off or appeal.', r: 'human' }
      ],
      more: 15, moreDone: 13
    },
    bal: {
      title: 'Patient balances · 18 accounts', total: 18,
      hint: 'One press. Statements go out, payment plans and financing are offered by text, and payments post back to your PMS.',
      items: [
        { t: 'Sam G. · $1,147 · 42 days', s: 'Balance after insurance', d: 'Statement sent by text and email with a two-tap pay link.', r: 'done' },
        { t: 'Casey D. · $557 · 61 days', s: 'No response to statement 2', d: 'Offered a 3-month plan by text. Accepted. First payment posted.', r: 'done' },
        { t: 'Avery C. · $951 · 15 days', s: 'Copay not collected', d: 'Paid in full from the text link at 7:12 PM. Posted to the ledger.', r: 'done' },
        { t: 'Jordan H. · $2,396 · 90+ days', s: 'Disputed charge', d: 'Patient says insurance should have paid. Claim history pulled. Needs a conversation.', r: 'human' },
        { t: 'Taylor B. · $1,170 · 28 days', s: 'Payment plan requested', d: 'Sunbit pre-qualification sent. Approved for $1,170 over 12 months.', r: 'done' },
        { t: 'Riley H. · $528 · 35 days', s: 'Left voicemail twice', d: 'Text sent with the statement. Paid $528.', r: 'done' },
        { t: 'Morgan C. · $1,427 · 70 days', s: 'Returned mail', d: 'Address updated from the insurance file. Statement re-sent.', r: 'done' },
        { t: 'Alex B. · $107 · 12 days', s: 'Small balance', d: 'Under your $150 threshold. Added to the next statement cycle.', r: 'done' }
      ],
      more: 10, moreDone: 9
    },
    pa: {
      title: 'Pre-auths · 9 requests', total: 9,
      hint: 'One press. Pre-determinations go out with the x-rays and narrative attached the first time, and approvals land back on the treatment plan.',
      items: [
        { t: 'Crown #19 · Delta · $1,050', s: 'Not yet submitted', d: 'PA x-ray, perio chart and narrative attached. Submitted.', r: 'done' },
        { t: 'Implant #30 · MetLife · $2,400', s: 'Info requested', d: 'Payer asked for the panoramic. Pulled from imaging and sent.', r: 'done' },
        { t: 'Scaling 4 quads · Horizon · $880', s: 'Not yet submitted', d: 'Perio charting attached with pocket depths. Submitted.', r: 'done' },
        { t: 'Bridge #3–5 · Cigna · $3,200', s: 'Denied: alternate benefit', d: 'Payer will cover a partial instead. Patient needs the choice explained. Drafted for you.', r: 'human' },
        { t: 'Night guard · Aetna · $450', s: 'Approved', d: 'Approval posted to the treatment plan. Patient texted two openings.', r: 'done' },
        { t: 'Extraction #17 · Medicaid · $220', s: 'Not yet submitted', d: 'X-ray attached. Submitted.', r: 'done' }
      ],
      more: 3, moreDone: 3
    },
    oc: {
      title: 'Open Chair · 6 openings tomorrow', total: 6,
      hint: 'One press. Open Chair calls the patients who are due, offers each of them two real times, books the one they pick, and texts the ones who didn\'t answer. You get the chairs filled and the one caller who asked for you.',
      items: [
        { t: 'Thu 9:20 · hygiene · Dr. Lopez', s: 'Open since a cancellation', d: 'Called Maria R., due 4 months. "Thursday at nine twenty works." Booked, reminder sent.', r: 'done' },
        { t: 'Thu 10:20 · hygiene', s: 'Open', d: 'Called 4 due patients. Two voicemails texted with "reply 1 or 2". Priya L. replied 1. Booked.', r: 'done' },
        { t: 'Thu 2:00 · hygiene · Dr. Chen', s: 'Open', d: 'Called James T., due 7 months. Booked with Dr. Chen. Insurance card reminder read back.', r: 'done' },
        { t: 'Fri 8:00 · hygiene', s: 'Open', d: 'Dana K. asked about a balance before booking. Callback logged for the manager at 9 AM. Needs you.', r: 'human' },
        { t: 'Fri 11:40 · short visit', s: 'Open', d: 'Alex B. mentioned a sore tooth. Booked the short visit instead of a cleaning, nothing clinical discussed.', r: 'done' },
        { t: 'Fri 3:20 · hygiene', s: 'Open', d: 'Three patients reached, none free Friday. Two accepted next week instead. Slot still open; two more being texted.', r: 'human' }
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
    runLabel.textContent = 'Work this queue'; runBtn.disabled = false; runBar.style.width = '0%';
    demoSum.innerHTML = '<b>0</b> resolved · <b>0</b> need you';
    list.innerHTML = Q.items.map(function (it) {
      return '<li><span class="ck">·</span><span><b>' + esc(it.t) + '</b><small class="st">' + esc(it.s) + '</small></span><span class="chip wait">Open</span></li>';
    }).join('') + (Q.more ? '<li class="more"><span class="ck">+</span><span><b>' + Q.more + ' more</b><small class="st">Waiting</small></span><span class="chip wait">Open</span></li>' : '');
  }
  /* The orange mark becomes a ball and hops down the queue */
  var demoEl = $('#demo'), ball = null;
  function ensureBall() {
    if (ball) return ball;
    ball = document.createElement('div'); ball.className = 'ball'; ball.hidden = true;
    ball.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="11.5" cy="13" r="4" fill="#fff"/><circle cx="20.5" cy="13" r="4" fill="#fff"/><path d="M8 24c0-4 3.5-6 8-6s8 2 8 6" fill="#fff"/></svg>';
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
    $$('.logo-mark').forEach(function (m) {
      m.animate([{ transform: 'scale(1)', borderRadius: '9px' }, { transform: 'scale(1.25) rotate(-12deg)', borderRadius: '50%', offset: .4 }, { transform: 'scale(1)', borderRadius: '9px' }], { duration: 700, easing: 'ease-out' });
    });
  }

  function run() {
    if (running) return; running = true;
    var Q = QUEUES[current], lis = $$('li', list), done = 0, human = 0, step = reduce ? 0 : 650;
    runBtn.disabled = true; runLabel.textContent = 'Working…';
    var useBall = !reduce && 'animate' in Element.prototype;
    if (useBall) {
      ensureBall(); pulseLogos();
      var pos = centerOf(runBtn); ball.hidden = false;
      ball.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px)';
      ball.animate([{ transform: 'translate(' + pos.x + 'px,' + pos.y + 'px) scale(0)' }, { transform: 'translate(' + pos.x + 'px,' + pos.y + 'px) scale(1.2)', offset: .7 }, { transform: 'translate(' + pos.x + 'px,' + pos.y + 'px) scale(1)' }], { duration: 260, fill: 'forwards' });
      var prev = pos;
      lis.forEach(function (li, i) {
        timers.push(setTimeout(function () {
          var to = centerOf($('.ck', li)); hop(prev, to, Math.max(240, step * 0.78), true); prev = to;
        }, Math.max(0, i * step - step * 0.1)));
      });
      timers.push(setTimeout(function () {
        var back = centerOf(runBtn); hop(prev, back, 520, false).onfinish = function () {
          ball.animate([{ transform: 'translate(' + back.x + 'px,' + back.y + 'px) scale(1)', opacity: 1 }, { transform: 'translate(' + back.x + 'px,' + back.y + 'px) scale(0)', opacity: 0 }], { duration: 220, fill: 'forwards' }).onfinish = function () { ball.hidden = true; };
          pulseLogos();
        };
      }, lis.length * step + 60));
    }
    lis.forEach(function (li, i) {
      timers.push(setTimeout(function () {
        if (i > 0) lis[i - 1].classList.remove('working');
        li.classList.add('working');
        runBar.style.width = Math.round(((i + .5) / lis.length) * 100) + '%';
      }, i * step));
      timers.push(setTimeout(function () {
        li.classList.remove('working');
        var isMore = li.classList.contains('more');
        var it = isMore ? null : Q.items[i];
        var chip = $('.chip', li), ck = $('.ck', li), st = $('.st', li);
        if (isMore) {
          var h = Q.more - Q.moreDone; done += Q.moreDone; human += h;
          li.classList.add('done'); ck.textContent = '✓';
          st.textContent = Q.moreDone + ' resolved' + (h ? ', ' + h + ' need you' : '');
          chip.className = 'chip done'; chip.textContent = 'Resolved';
        } else if (it.r === 'done') {
          done++; li.classList.add('done'); ck.textContent = '✓'; st.textContent = it.d;
          chip.className = 'chip done'; chip.textContent = 'Resolved';
        } else {
          human++; li.classList.add('human'); ck.textContent = '!'; st.textContent = it.d;
          chip.className = 'chip todo'; chip.textContent = 'Needs you';
        }
        demoSum.innerHTML = '<b>' + done + '</b> resolved · <b>' + human + '</b> need you';
        if (i === lis.length - 1) {
          runBar.style.width = '100%';
          runLabel.textContent = 'Done · approve the ' + human + ' that need you';
          runHint.textContent = Q.total + ' items worked in ' + (reduce ? 'a moment' : Math.round(lis.length * step / 1000) + ' seconds') + '. ' + done + ' resolved and written back to your PMS. ' + human + ' need a human, each with the fix drafted. Pick another queue to run it again.';
          running = false;
        }
      }, i * step + step * 0.8));
    });
  }
  if (list) {
    render('ar');
    runBtn.addEventListener('click', run);
    $$('.demo-tab').forEach(function (t) {
      t.addEventListener('click', function () {
        $$('.demo-tab').forEach(function (x) { x.setAttribute('aria-selected', 'false'); });
        t.setAttribute('aria-selected', 'true');
        render(t.getAttribute('data-q'));
      });
    });
  }

  /* Count-up for the stats band */
  var counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduce) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, end = +el.getAttribute('data-count'), start = performance.now(), dur = 1100;
        if (end === 0) { cio.unobserve(el); return; }
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

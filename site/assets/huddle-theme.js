/* Huddle day / night switch — one file, shared by every Huddle app (copy verbatim; the huddle-design skill keeps the master).
   The person picks Day or Night with the sun/moon switch at the top left, next to the logo. The choice is kept in this
   browser (localStorage "huddle-theme"); until they pick, the page follows the device (prefers-color-scheme).

   How it works with the design tokens: every page defines its colours three times (light on :root; dark when the device
   prefers it and the page has not chosen light; dark again on :root[data-theme="dark"]). This script only sets or clears
   data-theme="light" | "dark" on <html>, so the whole page changes: background, cards, lines, text, tables, status colours,
   chart series, side panels.

   Use:
   1. In <head>, BEFORE any stylesheet, the one-line guard so there is no flash of the wrong theme:
        <script>try{var t=localStorage.getItem("huddle-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}<\/script>
   2. Load this file (defer is fine): <script src="huddle-theme.js" defer><\/script>
   3. Put <span data-theme-toggle></span> where the switch goes: right after the logo, top left. Several are fine.
   4. Pages that draw charts in JS listen for the change and redraw:
        window.addEventListener("huddle-theme", e => { applyChartTheme(); render(); });   // e.detail.theme = "light" | "dark"
   Inside an iframe of another Huddle page the switch hides itself (the outer page has it) and follows the outer page.
   Inlining this file in a page: the closing script tags above are written with a backslash (<\/script>) so they
   cannot end an inline <script> early; keep it so, and type them without the backslash when you copy them into HTML. */
(function () {
  "use strict";
  var KEY = "huddle-theme", root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function stored() { try { var t = localStorage.getItem(KEY); return t === "light" || t === "dark" ? t : null; } catch (e) { return null; } }
  function current() { return root.dataset.theme === "light" || root.dataset.theme === "dark" ? root.dataset.theme : (mq && mq.matches ? "dark" : "light"); }
  var embedded = false;
  try { embedded = window.self !== window.top && !!window.parent.document; } catch (e) { embedded = false; }   // same-origin frame only

  function paint(theme) {
    // browser chrome (address bar on phones) follows the page
    var bg = getComputedStyle(root).getPropertyValue("--card").trim() || (theme === "dark" ? "#121e28" : "#ffffff");
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) { m.setAttribute("content", bg); m.removeAttribute("media"); });
    document.querySelectorAll(".theme-toggle").forEach(function (b) {
      var night = theme === "dark";
      b.setAttribute("aria-pressed", night ? "true" : "false");
      b.setAttribute("aria-label", night ? "Night mode is on. Switch to day mode" : "Day mode is on. Switch to night mode");
      b.title = night ? "Switch to day mode" : "Switch to night mode";
    });
  }
  function apply(theme, fromUser) {
    if (theme === "light" || theme === "dark") root.dataset.theme = theme; else delete root.dataset.theme;
    var now = current();
    paint(now);
    if (fromUser) { try { localStorage.setItem(KEY, now); } catch (e) {} }
    try { window.dispatchEvent(new CustomEvent("huddle-theme", { detail: { theme: now } })); } catch (e) {}
    // same-origin frames inside this page follow at once (other windows hear the storage event)
    document.querySelectorAll("iframe").forEach(function (f) {
      try { if (f.contentWindow && f.contentWindow.HuddleTheme) f.contentWindow.HuddleTheme.set(now, false); } catch (e) {}
    });
  }

  var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 14.6A8.4 8.4 0 0 1 9.4 3.8a8.4 8.4 0 1 0 10.8 10.8z"/></svg>';
  // !important on the box: an app's own `button{…}` rules must not reshape the switch
  var CSS = ".theme-toggle{position:relative!important;display:inline-flex!important;align-items:center;justify-content:space-between!important;gap:0!important;flex:0 0 auto;width:58px!important;height:30px!important;min-height:0!important;min-width:0!important;padding:0 7px!important;margin:0!important;border-radius:999px!important;border:1px solid var(--line,#dce6ee)!important;background:var(--bg,#f4f8fb)!important;color:var(--muted,#55697b);cursor:pointer;box-shadow:inset 0 1px 2px rgba(17,38,58,.08)!important;vertical-align:middle;filter:none!important;font-size:0!important;line-height:0!important}"
    + ".theme-toggle:hover{border-color:var(--accent,#0b78c2)!important}"
    + ".theme-toggle>span{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px}"
    + ".theme-toggle:focus-visible{outline:2px solid var(--accent,#0b78c2);outline-offset:2px}"
    + ".theme-toggle svg{position:relative;z-index:1;width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:color .2s}"
    + ".theme-toggle .tt-moon path{fill:currentColor;stroke:none}"
    + ".theme-toggle::before{content:'';position:absolute;top:2px;left:2px;width:24px;height:24px;border-radius:50%;background:var(--card,#fff);box-shadow:0 1px 3px rgba(17,38,58,.25);transition:transform .22s ease}"
    + ".theme-toggle .tt-sun{color:#c77d1a}.theme-toggle .tt-moon{color:var(--faint,#8a9cab)}"
    + ".theme-toggle[aria-pressed='true']::before{transform:translateX(28px);background:var(--line-strong,#34495b);box-shadow:0 1px 3px rgba(0,0,0,.5)}"
    + ".theme-toggle[aria-pressed='true'] .tt-sun{color:var(--faint,#8a9cab)}.theme-toggle[aria-pressed='true'] .tt-moon{color:#f5c451}"
    + "[data-theme-toggle]{display:inline-flex;align-items:center}"
    + ".theme-embedded [data-theme-toggle]{display:none!important}"
    + "@media (prefers-reduced-motion:reduce){.theme-toggle::before,.theme-toggle svg{transition:none}}";

  function mount() {
    if (!document.getElementById("huddle-theme-css")) {
      var s = document.createElement("style"); s.id = "huddle-theme-css"; s.textContent = CSS; document.head.appendChild(s);
    }
    if (embedded) root.classList.add("theme-embedded");
    document.querySelectorAll("[data-theme-toggle]").forEach(function (slot) {
      if (slot.querySelector(".theme-toggle")) return;
      var b = document.createElement("button");
      b.type = "button"; b.className = "theme-toggle";
      b.innerHTML = '<span class="tt-sun">' + SUN + '</span><span class="tt-moon">' + MOON + "</span>";
      b.addEventListener("click", function (e) { e.stopPropagation(); apply(current() === "dark" ? "light" : "dark", true); });
      slot.appendChild(b);
    });
    paint(current());
  }

  // another tab or window (or the outer page) changed it
  window.addEventListener("storage", function (e) { if (e.key === KEY) apply(stored(), false); });
  // the device switched and the person has not picked: follow the device
  if (mq && mq.addEventListener) mq.addEventListener("change", function () { if (!stored()) apply(null, false); });

  window.HuddleTheme = { get: current, set: apply, mount: mount };
  if (embedded) { try { var outer = window.parent.document.documentElement.dataset.theme; if (outer && !stored()) root.dataset.theme = outer; } catch (e) {} }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();

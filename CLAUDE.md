# Huddle marketing website (huddle.dental)
Project tag: [OPS]
Work here follows the `/ship` flow without being asked (build → tests → browser check → `/pre-pr` → PR → merge when green → one report). Ask only for a real design choice or a step that can't be undone.

## What this is
- The public marketing site for Huddle, published at https://huddle.dental (GitHub Pages from the `gh-pages` branch;
  also reachable at https://bsandha-star.github.io/bavan/). Static HTML/CSS/JS in `site/`, no build step, no framework.
- Two products on the page: **Workspace** (office managers) and **Pulse** (owners). The copy is product vision, not a
  description of the current internal apps. Testimonials, contact details, the demo form endpoint and legal pages are
  placeholders (`PLACEHOLDER` / `TODO (launch)` comments; list in `README.md`).
- Read `README.md` and `DEPLOY.md` first.
- **Where it is really live (checked 12 Nov 2026):** https://huddle.dental is served by the Huddle Windows/IIS server
  (`Server: Microsoft-IIS`), not GitHub Pages, and its homepage is a different copy from `site/index.html`.
  `bsandha-star.github.io/bavan/` (gh-pages) just redirects there. So merging here does NOT change what visitors see;
  updating the live site means updating the copy on that server (owner's call). `ADMI-Workspace/website/` holds an
  identical copy of this site. The Green Valley ownership map that people use is https://app.huddle.dental/green-valley-map-r8q4.html
  (ADMI-Workspace `public/`); it stays public by the owner's decision — leave it.

## This repo is PUBLIC
- Everything committed here is world-readable, and everything in `site/` is published on huddle.dental.
- Never commit business data, real staff/patient/customer names, figures, internal app URLs or screenshots, emails,
  keys or tokens. Examples on the page use made-up names (Lakeside Dental, Dr. Lopez, 555-01xx numbers).
- Copy from the internal Huddle apps (ADMI-Workspace, hr-huddle, practice-books, call-score) only after stripping
  anything private. When unsure, ask the owner before committing.
- `site/green-valley-map-r8q4.html` is an internal ownership map; the owner decided it stays public (12 Nov 2026).
  Don't delete or move it; edit it only when asked.

## Layout
- `site/index.html` the landing page (hero queue demo, products, before/after day, Workspace themes, Pulse, how it
  works, pricing, stories, integrations, security, FAQ, demo form). `site/privacy.html`, `site/terms.html` stubs.
- `site/assets/styles.css` all styles (light + dark tokens on `:root`); `site/assets/app.js` nav, mobile menu, the
  "Work this queue" demo, count-ups, demo form; `site/assets/favicon.svg`.
- `site/CNAME` custom domain; `site/_headers` security headers (Cloudflare Pages / Netlify); `netlify.toml`,
  `vercel.json` the same for those hosts.
- `.github/workflows/`: `pages.yml` publishes `site/` to `gh-pages` on push to `main`; `pr-tests.yml` checks every PR;
  `dns-check.yml` and `screenshot.yml` are manual diagnostics against the live domain.
- `tests/` checks only (not published): `check_site.py`, `smoke.mjs`, `package.json` (Playwright pinned).

## Preview locally
```bash
python3 -m http.server 8080 --bind 127.0.0.1 --directory site > /dev/null 2>&1 & echo $! > /tmp/huddle-site.pid
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/   # 200
kill "$(cat /tmp/huddle-site.pid)"                                # stop by PID; never pkill/killall
```
Run from the repo root. Open http://127.0.0.1:8080/ . Google Fonts load from the internet; without it the system fonts are used.

## Tests / checks
- `python3 tests/check_site.py` (no dependencies, < 1 s): HTML well-formed (unclosed, misnested or self-closed `<div/>`
  tags), duplicate ids, `lang`/`<title>`/viewport, every local `href`/`src`/CSS `url()` is relative and exists, every
  `#anchor` exists on its page, `site/CNAME` is exactly `huddle.dental`, and `_headers`/`netlify.toml`/`vercel.json`
  keep their security headers.
- `cd tests && npm ci && npx playwright install chromium && node smoke.mjs` (~10 s): every page at desktop
  1366×900 (light) and phone 412×915 (dark): no console errors or exceptions, no missing files, no sideways scroll on
  the phone; on `index.html` the mobile menu, the queue demo (every item worked, "Done" state), and the demo form (empty submit refused, filled submit
  shows the thank-you state and sends no request). Other hosts are stubbed, so it needs no network.
- Cloud sessions (Playwright's browser download is blocked): `cd tests && npm ci && PW_CHROMIUM=/opt/pw-browsers/chromium node smoke.mjs`.
- CI: `.github/workflows/pr-tests.yml` runs both on every PR (Python 3.12, Node 22, no secrets).
- Never weaken a check to get green. If `site/CNAME` is meant to change, the owner says so and the check changes in the same PR.

## Before a PR
- Run `/pre-pr` (checks above, `/untangle`, `/code-review`). A hook blocks PR creation until it has passed on HEAD.
- Page or copy changes: also `/sim-test` against the local preview (personas in `.claude/personas.md`).
- Changed files: `git diff --stat $(git merge-base HEAD origin/main)`.

## Publish
- Merging to `main` publishes: `pages.yml` force-pushes `site/` to `gh-pages`, live in about a minute. Claude merges its own PR once CI is green and `/pre-pr` passed.
  The guard hook (`.claude/hooks/guard.js`) asks only for what can't be undone: `--remote` writes, secrets, rollbacks, force pushes outside `claude/` branches, protected files. Deploys and pushes to the main branch go through once `/pre-pr` passed on the commit.
- Netlify/Vercel/Cloudflare Pages configs exist; GitHub Pages was the intended host (DNS at Squarespace, `DEPLOY.md`),
  but huddle.dental currently answers from the IIS server (see What this is).
- Never run `dns-check.yml` (it changes Pages settings) or `screenshot.yml` (force-pushes `evidence`) without the owner.

## Protected files (`.claude/guard.json`, the hook asks before Read/Edit/Write; it does not see Bash or Grep)
`site/CNAME`, `.env*` (not `.env.example`), `.dev.vars`, `site/_headers`, `netlify.toml`, `vercel.json`, the
`pages`/`dns-check`/`screenshot` workflows, `site/green-valley-map-r8q4.html`, `.claude/settings.json`, `.claude/guard.json`, `.claude/hooks/`.

## Gotchas
- `site/CNAME` must stay `huddle.dental`: GitHub Pages reads it on every publish; changing or deleting it moves or
  drops the custom domain.
- Security headers live in three places (`site/_headers`, `netlify.toml`, `vercel.json`); change them together.
  `vercel.json` has no Permissions-Policy. GitHub Pages, the live host, ignores all three (no custom headers there).
- Links and assets must be relative (`assets/app.js`, not `/assets/app.js`): the github.io copy lives under `/bavan/`.
- Theme follows the OS (`prefers-color-scheme`); `:root[data-theme="dark"|"light"]` overrides it. Check every change in
  both themes; colours are tokens on `:root` in `styles.css`.
- Mobile menu: `#menuBtn` toggles `#mobileMenu[data-open]` and `aria-expanded`; links close it. Check at phone width.
- Only `index.html` loads `app.js`, and `app.js` assumes `#nav` exists: a new page that loads it without `#nav`
  throws on load (the smoke test would catch it).
- Assets are cached for a year (`/assets/*` immutable) on Netlify/Cloudflare: rename a file or add `?v=` when it changes.

---
name: sim-test
description: Agent simulation testing. AI personas (front desk, practice owner, new hire on a phone, keyboard-only user, careless user) drive this app one at a time in a real browser on local/test data and report friction, bugs and accessibility problems with screenshots. Use before a PR that changes a page or user flow, or when asked to "sim test", "simulate users" or "have agents try it".
---

# /sim-test — AI personas try the app

## 1. Get a safe target
- Read this repo's CLAUDE.md section **Simulation testing**: how to start the app locally with fake data, its URL, how to sign in, and `.claude/personas.md`.
- Start it locally. **Never** use production or real patient/staff data. Don't overwrite an existing `.dev.vars`; follow CLAUDE.md for the sim-only env file. Remember the server's PID so you stop only that process.
- Confirm the URL answers (`curl -s -o /dev/null -w '%{http_code}' <url>`).

## 2. Pick the scope
- Changed files: `git diff --stat $(git merge-base HEAD origin/HEAD 2>/dev/null || git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD origin/master)` plus `git status --short`.
- Flows: the ones those changes touch, plus one smoke flow (sign in → main screen).
- Pick the 3–5 personas from `.claude/personas.md` who use those flows. Drop any goal the local data can't support (empty boards etc.) and list it under "not testable locally" instead of running it.

## 3. Run the personas one at a time
There is one Playwright browser per session, so personas run **in sequence**, never in parallel.
For each persona, spawn a `persona-tester` subagent with: base URL, sign-in steps, persona text, its 2–4 goals, viewport, and the screenshot filename prefix. Wait for its report before starting the next.

## 4. Merge, verify, report
- De-duplicate findings. Rank **Blocker** (can't finish a goal / data wrong) → **Major** (confusing, inaccessible, slow) → **Minor** (polish).
- Reproduce every Blocker and Major yourself in the browser before reporting it. Drop anything you can't reproduce.
- Report: per persona — goals ✅/❌/n-a and steps; then ranked, reproduced findings with steps and screenshot files; then "not testable locally".
- For a PR: add a "Simulation test" section to the PR description with that table.
- Fix Blockers caused by this change (with a failing test first where possible); list the rest for me to decide.
- Stop the dev server you started (by PID).

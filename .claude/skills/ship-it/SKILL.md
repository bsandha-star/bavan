---
name: ship-it
description: The default way to build anything here - take an idea or spec from plan to live without asking the owner along the way. Builds, tests, checks the pages in a real browser, runs /pre-pr, opens the PR, merges when green, confirms the deploy, then reports once against the spec. Use for any "build", "add", "change", "fix" request; no need for the owner to type /ship-it. (Named ship-it because Claude Code reserves /ship for its own built-in command.)
---

# /ship-it — idea in, finished and verified work out, one report

`/ship` (no "-it") is Claude Code's own built-in command: it commits, pushes, opens or updates the PR, reviews it and watches CI
until the PR is merged or closed, but never merges. Claude Code reserves that name, so this kit flow is `/ship-it`. When the owner
types `/ship`, follow the built-in command as it says; this flow is what you do, unasked, for any build request.

The owner should not have to watch. Never stop for routine confirmation. Stop only for the two cases in step 1 and step 7.

1. **Spec.** Write the request as a numbered acceptance list ("1. A staff member can …"). If a design choice would change what gets built
   and you can't settle it from the code, the docs or how the app already works, ask it now — every such question in ONE message — then wait.
   Otherwise state your assumptions in two or three lines and start. Don't ask for plan approval.
2. **Build** on the work branch. Bug: failing test first, then the fix. New behaviour: tests with it. Use subagents for independent parts.
   A change to a live AI prompt (a file in `.claude/prompts.json`, or any prompt patients, staff or the books depend on) runs
   `/prompt-tune` inside this step: fixed cases, expert review, smallest generic fix, full re-test, at most three versions.
3. **Prove it.** Run the repo's tests and typecheck (CLAUDE.md "Tests"). For anything a person sees: start the app locally on fake data,
   open the changed screens with Playwright at desktop and phone width, walk each acceptance item, keep a screenshot per item.
   Page or flow changes: also run `/sim-test`.
4. **Self-review.** Run `/pre-pr` (tests, `/untangle`, `/code-review`). Fix what it finds. Loop until it passes; don't hand problems to the owner.
5. **PR.** Open it with the acceptance list, the checks and their results. Wait for CI. If CI fails, read the log, fix, repeat.
6. **Merge and go live.** When CI is green, merge it yourself (the guard blocks a PR, deploy or push to main until /pre-pr passed on the
   commit, and asks only for the GitHub-repository stop rule). Where merging deploys, watch the deploy run finish and check the live health/URL responds. If the deploy fails or the live check
   fails, revert the merge straight away and say so.
7. **Stop and ask only for the owner's two stop rules** (19 Nov 2026): an action that (1) could lose $100 or more in one go
   (a purchase, payment, payroll or contractor run, a plan upgrade, a bulk paid-API run), or (2) would damage or delete a GitHub
   repository (delete, archive, rename, transfer, change visibility, delete main, force-push over main or a non-`claude/` branch).
   Everything else runs without asking: live database/KV writes and migrations, secrets, e-mail, deploys, reading real patient or
   staff data for the task. If the work can finish without a stop-rule step, finish it and put that step in the report.
8. **One report**, in plain English:
   - each acceptance item: ✅ done / ⚠️ partly / ❌ not done, with the evidence (test name or screenshot);
   - what is live and where (PR link, deploy result);
   - for a prompt change, the `/prompt-tune` block (versions, matrix results, fixes, escalations, sign-off still needed);
   - assumptions you made;
   - anything that needs the owner (decisions, stop-rule steps from 7).

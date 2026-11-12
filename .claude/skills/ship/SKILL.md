---
name: ship
description: The default way to build anything here - take an idea or spec from plan to live without asking the owner along the way. Builds, tests, checks the pages in a real browser, runs /pre-pr, opens the PR, merges when green, confirms the deploy, then reports once against the spec. Use for any "build", "add", "change", "fix" request; no need for the owner to type /ship.
---

# /ship — idea in, finished and verified work out, one report

The owner should not have to watch. Never stop for routine confirmation. Stop only for the two cases in step 1 and step 7.

1. **Spec.** Write the request as a numbered acceptance list ("1. A staff member can …"). If a design choice would change what gets built
   and you can't settle it from the code, the docs or how the app already works, ask it now — every such question in ONE message — then wait.
   Otherwise state your assumptions in two or three lines and start. Don't ask for plan approval.
2. **Build** on the work branch. Bug: failing test first, then the fix. New behaviour: tests with it. Use subagents for independent parts.
3. **Prove it.** Run the repo's tests and typecheck (CLAUDE.md "Tests"). For anything a person sees: start the app locally on fake data,
   open the changed screens with Playwright at desktop and phone width, walk each acceptance item, keep a screenshot per item.
   Page or flow changes: also run `/sim-test`.
4. **Self-review.** Run `/pre-pr` (tests, `/untangle`, `/code-review`). Fix what it finds. Loop until it passes; don't hand problems to the owner.
5. **PR.** Open it with the acceptance list, the checks and their results. Wait for CI. If CI fails, read the log, fix, repeat.
6. **Merge and go live.** When CI is green, merge it yourself (the guard asks only if the PR changes a database migration or a protected
   file). Where merging deploys, watch the deploy run finish and check the live health/URL responds. If the deploy fails or the live check
   fails, revert the merge straight away and say so.
7. **Ask first only for things that can't be undone:** `--remote` database or KV writes, secrets, sending email/SMS, payroll, DocuSign,
   Sling pushes, live document writes, reading real patient or staff data. Batch these into one message at the end if the work can
   finish without them.
8. **One report**, in plain English:
   - each acceptance item: ✅ done / ⚠️ partly / ❌ not done, with the evidence (test name or screenshot);
   - what is live and where (PR link, deploy result);
   - assumptions you made;
   - anything that needs the owner (decisions, irreversible steps from 7).

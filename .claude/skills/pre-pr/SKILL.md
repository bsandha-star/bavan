---
name: pre-pr
description: Quality gate before opening a pull request - runs the repo's tests and typecheck, an /untangle clean-up review, and /code-review on the diff, then records a pass for the current commit so the PR hook lets the PR through. Use before every PR, or when asked to "check before PR", "pre-PR" or "is this ready".
---

# /pre-pr — gate before every pull request

1. **Commit first.** Everything for this PR is committed; `git status --short` is clean (or only has files that don't belong in the PR).
2. **Tests and typecheck.** Run the exact commands from this repo's CLAUDE.md "Tests" section (all suites that can run here, plus typecheck/lint if the repo has them). Paste the summary lines (passed/failed counts). If anything fails: fix the cause (never the assertion), commit, and start again from step 2. A failure that also fails on unchanged main is noted, not blamed on this change — prove it by running that test on main.
3. **Untangle.** Run `/untangle`. Apply low-risk proposals in a separate `chore(untangle)` commit and list the rest for me. If you applied anything, go back to step 2.
4. **Code review.** Run the built-in `/code-review` on this branch's diff. Fix every correctness finding you agree with (test first where possible), commit, and go back to step 2. List findings you disagree with and why.
5. **Page changes.** If the diff changes a page or user flow and `/sim-test` hasn't run on this commit, run it.
6. **Record the pass** for the exact commit:
   ```bash
   node .claude/hooks/guard.js --record-pre-pr
   ```
   (Any new commit after this needs a fresh /pre-pr.)
7. **PR description** gets a "Checks" section: commands + results from step 2, untangle summary, code-review summary, sim-test table if run.

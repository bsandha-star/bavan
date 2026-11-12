---
name: untangle
description: Propose-only clean-up review of the code changed on this branch - knotted logic, duplication, dead code, tangled imports, unclear names - without changing behaviour. Runs as part of /pre-pr, or when asked to "untangle", "clean up" or "tidy the code". Proposes; applies only what is approved.
---

# /untangle — propose clean-ups for this branch's changes

1. **Scope.** Files changed on this branch: `git diff --name-only $(git merge-base HEAD origin/HEAD 2>/dev/null || git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD origin/master)` plus uncommitted ones.
   **Never in scope:** tests and fixtures, generated/built files (`dist/`, bundles), lockfiles, `seed/`, files the repo's CLAUDE.md marks as frozen or protected (released page versions, the voice-agent prompt, etc.).
2. **Look for, in scope only:**
   - logic duplicated in 2+ places that an existing helper already covers, or that now deserves one;
   - functions doing several jobs, deep nesting, long if/else chains;
   - dead code introduced or orphaned by this branch (confirm with a search that includes HTML/strings/templates before calling anything unused);
   - tangled dependencies (circular imports, reaching into another module's internals);
   - names that no longer match what the thing does; leftover debug output; TODOs this branch finished.
3. **Propose, don't apply.** List each proposal: file:line, what, why, risk (low/medium), and size. Nothing that changes behaviour, an API, a route, a DB schema or a test.
4. **Apply only what's approved** — by me, or by the /pre-pr flow when it's low-risk and small (≤ ~40 lines each). Apply in a separate `chore(untangle): …` commit, then re-run the same tests; they must match the baseline exactly, or revert.

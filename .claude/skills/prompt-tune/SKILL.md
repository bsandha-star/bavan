---
name: prompt-tune
description: Change or improve a live AI prompt with evidence instead of judgement - a voice agent's script, a call-scoring or audit prompt, a categorising rule set, a scheduled task's prompt. Fixed test cases, an expert review against the sources, root-cause triage, the smallest generic fix, a full re-test, at most three versions, a version log and the owner's sign-off. Use whenever a change touches a file listed in the repo's `.claude/prompts.json` (or any prompt real patients, staff or numbers depend on), or when asked to "tune", "improve" or "fix" a prompt.
---

# /prompt-tune — improve a live prompt with evidence

Based on "An Iterative Algorithm for Prompt Improvement", shared with the team on 15 Nov 2026. Code is proven by tests; a prompt is
proven the same way: the same cases, judged the same way, every version.

**In one line:** run the prompt on a fixed set of contrasting cases, judge each output against its sources, fix only real errors
with the smallest generic rule, re-run everything, stop at "an expert would accept it" or after three versions, and let the
owner sign off.

## The register: `.claude/prompts.json`

Each repo lists its live prompts here. A prompt that is not listed but that patients, staff or the books depend on gets added
in the same change.

```json
{
  "prompts": [
    {
      "name": "emma",
      "file": "riley-prompt-live.md",
      "also": ["src/prompt.ts"],
      "what": "Emma's voice script (recall calls)",
      "owner": "Bavan",
      "locked": true,
      "run": "owner",
      "matrix": "docs/EMMA-TEST-CALLS.md",
      "checks": ["npm test"],
      "log": "prompts/emma/LOG.md"
    },
    {
      "name": "call-score",
      "file": "src/score-prompt.md",
      "what": "scores a call against the rubric",
      "owner": "Bavan",
      "locked": false,
      "run": "local",
      "runCommand": "node scripts/prompt-run.mjs --cases prompts/call-score/cases --out .prompt-runs/call-score",
      "matrix": "prompts/call-score/cases/",
      "checks": ["npm test"],
      "log": "prompts/call-score/LOG.md"
    }
  ]
}
```
(The second entry shows the shape of a `"local"` prompt; its paths are an example, not a real file.) Give prompt files a name
with the word "prompt" in it where you can: the project-band mod then reminds Claude the moment one is edited. `/pre-pr`
checks the register either way.

- `file` / `also`: the prompt and any generated copies (changed together).
- `owner`: who signs off. `locked: true`: changes need the owner's OK (list the file in `.claude/guard.json` too, so the guard asks).
- `run`: `"local"` = Claude can dry-run it (`runCommand` runs the prompt over the cases with no live writes and saves outputs to
  files) · `"owner"` = only the owner can run it (a live voice agent, a paid API, a live system): Claude prepares the round, the
  owner runs it and shares the scored sheet.
- `matrix`: where the test cases live (2–4 contrasting cases × the conditions that matter). Fake/sample data only, never PHI.
- `checks`: deterministic tests that guard the prompt's contract (length limits, required phrases, tool calls, output keys).
- `log`: the version log (template at the end).

## Principles

| Principle | Meaning |
|---|---|
| Evidence, not opinion | Every output is judged against its sources (fixture data, tool log, rules), not on how it reads. |
| Generic fixes only | A rule must hold for any practice, patient, entity or month, not just the case that exposed it. |
| Smallest change that works | One rule at a time; never rewrite what already works. |
| Fix the real cause | Data, retrieval and code problems are escalated, not patched in the prompt. |
| Re-test everything | Each version runs the full matrix, so a fix for one case cannot silently break another. |
| Stop at expert-acceptable | Perfection is not the goal; stop when a seasoned professional would accept the output. |
| Never touch live output while testing | Dry runs, sandbox or fixtures only; nothing reaches patients, staff, the books or a live Sheet. |
| A human signs off | The loop proposes; the prompt's owner approves and locks it. |
| No self-grading | A model playing both sides and grading itself is not evidence. Every recorded error quotes the source line, rule or failed check it breaks; a person grades what can't be checked that way. |

## The steps

1. **Select and check status.** Find the prompt in `.claude/prompts.json`. Locked:
   - the owner asked for this change → go ahead; the guard asks before the edit, and the PR is merged only after the owner's OK;
   - nobody asked for it (you noticed a problem while doing something else) → record it in the log's "Remaining" list and the report;
     don't change the prompt;
   - an unattended run (a scheduled task such as the bug-fixer) → never edit a locked prompt; stop at a written proposal in the PR or report.
2. **Snapshot v0.** v0 = the commit the prompt is at now (`git log -1 --format=%h -- <file>`). It is the baseline and the rollback
   point. Note it in the log.
3. **Run the matrix.**
   - `run: "local"`: run `runCommand` on every case × condition (in parallel, a timeout, one retry). Outputs go to files under the
     scratchpad or `prompts/<name>/runs/` (gitignored if they could ever hold real data). Never a live write.
   - `run: "owner"`: write the round for the owner — which cases, in what order, what to say, what must be heard or must happen
     (the matrix file), and where to tick results. The owner shares only the scored table and the failing lines' wording.
     If the change was asked for with a known failure (a reported call, a failed round), draft v1 from it now (steps 6–8),
     run the deterministic `checks`, and open the PR unmerged: the owner's next round scores v0 and v1 side by side. Without a
     known failure, stop after writing the round. Either way, list the round under "needs the owner" in the report and continue
     from step 4 when the scored round comes back.
   - Always also run the `checks` (deterministic tests).
4. **Expert review against the sources.** Read every output as the professional who relies on it would (office manager, auditor,
   bookkeeper, clinician) and check it against the inputs. Record only real errors:

   | Error type | What to look for |
   |---|---|
   | False facts | Names, times, figures or claims the sources don't support |
   | False absence | "Not provided" / "nothing available" when the sources have it |
   | Invented values or labels | A figure, category, slot or term that doesn't exist in the inputs |
   | Missed warning signs | Adverse signals the output ignores (a patient asking to stop, an over-limit balance, a missed callback) |
   | Scope leakage | Content that belongs to another step, section or agent |
   | Wrong scenario | A rule applied to a case it doesn't fit |
   | Contract breaks | Wrong output keys, missing tool call, broken format, over a length limit |
   | Rule breaks | Anything against the repo's never-broken rules (CLAUDE.md) |
   | Noise | Repetition, internal field names in prose, comments about the process |

   Style preferences and run-to-run wording differences are not errors. Each recorded error quotes the case, the output line and
   the source line, rule or failed check it breaks; an error you can't tie to a source is a style preference.
5. **Acceptable?** If the expert would accept every case and condition, go to step 9. Stop also after **three fixes (v1–v3)**
   (or the time box the request gives); list the remaining issues instead of chasing them.
6. **Diagnose each error before touching the prompt.**

   | Cause | Typical sign | Action |
   |---|---|---|
   | Prompt | Instruction missing, ambiguous or forcing the error | Fix in the prompt (step 7) |
   | Retrieval / context | The needed fact never reached the model | Escalate: fix what the code passes in |
   | Source data | Wrong, missing or unit-less data | Escalate: fix at the source or the importer |
   | Code | A format rule followed only sometimes | Escalate: a code check or validator, with a test |
   | Model variance | Same prompt, different answers on repeat runs | Strengthen the rule, or accept and record it |

   Escalations are fixed as ordinary code changes (failing test first) in the same `/ship`, or listed for the owner.
7. **Write the smallest generic fix.** No names, numbers, dates or practices from the test case: state the principle. Put the
   rule inside the step, field or tool description it governs (followed more reliably than a general rule elsewhere). Say what to
   do and what not to do; a neutral example if needed. Never rename or remove output keys, tool names or phrases other code
   depends on.
8. **Generality check, then re-test.** For each new line answer: (1) Is it specific? Rewrite as the principle. (2) Is it already
   covered? Strengthen that line instead of adding one. (3) Why is it generic? One sentence on why it holds for any input
   (another practice, a missing field, a new patient). Save as the next version (a commit: `[TAG] <name> v<n>: <what changed>`),
   regenerate any `also` copies, and go back to step 3 with the **full** matrix. Run `/pre-pr` once, after the last version
   (a "commits since the last check" nudge mid-loop can wait until then).
9. **Finalise.** Abort if the live prompt changed on main during the exercise (rebase and re-run instead). Write the log entry
   (writing `prompts/<name>/LOG.md` also clears the project-band "prompt changed" nudge), then hand over through `/ship` as usual (`/pre-pr`, PR, merge when green). A locked prompt's PR is merged only after the
   owner's OK (the guard asks). Live effects that need a person (for example pressing "Connect Emma") stay with the owner.

## Version log — `prompts/<name>/LOG.md`

```markdown
# <name> — prompt log

| Version | Date | Commit | Issues found (matrix run) | Fix (generic rule) | Why generic |
|---|---|---|---|---|---|
| v0 | 2026-11-15 | abc1234 | baseline: … | — | — |
| v1 | … | … | … | … | … |

## Escalated outside the prompt
- Code / data / retrieval: … (PR or owner)

## Remaining minor issues
- …

## Sign-off
- Owner: … · date: … · locked: yes/no
```

## In the `/ship` report

Add a "Prompt" block: versions run (v0 → vN), the matrix result per version, fixes with their "why generic" line, escalations,
remaining issues, and whether the owner still has to run a round or sign off.

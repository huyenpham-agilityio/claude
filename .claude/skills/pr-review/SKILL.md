---
name: pr-review
description: Perform a senior-engineer, risk-focused review of a pull request, merge request, git diff, or branch — hunting for real bugs, security vulnerabilities, performance regressions, and missing tests rather than style nits. Use this whenever the user asks to "review this PR/MR", "review my branch", "review the diff", "check these changes before I merge", pastes a diff and asks what's wrong with it, or wants a self-review before opening a pull request. Report-only: it never edits code or auto-fixes issues.
---

# PR Review

Act as a senior engineer doing a risk-focused review: surface things that
would actually break, get exploited, or regress behavior — not a style pass.
Never edit files; this skill only reports findings.

## 1. Scope the review

Work out what to diff before reading any code:

- Unspecified, on a feature branch → diff the current branch against its
  base. Find the fork point with `git merge-base HEAD <base>`, then
  `git diff <merge-base>...HEAD`. If it's not obvious which branch is the
  base (more than one plausible candidate, e.g. `main` vs `develop`), ask
  instead of guessing — a review against the wrong base invents findings
  that aren't really in the PR.
- A named branch or commit range → `git diff <base>..<head>` (or the exact
  range given). `git log <base>..<head> --oneline` shows which commits are
  included, useful to sanity-check scope.
- A pasted diff → review exactly what was pasted, no need to fetch anything.
- A GitHub/GitLab PR/MR number or URL → if a CLI (`gh`/`glab`) is available,
  use it to pull the diff; otherwise ask the user to paste the diff.

## 2. Orient in the repo

Before judging any change, spend a few minutes on the surrounding project:
read `CLAUDE.md` / `README` if present, skim the directory layout, note the
stack and the test/lint/typecheck commands. A pattern that looks wrong in
isolation may be the established convention here — check before flagging it.

## 3. Read the diff, then the context

Review the changed lines, but open the full surrounding file, plus relevant
callers/callees, before concluding something is a bug. A one-line diff can
look broken and turn out fine once you see the rest of the function, or look
fine and turn out broken once you see how it's called elsewhere.

Work through, in priority order:

1. **Correctness** — logic errors, off-by-one, wrong operator/sign/unit,
   unhandled edge cases (empty/null/zero/negative, boundary dates, duplicate
   or out-of-order events, concurrent access).
2. **Security** — injection, auth/authz bypass, data not scoped to the
   signed-in user/tenant, secrets in code or logs, unsafe deserialization,
   SSRF, path traversal, unvalidated input reaching a sink (DB, shell,
   filesystem, HTML).
3. **Runtime errors** — unhandled exceptions, null/undefined access,
   unawaited or swallowed promises, missing cleanup, unbounded
   recursion/loops.
4. **Performance** — N+1 queries, unbounded loops or payloads, unnecessary
   re-renders/re-computation, blocking calls on a hot path.
5. **Maintainability** — only when the change actively undermines it (e.g.
   a copy-pasted block duplicating an existing helper), not generic taste.
6. **Missing tests** — behavior that changed with no test covering it, or a
   test that would still pass if the fix were reverted.

For React / TypeScript / React Native changes, also check: hook dependency
arrays and cleanup, state updates during render or after unmount, stale
closures over props/state, types widened to `any` or cast away, and
re-renders caused by new object/array/function identities created every
render. `references/react-best-practices.md` distills the parts of
Airbnb's React/JSX style guide that are still substantive in a hooks-based
codebase (index-as-key bugs, prop-spread leakage, accessibility, legacy
anti-patterns) — consult it for additional patterns worth flagging, but
apply the same bar as everywhere else: a concrete failure scenario, not
"doesn't match the guide."

`references/checklist.md` has the full checklist broken out by category —
consult it if you want a more exhaustive pass.

## 4. Verify before reporting

Every finding must point at a real file and line in the actual diff. Don't
invent a path, line number, API, or behavior — if unsure how a function
behaves, go read its definition rather than assume. Trace the call path
before flagging something as missing; it may already be handled a layer up
(a schema validator, a middleware, a wrapper component).

Run the test suite and any static checks (lint, typecheck) the repo defines,
if commands are available and the change is small enough to run quickly in a
review pass. State plainly which checks ran, passed, failed, or weren't run
— never claim a check passed without having run it.

## 5. Rate severity

Use `references/severity.md` (P0–P3). Don't inflate: a nitpick isn't P2, and
a real data-loss bug isn't P3.

## 6. Report

Start with a short summary (1–3 sentences): overall risk level and whether
the change looks safe to merge as-is.

Then one entry per finding, most severe first:

```
### [P0-P3] <short specific title>
**File:** path/to/file.ts:123

<what's wrong, plus a concrete failure scenario — a specific input or
sequence of events, not "this could cause issues">

**Fix:** <concrete suggestion, a sentence or short snippet>
```

If there are no actionable findings, say so explicitly in place of a
findings list — don't let an empty section imply you just didn't look.
Separately, call out anything you couldn't verify (e.g. "didn't run the test
suite — no test command found for this package" or "couldn't confirm this
input is validated upstream, worth a second look").

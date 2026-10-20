# Severity levels

Rate every finding exactly one of these. When torn between two levels, pick
the lower one and explain the realistic worst case in the finding itself —
severity inflation trains readers to skim past the labels.

## P0 — Critical

A severe security vulnerability, or something that breaks the system for
everyone (not just an edge case).

Examples: SQL/command injection reachable by an attacker, auth check removed
from a route that returns other users' data, secret committed in plaintext,
a migration that drops a column still read by running code.

## P1 — High

A major bug, data loss, security issue, or a significant regression — serious,
but narrower in blast radius or reach than P0 (needs a specific precondition,
affects one feature rather than the whole app, or requires non-trivial
attacker effort).

Examples: a write path that can silently lose or overwrite user data under a
race condition, a currency/unit conversion bug that miscalculates money,
authz that checks the wrong field (e.g. checks `userId` but not `householdId`).

## P2 — Medium

A functional bug or a reliability/performance issue with real but bounded
impact — wrong behavior in a reachable but non-primary path, or a perf issue
that degrades rather than breaks.

Examples: an N+1 query on a list endpoint that will get slow as data grows,
a form that accepts invalid input the backend then rejects with a confusing
error, a React effect missing a cleanup that leaks a subscription.

## P3 — Low

A minor issue with a concrete, demonstrable impact — not a style preference.
If you can't point to a specific input or scenario where it causes a visible
problem, it's not a finding; it's a nitpick, and nitpicks aren't reported.

Examples: an error path that logs instead of surfacing a message to the
user, a missing `aria-label` on an icon button, a rarely-hit edge case with a
minor UX cost (wrong but harmless formatting).

## Not a finding

Don't report, at any severity:

- Style preferences the linter doesn't already enforce.
- Issues already handled elsewhere in the code (trace the call path first).
- Speculative "this could maybe be a problem" without a concrete scenario.
- Whole-file rewrites or broad refactors unrelated to the change's risk.

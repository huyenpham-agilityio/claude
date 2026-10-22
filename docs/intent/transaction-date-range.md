# Intent: filter transactions by a date range

Status: draft, for review. Not yet planned or built.

## What I want

On the Transactions page, let a person look at their transactions between two
dates of their choice (for example 15 Sep to 10 Oct), in addition to the month
picker they have today. The list, the income and expense totals, and the paging
must all follow the chosen range.

## Why

Pay days, trips and bills rarely line up with calendar months. Today a person
who wants to know "what did I spend since my salary arrived on the 25th" has to
add up two months by hand. The totals are the point: a range that shows the
list but the wrong totals would be worse than no range.

## Who it is for

Anyone signed in to the app, on the English or the Vietnamese interface.

## Constraints

These come from CLAUDE.md and are not up for debate in the plan.

- Change the request and response shapes in `shared/` first.
- Days are `YYYY-MM-DD`, in local time; use `client/src/lib/dates.ts`.
- Every query is scoped to the signed-in user (`currentUser(req).id`).
- Every visible string is a key in `client/src/locales/en.ts` and `vi.ts`.
  Validation messages are keys through `msg('key')`.
- Money stays an integer in VND; no floats.
- Server errors use `HttpError` with a code from `apiErrorMessages`.
- Tests live in `__tests__/` next to the code. UI tests use `renderApp()` and
  `mockApi()`.
- `pnpm typecheck && pnpm lint && pnpm test` must pass.

## Behaviour that must hold

1. Choosing a range shows only transactions dated from the start day to the end
   day, both included.
2. The income and expense totals cover every transaction in the range, not only
   the current page.
3. Paging works inside the range and goes back to page 1 when the range changes.
4. The existing filters (type, category, search) still combine with the range.
5. A range whose end is before its start is refused with a clear message in the
   chosen language, and nothing is requested.
6. Clearing the range returns to the month view the page has today.
7. The chosen range is in the address, so a reload or a shared link shows the
   same list.
8. One account can never see another account's transactions through the range.

## Out of scope

- Saving favourite ranges or presets such as "last 30 days".
- Applying the range to the Overview, Budgets or Reports pages.
- Exporting the filtered list.

## Open questions for the planning session

- Does the range replace the month picker, or sit next to it? (The month view
  must keep working either way.)
- Should the API take `from` and `to` as two new query fields, or a single
  range field? Which is simpler to validate in `shared/`?
- What is the longest range allowed, if any, so that one request stays fast?
- How should the page look on a narrow phone screen, where the filter row is
  already crowded?

## How we will know it works

- Server tests: range edges are inclusive, totals match the list, the range
  combines with type, category and search, bad ranges are rejected, and another
  account's data never appears.
- Client test: pick a range, see the list and totals change, see the error for a
  reversed range in both languages.
- A manual check in the browser: pick a range, reload the page, switch language.

## Next step

Open a plan-mode session with this file as the starting point and ask for a
plan before any code is written.

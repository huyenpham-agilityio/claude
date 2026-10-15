# Review checklist

Use this for a more exhaustive pass, or when you need a reminder of what to
look for in a category. It's a prompt for attention, not a form to fill out
— don't report an item just because it's listed here; only report it if you
found a real instance in the actual diff.

## Correctness

- Off-by-one, inverted condition, wrong comparison operator.
- Wrong sign, unit, or precision (especially money, dates, durations).
- Boundary values: empty list/string, zero, negative, max int, leap day,
  month/year rollover, DST transitions.
- Mutation of shared/shared-by-reference state (arrays, objects) the caller
  didn't expect to change.
- Order-of-operations bugs in async code: state read before a preceding
  write/await resolves.

## Security

- Input from the client (body, query, headers, path params) used in a
  query, shell command, file path, or HTML output without validation or
  escaping.
- Authorization checks scoped to the wrong entity (checks the user is logged
  in, not that the user owns the resource).
- Secrets, tokens, or credentials hard-coded, logged, or sent to the client.
- Deserializing untrusted data without a schema/allowlist.
- Redirects or outbound requests built from user-controlled input (open
  redirect, SSRF).
- Dependencies or endpoints newly exposed without the auth/rate-limiting the
  rest of the app uses.

## Runtime errors

- `.then()`/`await` missing on a promise whose result or rejection matters.
- Array/object access that can be `undefined` (optional chaining skipped
  where the value is genuinely optional).
- Error paths that swallow exceptions silently instead of surfacing or
  logging them.
- Resources (connections, file handles, listeners, timers) opened without a
  matching close/cleanup.

## Performance

- A query or API call inside a loop (N+1) where a batch call is possible.
- Loading an entire collection into memory where pagination or streaming
  exists elsewhere in the codebase.
- Expensive work (parsing, sorting, formatting) repeated on every render or
  every request instead of memoized/cached.
- A new synchronous/blocking call on a path that was previously async or
  non-blocking.

## React / TypeScript / React Native specifics

- `useEffect`/`useMemo`/`useCallback` dependency arrays missing a value they
  use, or including one that causes unwanted re-runs.
- Effects that subscribe/fetch without a cleanup function, especially ones
  that can run after the component unmounts.
- State updates or fetches triggered during render instead of in an event
  handler or effect.
- Stale closures: a callback capturing a prop/state value from an earlier
  render instead of the latest one.
- `any`, `as unknown as`, or `@ts-ignore` introduced to silence a real type
  mismatch rather than fix it.
- New object/array/function literals created inline in JSX props on every
  render, breaking memoization of a child component that relies on
  reference equality.
- Keys in lists that aren't stable (e.g. array index) when the list can
  reorder or filter.

See `references/react-best-practices.md` for more (prop-spread leakage,
accessibility, legacy anti-patterns like mixins/string refs/`isMounted`).

## Tests

- Behavior added or changed with no test exercising it.
- A test that asserts on something other than the behavior that changed
  (e.g. snapshot test that would pass even if the logic were wrong).
- A test that mocks away the exact thing the change is supposed to fix.

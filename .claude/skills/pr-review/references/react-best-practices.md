# React/JSX best practices

Distilled from the [Airbnb React/JSX style guide](https://github.com/airbnb/javascript/tree/master/react).
Most of that guide covers class-component patterns (`React.createClass`,
lifecycle method ordering, binding handlers in a constructor, `isMounted`)
that are obsolete in a hooks-based, function-component codebase, and pure
JSX formatting (quote style, prop spacing, closing-bracket placement) that a
linter/formatter already enforces — don't re-report either of those; they're
"not a finding" per `severity.md`.

What's left is substantive enough to flag when violated with a concrete
impact — not just "doesn't match the guide."

## Keys and lists

- **Don't use the array index as `key`** when the list can reorder, filter,
  or have items inserted/removed — use a stable id instead. Index keys cause
  React to reuse the wrong DOM node/state across re-renders: inputs show the
  previous row's value, form state attaches to the wrong item, transitions
  animate the wrong element. This is a real bug, not a style nit — flag it
  when the list is backed by data that can change order, not on a genuinely
  static, append-only list.

## Props

- **Boolean props**: `<Foo hidden />` over `<Foo hidden={true} />` — purely
  stylistic, skip unless the project's own convention is already consistent
  and this breaks it.
- **Spread props sparingly**: spreading `...props` onto a DOM element or
  child component can leak unintended attributes (an unexpected `onClick`,
  a stray `data-*`, an id collision) or forward props the component never
  meant to accept. Worth flagging when the spread target is a native DOM
  element and the source object isn't narrowly scoped — check whether
  unwanted keys could flow through.
- **Prop naming collisions**: reusing a DOM prop name (`style`, `className`,
  `onClick`) for a custom, differently-shaped purpose on a component is
  confusing and bug-prone for callers. Flag if a custom component shadows a
  DOM prop with different semantics.

## Accessibility

- **`<img>` needs real `alt` text**, or `alt=""`/`role="presentation"` for
  purely decorative images. Missing `alt` is a concrete accessibility
  regression, not a nitpick.
- **Don't use `accessKey`** — it collides with screen reader and browser
  shortcuts unpredictably.
- **Use only valid ARIA roles**, not invented or abstract ones (`role="button"`
  not `role="datepicker"`).
- (This repo's own convention goes further: every icon-only button needs a
  translated `aria-label` — see `CLAUDE.md`.)

## Component structure

- **One component per file** (stateless/presentational sub-components in the
  same file are fine) — large multi-component files are harder to review and
  reuse. Flag only if the file has grown genuinely tangled, not for a small,
  tightly-coupled pair of components.
- **Name by reference, not `displayName`** — a function/class name that
  matches the file and export is what shows up in React DevTools and stack
  traces; an explicit `displayName` that drifts from the actual name is
  actively misleading.
- **HOCs should set a `displayName`** composing the wrapper and wrapped name
  (`withFoo(Bar)`) — otherwise errors and DevTools show an anonymous
  component, making bugs in wrapped components hard to trace.

## Anti-patterns worth flagging on sight

- **Mixins** — implicit dependencies and name clashes; prefer a hook, HOC, or
  plain utility module instead.
- **`isMounted()`** — doesn't exist in function components/hooks; a true
  anti-pattern wherever it appears (checking a ref instead is also usually
  a sign of a missing cleanup — see the "React specifics" checklist for
  effect cleanup).
- **String refs** (`ref="myRef"`) — deprecated, fragile, and incompatible
  with function components; should be a ref callback or `useRef`.

## When to actually report these

Same bar as every other finding in this skill: point at the real line, state
the concrete failure scenario, and skip anything the project's linter
already catches. A reorderable list with an index key is a real bug — report
it. A double-quote vs single-quote JSX attribute is not.

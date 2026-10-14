# CLAUDE.md

Household Expenses: a single-user web app for spending, budgets, income, savings
and reports. Setup and accounts are in README.md.

## Commands (run from the repo root)

- `pnpm dev`: API on :3000 and Vite on :5173 (proxies `/api`)
- `pnpm typecheck && pnpm lint && pnpm test`: run all three before calling work done
- `pnpm --filter client exec vitest run <path>`: one client test file (same for `server`)
- `pnpm db:migrate`: after editing `server/prisma/schema.prisma`; commit the new
  `server/prisma/migrations/<name>/migration.sql`
- Use pnpm (via corepack), never npm or yarn.

## Layout

- `shared/` (`@expenses/shared`): Zod schemas and types used by both sides,
  consumed as TypeScript source. Change request/response shapes here first.
- `server/`: Express 5 + Prisma 7 on libSQL (SQLite file locally, Turso in
  production). Routes in `src/routes/`, errors in `src/errors.ts` and
  `src/middleware/error.ts`. Production migrations run through `src/migrate.ts`
  (Prisma Migrate cannot reach Turso).
- `client/`: React 19, Vite, React Router, TanStack Query, react-hook-form +
  zodResolver, Tailwind v4, shadcn/ui in `src/components/ui/`. Pages in
  `src/pages/`, data hooks in `src/lib/`.
- Deployed to Render from `render.yaml`; the server also serves the built client
  (`server/src/static.ts`).

## Conventions

- Money is an integer in the currency's smallest unit (VND by default). Format with
  `formatMoney` and parse input with `parseAmountInput` in `client/src/lib/money.ts`.
- Months are `YYYY-MM`, days `YYYY-MM-DD`, in local time; helpers in
  `client/src/lib/dates.ts`.
- Validation messages are keys, not text: use `msg('key')` from
  `shared/src/validation.ts` and add the key to both locale files.
- Server errors: `throw new HttpError(status, 'code')` with a code from
  `apiErrorMessages` in `shared/src/common.ts`. The client shows them with
  `useErrorText()` from `client/src/lib/errors.ts`, never `error.message`.
- UI text: no hard-coded strings. Add keys to `client/src/locales/en.ts` and
  `vi.ts` (typecheck fails if `vi` is missing a key) and use `useTranslation()`.
  Pass pre-formatted values into `{{placeholders}}`; plurals use `_one`/`_other`.
- Format dates and numbers with the current locale (`currentLocaleTag()`), never
  `undefined` and never in a module-level `Intl` object.
- Every icon-only button needs a translated `aria-label`.
- Component files export only components (react-refresh lint rule); put hooks and
  helpers in `src/lib/`.
- Comments explain why, briefly; match the surrounding style.

## Tests

- Vitest. Server tests in `server/__tests__/`; client tests in `__tests__/` folders
  next to the code (`client/src/__tests__/`, `client/src/lib/__tests__/`).
- Client UI tests render the real routes with `renderApp()` and stub the API with
  `mockApi()` (`client/src/__tests__/renderApp.tsx`); fixtures are in `fixtures.ts`.
- Tests run in English; `setup.ts` resets the language after each test. Query by
  role and visible text.

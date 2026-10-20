# CLAUDE.md

Household Expenses: pnpm monorepo. `shared/` holds Zod schemas used by both
sides, `server/` is Express + Prisma (SQLite locally, Turso in production),
`client/` is React + Vite. Setup is in README.md.

## Commands (repo root)

- `pnpm dev`: API on :3000, app on :5173 (proxies `/api`)
- `pnpm typecheck && pnpm lint && pnpm test`: all three must pass before a PR
- `pnpm --filter client exec vitest run <path>`: one test file (or `--filter server`)
- `pnpm db:migrate`: after editing `server/prisma/schema.prisma`; commit the new migration folder
- `pnpm build`: production client build; the server serves it (`server/src/static.ts`)

## Conventions

- **Shapes:** request/response shapes live in `shared/`. Change them there first.
- **Money:** an integer in the currency's smallest unit (VND), so sums never
  drift. Format and parse with `client/src/lib/money.ts`.
- **Dates:** months are `YYYY-MM`, days `YYYY-MM-DD`, in local time; see `client/src/lib/dates.ts`.
- **UI text:** every visible string is a key in `client/src/locales/en.ts`
  and `vi.ts`, used with `useTranslation()`. The typecheck fails if `vi` is
  missing a key.
- **Validation messages:** keys, via `msg('key')` from `shared/src/validation.ts`, translated when shown.
- **Server errors:** `throw new HttpError(status, 'code')` with a code from
  `apiErrorMessages` (`shared/src/common.ts`). The client shows them with
  `useErrorText()`.
- **Formatting:** dates and numbers use `currentLocaleTag()`, so they follow the chosen language.
- **Data access:** every query is scoped to `currentUser(req).id`.
- **Hooks and helpers** go in `src/lib/`. Component files export only components (lint rule).
- **Tests** live in `__tests__/` next to the code. UI tests render real routes
  with `renderApp()` and stub the API with `mockApi()`
  (`client/src/__tests__/renderApp.tsx`).

## Never

- Use npm or yarn; use pnpm via corepack. The lockfile is pnpm's. A Claude Code hook (`.claude/hooks/block-forbidden-commands.mjs`) blocks both.
- Hard-code UI text, or show `error.message` to users.
- Use floats for money, or `Intl`/`toLocale*` with `undefined` or at module level.
- Edit a migration that's already committed; add a new one instead.
- Run `prisma migrate` against Turso; production applies migrations via `server/src/migrate.ts`.
- Commit `server/.env`, `*.db` files or secrets.
- Query data without the signed-in user's id.
- Push unreviewed work to `feat/practice` on GitHub; Render deploys it to the live site.

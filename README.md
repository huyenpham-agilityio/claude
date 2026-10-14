# Household Expenses

A single-user web app for tracking household spending, budgets, income, and savings.

## Stack

- **client/**: React, Vite, TypeScript, React Router, TanStack Query, Tailwind, shadcn/ui
- **server/**: Node, Express, TypeScript, Prisma with SQLite
- **shared/**: Zod schemas and types used by both sides

## Getting started

Requires Node 24 or newer and pnpm 9.

```bash
pnpm install
cp server/.env.example server/.env
pnpm db:migrate
pnpm dev
```

The app runs at http://localhost:5173 and proxies `/api` to the API on port 3000.

## Scripts

Run these from the repo root.

| Command | What it does |
|---|---|
| `pnpm dev` | Starts the API and the client together |
| `pnpm test` | Runs server and client tests |
| `pnpm typecheck` | Type-checks every workspace |
| `pnpm lint` | Lints the repo with ESLint |
| `pnpm build` | Builds the client for production |
| `pnpm db:migrate` | Creates and applies a migration after a schema change |
| `pnpm db:generate` | Regenerates the Prisma client |

## Accounts

Create your account at `/register`. The app is meant for one person, so once
your account exists, set `REGISTRATION_OPEN=false` in `server/.env` and restart
the API to stop anyone else signing up.

## Conventions

- Money is stored as a whole number of the currency's smallest unit (VND by default).
- Request and response shapes live in `shared/` and are validated on both sides.
- Sessions are an httpOnly cookie; the database stores only a hash of the token.

## Roadmap

1. Scaffold (done)
2. Auth: register, login, logout, protected routes (done)
3. Transactions and categories (done)
4. Budgets
5. Income, savings goals, and dashboard
6. Reports and CSV export
7. Polish and deploy

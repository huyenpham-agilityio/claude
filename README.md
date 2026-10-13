# Household Expenses

A single-user web app for tracking household spending, budgets, income, and savings.

## Stack

- **client/**: React, Vite, TypeScript, React Router, TanStack Query, Tailwind, shadcn/ui
- **server/**: Node, Express, TypeScript, Prisma with SQLite
- **shared/**: Zod schemas and types used by both sides

## Getting started

Requires Node 24 or newer.

```bash
npm install
cp server/.env.example server/.env
npm run db:migrate
npm run dev
```

The app runs at http://localhost:5173 and proxies `/api` to the API on port 3000.

## Scripts

Run these from the repo root.

| Command | What it does |
|---|---|
| `npm run dev` | Starts the API and the client together |
| `npm test` | Runs server and client tests |
| `npm run typecheck` | Type-checks every workspace |
| `npm run lint` | Lints the repo with ESLint |
| `npm run build` | Builds the client for production |
| `npm run db:migrate` | Creates and applies a migration after a schema change |
| `npm run db:generate` | Regenerates the Prisma client |

## Conventions

- Money is stored as a whole number of the currency's smallest unit (VND by default).
- Request and response shapes live in `shared/` and are validated on both sides.

## Roadmap

1. Scaffold (done)
2. Auth: register, login, logout, protected routes
3. Transactions and categories
4. Budgets
5. Income, savings goals, and dashboard
6. Reports and CSV export
7. Polish and deploy

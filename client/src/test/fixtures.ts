import type {
  Budget,
  BudgetListResponse,
  Category,
  Transaction,
  TransactionListResponse,
  User,
} from '@expenses/shared'

export const user: User = { id: 'u1', email: 'me@example.com', currency: 'VND' }

export const categories: Category[] = [
  { id: 'c-groceries', name: 'Groceries', type: 'expense', color: '#22c55e', transactionCount: 1 },
  { id: 'c-rent', name: 'Rent', type: 'expense', color: '#6366f1', transactionCount: 0 },
  { id: 'c-salary', name: 'Salary', type: 'income', color: '#22c55e', transactionCount: 1 },
]

export const transactions: Transaction[] = [
  {
    id: 't-salary',
    type: 'income',
    amount: 30_000_000,
    date: '2026-10-05',
    note: null,
    category: { id: 'c-salary', name: 'Salary', color: '#22c55e' },
  },
  {
    id: 't-groceries',
    type: 'expense',
    amount: 200_000,
    date: '2026-10-03',
    note: 'Weekly market',
    category: { id: 'c-groceries', name: 'Groceries', color: '#22c55e' },
  },
]

export function listResponse(items: Transaction[] = transactions): TransactionListResponse {
  const sum = (type: Transaction['type']) =>
    items.filter((item) => item.type === type).reduce((total, item) => total + item.amount, 0)
  return {
    transactions: items,
    page: 1,
    pageCount: 1,
    total: items.length,
    totals: { income: sum('income'), expense: sum('expense') },
  }
}

export const budgets: Budget[] = [
  {
    id: 'b-groceries',
    month: '2026-10',
    limitAmount: 2_000_000,
    spent: 800_000,
    category: { id: 'c-groceries', name: 'Groceries', color: '#22c55e' },
  },
]

export function budgetListResponse(
  items: Budget[] = budgets,
  copyFrom: string | null = null,
): BudgetListResponse {
  return { month: '2026-10', budgets: items, copyFrom }
}

// Handlers for a signed-in session with the fixture data above.
export function signedInHandlers() {
  return {
    'GET /api/auth/me': () => Response.json({ user }),
    'GET /api/budgets': () => Response.json(budgetListResponse()),
    'GET /api/categories': () => Response.json({ categories }),
    'GET /api/transactions': () => Response.json(listResponse()),
  }
}

import { Link, NavLink, Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import { useCurrentUser, useLogout } from '@/lib/auth'

const NAV_LINKS = [
  { to: '/', label: 'Overview' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/savings', label: 'Savings' },
  { to: '/reports', label: 'Reports' },
  { to: '/categories', label: 'Categories' },
]

export function App() {
  const { data: user } = useCurrentUser()
  const logout = useLogout()

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <h1 className="text-lg font-semibold">
            <Link to="/">Household Expenses</Link>
          </h1>
          {user && (
            <div className="flex min-w-0 items-center gap-3">
              <span className="hidden truncate text-sm text-muted-foreground sm:inline">
                {user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={logout.isPending}
                onClick={() => logout.mutate()}
              >
                Log out
              </Button>
            </div>
          )}
        </div>
        {user && (
          <nav aria-label="Main" className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-2">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  `-mb-px shrink-0 border-b-2 px-2 py-2 text-sm font-medium ${
                    isActive
                      ? 'border-foreground text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

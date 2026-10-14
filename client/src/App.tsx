import { Link, Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import { useCurrentUser, useLogout } from '@/lib/auth'

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
              <span className="truncate text-sm text-muted-foreground">{user.email}</span>
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
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

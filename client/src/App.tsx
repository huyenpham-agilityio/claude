import { LogOut } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { ThemeToggle } from '@/components/ThemeToggle'
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

// The section tabs. On narrow screens the row scrolls sideways.
function MainNav() {
  const navRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()

  // Bring the current tab into view when it starts off-screen, for example
  // after opening Categories from a link on a phone. Only the row scrolls,
  // never the page.
  useEffect(() => {
    const nav = navRef.current
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!nav || !active) return

    // Keep the row's own padding visible on either side of the tab.
    const padding = parseFloat(getComputedStyle(nav).paddingLeft) || 0
    const start = active.offsetLeft - nav.offsetLeft - padding
    const end = active.offsetLeft - nav.offsetLeft + active.offsetWidth + padding
    if (start < nav.scrollLeft) nav.scrollLeft = start
    else if (end > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = end - nav.clientWidth
  }, [pathname])

  return (
    <nav
      ref={navRef}
      aria-label="Main"
      className="mx-auto -mb-px flex max-w-4xl gap-1 overflow-x-auto overflow-y-hidden px-2"
    >
      {/*
        The row overlaps the header's bottom border by 1px so the active
        tab's underline covers it. The overlap is on the row, not the tabs:
        tabs that stick out of this scrolling row would make it scroll
        vertically and show a scrollbar. overflow-y-hidden rules that out.
      */}
      {NAV_LINKS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            // The focus ring is drawn inside the tab; the row would clip one
            // drawn outside it.
            `shrink-0 border-b-2 px-2 py-2 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset ${
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
  )
}

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
          <div className="flex min-w-0 items-center gap-2">
            <ThemeToggle />
            {user && (
              <>
                <span className="hidden truncate text-sm text-muted-foreground sm:inline">
                  {user.email}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Log out"
                  title="Log out"
                  disabled={logout.isPending}
                  onClick={() => logout.mutate()}
                >
                  <LogOut aria-hidden="true" />
                </Button>
              </>
            )}
          </div>
        </div>
        {user && <MainNav />}
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

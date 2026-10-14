import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router'

const NAV_LINKS = [
  { to: '/', label: 'Overview' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/savings', label: 'Savings' },
  { to: '/reports', label: 'Reports' },
  { to: '/categories', label: 'Categories' },
]

// The focus ring is drawn inside the tab; the scrolling row would clip one
// drawn outside it.
const TAB_CLASSES =
  'shrink-0 border-b-2 px-2 py-2 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset'
const ACTIVE_TAB_CLASSES = 'border-foreground text-foreground'
const INACTIVE_TAB_CLASSES = 'border-transparent text-muted-foreground hover:text-foreground'

// The section tabs. On narrow screens the row scrolls sideways.
export function MainNav() {
  const navRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()

  // Bring the current tab into view when it starts off-screen, for example
  // after opening Categories from a link on a phone. Only the row scrolls,
  // never the page.
  useEffect(() => {
    const nav = navRef.current
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!nav || !active) return

    // The tab's position within the row's scrollable content, measured on
    // screen so it doesn't depend on which ancestor is positioned.
    const tabLeft =
      active.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft
    // Keep the row's own padding visible on either side of the tab.
    const padding = parseFloat(getComputedStyle(nav).paddingLeft) || 0
    const start = tabLeft - padding
    const end = tabLeft + active.offsetWidth + padding
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
            `${TAB_CLASSES} ${isActive ? ACTIVE_TAB_CLASSES : INACTIVE_TAB_CLASSES}`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

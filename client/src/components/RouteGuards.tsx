import { Navigate, Outlet, useLocation } from 'react-router'
import { useCurrentUser } from '@/lib/auth'

function GuardStatus({ children }: { children: string }) {
  return (
    <p role="status" className="p-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  )
}

// Renders child routes only for a signed-in user; otherwise sends them to
// /login and remembers where they were going.
export function RequireAuth() {
  const user = useCurrentUser()
  const location = useLocation()

  if (user.isPending) return <GuardStatus>Loading…</GuardStatus>
  if (user.isError) return <GuardStatus>Could not reach the server. Try reloading.</GuardStatus>
  if (!user.data) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

// Keeps signed-in users out of the login and register pages.
export function GuestOnly() {
  const user = useCurrentUser()
  const location = useLocation()
  const from: unknown = location.state?.from

  if (user.isPending) return <GuardStatus>Loading…</GuardStatus>
  if (user.data) return <Navigate to={typeof from === 'string' ? from : '/'} replace />
  return <Outlet />
}

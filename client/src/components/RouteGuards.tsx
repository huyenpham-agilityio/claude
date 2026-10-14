import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  if (user.isPending) return <GuardStatus>{t('common.loading')}</GuardStatus>
  if (user.isError) return <GuardStatus>{t('auth.serverUnreachable')}</GuardStatus>
  if (!user.data) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

// Keeps signed-in users out of the login and register pages.
export function GuestOnly() {
  const user = useCurrentUser()
  const location = useLocation()
  const from: unknown = location.state?.from
  const { t } = useTranslation()

  if (user.isPending) return <GuardStatus>{t('common.loading')}</GuardStatus>
  if (user.data) return <Navigate to={typeof from === 'string' ? from : '/'} replace />
  return <Outlet />
}

import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Outlet } from 'react-router'
import { LanguageToggle } from '@/components/LanguageToggle'
import { MainNav } from '@/components/MainNav'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { useCurrentUser, useLogout } from '@/lib/auth'

export function App() {
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const { t } = useTranslation()

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <h1 className="text-lg font-semibold">
            <Link to="/">{t('app.title')}</Link>
          </h1>
          <div className="flex min-w-0 items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            {user && (
              <>
                <span className="hidden truncate text-sm text-muted-foreground sm:inline">
                  {user.email}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('app.logOut')}
                  title={t('app.logOut')}
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

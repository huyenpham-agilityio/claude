import { Link, Outlet } from 'react-router'

export function App() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <h1 className="text-lg font-semibold">
            <Link to="/">Household Expenses</Link>
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

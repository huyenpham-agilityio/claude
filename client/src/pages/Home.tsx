import { useCurrentUser } from '@/lib/auth'

export function Home() {
  const { data: user } = useCurrentUser()

  return (
    <section>
      <h2 className="text-2xl font-semibold">Welcome</h2>
      <p className="mt-2 text-muted-foreground">
        You're signed in as {user?.email}. Transactions and budgets will appear here.
      </p>
    </section>
  )
}

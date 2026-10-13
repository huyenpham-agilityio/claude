import { healthResponseSchema } from '@expenses/shared'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export function Home() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => apiFetch('/health', healthResponseSchema),
  })

  return (
    <section>
      <h2 className="text-2xl font-semibold">Welcome</h2>
      <p className="mt-2 text-muted-foreground">
        Track spending, budgets, income, and savings in one place.
      </p>
      <p className="mt-6 text-sm" role="status">
        {health.isPending && 'Checking API…'}
        {health.isError && 'API unreachable'}
        {health.isSuccess && `API ${health.data.status}, database ${health.data.db}`}
      </p>
    </section>
  )
}

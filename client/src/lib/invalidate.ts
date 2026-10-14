import { useQueryClient } from '@tanstack/react-query'

// Transactions, categories, and budgets each show data derived from the
// others (counts, names, colours, spent totals), so a change to one refreshes all.
export function useInvalidateLedger() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      ['transactions', 'categories', 'budgets'].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    )
}

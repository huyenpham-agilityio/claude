import {
  type TransactionInput,
  type TransactionType,
  okResponseSchema,
  transactionListResponseSchema,
  transactionResponseSchema,
} from '@expenses/shared'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, jsonBody } from './api.ts'

export interface TransactionFilters {
  month: string
  type?: TransactionType
  categoryId?: string
  q?: string
  page: number
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => {
      const params = new URLSearchParams({ month: filters.month, page: String(filters.page) })
      if (filters.type) params.set('type', filters.type)
      if (filters.categoryId) params.set('categoryId', filters.categoryId)
      if (filters.q) params.set('q', filters.q)
      return apiFetch(`/transactions?${params}`, transactionListResponseSchema)
    },
    // Keep the old list on screen while a filter change loads.
    placeholderData: keepPreviousData,
  })
}

// Category rows show how many transactions they hold, so refresh both.
function useInvalidate() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['categories'] }),
    ])
}

export function useSaveTransaction() {
  return useMutation({
    mutationFn: ({ id, ...input }: TransactionInput & { id?: string }) =>
      id
        ? apiFetch(`/transactions/${id}`, transactionResponseSchema, jsonBody('PATCH', input))
        : apiFetch('/transactions', transactionResponseSchema, jsonBody('POST', input)),
    onSuccess: useInvalidate(),
  })
}

export function useDeleteTransaction() {
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/transactions/${id}`, okResponseSchema, { method: 'DELETE' }),
    onSuccess: useInvalidate(),
  })
}

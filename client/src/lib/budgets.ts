import {
  type BudgetCopy,
  type BudgetInput,
  budgetListResponseSchema,
  budgetResponseSchema,
  okResponseSchema,
} from '@expenses/shared'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { apiFetch, jsonBody } from './api.ts'
import { useInvalidateLedger } from './invalidate.ts'

export function useBudgets(month: string) {
  return useQuery({
    queryKey: ['budgets', month],
    queryFn: () => apiFetch(`/budgets?month=${month}`, budgetListResponseSchema),
    // Keep the old month on screen while the next one loads.
    placeholderData: keepPreviousData,
  })
}

export function useSaveBudget() {
  return useMutation({
    mutationFn: (input: BudgetInput) =>
      apiFetch('/budgets', budgetResponseSchema, { method: 'PUT', body: JSON.stringify(input) }),
    onSuccess: useInvalidateLedger(),
  })
}

export function useCopyBudgets() {
  return useMutation({
    mutationFn: (input: BudgetCopy) =>
      apiFetch('/budgets/copy', okResponseSchema, jsonBody('POST', input)),
    onSuccess: useInvalidateLedger(),
  })
}

export function useDeleteBudget() {
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/budgets/${id}`, okResponseSchema, { method: 'DELETE' }),
    onSuccess: useInvalidateLedger(),
  })
}

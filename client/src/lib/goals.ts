import {
  type Goal,
  type GoalInput,
  goalListResponseSchema,
  goalResponseSchema,
  okResponseSchema,
} from '@expenses/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, jsonBody } from './api.ts'

const goalsKey = ['goals'] as const

export function useGoals() {
  return useQuery({
    queryKey: goalsKey,
    queryFn: async () => (await apiFetch('/goals', goalListResponseSchema)).goals,
  })
}

function useInvalidateGoals() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: goalsKey })
}

export function useSaveGoal() {
  return useMutation({
    mutationFn: ({ id, ...input }: GoalInput & { id?: string }) =>
      id
        ? apiFetch(`/goals/${id}`, goalResponseSchema, jsonBody('PATCH', input))
        : apiFetch('/goals', goalResponseSchema, jsonBody('POST', input)),
    onSuccess: useInvalidateGoals(),
  })
}

export function useContribute() {
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      apiFetch(`/goals/${id}/contributions`, goalResponseSchema, jsonBody('POST', { amount })),
    onSuccess: useInvalidateGoals(),
  })
}

export function useDeleteGoal() {
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/goals/${id}`, okResponseSchema, { method: 'DELETE' }),
    onSuccess: useInvalidateGoals(),
  })
}

export type GoalPace =
  | { kind: 'reached' }
  | { kind: 'no-date' }
  | { kind: 'overdue' }
  | { kind: 'monthly'; amount: number; months: number }

// How much to save each month, counting this month and the target month, to
// reach the goal by its date. `today` is "YYYY-MM-DD".
export function goalPace(goal: Goal, today: string): GoalPace {
  const remaining = goal.targetAmount - goal.savedAmount
  if (remaining <= 0) return { kind: 'reached' }
  if (!goal.targetDate) return { kind: 'no-date' }
  if (goal.targetDate < today) return { kind: 'overdue' }

  const [year, month] = today.split('-').map(Number) as [number, number]
  const [targetYear, targetMonth] = goal.targetDate.split('-').map(Number) as [number, number]
  const months = (targetYear - year) * 12 + (targetMonth - month) + 1
  return { kind: 'monthly', amount: Math.ceil(remaining / months), months }
}

// What is still missing to reach the goal; 0 once it is reached or passed.
export function goalAmountLeft(goal: Goal): number {
  return Math.max(0, goal.targetAmount - goal.savedAmount)
}

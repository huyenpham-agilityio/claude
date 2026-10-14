import {
  type CategoryCreate,
  type CategoryUpdate,
  categoryListResponseSchema,
  categoryResponseSchema,
  okResponseSchema,
} from '@expenses/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, jsonBody } from './api.ts'

const categoriesKey = ['categories'] as const

export function useCategories() {
  return useQuery({
    queryKey: categoriesKey,
    queryFn: async () => (await apiFetch('/categories', categoryListResponseSchema)).categories,
  })
}

// Transactions embed their category's name and colour, so refresh both.
function useInvalidate() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: categoriesKey }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    ])
}

export function useCreateCategory() {
  return useMutation({
    mutationFn: (input: CategoryCreate) =>
      apiFetch('/categories', categoryResponseSchema, jsonBody('POST', input)),
    onSuccess: useInvalidate(),
  })
}

export function useUpdateCategory() {
  return useMutation({
    mutationFn: ({ id, ...input }: CategoryUpdate & { id: string }) =>
      apiFetch(`/categories/${id}`, categoryResponseSchema, jsonBody('PATCH', input)),
    onSuccess: useInvalidate(),
  })
}

export function useDeleteCategory() {
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/categories/${id}`, okResponseSchema, { method: 'DELETE' }),
    onSuccess: useInvalidate(),
  })
}

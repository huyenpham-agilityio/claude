import {
  type CategoryCreate,
  type CategoryUpdate,
  categoryListResponseSchema,
  categoryResponseSchema,
  okResponseSchema,
} from '@expenses/shared'
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiFetch, jsonBody } from './api.ts'
import { compareNames, useLanguage } from './language.ts'
import { useInvalidateLedger } from './invalidate.ts'

const categoriesKey = ['categories'] as const

export function useCategories() {
  const { language } = useLanguage()
  return useQuery({
    queryKey: categoriesKey,
    queryFn: async () => (await apiFetch('/categories', categoryListResponseSchema)).categories,
    // The server sorts by character code; sort by the language's alphabet.
    select: (categories) =>
      categories.toSorted(
        (a, b) => a.type.localeCompare(b.type) || compareNames(a.name, b.name, language),
      ),
  })
}

export function useCreateCategory() {
  return useMutation({
    mutationFn: (input: CategoryCreate) =>
      apiFetch('/categories', categoryResponseSchema, jsonBody('POST', input)),
    onSuccess: useInvalidateLedger(),
  })
}

export function useUpdateCategory() {
  return useMutation({
    mutationFn: ({ id, ...input }: CategoryUpdate & { id: string }) =>
      apiFetch(`/categories/${id}`, categoryResponseSchema, jsonBody('PATCH', input)),
    onSuccess: useInvalidateLedger(),
  })
}

export function useDeleteCategory() {
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/categories/${id}`, okResponseSchema, { method: 'DELETE' }),
    onSuccess: useInvalidateLedger(),
  })
}

import {
  type LoginInput,
  type RegisterInput,
  type User,
  authResponseSchema,
  okResponseSchema,
} from '@expenses/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiRequestError, apiFetch } from './api.ts'

const currentUserKey = ['auth', 'me'] as const

async function fetchCurrentUser(): Promise<User | null> {
  try {
    return (await apiFetch('/auth/me', authResponseSchema)).user
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) return null
    throw error
  }
}

// Resolves to null when nobody is signed in.
export function useCurrentUser() {
  return useQuery({ queryKey: currentUserKey, queryFn: fetchCurrentUser, staleTime: Infinity })
}

function useCredentialsMutation<T extends LoginInput | RegisterInput>(path: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: T) =>
      apiFetch(path, authResponseSchema, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: ({ user }) => queryClient.setQueryData(currentUserKey, user),
  })
}

export const useLogin = () => useCredentialsMutation<LoginInput>('/auth/login')
export const useRegister = () => useCredentialsMutation<RegisterInput>('/auth/register')

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch('/auth/logout', okResponseSchema, { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData(currentUserKey, null)
      // Drop everything cached for the account that just signed out. The
      // current-user query stays so mounted route guards see the change.
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== currentUserKey[0] })
    },
  })
}

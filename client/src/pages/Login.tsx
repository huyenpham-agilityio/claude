import { loginInputSchema } from '@expenses/shared'
import { Link } from 'react-router'
import { CredentialsForm } from '@/components/CredentialsForm'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useLogin } from '@/lib/auth'

export function Login() {
  const login = useLogin()

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>
          <h2>Log in</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CredentialsForm
          schema={loginInputSchema}
          submitLabel="Log in"
          passwordAutoComplete="current-password"
          pending={login.isPending}
          error={login.error?.message ?? null}
          onSubmit={(values) => login.mutate(values)}
        />
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <p>
          No account yet?{' '}
          <Link to="/register" className="text-foreground underline">
            Create one
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

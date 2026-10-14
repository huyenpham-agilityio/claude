import { registerInputSchema } from '@expenses/shared'
import { Link } from 'react-router'
import { CredentialsForm } from '@/components/CredentialsForm'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useRegister } from '@/lib/auth'

export function Register() {
  const register = useRegister()

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>
          <h2>Create your account</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CredentialsForm
          schema={registerInputSchema}
          submitLabel="Create account"
          passwordAutoComplete="new-password"
          passwordHint="At least 8 characters."
          pending={register.isPending}
          error={register.error?.message ?? null}
          onSubmit={(values) => register.mutate(values)}
        />
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <p>
          Already have an account?{' '}
          <Link to="/login" className="text-foreground underline">
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

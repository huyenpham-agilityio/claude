import { loginInputSchema } from '@expenses/shared'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { CredentialsForm } from '@/components/CredentialsForm'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useLogin } from '@/lib/auth'
import { useErrorText } from '@/lib/errors'

export function Login() {
  const login = useLogin()
  const { t } = useTranslation()
  const errorText = useErrorText()

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>
          <h2>{t('auth.logIn')}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CredentialsForm
          schema={loginInputSchema}
          submitLabel={t('auth.logIn')}
          passwordAutoComplete="current-password"
          pending={login.isPending}
          error={errorText(login.error)}
          onSubmit={(values) => login.mutate(values)}
        />
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <p>
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-foreground underline">
            {t('auth.createOne')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

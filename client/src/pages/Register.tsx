import { credentialsSchema } from '@expenses/shared'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { CredentialsForm } from '@/components/CredentialsForm'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useRegister } from '@/lib/auth'
import { useErrorText } from '@/lib/errors'
import { useLanguage } from '@/lib/language'

export function Register() {
  const register = useRegister()
  const { t } = useTranslation()
  const { language } = useLanguage()
  const errorText = useErrorText()

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>
          <h2>{t('auth.createAccountTitle')}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CredentialsForm
          schema={credentialsSchema}
          submitLabel={t('auth.createAccount')}
          passwordAutoComplete="new-password"
          passwordHint={t('auth.passwordHint')}
          pending={register.isPending}
          error={errorText(register.error)}
          // Default categories are created in the language shown at sign-up.
          onSubmit={(values) => register.mutate({ ...values, locale: language })}
        />
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <p>
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="text-foreground underline">
            {t('auth.logIn')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

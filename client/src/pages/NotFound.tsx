import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <section>
      <h2 className="text-2xl font-semibold">Page not found</h2>
      <Button asChild className="mt-4">
        <Link to="/">Back to home</Link>
      </Button>
    </section>
  )
}

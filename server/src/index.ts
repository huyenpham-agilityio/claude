import { createApp } from './app.ts'
import { env } from './env.ts'

createApp().listen(env.PORT, () => {
  console.log(`Listening on port ${env.PORT}`)
})

import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok', service: 'dworks-api', stage: 'M0' }))

const port = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`dworks-api listening on http://localhost:${info.port}`)
})

export { app }

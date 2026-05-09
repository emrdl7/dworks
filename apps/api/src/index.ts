import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { handleClarify } from './clarify.js'
import { handleGenerate } from './generate.js'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: (origin) => origin ?? '*',
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 600,
  }),
)

app.get('/health', (c) =>
  c.json({ status: 'ok', service: 'dworks-api', stage: 'M3' }),
)

app.post('/clarify', async (c) => {
  let rawBody: unknown
  try {
    rawBody = await c.req.json()
  } catch {
    return c.json(
      {
        error: 'invalid-request',
        message: '요청 본문이 유효한 JSON이 아닙니다.',
      },
      400,
    )
  }
  const result = await handleClarify(rawBody)
  return c.json(result.body, result.status)
})

app.post('/generate', async (c) => {
  let rawBody: unknown
  try {
    rawBody = await c.req.json()
  } catch {
    return c.json(
      {
        error: 'invalid-request',
        message: '요청 본문이 유효한 JSON이 아닙니다.',
      },
      400,
    )
  }
  const result = await handleGenerate(rawBody)
  return c.json(result.body, result.status)
})

const port = Number(process.env.PORT ?? 3001)

if (process.env.NODE_ENV !== 'test') {
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`dworks-api listening on http://localhost:${info.port}`)
  })
}

export { app }

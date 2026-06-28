import { env } from '~~/server/env'
import { auth } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const url = new URL(event.path, env.BETTER_AUTH_URL)

  const headers = new Headers()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawHeaders = (event.node?.req?.headers ?? (event.req as any)?.headers ?? {}) as Record<string, string | string[] | undefined>
  if (typeof (rawHeaders as { entries?: () => Iterable<[string, string]> }).entries === 'function') {
    for (const [k, v] of (rawHeaders as unknown as Headers).entries()) headers.set(k, v)
  }
  else {
    for (const [k, v] of Object.entries(rawHeaders)) {
      if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : String(v))
    }
  }

  const init: RequestInit = { method, headers }
  if (method !== 'GET' && method !== 'HEAD') {
    const body = await readBodyBuffer(event)
    if (body && body.length > 0) init.body = body
  }

  return auth.handler(new Request(url, init))
})

async function readBodyBuffer(event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]): Promise<Buffer | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = event as any
  const webBody = e.web?.request?.body as ReadableStream<Uint8Array> | undefined
  if (webBody) {
    const reader = webBody.getReader()
    const chunks: Uint8Array[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) chunks.push(value)
    }
    return Buffer.concat(chunks)
  }
  const nodeReq = e.node?.req
  if (nodeReq && typeof nodeReq.on === 'function') {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      nodeReq.on('data', (c: Buffer) => chunks.push(c))
      nodeReq.on('end', () => resolve(Buffer.concat(chunks)))
      nodeReq.on('error', reject)
    })
  }
  return undefined
}

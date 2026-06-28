import type { H3Event } from 'h3'

export async function webRequestFromEvent(event: H3Event, baseURL: string): Promise<Request> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = event as any
  const method: string = (e.node?.req?.method ?? e.req?.method ?? 'GET').toUpperCase()
  const path: string = e.path ?? e.node?.req?.url ?? '/'
  const url = new URL(path, baseURL)

  const headers = new Headers()
  const rawHeaders = e.node?.req?.headers ?? e.req?.headers ?? {}
  if (typeof rawHeaders.entries === 'function') {
    for (const [k, v] of (rawHeaders as Headers).entries()) headers.set(k, v)
  }
  else {
    for (const [k, v] of Object.entries(rawHeaders as Record<string, string | string[] | undefined>)) {
      if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : String(v))
    }
  }

  const init: RequestInit = { method, headers }
  if (method !== 'GET' && method !== 'HEAD') {
    const body = await readBodyBuffer(event)
    if (body && body.length > 0) init.body = body
  }

  return new Request(url, init)
}

async function readBodyBuffer(event: H3Event): Promise<Buffer | undefined> {
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

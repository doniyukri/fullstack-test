import type { H3Event } from 'h3'

const maxBodySize = 16 * 1024

export async function readJsonBody(event: H3Event): Promise<unknown> {
  if (Number(getHeader(event, 'content-length')) > maxBodySize) {
    throw createError({ statusCode: 413, statusMessage: 'Data terlalu besar' })
  }
  if (!getHeader(event, 'content-type')?.toLowerCase().startsWith('application/json')) {
    throw createError({ statusCode: 415, statusMessage: 'Gunakan format JSON' })
  }
  const reader = toWebRequest(event).body?.getReader()
  if (!reader) throw createError({ statusCode: 400, statusMessage: 'Data tidak boleh kosong' })
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      // Check the real size too, not only Content-Length
      size += chunk.value.byteLength
      if (size > maxBodySize) {
        await reader.cancel()
        throw createError({ statusCode: 413, statusMessage: 'Data terlalu besar' })
      }
      chunks.push(chunk.value)
    }
  } finally {
    reader.releaseLock()
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'JSON tidak valid' })
  }
}

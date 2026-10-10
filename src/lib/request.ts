export async function readJson(req: Request, maxBytes = 64_000): Promise<unknown> {
  const reader = req.body?.getReader()
  if (!reader) throw new Error("Missing body")
  const chunks: Uint8Array[] = []
  let bytes = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > maxBytes) {
        await reader.cancel()
        throw new Error("Request body too large")
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"))
}

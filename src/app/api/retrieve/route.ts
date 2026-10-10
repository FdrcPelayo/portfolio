import { retrieve } from "@/lib/rag"
import { usageLimiter, visitorKey } from "@/lib/rate-limit"
import { readJson } from "@/lib/request"
import { site } from "@/lib/site"
import { z } from "zod"

// Retrieval only, no LLM call. Powers the "try it" box on /how-it-works.
export async function POST(req: Request) {
  const ticket = usageLimiter.admit(visitorKey(req))
  const limited = () => Response.json({
    error: `My agent has done enough for now! You can get in contact with me at ${site.email}.`,
  }, { status: 429 })
  if (!ticket) return limited()
  try {
    let query: string
    try {
      query = z.object({ query: z.string().trim().min(1).max(500) }).parse(await readJson(req, 4000)).query
    } catch {
      ticket.settle(0)
      return Response.json({ error: "Please enter a question of up to 500 characters." }, { status: 400 })
    }
    if (!ticket.reserve(Buffer.byteLength(query) + 256)) {
      ticket.settle(0)
      return limited()
    }
    const results = await retrieve(query, AbortSignal.any([req.signal, AbortSignal.timeout(25_000)]))
    return Response.json({
      results: results.map((r) => ({ source: r.source, heading: r.heading, score: r.score, text: r.text.slice(0, 280) })),
    })
  } catch (error) {
    console.error(error)
    return Response.json({ error: `My agent is taking a break. Please try again, or contact me at ${site.email}.` }, { status: 500 })
  } finally {
    ticket.settle()
  }
}

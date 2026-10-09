import { retrieve } from "@/lib/rag"

// Retrieval only, no LLM call. Powers the "try it" box on /how-it-works.
export async function POST(req: Request) {
  const { query }: { query?: string } = await req.json()
  if (!query?.trim()) return Response.json({ results: [] })
  try {
    const results = await retrieve(query.slice(0, 500))
    return Response.json({
      results: results.map((r) => ({ source: r.source, heading: r.heading, score: r.score, text: r.text.slice(0, 280) })),
    })
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Retrieval failed. Check AI_GATEWAY_API_KEY." }, { status: 500 })
  }
}

import type { Metadata } from "next"
import { cacheLife } from "next/cache"
import { PipelineGraph } from "@/components/pipeline-graph"
import { chunkMarkdown, loadDocuments } from "@/lib/rag"
import { site } from "@/lib/site"

export const metadata: Metadata = { title: `How it works · ${site.name}` }

async function getStats() {
  "use cache"
  cacheLife("minutes")
  const docs = await loadDocuments()
  return {
    docs: docs.map((d) => ({ source: d.source, chunks: chunkMarkdown(d.source, d.text).length })),
    chatModel: site.chatModel,
    embeddingModel: site.embeddingModel,
  }
}

export default async function HowItWorks() {
  const stats = await getStats()
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 pt-8 pb-16">
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">How it works</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The chat on the home page is retrieval-augmented generation (RAG). My notes live as Markdown files. They are
          split into chunks and turned into vectors. When you ask something, the closest chunks are found and handed to
          a language model, which answers from them. Click any step to learn more, or press play.
        </p>
      </div>
      <PipelineGraph stats={stats} />
    </main>
  )
}

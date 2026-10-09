import "server-only"
import { createHash } from "node:crypto"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { cosineSimilarity, embed, embedMany } from "ai"
import { site } from "@/lib/site"

const CONTENT_DIR = path.join(process.cwd(), "content")
const CHUNK_SIZE = 1200 // characters
const CHUNK_OVERLAP = 200
const TOP_K = 6
const MIN_SCORE = 0.2

export type Chunk = {
  id: string
  source: string // file name, e.g. "projects.md"
  heading: string // nearest markdown heading
  text: string
}

type Index = { hash: string; chunks: Chunk[]; vectors: number[][] }

export type Retrieved = Chunk & { score: number }

// Read every .md file in /content (recursively), skipping README.md.
export async function loadDocuments() {
  const entries = await readdir(CONTENT_DIR, { recursive: true, withFileTypes: true }).catch(() => [])
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith(".md") && e.name.toLowerCase() !== "readme.md")
    .map((e) => path.join(e.parentPath, e.name))
    .sort()
  return Promise.all(
    files.map(async (file) => ({
      source: path.relative(CONTENT_DIR, file).replaceAll("\\", "/"),
      text: await readFile(file, "utf8"),
    }))
  )
}

// Split a markdown doc into sections by heading, then pack sections into
// overlapping windows so each chunk stays under CHUNK_SIZE.
export function chunkMarkdown(source: string, markdown: string): Chunk[] {
  const sections: { heading: string; body: string }[] = []
  let heading = source.replace(/\.md$/, "")
  let body: string[] = []
  for (const line of markdown.split(/\r?\n/)) {
    const match = /^#{1,6}\s+(.*)$/.exec(line)
    if (match) {
      if (body.join("").trim()) sections.push({ heading, body: body.join("\n").trim() })
      heading = match[1].trim()
      body = []
    } else {
      body.push(line)
    }
  }
  if (body.join("").trim()) sections.push({ heading, body: body.join("\n").trim() })

  const chunks: Chunk[] = []
  for (const s of sections) {
    for (let start = 0; start < s.body.length; start += CHUNK_SIZE - CHUNK_OVERLAP) {
      const text = s.body.slice(start, start + CHUNK_SIZE)
      chunks.push({ id: `${source}#${chunks.length}`, source, heading: s.heading, text })
      if (start + CHUNK_SIZE >= s.body.length) break
    }
  }
  return chunks
}

// The index lives in memory and is rebuilt only when /content changes
// (keyed by a hash of every file), so edits show up without a restart.
let cached: Promise<Index> | null = null
let cachedHash = ""

async function getIndex(): Promise<Index> {
  const docs = await loadDocuments()
  const hash = createHash("sha256")
    .update(docs.map((d) => d.source + "\0" + d.text).join("\0"))
    .digest("hex")
  if (cached && cachedHash === hash) return cached

  cachedHash = hash
  cached = (async () => {
    const chunks = docs.flatMap((d) => chunkMarkdown(d.source, d.text))
    if (chunks.length === 0) return { hash, chunks, vectors: [] }
    const { embeddings } = await embedMany({
      model: site.embeddingModel,
      values: chunks.map((c) => `${c.heading}\n\n${c.text}`),
    })
    return { hash, chunks, vectors: embeddings }
  })()
  cached.catch(() => {
    cached = null // don't cache failures
  })
  return cached
}

export async function retrieve(query: string): Promise<Retrieved[]> {
  const index = await getIndex()
  if (index.chunks.length === 0) return []
  const { embedding } = await embed({ model: site.embeddingModel, value: query })
  return index.chunks
    .map((c, i) => ({ ...c, score: cosineSimilarity(embedding, index.vectors[i]) }))
    .filter((c) => c.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K)
}

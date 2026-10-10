"use client"

import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import {
  Binary,
  Bot,
  Database,
  FileText,
  MessageSquare,
  Pause,
  Play,
  Scissors,
  ScrollText,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Stats = {
  docs: { source: string; chunks: number }[]
  chatModel: string
  embeddingModel: string
}

type StepId =
  | "docs"
  | "chunk"
  | "embedDocs"
  | "index"
  | "question"
  | "embedQuery"
  | "search"
  | "prompt"
  | "llm"
  | "answer"

type Step = {
  title: string
  subtitle: (s: Stats) => string
  icon: LucideIcon
  lane: "index" | "query"
  position: { x: number; y: number }
  body: (s: Stats) => string
  file: string
}

const STEPS: Record<StepId, Step> = {
  docs: {
    title: "Markdown notes",
    subtitle: (s) => `${s.docs.length} file${s.docs.length === 1 ? "" : "s"} in /content`,
    icon: FileText,
    lane: "index",
    position: { x: 0, y: 0 },
    body: (s) =>
      `Everything the assistant knows comes from plain .md files in the content folder: bio, projects, experience. Adding knowledge means dropping in a new file, with no database or retraining.\n\nRight now: ${
        s.docs.map((d) => d.source).join(", ") || "no files yet"
      }.`,
    file: "content/*.md",
  },
  chunk: {
    title: "Chunking",
    subtitle: (s) => `${s.docs.reduce((n, d) => n + d.chunks, 0)} chunks`,
    icon: Scissors,
    lane: "index",
    position: { x: 260, y: 0 },
    body: () =>
      "Each file is split at its headings, and long sections are cut into overlapping windows of about 1,200 characters. A chunk is small enough to be specific but large enough to keep its context. Each one remembers its file and heading, which later become the source chips under each answer.",
    file: "src/lib/rag.ts → chunkMarkdown()",
  },
  embedDocs: {
    title: "Embed chunks",
    subtitle: (s) => s.embeddingModel,
    icon: Binary,
    lane: "index",
    position: { x: 520, y: 0 },
    body: (s) =>
      `Every chunk is sent through Vercel AI Gateway to an embedding model (${s.embeddingModel}). The model turns text into a vector of about 1,500 numbers, where passages with similar meaning point in similar directions.`,
    file: "src/lib/rag.ts → embedMany()",
  },
  index: {
    title: "Vector index",
    subtitle: () => "in memory, hash-keyed",
    icon: Database,
    lane: "index",
    position: { x: 780, y: 0 },
    body: () =>
      "The vectors are kept in memory next to their chunks. The index is keyed by a hash of every file in /content, so editing or adding a note rebuilds it automatically on the next question. For a personal site that's a few hundred vectors at most, so no vector database is needed.",
    file: "src/lib/rag.ts → getIndex()",
  },
  question: {
    title: "Your question",
    subtitle: () => "from the chat box",
    icon: MessageSquare,
    lane: "query",
    position: { x: 0, y: 200 },
    body: () =>
      "The chat on the home page uses the AI SDK's useChat hook. When you send a message, the conversation goes to the /api/chat route handler.",
    file: "src/components/chat.tsx",
  },
  embedQuery: {
    title: "Embed question",
    subtitle: (s) => s.embeddingModel,
    icon: Binary,
    lane: "query",
    position: { x: 260, y: 200 },
    body: () =>
      "Your latest message is embedded with the same model as the notes, so both live in the same vector space and can be compared directly.",
    file: "src/lib/rag.ts → embed()",
  },
  search: {
    title: "Similarity search",
    subtitle: () => "cosine · top 6",
    icon: Search,
    lane: "query",
    position: { x: 780, y: 200 },
    body: () =>
      "The question vector is compared with every chunk vector using cosine similarity. The 6 closest chunks above a minimum score are kept. Try it yourself in the box below.",
    file: "src/lib/rag.ts → retrieve()",
  },
  prompt: {
    title: "Prompt assembly",
    subtitle: () => "instructions + context",
    icon: ScrollText,
    lane: "query",
    position: { x: 780, y: 400 },
    body: () =>
      "The retrieved chunks are wrapped in <doc> tags and placed in the system instructions. The model answers in the first person and can interpret the profile for open-ended or hypothetical questions, while keeping biographical facts grounded in the documents. The last 12 chat messages go along too, so follow-up questions work.",
    file: "src/app/api/chat/route.ts → instructions()",
  },
  llm: {
    title: "LLM via AI Gateway",
    subtitle: (s) => s.chatModel,
    icon: Bot,
    lane: "query",
    position: { x: 520, y: 400 },
    body: (s) =>
      `streamText() calls ${s.chatModel} through Vercel AI Gateway. Because of the gateway, switching to another provider's model is a one-string change in src/lib/site.ts, with a single API key and built-in fallbacks.`,
    file: "src/app/api/chat/route.ts → streamText()",
  },
  answer: {
    title: "Streamed answer",
    subtitle: () => "tokens + source chips",
    icon: Sparkles,
    lane: "query",
    position: { x: 260, y: 400 },
    body: () =>
      "Tokens stream back to the browser as they are generated. Before the text arrives, the server sends a data part listing which files were retrieved. Those become the small source chips under each answer, so you can see where every claim came from.",
    file: "src/components/chat.tsx → <Sources />",
  },
}

// Order a question travels through the system (the indexing lane runs first, once).
const PLAY_ORDER: StepId[] = [
  "docs",
  "chunk",
  "embedDocs",
  "index",
  "question",
  "embedQuery",
  "search",
  "prompt",
  "llm",
  "answer",
]

const EDGES: [StepId, StepId, string, string][] = [
  ["docs", "chunk", "r", "l"],
  ["chunk", "embedDocs", "r", "l"],
  ["embedDocs", "index", "r", "l"],
  ["index", "search", "b", "t"],
  ["question", "embedQuery", "r", "l"],
  ["embedQuery", "search", "r", "l"],
  ["search", "prompt", "b", "t"],
  ["prompt", "llm", "l-src", "r-tgt"],
  ["llm", "answer", "l-src", "r-tgt"],
]

type StepNodeData = { id: StepId; stats: Stats; active: boolean; selected: boolean }
type StepNode = Node<StepNodeData, "step">

function StepNodeView({ data }: NodeProps<StepNode>) {
  const step = STEPS[data.id]
  const Icon = step.icon
  return (
    <div
      className={cn(
        "w-[200px] rounded-xl border bg-background px-3 py-2.5 shadow-xs transition-all duration-300",
        data.selected && "border-foreground",
        data.active && "scale-105 border-foreground shadow-lg"
      )}
    >
      <Handle type="target" position={Position.Left} id="l" />
      <Handle type="target" position={Position.Top} id="t" />
      <Handle type="target" position={Position.Right} id="r-tgt" />
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors",
            data.active && "bg-foreground text-background"
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium">{step.title}</div>
          <div className="truncate font-mono text-[10.5px] text-muted-foreground">{step.subtitle(data.stats)}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="r" />
      <Handle type="source" position={Position.Bottom} id="b" />
      <Handle type="source" position={Position.Left} id="l-src" />
    </div>
  )
}

const nodeTypes = { step: StepNodeView }

export function PipelineGraph({ stats }: { stats: Stats }) {
  const [selected, setSelected] = useState<StepId>("docs")
  const [playing, setPlaying] = useState(false)
  const [tick, setTick] = useState(-1)
  const active = tick >= 0 ? PLAY_ORDER[tick] : null

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      const next = tick + 1
      if (next >= PLAY_ORDER.length) {
        setPlaying(false)
        setTick(-1)
        return
      }
      setTick(next)
      setSelected(PLAY_ORDER[next])
    }, tick < 0 ? 0 : 1600)
    return () => clearTimeout(t)
  }, [playing, tick])

  const nodes: StepNode[] = useMemo(
    () =>
      (Object.keys(STEPS) as StepId[]).map((id) => ({
        id,
        type: "step",
        position: STEPS[id].position,
        data: { id, stats, active: active === id, selected: selected === id },
      })),
    [stats, active, selected]
  )

  const edges: Edge[] = useMemo(() => {
    const visited = tick >= 0 ? new Set(PLAY_ORDER.slice(0, tick + 1)) : null
    return EDGES.map(([source, target, sourceHandle, targetHandle]) => {
      const lit = visited ? visited.has(source) && visited.has(target) : false
      const live = active === target
      return {
        id: `${source}-${target}`,
        source,
        target,
        sourceHandle,
        targetHandle,
        type: "smoothstep",
        animated: live || !visited,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        style: {
          strokeWidth: live ? 2 : 1.25,
          stroke: lit || live ? "var(--foreground)" : "var(--muted-foreground)",
          opacity: visited && !lit && !live ? 0.35 : 1,
        },
      }
    })
  }, [tick, active])

  const step = STEPS[selected]

  return (
    <div className="mt-10 space-y-6">
      <div className="overflow-hidden rounded-2xl border">
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span>Top row: indexing, runs once per content change</span>
          <span>Rows 2–3: answering, runs per question</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (playing) {
              setPlaying(false)
              setTick(-1)
            } else {
              setTick(-1)
              setPlaying(true)
            }
          }}
        >
          {playing ? <Pause /> : <Play />}
          {playing ? "Stop" : "Play"}
        </Button>
      </div>
      <div className="h-[420px] bg-muted/30">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          nodesConnectable={false}
          nodesDraggable
          zoomOnScroll={false}
          panOnScroll={false}
          preventScrolling={false}
          onNodeClick={(_, n) => {
            setPlaying(false)
            setTick(-1)
            setSelected(n.id as StepId)
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
      </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section key={selected} className="animate-in space-y-2 rounded-2xl border p-5 duration-300 fade-in-0">
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {step.lane === "index" ? "Indexing" : "Answering"} · step {PLAY_ORDER.indexOf(selected) + 1} of{" "}
            {PLAY_ORDER.length}
          </div>
          <h2 className="font-medium">{step.title}</h2>
          <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{step.body(stats)}</p>
          <p className="pt-1 font-mono text-[11px] text-muted-foreground">{step.file}</p>
        </section>
        <RetrievalPlayground />
      </div>
    </div>
  )
}

type Hit = { source: string; heading: string; score: number; text: string }

function RetrievalPlayground() {
  const [query, setQuery] = useState("")
  const [hits, setHits] = useState<Hit[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function run() {
    if (!query.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Request failed")
      setHits(json.results)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border p-5">
      <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Try the retrieval step</div>
      <p className="text-sm text-muted-foreground">
        Type a question to see which chunks the model would receive and how similar each one is.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          run()
        }}
        className="flex items-end gap-2"
      >
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              run()
            }
          }}
          rows={1}
          placeholder="e.g. what projects have you built?"
          className="min-h-9 resize-none"
        />
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? "Searching…" : "Search"}
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {hits && hits.length === 0 && <p className="text-sm text-muted-foreground">No chunk passed the similarity threshold.</p>}
      {hits && hits.length > 0 && (
        <ul className="max-h-72 space-y-2 overflow-y-auto">
          {hits.map((h, i) => (
            <li key={i} className="rounded-lg bg-muted/50 p-3">
              <div className="mb-1.5 flex items-center justify-between gap-2 font-mono text-[11px]">
                <span className="truncate text-muted-foreground">
                  {h.source} › {h.heading}
                </span>
                <span className="shrink-0">{h.score.toFixed(3)}</span>
              </div>
              <div className="mb-2 h-1 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-foreground" style={{ width: `${Math.max(0, h.score) * 100}%` }} />
              </div>
              <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{h.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

"use client"

import { useChat } from "@ai-sdk/react"
import { ArrowUp, FileText, Square } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { site } from "@/lib/site"
import type { ChatMessage, SourceRef } from "@/lib/types"
import { cn } from "@/lib/utils"

export function Chat({ intro }: { intro: ReactNode }) {
  const [input, setInput] = useState("")
  const { messages, sendMessage, status, stop, error } = useChat<ChatMessage>({ id: "portfolio" })
  const bottomRef = useRef<HTMLDivElement>(null)
  const busy = status === "submitted" || status === "streaming"
  const empty = messages.length === 0

  useEffect(() => {
    if (!empty) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, status, empty])

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    sendMessage({ text: trimmed })
    setInput("")
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className={cn("flex justify-center", empty ? "flex-1 items-center pb-10" : "pt-4 pb-2")}>{intro}</div>

      {!empty && (
        <div className="flex-1 space-y-6 py-8">
          {messages.map((m) => (
            <Message key={m.id} message={m} />
          ))}
          {status === "submitted" && <Thinking />}
          {error && <p className="text-sm text-destructive">Something went wrong. Please try again.</p>}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="sticky bottom-0 space-y-3 bg-background pt-2 pb-2">
        {empty && (
          <div className="flex flex-wrap justify-center gap-2">
            {site.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="relative rounded-2xl border bg-background shadow-sm transition-shadow focus-within:shadow-md"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send(input)
              }
            }}
            placeholder="Ask me something..."
            rows={1}
            className="max-h-40 min-h-12 resize-none border-0 bg-transparent px-4 py-3.5 pr-14 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="absolute right-2 bottom-2">
            {busy ? (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="rounded-full"
                onClick={() => stop()}
                aria-label="Stop"
              >
                <Square className="size-3 fill-current" />
              </Button>
            ) : (
              <Button type="submit" size="icon" className="rounded-full" disabled={!input.trim()} aria-label="Send">
                <ArrowUp />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

function Message({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("")
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-sm whitespace-pre-wrap">{text}</div>
      </div>
    )
  }

  const sources = message.parts.find((p) => p.type === "data-sources")?.data ?? []
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <div className="prose-chat">
        {message.parts.map((p, i) =>
          p.type === "text" ? (
            <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
              {p.text}
            </ReactMarkdown>
          ) : null
        )}
      </div>
      <Sources sources={sources} />
    </div>
  )
}

// One chip per document, with the best-matching section on hover.
function Sources({ sources }: { sources: SourceRef[] }) {
  const byDoc = new Map<string, SourceRef>()
  for (const s of sources) if (!byDoc.has(s.source)) byDoc.set(s.source, s)
  if (byDoc.size === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {[...byDoc.values()].map((s) => (
        <Tooltip key={s.source}>
          <TooltipTrigger
            render={
              <span className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground" />
            }
          >
            <FileText className="size-3" />
            {s.source}
          </TooltipTrigger>
          <TooltipContent>
            {s.heading} · similarity {s.score.toFixed(2)}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}

function Thinking() {
  return (
    <div className="flex gap-1 py-2" aria-label="Thinking">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </div>
  )
}

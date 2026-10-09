import type { UIMessage } from "ai"

export type SourceRef = { source: string; heading: string; score: number }

export type ChatMessage = UIMessage<never, { sources: SourceRef[] }>

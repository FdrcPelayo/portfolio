import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from "ai"
import { retrieve, type Retrieved } from "@/lib/rag"
import { site } from "@/lib/site"
import type { ChatMessage } from "@/lib/types"

export const maxDuration = 30

function instructions(context: Retrieved[]) {
  const docs = context
    .map((c, i) => `<doc index="${i + 1}" source="${c.source}" section="${c.heading}">\n${c.text}\n</doc>`)
    .join("\n\n")
  return `You are the interactive portfolio of ${site.name}. Speak in the first person, as ${site.name}, to visitors of the website (recruiters, collaborators, curious people).

Answer using ONLY the facts in the documents below. If they don't cover the question, say so honestly and suggest what you can talk about instead. Never invent employers, dates, numbers or projects.

Keep answers short, warm and conversational: a few sentences or a tight list. Use markdown sparingly.

<documents>
${docs || "(no documents matched this question)"}
</documents>`
}

function lastUserText(messages: ChatMessage[]) {
  const last = messages.findLast((m) => m.role === "user")
  return last?.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ").trim() ?? ""
}

export async function POST(req: Request) {
  const { messages }: { messages: ChatMessage[] } = await req.json()

  const stream = createUIMessageStream<ChatMessage>({
    execute: async ({ writer }) => {
      writer.write({ type: "start" })

      const context = await retrieve(lastUserText(messages))
      writer.write({
        type: "data-sources",
        id: "sources",
        data: context.map((c) => ({ source: c.source, heading: c.heading, score: c.score })),
      })

      const result = streamText({
        model: site.chatModel,
        instructions: instructions(context),
        messages: await convertToModelMessages(messages.slice(-12)),
      })
      writer.merge(toUIMessageStream({ stream: result.stream, sendStart: false }))
    },
    onError: (error) => {
      console.error(error)
      return "Something went wrong. Check that AI_GATEWAY_API_KEY is set."
    },
  })

  return createUIMessageStreamResponse({ stream })
}

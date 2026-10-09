# Portfolio: chat with me

A minimal personal site: a photo and a chat. The chat answers questions about me using
RAG over the Markdown files in `content/`, with the model served through Vercel AI Gateway.
`/how-it-works` explains the pipeline with an interactive graph.

Stack: Next.js 16 (App Router), Tailwind v4, shadcn/ui, AI SDK v7, React Flow.

## Setup

```bash
npm install
cp .env.example .env.local   # paste your AI_GATEWAY_API_KEY
npm run dev
```

## Make it yours

| What | Where |
| --- | --- |
| Name, tagline, links, suggested questions, models | `src/lib/site.ts` |
| Your photo | put it in `public/` (e.g. `public/me.jpg`), set `photo` in `site.ts` |
| Knowledge base | paste `.md` files into `content/` |

Any model on the gateway works: change `chatModel` (e.g. `openai/gpt-5`) or
`embeddingModel` in `site.ts`.

## How it works

- `src/lib/rag.ts`: loads `content/**/*.md`, splits at headings into ~1,200-char overlapping
  chunks, embeds them with `embedMany`, and keeps the vectors in memory. The index is keyed by
  a hash of the files, so edits re-index on the next question.
- `src/app/api/chat/route.ts`: embeds the latest question, takes the top 6 chunks by cosine
  similarity, puts them in the instructions, and streams the answer with `streamText`. It also
  sends a `data-sources` part, which the UI shows as source chips.
- `src/app/api/retrieve/route.ts`: retrieval only, used by the "try it" box on `/how-it-works`.
- `src/components/pipeline-graph.tsx`: the React Flow diagram.

## Deploy

Push to GitHub and import it in Vercel. On Vercel, AI Gateway authenticates via OIDC
automatically. Elsewhere, set `AI_GATEWAY_API_KEY`. `next.config.ts` bundles `content/` with
the API functions.

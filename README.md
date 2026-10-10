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

The headshot is `public/headshot.jpeg`; the generated FP logo is in
`public/brand/fp-logo.png`. The logo is also used for the favicon and Apple icon.
Page metadata includes Open Graph/Twitter sharing cards and Person structured data.
Set `NEXT_PUBLIC_SITE_URL` for a custom domain; otherwise the Vercel production
domain is used automatically.

## Usage limits

`src/lib/rate-limit.ts` limits each visitor to 10 requests per minute, 25,000
tokens per hour and 2 simultaneous requests. Each instance also allows at most
60 requests per minute, 250,000 tokens per hour and 10 simultaneous requests.
Replies are capped at 800 output tokens. Chat and the retrieval playground share
these limits. Oversized inputs are rejected before any AI calls.

Token reservations include a conservative UTF-8 byte estimate for input, framing
overhead and the maximum output, then reconcile with reported model usage. Query
embeddings retain their conservative estimate; cached knowledge-base indexing
is separate. Failed or aborted calls retain their reservation when usage is unknown.
Visitors see a friendly invitation to contact Francisco by email when a limit is reached.

Limits live in memory: they reset on restart and are independent across server
instances. Vercel's trusted forwarding header identifies visitors by IP; outside
Vercel, requests share one visitor bucket. For a strict deployment-wide budget,
use shared persistent storage. Run `npm test` on Node 22.18+ for limiter tests.

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

### Docker / Forge

The root `Dockerfile` builds the app with Node 24 and runs Next.js standalone
output as a non-root user on port 3000. It includes static assets, the headshot
and the Markdown knowledge base. Environment files are excluded from the build
context; set `AI_GATEWAY_API_KEY` as a runtime environment variable in Forge.

In Forge, select the **Dockerfile** builder, use `Dockerfile` at the repository
root, deploy `master`, and use `/` as the health path. Apply environment-variable
changes before retrying the deployment.

For other container hosts:

```bash
docker build -t francisco-portfolio .
docker run --rm -p 3000:3000 --env-file .env francisco-portfolio
```

Social metadata defaults to `https://franciscopelayo.com`. To deploy to another
domain, pass `--build-arg NEXT_PUBLIC_SITE_URL=https://your-domain.com` when
building; changing a runtime variable alone does not update prerendered metadata.

### Vercel

Push to GitHub and import it in Vercel. On Vercel, AI Gateway authenticates via OIDC
automatically. Elsewhere, set `AI_GATEWAY_API_KEY`. `next.config.ts` bundles `content/` with
the API functions.

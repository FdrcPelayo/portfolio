export const usageLimits = {
  requestsPerMinute: 10,
  tokensPerHour: 25_000,
  concurrentPerVisitor: 2,
  globalRequestsPerMinute: 60,
  globalTokensPerHour: 250_000,
  globalConcurrent: 10,
  maxVisitors: 10_000,
  maxOutputTokens: 800,
}

type Bucket = {
  minute: number
  requests: number
  hour: number
  tokens: number
  active: number
}

function bucket(now: number): Bucket {
  return { minute: now, requests: 0, hour: now, tokens: 0, active: 0 }
}

function refresh(entry: Bucket, now: number) {
  if (now - entry.minute >= 60_000) {
    entry.minute = now
    entry.requests = 0
  }
  // Keep reservations across a boundary until the pending calls settle.
  if (!entry.active && now - entry.hour >= 3_600_000) {
    entry.hour = now
    entry.tokens = 0
  }
}

export function createUsageLimiter(now = Date.now) {
  const visitors = new Map<string, Bucket>()
  const global = bucket(now())

  return {
    admit(key: string) {
      // Every visitor lands in the shared bucket off Vercel, so it gets the
      // site-wide allowance instead of a single visitor's.
      const shared = key === SHARED_KEY
      const perVisitor = {
        requestsPerMinute: shared ? usageLimits.globalRequestsPerMinute : usageLimits.requestsPerMinute,
        tokensPerHour: shared ? usageLimits.globalTokensPerHour : usageLimits.tokensPerHour,
        concurrent: shared ? usageLimits.globalConcurrent : usageLimits.concurrentPerVisitor,
      }
      const time = now()
      for (const [id, entry] of visitors) {
        if (!entry.active && time - entry.hour >= 3_600_000) visitors.delete(id)
      }
      refresh(global, time)
      let visitor = visitors.get(key)
      if (!visitor) {
        if (visitors.size >= usageLimits.maxVisitors) return null
        visitor = bucket(time)
        visitors.set(key, visitor)
      }
      refresh(visitor, time)
      if (
        visitor.requests >= perVisitor.requestsPerMinute ||
        global.requests >= usageLimits.globalRequestsPerMinute ||
        visitor.tokens >= perVisitor.tokensPerHour ||
        global.tokens >= usageLimits.globalTokensPerHour ||
        visitor.active >= perVisitor.concurrent ||
        global.active >= usageLimits.globalConcurrent
      ) return null

      const entries = [visitor, global]
      for (const entry of entries) {
        entry.requests++
        entry.active++
      }
      let reserved = 0
      let settled = false
      return {
        reserve(tokens: number) {
          if (settled || !Number.isSafeInteger(tokens) || tokens < 0) return false
          if (
            visitor.tokens + tokens > perVisitor.tokensPerHour ||
            global.tokens + tokens > usageLimits.globalTokensPerHour
          ) return false
          reserved += tokens
          for (const entry of entries) entry.tokens += tokens
          return true
        },
        settle(actualTokens?: number) {
          if (settled) return
          settled = true
          // Failed/aborted streams may still be billed. Keep their reservation
          // unless the provider reported final usage.
          const actual = actualTokens !== undefined && Number.isFinite(actualTokens)
            ? Math.max(0, Math.ceil(actualTokens)) : reserved
          for (const entry of entries) {
            entry.tokens += actual - reserved
            entry.active--
          }
        },
      }
    },
  }
}

export const SHARED_KEY = "shared"

export const usageLimiter = createUsageLimiter()

export function visitorKey(req: Request) {
  // Vercel overwrites this header. Outside Vercel, share a bucket rather than
  // trusting a spoofable client-supplied forwarding header.
  return process.env.VERCEL
    ? req.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() || "unknown"
    : SHARED_KEY
}

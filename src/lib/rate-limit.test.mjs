import test from "node:test"
import assert from "node:assert/strict"
import { createUsageLimiter, usageLimits, visitorKey } from "./rate-limit.ts"
import { readJson } from "./request.ts"

test("request limit is isolated by visitor and resets after a minute", () => {
  let time = 0
  const limiter = createUsageLimiter(() => time)
  for (let i = 0; i < usageLimits.requestsPerMinute; i++) limiter.admit("a").settle(0)
  assert.equal(limiter.admit("a"), null)
  limiter.admit("b").settle(0)
  time = 60_000
  assert.ok(limiter.admit("a"))
})

test("token reservations block concurrent overspending and reconcile actual usage", () => {
  const limiter = createUsageLimiter(() => 0)
  const first = limiter.admit("a")
  assert.equal(first.reserve(20_000), true)
  const second = limiter.admit("a")
  assert.equal(second.reserve(6000), false)
  assert.equal(second.reserve(5000), true)
  assert.equal(limiter.admit("a"), null)
  first.settle(1000)
  first.settle(0) // Settling twice must not refund twice.
  assert.equal(second.reserve(19_000), true)
  assert.equal(second.reserve(1), false)
  second.settle()
  assert.equal(limiter.admit("a"), null)
})

test("unknown usage on failures stays charged and hourly budgets recover", () => {
  let time = 0
  const limiter = createUsageLimiter(() => time)
  const ticket = limiter.admit("a")
  assert.equal(ticket.reserve(usageLimits.tokensPerHour), true)
  ticket.settle()
  assert.equal(ticket.reserve(1), false)
  assert.equal(limiter.admit("a"), null)
  time = 3_600_000
  assert.ok(limiter.admit("a"))
})

test("global token and request budgets apply across visitors", () => {
  const limiter = createUsageLimiter(() => 0)
  for (let i = 0; i < 10; i++) {
    const ticket = limiter.admit(String(i))
    assert.equal(ticket.reserve(25_000), true)
    ticket.settle()
  }
  assert.equal(limiter.admit("new"), null)
  const requests = createUsageLimiter(() => 0)
  for (let i = 0; i < usageLimits.globalRequestsPerMinute; i++) requests.admit(String(i)).settle(0)
  assert.equal(requests.admit("new"), null)
})

test("active reservations survive window boundaries", () => {
  let time = 0
  const limiter = createUsageLimiter(() => time)
  const ticket = limiter.admit("a")
  ticket.reserve(25_000)
  time = 3_600_001
  assert.equal(limiter.admit("a"), null)
  ticket.settle()
  assert.ok(limiter.admit("a"))
})

test("global concurrency is bounded and released on settlement", () => {
  const limiter = createUsageLimiter(() => 0)
  const tickets = Array.from({ length: usageLimits.globalConcurrent }, (_, i) => limiter.admit(String(i)))
  assert.equal(limiter.admit("new"), null)
  tickets[0].settle(0)
  assert.ok(limiter.admit("new"))
})

test("untrusted forwarding headers do not create new visitor buckets", () => {
  const previous = process.env.VERCEL
  delete process.env.VERCEL
  try {
    assert.equal(visitorKey(new Request("http://localhost", { headers: { "x-forwarded-for": "spoof" } })), "shared")
    process.env.VERCEL = "1"
    assert.equal(visitorKey(new Request("http://localhost", { headers: { "x-vercel-forwarded-for": "1.2.3.4, 5.6.7.8" } })), "1.2.3.4")
  } finally {
    if (previous === undefined) delete process.env.VERCEL
    else process.env.VERCEL = previous
  }
})

test("body size is checked even without Content-Length", async () => {
  assert.deepEqual(await readJson(new Request("http://localhost", { method: "POST", body: '{"ok":true}' })), { ok: true })
  await assert.rejects(readJson(new Request("http://localhost", { method: "POST", body: "x".repeat(100) }), 50), /too large/)
  await assert.rejects(readJson(new Request("http://localhost", { method: "POST", body: "invalid" })))
})

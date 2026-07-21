// In-memory sliding-window rate limiter.
//
// LogicGate runs as a single Next.js server (see CLAUDE.md — dev on :3001,
// self-hosted in prod), so a process-local Map is sufficient and avoids adding
// a Redis dependency. If this is ever deployed to multiple instances / a
// serverless platform, swap the store for a shared one (Upstash/Redis) — the
// `RateLimiter` interface below is the only thing callers depend on.

type Bucket = {
  /** Request timestamps (ms) within the current window. */
  hits: number[];
};

const store = new Map<string, Bucket>();

// Periodically drop stale buckets so the Map doesn't grow unbounded.
let lastSweep = 0;
function sweep(now: number, windowMs: number) {
  if (now - lastSweep < windowMs) return;
  lastSweep = now;
  for (const [key, bucket] of store) {
    if (bucket.hits.length === 0 || bucket.hits[bucket.hits.length - 1] < now - windowMs) {
      store.delete(key);
    }
  }
}

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the caller may retry (only meaningful when !ok). */
  retryAfter: number;
  /** Unix ms when the window resets. */
  reset: number;
};

export type RateLimitOptions = {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

/**
 * Record a hit for `key` and report whether it is within the limit.
 * Uses a sliding window: only hits newer than `now - windowMs` count.
 */
export function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
  now: number = Date.now()
): RateLimitResult {
  sweep(now, windowMs);

  const bucket = store.get(key) ?? { hits: [] };
  const windowStart = now - windowMs;
  // Drop timestamps that have aged out of the window.
  const hits = bucket.hits.filter((t) => t > windowStart);

  const ok = hits.length < limit;
  if (ok) hits.push(now);
  bucket.hits = hits;
  store.set(key, bucket);

  const oldest = hits[0] ?? now;
  const reset = oldest + windowMs;

  return {
    ok,
    limit,
    remaining: Math.max(0, limit - hits.length),
    retryAfter: ok ? 0 : Math.max(1, Math.ceil((reset - now) / 1000)),
    reset,
  };
}

/** Best-effort client IP from proxy headers, falling back to a shared bucket. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

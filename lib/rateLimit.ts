type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type Entry = {
  resetAt: number;
  count: number;
};

const store = new Map<string, Entry>();

export function rateLimit(key: string, opts: RateLimitOptions): {
  ok: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + opts.windowMs;
    store.set(key, { resetAt, count: 1 });
    return { ok: true, remaining: Math.max(0, opts.max - 1), resetAt };
  }

  const nextCount = existing.count + 1;
  existing.count = nextCount;
  store.set(key, existing);

  return {
    ok: nextCount <= opts.max,
    remaining: Math.max(0, opts.max - nextCount),
    resetAt: existing.resetAt,
  };
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xrip = req.headers.get("x-real-ip");
  if (xrip) return xrip.trim();
  return "unknown";
}

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 10

type AttemptBucket = {
  count: number
  resetAt: number
}

const attemptsByKey = new Map<string, AttemptBucket>()

function pruneExpired(now: number) {
  for (const [key, bucket] of attemptsByKey) {
    if (bucket.resetAt <= now) {
      attemptsByKey.delete(key)
    }
  }
}

export function checkLoginRateLimit(key: string) {
  const now = Date.now()
  pruneExpired(now)

  const bucket = attemptsByKey.get(key)

  if (!bucket || bucket.resetAt <= now) {
    return { allowed: true as const }
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000)
    return {
      allowed: false as const,
      retryAfterSec,
    }
  }

  return { allowed: true as const }
}

export function recordLoginFailure(key: string) {
  const now = Date.now()
  pruneExpired(now)

  const bucket = attemptsByKey.get(key)

  if (!bucket || bucket.resetAt <= now) {
    attemptsByKey.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    })
    return
  }

  bucket.count += 1
}

export function clearLoginRateLimit(key: string) {
  attemptsByKey.delete(key)
}

export function loginRateLimitKey(ip: string, name: string, birthDate: string) {
  return `${ip}:${name.trim().toLowerCase()}:${birthDate.trim()}`
}

// Rate limiter en memoria por IP (ventana deslizante simple).
// Suficiente para una sola instancia Node; si algún día hay varias, migrar a Redis.

import { headers } from 'next/headers';

const buckets = new Map<string, number[]>();
const MAX_BUCKETS = 10_000;

export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

/**
 * Lanza error si la IP superó `limit` llamadas en los últimos `windowMs`.
 * Uso: await rateLimit('booking', 5, 60_000);
 */
export async function rateLimit(scope: string, limit: number, windowMs: number): Promise<void> {
  const ip = await clientIp();
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    throw new Error('Too many requests — please try again in a minute');
  }
  hits.push(now);
  buckets.set(key, hits);

  if (buckets.size > MAX_BUCKETS) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
      if (buckets.size <= MAX_BUCKETS / 2) break;
    }
  }
}

/** Recorta texto libre a una longitud máxima segura. */
export function clamp(value: string | null | undefined, max: number): string | null {
  if (value == null) return null;
  const t = value.trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max) : t;
}

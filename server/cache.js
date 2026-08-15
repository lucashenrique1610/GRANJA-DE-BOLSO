import { Logger } from './observability.js';

export class TtlCache {
  constructor({ ttlMs = 30000, maxEntries = 1000, logger = new Logger() } = {}) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.logger = logger.child({ logger: 'cache' });
    this.store = new Map();
    this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0, expires: 0 };
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.stats.misses += 1;
      this.logger.debug('cache.miss', { key, hits: this.stats.hits, misses: this.stats.misses });
      return null;
    }
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      this.stats.expires += 1;
      this.stats.misses += 1;
      this.logger.debug('cache.expired', { key });
      return null;
    }
    this.stats.hits += 1;
    this.logger.debug('cache.hit', {
      key,
      ageMs: Date.now() - entry.createdAt,
      hits: this.stats.hits,
      misses: this.stats.misses,
    });
    return entry.value;
  }

  set(key, value, ttlMs = this.ttlMs) {
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
        this.stats.evictions += 1;
      }
    }
    this.store.set(key, { value, createdAt: Date.now(), expiresAt: Date.now() + ttlMs });
    this.stats.sets += 1;
    this.logger.debug('cache.set', { key, ttlMs, size: this.store.size });
    return value;
  }

  reset() {
    this.store.clear();
    this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0, expires: 0 };
  }

  snapshot() {
    return {
      size: this.store.size,
      maxEntries: this.maxEntries,
      ttlMs: this.ttlMs,
      stats: { ...this.stats },
      hitRate: this.stats.hits + this.stats.misses > 0
        ? Number((this.stats.hits / (this.stats.hits + this.stats.misses)).toFixed(4))
        : null,
    };
  }
}

export const defaultCache = new TtlCache({ ttlMs: 60000, maxEntries: 500 });
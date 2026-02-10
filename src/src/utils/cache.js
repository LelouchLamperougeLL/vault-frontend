// src/utils/cache.js

/* =========================================================
   CACHE CONFIGURATION
   ========================================================= */

const CACHE_CONFIG = {
  VERSION: "v1",
  PREFIX: "cinestat_cache:",
  TTL_MS: 30 * 24 * 60 * 60 * 1000, // 30 days
  MAX_ENTRIES: 500
};

/* =========================================================
   TIME HELPERS
   ========================================================= */

const now = () => Date.now();

/* =========================================================
   RESILIENT STORAGE ADAPTER
   ========================================================= */

function createStorage() {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);

    return {
      get: key => localStorage.getItem(key),
      set: (key, value) => localStorage.setItem(key, value),
      remove: key => localStorage.removeItem(key),
      keys: () => Object.keys(localStorage)
    };
  } catch {
    // Fallback in-memory store (private mode / blocked storage)
    const memory = new Map();

    return {
      get: key => memory.get(key) || null,
      set: (key, value) => memory.set(key, value),
      remove: key => memory.delete(key),
      keys: () => Array.from(memory.keys())
    };
  }
}

const storage = createStorage();

/* =========================================================
   INTERNAL UTILITIES
   ========================================================= */

/**
 * Enforce size limit using LRU-style eviction
 */
function enforceCacheSize() {
  const keys = storage
    .keys()
    .filter(k => k.startsWith(CACHE_CONFIG.PREFIX));

  if (keys.length <= CACHE_CONFIG.MAX_ENTRIES) return;

  const entries = keys
    .map(key => {
      try {
        const parsed = JSON.parse(storage.get(key));
        return {
          key,
          lastAccessed: parsed?.lastAccessed || 0
        };
      } catch {
        return { key, lastAccessed: 0 };
      }
    })
    .sort((a, b) => a.lastAccessed - b.lastAccessed);

  const overflow = entries.length - CACHE_CONFIG.MAX_ENTRIES;

  for (let i = 0; i < overflow; i++) {
    storage.remove(entries[i].key);
  }
}

/* =========================================================
   CACHE API
   ========================================================= */

/**
 * Write value to cache with TTL and metadata
 */
export function cacheSet(key, value) {
  const entry = {
    v: CACHE_CONFIG.VERSION,
    value,
    expiresAt: now() + CACHE_CONFIG.TTL_MS,
    lastAccessed: now()
  };

  storage.set(
    CACHE_CONFIG.PREFIX + key,
    JSON.stringify(entry)
  );

  enforceCacheSize();
}

/**
 * Read value from cache (sliding TTL)
 */
export function cacheGet(key) {
  const raw = storage.get(CACHE_CONFIG.PREFIX + key);
  if (!raw) return null;

  try {
    const entry = JSON.parse(raw);

    if (
      entry.v !== CACHE_CONFIG.VERSION ||
      now() > entry.expiresAt
    ) {
      storage.remove(CACHE_CONFIG.PREFIX + key);
      return null;
    }

    // Sliding expiration + LRU touch
    entry.expiresAt = now() + CACHE_CONFIG.TTL_MS;
    entry.lastAccessed = now();

    storage.set(
      CACHE_CONFIG.PREFIX + key,
      JSON.stringify(entry)
    );

    return entry.value;
  } catch {
    storage.remove(CACHE_CONFIG.PREFIX + key);
    return null;
  }
}

/**
 * Remove a single cache entry
 */
export function cacheDelete(key) {
  storage.remove(CACHE_CONFIG.PREFIX + key);
}

/**
 * Remove all expired or invalid entries
 * (safe to call at app startup)
 */
export function evictExpiredEntries() {
  for (const key of storage.keys()) {
    if (!key.startsWith(CACHE_CONFIG.PREFIX)) continue;

    try {
      const entry = JSON.parse(storage.get(key));
      if (
        !entry ||
        entry.v !== CACHE_CONFIG.VERSION ||
        now() > entry.expiresAt
      ) {
        storage.remove(key);
      }
    } catch {
      storage.remove(key);
    }
  }
}

/**
 * Debug / monitoring helper
 */
export function getCacheStats() {
  const keys = storage
    .keys()
    .filter(k => k.startsWith(CACHE_CONFIG.PREFIX));

  let expired = 0;

  for (const key of keys) {
    try {
      const entry = JSON.parse(storage.get(key));
      if (!entry || now() > entry.expiresAt) expired++;
    } catch {
      expired++;
    }
  }

  return {
    totalEntries: keys.length,
    expiredEntries: expired,
    maxEntries: CACHE_CONFIG.MAX_ENTRIES
  };
}

/* =========================================================
   INITIALIZATION
   ========================================================= */

// Clean up on module load
evictExpiredEntries();

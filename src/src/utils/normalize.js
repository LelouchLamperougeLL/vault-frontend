// src/utils/normalize.js

/* =========================================================
   BASIC STRING NORMALIZATION
   ========================================================= */

/**
 * Lowercase + remove non-alphanumerics
 * (used for loose matching)
 */
export function normalize(str = "") {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Title normalization for search
 * (keeps spaces for tokenization)
 */
export function normalizeTitle(str = "") {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================================================
   QUERY CANONICALIZATION (CACHE KEYS)
   ========================================================= */

/**
 * Aggressive semantic normalization
 * - strips accents
 * - removes punctuation
 * - removes articles
 */
export function normalizeQuery(query = "") {
  return String(query)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")   // accents
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Order-independent canonical query
 * ("the dark knight" === "knight dark")
 */
export function canonicalizeQuery(query = "") {
  return normalizeQuery(query)
    .split(" ")
    .filter(Boolean)
    .sort()
    .join(" ");
}

/* =========================================================
   TYPE & YEAR NORMALIZATION
   ========================================================= */

export function normalizeType(type = "") {
  const t = type.toLowerCase();

  if (t === "tv" || t === "series" || t === "show") return "series";
  if (t === "movie" || t === "film") return "movie";
  if (t === "anime") return "anime";

  return t;
}

export function normalizeYear(year) {
  if (!year) return "";

  const y = String(year).trim();
  return /^\d{4}$/.test(y) ? y : "";
}

/* =========================================================
   HASHING (FAST & DETERMINISTIC)
   ========================================================= */

/**
 * Fast 32-bit deterministic hash
 * (NOT cryptographic)
 */
export function hashString(str = "") {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // force int32
  }

  return Math.abs(hash).toString(16);
}

/* =========================================================
   CACHE KEY BUILDER
   ========================================================= */

/**
 * Stable cache key for external lookups
 */
export function buildStableCacheKey({
  type,
  query,
  year
}) {
  const VERSION = "v2";

  const t = normalizeType(type);
  const q = canonicalizeQuery(query);
  const y = normalizeYear(year);

  const semanticKey = `${t}|${q}|${y}`;
  const hash = hashString(semanticKey);

  return [
    VERSION,
    t,
    q,
    y,
    hash
  ].join("|");
}

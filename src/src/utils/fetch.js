// src/utils/fetch.js

/**
 * Safe JSON fetch with:
 * - retries
 * - timeout
 * - graceful failure (returns null)
 *
 * IMPORTANT:
 * - Never throws to UI
 * - Engines must handle null responses
 */
export async function safeFetch(
  url,
  options = {},
  retries = 2,
  timeoutMs = 10_000
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    if (retries > 0) {
      return safeFetch(url, options, retries - 1, timeoutMs);
    }

    console.warn("[safeFetch] Failed:", url, err.message);
    return null;
  } finally {
    clearTimeout(id);
  }
}

/* =========================================================
   HEADER BUILDERS
   ========================================================= */

/**
 * Build RapidAPI headers (MDL)
 */
export function buildRapidHeaders(apiKey, host) {
  if (!apiKey || !host) return {};

  return {
    "X-RapidAPI-Key": apiKey,
    "X-RapidAPI-Host": host
  };
}

/**
 * Standard JSON headers
 */
export function jsonHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    ...extra
  };
}

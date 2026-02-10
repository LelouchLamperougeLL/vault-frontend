// src/engines/genre.engine.js

/* =========================================================
   INTERNAL HELPERS
   ========================================================= */

/**
 * Normalize genres into lowercase array
 */
function extractGenres(genres) {
  if (!genres) return [];

  if (Array.isArray(genres)) {
    return genres
      .map(g => g.toLowerCase().trim())
      .filter(Boolean);
  }

  if (typeof genres === "string") {
    return genres
      .split(",")
      .map(g => g.toLowerCase().trim())
      .filter(Boolean);
  }

  return [];
}

/**
 * Log-scaled time weight
 * (same philosophy as rating engine)
 */
function timeWeight(minutesWatched) {
  return Math.log1p(minutesWatched);
}

/**
 * Optional recency decay
 */
function recencyWeight(
  lastWatchedAt,
  halfLifeDays = 180
) {
  if (!lastWatchedAt) return 1;

  const ageDays =
    (Date.now() - lastWatchedAt) /
    (1000 * 60 * 60 * 24);

  return Math.exp(-ageDays / halfLifeDays);
}

/* =========================================================
   CORE GENRE DISTRIBUTION ENGINE
   ========================================================= */

/**
 * Calculate weighted fractional genre distribution
 */
function calculateFractionalGenreDistribution(
  items = [],
  options = {}
) {
  const {
    useRecency = false,
    recencyHalfLifeDays = 180
  } = options;

  const distribution = {};
  let totalWeight = 0;

  for (const item of items) {
    const genres = extractGenres(item.genres);
    if (genres.length === 0) continue;

    const minutes = item.minutesWatched;
    if (typeof minutes !== "number" || minutes <= 0) continue;

    const baseWeight = timeWeight(minutes);
    if (baseWeight === 0) continue;

    const recency = useRecency
      ? recencyWeight(
          item.lastWatchedAt,
          recencyHalfLifeDays
        )
      : 1;

    const weight = baseWeight * recency;
    const fractional = weight / genres.length;

    totalWeight += weight;

    for (const genre of genres) {
      distribution[genre] ??= 0;
      distribution[genre] += fractional;
    }
  }

  return {
    distribution,
    totalWeight
  };
}

/* =========================================================
   NORMALIZATION
   ========================================================= */

/**
 * Convert raw distribution to percentages
 */
function normalizeGenreDistribution(distribution = {}) {
  const total = Object.values(distribution)
    .reduce((sum, v) => sum + v, 0);

  if (total === 0) return {};

  const normalized = {};

  for (const [genre, value] of Object.entries(distribution)) {
    normalized[genre] = Number(
      ((value / total) * 100).toFixed(2)
    );
  }

  return normalized;
}

/* =========================================================
   PUBLIC API
   ========================================================= */

/**
 * Get genre profile from watch history
 */
export function getGenreProfile(
  items = [],
  options = {}
) {
  const { distribution, totalWeight } =
    calculateFractionalGenreDistribution(
      items,
      options
    );

  return {
    raw: distribution,
    percent: normalizeGenreDistribution(distribution),
    totalWeight
  };
}

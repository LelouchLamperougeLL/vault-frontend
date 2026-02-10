// src/engines/actor.engine.js

/* =========================================================
   INTERNAL HELPERS
   ========================================================= */

/**
 * Canonicalize actor names
 * (prevents duplicates due to casing / spacing)
 */
function normalizeActor(name = "") {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Completion weight:
 * - full completion → 1
 * - partial → nonlinear decay
 */
function completionWeight(progress) {
  if (!progress) return 0;

  if (progress.isCompleted === true) return 1;

  if (
    typeof progress.watchedEpisodes === "number" &&
    typeof progress.totalEpisodes === "number" &&
    progress.totalEpisodes > 0
  ) {
    const ratio =
      progress.watchedEpisodes /
      progress.totalEpisodes;

    // Gentle bias toward completion
    return Math.pow(ratio, 0.7);
  }

  return 0;
}

/**
 * Role importance weighting
 */
function roleWeight(order) {
  if (order === undefined || order === null) return 1;

  if (order === 0) return 1.5;   // lead
  if (order <= 3) return 1.2;    // main cast
  if (order <= 10) return 1;     // supporting
  return 0.6;                    // cameo
}

/**
 * Log-scaled time weight
 */
function timeWeight(minutesWatched) {
  return Math.log1p(minutesWatched);
}

/* =========================================================
   CORE ACTOR POPULARITY ENGINE
   ========================================================= */

/**
 * Calculate raw actor popularity scores
 */
function calculateActorPopularity({
  items = [],
  progressMap = {}
}) {
  const actorScores = {};

  for (const item of items) {
    const progress = progressMap[item.imdbID];

    // Cast may live in meta or at root
    const cast =
      item.meta?.cast ||
      item.cast ||
      [];

    if (!progress || !Array.isArray(cast)) continue;

    const completion = completionWeight(progress);
    if (completion === 0) continue;

    const minutes = progress.minutesWatched;
    if (typeof minutes !== "number" || minutes <= 0) continue;

    const itemWeight =
      completion * timeWeight(minutes);

    for (const actor of cast) {
      const key = normalizeActor(actor.name);
      const weight = roleWeight(actor.order);

      actorScores[key] ??= 0;
      actorScores[key] += itemWeight * weight;
    }
  }

  return actorScores;
}

/* =========================================================
   NORMALIZATION
   ========================================================= */

/**
 * Normalize raw scores into percentages
 */
function normalizeActorPopularity(actorScores = {}) {
  const total = Object.values(actorScores)
    .reduce((sum, v) => sum + v, 0);

  if (total === 0) return {};

  const normalized = {};

  for (const [actor, score] of Object.entries(actorScores)) {
    normalized[actor] = Number(
      ((score / total) * 100).toFixed(2)
    );
  }

  return normalized;
}

/* =========================================================
   PUBLIC API
   ========================================================= */

/**
 * Get actor popularity profile
 */
export function getActorPopularityProfile({
  items = [],
  progressMap = {}
}) {
  const raw = calculateActorPopularity({
    items,
    progressMap
  });

  return {
    raw,
    percent: normalizeActorPopularity(raw)
  };
}

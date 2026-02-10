// src/engines/rating.engine.js

/* =========================================================
   INTERNAL WEIGHTING HELPERS
   ========================================================= */

/**
 * Confidence grows with watch time.
 * Below minMinutes → zero trust.
 */
function ratingConfidence(
  minutesWatched,
  minMinutes = 20
) {
  if (minutesWatched < minMinutes) return 0;

  // Smooth saturation curve
  return Math.min(
    1,
    Math.log1p(minutesWatched) / Math.log1p(300)
  );
}

/**
 * Log-scaled time weight
 */
function timeWeight(minutesWatched) {
  return Math.log1p(minutesWatched);
}

/* =========================================================
   FINAL WEIGHTED RATING ENGINE
   ========================================================= */

/**
 * Calculate a fair weighted rating based on time watched
 *
 * ratings: [
 *   {
 *     imdbID,
 *     rating: number (1–10),
 *     minutesWatched: number
 *   }
 * ]
 */
export function calculateWeightedRating(
  ratings = [],
  options = {}
) {
  const {
    minMinutes = 20,
    maxMinutesCap = null
  } = options;

  let weightedSum = 0;
  let totalWeight = 0;
  let contributingItems = 0;

  const breakdown = [];

  for (const r of ratings) {
    if (
      typeof r.rating !== "number" ||
      r.rating < 1 ||
      r.rating > 10 ||
      typeof r.minutesWatched !== "number" ||
      r.minutesWatched <= 0
    ) {
      continue;
    }

    let minutes = r.minutesWatched;
    if (maxMinutesCap) {
      minutes = Math.min(minutes, maxMinutesCap);
    }

    const confidence = ratingConfidence(
      minutes,
      minMinutes
    );
    if (confidence === 0) continue;

    const weight = timeWeight(minutes) * confidence;
    const contribution = r.rating * weight;

    weightedSum += contribution;
    totalWeight += weight;
    contributingItems++;

    breakdown.push({
      imdbID: r.imdbID,
      rating: r.rating,
      minutesWatched: minutes,
      confidence: Number(confidence.toFixed(2)),
      weight: Number(weight.toFixed(2)),
      contribution: Number(contribution.toFixed(2))
    });
  }

  if (totalWeight === 0) {
    return {
      weightedRating: 0,
      contributingItems: 0,
      breakdown: []
    };
  }

  return {
    weightedRating: Number(
      (weightedSum / totalWeight).toFixed(2)
    ),
    contributingItems,
    breakdown
  };
}

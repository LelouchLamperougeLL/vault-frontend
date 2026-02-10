// src/engines/asian-detection.engine.js

/* =========================================================
   NORMALIZATION HELPERS
   ========================================================= */

/**
 * Normalize country / language / genre strings
 */
function normalizeOrigin(str = "") {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check if any term exists in a string
 */
function containsAny(haystack, needles = []) {
  return needles.some(term => haystack.includes(term));
}

/* =========================================================
   REFERENCE DATA (INTENTIONAL SCOPE)
   ========================================================= */

// East + Southeast Asia
const EAST_SE_ASIA_COUNTRIES = [
  "japan",
  "south korea",
  "north korea",
  "korea",
  "china",
  "hong kong",
  "taiwan",
  "thailand",
  "vietnam",
  "philippines",
  "malaysia",
  "indonesia",
  "singapore"
];

const EAST_SE_ASIA_LANGUAGES = [
  "japanese",
  "korean",
  "mandarin",
  "cantonese",
  "chinese",
  "thai",
  "vietnamese",
  "malay",
  "indonesian"
];

// Western blockers (false-positive guards)
const WESTERN_COUNTRIES = [
  "united states",
  "usa",
  "canada",
  "united kingdom",
  "uk",
  "england",
  "france",
  "germany",
  "spain",
  "australia"
];

const WESTERN_LANGUAGES = [
  "english",
  "french",
  "spanish",
  "german",
  "italian",
  "portuguese"
];

/* =========================================================
   SCORING ENGINE
   ========================================================= */

/**
 * Score Asian-origin confidence
 */
function scoreAsianOrigin({
  Country,
  Language,
  Genre
}) {
  const country = normalizeOrigin(Country);
  const language = normalizeOrigin(Language);
  const genre = normalizeOrigin(Genre);

  const blob = `${country} ${language}`;

  let score = 0;
  const reasons = [];

  // ✅ Strong Asian signals
  if (containsAny(country, EAST_SE_ASIA_COUNTRIES)) {
    score += 50;
    reasons.push("asian-country");
  }

  if (containsAny(language, EAST_SE_ASIA_LANGUAGES)) {
    score += 40;
    reasons.push("asian-language");
  }

  // ➕ Weak contextual hint (never decisive alone)
  if (/drama|anime/.test(genre)) {
    score += 10;
    reasons.push("genre-hint");
  }

  // ❌ Western blockers
  if (containsAny(country, WESTERN_COUNTRIES)) {
    score -= 60;
    reasons.push("western-country");
  }

  if (containsAny(language, WESTERN_LANGUAGES)) {
    score -= 40;
    reasons.push("western-language");
  }

  // ❌ Extra-strict rule for animation
  if (/animation/.test(genre)) {
    if (
      containsAny(blob, WESTERN_COUNTRIES) ||
      containsAny(blob, WESTERN_LANGUAGES)
    ) {
      score -= 50;
      reasons.push("western-animation-block");
    }
  }

  return { score, reasons };
}

/* =========================================================
   PUBLIC API
   ========================================================= */

/**
 * Detect whether an item is of Asian origin
 *
 * options:
 * - threshold (default 50)
 * - debug (return score + reasons)
 */
export function detectAsianOrigin(
  item,
  options = {}
) {
  const {
    threshold = 50,
    debug = false
  } = options;

  const { score, reasons } =
    scoreAsianOrigin(item);

  const isAsian = score >= threshold;

  if (debug) {
    return {
      isAsian,
      score,
      reasons
    };
  }

  return isAsian;
}

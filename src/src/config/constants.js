// src/config/constants.js

/* =========================================================
   ADMIN & PERMISSIONS
   ========================================================= */

export const ADMIN_IDS = [
  "74e5b3ea-113f-4d6c-be2a-b0b52b2e92c3"
];

/* =========================================================
   EXTERNAL API KEYS
   (Frontend-safe keys only)
   ========================================================= */

export const API_KEYS = {
  OMDB: "5591108c",
  TMDB: "68b27c1f85725736f0aec18b903197b0",
  RAPID: "9782bOaf7fmsh8b54c22e5cOaf5cp13e6e8jsn8e2e765657a5"
};

/* =========================================================
   EXTERNAL API HOSTS
   ========================================================= */

export const API_HOSTS = {
  MDL: "mydramalist-api.p.rapidapi.com",
  TMDB_IMG: "https://image.tmdb.org/t/p"
};

/* =========================================================
   CACHE & TTL SETTINGS
   ========================================================= */

export const CACHE_TTL = {
  DEFAULT: 30 * 24 * 60 * 60 * 1000, // 30 days
  SHORT: 5 * 60 * 1000,             // 5 minutes
  LONG: 90 * 24 * 60 * 60 * 1000    // 90 days
};

export const CACHE_LIMITS = {
  MAX_ENTRIES: 500
};

/* =========================================================
   ASIAN CONTENT REGISTRY
   ========================================================= */

export const ASIAN_SOURCES = {
  MDL: "mdl",
  MAL: "mal"
};

/* =========================================================
   APP METADATA
   ========================================================= */

export const APP_META = {
  NAME: "The Vault",
  EDITION: "Platinum",
  VERSION: "8.0"
};

/* =========================================================
   UI / DEFAULTS
   ========================================================= */

export const DEFAULTS = {
  POSTER_PLACEHOLDER:
    "https://via.placeholder.com/300x450?text=No+Poster",
  PAGE_SIZE: 24,
  MIN_RATING_MINUTES: 20
};

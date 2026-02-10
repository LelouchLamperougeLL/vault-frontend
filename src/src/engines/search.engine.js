// src/engines/search.engine.js

import { safeFetch } from "../utils/fetch";
import {
  normalizeTitle
} from "../utils/normalize";

/* =========================================================
   BASIC HELPERS
   ========================================================= */

/**
 * Tokenize a normalized title
 */
function tokenize(title) {
  return normalizeTitle(title)
    .split(" ")
    .filter(Boolean);
}

/**
 * Jaccard-style token similarity
 */
function tokenSimilarity(a, b) {
  const A = new Set(tokenize(a));
  const B = new Set(tokenize(b));

  if (A.size === 0 || B.size === 0) return 0;

  let intersection = 0;
  for (const t of A) {
    if (B.has(t)) intersection++;
  }

  return intersection / Math.max(A.size, B.size);
}

/**
 * Extract year defensively
 */
function extractYear(item) {
  return (
    item.Year ||
    item.year ||
    item.release_date?.slice(0, 4) ||
    item.first_air_date?.slice(0, 4) ||
    item.premiered?.slice(0, 4) ||
    null
  );
}

/**
 * Extract popularity signal
 */
function extractPopularity(item, index) {
  if (typeof item.popularity === "number") return item.popularity;

  if (typeof item.imdbVotes === "string") {
    return (
      parseInt(item.imdbVotes.replace(/,/g, ""), 10) || 0
    );
  }

  // fallback: higher rank for earlier results
  return Math.max(0, 100 - index);
}

/* =========================================================
   CANDIDATE SCORING
   ========================================================= */

function scoreCandidate({
  item,
  query,
  targetYear,
  titleKey = "title",
  index
}) {
  let score = 0;
  const reasons = [];

  const queryNorm = normalizeTitle(query);
  const title = item[titleKey] || "";
  const titleNorm = normalizeTitle(title);
  const year = extractYear(item);

  // Exact title match
  if (titleNorm === queryNorm) {
    score += 50;
    reasons.push("exact-title");
  }

  // Fuzzy title similarity
  const similarity = tokenSimilarity(title, query);
  if (similarity > 0) {
    const fuzzyScore = Math.round(similarity * 35);
    score += fuzzyScore;
    reasons.push(`fuzzy(${fuzzyScore})`);
  }

  // Year match
  if (targetYear && year) {
    if (String(year) === String(targetYear)) {
      score += 25;
      reasons.push("exact-year");
    } else if (Math.abs(year - targetYear) === 1) {
      score += 15;
      reasons.push("near-year");
    }
  }

  // Popularity boost
  const pop = extractPopularity(item, index);
  if (pop > 0) {
    const popScore = Math.min(10, Math.round(pop / 100));
    score += popScore;
    reasons.push(`popularity(${popScore})`);
  }

  // Source authority nudges
  if (item.source === "tvmaze") score += 5;
  if (item.source === "tmdb") score += 5;

  return { item, score, reasons };
}

/* =========================================================
   EXTERNAL SEARCH ADAPTERS
   ========================================================= */

async function searchTMDB(query, year, type, apiKey) {
  if (!apiKey) return null;

  const endpoint =
    type === "series" ? "search/tv" : "search/movie";

  let url = `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&query=${encodeURIComponent(
    query
  )}`;

  if (year) {
    url +=
      type === "series"
        ? `&first_air_date_year=${year}`
        : `&year=${year}`;
  }

  return safeFetch(url);
}

async function searchTVMaze(query) {
  return safeFetch(
    `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(
      query
    )}`
  );
}

async function searchOMDB(query, year, type, apiKey) {
  if (!apiKey) return null;

  let url = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(
    query
  )}&type=${type === "series" ? "series" : "movie"}`;

  if (year) url += `&y=${year}`;

  return safeFetch(url);
}

async function searchJikan(query) {
  return safeFetch(
    `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(
      query
    )}&limit=5`
  );
}

async function searchMDL(query, apiKey) {
  if (!apiKey) return null;

  return safeFetch(
    `https://mydramalist-api.p.rapidapi.com/search/title?q=${encodeURIComponent(
      query
    )}`,
    {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host":
          "mydramalist-api.p.rapidapi.com"
      }
    }
  );
}

/* =========================================================
   NORMALIZATION
   ========================================================= */

function normalizeCandidate(raw, source) {
  let type = "movie";

  if (
    source === "tvmaze" ||
    source === "jikan" ||
    source === "mdl"
  ) {
    type = "series";
  }

  if (source === "omdb" && raw.Type === "series") {
    type = "series";
  }

  if (
    source === "tmdb" &&
    (raw.media_type === "tv" ||
      raw.first_air_date)
  ) {
    type = "series";
  }

  return {
    source,
    title: raw.title || raw.name || raw.Title,
    year:
      raw.premiered?.slice(0, 4) ||
      raw.release_date?.slice(0, 4) ||
      raw.first_air_date?.slice(0, 4) ||
      raw.Year ||
      null,
    imdbID:
      raw.externals?.imdb ||
      raw.imdbID ||
      null,
    tmdbID: source === "tmdb" ? raw.id : null,
    plot:
      raw.summary?.replace(/<[^>]+>/g, "") ||
      raw.overview ||
      raw.Plot ||
      null,
    poster:
      raw.image?.original ||
      (raw.poster_path
        ? `https://image.tmdb.org/t/p/w500${raw.poster_path}`
        : raw.Poster) ||
      null,
    type,
    popularity: raw.popularity,
    imdbVotes: raw.imdbVotes,
    raw
  };
}

/* =========================================================
   CLUSTERING & MERGING
   ========================================================= */

function reconcile(candidates) {
  const clusters = [];
  const processed = new Set();
  const imdbMap = {};

  candidates.forEach((c, idx) => {
    if (c.imdbID) {
      imdbMap[c.imdbID] ??= [];
      imdbMap[c.imdbID].push(c);
      processed.add(idx);
    }
  });

  Object.values(imdbMap).forEach(cluster =>
    clusters.push(cluster)
  );

  candidates.forEach((c, idx) => {
    if (!processed.has(idx)) clusters.push([c]);
  });

  return clusters;
}

function mergeBest(cluster) {
  cluster.sort((a, b) => b.score - a.score);

  const pick = field =>
    cluster.find(c => c[field])?.[field] ||
    null;

  const primary = cluster[0];

  return {
    Title: pick("title"),
    Year: pick("year"),
    imdbID: pick("imdbID"),
    Type: primary.type,
    Plot: pick("plot"),
    Poster: pick("poster"),
    tmdb: primary.tmdbID
      ? { id: primary.tmdbID }
      : null,
    sourcesUsed: cluster.map(c => c.source),
    confidence: primary.score
  };
}

/* =========================================================
   FINAL SEARCH API
   ========================================================= */

export async function smartSearch(
  query,
  apiKeys,
  type = "all",
  year = null
) {
  const q = query.trim();
  if (!q) return [];

  const requests = [];

  if (type === "all" || type === "movie") {
    requests.push(
      searchTMDB(q, year, "movie", apiKeys.tmdb).then(v => ({
        v,
        s: "tmdb"
      }))
    );
  }

  if (type === "all" || type === "series") {
    requests.push(
      searchTMDB(q, year, "series", apiKeys.tmdb).then(v => ({
        v,
        s: "tmdb"
      }))
    );
    requests.push(
      searchTVMaze(q).then(v => ({ v, s: "tvmaze" }))
    );
  }

  if (type === "all" || type === "movie") {
    requests.push(
      searchOMDB(q, year, "movie", apiKeys.omdb).then(v => ({
        v,
        s: "omdb"
      }))
    );
  }

  if (type === "all" || type === "series") {
    requests.push(
      searchOMDB(q, year, "series", apiKeys.omdb).then(v => ({
        v,
        s: "omdb"
      }))
    );
    requests.push(
      searchJikan(q).then(v => ({ v, s: "jikan" }))
    );
    requests.push(
      searchMDL(q, apiKeys.rapid).then(v => ({
        v,
        s: "mdl"
      }))
    );
  }

  const results = await Promise.allSettled(requests);
  const rawCandidates = [];

  results.forEach(res => {
    if (res.status !== "fulfilled" || !res.value?.v)
      return;

    const { v, s } = res.value;
    let list = [];

    if (s === "tmdb") list = v.results || [];
    else if (s === "tvmaze")
      list = v.map(x => x.show) || [];
    else if (s === "omdb") list = v.Search || [];
    else if (s === "jikan") list = v.data || [];
    else if (s === "mdl") list = v.results || [];

    list.forEach(item =>
      rawCandidates.push(normalizeCandidate(item, s))
    );
  });

  if (rawCandidates.length === 0) return [];

  rawCandidates.forEach((c, index) => {
    const scored = scoreCandidate({
      item: c,
      query: q,
      targetYear: year,
      titleKey: "title",
      index
    });
    c.score = scored.score;
  });

  const clusters = reconcile(rawCandidates);
  const merged = clusters.map(cluster =>
    mergeBest(cluster)
  );

  return merged.sort(
    (a, b) => b.confidence - a.confidence
  );
}

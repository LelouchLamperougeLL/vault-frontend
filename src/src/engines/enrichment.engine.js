// src/engines/enrichment.engine.js

import { safeFetch } from "../utils/fetch";
import { detectAsianOrigin } from "./asian-detection.engine";
import { ASIAN_SOURCES } from "../config/constants";

/* =========================================================
   CLASSIFICATION
   ========================================================= */

function classifyForEnrichment(item) {
  return {
    isSeries: item.Type === "series",
    isAnimation: /animation/i.test(item.Genre || ""),
    isAsian: detectAsianOrigin(item)
  };
}

/* =========================================================
   ASIAN REGISTRY RESOLUTION
   ========================================================= */

/**
 * Resolve Asian content via external registry
 */
async function resolveAsianRegistry({
  imdbID,
  title,
  preferredSource,
  supabase,
  apiKeys,
  isAdmin
}) {
  if (!imdbID || !title) return null;

  // 1️⃣ IMDb → external mapping (hard stop if exists)
  try {
    const { data: mapping } = await supabase
      .from("imdb_external_map")
      .select("source, source_id")
      .eq("imdb_id", imdbID)
      .single();

    if (mapping && mapping.source === preferredSource) {
      const { data: cached } = await supabase
        .from("asian_external_registry")
        .select("*")
        .eq("source", mapping.source)
        .eq("source_id", mapping.source_id)
        .single();

      if (cached) {
        return { ...cached.payload, _registry_source: "cache" };
      }
    }
  } catch {
    /* silent */
  }

  // 2️⃣ External resolution (one-time)
  let resolved = null;

  if (preferredSource === ASIAN_SOURCES.MDL) {
    resolved = await resolveMDLExternally(title, apiKeys.rapid);
  }

  if (preferredSource === ASIAN_SOURCES.MAL) {
    resolved = await resolveMALExternally(title);
  }

  if (!resolved) return null;

  // 3️⃣ Persist (admin only)
  if (isAdmin) {
    try {
      await supabase
        .from("asian_external_registry")
        .upsert({
          source: preferredSource,
          source_id: resolved.source_id,
          payload: resolved.payload,
          updated_at: new Date(),
          overridden_by: "admin"
        });

      await supabase
        .from("imdb_external_map")
        .upsert({
          imdb_id: imdbID,
          source: preferredSource,
          source_id: resolved.source_id,
          updated_at: new Date()
        });
    } catch {
      console.warn("[enrichment] Registry persist failed");
    }
  }

  return { ...resolved.payload, _registry_source: "api" };
}

/* =========================================================
   EXTERNAL RESOLVERS
   ========================================================= */

async function resolveMDLExternally(title, apiKey) {
  if (!apiKey) return null;

  const search = await safeFetch(
    `https://mydramalist-api.p.rapidapi.com/search/title?q=${encodeURIComponent(title)}`,
    {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "mydramalist-api.p.rapidapi.com"
      }
    }
  );

  const found = search?.results?.[0];
  if (!found) return null;

  const detail = await safeFetch(
    `https://mydramalist-api.p.rapidapi.com/title/${found.id}`,
    {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "mydramalist-api.p.rapidapi.com"
      }
    }
  );

  if (!detail) return null;

  return {
    source_id: found.id,
    payload: detail
  };
}

async function resolveMALExternally(title) {
  const res = await safeFetch(
    `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`
  );

  const anime = res?.data?.[0];
  if (!anime) return null;

  return {
    source_id: anime.mal_id,
    payload: anime
  };
}

/* =========================================================
   ENRICHMENT STAGES
   ========================================================= */

async function enrichAnime(item, ctx, supabase, isAdmin) {
  if (!ctx.isAnimation || item.meta?.anime) return null;

  const anime = await resolveAsianRegistry({
    imdbID: item.imdbID,
    title: item.Title,
    preferredSource: ASIAN_SOURCES.MAL,
    supabase,
    apiKeys: {},
    isAdmin
  });

  if (!anime) return null;

  return {
    anime: {
      malId: anime.mal_id,
      score: anime.score,
      studios: anime.studios?.map(s => s.name) || [],
      confidence: 0.9
    }
  };
}

async function enrichTVMaze(item, ctx) {
  if (!ctx.isSeries || item.meta?.tvmaze) return null;

  const show = await safeFetch(
    `https://api.tvmaze.com/lookup/shows?imdb=${item.imdbID}`
  );
  if (!show) return null;

  const [episodes, cast] = await Promise.all([
    safeFetch(`https://api.tvmaze.com/shows/${show.id}/episodes`),
    safeFetch(`https://api.tvmaze.com/shows/${show.id}/cast`)
  ]);

  return {
    tvmaze: {
      id: show.id,
      episodes,
      cast,
      confidence: 0.95
    }
  };
}

async function enrichTMDB(item, ctx, apiKeys) {
  if (!apiKeys.tmdb) return null;

  let tmdbId = item.tmdb?.id;

  if (!tmdbId) {
    const find = await safeFetch(
      `https://api.themoviedb.org/3/find/${item.imdbID}?api_key=${apiKeys.tmdb}&external_source=imdb_id`
    );

    const match = ctx.isSeries
      ? find?.tv_results?.[0]
      : find?.movie_results?.[0];

    if (match) tmdbId = match.id;
  }

  if (!tmdbId) return null;

  const [credits, details, images] = await Promise.all([
    safeFetch(
      `https://api.themoviedb.org/3/${ctx.isSeries ? "tv" : "movie"}/${tmdbId}/credits?api_key=${apiKeys.tmdb}`
    ),
    ctx.isSeries
      ? safeFetch(
          `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKeys.tmdb}`
        )
      : null,
    safeFetch(
      `https://api.themoviedb.org/3/${ctx.isSeries ? "tv" : "movie"}/${tmdbId}/images?api_key=${apiKeys.tmdb}`
    )
  ]);

  return {
    tmdb: {
      id: tmdbId,
      cast: credits?.cast || [],
      director:
        credits?.crew
          ?.filter(c => c.job === "Director")
          .map(d => d.name) || [],
      seasons: details?.seasons || null,
      credits: { images: { backdrops: images?.backdrops || [] } },
      confidence: 0.95
    }
  };
}

/* =========================================================
   FINAL PIPELINE
   ========================================================= */

export async function enrichItem(
  item,
  apiKeys,
  supabase,
  isAdmin = false
) {
  const ctx = classifyForEnrichment(item);
  const meta = { ...(item.meta || {}) };
  let tmdbData = { ...(item.tmdb || {}) };
  const provenance = [];

  const stages = [
    () => enrichAnime(item, ctx, supabase, isAdmin),
    () => enrichTVMaze(item, ctx),
    () =>
      ctx.isAsian
        ? resolveAsianRegistry({
            imdbID: item.imdbID,
            title: item.Title,
            preferredSource: ASIAN_SOURCES.MDL,
            supabase,
            apiKeys,
            isAdmin
          })
        : null,
    () => enrichTMDB(item, ctx, apiKeys)
  ];

  for (const stage of stages) {
    try {
      const result = await stage();
      if (!result) continue;

      if (result.tmdb) {
        tmdbData = { ...tmdbData, ...result.tmdb };
        delete result.tmdb;
      }

      Object.assign(meta, result);
      provenance.push(...Object.keys(result));
    } catch (e) {
      console.warn("[enrichment] Stage failed", e);
    }
  }

  // Normalize TMDB cast into meta
  if (tmdbData.cast) {
    meta.cast = tmdbData.cast.map(c => ({
      name: c.name,
      character: c.character,
      photo: c.profile_path
        ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
        : null
    }));
  }

  return {
    ...item,
    meta,
    tmdb: tmdbData,
    enrichmentSources: provenance,
    enriched: true
  };
}

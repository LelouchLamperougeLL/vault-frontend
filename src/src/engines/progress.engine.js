// src/engines/progress.engine.js

/* =========================================================
   EPISODE WATCH STATE RESOLUTION
   ========================================================= */

/**
 * Resolve the watch state of a single episode
 */
export function resolveEpisodeState(episodeId, watchHistory = {}) {
  const record = watchHistory?.[episodeId];

  if (!record) {
    return { state: "unwatched", progress: 0 };
  }

  if (record.watched === true) {
    return { state: "watched", progress: 1 };
  }

  if (
    typeof record.progress === "number" &&
    record.progress > 0
  ) {
    return { state: "partial", progress: record.progress };
  }

  return { state: "unwatched", progress: 0 };
}

/* =========================================================
   SERIES-LEVEL PROGRESS
   ========================================================= */

/**
 * Calculate overall series progress
 */
export function calculateEpisodeProgress({
  episodes,
  watchHistory
}) {
  if (!Array.isArray(episodes)) return null;

  let watchedEpisodes = 0;
  let lastWatched = null;
  let nextToWatch = null;
  let hasGaps = false;
  let gapDetected = false;

  for (const ep of episodes) {
    const state = resolveEpisodeState(ep.id, watchHistory);

    if (state.state === "watched") {
      watchedEpisodes++;

      lastWatched = {
        episodeId: ep.id,
        season: ep.season,
        episode: ep.episode
      };
    } else {
      // Detect gaps after first watched episode
      if (watchedEpisodes > 0 && !gapDetected) {
        hasGaps = true;
        gapDetected = true;
      }

      if (!nextToWatch) {
        nextToWatch = {
          episodeId: ep.id,
          season: ep.season,
          episode: ep.episode
        };
      }
    }
  }

  const totalEpisodes = episodes.length;
  const completionPercent =
    totalEpisodes > 0
      ? Math.round((watchedEpisodes / totalEpisodes) * 100)
      : 0;

  return {
    watchedEpisodes,
    totalEpisodes,
    completionPercent,
    lastWatched,
    nextToWatch,
    isCompleted: watchedEpisodes === totalEpisodes,
    hasGaps
  };
}

/* =========================================================
   RESUME INTELLIGENCE
   ========================================================= */

/**
 * Decide where playback should resume
 */
export function getResumeTarget({
  episodes,
  watchHistory
}) {
  if (!Array.isArray(episodes)) return null;

  for (const ep of episodes) {
    const state = resolveEpisodeState(ep.id, watchHistory);

    if (state.state === "partial") {
      return {
        episodeId: ep.id,
        season: ep.season,
        episode: ep.episode,
        resumeFrom: state.progress
      };
    }

    if (state.state === "unwatched") {
      return {
        episodeId: ep.id,
        season: ep.season,
        episode: ep.episode,
        resumeFrom: 0
      };
    }
  }

  // Fully completed series
  return null;
}

/* =========================================================
   SEASON-LEVEL PROGRESS
   ========================================================= */

/**
 * Calculate progress per season
 */
export function calculateSeasonProgress({
  episodes,
  watchHistory
}) {
  if (!Array.isArray(episodes)) return [];

  const seasons = {};

  for (const ep of episodes) {
    seasons[ep.season] ??= {
      season: ep.season,
      watched: 0,
      partial: 0,
      total: 0
    };

    const state = resolveEpisodeState(ep.id, watchHistory);

    seasons[ep.season].total++;

    if (state.state === "watched") {
      seasons[ep.season].watched++;
    }

    if (state.state === "partial") {
      seasons[ep.season].partial++;
    }
  }

  return Object.values(seasons).map(season => ({
    ...season,
    completionPercent: Math.round(
      (season.watched / season.total) * 100
    )
  }));
}

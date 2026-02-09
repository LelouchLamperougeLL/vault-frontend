import { useMemo } from 'react';
import type { VaultItem, VaultStats, CalendarDay, StreakData, Achievement, WatchGoal } from '@/types';

export function useEnhancedAnalytics(items: VaultItem[]) {
  // Main statistics
  const stats: VaultStats = useMemo(() => {
    const result: VaultStats = {
      total: items.length,
      watched: 0,
      watchlist: 0,
      progress: 0,
      dropped: 0,
      onHold: 0,
      avgRating: '–',
      byGenre: {},
      byYear: {},
      byLanguage: {},
      byStudio: {},
      topRated: [],
      rewatchCount: 0,
      totalWatchTime: 0,
      favoriteCount: 0,
    };

    let ratingSum = 0;
    let ratingCount = 0;
    let totalMinutes = 0;

    items.forEach((item) => {
      const meta = item.userMeta;

      if (meta.status === 'watched') result.watched++;
      if (meta.status === 'watchlist') result.watchlist++;
      if (meta.status === 'progress') result.progress++;
      if (meta.status === 'dropped') result.dropped++;
      if (meta.status === 'on_hold') result.onHold++;

      if (meta.rewatchCount > 0) result.rewatchCount += meta.rewatchCount;
      if (meta.favorite) result.favoriteCount++;

      if (meta.ratings?.overall > 0) {
        ratingSum += meta.ratings.overall;
        ratingCount++;
      }

      // Watch time calculation
      if (item.Runtime && item.Runtime !== 'N/A') {
        const minutes = parseInt(item.Runtime.replace(/\D/g, ''));
        if (!isNaN(minutes)) {
          totalMinutes += minutes * (1 + meta.rewatchCount);
        }
      }

      // Genre breakdown
      (item.Genre || '').split(',').forEach((g) => {
        const key = g.trim();
        if (key) result.byGenre[key] = (result.byGenre[key] || 0) + 1;
      });

      // Year breakdown
      const year = item.Year;
      if (year) result.byYear[year] = (result.byYear[year] || 0) + 1;

      // Language breakdown
      (item.Language || '').split(',').forEach((l) => {
        const key = l.trim();
        if (key) result.byLanguage[key] = (result.byLanguage[key] || 0) + 1;
      });

      // Studio breakdown
      item.meta?.productionCompanies?.forEach((s) => {
        if (s) result.byStudio[s] = (result.byStudio[s] || 0) + 1;
      });
    });

    result.avgRating = ratingCount ? (ratingSum / ratingCount).toFixed(1) : '–';
    result.totalWatchTime = Math.round(totalMinutes / 60);

    result.topRated = [...items]
      .filter((i) => i.userMeta?.ratings?.overall >= 8)
      .sort((a, b) => b.userMeta.ratings.overall - a.userMeta.ratings.overall)
      .slice(0, 10);

    return result;
  }, [items]);

  // Series progress stats
  const seriesProgress = useMemo(() => {
    let watched = 0;
    let total = 0;

    items.forEach((item) => {
      if (item.Type !== 'series') return;
      item.meta?.series?.seasons?.forEach((s) => {
        s.episodes?.forEach((ep) => {
          total++;
          if (ep.watched) watched++;
        });
      });
    });

    return {
      watched,
      total,
      percent: total ? Math.round((watched / total) * 100) : 0,
    };
  }, [items]);

  // Episode streak calculation
  const streak: StreakData = useMemo(() => {
    const days = new Map<string, number>();
    items.forEach((item) => {
      if (item.userMeta?.watchedOn) {
        days.set(item.userMeta.watchedOn, (days.get(item.userMeta.watchedOn) || 0) + 1);
      }
      item.userMeta?.watchHistory?.forEach((entry) => {
        days.set(entry.date, (days.get(entry.date) || 0) + 1);
      });
    });

    const sorted = [...days.keys()].sort();
    if (!sorted.length) return { streak: 0, longest: 0, lastWatched: null };

    let currentStreak = 1;
    let longest = 1;

    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (Math.round(diff) === 1) {
        currentStreak++;
        longest = Math.max(longest, currentStreak);
      } else if (Math.round(diff) > 1) {
        currentStreak = 1;
      }
    }

    const lastDate = new Date(sorted[sorted.length - 1]);
    const today = new Date();
    const diffToToday = (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffToToday > 2) currentStreak = 0;

    return { streak: currentStreak, longest, lastWatched: sorted[sorted.length - 1] };
  }, [items]);

  // Calendar data
  const calendar: CalendarDay[] = useMemo(() => {
    const map = new Map<string, { count: number; items: VaultItem[] }>();
    
    items.forEach((item) => {
      const date = item.userMeta?.watchedOn;
      if (!date) return;
      const existing = map.get(date) || { count: 0, items: [] };
      existing.count++;
      existing.items.push(item);
      map.set(date, existing);
    });

    const today = new Date();
    const days: CalendarDay[] = [];
    for (let i = 0; i < 180; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const data = map.get(key);
      days.push({ date: key, count: data?.count || 0, items: data?.items || [] });
    }
    return days.reverse();
  }, [items]);

  // Monthly watching habits
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    items.forEach((item) => {
      const date = item.userMeta?.watchedOn;
      if (!date) return;
      const key = date.slice(0, 7);
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12);
  }, [items]);

  // People analytics
  const peopleAnalytics = useMemo(() => {
    const directors: Record<string, number> = {};
    const actors: Record<string, number> = {};

    items.forEach((item) => {
      const meta = item.meta;
      if (meta?.director) {
        const list = Array.isArray(meta.director) ? meta.director : meta.director.split(',');
        list.forEach((d) => {
          const key = d.trim();
          if (key && key !== 'N/A') directors[key] = (directors[key] || 0) + 1;
        });
      }
      meta?.cast?.forEach((c) => {
        if (c?.name) actors[c.name] = (actors[c.name] || 0) + 1;
      });
    });

    return {
      directors: Object.entries(directors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      actors: Object.entries(actors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
    };
  }, [items]);

  // Taste profile
  const tasteProfile = useMemo(() => {
    let drama = 0;
    let action = 0;
    let comedy = 0;
    let horror = 0;
    let scifi = 0;
    let romance = 0;
    let documentary = 0;
    let foreign = 0;

    items.forEach((item) => {
      const genre = item.Genre || '';
      if (genre.includes('Drama')) drama++;
      if (genre.includes('Action')) action++;
      if (genre.includes('Comedy')) comedy++;
      if (genre.includes('Horror')) horror++;
      if (genre.includes('Sci-Fi') || genre.includes('Science Fiction')) scifi++;
      if (genre.includes('Romance')) romance++;
      if (genre.includes('Documentary')) documentary++;
      if (item.Language && !item.Language.includes('English')) foreign++;
    });

    const total = items.length || 1;
    return [
      { label: 'Drama', value: Math.round((drama / total) * 100), icon: '🎭' },
      { label: 'Action', value: Math.round((action / total) * 100), icon: '💥' },
      { label: 'Comedy', value: Math.round((comedy / total) * 100), icon: '😄' },
      { label: 'Horror', value: Math.round((horror / total) * 100), icon: '👻' },
      { label: 'Sci-Fi', value: Math.round((scifi / total) * 100), icon: '🚀' },
      { label: 'Romance', value: Math.round((romance / total) * 100), icon: '💕' },
      { label: 'Documentary', value: Math.round((documentary / total) * 100), icon: '📚' },
      { label: 'International', value: Math.round((foreign / total) * 100), icon: '🌍' },
    ].sort((a, b) => b.value - a.value);
  }, [items]);

  // Achievements with progress
  const achievements: Achievement[] = useMemo(() => {
    const watched = items.filter((i) => i.userMeta?.status === 'watched').length;
    const rated = items.filter((i) => i.userMeta?.ratings?.overall > 0).length;
    const rewatches = items.reduce((a, b) => a + (b.userMeta?.rewatchCount || 0), 0);
    const favorites = items.filter((i) => i.userMeta?.favorite).length;
    const seriesCompleted = items.filter((i) => {
      if (i.Type !== 'series') return false;
      const total = i.meta?.series?.seasons?.reduce((acc, s) => acc + (s.episodes?.length || 0), 0) || 0;
      const watched = i.meta?.series?.seasons?.reduce((acc, s) => acc + (s.episodes?.filter((e) => e.watched).length || 0), 0) || 0;
      return total > 0 && watched === total;
    }).length;

    return [
      {
        id: 'first_10',
        label: 'Getting Started',
        description: 'Watch 10 titles',
        unlocked: watched >= 10,
        icon: '🌱',
        tier: 'bronze',
        progress: Math.min(watched, 10),
        maxProgress: 10,
      },
      {
        id: '50_club',
        label: 'Movie Buff',
        description: 'Watch 50 titles',
        unlocked: watched >= 50,
        icon: '🎬',
        tier: 'silver',
        progress: Math.min(watched, 50),
        maxProgress: 50,
      },
      {
        id: 'century',
        label: 'Century Club',
        description: 'Watch 100 titles',
        unlocked: watched >= 100,
        icon: '💯',
        tier: 'gold',
        progress: Math.min(watched, 100),
        maxProgress: 100,
      },
      {
        id: 'critic',
        label: 'Critic',
        description: 'Rate 25 titles',
        unlocked: rated >= 25,
        icon: '⭐',
        tier: 'silver',
        progress: Math.min(rated, 25),
        maxProgress: 25,
      },
      {
        id: 'rewatcher',
        label: 'Rewatcher',
        description: 'Rewatch 10 titles',
        unlocked: rewatches >= 10,
        icon: '🔄',
        tier: 'bronze',
        progress: Math.min(rewatches, 10),
        maxProgress: 10,
      },
      {
        id: 'binge_watcher',
        label: 'Binge Watcher',
        description: '7-day streak',
        unlocked: streak.streak >= 7,
        icon: '🔥',
        tier: 'silver',
        progress: Math.min(streak.streak, 7),
        maxProgress: 7,
      },
      {
        id: 'series_master',
        label: 'Series Master',
        description: 'Complete 5 series',
        unlocked: seriesCompleted >= 5,
        icon: '📺',
        tier: 'gold',
        progress: Math.min(seriesCompleted, 5),
        maxProgress: 5,
      },
      {
        id: 'collector',
        label: 'Collector',
        description: 'Add 10 favorites',
        unlocked: favorites >= 10,
        icon: '💎',
        tier: 'bronze',
        progress: Math.min(favorites, 10),
        maxProgress: 10,
      },
    ];
  }, [items, streak]);

  // Watch goals
  const watchGoals: WatchGoal[] = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const watchedThisYear = items.filter((i) => {
      const year = i.userMeta?.watchedOn?.slice(0, 4);
      return year === currentYear.toString();
    }).length;

    return [
      { year: currentYear, target: 52, current: watchedThisYear },
      { year: currentYear, target: 100, current: watchedThisYear },
    ];
  }, [items]);

  // Gentle reminder
  const reminder = useMemo(() => {
    if (!items.length) return null;
    const lastWatched = items
      .map((i) => i.userMeta?.watchedOn)
      .filter(Boolean)
      .sort()
      .pop();

    if (!lastWatched) return null;

    const diff = Math.floor((Date.now() - new Date(lastWatched).getTime()) / (1000 * 60 * 60 * 24));

    if (diff >= 3 && diff < 7) return `You haven't watched anything in ${diff} days. Time for a movie night?`;
    if (diff >= 7) return "It's been a week! Your watchlist is getting lonely.";
    return null;
  }, [items]);

  // Recently watched
  const recentlyWatched = useMemo(() => {
    return [...items]
      .filter((i) => i.userMeta?.status === 'watched')
      .sort((a, b) => (b.userMeta?.lastUpdated || 0) - (a.userMeta?.lastUpdated || 0))
      .slice(0, 10);
  }, [items]);

  // Favorites
  const favorites = useMemo(() => {
    return items.filter((i) => i.userMeta?.favorite);
  }, [items]);

  return {
    stats,
    seriesProgress,
    streak,
    calendar,
    monthlyData,
    peopleAnalytics,
    tasteProfile,
    achievements,
    watchGoals,
    reminder,
    recentlyWatched,
    favorites,
  };
}

// Series progress hook
export function useSeriesProgress(series: { seasons: { episodes: { watched: boolean }[] }[] } | null | undefined) {
  return useMemo(() => {
    if (!series?.seasons?.length) {
      return { watched: 0, total: 0, percent: 0 };
    }

    let watched = 0;
    let total = 0;

    series.seasons.forEach((season: { episodes?: { watched: boolean }[] }) => {
      season.episodes?.forEach((ep: { watched: boolean }) => {
        total += 1;
        if (ep.watched) watched += 1;
      });
    });

    const percent = total ? Math.round((watched / total) * 100) : 0;

    return { watched, total, percent };
  }, [series]);
}

import { useMemo } from 'react';
import type { VaultItem, VaultStats, CalendarDay, StreakData, SeriesProgress } from '@/types';

export function useAnalytics(items: VaultItem[]) {
  // Main statistics
  const stats: VaultStats = useMemo(() => {
    const result: VaultStats = {
      total: items.length,
      watched: 0,
      progress: 0,
      avgRating: '–',
      byGenre: {},
      byYear: {},
      byLanguage: {},
      topRated: [],
      rewatchCount: 0,
    };

    let ratingSum = 0;
    let ratingCount = 0;

    items.forEach((item) => {
      const meta = item.userMeta;

      if (meta.status === 'watched') result.watched++;
      if (meta.status === 'progress' || (item.Type === 'series' && meta.series?.lastEpisode?.season! > 0 && meta.status !== 'watched')) {
        result.progress++;
      }

      if (meta.rewatchCount > 0) result.rewatchCount += meta.rewatchCount;

      if (meta.ratings?.overall > 0) {
        ratingSum += meta.ratings.overall;
        ratingCount++;
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
    });

    result.avgRating = ratingCount ? (ratingSum / ratingCount).toFixed(1) : '–';

    result.topRated = [...items]
      .filter((i) => i.userMeta?.ratings?.overall >= 9)
      .sort((a, b) => b.userMeta.ratings.overall - a.userMeta.ratings.overall)
      .slice(0, 5);

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
    const days = new Set<string>();
    items.forEach((item) => {
      if (item.userMeta?.watchedOn) days.add(item.userMeta.watchedOn);
      if (item.userMeta?.status === 'watched' && item.userMeta.lastUpdated) {
        days.add(new Date(item.userMeta.lastUpdated).toISOString().split('T')[0]);
      }
    });

    const sorted = [...days].sort();
    if (!sorted.length) return { streak: 0, longest: 0 };

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

    // Check if streak is current (today or yesterday)
    const lastDate = new Date(sorted[sorted.length - 1]);
    const today = new Date();
    const diffToToday = (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffToToday > 2) currentStreak = 0;

    return { streak: currentStreak, longest };
  }, [items]);

  // Calendar data for activity heatmap
  const calendar: CalendarDay[] = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((item) => {
      const date = item.userMeta?.watchedOn;
      if (!date) return;
      map[date] = (map[date] || 0) + 1;
    });

    const today = new Date();
    const days: CalendarDay[] = [];
    for (let i = 0; i < 120; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, count: map[key] || 0 });
    }
    return days.reverse();
  }, [items]);

  // Monthly watching habits
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    items.forEach((item) => {
      const date = item.userMeta?.watchedOn;
      if (!date) return;
      const key = date.slice(0, 7); // YYYY-MM
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12);
  }, [items]);

  // People analytics (directors & actors)
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
        .slice(0, 5),
      actors: Object.entries(actors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    };
  }, [items]);

  // Taste profile
  const tasteProfile = useMemo(() => {
    let drama = 0;
    let action = 0;
    let foreign = 0;

    items.forEach((item) => {
      if (item.Genre?.includes('Drama')) drama++;
      if (item.Genre?.includes('Action')) action++;
      if (item.Language && !item.Language.includes('English')) foreign++;
    });

    const total = items.length || 1;
    return [
      { label: 'Drama-leaning', value: Math.round((drama / total) * 100) },
      { label: 'Action-driven', value: Math.round((action / total) * 100) },
      { label: 'International', value: Math.round((foreign / total) * 100) },
    ];
  }, [items]);

  // Achievements
  const achievements = useMemo(() => {
    const watched = items.filter((i) => i.userMeta?.status === 'watched').length;
    const rewatches = items.reduce((a, b) => a + (b.userMeta?.rewatchCount || 0), 0);
    const rated = items.filter((i) => i.userMeta?.ratings?.overall > 0).length;

    return [
      { id: 'first_10', label: 'First 10 Watched', unlocked: watched >= 10 },
      { id: '50_club', label: '50 Titles Club', unlocked: watched >= 50 },
      { id: 'century', label: 'Century Viewer', unlocked: watched >= 100 },
      { id: 'rewatcher', label: 'Rewatcher', unlocked: rewatches >= 5 },
      { id: 'critic', label: 'Critic', unlocked: rated >= 20 },
      { id: 'binge_watcher', label: 'Binge Watcher', unlocked: streak.streak >= 7 },
    ];
  }, [items, streak]);

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

    if (diff >= 3 && diff < 7) return `You haven't watched anything in ${diff} days.`;
    if (diff >= 7) return "It's been a while. Ready to continue a series?";
    return null;
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
    reminder,
  };
}

// Series progress hook for individual series
export function useSeriesProgress(series: SeriesProgress | null | undefined) {
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

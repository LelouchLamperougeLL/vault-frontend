import { useState, useMemo, useCallback } from 'react';
import type { VaultItem, Filters, FilterOptions, SortBy, NavFilter } from '@/types';

export function useVaultFilters(items: VaultItem[]) {
  const [navFilter, setNavFilter] = useState<NavFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({ genre: [], director: [], actor: [], studio: [] });
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Extract filter options from items
  const filterOptions: FilterOptions = useMemo(() => {
    const genres = new Set<string>();
    const directors = new Set<string>();
    const actors = new Set<string>();
    const studios = new Set<string>();

    items.forEach((item) => {
      // Genres
      const itemGenres = Array.isArray(item.meta?.genre) 
        ? item.meta.genre 
        : item.Genre?.split(',').map(g => g.trim()) || [];
      itemGenres.forEach((g) => genres.add(g));

      // Directors
      const itemDirectors = Array.isArray(item.meta?.director) 
        ? item.meta.director 
        : item.meta?.director ? [item.meta.director] : [];
      itemDirectors.filter(Boolean).forEach((d) => directors.add(d));

      // Actors
      item.meta?.cast?.forEach((c) => {
        if (c?.name) actors.add(c.name);
      });

      // Studios (from production companies if available)
      if (item.tmdb?.credits?.production_companies) {
        item.tmdb.credits.production_companies.forEach((p: any) => {
          if (p.name) studios.add(p.name);
        });
      }
    });

    return {
      genres: [...genres].sort(),
      directors: [...directors].sort(),
      actors: [...actors].sort(),
      studios: [...studios].sort(),
    };
  }, [items]);

  // Apply all filters
  const filteredItems = useMemo(() => {
    let result = [...items];

    // 1. Navigation filter
    if (navFilter === 'watched') {
      result = result.filter((i) => i.userMeta.status === 'watched');
    } else if (navFilter === 'watchlist') {
      result = result.filter((i) => i.userMeta.status === 'watchlist');
    } else if (navFilter === 'top_rated') {
      result = result.filter((i) => i.userMeta?.ratings?.overall >= 9);
    } else if (navFilter === 'rewatch') {
      result = result.filter((i) => i.userMeta?.rewatchCount > 0);
    } else if (navFilter === 'foreign') {
      result = result.filter((i) => i.Language && !i.Language.includes('English'));
    } else if (navFilter === 'progress') {
      result = result.filter((i) => i.userMeta?.series?.lastEpisode?.season! > 0);
    } else if (navFilter === 'resume') {
      result = result.filter((item) => {
        if (item.Type !== 'series') return false;
        const series = item.meta?.series;
        if (!series?.seasons) return false;
        let watched = 0;
        let total = 0;
        series.seasons.forEach((s) => s.episodes.forEach((ep) => {
          total++;
          if (ep.watched) watched++;
        }));
        return watched > 0 && watched < total;
      });
    }

    // 2. Search filter (only if query is short)
    if (searchQuery && searchQuery.length < 3) {
      result = result.filter((i) => 
        i.Title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 3. Drawer filters
    result = result.filter((item) => {
      const itemGenres = Array.isArray(item.meta?.genre) 
        ? item.meta.genre 
        : item.Genre?.split(',').map(g => g.trim()) || [];
      const itemDirectors = Array.isArray(item.meta?.director) 
        ? item.meta.director 
        : item.meta?.director ? [item.meta.director] : [];

      const includes = (source: string[], target: string[]) => 
        target.length === 0 || target.some((t) => source.includes(t));

      return includes(itemGenres, filters.genre) && includes(itemDirectors, filters.director);
    });

    // 4. Sort
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.Title.localeCompare(b.Title);
      } else if (sortBy === 'year') {
        comparison = (parseInt(b.Year) || 0) - (parseInt(a.Year) || 0);
      } else if (sortBy === 'rating') {
        comparison = (b.userMeta?.ratings?.overall || 0) - (a.userMeta?.ratings?.overall || 0);
      } else {
        // updated
        comparison = (b.userMeta?.lastUpdated || 0) - (a.userMeta?.lastUpdated || 0);
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return result;
  }, [items, navFilter, searchQuery, filters, sortBy, sortOrder]);

  // Update filter helpers
  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ genre: [], director: [], actor: [], studio: [] });
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  return {
    navFilter,
    setNavFilter,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    sortBy,
    setSortBy,
    sortOrder,
    toggleSortOrder,
    filterOptions,
    filteredItems,
  };
}

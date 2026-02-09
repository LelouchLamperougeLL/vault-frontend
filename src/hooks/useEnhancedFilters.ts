import { useState, useMemo, useCallback } from 'react';
import type { VaultItem, Filters, FilterOptions, SortBy, NavFilter, CustomList } from '@/types';

export function useEnhancedFilters(items: VaultItem[], customLists: CustomList[]) {
  const [navFilter, setNavFilter] = useState<NavFilter>('all');
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({ 
    genre: [], 
    director: [], 
    actor: [], 
    studio: [], 
    year: [], 
    rating: [], 
    tag: [], 
    status: [] 
  });
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Extract filter options
  const filterOptions: FilterOptions = useMemo(() => {
    const genres = new Set<string>();
    const directors = new Set<string>();
    const actors = new Set<string>();
    const studios = new Set<string>();
    const years = new Set<string>();
    const ratings = new Set<string>();
    const tags = new Set<string>();

    items.forEach((item) => {
      const itemGenres = Array.isArray(item.meta?.genre) 
        ? item.meta.genre 
        : item.Genre?.split(',').map(g => g.trim()) || [];
      itemGenres.forEach((g) => genres.add(g));

      const itemDirectors = Array.isArray(item.meta?.director) 
        ? item.meta.director 
        : item.meta?.director ? [item.meta.director] : [];
      itemDirectors.filter(Boolean).forEach((d) => directors.add(d));

      item.meta?.cast?.forEach((c) => {
        if (c?.name) actors.add(c.name);
      });

      item.meta?.productionCompanies?.forEach((p) => {
        if (p) studios.add(p);
      });

      if (item.Year) years.add(item.Year);

      const rating = item.userMeta?.ratings?.overall;
      if (rating > 0) {
        const ratingRange = `${Math.floor(rating)}-${Math.floor(rating) + 1}`;
        ratings.add(ratingRange);
      }

      item.userMeta?.tags?.forEach((t) => tags.add(t));
    });

    return {
      genres: [...genres].sort(),
      directors: [...directors].sort(),
      actors: [...actors].sort(),
      studios: [...studios].sort(),
      years: [...years].sort().reverse(),
      ratings: [...ratings].sort(),
      tags: [...tags].sort(),
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
    } else if (navFilter === 'dropped') {
      result = result.filter((i) => i.userMeta.status === 'dropped');
    } else if (navFilter === 'on_hold') {
      result = result.filter((i) => i.userMeta.status === 'on_hold');
    } else if (navFilter === 'top_rated') {
      result = result.filter((i) => i.userMeta?.ratings?.overall >= 8);
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
    } else if (navFilter === 'favorites') {
      result = result.filter((i) => i.userMeta.favorite);
    } else if (navFilter === 'custom_list' && activeListId) {
      const list = customLists.find((l) => l.id === activeListId);
      if (list) {
        result = result.filter((i) => list.items.includes(i.imdbID));
      }
    }

    // 2. Search filter
    if (searchQuery.length >= 2) {
      const query = searchQuery.toLowerCase();
      result = result.filter((i) =>
        i.Title.toLowerCase().includes(query) ||
        i.meta?.director?.toLowerCase().includes(query) ||
        i.meta?.cast?.some((c) => c.name.toLowerCase().includes(query)) ||
        i.Genre?.toLowerCase().includes(query)
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
      const itemActors = item.meta?.cast?.map((c) => c.name) || [];
      const itemStudios = item.meta?.productionCompanies || [];
      const itemYear = item.Year;
      const itemRating = item.userMeta?.ratings?.overall;
      const itemTags = item.userMeta?.tags || [];
      const itemStatus = item.userMeta?.status;

      const includes = (source: string[], target: string[]) => 
        target.length === 0 || target.some((t) => source.includes(t));

      const ratingMatch = filters.rating.length === 0 || filters.rating.some((r) => {
        const [min, max] = r.split('-').map(Number);
        return itemRating >= min && itemRating < max;
      });

      const statusMatch = filters.status.length === 0 || filters.status.includes(itemStatus);

      return (
        includes(itemGenres, filters.genre) &&
        includes(itemDirectors, filters.director) &&
        includes(itemActors, filters.actor) &&
        includes(itemStudios, filters.studio) &&
        includes(itemYear ? [itemYear] : [], filters.year) &&
        includes(itemTags, filters.tag) &&
        ratingMatch &&
        statusMatch
      );
    });

    // 4. Sort
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.Title.localeCompare(b.Title);
          break;
        case 'year':
          comparison = (parseInt(b.Year) || 0) - (parseInt(a.Year) || 0);
          break;
        case 'rating':
          comparison = (b.userMeta?.ratings?.overall || 0) - (a.userMeta?.ratings?.overall || 0);
          break;
        case 'popularity':
          comparison = (parseFloat((b.imdbVotes || '').replace(/,/g, '')) || 0) - (parseFloat((a.imdbVotes || '').replace(/,/g, '')) || 0);
          break;
        case 'releaseDate':
          comparison = new Date(b.Released || 0).getTime() - new Date(a.Released || 0).getTime();
          break;
        case 'runtime':
          comparison = (parseInt(b.Runtime || '0') || 0) - (parseInt(a.Runtime || '0') || 0);
          break;
        default: // updated
          comparison = (b.userMeta?.lastUpdated || 0) - (a.userMeta?.lastUpdated || 0);
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return result;
  }, [items, navFilter, activeListId, customLists, searchQuery, filters, sortBy, sortOrder]);

  // Update filter helpers
  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ genre: [], director: [], actor: [], studio: [], year: [], rating: [], tag: [], status: [] });
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((arr) => arr.length > 0);
  }, [filters]);

  return {
    navFilter,
    setNavFilter,
    activeListId,
    setActiveListId,
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
    hasActiveFilters,
  };
}

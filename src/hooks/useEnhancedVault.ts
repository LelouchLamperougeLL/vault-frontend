import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { VaultItem, VaultData, Season, Episode, CustomList, ActivityItem } from '@/types';
import { supabase, syncToCloud, syncCustomLists, addActivity } from '@/lib/supabase';
import { findByIMDB, getMovieDetails, getTVDetails } from '@/lib/tmdb';

// API Keys
const DEFAULT_KEYS = {
  omdb: '5591108c',
  tmdb: '68b27c1f85725736f0aec18b903197b0',
  rapid: '9782bOaf7fmsh8b54c22e5cOaf5cp13e6e8jsn8e2e765657a5',
};

// Cache helpers
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

const cacheGet = (key: string): any | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const cacheSet = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    console.warn('Cache quota exceeded');
  }
};

// Normalize ratings
const normalizeRatings = (item: any) => {
  const ratings = {
    imdb: { rating: item.imdbRating, votes: item.imdbVotes },
    rotten: null as string | null,
    metacritic: null as string | null,
    tmdb: null as number | null,
  };
  item.Ratings?.forEach((r: any) => {
    if (r.Source === 'Rotten Tomatoes') ratings.rotten = r.Value;
    if (r.Source === 'Metacritic') ratings.metacritic = r.Value;
  });
  return ratings;
};

// Migrate item to enhanced format
const migrateItem = (item: any, status: 'watchlist' | 'watched' | 'dropped' | 'on_hold' = 'watchlist'): VaultItem => {
  const isSeries = item.Type === 'series';
  const oldRating = parseFloat(item.userRating || item.userMeta?.userRating || 0);

  return {
    ...item,
    meta: item.meta || {
      director: item.Director || '',
      genre: item.Genre?.split(',').map((g: string) => g.trim()) || [],
      cast: item.Actors ? item.Actors.split(',').map((a: string) => ({ name: a.trim(), character: null })) : [],
      series: isSeries ? { seasons: [] } : null,
      ratingsExternal: normalizeRatings(item),
      anime: null,
      asian: null,
      tvmaze: null,
      trailerKey: null,
      backdropPath: null,
      productionCompanies: [],
    },
    tmdb: item.tmdb || { id: null, credits: null, images: null, seasons: null, enriched: false, details: null },
    userMeta: {
      status: status || item.userMeta?.status || 'watchlist',
      userRating: oldRating,
      rewatchCount: item.userMeta?.rewatchCount || 0,
      series: isSeries ? (item.userMeta?.series || { lastEpisode: { season: 0, episode: 0 }, completed: false }) : null,
      ratings: item.userMeta?.ratings || { overall: oldRating, story: 0, direction: 0, emotion: 0, acting: 0, visuals: 0, sound: 0 },
      lastUpdated: item.userMeta?.lastUpdated || Date.now(),
      watchedOn: item.userMeta?.watchedOn || new Date().toISOString().split('T')[0],
      autoOverall: true,
      notes: item.userMeta?.notes || '',
      tags: item.userMeta?.tags || [],
      watchHistory: item.userMeta?.watchHistory || [],
      favorite: item.userMeta?.favorite || false,
      private: item.userMeta?.private || false,
    },
  };
};

export function useEnhancedVault() {
  const [vault, setVault] = useState<VaultData>({ watched: {}, watchlist: {}, dropped: {}, onHold: {} });
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState(DEFAULT_KEYS);
  const cloudQueue = useRef<Map<string, VaultItem>>(new Map());
  const cloudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      const savedKeys = localStorage.getItem('vault_v5_keys');
      if (savedKeys) setApiKeys(JSON.parse(savedKeys));

      const localData = localStorage.getItem('vault_v7_data');
      if (localData) {
        const parsed = JSON.parse(localData);
        const migrated: VaultData = { watched: {}, watchlist: {}, dropped: {}, onHold: {} };
        Object.entries(parsed.watched || {}).forEach(([id, item]) => {
          migrated.watched[id] = migrateItem(item, 'watched');
        });
        Object.entries(parsed.watchlist || {}).forEach(([id, item]) => {
          migrated.watchlist[id] = migrateItem(item, 'watchlist');
        });
        Object.entries(parsed.dropped || {}).forEach(([id, item]) => {
          migrated.dropped[id] = migrateItem(item, 'dropped');
        });
        Object.entries(parsed.onHold || {}).forEach(([id, item]) => {
          migrated.onHold[id] = migrateItem(item, 'on_hold');
        });
        setVault(migrated);
      }

      const savedLists = localStorage.getItem('vault_custom_lists');
      if (savedLists) setCustomLists(JSON.parse(savedLists));

      const savedActivities = localStorage.getItem('vault_activities');
      if (savedActivities) setActivities(JSON.parse(savedActivities));

      const { data } = await supabase.auth.getSession();
      setSession(data.session);

      const { data: authListener } = supabase.auth.onAuthStateChange((_, s) => {
        setSession(s);
      });

      setLoading(false);

      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    loadData();
  }, []);

  // Cloud sync throttle
  const saveToCloudThrottled = useCallback((id: string, item: VaultItem) => {
    if (!session?.user) return;
    cloudQueue.current.set(id, item);
    if (cloudTimer.current) clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(async () => {
      const batch: Record<string, VaultItem> = {};
      cloudQueue.current.forEach((val, key) => { batch[key] = val; });
      cloudQueue.current.clear();
      try {
        await syncToCloud(batch, session.user.id);
      } catch (err) {
        console.error('Cloud sync failed:', err);
      }
    }, 2000);
  }, [session]);

  const persistVault = useCallback((newVault: VaultData) => {
    localStorage.setItem('vault_v7_data', JSON.stringify(newVault));
  }, []);

  const persistLists = useCallback((lists: CustomList[]) => {
    localStorage.setItem('vault_custom_lists', JSON.stringify(lists));
    if (session?.user) {
      syncCustomLists(lists, session.user.id).catch(console.error);
    }
  }, [session]);

  const addActivityItem = useCallback((activity: ActivityItem) => {
    setActivities((prev) => {
      const next = [activity, ...prev].slice(0, 100);
      localStorage.setItem('vault_activities', JSON.stringify(next));
      return next;
    });
    if (session?.user) {
      addActivity(activity, session.user.id).catch(console.error);
    }
  }, [session]);

  // Search OMDB
  const searchOMDB = useCallback(async (query: string): Promise<any[]> => {
    const cacheKey = `omdb_search_${query.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = cacheGet(cacheKey);
    if (cached) return cached;

    const res = await fetch(`https://www.omdbapi.com/?apikey=${apiKeys.omdb}&s=${encodeURIComponent(query)}`);
    const json = await res.json();
    const results = json.Search || [];
    cacheSet(cacheKey, results);
    return results;
  }, [apiKeys]);

  // Fetch and enrich with TMDB
  const fetchItemDetails = useCallback(async (imdbID: string): Promise<VaultItem | null> => {
    const cacheKey = `vault_item_${imdbID}`;
    const cached = cacheGet(cacheKey);
    if (cached) return migrateItem(cached);

    // Fetch from OMDB
    const omdbRes = await fetch(`https://www.omdbapi.com/?apikey=${apiKeys.omdb}&i=${imdbID}&plot=full`);
    const omdbData = await omdbRes.json();
    if (omdbData.Response !== 'True') return null;

    // Find TMDB ID
    const tmdbFind = await findByIMDB(imdbID);
    const tmdbItem = tmdbFind.movie_results?.[0] || tmdbFind.tv_results?.[0];
    
    let tmdbDetails = null;
    let trailerKey = null;
    let backdropPath = null;
    let productionCompanies: string[] = [];

    if (tmdbItem) {
      const isTV = !!tmdbFind.tv_results?.[0];
      tmdbDetails = isTV ? await getTVDetails(tmdbItem.id) : await getMovieDetails(tmdbItem.id);
      
      if (tmdbDetails) {
        trailerKey = tmdbDetails.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key || null;
        backdropPath = tmdbDetails.backdrop_path;
        productionCompanies = tmdbDetails.production_companies?.map((p: any) => p.name) || [];
      }
    }

    const item = migrateItem(omdbData);
    
    if (tmdbItem && tmdbDetails) {
      item.tmdb = {
        id: tmdbItem.id,
        credits: tmdbDetails,
        images: tmdbDetails.images,
        seasons: tmdbDetails.seasons,
        enriched: true,
        details: tmdbDetails,
      };
      item.meta.trailerKey = trailerKey;
      item.meta.backdropPath = backdropPath;
      item.meta.productionCompanies = productionCompanies;
      item.meta.cast = tmdbDetails.credits?.cast?.slice(0, 10).map((c: any) => ({
        name: c.name,
        character: c.character,
        profilePath: c.profile_path,
        id: c.id,
      })) || item.meta.cast;
    }

    cacheSet(cacheKey, item);
    return item;
  }, [apiKeys]);

  // Add to vault
  const addToVault = useCallback(async (imdbID: string, status: 'watchlist' | 'watched' | 'dropped' | 'on_hold' = 'watchlist') => {
    const item = await fetchItemDetails(imdbID);
    if (!item) return false;

    const newItem = { ...item, userMeta: { ...item.userMeta, status } };

    setVault((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        delete (next as any)[key][imdbID];
      });
      (next as any)[status === 'on_hold' ? 'onHold' : status === 'watchlist' ? 'watchlist' : status][imdbID] = newItem;
      persistVault(next);
      saveToCloudThrottled(imdbID, newItem);
      return next;
    });

    addActivityItem({
      id: `add_${Date.now()}`,
      type: 'added',
      item: newItem,
      timestamp: Date.now(),
    });

    return true;
  }, [fetchItemDetails, persistVault, saveToCloudThrottled, addActivityItem]);

  // Update status
  const updateStatus = useCallback((imdbID: string, status: 'watchlist' | 'watched' | 'dropped' | 'on_hold') => {
    setVault((prev) => {
      let item = prev.watched[imdbID] || prev.watchlist[imdbID] || prev.dropped[imdbID] || prev.onHold[imdbID];
      if (!item) return prev;

      const updatedItem = { ...item, userMeta: { ...item.userMeta, status, lastUpdated: Date.now() } };

      const next = { watched: { ...prev.watched }, watchlist: { ...prev.watchlist }, dropped: { ...prev.dropped }, onHold: { ...prev.onHold } };
      Object.keys(next).forEach((key) => {
        delete (next as any)[key][imdbID];
      });
      (next as any)[status === 'on_hold' ? 'onHold' : status === 'watchlist' ? 'watchlist' : status][imdbID] = updatedItem;

      persistVault(next);
      saveToCloudThrottled(imdbID, updatedItem);
      return next;
    });
  }, [persistVault, saveToCloudThrottled]);

  // Update rating
  const updateRating = useCallback((imdbID: string, rating: number) => {
    setVault((prev) => {
      const item = prev.watched[imdbID] || prev.watchlist[imdbID] || prev.dropped[imdbID] || prev.onHold[imdbID];
      if (!item) return prev;

      const updatedItem = {
        ...item,
        userMeta: {
          ...item.userMeta,
          userRating: rating,
          ratings: { ...item.userMeta.ratings, overall: rating },
          lastUpdated: Date.now(),
        },
      };

      const next = { ...prev };
      const category = item.userMeta.status === 'on_hold' ? 'onHold' : item.userMeta.status;
      (next as any)[category][imdbID] = updatedItem;

      persistVault(next);
      saveToCloudThrottled(imdbID, updatedItem);
      return next;
    });
  }, [persistVault, saveToCloudThrottled]);

  // Toggle favorite
  const toggleFavorite = useCallback((imdbID: string) => {
    setVault((prev) => {
      const item = prev.watched[imdbID] || prev.watchlist[imdbID] || prev.dropped[imdbID] || prev.onHold[imdbID];
      if (!item) return prev;

      const updatedItem = {
        ...item,
        userMeta: { ...item.userMeta, favorite: !item.userMeta.favorite, lastUpdated: Date.now() },
      };

      const next = { ...prev };
      const category = item.userMeta.status === 'on_hold' ? 'onHold' : item.userMeta.status;
      (next as any)[category][imdbID] = updatedItem;

      persistVault(next);
      saveToCloudThrottled(imdbID, updatedItem);
      return next;
    });
  }, [persistVault, saveToCloudThrottled]);

  // Mark episode
  const markEpisode = useCallback((imdbID: string, season: number, episode: number, watched: boolean = true) => {
    setVault((prev) => {
      const item = prev.watched[imdbID] || prev.watchlist[imdbID] || prev.dropped[imdbID] || prev.onHold[imdbID];
      if (!item || !item.meta.series) return prev;

      const updatedItem = JSON.parse(JSON.stringify(item)) as VaultItem;
      const seasonData = updatedItem.meta.series!.seasons.find((s: Season) => s.season === season);

      if (seasonData) {
        const ep = seasonData.episodes.find((e: Episode) => e.episode === episode);
        if (ep) {
          ep.watched = watched;
          if (watched) {
            if (!updatedItem.userMeta.series) updatedItem.userMeta.series = { lastEpisode: { season: 0, episode: 0 }, completed: false };
            updatedItem.userMeta.series.lastEpisode = { season, episode };
            updatedItem.userMeta.watchedOn = new Date().toISOString().split('T')[0];
          }
        }
      }

      updatedItem.userMeta.lastUpdated = Date.now();

      const next = { ...prev };
      const category = item.userMeta.status === 'on_hold' ? 'onHold' : item.userMeta.status;
      (next as any)[category][imdbID] = updatedItem;

      persistVault(next);
      saveToCloudThrottled(imdbID, updatedItem);
      return next;
    });
  }, [persistVault, saveToCloudThrottled]);

  // Add tag
  const addTag = useCallback((imdbID: string, tag: string) => {
    setVault((prev) => {
      const item = prev.watched[imdbID] || prev.watchlist[imdbID] || prev.dropped[imdbID] || prev.onHold[imdbID];
      if (!item) return prev;

      const updatedItem = {
        ...item,
        userMeta: { ...item.userMeta, tags: [...item.userMeta.tags, tag], lastUpdated: Date.now() },
      };

      const next = { ...prev };
      const category = item.userMeta.status === 'on_hold' ? 'onHold' : item.userMeta.status;
      (next as any)[category][imdbID] = updatedItem;

      persistVault(next);
      saveToCloudThrottled(imdbID, updatedItem);
      return next;
    });
  }, [persistVault, saveToCloudThrottled]);

  // Remove tag
  const removeTag = useCallback((imdbID: string, tag: string) => {
    setVault((prev) => {
      const item = prev.watched[imdbID] || prev.watchlist[imdbID] || prev.dropped[imdbID] || prev.onHold[imdbID];
      if (!item) return prev;

      const updatedItem = {
        ...item,
        userMeta: { ...item.userMeta, tags: item.userMeta.tags.filter((t) => t !== tag), lastUpdated: Date.now() },
      };

      const next = { ...prev };
      const category = item.userMeta.status === 'on_hold' ? 'onHold' : item.userMeta.status;
      (next as any)[category][imdbID] = updatedItem;

      persistVault(next);
      saveToCloudThrottled(imdbID, updatedItem);
      return next;
    });
  }, [persistVault, saveToCloudThrottled]);

  // Create custom list
  const createCustomList = useCallback((name: string, description: string = '', color: string = '#6366f1') => {
    const newList: CustomList = {
      id: `list_${Date.now()}`,
      name,
      description,
      items: [],
      color,
      icon: 'list',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setCustomLists((prev) => {
      const next = [...prev, newList];
      persistLists(next);
      return next;
    });
    return newList.id;
  }, [persistLists]);

  // Add to custom list
  const addToCustomList = useCallback((listId: string, imdbID: string) => {
    setCustomLists((prev) => {
      const next = prev.map((list) =>
        list.id === listId && !list.items.includes(imdbID)
          ? { ...list, items: [...list.items, imdbID], updatedAt: Date.now() }
          : list
      );
      persistLists(next);
      return next;
    });
  }, [persistLists]);

  // Remove from custom list
  const removeFromCustomList = useCallback((listId: string, imdbID: string) => {
    setCustomLists((prev) => {
      const next = prev.map((list) =>
        list.id === listId
          ? { ...list, items: list.items.filter((id) => id !== imdbID), updatedAt: Date.now() }
          : list
      );
      persistLists(next);
      return next;
    });
  }, [persistLists]);

  // Delete custom list
  const deleteCustomList = useCallback((listId: string) => {
    setCustomLists((prev) => {
      const next = prev.filter((list) => list.id !== listId);
      persistLists(next);
      return next;
    });
  }, [persistLists]);

  // Remove from vault
  const removeFromVault = useCallback((imdbID: string) => {
    setVault((prev) => {
      const next = { watched: { ...prev.watched }, watchlist: { ...prev.watchlist }, dropped: { ...prev.dropped }, onHold: { ...prev.onHold } };
      delete next.watched[imdbID];
      delete next.watchlist[imdbID];
      delete next.dropped[imdbID];
      delete next.onHold[imdbID];
      persistVault(next);
      return next;
    });
  }, [persistVault]);

  // Export vault
  const exportVault = useCallback(() => {
    const data = JSON.stringify({ vault, customLists, activities }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vault_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [vault, customLists, activities]);

  // Import vault
  const importVault = useCallback(async (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.vault) {
        setVault(parsed.vault);
        persistVault(parsed.vault);
      }
      if (parsed.customLists) {
        setCustomLists(parsed.customLists);
        persistLists(parsed.customLists);
      }
      if (parsed.activities) {
        setActivities(parsed.activities);
        localStorage.setItem('vault_activities', JSON.stringify(parsed.activities));
      }
      return true;
    } catch {
      return false;
    }
  }, [persistVault, persistLists]);

  // Get all items
  const allItems = useMemo(() => {
    return [
      ...Object.values(vault.watched),
      ...Object.values(vault.watchlist),
      ...Object.values(vault.dropped),
      ...Object.values(vault.onHold),
    ];
  }, [vault]);

  // Get recommendations
  const getRecommendations = useCallback(async (item: VaultItem): Promise<any[]> => {
    if (!item.tmdb?.id) return [];
    const type = item.Type === 'series' ? 'tv' : 'movie';
    try {
      const { getRecommendations: getTMDBRecommendations } = await import('@/lib/tmdb');
      return await getTMDBRecommendations(item.tmdb.id, type);
    } catch {
      return [];
    }
  }, []);

  return {
    vault,
    customLists,
    activities,
    session,
    loading,
    apiKeys,
    allItems,
    searchOMDB,
    addToVault,
    updateStatus,
    updateRating,
    toggleFavorite,
    markEpisode,
    addTag,
    removeTag,
    createCustomList,
    addToCustomList,
    removeFromCustomList,
    deleteCustomList,
    removeFromVault,
    exportVault,
    importVault,
    getRecommendations,
    setApiKeys: (keys: typeof DEFAULT_KEYS) => {
      setApiKeys(keys);
      localStorage.setItem('vault_v5_keys', JSON.stringify(keys));
    },
  };
}

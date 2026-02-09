import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { VaultItem, VaultData, Season, Episode } from '@/types';
import { supabase, isAdmin, syncToCloud } from '@/lib/supabase';

// API Keys
const DEFAULT_KEYS = {
  omdb: '5591108c',
  tmdb: '68b27c1f85725736f0aec18b903197b0',
  rapid: '9782bOaf7fmsh8b54c22e5cOaf5cp13e6e8jsn8e2e765657a5',
};

// Cache helpers
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

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

const normalizeRatings = (item: any) => {
  const ratings = {
    imdb: { rating: item.imdbRating, votes: item.imdbVotes },
    rotten: null as string | null,
    metacritic: null as string | null,
  };
  item.Ratings?.forEach((r: any) => {
    if (r.Source === 'Rotten Tomatoes') ratings.rotten = r.Value;
    if (r.Source === 'Metacritic') ratings.metacritic = r.Value;
  });
  return ratings;
};

const migrateItem = (item: any, status: 'watchlist' | 'watched' = 'watchlist'): VaultItem => {
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
    },
    tmdb: item.tmdb || { id: null, credits: null, images: null, seasons: null, enriched: false },
    userMeta: {
      status: status || item.userMeta?.status || 'watchlist',
      userRating: oldRating,
      rewatchCount: item.userMeta?.rewatchCount || 0,
      series: isSeries ? (item.userMeta?.series || { lastEpisode: { season: 0, episode: 0 }, completed: false }) : null,
      ratings: item.userMeta?.ratings || { overall: oldRating, story: 0, direction: 0, emotion: 0 },
      lastUpdated: item.userMeta?.lastUpdated || Date.now(),
      watchedOn: item.userMeta?.watchedOn || new Date().toISOString().split('T')[0],
      autoOverall: true,
      notes: item.userMeta?.notes || '',
    },
  };
};

export function useVault() {
  const [vault, setVault] = useState<VaultData>({ watched: {}, watchlist: {} });
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState(DEFAULT_KEYS);
  const cloudQueue = useRef<Map<string, VaultItem>>(new Map());
  const cloudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      // Load API keys
      const savedKeys = localStorage.getItem('vault_v5_keys');
      if (savedKeys) {
        setApiKeys(JSON.parse(savedKeys));
      }

      // Load local vault data
      const localData = localStorage.getItem('vault_v6_data');
      if (localData) {
        const parsed = JSON.parse(localData);
        // Migrate items if needed
        const migrated: VaultData = { watched: {}, watchlist: {} };
        Object.entries(parsed.watched || {}).forEach(([id, item]) => {
          migrated.watched[id] = migrateItem(item, 'watched');
        });
        Object.entries(parsed.watchlist || {}).forEach(([id, item]) => {
          migrated.watchlist[id] = migrateItem(item, 'watchlist');
        });
        setVault(migrated);
      }

      // Check session
      const { data } = await supabase.auth.getSession();
      setSession(data.session);

      // Subscribe to auth changes
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
      cloudQueue.current.forEach((val, key) => {
        batch[key] = val;
      });
      cloudQueue.current.clear();

      try {
        await syncToCloud(batch, session.user.id);
      } catch (err) {
        console.error('Cloud sync failed:', err);
      }
    }, 2000);
  }, [session]);

  // Persist vault to localStorage
  const persistVault = useCallback((newVault: VaultData) => {
    localStorage.setItem('vault_v6_data', JSON.stringify(newVault));
  }, []);

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

  // Fetch full item details from OMDB
  const fetchItemDetails = useCallback(async (imdbID: string): Promise<VaultItem | null> => {
    const cacheKey = `omdb_detail_${imdbID}`;
    const cached = cacheGet(cacheKey);
    if (cached) return migrateItem(cached);

    const res = await fetch(`https://www.omdbapi.com/?apikey=${apiKeys.omdb}&i=${imdbID}&plot=full`);
    const json = await res.json();

    if (json.Response !== 'True') return null;

    cacheSet(cacheKey, json);
    return migrateItem(json);
  }, [apiKeys]);

  // Add item to vault
  const addToVault = useCallback(async (imdbID: string, status: 'watchlist' | 'watched' = 'watchlist') => {
    const item = await fetchItemDetails(imdbID);
    if (!item) return false;

    const newItem = { ...item, userMeta: { ...item.userMeta, status } };

    setVault((prev) => {
      const next = {
        watched: { ...prev.watched },
        watchlist: { ...prev.watchlist },
      };

      if (status === 'watched') {
        next.watched[imdbID] = newItem;
        delete next.watchlist[imdbID];
      } else {
        next.watchlist[imdbID] = newItem;
        delete next.watched[imdbID];
      }

      persistVault(next);
      saveToCloudThrottled(imdbID, newItem);
      return next;
    });

    return true;
  }, [fetchItemDetails, persistVault, saveToCloudThrottled]);

  // Update item status
  const updateStatus = useCallback((imdbID: string, status: 'watchlist' | 'watched') => {
    setVault((prev) => {
      const item = prev.watched[imdbID] || prev.watchlist[imdbID];
      if (!item) return prev;

      const updatedItem = {
        ...item,
        userMeta: {
          ...item.userMeta,
          status,
          lastUpdated: Date.now(),
        },
      };

      const next = {
        watched: { ...prev.watched },
        watchlist: { ...prev.watchlist },
      };

      if (status === 'watched') {
        next.watched[imdbID] = updatedItem;
        delete next.watchlist[imdbID];
      } else {
        next.watchlist[imdbID] = updatedItem;
        delete next.watched[imdbID];
      }

      persistVault(next);
      saveToCloudThrottled(imdbID, updatedItem);
      return next;
    });
  }, [persistVault, saveToCloudThrottled]);

  // Update rating
  const updateRating = useCallback((imdbID: string, rating: number) => {
    setVault((prev) => {
      const item = prev.watched[imdbID] || prev.watchlist[imdbID];
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

      const next = {
        watched: { ...prev.watched },
        watchlist: { ...prev.watchlist },
      };

      if (item.userMeta.status === 'watched') {
        next.watched[imdbID] = updatedItem;
      } else {
        next.watchlist[imdbID] = updatedItem;
      }

      persistVault(next);
      saveToCloudThrottled(imdbID, updatedItem);
      return next;
    });
  }, [persistVault, saveToCloudThrottled]);

  // Mark episode as watched
  const markEpisode = useCallback((imdbID: string, season: number, episode: number, watched: boolean = true) => {
    setVault((prev) => {
      const item = prev.watched[imdbID] || prev.watchlist[imdbID];
      if (!item || !item.meta.series) return prev;

      const updatedItem = JSON.parse(JSON.stringify(item)) as VaultItem;
      const seasonData = updatedItem.meta.series!.seasons.find((s: Season) => s.season === season);

      if (seasonData) {
        const ep = seasonData.episodes.find((e: Episode) => e.episode === episode);
        if (ep) {
          ep.watched = watched;

          if (watched) {
            updatedItem.userMeta.series = {
              lastEpisode: { season, episode },
              completed: false,
            };
            updatedItem.userMeta.watchedOn = new Date().toISOString().split('T')[0];
          }
        }
      }

      updatedItem.userMeta.lastUpdated = Date.now();

      const next = {
        watched: { ...prev.watched },
        watchlist: { ...prev.watchlist },
      };

      if (item.userMeta.status === 'watched') {
        next.watched[imdbID] = updatedItem;
      } else {
        next.watchlist[imdbID] = updatedItem;
      }

      persistVault(next);
      saveToCloudThrottled(imdbID, updatedItem);
      return next;
    });
  }, [persistVault, saveToCloudThrottled]);

  // Initialize series seasons
  const initSeriesSeasons = useCallback((imdbID: string, totalSeasons: number, episodesPerSeason: number = 10) => {
    setVault((prev) => {
      const item = prev.watched[imdbID] || prev.watchlist[imdbID];
      if (!item) return prev;

      const seasons: Season[] = [];
      for (let s = 1; s <= totalSeasons; s++) {
        const episodes: Episode[] = [];
        for (let e = 1; e <= episodesPerSeason; e++) {
          episodes.push({ episode: e, watched: false });
        }
        seasons.push({ season: s, episodes });
      }

      const updatedItem = {
        ...item,
        meta: {
          ...item.meta,
          series: { seasons },
        },
      };

      const next = {
        watched: { ...prev.watched },
        watchlist: { ...prev.watchlist },
      };

      if (item.userMeta.status === 'watched') {
        next.watched[imdbID] = updatedItem;
      } else {
        next.watchlist[imdbID] = updatedItem;
      }

      persistVault(next);
      saveToCloudThrottled(imdbID, updatedItem);
      return next;
    });
  }, [persistVault, saveToCloudThrottled]);

  // Remove item from vault
  const removeFromVault = useCallback((imdbID: string) => {
    setVault((prev) => {
      const next = {
        watched: { ...prev.watched },
        watchlist: { ...prev.watchlist },
      };
      delete next.watched[imdbID];
      delete next.watchlist[imdbID];

      persistVault(next);
      return next;
    });
  }, [persistVault]);

  // Export vault data
  const exportVault = useCallback(() => {
    const data = JSON.stringify(vault, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vault_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [vault]);

  // Import vault data
  const importVault = useCallback(async (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.watched && parsed.watchlist) {
        setVault(parsed);
        persistVault(parsed);

        // Sync to cloud if logged in
        if (session?.user) {
          const allItems = { ...parsed.watched, ...parsed.watchlist };
          await syncToCloud(allItems, session.user.id);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [persistVault, session]);

  // Get all items as array
  const allItems = useMemo(() => {
    return [...Object.values(vault.watched), ...Object.values(vault.watchlist)];
  }, [vault]);

  // Check if user is admin
  const userIsAdmin = useMemo(() => {
    return isAdmin(session?.user?.id);
  }, [session]);

  return {
    vault,
    session,
    loading,
    apiKeys,
    allItems,
    userIsAdmin,
    searchOMDB,
    addToVault,
    updateStatus,
    updateRating,
    markEpisode,
    initSeriesSeasons,
    removeFromVault,
    exportVault,
    importVault,
    setApiKeys: (keys: typeof DEFAULT_KEYS) => {
      setApiKeys(keys);
      localStorage.setItem('vault_v5_keys', JSON.stringify(keys));
    },
  };
}

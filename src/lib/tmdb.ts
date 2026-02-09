import type { TMDBItem, TMDBDetails } from '@/types';

const TMDB_API_KEY = '68b27c1f85725736f0aec18b903197b0';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Cache for TMDB requests
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const getCached = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCached = <T>(key: string, data: T) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Fetch with error handling
const fetchTMDB = async (endpoint: string, params: Record<string, string> = {}) => {
  const queryParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    ...params,
  });
  
  const url = `${TMDB_BASE_URL}${endpoint}?${queryParams}`;
  const cacheKey = url;
  
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
    const data = await response.json();
    setCached(cacheKey, data);
    return data;
  } catch (error) {
    console.error('TMDB fetch error:', error);
    throw error;
  }
};

// Image URLs
export const getImageUrl = (path: string | null, size: string = 'w500') => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const getBackdropUrl = (path: string | null, size: string = 'w1280') => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const getPosterUrl = (path: string | null, size: string = 'w500') => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

// Search
export const searchTMDB = async (query: string, type: 'movie' | 'tv' | 'multi' = 'multi'): Promise<TMDBItem[]> => {
  const data = await fetchTMDB(`/search/${type}`, { query, include_adult: 'false' });
  return data.results || [];
};

// Get details
export const getMovieDetails = async (id: number): Promise<TMDBDetails> => {
  return fetchTMDB(`/movie/${id}`, {
    append_to_response: 'credits,videos,images,similar,recommendations',
    include_image_language: 'en,null',
  });
};

export const getTVDetails = async (id: number): Promise<TMDBDetails> => {
  return fetchTMDB(`/tv/${id}`, {
    append_to_response: 'credits,videos,images,similar,recommendations',
    include_image_language: 'en,null',
  });
};

// Find by IMDB ID
export const findByIMDB = async (imdbId: string): Promise<{ movie_results: TMDBItem[]; tv_results: TMDBItem[] }> => {
  return fetchTMDB(`/find/${imdbId}`, { external_source: 'imdb_id' });
};

// Get trending
export const getTrending = async (type: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week'): Promise<TMDBItem[]> => {
  const data = await fetchTMDB(`/trending/${type}/${timeWindow}`);
  return data.results || [];
};

// Get popular
export const getPopular = async (type: 'movie' | 'tv' = 'movie'): Promise<TMDBItem[]> => {
  const data = await fetchTMDB(`/${type}/popular`);
  return data.results || [];
};

// Get top rated
export const getTopRated = async (type: 'movie' | 'tv' = 'movie'): Promise<TMDBItem[]> => {
  const data = await fetchTMDB(`/${type}/top_rated`);
  return data.results || [];
};

// Discover by genre
export const discoverByGenre = async (
  type: 'movie' | 'tv' = 'movie',
  genreId: number,
  sortBy: string = 'popularity.desc'
): Promise<TMDBItem[]> => {
  const data = await fetchTMDB(`/discover/${type}`, {
    with_genres: genreId.toString(),
    sort_by: sortBy,
    include_adult: 'false',
  });
  return data.results || [];
};

// Get trailer
export const getTrailer = (details: TMDBDetails): string | null => {
  if (!details.videos?.results) return null;
  const trailer = details.videos.results.find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube'
  );
  return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
};

// Genre mappings
export const GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

// Mood-based genre recommendations
export const MOOD_GENRES: Record<string, number[]> = {
  happy: [35, 10751, 10402], // Comedy, Family, Music
  sad: [18, 10749], // Drama, Romance
  excited: [28, 12, 878], // Action, Adventure, Sci-Fi
  relaxed: [99, 10767, 35], // Documentary, Talk, Comedy
  scared: [27, 53, 9648], // Horror, Thriller, Mystery
  romantic: [10749, 18, 35], // Romance, Drama, Comedy
  adventurous: [12, 28, 878], // Adventure, Action, Sci-Fi
  thoughtful: [99, 18, 36], // Documentary, Drama, History
};

// Get recommendations based on item
export const getRecommendations = async (id: number, type: 'movie' | 'tv' = 'movie'): Promise<TMDBItem[]> => {
  const data = await fetchTMDB(`/${type}/${id}/recommendations`);
  return data.results || [];
};

// Get similar
export const getSimilar = async (id: number, type: 'movie' | 'tv' = 'movie'): Promise<TMDBItem[]> => {
  const data = await fetchTMDB(`/${type}/${id}/similar`);
  return data.results || [];
};

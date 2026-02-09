// The Vault - Type Definitions

export interface OMDBItem {
  imdbID: string;
  Title: string;
  Year: string;
  Type: 'movie' | 'series' | 'episode';
  Poster: string;
  Plot?: string;
  Genre?: string;
  Director?: string;
  Actors?: string;
  Runtime?: string;
  Rated?: string;
  Language?: string;
  Country?: string;
  imdbRating?: string;
  imdbVotes?: string;
  Ratings?: { Source: string; Value: string }[];
  totalSeasons?: string;
  Released?: string;
  Writer?: string;
  Awards?: string;
  Metascore?: string;
}

export interface Episode {
  episode: number;
  title?: string;
  airDate?: string;
  watched: boolean;
}

export interface Season {
  season: number;
  episodes: Episode[];
}

export interface SeriesProgress {
  seasons: Season[];
}

export interface UserRatings {
  overall: number;
  story: number;
  direction: number;
  emotion: number;
}

export interface UserMeta {
  status: 'watchlist' | 'watched' | 'progress';
  userRating: number;
  rewatchCount: number;
  series: {
    lastEpisode: { season: number; episode: number };
    completed: boolean;
  } | null;
  ratings: UserRatings;
  lastUpdated: number;
  watchedOn: string;
  autoOverall: boolean;
  notes: string;
}

export interface MetaData {
  director: string;
  genre: string[];
  cast: { name: string; character: string | null }[];
  series: SeriesProgress | null;
  ratingsExternal: {
    imdb: { rating?: string; votes?: string };
    rotten: string | null;
    metacritic: string | null;
  };
  anime: any | null;
  asian: any | null;
  tvmaze: any | null;
}

export interface TMDBData {
  id: number | null;
  credits: any | null;
  images: any | null;
  seasons: any | null;
  enriched: boolean;
}

export interface VaultItem extends OMDBItem {
  userMeta: UserMeta;
  meta: MetaData;
  tmdb: TMDBData;
}

export interface VaultData {
  watched: Record<string, VaultItem>;
  watchlist: Record<string, VaultItem>;
}

export interface FilterOptions {
  genres: string[];
  directors: string[];
  actors: string[];
  studios: string[];
}

export interface Filters {
  genre: string[];
  director: string[];
  actor: string[];
  studio: string[];
}

export interface VaultStats {
  total: number;
  watched: number;
  progress: number;
  avgRating: string;
  byGenre: Record<string, number>;
  byYear: Record<string, number>;
  byLanguage: Record<string, number>;
  topRated: VaultItem[];
  rewatchCount: number;
}

export interface Achievement {
  id: string;
  label: string;
  unlocked: boolean;
  icon: string;
}

export interface StreakData {
  streak: number;
  longest: number;
}

export interface CalendarDay {
  date: string;
  count: number;
}

export type ViewMode = 'grid' | 'list';
export type SortBy = 'updated' | 'name' | 'year' | 'rating';
export type NavFilter = 'all' | 'watched' | 'watchlist' | 'progress' | 'resume' | 'top_rated' | 'rewatch' | 'foreign' | 'analytics';

export interface SmartList {
  id: NavFilter;
  label: string;
  icon: string;
  filter: (item: VaultItem) => boolean;
}

export interface UserSession {
  user: {
    id: string;
    email: string;
  };
}

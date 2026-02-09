// The Vault - Enhanced Type Definitions

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

export interface TMDBItem {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type?: 'movie' | 'tv';
}

export interface TMDBDetails {
  id: number;
  genres: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status: string;
  tagline: string;
  production_companies: { id: number; name: string; logo_path: string | null }[];
  backdrop_path?: string | null;
  poster_path?: string | null;
  seasons?: { season_number: number; episode_count: number; name: string }[];
  videos?: { results: { key: string; name: string; type: string; site: string }[] };
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null; order: number }[];
    crew: { id: number; name: string; job: string; department: string }[];
  };
  images?: {
    backdrops: { file_path: string; width: number; height: number }[];
    posters: { file_path: string; width: number; height: number }[];
  };
  similar?: { results: TMDBItem[] };
  recommendations?: { results: TMDBItem[] };
}

export interface Episode {
  episode: number;
  title?: string;
  airDate?: string;
  watched: boolean;
  rating?: number;
  notes?: string;
}

export interface Season {
  season: number;
  title?: string;
  overview?: string;
  posterPath?: string;
  airDate?: string;
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
  acting: number;
  visuals: number;
  sound: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface WatchEntry {
  date: string;
  rating?: number;
  notes?: string;
  rewatch: boolean;
}

export interface UserMeta {
  status: 'watchlist' | 'watched' | 'progress' | 'dropped' | 'on_hold';
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
  tags: string[];
  watchHistory: WatchEntry[];
  favorite: boolean;
  private: boolean;
}

export interface MetaData {
  director: string;
  genre: string[];
  cast: { name: string; character: string | null; profilePath?: string | null; id?: number }[];
  series: SeriesProgress | null;
  ratingsExternal: {
    imdb: { rating?: string; votes?: string };
    rotten: string | null;
    metacritic: string | null;
    tmdb?: number;
  };
  anime: any | null;
  asian: any | null;
  tvmaze: any | null;
  trailerKey?: string | null;
  backdropPath?: string | null;
  productionCompanies: string[];
  budget?: number;
  revenue?: number;
  homepage?: string;
}

export interface TMDBData {
  id: number | null;
  credits: TMDBDetails | null;
  images: any | null;
  seasons: any | null;
  enriched: boolean;
  details?: TMDBDetails | null;
}

export interface VaultItem extends OMDBItem {
  userMeta: UserMeta;
  meta: MetaData;
  tmdb: TMDBData;
}

export interface VaultData {
  watched: Record<string, VaultItem>;
  watchlist: Record<string, VaultItem>;
  dropped: Record<string, VaultItem>;
  onHold: Record<string, VaultItem>;
}

export interface CustomList {
  id: string;
  name: string;
  description: string;
  items: string[];
  color: string;
  icon: string;
  createdAt: number;
  updatedAt: number;
}

export interface FilterOptions {
  genres: string[];
  directors: string[];
  actors: string[];
  studios: string[];
  years: string[];
  ratings: string[];
  tags: string[];
}

export interface Filters {
  genre: string[];
  director: string[];
  actor: string[];
  studio: string[];
  year: string[];
  rating: string[];
  tag: string[];
  status: ('watchlist' | 'watched' | 'progress' | 'dropped' | 'on_hold')[];
}

export interface VaultStats {
  total: number;
  watched: number;
  watchlist: number;
  progress: number;
  dropped: number;
  onHold: number;
  avgRating: string;
  byGenre: Record<string, number>;
  byYear: Record<string, number>;
  byLanguage: Record<string, number>;
  byStudio: Record<string, number>;
  topRated: VaultItem[];
  rewatchCount: number;
  totalWatchTime: number;
  favoriteCount: number;
}

export interface Achievement {
  id: string;
  label: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  progress: number;
  maxProgress: number;
}

export interface StreakData {
  streak: number;
  longest: number;
  lastWatched: string | null;
}

export interface CalendarDay {
  date: string;
  count: number;
  items: VaultItem[];
}

export interface WatchGoal {
  year: number;
  target: number;
  current: number;
}

export interface ActivityItem {
  id: string;
  type: 'watched' | 'rated' | 'added' | 'completed' | 'reviewed';
  item: VaultItem;
  timestamp: number;
  data?: any;
}

export interface Recommendation {
  item: VaultItem | TMDBItem;
  score: number;
  reason: string;
  basedOn?: string;
}

export type ViewMode = 'grid' | 'list' | 'compact';
export type SortBy = 'updated' | 'name' | 'year' | 'rating' | 'popularity' | 'releaseDate' | 'runtime';
export type NavFilter = 'all' | 'watched' | 'watchlist' | 'progress' | 'resume' | 'top_rated' | 'rewatch' | 'foreign' | 'analytics' | 'favorites' | 'dropped' | 'on_hold' | 'custom_list';

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
    username?: string;
    avatar?: string;
  };
}

export interface Notification {
  id: string;
  type: 'new_episode' | 'new_season' | 'release_date' | 'recommendation';
  title: string;
  message: string;
  itemId?: string;
  read: boolean;
  createdAt: number;
}

export interface MoodOption {
  id: string;
  label: string;
  emoji: string;
  genres: string[];
  description: string;
}

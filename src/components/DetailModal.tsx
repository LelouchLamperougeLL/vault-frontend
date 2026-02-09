import { useState } from 'react';
import { X, CheckCircle, Clock, Play, Trash2, Heart, Tag, Plus, Bookmark, Star } from 'lucide-react';
import type { VaultItem, CustomList } from '@/types';
import { cn } from '@/lib/utils';
import { useSeriesProgress } from '@/hooks/useEnhancedAnalytics';

interface DetailModalProps {
  item: VaultItem | null;
  onClose: () => void;
  onUpdateStatus: (imdbID: string, status: 'watchlist' | 'watched' | 'dropped' | 'on_hold') => void;
  onUpdateRating: (imdbID: string, rating: number) => void;
  onMarkEpisode: (imdbID: string, season: number, episode: number, watched: boolean) => void;
  onRemove: (imdbID: string) => void;
  onToggleFavorite: (imdbID: string) => void;
  onAddTag: (imdbID: string, tag: string) => void;
  onRemoveTag: (imdbID: string, tag: string) => void;
  onAddToList: (listId: string, imdbID: string) => void;
  customLists: CustomList[];
}

// Season Heatmap
function SeasonHeatmap({ 
  season, 
  onEpisodeClick 
}: { 
  season: { season: number; episodes: { episode: number; watched: boolean; title?: string }[] };
  onEpisodeClick: (episode: number) => void;
}) {
  if (!season.episodes) return null;

  return (
    <div className="flex flex-wrap gap-1 max-w-full">
      {season.episodes.map((ep) => (
        <button
          key={ep.episode}
          onClick={() => onEpisodeClick(ep.episode)}
          title={`Episode ${ep.episode}: ${ep.title || 'Untitled'}`}
          className={cn(
            'w-3 h-3 rounded-sm transition-all hover:scale-125',
            ep.watched ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'
          )}
        />
      ))}
    </div>
  );
}

// Auto Advance Controls
function AutoAdvanceControls({ 
  series, 
  onMarkNext 
}: { 
  series: { seasons: { season: number; episodes: { episode: number; watched: boolean }[] }[] };
  onMarkNext: (season: number, episode: number) => void;
}) {
  const isCompleted = series?.seasons?.every((s) => s.episodes.every((e) => e.watched));

  const markNext = () => {
    if (!series?.seasons) return;
    const seasons = [...series.seasons].sort((a, b) => a.season - b.season);
    for (const season of seasons) {
      const eps = [...season.episodes].sort((a, b) => a.episode - b.episode);
      for (const ep of eps) {
        if (!ep.watched) {
          onMarkNext(season.season, ep.episode);
          return;
        }
      }
    }
  };

  if (isCompleted) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold border border-green-200 dark:border-green-800">
        <CheckCircle size={14} /> Series Completed
      </div>
    );
  }

  return (
    <button
      onClick={markNext}
      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 hover:shadow-indigo-600/50 hover:scale-105"
    >
      <Play size={12} fill="currentColor" />
      Mark Next Episode
    </button>
  );
}

export function DetailModal({
  item,
  onClose,
  onUpdateStatus,
  onUpdateRating,
  onMarkEpisode,
  onRemove,
  onToggleFavorite,
  onAddTag,
  onRemoveTag,
  onAddToList,
  customLists,
}: DetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'episodes' | 'details'>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showAddToList, setShowAddToList] = useState(false);

  if (!item) return null;

  const { percent } = useSeriesProgress(item.meta?.series);
  const isFavorite = item.userMeta?.favorite;

  // Get backdrop image
  const getBackdropUrl = () => {
    if (item.meta?.backdropPath) {
      return `https://image.tmdb.org/t/p/w1280${item.meta.backdropPath}`;
    }
    if (item.tmdb?.details?.backdrop_path) {
      return `https://image.tmdb.org/t/p/w1280${item.tmdb.details.backdrop_path}`;
    }
    return null;
  };

  const getPosterUrl = () => {
    if (item.tmdb?.details?.poster_path) {
      return `https://image.tmdb.org/t/p/w500${item.tmdb.details.poster_path}`;
    }
    if (item.Poster && item.Poster !== 'N/A') {
      return item.Poster.replace(/_V1_.*\.jpg$/, '_V1_SX500.jpg');
    }
    return 'https://via.placeholder.com/300x450?text=No+Poster';
  };

  const handleMarkEpisode = (season: number, episode: number) => {
    const seasonData = item.meta?.series?.seasons.find((s) => s.season === season);
    const ep = seasonData?.episodes.find((e) => e.episode === episode);
    if (ep) {
      onMarkEpisode(item.imdbID, season, episode, !ep.watched);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddTag(item.imdbID, newTag.trim());
      setNewTag('');
    }
  };

  const backdropUrl = getBackdropUrl();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
        {/* Backdrop Header */}
        {backdropUrl && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={backdropUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-900 via-white/50 dark:via-gray-900/50 to-transparent" />
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white z-10 bg-white/80 dark:bg-black/50 backdrop-blur rounded-full p-2 shadow-lg"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className={cn('flex gap-4 px-6', backdropUrl ? '-mt-16 relative z-10' : 'pt-6')}>
          <img
            src={getPosterUrl()}
            alt={item.Title}
            className="w-28 h-40 object-cover rounded-xl shadow-2xl"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=No+Poster';
            }}
          />
          <div className="flex-1 min-w-0 pt-16">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black dark:text-white leading-tight">{item.Title}</h2>
                <div className="flex items-center gap-3 my-2 text-sm text-gray-500 flex-wrap">
                  <span>{item.Year}</span>
                  {item.Type === 'series' && item.meta?.series && (
                    <span className="text-indigo-500 font-medium">{percent}% watched</span>
                  )}
                  {item.meta?.ratingsExternal?.imdb?.rating && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="flex items-center gap-1">
                        <Star size={12} className="fill-yellow-400 text-yellow-400" />
                        {item.meta.ratingsExternal.imdb.rating}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => onToggleFavorite(item.imdbID)}
                className={cn(
                  'p-3 rounded-xl transition-all',
                  isFavorite
                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-rose-500'
                )}
              >
                <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Plot */}
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item.Plot}</p>

          {/* Genre Tags */}
          <div className="flex flex-wrap gap-2">
            {item.Genre?.split(',').map((g) => (
              <span
                key={g.trim()}
                className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full"
              >
                {g.trim()}
              </span>
            ))}
          </div>

          {/* Rating Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-indigo-700 dark:text-indigo-300 font-bold text-sm uppercase tracking-wide">
                Your Rating
              </span>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={item.userMeta?.ratings?.overall || 0}
                  onChange={(e) => onUpdateRating(item.imdbID, parseInt(e.target.value))}
                  className="w-32"
                />
                <span className="text-3xl font-black text-gray-900 dark:text-white w-12 text-right">
                  {item.userMeta?.ratings?.overall || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag size={14} className="text-gray-400" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.userMeta?.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-lg"
                >
                  {tag}
                  <button
                    onClick={() => onRemoveTag(item.imdbID, tag)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  className="w-24 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white"
                />
                <button
                  onClick={handleAddTag}
                  className="p-1 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Add to List */}
          {customLists.length > 0 && (
            <div>
              <button
                onClick={() => setShowAddToList(!showAddToList)}
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Bookmark size={14} />
                Add to List
              </button>
              {showAddToList && (
                <div className="mt-2 flex flex-wrap gap-2 animate-fade-in">
                  {customLists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => {
                        onAddToList(list.id, item.imdbID);
                        setShowAddToList(false);
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                      style={{ borderColor: list.items.includes(item.imdbID) ? list.color : undefined }}
                    >
                      {list.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Series Progress Section */}
          {item.Type === 'series' && item.meta?.series && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-bold transition-all',
                      activeTab === 'overview'
                        ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-500'
                    )}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('episodes')}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-bold transition-all',
                      activeTab === 'episodes'
                        ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-500'
                    )}
                  >
                    Episodes
                  </button>
                </div>
                <AutoAdvanceControls
                  series={item.meta.series}
                  onMarkNext={(season, episode) => onMarkEpisode(item.imdbID, season, episode, true)}
                />
              </div>

              {activeTab === 'overview' ? (
                <div className="space-y-4 animate-fade-in">
                  {item.meta.series.seasons.map((s) => (
                    <div key={s.season}>
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Season {s.season}
                        </span>
                        <span className="text-xs text-gray-500">
                          {s.episodes.filter((e) => e.watched).length}/{s.episodes.length}
                        </span>
                      </div>
                      <SeasonHeatmap
                        season={s}
                        onEpisodeClick={(ep) => handleMarkEpisode(s.season, ep)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-4 animate-fade-in">
                  {item.meta.series.seasons.map((season) => (
                    <div key={season.season}>
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                        Season {season.season}
                      </h4>
                      <div className="grid grid-cols-10 gap-1">
                        {season.episodes.map((ep) => (
                          <button
                            key={ep.episode}
                            onClick={() => handleMarkEpisode(season.season, ep.episode)}
                            className={cn(
                              'aspect-square flex items-center justify-center text-[10px] font-bold rounded transition-all hover:scale-110',
                              ep.watched
                                ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                            )}
                          >
                            {ep.episode}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => onUpdateStatus(item.imdbID, 'watched')}
              className={cn(
                'flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
                item.userMeta?.status === 'watched'
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
              )}
            >
              <CheckCircle size={16} />
              Watched
            </button>
            <button
              onClick={() => onUpdateStatus(item.imdbID, 'watchlist')}
              className={cn(
                'flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
                item.userMeta?.status === 'watchlist'
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
              )}
            >
              <Clock size={16} />
              Watchlist
            </button>
            <button
              onClick={() => onUpdateStatus(item.imdbID, 'dropped')}
              className={cn(
                'flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
                item.userMeta?.status === 'dropped'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50'
              )}
            >
              <X size={16} />
              Dropped
            </button>
          </div>

          {/* Delete Button */}
          <div className="pt-2">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2 text-red-500 text-xs font-bold hover:text-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={14} />
                Remove from Vault
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 text-gray-500 text-xs font-bold hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onRemove(item.imdbID);
                    onClose();
                  }}
                  className="flex-1 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  Confirm Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

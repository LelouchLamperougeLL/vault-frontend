import { useState } from 'react';
import { X, CheckCircle, Clock, Play, Trash2 } from 'lucide-react';
import type { VaultItem } from '@/types';
import { cn } from '@/lib/utils';
import { useSeriesProgress } from '@/hooks/useAnalytics';

interface DetailModalProps {
  item: VaultItem | null;
  onClose: () => void;
  onUpdateStatus: (imdbID: string, status: 'watchlist' | 'watched') => void;
  onUpdateRating: (imdbID: string, rating: number) => void;
  onMarkEpisode: (imdbID: string, season: number, episode: number, watched: boolean) => void;
  onRemove: (imdbID: string) => void;
}

// Animated Progress Ring
function AnimatedProgressRing({ percent, size = 42, stroke = 4 }: { percent: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-gray-300 dark:text-gray-700 opacity-30"
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-indigo-500 transition-all duration-300"
        fill="none"
      />
    </svg>
  );
}

// Season Progress Rings
function SeasonProgressRings({ series }: { 
  series: { seasons: { season: number; episodes: { episode: number; watched: boolean; title?: string }[] }[] };
}) {
  if (!series?.seasons) return null;

  return (
    <div className="flex gap-4 flex-wrap">
      {series.seasons.map((season) => {
        const total = season.episodes?.length || 0;
        const watched = season.episodes?.filter((e) => e.watched).length || 0;
        const percent = total ? Math.round((watched / total) * 100) : 0;

        return (
          <div key={season.season} className="flex flex-col items-center gap-1">
            <AnimatedProgressRing percent={percent} size={32} stroke={3} />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              S{season.season}
            </span>
          </div>
        );
      })}
    </div>
  );
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
            'w-2.5 h-2.5 rounded-sm transition-colors',
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
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold border border-green-200 dark:border-green-800 opacity-80">
        <CheckCircle size={14} /> Completed
      </div>
    );
  }

  return (
    <button
      onClick={markNext}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
    >
      <Play size={12} fill="currentColor" />
      Next Episode
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
}: DetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'episodes'>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!item) return null;

  const { percent } = useSeriesProgress(item.meta?.series);

  const getPosterUrl = () => {
    if (item.tmdb?.credits?.images?.posters?.[0]?.file_path) {
      return `https://image.tmdb.org/t/p/w500${item.tmdb.credits.images.posters[0].file_path}`;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white z-10 bg-white/80 dark:bg-black/50 rounded-full p-1"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex gap-4 p-6 border-b border-gray-100 dark:border-gray-800">
          <img
            src={getPosterUrl()}
            alt={item.Title}
            className="w-24 h-36 object-cover rounded-lg shadow-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=No+Poster';
            }}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black dark:text-white leading-tight">{item.Title}</h2>
            <div className="flex items-center gap-3 my-2 text-sm text-gray-500 flex-wrap">
              <span>{item.Year}</span>
              {item.Type === 'series' && item.meta?.series && (
                <span className="text-indigo-500 font-medium">{percent}% watched</span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{item.Plot}</p>
            
            {/* Genre Tags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {item.Genre?.split(',').map((g) => (
                <span
                  key={g.trim()}
                  className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-medium rounded-full"
                >
                  {g.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Rating Section */}
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border-b border-gray-100 dark:border-gray-800">
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
                className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-2xl font-black text-gray-900 dark:text-white w-10 text-right">
                {item.userMeta?.ratings?.overall || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Series Progress Section */}
        {item.Type === 'series' && item.meta?.series && (
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={cn(
                    'px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all',
                    activeTab === 'overview'
                      ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-500'
                  )}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('episodes')}
                  className={cn(
                    'px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all',
                    activeTab === 'episodes'
                      ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-400 shadow-sm'
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
              <div className="animate-in fade-in duration-200">
                <div className="mb-4 overflow-x-auto pb-2">
                  <SeasonProgressRings series={item.meta.series} />
                </div>

                <div className="space-y-4">
                  {item.meta.series.seasons.map((s) => (
                    <div key={s.season}>
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Season {s.season}
                        </span>
                        <span className="text-[10px] text-gray-500">
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
              </div>
            ) : (
              <div className="animate-in fade-in duration-200 max-h-60 overflow-y-auto custom-scrollbar space-y-4">
                {item.meta.series.seasons.map((season) => (
                  <div key={season.season}>
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                      Season {season.season}
                    </h4>
                    <div className="grid grid-cols-8 gap-1">
                      {season.episodes.map((ep) => (
                        <button
                          key={ep.episode}
                          onClick={() => handleMarkEpisode(season.season, ep.episode)}
                          className={cn(
                            'aspect-square flex items-center justify-center text-[10px] font-bold rounded transition-colors',
                            ep.watched
                              ? 'bg-indigo-500 text-white'
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
        <div className="p-6 flex gap-3">
          <button
            onClick={() => onUpdateStatus(item.imdbID, 'watched')}
            className={cn(
              'flex-1 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2',
              item.userMeta?.status === 'watched'
                ? 'bg-green-200 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
            )}
          >
            <CheckCircle size={16} />
            Watched
          </button>
          <button
            onClick={() => onUpdateStatus(item.imdbID, 'watchlist')}
            className={cn(
              'flex-1 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2',
              item.userMeta?.status === 'watchlist'
                ? 'bg-indigo-200 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300'
                : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
            )}
          >
            <Clock size={16} />
            Watchlist
          </button>
        </div>

        {/* Delete Button */}
        <div className="px-6 pb-6">
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
  );
}

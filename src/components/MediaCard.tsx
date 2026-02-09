import { Star, CheckCircle, Clock, Play, Heart } from 'lucide-react';
import type { VaultItem, SeriesProgress } from '@/types';
import { cn } from '@/lib/utils';
import { useSeriesProgress } from '@/hooks/useEnhancedAnalytics';

interface MediaCardProps {
  item: VaultItem;
  onClick: () => void;
  compact?: boolean;
}

// Series Progress Badge
function SeriesProgressBadge({ series }: { series: SeriesProgress }) {
  const { percent } = useSeriesProgress(series);
  
  const circumference = 2 * Math.PI * 14;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center bg-black/60 backdrop-blur-md rounded-full p-0.5 shadow-lg w-9 h-9">
      <svg width="36" height="36" className="-rotate-90">
        <circle
          cx="18"
          cy="18"
          r="14"
          stroke="currentColor"
          strokeWidth="3"
          className="text-gray-600/30"
          fill="none"
        />
        <circle
          cx="18"
          cy="18"
          r="14"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-indigo-500"
          fill="none"
        />
      </svg>
      <span className="absolute text-[8px] font-black text-white">{percent}%</span>
    </div>
  );
}

// Status Pill
function StatusPill({ icon: Icon, label, color = 'indigo' }: { icon: React.ElementType; label: string; color?: string }) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-500/80',
    green: 'bg-green-500/80',
    amber: 'bg-amber-500/80',
    rose: 'bg-rose-500/80',
  };

  return (
    <div className={cn(
      'flex items-center gap-1.5 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm',
      colorClasses[color] || colorClasses.indigo
    )}>
      <Icon size={10} strokeWidth={3} />
      {label}
    </div>
  );
}

export function MediaCard({ item, onClick, compact = false }: MediaCardProps) {
  const status = item.Type === 'series' && item.userMeta?.series?.lastEpisode?.season! > 0 && item.userMeta?.status !== 'watched'
    ? 'progress'
    : item.userMeta?.status;

  const rating = item.userMeta?.ratings?.overall;
  const isFavorite = item.userMeta?.favorite;

  // Get poster image with TMDB fallback
  const getPosterUrl = () => {
    if (item.tmdb?.details?.poster_path) {
      return `https://image.tmdb.org/t/p/w500${item.tmdb.details.poster_path}`;
    }
    if (item.tmdb?.credits?.images?.posters?.[0]?.file_path) {
      return `https://image.tmdb.org/t/p/w500${item.tmdb.credits.images.posters[0].file_path}`;
    }
    if (item.Poster && item.Poster !== 'N/A') {
      return item.Poster.replace(/_V1_.*\.jpg$/, '_V1_SX500.jpg');
    }
    return 'https://via.placeholder.com/300x450?text=No+Poster';
  };

  if (compact) {
    return (
      <button onClick={onClick} className="group text-left focus:outline-none w-full">
        <div className="relative rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
          <div className="aspect-[2/3] w-full relative">
            <img
              src={getPosterUrl()}
              alt={item.Title}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=No+Poster';
              }}
            />
            
            {/* Favorite Badge */}
            {isFavorite && (
              <div className="absolute top-1.5 left-1.5">
                <Heart size={14} className="fill-rose-500 text-rose-500" />
              </div>
            )}

            {/* Rating */}
            {rating > 0 && (
              <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                <Star size={10} className="fill-yellow-400 text-yellow-400" />
                {rating}
              </div>
            )}
          </div>
        </div>
        <p className="mt-1.5 text-xs font-medium text-gray-900 dark:text-white truncate">{item.Title}</p>
      </button>
    );
  }

  return (
    <button onClick={onClick} className="group text-left focus:outline-none w-full">
      {/* Poster Container */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-sm transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl ring-1 ring-black/5 dark:ring-white/5 card-shine">
        <div className="aspect-[2/3] w-full relative">
          <img
            src={getPosterUrl()}
            alt={item.Title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=No+Poster';
            }}
          />

          {/* Series Progress Badge */}
          {item.Type === 'series' && item.meta?.series && (
            <div className="absolute top-2 left-2 z-10">
              <SeriesProgressBadge series={item.meta.series} />
            </div>
          )}

          {/* Favorite Badge */}
          {isFavorite && (
            <div className="absolute top-2 right-2 z-10">
              <div className="bg-rose-500/80 backdrop-blur-md rounded-full p-1.5 shadow-lg">
                <Heart size={14} className="fill-white text-white" />
              </div>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3">
            {/* Top Status */}
            <div className="self-end transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              {status === 'watched' && <StatusPill icon={CheckCircle} label="Watched" color="green" />}
              {status === 'watchlist' && <StatusPill icon={Clock} label="Watchlist" color="indigo" />}
              {status === 'progress' && <StatusPill icon={Play} label="In Progress" color="amber" />}
              {status === 'dropped' && <StatusPill icon={Clock} label="Dropped" color="rose" />}
            </div>

            {/* Bottom Info */}
            <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 space-y-2">
              {/* Tags */}
              {item.userMeta?.tags && item.userMeta.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.userMeta.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Rating & Type */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-white text-xs font-bold">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  {rating || '–'}
                </div>
                <span className="text-[9px] text-white/80 uppercase tracking-wider font-bold bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {item.Type === 'series' ? 'TV Series' : 'Movie'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Title Block */}
      <div className="mt-3 px-1 space-y-1">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {item.Title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{item.Year}</span>
          {item.Runtime && item.Runtime !== 'N/A' && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span>{item.Runtime}</span>
            </>
          )}
          {item.userMeta?.rewatchCount > 0 && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="text-indigo-500 font-medium">↻ {item.userMeta.rewatchCount}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

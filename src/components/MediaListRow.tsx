import { Star, CheckCircle, Clock, Play, Heart } from 'lucide-react';
import type { VaultItem, SeriesProgress } from '@/types';
import { useSeriesProgress } from '@/hooks/useEnhancedAnalytics';
import { cn } from '@/lib/utils';

interface MediaListRowProps {
  item: VaultItem;
  onOpen: () => void;
}

// Status Component
function Status({ icon: Icon, label, color = 'indigo' }: { icon: React.ElementType; label: string; color?: string }) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold',
      colorClasses[color] || colorClasses.indigo
    )}>
      <Icon size={12} strokeWidth={2.5} />
      {label}
    </span>
  );
}

// Series Progress Inline
function SeriesProgressInline({ series }: { series: SeriesProgress }) {
  const { watched, total, percent } = useSeriesProgress(series);
  if (!total) return null;

  const circumference = 2 * Math.PI * 10;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center">
        <svg width="24" height="24" className="-rotate-90">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="text-gray-200 dark:text-gray-700" fill="none" />
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-indigo-500"
            fill="none"
          />
        </svg>
      </div>
      <div className="text-[10px] leading-tight">
        <div className="font-bold dark:text-white">{watched}/{total} eps</div>
        <div className="text-gray-400">{percent}%</div>
      </div>
    </div>
  );
}

export function MediaListRow({ item, onOpen }: MediaListRowProps) {
  const status = item.Type === 'series' && item.userMeta?.series?.lastEpisode?.season! > 0 && item.userMeta?.status !== 'watched'
    ? 'progress'
    : item.userMeta?.status;

  const rating = item.userMeta?.ratings?.overall;
  const isFavorite = item.userMeta?.favorite;

  // Get poster image
  const getPosterUrl = () => {
    if (item.tmdb?.details?.poster_path) {
      return `https://image.tmdb.org/t/p/w154${item.tmdb.details.poster_path}`;
    }
    if (item.Poster && item.Poster !== 'N/A') {
      return item.Poster.replace(/_V1_.*\.jpg$/, '_V1_SX200.jpg');
    }
    return 'https://via.placeholder.com/100x150?text=No+Poster';
  };

  return (
    <button onClick={onOpen} className="group w-full text-left focus:outline-none">
      <div className="flex items-center gap-4 p-3 bg-white dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all shadow-sm hover:shadow-md group-focus:ring-2 ring-indigo-500/20">
        {/* Poster Thumb */}
        <div className="w-14 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 relative shadow-inner">
          <img
            src={getPosterUrl()}
            alt={item.Title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x150?text=No+Poster';
            }}
          />
          {isFavorite && (
            <div className="absolute top-1 left-1">
              <Heart size={12} className="fill-rose-500 text-rose-500" />
            </div>
          )}
        </div>

        {/* Title + Meta */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {item.Title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{item.Year}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span className="uppercase text-[10px] tracking-wider font-bold">{item.Type}</span>
            {item.Runtime && item.Runtime !== 'N/A' && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span>{item.Runtime}</span>
              </>
            )}
          </div>

          {/* Tags */}
          {item.userMeta?.tags && item.userMeta.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.userMeta.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Inline Progress */}
          {item.Type === 'series' && item.meta?.series && (
            <div className="mt-2">
              <SeriesProgressInline series={item.meta.series} />
            </div>
          )}
        </div>

        {/* Status Tags */}
        <div className="hidden sm:flex items-center gap-2">
          {status === 'watched' && <Status icon={CheckCircle} label="Watched" color="green" />}
          {status === 'watchlist' && <Status icon={Clock} label="Watchlist" color="indigo" />}
          {status === 'progress' && <Status icon={Play} label="In Progress" color="amber" />}
          {status === 'dropped' && <Status icon={Clock} label="Dropped" color="rose" />}
        </div>

        {/* Rating */}
        <div className="flex items-center justify-end w-16 px-2">
          {rating > 0 ? (
            <div className="flex items-center gap-1 text-sm font-bold text-gray-900 dark:text-white">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              {rating}
            </div>
          ) : (
            <span className="text-sm font-bold text-gray-300 dark:text-gray-600">–</span>
          )}
        </div>
      </div>
    </button>
  );
}

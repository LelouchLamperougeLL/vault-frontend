import { Star, CheckCircle, Clock, Play } from 'lucide-react';
import type { VaultItem, SeriesProgress } from '@/types';
import { useSeriesProgress } from '@/hooks/useAnalytics';

interface MediaListRowProps {
  item: VaultItem;
  onOpen: () => void;
}

// Status Component for List View
function Status({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full text-[10px] font-bold border border-gray-200 dark:border-gray-700 transition-colors">
      <Icon size={12} strokeWidth={2.5} />
      {label}
    </span>
  );
}

// Series Progress Inline Component
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
        <div className="opacity-60 dark:text-gray-400">{percent}% complete</div>
      </div>
    </div>
  );
}

export function MediaListRow({ item, onOpen }: MediaListRowProps) {
  const status = item.Type === 'series' && item.userMeta?.series?.lastEpisode?.season! > 0 && item.userMeta?.status !== 'watched'
    ? 'progress'
    : item.userMeta?.status;

  const rating = item.userMeta?.ratings?.overall;

  // Get poster image
  const getPosterUrl = () => {
    if (item.tmdb?.credits?.images?.posters?.[0]?.file_path) {
      return `https://image.tmdb.org/t/p/w154${item.tmdb.credits.images.posters[0].file_path}`;
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
        <div className="w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 relative shadow-inner">
          <img
            src={getPosterUrl()}
            alt={item.Title}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x150?text=No+Poster';
            }}
          />
        </div>

        {/* Title + Meta */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {item.Title}
          </h3>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
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

          {/* Inline Progress for List View */}
          {item.Type === 'series' && item.meta?.series && (
            <div className="mt-2">
              <SeriesProgressInline series={item.meta.series} />
            </div>
          )}
        </div>

        {/* Status Tags (Desktop) */}
        <div className="hidden sm:flex items-center gap-2">
          {status === 'watched' && <Status icon={CheckCircle} label="Watched" />}
          {status === 'watchlist' && <Status icon={Clock} label="Watchlist" />}
          {status === 'progress' && <Status icon={Play} label="In Progress" />}
        </div>

        {/* Rating */}
        <div className="flex items-center justify-end w-16 px-2">
          {rating > 0 ? (
            <div className="flex items-center gap-1 text-xs font-bold text-gray-900 dark:text-white">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              {rating}
            </div>
          ) : (
            <span className="text-xs font-bold text-gray-300 dark:text-gray-600">–</span>
          )}
        </div>
      </div>
    </button>
  );
}

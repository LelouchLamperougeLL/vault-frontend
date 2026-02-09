import { Star, CheckCircle, Clock, Play } from 'lucide-react';
import type { VaultItem, SeriesProgress } from '@/types';
import { useSeriesProgress } from '@/hooks/useAnalytics';

interface MediaCardProps {
  item: VaultItem;
  onClick: () => void;
}

// Series Progress Badge Component
function SeriesProgressBadge({ series }: { series: SeriesProgress }) {
  const { percent } = useSeriesProgress(series);
  
  const circumference = 2 * Math.PI * 14;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center bg-black/60 rounded-full backdrop-blur-md p-0.5 shadow-lg w-9 h-9">
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

// Status Pill Component
function StatusPill({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-black/60 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm border border-white/10">
      <Icon size={10} strokeWidth={3} />
      {label}
    </div>
  );
}

export function MediaCard({ item, onClick }: MediaCardProps) {
  const status = item.Type === 'series' && item.userMeta?.series?.lastEpisode?.season! > 0 && item.userMeta?.status !== 'watched'
    ? 'progress'
    : item.userMeta?.status;

  const rating = item.userMeta?.ratings?.overall;

  // Get poster image
  const getPosterUrl = () => {
    if (item.tmdb?.credits?.images?.posters?.[0]?.file_path) {
      return `https://image.tmdb.org/t/p/w500${item.tmdb.credits.images.posters[0].file_path}`;
    }
    if (item.Poster && item.Poster !== 'N/A') {
      return item.Poster.replace(/_V1_.*\.jpg$/, '_V1_SX500.jpg');
    }
    return 'https://via.placeholder.com/300x450?text=No+Poster';
  };

  return (
    <button onClick={onClick} className="group text-left focus:outline-none w-full">
      {/* Poster Container */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-sm transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl ring-1 ring-black/5 dark:ring-white/5">
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

          {/* Series Progress Badge Overlay */}
          {item.Type === 'series' && item.meta?.series && (
            <div className="absolute top-2 left-2 z-10">
              <SeriesProgressBadge series={item.meta.series} />
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
            {/* Top-right quick status */}
            <div className="self-end transform -translate-y-1 group-hover:translate-y-0 transition-transform duration-200">
              {status === 'watched' && <StatusPill icon={CheckCircle} label="Watched" />}
              {status === 'watchlist' && <StatusPill icon={Clock} label="Watchlist" />}
              {status === 'progress' && <StatusPill icon={Play} label="In Progress" />}
            </div>

            {/* Bottom metadata */}
            <div className="flex items-center justify-between w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
              <div className="flex items-center gap-1.5 text-white text-xs font-bold shadow-black/50 drop-shadow-md">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                {rating || '–'}
              </div>
              <span className="text-[9px] text-white/90 uppercase tracking-wider font-bold bg-white/10 px-1.5 py-0.5 rounded backdrop-blur-md border border-white/10">
                {item.Type === 'series' ? 'TV' : item.Type}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Title Block */}
      <div className="mt-3 px-1 space-y-0.5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {item.Title}
        </h3>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          <span>{item.Year}</span>
          {item.Runtime && item.Runtime !== 'N/A' && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span>{item.Runtime}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

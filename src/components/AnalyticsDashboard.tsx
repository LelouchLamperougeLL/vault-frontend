import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  BarChart3, 
  CheckCircle, 
  Star, 
  Calendar, 
  User, 
  Award,
  Clock,
  Flame,
  Heart,
  Target,
  Zap,
  Film
} from 'lucide-react';
import type { VaultItem } from '@/types';
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics';
import { cn } from '@/lib/utils';

interface AnalyticsDashboardProps {
  items: VaultItem[];
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  color = 'indigo',
  trend
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number;
  subValue?: string;
  color?: 'indigo' | 'green' | 'amber' | 'blue' | 'yellow' | 'rose' | 'purple';
  trend?: 'up' | 'down';
}) {
  const colorClasses = {
    indigo: 'from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400',
    green: 'from-green-500/20 to-emerald-500/20 text-green-600 dark:text-green-400',
    amber: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400',
    blue: 'from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400',
    yellow: 'from-yellow-500/20 to-amber-500/20 text-yellow-600 dark:text-yellow-400',
    rose: 'from-rose-500/20 to-pink-500/20 text-rose-600 dark:text-rose-400',
    purple: 'from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div className={cn('p-3 rounded-xl bg-gradient-to-br', colorClasses[color])}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-bold px-2 py-1 rounded-full',
            trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          )}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-wide text-gray-500 font-bold">{label}</p>
        <p className="text-2xl font-black dark:text-white">{value}</p>
        {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
      </div>
    </div>
  );
}

// Progress Bar Component
function ProgressBar({ label, value, max, color = 'indigo' }: { 
  label: string; 
  value: number; 
  max: number;
  color?: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-medium text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Activity Calendar Component
function ActivityCalendar({ calendar }: { calendar: { date: string; count: number }[] }) {
  const maxCount = Math.max(...calendar.map((d) => d.count), 1);

  return (
    <div className="glass-card p-5 rounded-2xl">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
        <Calendar size={14} /> Watching Activity (Last 6 Months)
      </h3>
      <div className="flex flex-wrap gap-[3px]">
        {calendar.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.count} watched`}
            className={cn(
              'w-3 h-3 rounded-[2px] transition-colors hover:ring-2 hover:ring-indigo-500/50',
              d.count === 0 ? 'bg-gray-100 dark:bg-gray-800' :
              d.count < maxCount * 0.25 ? 'bg-indigo-200 dark:bg-indigo-900/40' :
              d.count < maxCount * 0.5 ? 'bg-indigo-400 dark:bg-indigo-700' :
              d.count < maxCount * 0.75 ? 'bg-indigo-600 dark:bg-indigo-500' :
              'bg-indigo-800 dark:bg-indigo-400'
            )}
          />
        ))}
      </div>
      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-[2px] bg-gray-100 dark:bg-gray-800" />
          <div className="w-3 h-3 rounded-[2px] bg-indigo-200 dark:bg-indigo-900/40" />
          <div className="w-3 h-3 rounded-[2px] bg-indigo-400 dark:bg-indigo-700" />
          <div className="w-3 h-3 rounded-[2px] bg-indigo-600 dark:bg-indigo-500" />
          <div className="w-3 h-3 rounded-[2px] bg-indigo-800 dark:bg-indigo-400" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

// Achievement Card
function AchievementCard({ achievement }: { achievement: { id: string; label: string; description: string; unlocked: boolean; icon: string; tier: string; progress: number; maxProgress: number } }) {
  const tierColors: Record<string, string> = {
    bronze: 'from-amber-600 to-amber-700',
    silver: 'from-gray-400 to-gray-500',
    gold: 'from-yellow-400 to-amber-500',
    platinum: 'from-cyan-400 to-blue-500',
  };

  const percent = Math.round((achievement.progress / achievement.maxProgress) * 100);

  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-all',
        achievement.unlocked
          ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800/50'
          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center text-xl',
          achievement.unlocked
            ? `bg-gradient-to-br ${tierColors[achievement.tier]} text-white shadow-lg`
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
        )}>
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            'font-bold text-sm',
            achievement.unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
          )}>
            {achievement.label}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">{achievement.description}</p>
          
          {/* Progress */}
          <div className="mt-2">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-gray-400">{achievement.progress} / {achievement.maxProgress}</span>
              <span className="font-bold text-indigo-600">{percent}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  achievement.unlocked ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-indigo-500'
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Watch Goals
function WatchGoals({ goals }: { goals: { year: number; target: number; current: number }[] }) {
  return (
    <div className="glass-card p-5 rounded-2xl">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
        <Target size={14} /> Watch Goals
      </h3>
      <div className="space-y-4">
        {goals.map((goal) => {
          const percent = Math.min((goal.current / goal.target) * 100, 100);
          return (
            <div key={goal.target}>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  {goal.target} titles in {goal.year}
                </span>
                <span className="font-bold text-indigo-600">{goal.current} / {goal.target}</span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Taste Profile
function TasteProfile({ profile }: { profile: { label: string; value: number; icon: string }[] }) {
  return (
    <div className="glass-card p-5 rounded-2xl">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
        <Zap size={14} /> Your Taste Profile
      </h3>
      <div className="space-y-3">
        {profile.slice(0, 5).map((p) => (
          <div key={p.label} className="flex items-center gap-3">
            <span className="text-lg">{p.icon}</span>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-600 dark:text-gray-400">{p.label}</span>
                <span className="font-bold text-gray-900 dark:text-white">{p.value}%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${p.value}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsDashboard({ items }: AnalyticsDashboardProps) {
  const {
    stats,
    seriesProgress,
    streak,
    calendar,
    monthlyData,
    peopleAnalytics,
    tasteProfile,
    achievements,
    watchGoals,
    reminder,
    recentlyWatched,
    favorites,
  } = useEnhancedAnalytics(items);

  // Prepare chart data
  const genreData = Object.entries(stats.byGenre)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  const monthlyChartData = monthlyData.map(([month, count]) => ({
    month: month.slice(5),
    count,
  }));

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black dark:text-white flex items-center gap-3">
            <BarChart3 size={28} className="text-indigo-500" />
            Library Analytics
          </h2>
          <p className="text-sm text-gray-500 mt-1">Insights and statistics from your vault</p>
        </div>
        {streak.streak > 0 && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-700 dark:text-orange-400 px-4 py-2 rounded-full text-sm font-bold border border-orange-200 dark:border-orange-800/50">
            <Flame size={16} className="text-orange-500" />
            {streak.streak}-day streak
          </div>
        )}
      </div>

      {/* Reminder */}
      {reminder && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 p-4 rounded-xl text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-3">
          <Clock size={18} />
          {reminder}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Film} label="Total Titles" value={stats.total} color="indigo" />
        <StatCard icon={CheckCircle} label="Watched" value={stats.watched} subValue={`${stats.watchlist} in watchlist`} color="green" />
        <StatCard icon={Star} label="Avg Rating" value={stats.avgRating} color="yellow" />
        <StatCard icon={Clock} label="Watch Time" value={`${stats.totalWatchTime}h`} color="blue" />
      </div>

      {/* Activity Calendar */}
      <ActivityCalendar calendar={calendar} />

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Genre Breakdown */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Top Genres</h3>
          <div className="space-y-3">
            {genreData.map((genre) => (
              <ProgressBar
                key={genre.name}
                label={genre.name}
                value={genre.value}
                max={genreData[0]?.value || 1}
                color="bg-gradient-to-r from-indigo-500 to-purple-500"
              />
            ))}
          </div>
        </div>

        {/* Taste Profile */}
        <TasteProfile profile={tasteProfile} />
      </div>

      {/* Monthly Chart */}
      {monthlyChartData.length > 0 && (
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Monthly Activity</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Watch Goals */}
      <WatchGoals goals={watchGoals} />

      {/* People Analytics */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
            <User size={14} /> Top Directors
          </h3>
          <div className="space-y-2">
            {peopleAnalytics.directors.map(([name, count]) => (
              <div key={name} className="flex justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <span className="text-gray-700 dark:text-gray-300 truncate pr-2">{name}</span>
                <span className="font-bold text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
            <User size={14} /> Top Actors
          </h3>
          <div className="space-y-2">
            {peopleAnalytics.actors.map(([name, count]) => (
              <div key={name} className="flex justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <span className="text-gray-700 dark:text-gray-300 truncate pr-2">{name}</span>
                <span className="font-bold text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
          <Award size={14} /> Achievements
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((a) => (
            <AchievementCard key={a.id} achievement={a} />
          ))}
        </div>
      </div>

      {/* Recently Watched */}
      {recentlyWatched.length > 0 && (
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
            <Clock size={14} /> Recently Watched
          </h3>
          <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
            {recentlyWatched.slice(0, 10).map((item) => (
              <div key={item.imdbID} className="flex-shrink-0 w-24">
                <img
                  src={item.Poster !== 'N/A' ? item.Poster.replace(/_V1_.*\.jpg$/, '_V1_SX200.jpg') : 'https://via.placeholder.com/200x300?text=No+Poster'}
                  alt={item.Title}
                  className="w-full aspect-[2/3] object-cover rounded-lg bg-gray-200 dark:bg-gray-800"
                />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate mt-2">{item.Title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorites */}
      {favorites.length > 0 && (
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
            <Heart size={14} /> Your Favorites
          </h3>
          <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
            {favorites.slice(0, 10).map((item) => (
              <div key={item.imdbID} className="flex-shrink-0 w-24">
                <img
                  src={item.Poster !== 'N/A' ? item.Poster.replace(/_V1_.*\.jpg$/, '_V1_SX200.jpg') : 'https://via.placeholder.com/200x300?text=No+Poster'}
                  alt={item.Title}
                  className="w-full aspect-[2/3] object-cover rounded-lg bg-gray-200 dark:bg-gray-800"
                />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate mt-2">{item.Title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Series Completion */}
      <div className="glass-card p-5 rounded-2xl flex items-center gap-6">
        <div className="relative flex items-center justify-center">
          <svg width="64" height="64" className="-rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="6"
              className="text-gray-100 dark:text-gray-800"
              fill="none"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 28}
              strokeDashoffset={2 * Math.PI * 28 * (1 - seriesProgress.percent / 100)}
              strokeLinecap="round"
              className="text-indigo-500"
              fill="none"
            />
          </svg>
          <span className="absolute text-lg font-black text-gray-900 dark:text-white">{seriesProgress.percent}%</span>
        </div>
        <div>
          <div className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white">Series Completion</div>
          <div className="text-xs text-gray-500 mt-1">
            {seriesProgress.watched} of {seriesProgress.total} episodes watched
          </div>
        </div>
      </div>
    </div>
  );
}

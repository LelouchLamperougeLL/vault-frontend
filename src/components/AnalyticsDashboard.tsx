import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  BarChart3, 
  CheckCircle, 
  TrendingUp, 
  Star, 
  Calendar, 
  User, 
  Award,
  Clock,
  Flame
} from 'lucide-react';
import type { VaultItem } from '@/types';
import { useAnalytics } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';

interface AnalyticsDashboardProps {
  items: VaultItem[];
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color = 'indigo' 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number;
  color?: 'indigo' | 'green' | 'amber' | 'blue' | 'yellow';
}) {
  const colorClasses = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm flex items-center gap-3 border border-gray-100 dark:border-gray-800">
      <div className={cn('p-2 rounded-lg', colorClasses[color])}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide opacity-60 font-bold dark:text-gray-400">{label}</p>
        <p className="text-xl font-black dark:text-white">{value}</p>
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
      <div className="flex justify-between text-[10px] mb-1 font-bold dark:text-gray-400">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
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
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
        <Calendar size={14} /> Watching Activity
      </h3>
      <div className="flex flex-wrap gap-1">
        {calendar.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.count} watched`}
            className={cn(
              'w-2.5 h-2.5 rounded-sm transition-colors',
              d.count === 0 ? 'bg-gray-100 dark:bg-gray-800' :
              d.count < 2 ? 'bg-indigo-300 dark:bg-indigo-900' :
              d.count < 4 ? 'bg-indigo-500 dark:bg-indigo-600' :
              'bg-indigo-700 dark:bg-indigo-400'
            )}
          />
        ))}
      </div>
    </div>
  );
}

// Achievement Badge
function AchievementBadge({ achievement }: { achievement: { id: string; label: string; unlocked: boolean } }) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg text-xs font-bold text-center border transition-all',
        achievement.unlocked
          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30'
          : 'bg-gray-50 text-gray-400 border-gray-100 dark:bg-gray-800/50 dark:border-gray-800'
      )}
    >
      {achievement.label}
    </div>
  );
}

// Gentle Reminder
function GentleReminder({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="mb-6 px-6">
      <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 p-3 rounded-xl text-sm font-medium text-yellow-800 dark:text-yellow-200 flex items-center gap-2 animate-in fade-in">
        <Clock size={16} /> {message}
      </div>
    </div>
  );
}

// Streak Badge
function StreakBadge({ streak }: { streak: number }) {
  if (!streak) return null;

  return (
    <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1.5 rounded-full text-xs font-bold border border-orange-200 dark:border-orange-800/50 animate-in fade-in">
      <Flame size={14} /> {streak}-day streak
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
    reminder,
  } = useAnalytics(items);

  // Prepare chart data
  const genreData = Object.entries(stats.byGenre)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  const yearData = Object.entries(stats.byYear)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .slice(-6)
    .map(([name, value]) => ({ name, value }));

  const monthlyChartData = monthlyData.map(([month, count]) => ({
    month: month.slice(5), // Get MM from YYYY-MM
    count,
  }));

  return (
    <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold dark:text-white">Library Analytics</h2>
            <span className="text-xs text-gray-500">Insights from your vault</span>
          </div>
          <StreakBadge streak={streak.streak} />
        </div>
      </div>

      {/* Reminder */}
      <GentleReminder message={reminder} />

      {/* Activity Calendar */}
      <ActivityCalendar calendar={calendar} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="Total Titles" value={stats.total} />
        <StatCard icon={CheckCircle} label="Watched" value={stats.watched} color="green" />
        <StatCard icon={TrendingUp} label="In Progress" value={stats.progress} color="amber" />
        <StatCard icon={Star} label="Avg Rating" value={stats.avgRating} color="yellow" />
      </div>

      {/* Series Completion */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100 dark:border-gray-800">
        <div className="relative flex items-center justify-center">
          <svg width="48" height="48" className="-rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="5"
              className="text-gray-200 dark:text-gray-800"
              fill="none"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="5"
              strokeDasharray={2 * Math.PI * 20}
              strokeDashoffset={2 * Math.PI * 20 * (1 - seriesProgress.percent / 100)}
              strokeLinecap="round"
              className="text-indigo-500"
              fill="none"
            />
          </svg>
          <span className="absolute text-xs font-black text-gray-900 dark:text-white">{seriesProgress.percent}%</span>
        </div>
        <div>
          <div className="text-sm font-black dark:text-white uppercase tracking-wider">Series Completion</div>
          <div className="text-xs text-gray-500">{seriesProgress.percent}% of all tracked episodes</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Genre Breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Top Genres</h3>
          <div className="space-y-3">
            {genreData.map((genre) => (
              <ProgressBar
                key={genre.name}
                label={genre.name}
                value={genre.value}
                max={genreData[0]?.value || 1}
                color="bg-indigo-500"
              />
            ))}
          </div>
        </div>

        {/* Year Trend */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Release Years</h3>
          <div className="space-y-3">
            {yearData.map((year) => (
              <ProgressBar
                key={year.name}
                label={year.name}
                value={year.value}
                max={Math.max(...yearData.map((y) => y.value))}
                color="bg-purple-500"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      {monthlyChartData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Monthly Watching Habits</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
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
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* People Analytics */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
            <User size={14} /> Top Directors
          </h3>
          <div className="space-y-2">
            {peopleAnalytics.directors.map(([name, count]) => (
              <div key={name} className="flex justify-between text-xs py-1 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <span className="dark:text-gray-300 truncate pr-2">{name}</span>
                <span className="font-bold dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
            <User size={14} /> Top Actors
          </h3>
          <div className="space-y-2">
            {peopleAnalytics.actors.map(([name, count]) => (
              <div key={name} className="flex justify-between text-xs py-1 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <span className="dark:text-gray-300 truncate pr-2">{name}</span>
                <span className="font-bold dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Taste Profile */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
          <TrendingUp size={14} /> Your Taste Profile
        </h3>
        <div className="space-y-3">
          {tasteProfile.map((p) => (
            <ProgressBar
              key={p.label}
              label={p.label}
              value={p.value}
              max={100}
              color="bg-gradient-to-r from-indigo-500 to-purple-500"
            />
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
          <Award size={14} /> Achievements
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {achievements.map((a) => (
            <AchievementBadge key={a.id} achievement={a} />
          ))}
        </div>
      </div>

      {/* Top Rated */}
      {stats.topRated.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
            <Star size={14} /> Top Rated
          </h3>
          <ul className="space-y-2">
            {stats.topRated.map((item) => (
              <li
                key={item.imdbID}
                className="text-sm flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-800/50 last:border-0"
              >
                <span className="truncate flex-1 pr-2 dark:text-gray-300">{item.Title}</span>
                <span className="font-bold text-yellow-500 text-xs flex items-center gap-1">
                  <Star size={10} fill="currentColor" /> {item.userMeta.ratings.overall}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rewatch Stats */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Rewatches</h3>
        <div className="flex flex-col items-center justify-center h-32">
          <p className="text-5xl font-black text-center text-indigo-600 dark:text-indigo-400">{stats.rewatchCount}</p>
          <p className="text-xs text-center opacity-60 mt-2 uppercase tracking-widest font-bold">Total Rewatches</p>
        </div>
      </div>
    </div>
  );
}

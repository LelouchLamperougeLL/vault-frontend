import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Filters, FilterOptions, SortBy } from '@/types';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  filterOptions: FilterOptions;
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  sortOrder: 'asc' | 'desc';
  toggleSortOrder: () => void;
}

interface FilterSectionProps {
  title: string;
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
}

const FilterSection = ({ title, options, selected, onChange }: FilterSectionProps) => {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.slice(0, 15).map((option) => (
          <button
            key={option}
            onClick={() => toggleOption(option)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
              selected.includes(option)
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {option}
          </button>
        ))}
        {options.length > 15 && (
          <span className="px-2 py-1 text-xs text-gray-400">+{options.length - 15} more</span>
        )}
      </div>
    </div>
  );
};

const STATUS_OPTIONS = [
  { value: 'watchlist', label: 'Watchlist', color: 'bg-indigo-500' },
  { value: 'watched', label: 'Watched', color: 'bg-green-500' },
  { value: 'progress', label: 'In Progress', color: 'bg-amber-500' },
  { value: 'dropped', label: 'Dropped', color: 'bg-rose-500' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-gray-500' },
];

export function FilterDrawer({
  isOpen,
  onClose,
  filters,
  setFilters,
  filterOptions,
  sortBy,
  setSortBy,
  sortOrder,
  toggleSortOrder,
}: FilterDrawerProps) {
  const resetFilters = () => {
    setFilters({ genre: [], director: [], actor: [], studio: [], year: [], rating: [], tag: [], status: [] });
  };

  const hasActiveFilters = Object.values(filters).some((arr) => arr.length > 0);

  const toggleStatus = (status: string) => {
    const current = filters.status as string[];
    if (current.includes(status)) {
      setFilters({ ...filters, status: current.filter((s) => s !== status) as any });
    } else {
      setFilters({ ...filters, status: [...current, status] as any });
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[90] backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl z-[95] transform transition-transform duration-300 ease-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <SlidersHorizontal size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-black dark:text-white">Filters & Sort</h2>
              <p className="text-xs text-gray-500">Refine your collection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {/* Sort Order */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Sort By</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="updated">Last Updated</option>
                <option value="name">Title (A-Z)</option>
                <option value="year">Release Year</option>
                <option value="rating">Rating</option>
                <option value="popularity">Popularity</option>
                <option value="runtime">Runtime</option>
              </select>
              <button
                onClick={toggleSortOrder}
                className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Status</label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status.value}
                  onClick={() => toggleStatus(status.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    filters.status?.includes(status.value as any)
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full', status.color)} />
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Genre Filter */}
          <FilterSection
            title="Genres"
            options={filterOptions.genres}
            selected={filters.genre}
            onChange={(v) => setFilters({ ...filters, genre: v })}
          />

          {/* Year Filter */}
          <FilterSection
            title="Years"
            options={filterOptions.years}
            selected={filters.year}
            onChange={(v) => setFilters({ ...filters, year: v })}
          />

          {/* Rating Filter */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Rating Range</label>
            <div className="flex flex-wrap gap-1.5">
              {['9-10', '8-9', '7-8', '6-7', '5-6', 'Below 5'].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    const current = filters.rating;
                    if (current.includes(range)) {
                      setFilters({ ...filters, rating: current.filter((r) => r !== range) });
                    } else {
                      setFilters({ ...filters, rating: [...current, range] });
                    }
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                    filters.rating.includes(range)
                      ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          {filterOptions.tags.length > 0 && (
            <FilterSection
              title="Tags"
              options={filterOptions.tags}
              selected={filters.tag}
              onChange={(v) => setFilters({ ...filters, tag: v })}
            />
          )}

          {/* Directors Filter */}
          <FilterSection
            title="Directors"
            options={filterOptions.directors}
            selected={filters.director}
            onChange={(v) => setFilters({ ...filters, director: v })}
          />

          {/* Studios Filter */}
          <FilterSection
            title="Studios"
            options={filterOptions.studios}
            selected={filters.studio}
            onChange={(v) => setFilters({ ...filters, studio: v })}
          />
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 dark:border-gray-800 space-y-3 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 py-2.5 rounded-xl text-sm font-bold hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw size={14} />
            Reset All Filters
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:scale-[1.02] transition-all"
          >
            Show {hasActiveFilters ? 'Filtered ' : ''}Results
          </button>
        </div>
      </div>
    </>
  );
}

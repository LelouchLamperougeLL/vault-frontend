import { X } from 'lucide-react';
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

interface FilterSelectProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}

const FilterSelect = ({ label, options, value, onChange }: FilterSelectProps) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">{label}</label>
    <select
      multiple
      value={value}
      onChange={(e) => onChange([...e.target.selectedOptions].map((o) => o.value))}
      className="w-full h-24 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs p-2 outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-gray-300 custom-scrollbar"
    >
      {options.map((o) => (
        <option key={o} value={o} className="py-1 px-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
          {o}
        </option>
      ))}
    </select>
  </div>
);

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
    setFilters({ genre: [], director: [], actor: [], studio: [] });
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
          'fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-[95] transform transition-transform duration-300 ease-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-black dark:text-white">Filters & Sort</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Sort Order */}
          <div>
            <p className="text-xs uppercase opacity-50 mb-2 font-bold dark:text-gray-400">Sort Order</p>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-2.5 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="updated">Last Updated</option>
                <option value="name">Title (A-Z)</option>
                <option value="year">Release Year</option>
                <option value="rating">Rating</option>
              </select>
              <button
                onClick={toggleSortOrder}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <FilterSelect
              label="Genre"
              options={filterOptions.genres}
              value={filters.genre}
              onChange={(v) => setFilters({ ...filters, genre: v })}
            />
            <FilterSelect
              label="Director"
              options={filterOptions.directors}
              value={filters.director}
              onChange={(v) => setFilters({ ...filters, director: v })}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 space-y-3">
          <button
            onClick={resetFilters}
            className="w-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Reset Filters
          </button>
          <button
            onClick={onClose}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
          >
            Show Results
          </button>
        </div>
      </div>
    </>
  );
}

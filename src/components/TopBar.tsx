import { useState, useRef, useCallback } from 'react';
import { Search, List, LayoutGrid, Grid3X3, Filter, X, Sparkles, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViewMode } from '@/types';

interface SearchResult {
  imdbID: string;
  Title: string;
  Year: string;
  Type: string;
  Poster: string;
}

interface TopBarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onToggleFilters: () => void;
  onSearch: (query: string) => Promise<SearchResult[]>;
  onAddItem: (imdbID: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function TopBar({
  viewMode,
  setViewMode,
  onToggleFilters,
  onSearch,
  onAddItem,
  searchInputRef,
  searchQuery,
  onSearchChange,
  hasActiveFilters,
  onClearFilters,
}: TopBarProps) {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    onSearchChange(value);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (value.length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      setShowDropdown(true);
      try {
        const results = await onSearch(value);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [onSearch, onSearchChange]);

  const handleResultClick = useCallback((result: SearchResult) => {
    onAddItem(result.imdbID);
    onSearchChange('');
    setSearchResults([]);
    setShowDropdown(false);
  }, [onAddItem, onSearchChange]);

  const clearSearch = useCallback(() => {
    onSearchChange('');
    setSearchResults([]);
    setShowDropdown(false);
  }, [onSearchChange]);

  const getPosterUrl = (url: string | undefined, width: number = 100): string => {
    if (!url || url === 'N/A') return 'https://via.placeholder.com/100x150?text=No+Poster';
    if (url.includes('media-amazon.com')) {
      return url.replace(/_V1_.*\.jpg$/, `_V1_SX${width}.jpg`);
    }
    return url;
  };

  return (
    <header className="sticky top-0 z-40 h-16 glass border-b border-gray-200/50 dark:border-gray-800/50 flex items-center px-6 gap-4">
      {/* Mobile Logo */}
      <div className="md:hidden text-indigo-600 shrink-0">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="15.5" cy="12" r="7.5" strokeWidth="2" />
          <circle cx="15.5" cy="12" r="3" strokeWidth="1.5" className="text-indigo-500" stroke="currentColor" />
        </svg>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-2xl relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
          <Search size={18} />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search movies, series, people... (Press / to focus)"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => searchQuery.length >= 3 && setShowDropdown(true)}
          className="w-full bg-gray-100/80 dark:bg-gray-900/80 rounded-2xl pl-11 pr-24 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all dark:text-white placeholder:text-gray-400 border border-transparent focus:border-indigo-500/30"
        />
        
        {/* Search Actions */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={14} />
            </button>
          )}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <SlidersHorizontal size={12} />
              Clear
            </button>
          )}
        </div>

        {/* Search Dropdown */}
        {showDropdown && (searchResults.length > 0 || isSearching) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[60vh] overflow-y-auto custom-scrollbar z-50 animate-fade-in-scale">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                  Search Results
                </div>
                {searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleResultClick(item)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors"
                  >
                    <img
                      src={getPosterUrl(item.Poster, 100)}
                      alt={item.Title}
                      className="w-10 h-14 object-cover rounded-lg bg-gray-200 dark:bg-gray-800"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x150?text=No+Poster';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm dark:text-white truncate">{item.Title}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>{item.Year}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="capitalize">{item.Type}</span>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-full hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-1">
                      <Sparkles size={12} />
                      Add
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-lg transition-all',
              viewMode === 'grid' 
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
            title="Grid View (G)"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded-lg transition-all',
              viewMode === 'list' 
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
            title="List View (L)"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={cn(
              'p-2 rounded-lg transition-all',
              viewMode === 'compact' 
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
            title="Compact View"
          >
            <Grid3X3 size={18} />
          </button>
        </div>

        {/* Filters Button */}
        <button
          onClick={onToggleFilters}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-xl transition-all',
            hasActiveFilters
              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
          title="Filters (F)"
        >
          <Filter size={16} />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          )}
        </button>
      </div>
    </header>
  );
}

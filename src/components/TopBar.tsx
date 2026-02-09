import { useState, useRef, useCallback } from 'react';
import { Search, List, LayoutGrid, Filter, X } from 'lucide-react';
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
}

export function TopBar({
  viewMode,
  setViewMode,
  onToggleFilters,
  onSearch,
  onAddItem,
}: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (value.length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await onSearch(value);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }, [onSearch]);

  const handleResultClick = useCallback((result: SearchResult) => {
    onAddItem(result.imdbID);
    setSearchQuery('');
    setSearchResults([]);
  }, [onAddItem]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const getHighResPoster = (url: string | undefined, width: number = 100): string => {
    if (!url || url === 'N/A') return 'https://via.placeholder.com/100x150?text=No+Poster';
    if (url.includes('media-amazon.com')) {
      return url.replace(/_V1_.*\.jpg$/, `_V1_SX${width}.jpg`);
    }
    return url;
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center px-6 gap-6">
      {/* Mobile Logo */}
      <div className="md:hidden text-indigo-600 shrink-0">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 8h3v8H3z" fill="currentColor" fillOpacity="0.15" stroke="none" />
          <circle cx="15.5" cy="12" r="7.5" strokeWidth="2" />
          <circle cx="15.5" cy="12" r="3" strokeWidth="1.5" className="text-indigo-500" stroke="currentColor" />
          <ellipse cx="15.5" cy="12" rx="1.2" ry="1.8" fill="currentColor" className="text-indigo-600" stroke="none" />
        </svg>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-2xl relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search movies, series, people..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full bg-gray-100 dark:bg-gray-900 rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all dark:text-white placeholder:text-gray-400"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={16} />
          </button>
        )}

        {/* Search Dropdown */}
        {(searchResults.length > 0 || isSearching) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[60vh] overflow-y-auto custom-scrollbar z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              searchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleResultClick(item)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors"
                >
                  <img
                    src={getHighResPoster(item.Poster, 100)}
                    alt={item.Title}
                    className="w-8 h-10 object-cover rounded bg-gray-200 dark:bg-gray-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x150?text=No+Poster';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm dark:text-white truncate">{item.Title}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {item.Year} • {item.Type}
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors">
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* View Mode Toggle */}
        <button
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
        >
          {viewMode === 'grid' ? <List size={20} /> : <LayoutGrid size={20} />}
        </button>

        {/* Filters Button */}
        <button
          onClick={onToggleFilters}
          className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Filter size={16} />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>
    </header>
  );
}

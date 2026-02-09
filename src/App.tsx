import { useState, useCallback, useEffect, useRef } from 'react';
import { User, Settings, Moon, Sun, Command, HelpCircle } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { MediaCard } from '@/components/MediaCard';
import { MediaListRow } from '@/components/MediaListRow';
import { FilterDrawer } from '@/components/FilterDrawer';
import { DetailModal } from '@/components/DetailModal';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { AuthModal } from '@/components/AuthModal';
import { SettingsModal } from '@/components/SettingsModal';
import { CustomListsModal } from '@/components/CustomListsModal';
import { RecommendationsPanel } from '@/components/RecommendationsPanel';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { EmptyState } from '@/components/EmptyState';
import { useEnhancedVault } from '@/hooks/useEnhancedVault';
import { useEnhancedFilters } from '@/hooks/useEnhancedFilters';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { VaultItem, ViewMode } from '@/types';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/supabase';

function App() {
  // Vault state
  const {
    vault,
    customLists,
    session,
    loading,
    apiKeys,
    allItems,
    searchOMDB,
    addToVault,
    updateStatus,
    updateRating,
    toggleFavorite,
    markEpisode,
    addTag,
    removeTag,
    createCustomList,
    addToCustomList,
    deleteCustomList,
    removeFromVault,
    exportVault,
    importVault,
    setApiKeys,
  } = useEnhancedVault();

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCustomLists, setShowCustomLists] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const {
    navFilter,
    setNavFilter,
    activeListId,
    setActiveListId,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortOrder,
    toggleSortOrder,
    filterOptions,
    filteredItems,
    hasActiveFilters,
    resetFilters,
  } = useEnhancedFilters(allItems, customLists);

  // Initialize dark mode
  useEffect(() => {
    const saved = localStorage.getItem('vault_dark_mode');
    if (saved !== null) {
      setDarkMode(saved === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vault_dark_mode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: '/',
      handler: () => searchInputRef.current?.focus(),
      description: 'Focus search',
    },
    {
      key: 'g',
      handler: () => setViewMode('grid'),
      description: 'Grid view',
    },
    {
      key: 'l',
      handler: () => setViewMode('list'),
      description: 'List view',
    },
    {
      key: 'f',
      handler: () => setShowFilters(true),
      description: 'Toggle filters',
    },
    {
      key: 'a',
      handler: () => setNavFilter('analytics'),
      description: 'Analytics',
    },
    {
      key: 'w',
      handler: () => setNavFilter('watchlist'),
      description: 'Watchlist',
    },
    {
      key: 's',
      handler: () => setNavFilter('watched'),
      description: 'Watched',
    },
    {
      key: 'h',
      handler: () => setNavFilter('favorites'),
      description: 'Favorites',
    },
    {
      key: 'r',
      handler: () => setShowRecommendations(true),
      description: 'Recommendations',
    },
    {
      key: 'c',
      handler: () => setShowCustomLists(true),
      description: 'Custom lists',
    },
    {
      key: '?',
      handler: () => setShowShortcuts(true),
      description: 'Keyboard shortcuts',
    },
    {
      key: 'Escape',
      handler: () => {
        setSelectedItem(null);
        setShowFilters(false);
        setShowAuth(false);
        setShowSettings(false);
        setShowCustomLists(false);
        setShowShortcuts(false);
        setShowRecommendations(false);
      },
      description: 'Close modals',
    },
  ]);

  // Handlers
  const handleSearch = useCallback(
    async (query: string) => {
      if (query.length < 3) return [];
      return searchOMDB(query);
    },
    [searchOMDB]
  );

  const handleAddItem = useCallback(
    async (imdbID: string) => {
      await addToVault(imdbID, 'watchlist');
    },
    [addToVault]
  );

  const handleUpdateStatus = useCallback(
    (imdbID: string, status: 'watchlist' | 'watched' | 'dropped' | 'on_hold') => {
      updateStatus(imdbID, status);
      if (selectedItem?.imdbID === imdbID) {
        setSelectedItem(null);
      }
    },
    [updateStatus, selectedItem]
  );

  const handleUpdateRating = useCallback(
    (imdbID: string, rating: number) => {
      updateRating(imdbID, rating);
      if (selectedItem?.imdbID === imdbID) {
        setSelectedItem((prev) =>
          prev
            ? {
                ...prev,
                userMeta: {
                  ...prev.userMeta,
                  ratings: { ...prev.userMeta.ratings, overall: rating },
                },
              }
            : null
        );
      }
    },
    [updateRating, selectedItem]
  );

  const handleMarkEpisode = useCallback(
    (imdbID: string, season: number, episode: number, watched: boolean) => {
      markEpisode(imdbID, season, episode, watched);
      if (selectedItem?.imdbID === imdbID) {
        const item = vault.watched[imdbID] || vault.watchlist[imdbID] || vault.dropped[imdbID] || vault.onHold[imdbID];
        if (item) setSelectedItem(item);
      }
    },
    [markEpisode, selectedItem, vault]
  );

  const handleImport = useCallback(
    async (data: string) => {
      return importVault(data);
    },
    [importVault]
  );

  const handleClear = useCallback(() => {
    localStorage.removeItem('vault_v7_data');
    localStorage.removeItem('vault_custom_lists');
    localStorage.removeItem('vault_activities');
    window.location.reload();
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    window.location.reload();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading your vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-screen flex', darkMode ? 'dark' : '')}>
      {/* Sidebar */}
      <Sidebar
        active={navFilter}
        onChange={setNavFilter}
        customLists={customLists}
        onListSelect={(id) => {
          setActiveListId(id);
          setNavFilter('custom_list');
        }}
        activeListId={activeListId}
        itemCounts={{
          all: allItems.length,
          watched: Object.keys(vault.watched).length,
          watchlist: Object.keys(vault.watchlist).length,
          dropped: Object.keys(vault.dropped).length,
          onHold: Object.keys(vault.onHold).length,
          favorites: allItems.filter((i) => i.userMeta.favorite).length,
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        {/* Top Bar */}
        <TopBar
          viewMode={viewMode}
          setViewMode={setViewMode}
          onToggleFilters={() => setShowFilters(true)}
          onSearch={handleSearch}
          onAddItem={handleAddItem}
          searchInputRef={searchInputRef}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={resetFilters}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
          {navFilter === 'analytics' ? (
            <AnalyticsDashboard items={allItems} />
          ) : filteredItems.length === 0 ? (
            <EmptyState searchQuery={searchQuery} />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 pb-20">
              {filteredItems.map((item, idx) => (
                <div key={item.imdbID} className={`animate-fade-in stagger-${(idx % 5) + 1}`}>
                  <MediaCard item={item} onClick={() => setSelectedItem(item)} />
                </div>
              ))}
            </div>
          ) : viewMode === 'list' ? (
            <div className="flex flex-col gap-3 pb-20 max-w-5xl mx-auto">
              {filteredItems.map((item, idx) => (
                <div key={item.imdbID} className={`animate-fade-in stagger-${(idx % 5) + 1}`}>
                  <MediaListRow item={item} onOpen={() => setSelectedItem(item)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 pb-20">
              {filteredItems.map((item, idx) => (
                <div key={item.imdbID} className={`animate-fade-in stagger-${(idx % 5) + 1}`}>
                  <MediaCard item={item} onClick={() => setSelectedItem(item)} compact />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        setFilters={setFilters}
        filterOptions={filterOptions}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        toggleSortOrder={toggleSortOrder}
      />

      {/* Detail Modal */}
      <DetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdateStatus={handleUpdateStatus}
        onUpdateRating={handleUpdateRating}
        onMarkEpisode={handleMarkEpisode}
        onRemove={removeFromVault}
        onToggleFavorite={toggleFavorite}
        onAddTag={addTag}
        onRemoveTag={removeTag}
        onAddToList={addToCustomList}
        customLists={customLists}
      />

      {/* Auth Modal */}
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onLogin={() => {}} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onExport={exportVault}
        onImport={handleImport}
        onClear={handleClear}
        apiKeys={apiKeys}
        onUpdateApiKeys={setApiKeys}
        session={session}
        onSignOut={handleSignOut}
      />

      {/* Custom Lists Modal */}
      <CustomListsModal
        isOpen={showCustomLists}
        onClose={() => setShowCustomLists(false)}
        lists={customLists}
        onCreateList={createCustomList}
        onDeleteList={deleteCustomList}
        onSelectList={(id) => {
          setActiveListId(id);
          setNavFilter('custom_list');
          setShowCustomLists(false);
        }}
      />

      {/* Recommendations Panel */}
      <RecommendationsPanel
        isOpen={showRecommendations}
        onClose={() => setShowRecommendations(false)}
        items={allItems}
        onAddItem={handleAddItem}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        {/* Keyboard Shortcuts */}
        <button
          onClick={() => setShowShortcuts(true)}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur text-gray-600 dark:text-gray-400 p-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <HelpCircle size={20} />
        </button>

        {/* Recommendations */}
        <button
          onClick={() => setShowRecommendations(true)}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur text-gray-600 dark:text-gray-400 p-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          title="Recommendations (R)"
        >
          <Command size={20} />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur text-gray-600 dark:text-gray-400 p-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          title={darkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur text-gray-600 dark:text-gray-400 p-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          title="Settings"
        >
          <Settings size={20} />
        </button>

        {/* Auth */}
        {!session && (
          <button
            onClick={() => setShowAuth(true)}
            className="bg-indigo-600 text-white p-3 rounded-full shadow-lg shadow-indigo-600/30 hover:scale-110 transition-transform"
            title="Sign In"
          >
            <User size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

export default App;

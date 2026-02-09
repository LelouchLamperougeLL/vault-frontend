import { useState, useCallback, useEffect } from 'react';
import { User, Settings, Moon, Sun } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { MediaCard } from '@/components/MediaCard';
import { MediaListRow } from '@/components/MediaListRow';
import { FilterDrawer } from '@/components/FilterDrawer';
import { DetailModal } from '@/components/DetailModal';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { AuthModal } from '@/components/AuthModal';
import { SettingsModal } from '@/components/SettingsModal';
import { EmptyState } from '@/components/EmptyState';
import { useVault } from '@/hooks/useVault';
import { useVaultFilters } from '@/hooks/useFilters';
import type { VaultItem, ViewMode } from '@/types';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/supabase';

function App() {
  // Vault state
  const {
    vault,
    session,
    loading,
    apiKeys,
    allItems,
    searchOMDB,
    addToVault,
    updateStatus,
    updateRating,
    markEpisode,
    removeFromVault,
    exportVault,
    importVault,
    setApiKeys,
  } = useVault();

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  // Filters
  const {
    navFilter,
    setNavFilter,
    searchQuery,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortOrder,
    toggleSortOrder,
    filterOptions,
    filteredItems,
  } = useVaultFilters(allItems);

  // Initialize dark mode
  useEffect(() => {
    const saved = localStorage.getItem('vault_dark_mode');
    if (saved !== null) {
      setDarkMode(saved === 'true');
    }
  }, []);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('vault_dark_mode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle search from top bar
  const handleSearch = useCallback(
    async (query: string) => {
      if (query.length < 3) return [];
      return searchOMDB(query);
    },
    [searchOMDB]
  );

  // Handle adding item from search
  const handleAddItem = useCallback(
    async (imdbID: string) => {
      await addToVault(imdbID, 'watchlist');
    },
    [addToVault]
  );

  // Handle status update
  const handleUpdateStatus = useCallback(
    (imdbID: string, status: 'watchlist' | 'watched') => {
      updateStatus(imdbID, status);
      if (selectedItem?.imdbID === imdbID) {
        setSelectedItem(null);
      }
    },
    [updateStatus, selectedItem]
  );

  // Handle rating update
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

  // Handle episode marking
  const handleMarkEpisode = useCallback(
    (imdbID: string, season: number, episode: number, watched: boolean) => {
      markEpisode(imdbID, season, episode, watched);
      if (selectedItem?.imdbID === imdbID) {
        // Refresh selected item
        const item = vault.watched[imdbID] || vault.watchlist[imdbID];
        if (item) setSelectedItem(item);
      }
    },
    [markEpisode, selectedItem, vault]
  );

  // Handle import
  const handleImport = useCallback(
    async (data: string) => {
      return importVault(data);
    },
    [importVault]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    localStorage.removeItem('vault_v6_data');
    window.location.reload();
  }, []);

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    await signOut();
    window.location.reload();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading your vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-screen flex', darkMode ? 'dark' : '')}>
      {/* Sidebar */}
      <Sidebar active={navFilter} onChange={setNavFilter} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-950">
        {/* Top Bar */}
        <TopBar
          viewMode={viewMode}
          setViewMode={setViewMode}
          onToggleFilters={() => setShowFilters(true)}
          onSearch={handleSearch}
          onAddItem={handleAddItem}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {navFilter === 'analytics' ? (
            <AnalyticsDashboard items={allItems} />
          ) : filteredItems.length === 0 ? (
            <EmptyState searchQuery={searchQuery} />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 pb-20 animate-in fade-in">
              {filteredItems.map((item) => (
                <MediaCard key={item.imdbID} item={item} onClick={() => setSelectedItem(item)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3 pb-20 animate-in fade-in max-w-5xl mx-auto">
              {filteredItems.map((item) => (
                <MediaListRow key={item.imdbID} item={item} onOpen={() => setSelectedItem(item)} />
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

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 p-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 p-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
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

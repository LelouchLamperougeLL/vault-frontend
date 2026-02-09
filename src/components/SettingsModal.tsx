import { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  Trash2, 
  Database, 
  Key,
  Cloud,
  CheckCircle,
  AlertCircle,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (data: string) => Promise<boolean>;
  onClear: () => void;
  apiKeys: { omdb: string; tmdb: string; rapid: string };
  onUpdateApiKeys: (keys: { omdb: string; tmdb: string; rapid: string }) => void;
  session: any;
  onSignOut: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  onExport,
  onImport,
  onClear,
  apiKeys,
  onUpdateApiKeys,
  session,
  onSignOut,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'api' | 'data' | 'profile'>('general');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [localApiKeys, setLocalApiKeys] = useState(apiKeys);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await onImport(content);
      setImportStatus(success ? 'success' : 'error');
      setTimeout(() => setImportStatus('idle'), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveApiKeys = () => {
    onUpdateApiKeys(localApiKeys);
    alert('API keys saved successfully!');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Database },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'data', label: 'Data', icon: Cloud },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <Database size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-black dark:text-white">Settings</h2>
              <p className="text-xs text-gray-500">Customize your experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Cloud Sync Status */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-xl p-5 border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex items-center gap-3 mb-3">
                  <Cloud size={20} className="text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold dark:text-white">Cloud Sync</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {session 
                    ? `Signed in as ${session.user.email}` 
                    : 'Sign in to sync your library across all your devices'}
                </p>
                {session ? (
                  <button
                    onClick={onSignOut}
                    className="px-4 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg text-sm font-bold hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
                  >
                    Sign Out
                  </button>
                ) : (
                  <p className="text-xs text-gray-500">Use the user icon in the bottom right to sign in</p>
                )}
              </div>

              {/* About */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5">
                <h3 className="font-bold dark:text-white mb-2">About The Vault</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  The Vault is your ultimate movie and TV series tracker. Keep track of what you've watched,
                  rate your favorites, discover new content, and organize your collection with custom lists.
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                  <span>Version 2.0</span>
                  <span>•</span>
                  <span>Made with ❤️</span>
                </div>
              </div>
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-200 dark:border-amber-900/30">
                <p className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>These keys are used to fetch movie and series data. Default keys are provided, but you can use your own for better rate limits.</span>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">OMDb API Key</label>
                  <input
                    type="text"
                    value={localApiKeys.omdb}
                    onChange={(e) => setLocalApiKeys({ ...localApiKeys, omdb: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Enter OMDb API key"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">TMDB API Key</label>
                  <input
                    type="text"
                    value={localApiKeys.tmdb}
                    onChange={(e) => setLocalApiKeys({ ...localApiKeys, tmdb: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Enter TMDB API key"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">RapidAPI Key</label>
                  <input
                    type="text"
                    value={localApiKeys.rapid}
                    onChange={(e) => setLocalApiKeys({ ...localApiKeys, rapid: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Enter RapidAPI key"
                  />
                </div>

                <button
                  onClick={handleSaveApiKeys}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition-colors"
                >
                  Save API Keys
                </button>
              </div>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              {/* Export */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Download size={20} className="text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold dark:text-white">Backup Library</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Export your entire library as a JSON file for backup
                </p>
                <button
                  onClick={onExport}
                  className="w-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold py-2.5 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Export Data
                </button>
              </div>

              {/* Import */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Upload size={20} className="text-green-600 dark:text-green-400" />
                  <h3 className="font-bold dark:text-white">Restore Library</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Import a previously exported backup file
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImport}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-bold py-2.5 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={16} />
                  Import Data
                </button>
                {importStatus === 'success' && (
                  <p className="mt-3 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle size={14} /> Import successful!
                  </p>
                )}
                {importStatus === 'error' && (
                  <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> Import failed. Please check the file.
                  </p>
                )}
              </div>

              {/* Clear Data */}
              <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-5 border border-red-200 dark:border-red-900/30">
                <div className="flex items-center gap-3 mb-3">
                  <Trash2 size={20} className="text-red-600 dark:text-red-400" />
                  <h3 className="font-bold text-red-700 dark:text-red-400">Clear All Data</h3>
                </div>
                <p className="text-sm text-red-600/70 dark:text-red-400/70 mb-4">
                  This will permanently delete all your library data. This action cannot be undone.
                </p>
                {!showClearConfirm ? (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-2.5 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    Clear Data
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onClear();
                        setShowClearConfirm(false);
                      }}
                      className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {session ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User size={36} className="text-white" />
                  </div>
                  <h3 className="font-bold text-lg dark:text-white">{session.user.email}</h3>
                  <p className="text-sm text-gray-500 mt-1">Your profile is synced to the cloud</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User size={36} className="text-gray-400" />
                  </div>
                  <h3 className="font-bold text-lg dark:text-white">Guest User</h3>
                  <p className="text-sm text-gray-500 mt-1">Sign in to sync your data across devices</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

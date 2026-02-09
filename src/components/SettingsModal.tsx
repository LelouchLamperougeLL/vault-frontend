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
  AlertCircle
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
  const [activeTab, setActiveTab] = useState<'general' | 'api' | 'data'>('general');
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
    alert('API keys saved!');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Database },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'data', label: 'Data', icon: Cloud },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-black dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
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
              <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Cloud size={20} className="text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold dark:text-white">Cloud Sync</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {session 
                    ? `Signed in as ${session.user.email}` 
                    : 'Sign in to sync your library across devices'}
                </p>
                {session ? (
                  <button
                    onClick={onSignOut}
                    className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    Sign Out
                  </button>
                ) : (
                  <p className="text-xs text-gray-500">Use the user icon in the bottom right to sign in</p>
                )}
              </div>

              {/* About */}
              <div>
                <h3 className="font-bold dark:text-white mb-2">About The Vault</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The Vault is your personal movie and TV series tracker. Keep track of what you've watched,
                  rate your favorites, and discover new content.
                </p>
              </div>
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-4 mb-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  <AlertCircle size={16} className="inline mr-2" />
                  These keys are used to fetch movie and series data. Default keys are provided,
                  but you can use your own for better rate limits.
                </p>
              </div>

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
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              {/* Export */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Download size={20} className="text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold dark:text-white">Backup Library</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Export your entire library as a JSON file for backup
                </p>
                <button
                  onClick={onExport}
                  className="w-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold py-2 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  Export Data
                </button>
              </div>

              {/* Import */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Upload size={20} className="text-green-600 dark:text-green-400" />
                  <h3 className="font-bold dark:text-white">Restore Library</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
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
                  className="w-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-bold py-2 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                >
                  Import Data
                </button>
                {importStatus === 'success' && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle size={14} /> Import successful!
                  </p>
                )}
                {importStatus === 'error' && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> Import failed. Please check the file.
                  </p>
                )}
              </div>

              {/* Clear Data */}
              <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Trash2 size={20} className="text-red-600 dark:text-red-400" />
                  <h3 className="font-bold text-red-700 dark:text-red-400">Clear All Data</h3>
                </div>
                <p className="text-sm text-red-600/70 dark:text-red-400/70 mb-3">
                  This will permanently delete all your library data
                </p>
                {!showClearConfirm ? (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    Clear Data
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onClear();
                        setShowClearConfirm(false);
                      }}
                      className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

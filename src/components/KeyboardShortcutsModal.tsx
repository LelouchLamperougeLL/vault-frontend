import { X, Keyboard } from 'lucide-react';
import { getShortcutDisplay } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: { key: string; label: string; ctrl?: boolean; shift?: boolean; alt?: boolean }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { key: '/', label: 'Focus search' },
      { key: 'a', label: 'Go to Analytics' },
      { key: 'w', label: 'Go to Watchlist' },
      { key: 's', label: 'Go to Watched' },
      { key: 'h', label: 'Go to Favorites' },
      { key: 'r', label: 'Open Recommendations' },
      { key: 'c', label: 'Open Custom Lists' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { key: 'g', label: 'Grid view' },
      { key: 'l', label: 'List view' },
      { key: 'f', label: 'Toggle filters' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { key: '?', label: 'Show this help' },
      { key: 'Escape', label: 'Close modal / Reset' },
    ],
  },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <Keyboard size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-black dark:text-white">Keyboard Shortcuts</h2>
              <p className="text-xs text-gray-500">Work faster with hotkeys</p>
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
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.key + shortcut.label}
                    className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">{shortcut.label}</span>
                    <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-xs font-mono font-bold text-gray-600 dark:text-gray-300 shadow-sm">
                      {getShortcutDisplay(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
          <p className="text-xs text-center text-gray-500">
            Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-[10px] font-mono">?</kbd> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  );
}

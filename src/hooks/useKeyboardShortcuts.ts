import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    shortcuts.forEach((shortcut) => {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrl === event.ctrlKey || event.metaKey;
      const shiftMatch = !!shortcut.shift === event.shiftKey;
      const altMatch = !!shortcut.alt === event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        shortcut.handler();
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Common shortcuts
export const COMMON_SHORTCUTS = {
  search: { key: '/', description: 'Focus search' },
  newItem: { key: 'n', description: 'Add new item' },
  gridView: { key: 'g', description: 'Grid view' },
  listView: { key: 'l', description: 'List view' },
  filters: { key: 'f', description: 'Toggle filters' },
  analytics: { key: 'a', description: 'Analytics' },
  watchlist: { key: 'w', description: 'Watchlist' },
  watched: { key: 's', description: 'Watched' },
  favorites: { key: 'h', description: 'Favorites' },
  settings: { key: ',', ctrl: true, description: 'Settings' },
  escape: { key: 'Escape', description: 'Close modal/reset' },
};

export function getShortcutDisplay(shortcut: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean }): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  parts.push(shortcut.key.toUpperCase());
  return parts.join('+');
}

import { useState } from 'react';
import { X, Plus, List, Trash2, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CustomList } from '@/types';

interface CustomListsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lists: CustomList[];
  onCreateList: (name: string, description: string, color: string) => string;
  onDeleteList: (listId: string) => void;
  onSelectList: (listId: string) => void;
}

const LIST_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

export function CustomListsModal({
  isOpen,
  onClose,
  lists,
  onCreateList,
  onDeleteList,
  onSelectList,
}: CustomListsModalProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(LIST_COLORS[0]);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!newListName.trim()) return;
    onCreateList(newListName.trim(), newListDescription.trim(), selectedColor);
    setNewListName('');
    setNewListDescription('');
    setShowCreateForm(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <List size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-black dark:text-white">Custom Lists</h2>
              <p className="text-xs text-gray-500">Organize your collection</p>
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
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
          {/* Create Button */}
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Plus size={18} />
              Create New List
            </button>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">List Name</label>
                <input
                  type="text"
                  placeholder="e.g., Movie Night Picks"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description (optional)</label>
                <input
                  type="text"
                  placeholder="Short description..."
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {LIST_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        selectedColor === color && 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newListName.trim()}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create List
                </button>
              </div>
            </div>
          )}

          {/* Lists */}
          {lists.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Lists</p>
              {lists.map((list) => (
                <div
                  key={list.id}
                  className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${list.color}20` }}
                  >
                    <Bookmark size={18} style={{ color: list.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm dark:text-white truncate">{list.name}</h3>
                    {list.description && (
                      <p className="text-xs text-gray-500 truncate">{list.description}</p>
                    )}
                    <p className="text-xs text-gray-400">{list.items.length} items</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onSelectList(list.id)}
                      className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                      title="View List"
                    >
                      <List size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteList(list.id)}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete List"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

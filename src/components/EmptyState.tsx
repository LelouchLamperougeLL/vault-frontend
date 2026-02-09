import { Search, Film, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  searchQuery?: string;
}

export function EmptyState({ searchQuery }: EmptyStateProps) {
  if (searchQuery) {
    return (
      <div className="h-full flex flex-col items-center justify-center opacity-60 pb-32">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <Search size={32} className="text-gray-400" strokeWidth={1.5} />
        </div>
        <p className="text-xl font-bold text-gray-900 dark:text-white">No results found</p>
        <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
          Try adjusting your filters or search with different keywords
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center pb-32">
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
          <Film size={40} className="text-indigo-500" strokeWidth={1.5} />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
          <Sparkles size={18} className="text-white" />
        </div>
      </div>
      
      <p className="text-2xl font-black text-gray-900 dark:text-white">Your vault is empty</p>
      <p className="text-sm text-gray-500 mt-3 text-center max-w-md leading-relaxed">
        Start building your collection by searching for movies and TV series in the search bar above
      </p>
      
      <div className="flex items-center gap-2 mt-6 text-xs text-gray-400">
        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Press</span>
        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono">/</kbd>
        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">to search</span>
      </div>
    </div>
  );
}

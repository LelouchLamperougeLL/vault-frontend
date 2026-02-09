import { Layers, Search, Film } from 'lucide-react';

interface EmptyStateProps {
  searchQuery?: string;
}

export function EmptyState({ searchQuery }: EmptyStateProps) {
  if (searchQuery) {
    return (
      <div className="h-full flex flex-col items-center justify-center opacity-60 animate-in fade-in pb-32">
        <Search size={48} className="mb-4 text-gray-300 dark:text-gray-600" strokeWidth={1} />
        <p className="text-lg font-bold text-gray-900 dark:text-white">No results found</p>
        <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center opacity-60 animate-in fade-in pb-32">
      <div className="relative mb-6">
        <Layers size={64} className="text-gray-300 dark:text-gray-600" strokeWidth={1} />
        <Film 
          size={24} 
          className="absolute bottom-0 right-0 text-indigo-500" 
          strokeWidth={2}
        />
      </div>
      <p className="text-lg font-bold text-gray-900 dark:text-white">Your vault is empty</p>
      <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
        Start building your collection by searching for movies and TV series in the search bar above
      </p>
    </div>
  );
}

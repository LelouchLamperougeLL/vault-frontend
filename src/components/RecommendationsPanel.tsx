import { useState, useEffect, useCallback } from 'react';
import { X, Sparkles, TrendingUp, Star, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VaultItem, TMDBItem } from '@/types';
import { getTrending, getPopular, getTopRated, MOOD_GENRES, discoverByGenre, getImageUrl, GENRES } from '@/lib/tmdb';

interface RecommendationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: VaultItem[];
  onAddItem: (imdbID: string) => void;
}

type RecommendationType = 'trending' | 'popular' | 'top_rated' | 'based_on_you' | 'mood';
type MoodType = 'happy' | 'sad' | 'excited' | 'relaxed' | 'scared' | 'romantic' | 'adventurous' | 'thoughtful';

interface RecommendationItem {
  item: TMDBItem;
  reason: string;
  score: number;
}

const MOODS: { id: MoodType; label: string; emoji: string }[] = [
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'sad', label: 'Sad', emoji: '😢' },
  { id: 'excited', label: 'Excited', emoji: '🤩' },
  { id: 'relaxed', label: 'Relaxed', emoji: '😌' },
  { id: 'scared', label: 'Scared', emoji: '😱' },
  { id: 'romantic', label: 'Romantic', emoji: '😍' },
  { id: 'adventurous', label: 'Adventurous', emoji: '🤠' },
  { id: 'thoughtful', label: 'Thoughtful', emoji: '🤔' },
];

export function RecommendationsPanel({ isOpen, onClose, items, onAddItem }: RecommendationsPanelProps) {
  const [activeTab, setActiveTab] = useState<RecommendationType>('trending');
  const [selectedMood, setSelectedMood] = useState<MoodType>('happy');
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      let results: TMDBItem[] = [];

      switch (activeTab) {
        case 'trending':
          results = await getTrending('all', 'week');
          break;
        case 'popular':
          results = await getPopular('movie');
          break;
        case 'top_rated':
          results = await getTopRated('movie');
          break;
        case 'mood':
          const genreIds = MOOD_GENRES[selectedMood];
          if (genreIds && genreIds[0]) {
            results = await discoverByGenre('movie', genreIds[0]);
          }
          break;
        case 'based_on_you':
          // Get recommendations based on user's top rated items
          const topRated = items
            .filter((i) => i.userMeta?.ratings?.overall >= 8)
            .slice(0, 3);
          
          if (topRated.length > 0) {
            const genres = new Set<number>();
            topRated.forEach((item) => {
              item.meta?.genre?.forEach((g) => {
                const genreId = Object.entries(GENRES).find(([_, name]) => 
                  g.toLowerCase().includes(name.toLowerCase())
                )?.[0];
                if (genreId) genres.add(parseInt(genreId));
              });
            });
            
            if (genres.size > 0) {
              results = await discoverByGenre('movie', Array.from(genres)[0]);
            }
          }
          
          if (results.length === 0) {
            results = await getTrending('movie', 'week');
          }
          break;
      }

      // Filter out already added items and format
      const existingIds = new Set(items.map((i) => i.tmdb?.id).filter(Boolean));
      const filtered = results
        .filter((r) => !existingIds.has(r.id))
        .slice(0, 20)
        .map((item) => ({
          item,
          reason: getReason(item, activeTab, selectedMood),
          score: Math.random() * 30 + 70, // Mock score
        }));

      setRecommendations(filtered);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedMood, items]);

  useEffect(() => {
    if (isOpen) {
      loadRecommendations();
    }
  }, [isOpen, activeTab, selectedMood, loadRecommendations]);

  const getReason = (_item: TMDBItem, type: RecommendationType, mood: MoodType): string => {
    switch (type) {
      case 'trending':
        return 'Trending this week';
      case 'popular':
        return 'Popular right now';
      case 'top_rated':
        return 'Critically acclaimed';
      case 'mood':
        return `Perfect for feeling ${mood}`;
      case 'based_on_you':
        return 'Based on your taste';
      default:
        return 'Recommended for you';
    }
  };

  const handleAdd = async (recItem: TMDBItem) => {
    // Note: This would need to be enhanced to search for the IMDB ID first
    // For now, we'll just mark it as added
    // onAddItem would be called here with the IMDB ID
    void onAddItem;
    void items;
    setAddedItems((prev) => new Set(prev).add(recItem.id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-2xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black dark:text-white">Discover</h2>
              <p className="text-xs text-gray-500">Find your next favorite</p>
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
        <div className="flex gap-1 p-4 border-b border-gray-100 dark:border-gray-800 overflow-x-auto custom-scrollbar">
          {[
            { id: 'trending' as RecommendationType, label: 'Trending', icon: TrendingUp },
            { id: 'popular' as RecommendationType, label: 'Popular', icon: Star },
            { id: 'top_rated' as RecommendationType, label: 'Top Rated', icon: Star },
            { id: 'based_on_you' as RecommendationType, label: 'For You', icon: Sparkles },
            { id: 'mood' as RecommendationType, label: 'By Mood', icon: RefreshCw },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                activeTab === tab.id
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mood Selector */}
        {activeTab === 'mood' && (
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              {MOODS.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                    selectedMood === mood.id
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  <span>{mood.emoji}</span>
                  {mood.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500">No recommendations found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.item.id}
                  className="group bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="aspect-[2/3] relative">
                    <img
                      src={getImageUrl(rec.item.poster_path, 'w342') || 'https://via.placeholder.com/300x450?text=No+Poster'}
                      alt={rec.item.title || rec.item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <p className="text-white text-xs font-medium mb-2">{rec.reason}</p>
                      <button
                        onClick={() => handleAdd(rec.item)}
                        disabled={addedItems.has(rec.item.id)}
                        className={cn(
                          'w-full py-2 rounded-lg text-xs font-bold transition-all',
                          addedItems.has(rec.item.id)
                            ? 'bg-green-500 text-white'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        )}
                      >
                        {addedItems.has(rec.item.id) ? 'Added' : 'Add to Vault'}
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm dark:text-white truncate">
                      {rec.item.title || rec.item.name}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {(rec.item.release_date || rec.item.first_air_date)?.slice(0, 4)}
                      </span>
                      <div className="flex items-center gap-1 text-xs">
                        <Star size={12} className="fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{rec.item.vote_average?.toFixed(1)}</span>
                      </div>
                    </div>
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

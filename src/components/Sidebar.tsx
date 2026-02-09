import { 
  Layers, 
  CheckCircle, 
  Clock, 
  FastForward, 
  Star, 
  Repeat, 
  Globe, 
  Play,
  BarChart3,
  Film,
  Heart,
  XCircle,
  Pause,
  Bookmark
} from 'lucide-react';
import type { NavFilter, CustomList } from '@/types';
import { cn } from '@/lib/utils';

interface SidebarProps {
  active: NavFilter;
  onChange: (filter: NavFilter) => void;
  customLists: CustomList[];
  onListSelect: (listId: string) => void;
  activeListId: string | null;
  itemCounts: {
    all: number;
    watched: number;
    watchlist: number;
    dropped: number;
    onHold: number;
    favorites: number;
  };
}

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  children: React.ReactNode;
  count?: number;
  badge?: string;
}

const NavItem = ({ active, onClick, icon: Icon, children, count, badge }: NavItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 group relative',
      active
        ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
    )}
  >
    <Icon 
      size={18} 
      strokeWidth={2} 
      className={cn(
        'transition-colors',
        active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
      )} 
    />
    <span className="flex-1">{children}</span>
    {count !== undefined && count > 0 && (
      <span className={cn(
        'text-xs font-bold px-2 py-0.5 rounded-full',
        active 
          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
      )}>
        {count}
      </span>
    )}
    {badge && (
      <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </button>
);

// Vault Logo
const VaultLogo = ({ size = 40 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <defs>
      <linearGradient id="vaultGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
    <path d="M3 8h3v8H3z" fill="url(#vaultGradient)" fillOpacity="0.2" stroke="none" />
    <path d="M3 8v8" stroke="url(#vaultGradient)" />
    <path d="M6 8v8" stroke="url(#vaultGradient)" />
    <circle cx="15.5" cy="12" r="7.5" strokeWidth="2" stroke="url(#vaultGradient)" />
    <circle cx="15.5" cy="12" r="6" strokeWidth="1" strokeDasharray="0.5 2" className="opacity-50" stroke="url(#vaultGradient)" />
    <circle cx="15.5" cy="12" r="3" strokeWidth="1.5" fill="url(#vaultGradient)" stroke="none" />
    <path d="M15.5 9V6" stroke="url(#vaultGradient)" />
    <path d="M15.5 15v3" stroke="url(#vaultGradient)" />
    <path d="M12.5 12H9.5" stroke="url(#vaultGradient)" />
    <path d="M18.5 12h3" stroke="url(#vaultGradient)" />
    <ellipse cx="15.5" cy="12" rx="1.2" ry="1.8" fill="white" stroke="none" />
  </svg>
);

export function Sidebar({ 
  active, 
  onChange, 
  customLists, 
  onListSelect, 
  activeListId,
  itemCounts 
}: SidebarProps) {
  const libraryItems = [
    { id: 'all' as NavFilter, label: 'All Items', icon: Layers, count: itemCounts.all },
    { id: 'watched' as NavFilter, label: 'Watched', icon: CheckCircle, count: itemCounts.watched },
    { id: 'watchlist' as NavFilter, label: 'Watchlist', icon: Clock, count: itemCounts.watchlist },
    { id: 'favorites' as NavFilter, label: 'Favorites', icon: Heart, count: itemCounts.favorites },
    { id: 'resume' as NavFilter, label: 'Resume', icon: FastForward },
  ];

  const statusItems = [
    { id: 'dropped' as NavFilter, label: 'Dropped', icon: XCircle, count: itemCounts.dropped },
    { id: 'on_hold' as NavFilter, label: 'On Hold', icon: Pause, count: itemCounts.onHold },
  ];

  const smartLists = [
    { id: 'top_rated' as NavFilter, label: 'Top Rated', icon: Star },
    { id: 'rewatch' as NavFilter, label: 'Rewatch', icon: Repeat },
    { id: 'foreign' as NavFilter, label: 'Foreign', icon: Globe },
    { id: 'progress' as NavFilter, label: 'In Progress', icon: Play },
  ];

  return (
    <aside className="w-72 border-r border-gray-200 dark:border-gray-800/50 p-4 space-y-6 flex flex-col h-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl hidden md:flex">
      {/* Logo */}
      <div className="px-3 py-2">
        <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <VaultLogo size={40} />
          <span className="gradient-text">THE VAULT</span>
        </h1>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-1">
        {/* Analytics */}
        <div>
          <NavItem active={active === 'analytics'} onClick={() => onChange('analytics')} icon={BarChart3}>
            Analytics
          </NavItem>
        </div>

        {/* Library Section */}
        <div>
          <p className="px-3 text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">
            Library
          </p>
          <div className="space-y-1">
            {libraryItems.map((item) => (
              <NavItem
                key={item.id}
                active={active === item.id}
                onClick={() => onChange(item.id)}
                icon={item.icon}
                count={item.count}
              >
                {item.label}
              </NavItem>
            ))}
          </div>
        </div>

        {/* Status Section */}
        <div>
          <p className="px-3 text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">
            Status
          </p>
          <div className="space-y-1">
            {statusItems.map((item) => (
              <NavItem
                key={item.id}
                active={active === item.id}
                onClick={() => onChange(item.id)}
                icon={item.icon}
                count={item.count}
              >
                {item.label}
              </NavItem>
            ))}
          </div>
        </div>

        {/* Smart Lists Section */}
        <div>
          <p className="px-3 text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">
            Smart Lists
          </p>
          <div className="space-y-1">
            {smartLists.map((item) => (
              <NavItem
                key={item.id}
                active={active === item.id}
                onClick={() => onChange(item.id)}
                icon={item.icon}
              >
                {item.label}
              </NavItem>
            ))}
          </div>
        </div>

        {/* Custom Lists */}
        {customLists.length > 0 && (
          <div>
            <p className="px-3 text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">
              My Lists
            </p>
            <div className="space-y-1">
              {customLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => onListSelect(list.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-3 group',
                    activeListId === list.id
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                  )}
                >
                  <Bookmark 
                    size={16} 
                    className={cn(
                      activeListId === list.id ? 'text-indigo-500' : 'text-gray-400'
                    )}
                    style={{ color: activeListId === list.id ? list.color : undefined }}
                  />
                  <span className="flex-1 truncate">{list.name}</span>
                  <span className="text-xs text-gray-400">{list.items.length}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-800/50">
        <div className="px-3 text-xs text-gray-400 flex items-center gap-2">
          <Film size={14} className="text-indigo-500" />
          <span>Track. Rate. Discover.</span>
        </div>
      </div>
    </aside>
  );
}

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
  Film
} from 'lucide-react';
import type { NavFilter } from '@/types';
import { cn } from '@/lib/utils';

interface SidebarProps {
  active: NavFilter;
  onChange: (filter: NavFilter) => void;
}

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  children: React.ReactNode;
}

const NavItem = ({ active, onClick, icon: Icon, children }: NavItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-3',
      active
        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    )}
  >
    <Icon size={16} strokeWidth={2} className={active ? 'text-indigo-600 dark:text-indigo-400' : 'opacity-70'} />
    {children}
  </button>
);

// Custom Vault Logo
const VaultLogo = ({ size = 48 }: { size?: number }) => (
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
    {/* Hinge Mechanism */}
    <path d="M3 8h3v8H3z" fill="currentColor" fillOpacity="0.15" stroke="none" />
    <path d="M3 8v8" />
    <path d="M6 8v8" />
    <path d="M6 10h1" />
    <path d="M6 14h1" />
    
    {/* Main Vault Body */}
    <circle cx="15.5" cy="12" r="7.5" strokeWidth="2" />
    <circle cx="15.5" cy="12" r="6" strokeWidth="1" strokeDasharray="0.5 2" className="opacity-50" />
    
    {/* Central Hub Ring */}
    <circle cx="15.5" cy="12" r="3" strokeWidth="1.5" className="text-indigo-500" stroke="currentColor" />
    
    {/* Radial Spokes */}
    <path d="M15.5 9V6" />
    <path d="M15.5 15v3" />
    <path d="M12.5 12H9.5" />
    <path d="M18.5 12h3" />
    <path d="M13.38 9.88L11.26 7.76" />
    <path d="M17.62 14.12L19.74 16.24" />
    <path d="M13.38 14.12L11.26 16.24" />
    <path d="M17.62 9.88L19.74 7.76" />
    
    {/* Brand Identity: Central Bean/Slit */}
    <ellipse cx="15.5" cy="12" rx="1.2" ry="1.8" fill="currentColor" className="text-indigo-600 dark:text-indigo-400" stroke="none" />
    <path d="M15.5 10.8c0.2 0 0.5 0.5 0.5 1.2c0 0.8 -0.3 1.2 -0.6 1.2" stroke="white" className="dark:stroke-gray-900" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

export function Sidebar({ active, onChange }: SidebarProps) {
  const navItems = [
    { id: 'all' as NavFilter, label: 'All Items', icon: Layers },
    { id: 'watched' as NavFilter, label: 'Watched', icon: CheckCircle },
    { id: 'watchlist' as NavFilter, label: 'Watchlist', icon: Clock },
    { id: 'resume' as NavFilter, label: 'Resume Watching', icon: FastForward },
  ];

  const smartLists = [
    { id: 'top_rated' as NavFilter, label: 'Top Rated', icon: Star },
    { id: 'rewatch' as NavFilter, label: 'Rewatch', icon: Repeat },
    { id: 'foreign' as NavFilter, label: 'Foreign', icon: Globe },
    { id: 'progress' as NavFilter, label: 'In Progress', icon: Play },
  ];

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-800 p-4 space-y-8 flex flex-col h-full bg-white dark:bg-gray-950/50 hidden md:flex">
      {/* Logo */}
      <div className="px-3">
        <h1 className="text-xl font-black tracking-wide text-gray-900 dark:text-white flex items-center gap-3">
          <div className="text-indigo-600">
            <VaultLogo size={48} />
          </div>
          THE VAULT
        </h1>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar">
        {/* Analytics */}
        <div>
          <NavItem active={active === 'analytics'} onClick={() => onChange('analytics')} icon={BarChart3}>
            Analytics
          </NavItem>
        </div>

        {/* Library Section */}
        <div>
          <p className="px-3 text-xs uppercase tracking-widest font-bold text-gray-400 mb-3">
            Library
          </p>
          <div className="space-y-1">
            {navItems.map((item) => (
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

        {/* Smart Lists Section */}
        <div>
          <p className="px-3 text-xs uppercase tracking-widest font-bold text-gray-400 mb-3">
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
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="px-3 text-xs text-gray-400 flex items-center gap-2">
          <Film size={14} />
          <span>Track. Rate. Discover.</span>
        </div>
      </div>
    </aside>
  );
}

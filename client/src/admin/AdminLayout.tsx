import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Clapperboard,
  ExternalLink,
  Film,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorPlay,
  Settings,
  Sparkles,
  Tags,
  Tv,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Logo } from '../components/Logo';
import { cn } from '../utils/format';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Overview',
    items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/movies', label: 'Movies', icon: Film },
      { to: '/admin/series', label: 'TV Series', icon: Tv },
      { to: '/admin/tv-shows', label: 'TV Shows', icon: MonitorPlay },
      { to: '/admin/anime', label: 'Anime', icon: Sparkles },
    ],
  },
  {
    label: 'Taxonomy',
    items: [
      { to: '/admin/categories', label: 'Categories', icon: FolderTree },
      { to: '/admin/genres', label: 'Genres', icon: Tags },
    ],
  },
  {
    label: 'System',
    items: [{ to: '/admin/settings', label: 'Settings', icon: Settings }],
  },
];

const TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/movies': 'Movies',
  '/admin/series': 'TV Series',
  '/admin/tv-shows': 'TV Shows',
  '/admin/anime': 'Anime',
  '/admin/categories': 'Categories',
  '/admin/genres': 'Genres',
  '/admin/settings': 'Settings',
};

function pageTitle(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  const base = Object.keys(TITLES)
    .filter((key) => key !== '/admin' && pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  if (!base) return 'Dashboard';
  if (pathname.endsWith('/new')) return `Add ${TITLES[base].replace(/s$/, '')}`;
  if (pathname.endsWith('/edit')) return `Edit ${TITLES[base].replace(/s$/, '')}`;
  if (pathname.endsWith('/manage')) return `${TITLES[base]} management`;
  return TITLES[base];
}

export function AdminLayout() {
  const { admin, logout } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Session is cleared locally regardless of the network result.
    }
    notify('Signed out of the dashboard', 'info');
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-white/10 bg-ink-900/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between gap-3 border-b border-white/10 px-5">
          <Logo size="sm" />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-zinc-500 transition hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
                {group.label}
              </p>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition',
                          isActive
                            ? 'bg-brand-500/12 text-white ring-1 ring-brand-500/25'
                            : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={17} className={isActive ? 'text-brand-400' : 'text-zinc-500'} />
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 p-3">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
          >
            <span className="flex items-center gap-3">
              <ExternalLink size={16} className="text-zinc-500" /> View website
            </span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-zinc-400 transition hover:bg-brand-500/10 hover:text-brand-200"
          >
            <LogOut size={16} className="text-zinc-500" /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main */}
      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/85 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="btn-icon h-9 w-9 lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <h1 className="truncate font-display text-lg font-bold text-white">
                  {pageTitle(location.pathname)}
                </h1>
                <p className="hidden text-[11px] text-zinc-500 sm:block">
                  FREE2WATCH administration
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 sm:flex">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/15 text-[11px] font-bold uppercase text-brand-300">
                  {admin?.username?.slice(0, 2) ?? 'AD'}
                </span>
                <div className="leading-tight">
                  <p className="text-[11px] font-semibold text-white">{admin?.username}</p>
                  <p className="text-[9px] uppercase tracking-wider text-zinc-500">Administrator</p>
                </div>
              </div>
              <Link
                to="/admin/movies/new"
                className="btn-primary btn-sm hidden sm:inline-flex"
              >
                <Clapperboard size={14} /> Add movie
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-icon h-9 w-9"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>

        <footer className="border-t border-white/5 px-4 py-5 text-[11px] text-zinc-600 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5">
              <BarChart3 size={12} /> Statistics are queried live from SQLite.
            </span>
            <span>FREE2WATCH Dashboard v1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

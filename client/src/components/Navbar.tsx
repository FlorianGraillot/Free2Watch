import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Clapperboard,
  Dices,
  Film,
  Home,
  Loader2,
  Menu,
  MonitorPlay,
  Search,
  Sparkles,
  Tv,
  X,
} from 'lucide-react';
import { Logo } from './Logo';
import { PosterImage } from './PosterImage';
import { WatchlistDrawer } from './WatchlistDrawer';
import { SurpriseMeModal } from './SurpriseMeModal';
import { RequestTitleModal } from './RequestTitleModal';
import { catalogService } from '../services/catalog.service';
import { userPreferences } from '../services/userPreferences';
import { useDebouncedValue } from '../hooks/useApiData';
import type { SearchSuggestion } from '../types';
import { cn } from '../utils/format';
import { contentPath, kindLabel } from '../utils/routes';

export const NAV_LINKS = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/in-theatres', label: 'In Theatres', icon: Clapperboard, isCinema: true },
  { to: '/movies', label: 'Movies', icon: Film },
  { to: '/series', label: 'TV Series', icon: Tv },
  { to: '/tv-shows', label: 'TV Shows', icon: MonitorPlay },
  { to: '/anime', label: 'Anime', icon: Sparkles },
];

function isActive(pathname: string, to: string, exact?: boolean) {
  if (exact) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebouncedValue(query, 300);

  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(() => userPreferences.getWatchlist().length);
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  useEffect(() => {
    const handleWatchlistUpdate = (e: any) => {
      setWatchlistCount(e.detail?.count ?? userPreferences.getWatchlist().length);
    };
    const handleSurprise = () => setSurpriseOpen(true);
    const handleRequest = () => setRequestOpen(true);

    window.addEventListener('f2w:watchlist-updated', handleWatchlistUpdate);
    window.addEventListener('f2w:open-surprise', handleSurprise);
    window.addEventListener('f2w:open-request', handleRequest);

    return () => {
      window.removeEventListener('f2w:watchlist-updated', handleWatchlistUpdate);
      window.removeEventListener('f2w:open-surprise', handleSurprise);
      window.removeEventListener('f2w:open-request', handleRequest);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setQuery('');
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (searchOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [searchOpen]);

  useEffect(() => {
    let active = true;
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    catalogService
      .suggestions(debouncedQuery.trim())
      .then((items) => {
        if (active) setSuggestions(items);
      })
      .catch(() => {
        if (active) setSuggestions([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    navigate(`/search?q=${encodeURIComponent(value)}`);
    setSearchOpen(false);
    setMobileOpen(false);
    setQuery('');
  };

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 border-b transition-all duration-300',
          scrolled || mobileOpen
            ? 'border-white/10 bg-ink-950/92 shadow-[0_18px_40px_-30px_rgba(0,0,0,1)] backdrop-blur-xl'
            : 'border-transparent bg-gradient-to-b from-ink-950/90 via-ink-950/45 to-transparent'
        )}
      >
        <div className="container-page flex h-[68px] items-center justify-between gap-4">
          <div className="flex items-center gap-7">
            <Logo size="md" />

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive: routeActive }) =>
                    cn(
                      'relative rounded-lg px-3 py-2 text-[13px] font-semibold transition',
                      routeActive || isActive(location.pathname, link.to, link.exact)
                        ? 'text-white'
                        : 'text-zinc-400 hover:text-zinc-100'
                    )
                  }
                >
                  <span className="inline-flex items-center">
                    {link.label}
                    {link.isCinema && (
                      <span className="ml-1.5 rounded bg-gold-500/20 px-1.5 py-0.5 text-[9px] font-bold text-gold-300 ring-1 ring-gold-500/30">
                        CINEMA
                      </span>
                    )}
                  </span>
                  {(location.pathname === link.to ||
                    isActive(location.pathname, link.to, link.exact)) && (
                    <span className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-brand-500" />
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              className="btn-icon"
              aria-label={searchOpen ? 'Close search' : 'Open search'}
              aria-expanded={searchOpen}
            >
              {searchOpen ? <X size={18} /> : <Search size={18} />}
            </button>

            <Link
              to="/search"
              className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-3 pr-4 text-xs font-medium text-zinc-400 transition hover:border-white/25 hover:text-white sm:flex"
            >
              <Search size={14} />
              Search titles…
              <kbd className="ml-2 rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-zinc-500 font-mono">
                /
              </kbd>
            </Link>

            {/* Surprise Me / Cinema Roulette */}
            <button
              type="button"
              onClick={() => setSurpriseOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gold-500/30 bg-gold-500/10 px-2.5 py-2 text-xs font-semibold text-gold-300 hover:border-gold-500/60 hover:bg-gold-500/20 transition"
              title="Cinema Roulette — Surprise Me"
            >
              <Dices size={14} className="text-gold-400" />
              <span className="hidden sm:inline">Surprise Me</span>
            </button>

            {/* 5-Star Cinema VIP Watchlist Button */}
            <button
              type="button"
              onClick={() => setWatchlistOpen(true)}
              className={cn(
                'relative inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition',
                watchlistCount > 0
                  ? 'border-gold-500/40 bg-gold-500/10 text-gold-300 hover:border-gold-500/70 hover:bg-gold-500/20'
                  : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/25 hover:text-white'
              )}
              aria-label={`Open My List (${watchlistCount} titles)`}
              title="My VIP Watchlist"
            >
              <Bookmark size={14} className={watchlistCount > 0 ? 'fill-current text-gold-400' : ''} />
              <span className="hidden sm:inline">My List</span>
              {watchlistCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[9px] font-bold text-black">
                  {watchlistCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="btn-icon lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-white/10 bg-ink-950/97 backdrop-blur-xl animate-slide-down">
            <div className="container-page py-4">
              <form onSubmit={submitSearch} className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search movies, series, TV shows and anime…"
                  className="input h-12 rounded-2xl pl-11 pr-28 text-base"
                  aria-label="Search the catalogue"
                />
                <button type="submit" className="btn-primary btn-sm absolute right-2 top-1/2 -translate-y-1/2">
                  Search
                </button>
              </form>

              {(suggestions.length > 0 || (loading && query.length >= 2)) && (
                <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {loading && suggestions.length === 0 ? (
                    <div className="flex items-center gap-2 px-2 py-3 text-sm text-zinc-500">
                      <Loader2 size={15} className="animate-spin" /> Searching…
                    </div>
                  ) : (
                    suggestions.map((item) => (
                      <Link
                        key={`${item.content_type}-${item.id}`}
                        to={contentPath({ content_type: item.content_type, slug: item.slug })}
                        className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition hover:border-white/10 hover:bg-white/5"
                        onClick={() => setSearchOpen(false)}
                      >
                        <PosterImage
                          src={item.poster}
                          alt={item.title}
                          className="h-14 w-10 shrink-0 rounded-md"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-100">{item.title}</p>
                          <p className="text-[11px] text-zinc-500">
                            {[item.year, kindLabel(item.content_type)].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}

              {query.trim() && (
                <button
                  type="button"
                  onClick={submitSearch}
                  className="mt-2 text-xs font-semibold text-brand-400 transition hover:text-brand-300"
                >
                  View all results for “{query.trim()}” →
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <WatchlistDrawer
        isOpen={watchlistOpen}
        onClose={() => setWatchlistOpen(false)}
      />

      <SurpriseMeModal
        isOpen={surpriseOpen}
        onClose={() => setSurpriseOpen(false)}
      />

      <RequestTitleModal
        isOpen={requestOpen}
        onClose={() => setRequestOpen(false)}
      />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 top-[68px] max-h-[calc(100svh-68px)] overflow-y-auto border-b border-white/10 bg-ink-950 px-4 pb-8 pt-4 animate-slide-down">
            <form onSubmit={submitSearch} className="relative mb-4">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search FREE2WATCH…"
                className="input pl-10"
                aria-label="Search the catalogue"
              />
            </form>
            <nav className="space-y-1" aria-label="Mobile navigation">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const active = isActive(location.pathname, link.to, link.exact);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition',
                      active
                        ? 'bg-brand-500/12 text-white ring-1 ring-brand-500/25'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={17} className={active ? 'text-brand-400' : 'text-zinc-500'} />
                      {link.label}
                    </span>
                    {link.isCinema && (
                      <span className="rounded bg-gold-500/20 px-2 py-0.5 text-[10px] font-bold text-gold-300 ring-1 ring-gold-500/30">
                        IN THEATRES
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Browse by type</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {NAV_LINKS.filter((link) => link.to !== '/').map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="rounded-lg border border-white/10 px-3 py-2 text-zinc-300 transition hover:border-white/25 text-center"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setSurpriseOpen(true);
                  }}
                  className="flex-1 btn-cinema-gold btn-sm py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Dices size={14} /> Surprise Me
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setRequestOpen(true);
                  }}
                  className="flex-1 btn-secondary btn-sm py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Film size={14} /> Request Title
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function MobileNav() {
  const location = useLocation();
  const items = [
    { to: '/', label: 'Home', icon: Home, exact: true },
    { to: '/movies', label: 'Movies', icon: Film },
    { to: '/series', label: 'Series', icon: Tv },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/anime', label: 'Anime', icon: Sparkles },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
      aria-label="Bottom navigation"
    >
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(location.pathname, item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition',
                active ? 'text-brand-400' : 'text-zinc-500'
              )}
            >
              <Icon size={19} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Footer() {
  const openRequest = () => {
    window.dispatchEvent(new CustomEvent('f2w:open-request'));
  };

  const openSurprise = () => {
    window.dispatchEvent(new CustomEvent('f2w:open-surprise'));
  };

  return (
    <footer className="relative mt-20 border-t border-gold-500/15 bg-ink-950">
      <div className="container-page py-12 sm:pb-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm space-y-3">
            <Logo size="md" />
            <p className="text-sm leading-relaxed text-zinc-400">
              The premier destination for 5-star cinema and episodic streaming. Handcrafted for cinephiles,
              featuring multi-server 4K playback and private VIP watchlists.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 rounded bg-gold-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-300 ring-1 ring-gold-500/20">
                ★ 5-Star Cinema
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300 ring-1 ring-white/10">
                4K Ultra HD
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300 ring-1 ring-white/10">
                Dolby Audio
              </span>
            </div>
          </div>

          <FooterColumn
            title="Cinema Halls"
            links={[
              { label: 'Feature Films', to: '/movies' },
              { label: 'TV Series', to: '/series' },
              { label: 'TV Shows', to: '/tv-shows' },
              { label: 'Anime Showcase', to: '/anime' },
            ]}
          />

          <FooterColumn
            title="Collections"
            links={[
              { label: 'Box Office Top 10', to: '/search?sort=latest' },
              { label: 'Search Archives', to: '/search' },
              { label: 'Arabic Cinema', to: '/movies/category/arabic-movies' },
              { label: 'Anime Premieres', to: '/anime/category/japanese-anime' },
            ]}
          />

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-gold-400">VIP Experience</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
              <li>
                <button
                  type="button"
                  onClick={openSurprise}
                  className="flex items-center gap-2 text-zinc-400 hover:text-gold-300 transition"
                >
                  <Dices size={14} className="text-gold-400" /> Cinema Roulette (Surprise Me)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openRequest}
                  className="flex items-center gap-2 text-zinc-400 hover:text-gold-300 transition"
                >
                  <Film size={14} className="text-gold-400" /> Request a Movie or Series
                </button>
              </li>
              <li className="flex items-center gap-2 text-zinc-400">
                <span>·</span> Zero Buffering Multi-Server
              </li>
              <li className="flex items-center gap-2 text-zinc-400">
                <span>·</span> Cinema Theater Mode (Dim Lights)
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-[11px] text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} FREE2WATCH 5-Star Cinema. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-zinc-400">
            <span>High-definition streaming entertainment</span>
            <span>·</span>
            <a href="/ads.txt" target="_blank" rel="noreferrer" className="hover:text-gold-300 transition">
              ads.txt
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.to}>
            <Link className="text-sm text-zinc-500 transition hover:text-brand-300" to={link.to}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

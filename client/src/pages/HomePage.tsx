import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  Clapperboard,
  Compass,
  Crown,
  Dices,
  Film,
  Info,
  MessageSquarePlus,
  Play,
  Sparkles,
  Star,
  Ticket,
  TrendingUp,
  Volume2,
} from 'lucide-react';
import { catalogService } from '../services/catalog.service';
import { userPreferences } from '../services/userPreferences';
import { useApiData } from '../hooks/useApiData';
import { useSeo } from '../hooks/useSeo';
import { ContentRow } from '../components/ContentRow';
import { TopTenRow } from '../components/TopTenRow';
import { ContinueWatchingRow } from '../components/ContinueWatchingRow';
import { EmptyState, ErrorState } from '../components/EmptyState';
import { AdSenseBanner } from '../components/common/AdSenseBanner';
import type { Content, ContentKind, HomeData } from '../types';
import { contentPath, kindLabel, SECTIONS, sectionForKind } from '../utils/routes';
import { cn } from '../utils/format';

export function HomePage() {
  const { data, loading, error, refresh } = useApiData<HomeData>(() => catalogService.home(), []);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroInWatchlist, setHeroInWatchlist] = useState(false);

  useSeo({
    title: 'FREE2WATCH — 5-Star Cinema & Streaming Destination',
    description:
      'Experience 5-star premier cinema at home. Stream high-definition movies, TV series, TV shows and anime on FREE2WATCH with pristine 4K video and multi-server playback.',
    canonicalPath: '/',
  });

  const heroItems = useMemo(() => (data?.hero ?? []).slice(0, 5), [data]);
  const hero = heroItems[heroIndex] ?? null;

  // Auto-rotate hero every 8 seconds
  useEffect(() => {
    if (heroItems.length <= 1) return;
    const timer = window.setInterval(() => {
      setHeroIndex((index) => (index + 1) % heroItems.length);
    }, 8500);
    return () => window.clearInterval(timer);
  }, [heroItems.length]);

  useEffect(() => {
    if (heroIndex >= heroItems.length) setHeroIndex(0);
  }, [heroIndex, heroItems.length]);

  // Sync hero watchlist state
  useEffect(() => {
    if (hero) {
      setHeroInWatchlist(userPreferences.isInWatchlist(hero.id, hero.content_type));
    }
  }, [hero]);

  const toggleHeroWatchlist = () => {
    if (!hero) return;
    const nowIn = userPreferences.toggleWatchlist(hero);
    setHeroInWatchlist(nowIn);
  };

  const categoryGroups = useMemo(() => {
    const groups: Partial<Record<ContentKind, NonNullable<HomeData['categories']>>> = {};
    for (const category of data?.categories ?? []) {
      const key = category.content_type as ContentKind;
      groups[key] ??= [];
      groups[key]!.push(category);
    }
    return groups;
  }, [data]);
  const categoryKeys = Object.keys(categoryGroups) as ContentKind[];

  if (error) {
    return (
      <div className="container-page py-16">
        <ErrorState
          title="The cinema catalogue could not be loaded"
          message="Check that the FREE2WATCH API is running, then try again."
          onRetry={refresh}
        />
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* 5-STAR GRAND CINEMA HERO MARQUEE */}
      <section className="relative w-full overflow-hidden border-b border-gold-500/15 bg-ink-950">
        {/* Background cinema hall photo with deep vignette */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <img
            src="/src/assets/images/hero_cinema_marquee_1793469559517.jpg"
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover object-center opacity-30 blur-sm scale-105"
          />
          {/* Film backdrop overlay if available */}
          {hero?.poster && (
            <img
              src={hero.poster}
              alt=""
              aria-hidden="true"
              className="absolute right-0 top-0 h-full w-2/3 object-cover object-top opacity-20 blur-3xl"
            />
          )}
          {/* Ambient lighting gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/95 to-ink-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/80 via-transparent to-ink-950" />
          <div className="grain absolute inset-0 opacity-20" />
        </div>

        <div className="container-page relative z-10 py-10 sm:py-16 lg:py-20">
          {loading && !data ? (
            <HeroSkeleton />
          ) : hero ? (
            <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
              <div className="space-y-5 animate-fade-up">
                {/* 5-Star Consensus Badge */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-xs font-bold text-gold-300 shadow-[0_0_20px_rgba(229,169,60,0.25)]">
                    <Crown size={13} className="text-gold-400 fill-current" />
                    5-Star Cinema Premiere
                  </span>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                    <span className="flex text-amber-400">
                      {'★'.repeat(5)}
                    </span>
                    <span className="text-white ml-1 font-mono">5.0</span>
                  </span>

                  <span className="text-xs text-zinc-500">·</span>
                  <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-200">
                    {hero.quality || '4K ULTRA HD'}
                  </span>
                  <span className="hidden sm:inline text-xs text-zinc-500">·</span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-zinc-400">
                    <Volume2 size={13} className="text-zinc-500" /> Dolby Atmos
                  </span>
                </div>

                {/* Main Marquee Title */}
                <h1 className="text-shadow font-display text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-white max-w-3xl">
                  {hero.title}
                </h1>

                {/* Clean Unboxed Metadata Discipline */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-zinc-400">
                  <span className="text-gold-400 font-semibold uppercase tracking-wider">
                    {kindLabel(hero.content_type ?? 'movie')}
                  </span>
                  {hero.year && (
                    <>
                      <span>·</span>
                      <span className="text-zinc-200 font-mono">{hero.year}</span>
                    </>
                  )}
                  {hero.duration && (
                    <>
                      <span>·</span>
                      <span>{hero.duration}</span>
                    </>
                  )}
                  {hero.category_name && (
                    <>
                      <span>·</span>
                      <Link
                        to={`${SECTIONS[sectionForKind(hero.content_type ?? 'movie')].basePath}/category/${hero.category_slug}`}
                        className="text-zinc-300 hover:text-white transition"
                      >
                        {hero.category_name}
                      </Link>
                    </>
                  )}
                  {hero.language && (
                    <>
                      <span>·</span>
                      <span>{hero.language}</span>
                    </>
                  )}
                </div>

                {/* Synopsis */}
                <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-zinc-300 line-clamp-3">
                  {hero.description || hero.story}
                </p>

                {/* Unboxed Genres */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {hero.genres.map((genre) => (
                    <Link
                      key={genre}
                      to={`/search?genre=${encodeURIComponent(genre)}`}
                      className="inline-flex items-center rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-zinc-300 transition hover:border-gold-500/40 hover:text-white"
                    >
                      {genre}
                    </Link>
                  ))}
                </div>

                {/* Grand Action CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <Link
                    to={
                      hero.content_type === 'movie'
                        ? `${contentPath(hero)}?play=1`
                        : contentPath(hero)
                    }
                    className="btn-primary px-7 py-3.5 text-base font-bold shadow-cinema"
                  >
                    <Play size={19} fill="currentColor" />
                    Watch Premiere Now
                  </Link>

                  <button
                    type="button"
                    onClick={toggleHeroWatchlist}
                    className={cn(
                      'btn px-5 py-3.5 text-sm font-semibold transition-all duration-200',
                      heroInWatchlist
                        ? 'border border-gold-500/50 bg-gold-500/15 text-gold-300 shadow-gold hover:bg-gold-500/25'
                        : 'border border-white/15 bg-white/5 text-white hover:border-white/30 hover:bg-white/10'
                    )}
                  >
                    <Bookmark size={16} className={heroInWatchlist ? 'fill-current' : ''} />
                    {heroInWatchlist ? 'In My Watchlist' : '+ Add to Watchlist'}
                  </button>

                  <Link
                    to={contentPath(hero)}
                    className="btn-secondary px-5 py-3.5 text-sm"
                  >
                    <Info size={16} /> Details
                  </Link>
                </div>
              </div>

              {/* Marquee Poster Showcase */}
              <div className="hidden lg:flex justify-end">
                <Link
                  to={contentPath(hero)}
                  className="group relative block w-[290px] overflow-hidden rounded-2xl border-2 border-gold-500/30 bg-ink-900 shadow-[0_30px_70px_-20px_rgba(0,0,0,1)] transition duration-500 hover:border-gold-500/70 hover:scale-[1.03]"
                >
                  <img
                    src={hero.poster || '/assets/poster-fallback.svg'}
                    alt={hero.title}
                    loading="eager"
                    className="aspect-[2/3] w-full object-cover transition duration-700 group-hover:scale-105 group-hover:brightness-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

                  {/* Golden Cinema Frame Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/80 px-2 py-1 text-[10px] font-bold text-gold-300 ring-1 ring-gold-500/30 backdrop-blur">
                    <Star size={11} className="fill-current text-gold-400" /> Premiere Selection
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-semibold text-white">
                    <span className="truncate pr-2">{hero.category_name ?? kindLabel(hero.content_type ?? 'movie')}</span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white shadow-glow transition group-hover:scale-110">
                      <Play size={14} fill="currentColor" className="ml-0.5" />
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Clapperboard}
              title="Welcome to FREE2WATCH 5-Star Cinema"
              description="Publish a movie, TV series, or anime in the administrator dashboard to inaugurate the grand marquee."
              action={{ label: 'Explore search', to: '/search' }}
            />
          )}

          {/* Interactive Marquee Reel Carousel Tabs */}
          {heroItems.length > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                {heroItems.map((item, index) => {
                  const isActive = index === heroIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setHeroIndex(index)}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                        isActive
                          ? 'border-gold-500/60 bg-gold-500/15 text-white ring-1 ring-gold-500/30'
                          : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white'
                      )}
                    >
                      <span
                        className={cn(
                          'font-mono font-bold text-[11px]',
                          isActive ? 'text-gold-400' : 'text-zinc-500 group-hover:text-zinc-300'
                        )}
                      >
                        0{index + 1}
                      </span>
                      <span className="truncate max-w-[140px] sm:max-w-[180px]">{item.title}</span>
                    </button>
                  );
                })}
              </div>

              <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>4K Master Audio · Free High-Definition Streaming</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MAIN CATALOGUE CONTENT */}
      <div className="container-page mt-8 sm:mt-12 space-y-12 sm:space-y-16">
        {/* Continue Watching Section (VIP local resume) */}
        <ContinueWatchingRow />

        {/* 4 Quick Category Shortcuts */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(['movies', 'series', 'tv-shows', 'anime'] as const).map((section) => {
            const meta = SECTIONS[section];
            const icons = { movies: Clapperboard, series: Compass, 'tv-shows': TrendingUp, anime: Sparkles };
            const Icon = icons[section];
            return (
              <Link
                key={section}
                to={meta.basePath}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 transition-all duration-300 hover:border-gold-500/40 hover:bg-gold-500/[0.05]"
              >
                <div>
                  <span className="block font-display text-base font-bold text-white group-hover:text-gold-300 transition">
                    {meta.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500">Browse collection</span>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-zinc-400 ring-1 ring-white/10 transition group-hover:bg-gold-500 group-hover:text-black group-hover:ring-gold-500/50">
                  <Icon size={19} />
                </span>
              </Link>
            );
          })}
        </div>

        {/* 5-STAR CINEMA INTERACTIVE CONCIERGE DUO */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Cinema Roulette */}
          <div className="relative overflow-hidden rounded-2xl border border-gold-500/25 bg-gradient-to-br from-gold-950/30 via-ink-900/80 to-ink-950 p-5 sm:p-6 shadow-gold transition hover:border-gold-500/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-500/20 text-gold-400 border border-gold-500/30">
                    <Dices size={16} />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gold-400 font-mono">
                    Cinema Roulette
                  </span>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold text-white">
                  Can't decide what to watch tonight?
                </h3>
                <p className="mt-1 text-xs text-zinc-400 max-w-sm">
                  Let our marquee pick a top-rated movie, series or anime matching your favorite genre.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-2">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('f2w:open-surprise'))}
                className="btn-cinema-gold py-2.5 px-5 text-xs font-bold flex items-center gap-2"
              >
                <Dices size={14} /> Spin Cinema Roulette
              </button>
            </div>
          </div>

          {/* Title Concierge Request */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] via-ink-900/80 to-ink-950 p-5 sm:p-6 transition hover:border-white/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    <MessageSquarePlus size={16} />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-brand-300 font-mono">
                    VIP Concierge
                  </span>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold text-white">
                  Missing a title you'd love to stream?
                </h3>
                <p className="mt-1 text-xs text-zinc-400 max-w-sm">
                  Submit a quick request and our technical team will track down high-definition masters.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-2">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('f2w:open-request'))}
                className="btn-secondary py-2.5 px-5 text-xs font-semibold flex items-center gap-2 text-white hover:border-brand-500/40"
              >
                <MessageSquarePlus size={14} className="text-brand-400" /> Request a Movie or Show
              </button>
            </div>
          </div>
        </div>

        {/* Top Header Leaderboard Ad Banner */}
        <AdSenseBanner slotType="header" />

        {data && (
          <>
            {/* BOX OFFICE TOP 10 CHART */}
            <TopTenRow items={data.trending} loading={loading} />

            {/* NOW SHOWING IN THEATRES SHOWCASE BANNER */}
            <div className="relative overflow-hidden rounded-3xl border border-gold-500/30 bg-gradient-to-r from-[#17120a] via-[#120f18] to-[#17120a] p-6 sm:p-8 shadow-cinema">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-gold-500/10 blur-[80px] pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/15 border border-gold-500/30 px-3 py-1 text-[11px] font-bold text-gold-400 font-mono tracking-wider">
                    <Ticket size={13} className="fill-current text-gold-400" /> NOW IN CINEMAS WORLDWIDE
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Want to see what just hit the <span className="text-gradient-gold">Cinema Screens</span>?
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    Browse posters of movies currently showing in theatres. Click any title to explore complete storylines, 4K trailers, box office numbers, and cast information.
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    to="/in-theatres"
                    className="btn-cinema-gold py-3.5 px-6 text-sm font-bold shadow-cinema flex items-center gap-2 group"
                  >
                    <Clapperboard size={16} /> Explore In Theatres <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>

            {/* In-feed Catalog Ad */}
            <AdSenseBanner slotType="in_feed" />

            {/* Latest Feature Movies */}
            <ContentRow
              title="Latest Cinema Releases"
              subtitle="Fresh feature films ready to stream in full resolution"
              items={data.latest.movies}
              defaultKind="movie"
              loading={loading}
              accent
              viewAllHref="/movies"
            />

            {/* Latest TV Series */}
            <ContentRow
              title="Binge-Worthy TV Series"
              subtitle="Complete seasons and multi-episode sagas"
              items={data.latest.series}
              defaultKind="series"
              loading={loading}
              viewAllHref="/series"
            />

            {/* Latest TV Shows */}
            <ContentRow
              title="Popular TV Shows"
              subtitle="Episodic entertainment and television specials"
              items={data.latest.tvShows}
              defaultKind="tv_show"
              loading={loading}
              viewAllHref="/tv-shows"
            />

            {/* Latest Anime Masterpieces */}
            <ContentRow
              title="Anime Masterpieces"
              subtitle="Japanese animation, subbed & dubbed releases"
              items={data.latest.anime}
              defaultKind="anime"
              loading={loading}
              viewAllHref="/anime"
            />

            {/* Recommended */}
            <ContentRow
              title="Critics' Recommendations"
              subtitle="Curated gems from the cinema archives"
              items={data.recommended}
              loading={loading}
              viewAllHref="/search"
            />

            {/* Curated Taxonomy Categories */}
            <section className="space-y-6 pt-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className="eyebrow flex items-center gap-1.5 text-gold-400">
                    <Crown size={12} /> Curated
                  </span>
                  <h2 className="section-title mt-1">Explore by Category</h2>
                </div>
                <Link
                  to="/search"
                  className="hidden items-center gap-1.5 text-xs font-semibold text-zinc-400 transition hover:text-gold-300 sm:flex"
                >
                  All titles <ArrowRight size={14} />
                </Link>
              </div>

              {categoryKeys.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-center text-sm text-zinc-500">
                  Categories with published content will appear here.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {categoryKeys.map((kind) => (
                    <div
                      key={kind}
                      className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-gold-500/20"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-sm font-bold text-white">
                          {SECTIONS[sectionForKind(kind)].label}
                        </h3>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {categoryGroups[kind]?.length ?? 0} groups
                        </span>
                      </div>
                      <ul className="mt-4 space-y-2">
                        {(categoryGroups[kind] ?? []).slice(0, 6).map((category) => (
                          <li key={`${kind}-${category.id}`}>
                            <Link
                              to={`${SECTIONS[sectionForKind(kind)].basePath}/category/${category.slug}`}
                              className="group flex items-center justify-between gap-2 text-xs text-zinc-400 transition hover:text-gold-300"
                            >
                              <span className="truncate">{category.name}</span>
                              <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 transition group-hover:bg-gold-500/20 group-hover:text-gold-200">
                                {category.item_count}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
      <div className="space-y-5">
        <div className="h-6 w-36 skeleton rounded-full" />
        <div className="h-16 w-4/5 skeleton rounded-xl" />
        <div className="h-4 w-2/5 skeleton" />
        <div className="h-16 w-full skeleton rounded-xl" />
        <div className="flex gap-3 pt-3">
          <div className="h-12 w-44 skeleton rounded-xl" />
          <div className="h-12 w-36 skeleton rounded-xl" />
        </div>
      </div>
      <div className="hidden aspect-[2/3] w-[290px] justify-self-end skeleton rounded-2xl lg:block" />
    </div>
  );
}

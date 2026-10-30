import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clapperboard,
  Compass,
  Info,
  Play,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { catalogService } from '../services/catalog.service';
import { useApiData } from '../hooks/useApiData';
import { useSeo } from '../hooks/useSeo';
import { ContentRow } from '../components/ContentRow';
import { EmptyState, ErrorState } from '../components/EmptyState';
import type { Content, ContentKind, HomeData } from '../types';
import { contentPath, kindLabel, SECTIONS, sectionForKind } from '../utils/routes';
import { cn } from '../utils/format';

export function HomePage() {
  const { data, loading, error, refresh } = useApiData<HomeData>(() => catalogService.home(), []);
  const [heroIndex, setHeroIndex] = useState(0);

  useSeo({
    title: 'FREE2WATCH — Movies, TV Series, TV Shows & Anime',
    description:
      'Stream and discover movies, TV series, TV shows and anime on FREE2WATCH — a premium, beautifully curated cinema platform.',
    canonicalPath: '/',
  });

  const heroItems = useMemo(() => (data?.hero ?? []).slice(0, 5), [data]);
  const hero = heroItems[heroIndex] ?? null;

  useEffect(() => {
    if (heroItems.length <= 1) return;
    const timer = window.setInterval(() => {
      setHeroIndex((index) => (index + 1) % heroItems.length);
    }, 9000);
    return () => window.clearInterval(timer);
  }, [heroItems.length]);

  useEffect(() => {
    if (heroIndex >= heroItems.length) setHeroIndex(0);
  }, [heroIndex, heroItems.length]);

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
          title="The catalogue could not be loaded"
          message="Check that the FREE2WATCH API is running, then try again."
          onRetry={refresh}
        />
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* Hero */}
      <section className="container-page pt-4 sm:pt-6">
        {loading && !data ? (
          <HeroSkeleton />
        ) : hero ? (
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-ink-900">
            <img
              src={hero.poster || '/assets/poster-fallback.svg'}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover object-top opacity-35 blur-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/90 to-ink-950/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/40" />
            <div className="grain absolute inset-0" />

            <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.35fr_0.65fr] lg:items-center lg:p-12">
              <div className="max-w-2xl animate-fade-up">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="badge bg-brand-500/15 text-brand-200 ring-1 ring-brand-500/30">
                    <Sparkles size={12} /> Featured
                  </span>
                  <span className="badge bg-white/[0.06] text-zinc-300 ring-1 ring-white/10">
                    {kindLabel(hero.content_type ?? 'movie')}
                  </span>
                  {hero.year && <span className="text-xs font-semibold text-zinc-400">{hero.year}</span>}
                  {hero.quality && (
                    <span className="text-xs font-semibold text-zinc-400">{hero.quality}</span>
                  )}
                </div>

                <h1 className="text-shadow font-display text-4xl font-extrabold leading-[1.03] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {hero.title}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-zinc-400">
                  {hero.category_name && (
                    <Link
                      to={`${SECTIONS[sectionForKind(hero.content_type ?? 'movie')].basePath}/category/${hero.category_slug}`}
                      className="text-brand-300 transition hover:text-brand-200"
                    >
                      {hero.category_name}
                    </Link>
                  )}
                  {hero.language && <span>{hero.language}</span>}
                  {hero.country && <span>{hero.country}</span>}
                </div>

                <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-300 line-clamp-3 sm:text-base">
                  {hero.description || hero.story}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {hero.genres.slice(0, 4).map((genre) => (
                    <span key={genre} className="chip">
                      {genre}
                    </span>
                  ))}
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    to={
                      hero.content_type === 'movie'
                        ? `${contentPath(hero)}?play=1`
                        : contentPath(hero)
                    }
                    className="btn-primary px-6 py-3 text-sm"
                  >
                    <Play size={17} fill="currentColor" />
                    Watch now
                  </Link>
                  <Link to={contentPath(hero)} className="btn-secondary px-5 py-3 text-sm">
                    <Info size={17} /> More details
                  </Link>
                  <Link
                    to={SECTIONS[sectionForKind(hero.content_type ?? 'movie')].basePath}
                    className="btn-ghost px-4 py-3 text-sm text-zinc-400"
                  >
                    Browse {SECTIONS[sectionForKind(hero.content_type ?? 'movie')].label}
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>

              <div className="hidden justify-center lg:flex">
                <Link
                  to={contentPath(hero)}
                  className="group relative block w-[240px] overflow-hidden rounded-2xl ring-1 ring-white/20 transition hover:ring-white/40"
                >
                  <img
                    src={hero.poster || '/assets/poster-fallback.svg'}
                    alt={hero.title}
                    loading="eager"
                    className="aspect-[2/3] w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-semibold text-white">
                    <span>{hero.category_name ?? kindLabel(hero.content_type ?? 'movie')}</span>
                    <Play size={15} />
                  </span>
                </Link>
              </div>
            </div>

            {heroItems.length > 1 && (
              <div className="relative flex items-center justify-between gap-4 border-t border-white/10 bg-black/25 px-6 py-3 backdrop-blur sm:px-9 lg:px-12">
                <div className="flex items-center gap-1.5">
                  {heroItems.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setHeroIndex(index)}
                      aria-label={`Show featured title ${index + 1}: ${item.title}`}
                      aria-current={index === heroIndex}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        index === heroIndex ? 'w-8 bg-brand-500' : 'w-3 bg-white/25 hover:bg-white/50'
                      )}
                    />
                  ))}
                </div>
                <div className="hidden items-center gap-2 text-[11px] text-zinc-500 sm:flex">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
                  Now streaming on FREE2WATCH
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            icon={Clapperboard}
            title="The catalogue is waiting for its first title"
            description="Publish a movie, series, TV show or anime from the administrator dashboard and it will appear here instantly."
            action={{ label: 'Explore search', to: '/search' }}
          />
        )}
      </section>

      {/* Trending / quick links */}
      <div className="container-page mt-10 space-y-12 sm:mt-14 sm:space-y-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(['movies', 'series', 'tv-shows', 'anime'] as const).map((section) => {
            const meta = SECTIONS[section];
            const icons = { movies: Clapperboard, series: Compass, 'tv-shows': TrendingUp, anime: Sparkles };
            const Icon = icons[section];
            return (
              <Link
                key={section}
                to={meta.basePath}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 transition hover:border-brand-500/40 hover:bg-brand-500/[0.06]"
              >
                <span>
                  <span className="block font-display text-sm font-semibold text-white">{meta.label}</span>
                  <span className="mt-0.5 block text-[11px] text-zinc-500">Browse the full collection</span>
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-zinc-400 transition group-hover:bg-brand-500 group-hover:text-white">
                  <Icon size={18} />
                </span>
              </Link>
            );
          })}
        </div>

        {data && (
          <>
            <ContentRow
              title="Trending now"
              subtitle="Fresh additions across every content type"
              items={data.trending}
              loading={loading}
              accent
              viewAllHref="/search?sort=latest"
            />

            <ContentRow
              title="Latest movies"
              subtitle="New cinema, ready when you are"
              items={data.latest.movies}
              loading={loading}
              viewAllHref="/movies"
            />

            <ContentRow
              title="Latest TV series"
              subtitle="Multi-season stories to sink into"
              items={data.latest.series}
              loading={loading}
              viewAllHref="/series"
            />

            <ContentRow
              title="Latest TV shows"
              subtitle="Episodic formats, season after season"
              items={data.latest.tvShows}
              loading={loading}
              viewAllHref="/tv-shows"
            />

            <ContentRow
              title="Latest anime"
              subtitle="Japanese, Chinese and dubbed worlds"
              items={data.latest.anime}
              loading={loading}
              viewAllHref="/anime"
            />

            <ContentRow
              title="Recommended for you"
              subtitle="A rotating mix from the whole catalogue"
              items={data.recommended}
              loading={loading}
              viewAllHref="/search"
            />

            {/* Categories */}
            <section className="space-y-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className="eyebrow">Explore</span>
                  <h2 className="section-title mt-1">Browse by category</h2>
                </div>
                <Link
                  to="/search"
                  className="hidden items-center gap-1.5 text-xs font-semibold text-zinc-400 transition hover:text-brand-300 sm:flex"
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
                      className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-sm font-semibold text-white">
                          {SECTIONS[sectionForKind(kind)].label}
                        </h3>
                        <span className="text-[11px] text-zinc-600">{categoryGroups[kind]?.length ?? 0} groups</span>
                      </div>
                      <ul className="mt-4 space-y-2">
                        {(categoryGroups[kind] ?? []).slice(0, 6).map((category) => (
                          <li key={`${kind}-${category.id}`}>
                            <Link
                              to={`${SECTIONS[sectionForKind(kind)].basePath}/category/${category.slug}`}
                              className="group flex items-center justify-between gap-2 text-sm text-zinc-400 transition hover:text-white"
                            >
                              <span className="truncate">{category.name}</span>
                              <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-500 transition group-hover:bg-brand-500/20 group-hover:text-brand-200">
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
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-ink-900">
      <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.35fr_0.65fr] lg:items-center lg:p-12">
        <div className="space-y-4">
          <div className="h-4 w-24 skeleton" />
          <div className="h-12 w-4/5 skeleton" />
          <div className="h-4 w-2/5 skeleton" />
          <div className="h-4 w-full skeleton" />
          <div className="h-4 w-3/4 skeleton" />
          <div className="flex gap-3 pt-3">
            <div className="h-11 w-32 skeleton rounded-xl" />
            <div className="h-11 w-32 skeleton rounded-xl" />
          </div>
        </div>
        <div className="hidden aspect-[2/3] w-[240px] justify-self-center skeleton rounded-2xl lg:block" />
      </div>
    </div>
  );
}

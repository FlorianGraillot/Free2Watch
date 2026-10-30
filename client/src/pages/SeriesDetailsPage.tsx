import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Clock,
  Film,
  Globe2,
  Languages,
  Layers,
  Play,
  Tag,
  Tv,
} from 'lucide-react';
import type { Content, ContentDetailResponse, ContentListResponse, ContentKind } from '../types';
import { contentService } from '../services/content.service';
import { useApiData } from '../hooks/useApiData';
import { useSeo } from '../hooks/useSeo';
import { PosterImage } from '../components/PosterImage';
import { VideoEmbed } from '../components/VideoEmbed';
import { ContentRow } from '../components/ContentRow';
import { EmptyState } from '../components/EmptyState';
import { Detail, DetailSkeleton } from './MovieDetailsPage';
import { cn } from '../utils/format';
import { categoryPath, episodePath, SECTIONS, sectionForKind } from '../utils/routes';

const KIND_COPY: Record<'series' | 'tv_show' | 'anime', { label: string; plural: string }> = {
  series: { label: 'TV Series', plural: 'series' },
  tv_show: { label: 'TV Show', plural: 'TV shows' },
  anime: { label: 'Anime', plural: 'anime' },
};

export function SeriesDetailsPage({ kind }: { kind: 'series' | 'tv_show' | 'anime' }) {
  const { slug } = useParams();
  const section = sectionForKind(kind as ContentKind);
  const copy = KIND_COPY[kind];
  const [activeSeasonId, setActiveSeasonId] = useState<number | null>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);

  const { data, loading, error } = useApiData<ContentDetailResponse>(
    () => contentService.detail(section, slug ?? ''),
    [section, slug]
  );

  const content = data?.content ?? null;
  const seasons = useMemo(
    () => [...(data?.seasons ?? [])].sort((a, b) => a.season_number - b.season_number),
    [data]
  );

  useEffect(() => {
    if (seasons.length && !seasons.some((season) => season.id === activeSeasonId)) {
      setActiveSeasonId(seasons[0].id);
    }
  }, [seasons, activeSeasonId]);

  const activeSeason = seasons.find((season) => season.id === activeSeasonId) ?? seasons[0] ?? null;

  const relatedState = useApiData<ContentListResponse>(
    () =>
      contentService.list(section, {
        category: content?.category_slug || undefined,
        limit: 12,
      }),
    [section, content?.category_slug],
    { enabled: Boolean(content?.category_slug) }
  );

  const related = useMemo(
    () => (relatedState.data?.items ?? []).filter((item) => item.id !== content?.id).slice(0, 10),
    [relatedState.data, content?.id]
  );

  useSeo({
    title: content ? content.title : copy.label,
    description: content?.description || content?.story || undefined,
    image: content?.poster || undefined,
    type: 'video.tv_show',
    canonicalPath: content ? `${SECTIONS[section].detailBase}/${content.slug}` : undefined,
    jsonLd: content
      ? {
          '@context': 'https://schema.org',
          '@type': kind === 'anime' ? 'TVSeries' : 'TVSeries',
          name: content.title,
          description: content.description,
          image: content.poster,
          datePublished: content.year ? String(content.year) : undefined,
          genre: content.genres,
          numberOfSeasons: seasons.length,
          inLanguage: content.language || undefined,
        }
      : undefined,
  });

  if (error && !content) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={Tv}
          title="This title is not available"
          description={error}
          action={{ label: `Back to ${copy.plural}`, to: SECTIONS[section].basePath }}
        />
      </div>
    );
  }

  if (loading && !content) return <DetailSkeleton />;
  if (!content) return null;

  const episodeCount = seasons.reduce((total, season) => total + (season.episodes?.length ?? 0), 0);
  const firstEpisode =
    activeSeason?.episodes?.find((episode) => episode.episode_number > 0) ?? null;
  const startHref = firstEpisode
    ? episodePath(kind as ContentKind, content.slug, activeSeason!.season_number, firstEpisode.episode_number)
    : null;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <img
            src={content.poster || '/assets/poster-fallback.svg'}
            alt=""
            aria-hidden="true"
            className="h-full w-full scale-110 object-cover object-top opacity-30 blur-3xl"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/92 to-ink-950/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/60" />
          <div className="grain absolute inset-0" />
        </div>

        <div className="container-page relative py-8 sm:py-12">
          <Link
            to={SECTIONS[section].basePath}
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft size={14} /> All {copy.plural}
          </Link>

          <div className="grid gap-8 sm:grid-cols-[200px_1fr] lg:grid-cols-[250px_1fr]">
            <div className="hidden sm:block">
              <PosterImage
                src={content.poster}
                alt={content.title}
                eager
                className="w-full rounded-2xl shadow-card ring-1 ring-white/15"
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge bg-brand-500/15 text-brand-200 ring-1 ring-brand-500/30">
                  {kind === 'anime' ? <Film size={12} /> : <Tv size={12} />} {copy.label}
                </span>
                {content.category_name && content.category_slug && (
                  <Link
                    to={categoryPath(kind as ContentKind, content.category_slug)}
                    className="badge bg-white/[0.06] text-zinc-300 ring-1 ring-white/10 transition hover:text-white"
                  >
                    <Tag size={11} /> {content.category_name}
                  </Link>
                )}
                <span className="badge bg-white/[0.06] text-zinc-300 ring-1 ring-white/10">
                  <Layers size={11} /> {seasons.length} {seasons.length === 1 ? 'season' : 'seasons'}
                </span>
                <span className="badge bg-white/[0.06] text-zinc-300 ring-1 ring-white/10">
                  {episodeCount} episodes
                </span>
              </div>

              <h1 className="text-shadow mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                {content.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-zinc-400">
                {content.year && (
                  <span className="inline-flex items-center gap-1.5"><Calendar size={13} /> {content.year}</span>
                )}
                {content.language && (
                  <span className="inline-flex items-center gap-1.5"><Languages size={13} /> {content.language}</span>
                )}
                {content.country && (
                  <span className="inline-flex items-center gap-1.5"><Globe2 size={13} /> {content.country}</span>
                )}
                {content.status === 'draft' && (
                  <span className="inline-flex items-center gap-1.5 text-amber-300">Draft preview</span>
                )}
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                {content.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {content.genres.map((genre) => (
                  <Link key={genre} to={`/search?genre=${encodeURIComponent(genre)}`} className="chip">
                    {genre}
                  </Link>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                {startHref ? (
                  <Link to={startHref} className="btn-primary px-6 py-3">
                    <Play size={17} fill="currentColor" />
                    {activeSeason && activeSeason.season_number !== 1
                      ? `Watch season ${activeSeason.season_number}`
                      : 'Start watching'}
                  </Link>
                ) : (
                  <button type="button" disabled className="btn-primary px-6 py-3 opacity-50">
                    <Play size={17} /> No episodes yet
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setTrailerOpen((open) => !open);
                    window.setTimeout(
                      () => document.getElementById('trailer')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
                      80
                    );
                  }}
                  className="btn-secondary px-5 py-3"
                >
                  <Film size={16} /> {trailerOpen ? 'Hide trailer' : 'Watch trailer'}
                </button>
              </div>

              <div className="mt-6 flex sm:hidden">
                <PosterImage
                  src={content.poster}
                  alt={content.title}
                  eager
                  className="w-36 rounded-xl ring-1 ring-white/15"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-8">
          {trailerOpen && (
            <section id="trailer" className="scroll-mt-24">
              <h2 className="mb-3 font-display text-lg font-bold text-white">Official trailer</h2>
              <VideoEmbed src={content.trailer} title={`${content.title} trailer`} />
            </section>
          )}

          {/* Seasons */}
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-white sm:text-2xl">Seasons &amp; episodes</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Choose a season to see every episode. {seasons.length > 0 ? `${seasons.length} season${seasons.length === 1 ? '' : 's'} available.` : ''}
                </p>
              </div>
            </div>

            {seasons.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No seasons yet"
                description="The administrator has not added any seasons to this title."
              />
            ) : (
              <div className="space-y-4">
                <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {seasons.map((season) => (
                    <button
                      key={season.id}
                      type="button"
                      onClick={() => setActiveSeasonId(season.id)}
                      className={cn(
                        'flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition',
                        activeSeason?.id === season.id
                          ? 'border-brand-500/60 bg-brand-500/15 text-white'
                          : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/25 hover:text-white'
                      )}
                      aria-pressed={activeSeason?.id === season.id}
                    >
                      <Layers size={14} />
                      {season.title || `Season ${season.season_number}`}
                      <span className="rounded-md bg-black/30 px-1.5 py-0.5 text-[10px] text-zinc-400">
                        {season.episodes?.length ?? 0}
                      </span>
                    </button>
                  ))}
                </div>

                {activeSeason && (
                  <div className="panel overflow-hidden">
                    <div className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-bold text-white">
                          {activeSeason.title || `Season ${activeSeason.season_number}`}
                        </h3>
                        {(activeSeason.description || activeSeason.story) && (
                          <p className="mt-1 text-xs leading-relaxed text-zinc-500 line-clamp-2">
                            {activeSeason.description || activeSeason.story}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                          {activeSeason.year && <span>{activeSeason.year}</span>}
                          {activeSeason.language && <span>· {activeSeason.language}</span>}
                          {activeSeason.country && <span>· {activeSeason.country}</span>}
                        </div>
                      </div>
                      <span className="badge shrink-0 bg-white/5 text-zinc-300 ring-1 ring-white/10">
                        {activeSeason.episodes?.length ?? 0} episodes
                      </span>
                    </div>

                    <div className="divide-y divide-white/[0.06]">
                      {(activeSeason.episodes ?? []).length === 0 ? (
                        <div className="px-5 py-8 text-center text-sm text-zinc-500">
                          No episodes in this season yet.
                        </div>
                      ) : (
                        (activeSeason.episodes ?? []).map((episode) => (
                          <Link
                            key={episode.id}
                            to={episodePath(kind as ContentKind, content.slug, activeSeason.season_number, episode.episode_number)}
                            className="group flex items-center gap-4 px-4 py-3.5 transition hover:bg-white/[0.04] sm:px-5"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] font-display text-sm font-bold text-zinc-400 transition group-hover:border-brand-500/50 group-hover:bg-brand-500 group-hover:text-white">
                              {episode.episode_number}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-zinc-200 transition group-hover:text-white">
                                {episode.title || `Episode ${episode.episode_number}`}
                              </p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                                <span>Episode {episode.episode_number}</span>
                                {episode.duration && (
                                  <span className="inline-flex items-center gap-1">
                                    <Clock size={10} /> {episode.duration}
                                  </span>
                                )}
                                {episode.quality && <span>{episode.quality}</span>}
                              </div>
                            </div>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-zinc-500 transition group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:text-white">
                              <Play size={14} fill="currentColor" className="ml-0.5" />
                            </span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="panel p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-white">Story</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-400">
              {content.story || 'No story synopsis has been added for this title yet.'}
            </p>
          </section>
        </div>

        <aside className="space-y-5">
          <div className="panel p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-300">Details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Detail label="Type" value={copy.label} />
              <Detail label="Category" value={content.category_name ?? '—'} />
              <Detail label="Seasons" value={seasons.length} />
              <Detail label="Episodes" value={episodeCount} />
              <Detail label="Language" value={content.language ?? '—'} />
              <Detail label="Country" value={content.country ?? '—'} />
              <Detail label="Release year" value={content.year ? String(content.year) : '—'} />
            </dl>
          </div>

          <div className="panel p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-300">Genres</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {content.genres.length ? (
                content.genres.map((genre) => (
                  <span key={genre} className="chip">{genre}</span>
                ))
              ) : (
                <p className="text-xs text-zinc-500">No genres assigned.</p>
              )}
            </div>
          </div>

          <div className="panel p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-300">Quick jump</h2>
            <div className="mt-3 space-y-2">
              {seasons.map((season) => (
                <button
                  key={season.id}
                  type="button"
                  onClick={() => {
                    setActiveSeasonId(season.id);
                    document.getElementById('trailer')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:border-white/25 hover:text-white"
                >
                  <span className="truncate">{season.title || `Season ${season.season_number}`}</span>
                  <ChevronDown size={13} />
                </button>
              ))}
              {seasons.length === 0 && <p className="text-xs text-zinc-500">No seasons available.</p>}
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <div className="container-page mt-12">
          <ContentRow
            title="More like this"
            subtitle={content.category_name ? `More from ${content.category_name}` : undefined}
            items={related}
            loading={relatedState.loading}
            viewAllHref={content.category_slug ? categoryPath(kind as ContentKind, content.category_slug) : SECTIONS[section].basePath}
          />
        </div>
      )}
    </div>
  );
}

export type { Content };

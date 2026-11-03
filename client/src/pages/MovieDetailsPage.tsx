import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Clock,
  Crown,
  Film,
  Flag,
  Globe2,
  Info,
  Languages,
  Play,
  Star,
  Tag,
} from 'lucide-react';
import type { Content, ContentDetailResponse, ContentListResponse } from '../types';
import { contentService } from '../services/content.service';
import { userPreferences } from '../services/userPreferences';
import { useToast } from '../contexts/ToastContext';
import { useApiData } from '../hooks/useApiData';
import { useSeo } from '../hooks/useSeo';
import { PosterImage } from '../components/PosterImage';
import { VideoEmbed } from '../components/VideoEmbed';
import { ContentRow } from '../components/ContentRow';
import { EmptyState, ErrorState } from '../components/EmptyState';
import { AdSenseBanner } from '../components/common/AdSenseBanner';
import { CommunityReactions } from '../components/CommunityReactions';
import { CommentSection } from '../components/CommentSection';
import { ReportStreamModal } from '../components/ReportStreamModal';
import { cn } from '../utils/format';
import { categoryPath } from '../utils/routes';

export function MovieDetailsPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'player' | 'trailer'>('player');
  const playerRef = useRef<HTMLDivElement>(null);

  const { data, loading, error, refresh } = useApiData<ContentDetailResponse>(
    () => contentService.detail('movies', slug ?? ''),
    [slug]
  );

  const content = data?.content ?? null;

  const relatedState = useApiData<ContentListResponse>(
    () =>
      contentService.list('movies', {
        category: content?.category_slug || undefined,
        limit: 12,
      }),
    [content?.category_slug],
    { enabled: Boolean(content?.category_slug) }
  );

  useSeo({
    title: content ? content.title : 'Movie',
    description: content?.description || content?.story || undefined,
    image: content?.poster || undefined,
    type: 'video.movie',
    canonicalPath: content ? `/movie/${content.slug}` : undefined,
    jsonLd: content
      ? {
          '@context': 'https://schema.org',
          '@type': 'Movie',
          name: content.title,
          description: content.description,
          image: content.poster,
          datePublished: content.year ? String(content.year) : undefined,
          genre: content.genres,
          inLanguage: content.language || undefined,
          countryOfOrigin: content.country || undefined,
        }
      : undefined,
  });

  const related = useMemo(
    () => (relatedState.data?.items ?? []).filter((item) => item.id !== content?.id).slice(0, 10),
    [relatedState.data, content?.id]
  );

  const { notify } = useToast();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (content) {
      setInWatchlist(userPreferences.isInWatchlist(content.id, 'movie'));
    }
  }, [content]);

  const toggleWatchlist = () => {
    if (!content) return;
    const nowIn = userPreferences.toggleWatchlist(content, 'movie');
    setInWatchlist(nowIn);
    notify(nowIn ? 'Added to your VIP Watchlist' : 'Removed from your VIP Watchlist', 'info');
  };

  const openPlayer = () => {
    setTab('player');
    if (content) {
      userPreferences.recordWatch({
        id: content.id,
        slug: content.slug,
        title: content.title,
        poster: content.poster,
        kind: 'movie',
        progressPercent: 35,
      });
    }
    window.setTimeout(
      () => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      60
    );
  };

  if (error && !content) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={Film}
          title="This movie is not available"
          description={error}
          action={{ label: 'Back to movies', to: '/movies' }}
        />
      </div>
    );
  }

  if (loading && !content) {
    return <DetailSkeleton />;
  }

  if (!content) return null;

  return (
    <div>
      {/* Cinematic header */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <img
            src={content.poster || '/assets/poster-fallback.svg'}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="h-full w-full scale-110 object-cover object-top opacity-30 blur-3xl"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/92 to-ink-950/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/60" />
          <div className="grain absolute inset-0" />
        </div>

        <div className="container-page relative py-8 sm:py-12">
          <Link
            to="/movies"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft size={14} /> All movies
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
                  <Film size={12} /> Movie
                </span>
                {content.category_name && content.category_slug && (
                  <Link
                    to={categoryPath('movie', content.category_slug)}
                    className="badge bg-white/[0.06] text-zinc-300 ring-1 ring-white/10 transition hover:text-white"
                  >
                    <Tag size={11} /> {content.category_name}
                  </Link>
                )}
                {content.quality && (
                  <span className="badge bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/25">
                    {content.quality}
                  </span>
                )}
              </div>

              <h1 className="text-shadow mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                {content.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-zinc-400">
                {content.year && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={13} /> {content.year}
                  </span>
                )}
                {content.duration && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={13} /> {content.duration}
                  </span>
                )}
                {content.language && (
                  <span className="inline-flex items-center gap-1.5">
                    <Languages size={13} /> {content.language}
                  </span>
                )}
                {content.country && (
                  <span className="inline-flex items-center gap-1.5">
                    <Globe2 size={13} /> {content.country}
                  </span>
                )}
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                {content.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {content.genres.map((genre) => (
                  <Link key={genre} to={`/search?q=&genre=${encodeURIComponent(genre)}`} className="chip">
                    {genre}
                  </Link>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <button type="button" onClick={openPlayer} className="btn-primary px-6 py-3">
                  <Play size={17} fill="currentColor" /> Watch movie
                </button>
                <button
                  type="button"
                  onClick={toggleWatchlist}
                  className={cn(
                    'btn px-5 py-3 text-sm font-semibold transition',
                    inWatchlist
                      ? 'border border-gold-500/50 bg-gold-500/15 text-gold-300 ring-1 ring-gold-500/30'
                      : 'btn-secondary text-white'
                  )}
                >
                  <Bookmark size={16} className={inWatchlist ? 'fill-current text-gold-400' : ''} />
                  {inWatchlist ? 'In My Watchlist' : '+ Add to Watchlist'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('trailer');
                    window.setTimeout(
                      () => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
                      60
                    );
                  }}
                  className="btn-secondary px-5 py-3"
                >
                  <Film size={16} /> Trailer
                </button>
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="btn-secondary px-4 py-3 text-zinc-400 hover:text-rose-300"
                  title="Report playback or stream issue"
                >
                  <Flag size={15} /> Report
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
          <div ref={playerRef} className="scroll-mt-24">
            <div className="mb-3 flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 sm:w-fit">
              <button
                type="button"
                onClick={() => setTab('player')}
                className={cn(
                  'flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition sm:flex-none',
                  tab === 'player' ? 'bg-brand-500 text-white' : 'text-zinc-400 hover:text-white'
                )}
              >
                Watch movie
              </button>
              <button
                type="button"
                onClick={() => setTab('trailer')}
                className={cn(
                  'flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition sm:flex-none',
                  tab === 'trailer' ? 'bg-brand-500 text-white' : 'text-zinc-400 hover:text-white'
                )}
              >
                Trailer
              </button>
            </div>

            {tab === 'player' ? (
              <VideoEmbed
                src={content.movie_video}
                title={`${content.title} player`}
                emptyLabel="No movie video has been attached yet"
              />
            ) : (
              <VideoEmbed
                src={content.trailer}
                title={`${content.title} trailer`}
                emptyLabel="No trailer has been attached yet"
              />
            )}
          </div>

          {/* Sponsored Ad Banner */}
          <AdSenseBanner slotType="player_bottom" />

          {/* 5-Star Audience Reactions */}
          <CommunityReactions contentType="movie" contentId={content.id} />

          <section className="panel p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-white">Story</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-400">
              {content.story || 'No story synopsis has been added for this title yet.'}
            </p>
          </section>

          {/* Cinema Community Reviews & Discussion */}
          <CommentSection contentType="movie" contentId={content.id} />
        </div>

        <aside className="space-y-5">
          <div className="panel p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-zinc-300">
              <Info size={15} className="text-brand-400" /> Details
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Detail label="Type" value="Movie" />
              <Detail label="Category" value={content.category_name ?? '—'} />
              <Detail label="Quality" value={content.quality ?? '—'} />
              <Detail label="Duration" value={content.duration ?? '—'} />
              <Detail label="Language" value={content.language ?? '—'} />
              <Detail label="Country" value={content.country ?? '—'} />
              <Detail label="Release year" value={content.year ? String(content.year) : '—'} />
              <Detail label="Status" value={content.status === 'published' ? 'Published' : 'Draft'} />
            </dl>
          </div>

          <div className="panel p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-zinc-300">
              <Star size={15} className="text-gold" /> Genres
            </h2>
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
        </aside>
      </div>

      {related.length > 0 && (
        <div className="container-page mt-12">
          <ContentRow
            title="More like this"
            subtitle={content.category_name ? `More from ${content.category_name}` : 'From the same category'}
            items={related}
            defaultKind="movie"
            loading={relatedState.loading}
            viewAllHref={content.category_slug ? categoryPath('movie', content.category_slug) : '/movies'}
          />
        </div>
      )}

      <ReportStreamModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        contentType="movie"
        contentId={content.id}
        contentTitle={content.title}
      />
    </div>
  );
}

export function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
      <dt className="shrink-0 text-xs text-zinc-500">{label}</dt>
      <dd className="text-right text-xs font-medium text-zinc-200">{value}</dd>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="container-page py-10">
      <div className="grid gap-8 sm:grid-cols-[200px_1fr] lg:grid-cols-[250px_1fr]">
        <div className="hidden aspect-[2/3] skeleton rounded-2xl sm:block" />
        <div className="space-y-4">
          <div className="h-4 w-24 skeleton" />
          <div className="h-12 w-4/5 skeleton" />
          <div className="h-4 w-2/5 skeleton" />
          <div className="h-4 w-full skeleton" />
          <div className="h-4 w-3/4 skeleton" />
          <div className="flex gap-3 pt-2">
            <div className="h-11 w-36 skeleton rounded-xl" />
            <div className="h-11 w-28 skeleton rounded-xl" />
          </div>
        </div>
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="aspect-video skeleton rounded-xl" />
        <div className="h-72 skeleton rounded-2xl" />
      </div>
    </div>
  );
}

export type { Content };

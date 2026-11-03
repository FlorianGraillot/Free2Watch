import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Layers,
  ListVideo,
  Play,
  Sparkles,
  Tv,
} from 'lucide-react';
import type { WatchData } from '../types';
import { catalogService } from '../services/catalog.service';
import { userPreferences } from '../services/userPreferences';
import { useToast } from '../contexts/ToastContext';
import { useApiData } from '../hooks/useApiData';
import { useSeo } from '../hooks/useSeo';
import { PosterImage } from '../components/PosterImage';
import { VideoEmbed } from '../components/VideoEmbed';
import { EmptyState } from '../components/EmptyState';
import { AdSenseBanner } from '../components/common/AdSenseBanner';
import { EpisodeAutoNext } from '../components/EpisodeAutoNext';
import { CommunityReactions } from '../components/CommunityReactions';
import { CommentSection } from '../components/CommentSection';
import { ReportStreamModal } from '../components/ReportStreamModal';
import { cn } from '../utils/format';
import { contentPath, episodePath, kindLabel, SECTIONS, sectionForKind } from '../utils/routes';

export function WatchPage({ kind }: { kind: 'series' | 'tv_show' | 'anime' }) {
  const { slug, seasonNumber, episodeNumber } = useParams();
  const section = sectionForKind(kind);
  const currentSeasonNumber = Number(seasonNumber);
  const currentEpisodeNumber = Number(episodeNumber);

  const { data, loading, error } = useApiData<WatchData>(
    () =>
      catalogService.watch(
        kind,
        slug ?? '',
        Number.isFinite(currentSeasonNumber) ? currentSeasonNumber : 1,
        Number.isFinite(currentEpisodeNumber) ? currentEpisodeNumber : 1
      ),
    [kind, slug, currentSeasonNumber, currentEpisodeNumber]
  );

  const { notify } = useToast();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (data?.content && data?.season && data?.episode) {
      setInWatchlist(userPreferences.isInWatchlist(data.content.id, kind));
      userPreferences.recordWatch({
        id: data.content.id,
        slug: data.content.slug,
        title: data.content.title,
        poster: data.content.poster,
        kind,
        progressPercent: 50,
        seasonNumber: data.season.season_number,
        episodeNumber: data.episode.episode_number,
        episodeTitle: data.episode.title,
      });
    }
  }, [data, kind]);

  const toggleWatchlist = () => {
    if (!data?.content) return;
    const nowIn = userPreferences.toggleWatchlist(data.content, kind);
    setInWatchlist(nowIn);
    notify(nowIn ? 'Added to your VIP Watchlist' : 'Removed from your VIP Watchlist', 'info');
  };

  const reportLink = () => {
    setReportOpen(true);
  };

  if (error && !data) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={Tv}
          title="Episode not available"
          description={error}
          action={{ label: 'Back to browse', to: SECTIONS[section].basePath }}
        />
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="container-page py-8">
        <div className="h-4 w-52 skeleton" />
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="aspect-video skeleton rounded-xl" />
            <div className="mt-5 h-8 w-2/3 skeleton" />
            <div className="mt-3 h-4 w-1/2 skeleton" />
          </div>
          <div className="h-[480px] skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { content, season, episode, episodes, previous, next } = data;
  const detailHref = contentPath(content, kind);

  return (
    <div className="container-page py-6 sm:py-8">
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-zinc-500">
        <Link to="/" className="transition hover:text-white">Home</Link>
        <span>/</span>
        <Link to={SECTIONS[section].basePath} className="transition hover:text-white">
          {SECTIONS[section].label}
        </Link>
        <span>/</span>
        <Link to={detailHref} className="transition hover:text-white">{content.title}</Link>
        <span>/</span>
        <span className="text-zinc-300">S{season.season_number} E{episode.episode_number}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="badge bg-brand-500/15 text-brand-200 ring-1 ring-brand-500/30">
              <Play size={11} fill="currentColor" /> Now playing
            </span>
            <span className="badge bg-white/[0.06] text-zinc-300 ring-1 ring-white/10">
              {kindLabel(kind)}
            </span>
          </div>

          <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {episode.title || `Episode ${episode.episode_number}`}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            {content.title} · {season.title || `Season ${season.season_number}`} · Episode{' '}
            {episode.episode_number}
          </p>

          <div className="mt-4">
            <VideoEmbed
              src={episode.episode_video}
              title={`${content.title} — S${season.season_number}E${episode.episode_number}`}
              emptyLabel="No video has been attached to this episode yet"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
              {episode.duration && (
                <span className="inline-flex items-center gap-1"><Clock size={12} /> {episode.duration}</span>
              )}
              {episode.quality && <span className="badge bg-white/5 text-zinc-300 ring-1 ring-white/10">{episode.quality}</span>}
              <span className="inline-flex items-center gap-1"><Layers size={12} /> {episodes.length} episodes this season</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleWatchlist}
                className={cn(
                  'btn-sm btn flex items-center gap-1.5 transition',
                  inWatchlist
                    ? 'border-gold-500/50 bg-gold-500/15 text-gold-300 ring-1 ring-gold-500/30'
                    : 'btn-secondary text-zinc-300'
                )}
                title={inWatchlist ? 'In My Watchlist' : 'Add to My Watchlist'}
              >
                <Bookmark size={13} className={inWatchlist ? 'fill-current text-gold-400' : ''} />
                <span>{inWatchlist ? 'In My List' : 'Watchlist'}</span>
              </button>

              <button
                type="button"
                onClick={reportLink}
                className="btn-secondary btn-sm text-zinc-400 hover:text-rose-300"
                title="Report broken or slow stream"
              >
                <Flag size={13} />
                <span className="hidden sm:inline">Report</span>
              </button>

              {previous ? (
                <Link
                  to={episodePath(kind, content.slug, season.season_number, previous.episode_number)}
                  className="btn-secondary btn-sm"
                >
                  <ChevronLeft size={15} /> Previous
                </Link>
              ) : (
                <span className="btn-secondary btn-sm cursor-not-allowed opacity-40">
                  <ChevronLeft size={15} /> Previous
                </span>
              )}
              {next ? (
                <Link
                  to={episodePath(kind, content.slug, season.season_number, next.episode_number)}
                  className="btn-primary btn-sm"
                >
                  Next episode <ChevronRight size={15} />
                </Link>
              ) : (
                <span className="btn-primary btn-sm cursor-not-allowed opacity-40">
                  Next episode <ChevronRight size={15} />
                </span>
              )}
            </div>
          </div>

          {/* Up Next Binge Bar */}
          {next && (
            <div className="mt-4">
              <EpisodeAutoNext
                nextEpisode={next}
                nextHref={episodePath(kind, content.slug, season.season_number, next.episode_number)}
              />
            </div>
          )}

          {/* Video Player Sponsored Banner */}
          <AdSenseBanner slotType="player_bottom" />

          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row">
            <Link to={detailHref} className="group flex items-center gap-3">
              <PosterImage
                src={content.poster}
                alt={content.title}
                className="h-24 w-16 shrink-0 rounded-lg ring-1 ring-white/10"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white group-hover:text-brand-300">{content.title}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {[content.year, content.category_name, content.language].filter(Boolean).join(' · ')}
                </p>
                <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-brand-400">
                  View all seasons <ChevronRight size={12} />
                </p>
              </div>
            </Link>

            <p className="hidden flex-1 border-l border-white/10 pl-4 text-xs leading-relaxed text-zinc-500 sm:block line-clamp-4">
              {content.description}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {content.genres.map((genre) => (
              <span key={genre} className="chip">{genre}</span>
            ))}
          </div>

          {/* 5-Star Audience Reactions */}
          <div className="mt-6">
            <CommunityReactions contentType={kind} contentId={content.id} />
          </div>

          {/* Episode Community Reviews & Discussion */}
          <div className="mt-6">
            <CommentSection contentType={kind} contentId={content.id} />
          </div>
        </div>

        {/* Episode list */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="panel overflow-hidden">
            <div className="border-b border-white/10 px-4 py-3">
              <h2 className="flex items-center gap-2 font-display text-sm font-bold text-white">
                <ListVideo size={15} className="text-brand-400" />
                {season.title || `Season ${season.season_number}`}
              </h2>
              <p className="mt-0.5 text-[11px] text-zinc-500">{episodes.length} episodes</p>
            </div>

            <div className="max-h-[540px] overflow-y-auto p-2">
              {episodes.map((item) => {
                const active = item.id === episode.id;
                return (
                  <Link
                    key={item.id}
                    to={episodePath(kind, content.slug, season.season_number, item.episode_number)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition',
                      active ? 'bg-brand-500/12 ring-1 ring-brand-500/30' : 'hover:bg-white/5'
                    )}
                    aria-current={active}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                        active
                          ? 'bg-brand-500 text-white'
                          : 'border border-white/10 bg-white/[0.03] text-zinc-500'
                      )}
                    >
                      {item.episode_number}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-xs font-semibold',
                          active ? 'text-white' : 'text-zinc-300'
                        )}
                      >
                        {item.title || `Episode ${item.episode_number}`}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-500">
                        {item.duration || '—'}
                        {item.quality ? ` · ${item.quality}` : ''}
                      </span>
                    </span>
                    {active && <Play size={13} fill="currentColor" className="text-brand-400" />}
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-white/10 p-3">
              <Link
                to={detailHref}
                className="btn-secondary w-full text-xs"
              >
                <ArrowLeft size={13} /> All seasons
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <ReportStreamModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        contentType={kind}
        contentId={content.id}
        contentTitle={`${content.title} — S${season.season_number}E${episode.episode_number}`}
      />
    </div>
  );
}

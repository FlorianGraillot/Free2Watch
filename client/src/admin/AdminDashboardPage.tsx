import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarPlus,
  Clapperboard,
  Film,
  FolderTree,
  Layers,
  ListVideo,
  MonitorPlay,
  Plus,
  Sparkles,
  Tags,
  Tv,
  Users,
} from 'lucide-react';
import type { Content, ContentKind, DashboardStats, RecentContent } from '../types';
import { dashboardService } from '../services/catalog.service';
import { useApiData } from '../hooks/useApiData';
import { useSeo } from '../hooks/useSeo';
import { useAuth } from '../contexts/AuthContext';
import { PosterImage } from '../components/PosterImage';
import { StatusBadge } from '../components/Field';
import { ErrorState } from '../components/EmptyState';
import { SECTIONS, sectionForKind } from '../utils/routes';
import { formatDate } from '../utils/format';
import { cn } from '../utils/format';

type DashboardData = { stats: DashboardStats; recent: RecentContent };
type RecentTabKey = 'movies' | 'series' | 'tvShows' | 'anime';

const RECENT_TABS: Array<{ key: RecentTabKey; label: string; routeKind: ContentKind }> = [
  { key: 'movies', label: 'Movies', routeKind: 'movie' },
  { key: 'series', label: 'TV Series', routeKind: 'series' },
  { key: 'tvShows', label: 'TV Shows', routeKind: 'tv_show' },
  { key: 'anime', label: 'Anime', routeKind: 'anime' },
];

export function AdminDashboardPage() {
  const { admin } = useAuth();
  const [recentTab, setRecentTab] = useState<RecentTabKey>('movies');

  const { data, loading, error, refresh } = useApiData<DashboardData>(async () => {
    const [stats, recent] = await Promise.all([dashboardService.stats(), dashboardService.recent()]);
    return { stats, recent };
  }, []);

  useSeo({
    title: 'Dashboard',
    description: 'FREE2WATCH administration overview with live SQLite statistics.',
  });

  const stats = data?.stats.stats;
  const recent = data?.recent;

  const cards = useMemo(
    () => [
      {
        label: 'Movies',
        value: stats?.movies ?? 0,
        detail: stats ? `${stats.moviesPublished} published` : '',
        icon: Film,
        href: '/admin/movies',
        accent: 'text-brand-300 bg-brand-500/10 ring-brand-500/20',
      },
      {
        label: 'TV Series',
        value: stats?.series ?? 0,
        detail: stats ? `${stats.seriesPublished} published` : '',
        icon: Tv,
        href: '/admin/series',
        accent: 'text-sky-300 bg-sky-500/10 ring-sky-500/20',
      },
      {
        label: 'TV Shows',
        value: stats?.tvShows ?? 0,
        detail: stats ? `${stats.tvShowsPublished} published` : '',
        icon: MonitorPlay,
        href: '/admin/tv-shows',
        accent: 'text-violet-300 bg-violet-500/10 ring-violet-500/20',
      },
      {
        label: 'Anime',
        value: stats?.anime ?? 0,
        detail: stats ? `${stats.animePublished} published` : '',
        icon: Sparkles,
        href: '/admin/anime',
        accent: 'text-gold bg-gold/10 ring-gold/20',
      },
      {
        label: 'Seasons',
        value: stats?.seasons ?? 0,
        detail: 'Across episodic titles',
        icon: Layers,
        href: '/admin/series',
        accent: 'text-emerald-300 bg-emerald-500/10 ring-emerald-500/20',
      },
      {
        label: 'Episodes',
        value: stats?.episodes ?? 0,
        detail: 'Stored in SQLite',
        icon: ListVideo,
        href: '/admin/series',
        accent: 'text-rose-300 bg-rose-500/10 ring-rose-500/20',
      },
      {
        label: 'Categories',
        value: stats?.categories ?? 0,
        detail: 'Across four content types',
        icon: FolderTree,
        href: '/admin/categories',
        accent: 'text-cyan-300 bg-cyan-500/10 ring-cyan-500/20',
      },
      {
        label: 'Genres',
        value: stats?.genres ?? 0,
        detail: 'Reusable taxonomy',
        icon: Tags,
        href: '/admin/genres',
        accent: 'text-orange-300 bg-orange-500/10 ring-orange-500/20',
      },
    ],
    [stats]
  );

  const totalTitles = stats ? stats.movies + stats.series + stats.tvShows + stats.anime : 0;
  const maxDistribution = Math.max(
    1,
    ...(data?.stats.distribution ?? []).map((row) => row.published + row.drafts)
  );
  const currentTab = RECENT_TABS.find((tab) => tab.key === recentTab)!;
  const currentRecent: Content[] = recent?.[currentTab.key] ?? [];

  if (error && !data) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <div className="space-y-7">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-ink-850 via-ink-900 to-ink-950 p-6 sm:p-7">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="eyebrow">Control room</span>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Welcome back, {admin?.username ?? 'admin'}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
              {loading
                ? 'Loading live catalogue statistics…'
                : `${totalTitles} titles, ${stats?.seasons ?? 0} seasons and ${stats?.episodes ?? 0} episodes are stored in SQLite.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/movies/new" className="btn-primary btn-sm">
              <Plus size={14} /> Add movie
            </Link>
            <Link to="/admin/series/new" className="btn-secondary btn-sm">
              <Plus size={14} /> Add series
            </Link>
            <Link to="/admin/anime/new" className="btn-secondary btn-sm">
              <Plus size={14} /> Add anime
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-400">
            Catalogue statistics
          </h2>
          <span className="text-[11px] text-zinc-600">Live from SQLite</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {loading && !data
            ? Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-[104px] skeleton rounded-2xl" />
              ))
            : cards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.label}
                    to={card.href}
                    className="group rounded-2xl border border-white/10 bg-ink-850/70 p-4 transition hover:border-white/20 hover:bg-ink-850"
                  >
                    <div className="flex items-start justify-between">
                      <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl ring-1', card.accent)}>
                        <Icon size={17} />
                      </span>
                      <ArrowUpRight
                        size={14}
                        className="text-zinc-600 transition group-hover:text-white"
                      />
                    </div>
                    <p className="mt-3 font-display text-2xl font-extrabold leading-none text-white">
                      {card.value}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-zinc-400">{card.label}</p>
                    <p className="mt-0.5 truncate text-[10px] text-zinc-600">{card.detail}</p>
                  </Link>
                );
              })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        {/* Recent titles */}
        <section className="rounded-2xl border border-white/10 bg-ink-850/70">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="font-display text-sm font-bold text-white">Recently added</h2>
              <p className="text-[11px] text-zinc-500">The five newest titles per content type</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {RECENT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setRecentTab(tab.key)}
                  className={cn(
                    'rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition',
                    recentTab === tab.key
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-500 hover:bg-white/5 hover:text-white'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {loading && !data ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <div className="h-14 w-10 skeleton rounded-md" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 skeleton" />
                    <div className="h-2.5 w-1/3 skeleton" />
                  </div>
                </div>
              ))
            ) : currentRecent.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-zinc-500">
                No {currentTab.label.toLowerCase()} yet.{' '}
                <Link
                  to={`${SECTIONS[sectionForKind(currentTab.routeKind)].adminPath}/new`}
                  className="font-semibold text-brand-400 hover:text-brand-300"
                >
                  Create the first one
                </Link>
              </div>
            ) : (
              currentRecent.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <PosterImage
                    src={item.poster}
                    alt={item.title}
                    className="h-14 w-10 shrink-0 rounded-md ring-1 ring-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      {[item.year, formatDate(item.created_at)].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                  <Link
                    to={`${SECTIONS[sectionForKind(currentTab.routeKind)].adminPath}/${item.id}/edit`}
                    className="hidden text-[11px] font-semibold text-zinc-500 transition hover:text-white sm:inline"
                  >
                    Edit
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Distribution */}
        <section className="rounded-2xl border border-white/10 bg-ink-850/70 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-white">Content distribution</h2>
            <span className="badge bg-white/5 text-zinc-400 ring-1 ring-white/10">Published vs draft</span>
          </div>

          <div className="mt-5 space-y-4">
            {(data?.stats.distribution ?? []).map((row) => {
              const total = row.published + row.drafts;
              const width = Math.max(4, Math.round((total / maxDistribution) * 100));
              return (
                <div key={row.type}>
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-zinc-300">{row.type}</span>
                    <span className="text-zinc-500">
                      {row.published} live · {row.drafts} draft
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                    <div className="flex h-full" style={{ width: `${width}%` }}>
                      <div
                        className="h-full bg-gradient-to-r from-brand-600 to-brand-400"
                        style={{ width: total ? `${(row.published / total) * 100}%` : '0%' }}
                      />
                      <div
                        className="h-full bg-amber-400/60"
                        style={{ width: total ? `${(row.drafts / total) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {!data && <div className="h-32 skeleton rounded-xl" />}
          </div>

          <div className="mt-6 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Top categories
              </h3>
              <Link to="/admin/categories" className="text-[11px] font-semibold text-brand-400 hover:text-brand-300">
                Manage
              </Link>
            </div>
            <div className="mt-3 space-y-2.5">
              {(data?.stats.categoryBreakdown ?? []).slice(0, 6).map((category) => (
                <div key={`${category.content_type}-${category.id}`} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-[11px] text-zinc-400">{category.name}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-white/25"
                      style={{
                        width: `${Math.max(
                          6,
                          (category.item_count /
                            Math.max(1, ...(data?.stats.categoryBreakdown ?? []).map((row) => row.item_count))) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="w-6 text-right text-[11px] font-semibold text-zinc-400">
                    {category.item_count}
                  </span>
                </div>
              ))}
              {data && data.stats.categoryBreakdown.length === 0 && (
                <p className="text-[11px] text-zinc-600">Categories in use will appear here.</p>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* Recent episodes */}
        <section className="rounded-2xl border border-white/10 bg-ink-850/70">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="font-display text-sm font-bold text-white">Recently added episodes</h2>
              <p className="text-[11px] text-zinc-500">Latest episodes across series, TV shows and anime</p>
            </div>
            <ListVideo size={16} className="text-zinc-600" />
          </div>
          <div className="divide-y divide-white/[0.06]">
            {loading && !data
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="px-4 py-3.5 sm:px-5">
                    <div className="h-3 w-1/2 skeleton" />
                    <div className="mt-2 h-2.5 w-1/3 skeleton" />
                  </div>
                ))
              : (recent?.episodes ?? []).map((episode) => {
                  const section = SECTIONS[sectionForKind(episode.content_type)];
                  return (
                    <div key={episode.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-[11px] font-bold text-brand-300 ring-1 ring-brand-500/20">
                        {episode.episode_number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {episode.parent_title ?? 'Unknown title'}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                          {episode.season_title} · {episode.title}
                        </p>
                      </div>
                      <span className="hidden text-[10px] text-zinc-600 sm:block">
                        {formatDate(episode.created_at)}
                      </span>
                      <Link
                        to={`${section.adminPath}/${episode.content_id}/manage`}
                        className="text-[11px] font-semibold text-zinc-500 transition hover:text-white"
                      >
                        Manage
                      </Link>
                    </div>
                  );
                })}
            {data && (recent?.episodes ?? []).length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-zinc-500">
                No episodes yet. Open a series, TV show or anime to add seasons and episodes.
              </div>
            )}
          </div>
        </section>

        {/* Quick actions */}
        <section className="rounded-2xl border border-white/10 bg-ink-850/70 p-4 sm:p-5">
          <h2 className="font-display text-sm font-bold text-white">Quick actions</h2>
          <p className="mt-0.5 text-[11px] text-zinc-500">Jump straight into content management</p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <QuickAction to="/admin/movies/new" icon={Film} label="Add movie" />
            <QuickAction to="/admin/series/new" icon={Tv} label="Add series" />
            <QuickAction to="/admin/tv-shows/new" icon={MonitorPlay} label="Add TV show" />
            <QuickAction to="/admin/anime/new" icon={Sparkles} label="Add anime" />
            <QuickAction to="/admin/categories" icon={FolderTree} label="Categories" />
            <QuickAction to="/admin/genres" icon={Tags} label="Genres" />
            <QuickAction to="/admin/settings" icon={Users} label="Admin settings" />
            <QuickAction to="/" icon={Clapperboard} label="View website" external />
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-300">
              <CalendarPlus size={14} className="text-brand-400" /> Reminder
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
              New titles are saved as drafts by default. Publish them from the content list when the
              poster, trailer and video are ready.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
  external,
}: {
  to: string;
  icon: typeof Film;
  label: string;
  external?: boolean;
}) {
  return (
    <Link
      to={to}
      target={external ? '_blank' : undefined}
      className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-[11px] font-semibold text-zinc-300 transition hover:border-brand-500/40 hover:bg-brand-500/[0.06] hover:text-white"
    >
      <Icon size={14} className="text-zinc-500" />
      {label}
    </Link>
  );
}

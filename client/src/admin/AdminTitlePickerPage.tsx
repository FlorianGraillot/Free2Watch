import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, Plus, Search, Tv } from 'lucide-react';
import type { ContentKind, TitleSummary } from '../types';
import { contentService } from '../services/content.service';
import { useApiData, useDebouncedValue } from '../hooks/useApiData';
import { useSeo } from '../hooks/useSeo';
import { PosterImage } from '../components/PosterImage';
import { StatusBadge } from '../components/Field';
import { EmptyState, ErrorState } from '../components/EmptyState';
import { SECTIONS, sectionForKind } from '../utils/routes';

export function AdminTitlePickerPage({ kind }: { kind: ContentKind }) {
  const section = sectionForKind(kind);
  const meta = SECTIONS[section];
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 350);

  useSeo({
    title: `Manage existing ${meta.label}`,
    description: `Select an existing ${meta.singular.toLowerCase()} to manage its seasons and episodes.`,
  });

  useEffect(() => {
    setQuery('');
  }, [section]);

  const { data, loading, error, refresh } = useApiData<TitleSummary[]>(
    () => contentService.titles(section, debounced, 60),
    [section, debounced]
  );

  const items = data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <Link
          to={meta.adminPath}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 transition hover:text-white"
        >
          <ArrowLeft size={13} /> Back to {meta.label}
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Manage existing</span>
            <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white">
              Select a {meta.singular.toLowerCase()}
            </h2>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-500">
              Choose an existing title to add seasons, episodes or edit its episode order. The parent
              title information is reused automatically — nothing is asked twice.
            </p>
          </div>
          <Link to={`${meta.adminPath}/new`} className="btn-primary btn-sm">
            <Plus size={14} /> Create new {meta.singular}
          </Link>
        </div>
      </div>

      <div className="relative max-w-lg">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${meta.label.toLowerCase()} by title…`}
          className="input pl-10"
          aria-label={`Search ${meta.label}`}
          autoFocus
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Tv}
          title={query ? `No matching ${meta.label.toLowerCase()}` : `No ${meta.label.toLowerCase()} yet`}
          description={
            query
              ? 'Try a different search term or clear the search field.'
              : `Create your first ${meta.singular.toLowerCase()} before adding seasons and episodes.`
          }
          action={{ label: `Create ${meta.singular}`, to: `${meta.adminPath}/new` }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(`${meta.adminPath}/${item.id}/manage`)}
              className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-850/70 p-3.5 text-left transition hover:border-brand-500/40 hover:bg-brand-500/[0.05]"
            >
              <PosterImage
                src={item.poster}
                alt={item.title}
                className="h-24 w-16 shrink-0 rounded-lg ring-1 ring-white/10"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white group-hover:text-brand-200">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">{item.year ?? 'Year unknown'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={item.status} />
                  <span className="badge bg-white/5 text-zinc-400 ring-1 ring-white/10">
                    <Layers size={10} /> {item.season_count} seasons
                  </span>
                  <span className="badge bg-white/5 text-zinc-400 ring-1 ring-white/10">
                    {item.episode_count} eps
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-zinc-600 transition group-hover:text-brand-300">
                Manage →
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

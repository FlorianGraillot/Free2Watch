import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FilterX, Search as SearchIcon, Sparkles, X } from 'lucide-react';
import type {
  Category,
  Content,
  ContentKind,
  Facets,
  Genre,
  Paginated,
} from '../types';
import { catalogService, taxonomyService } from '../services/catalog.service';
import { contentService } from '../services/content.service';
import { useApiData, useDebouncedValue } from '../hooks/useApiData';
import { useSeo } from '../hooks/useSeo';
import { ContentGrid } from '../components/ContentGrid';
import { EmptyState, ErrorState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { cn } from '../utils/format';

const TYPE_FILTERS: { value: ContentKind | 'all'; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'movie', label: 'Movies' },
  { value: 'series', label: 'TV Series' },
  { value: 'tv_show', label: 'TV Shows' },
  { value: 'anime', label: 'Anime' },
];

const KIND_TO_TYPE_PARAM: Record<ContentKind, string> = {
  movie: 'movie',
  series: 'series',
  tv_show: 'tv_show',
  anime: 'anime',
};

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const resultsRef = useRef<HTMLDivElement>(null);

  const q = searchParams.get('q') ?? '';
  const typesParam = searchParams.get('types') ?? '';
  const selectedTypes = typesParam ? typesParam.split(',').filter(Boolean) : [];
  const category = searchParams.get('category') ?? '';
  const genre = searchParams.get('genre') ?? '';
  const sort = searchParams.get('sort') ?? 'latest';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [term, setTerm] = useState(q);
  const debouncedTerm = useDebouncedValue(term, 400);

  useEffect(() => {
    setTerm(q);
  }, [q]);

  useEffect(() => {
    if (debouncedTerm === q) return;
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (debouncedTerm.trim()) next.set('q', debouncedTerm.trim());
        else next.delete('q');
        next.delete('page');
        return next;
      },
      { replace: true }
    );
  }, [debouncedTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const queryKey = searchParams.toString();
  const results = useApiData<Paginated<Content>>(
    () =>
      catalogService.search({
        q: q || undefined,
        types: selectedTypes.length ? selectedTypes.join(',') : undefined,
        category: category || undefined,
        genre: genre || undefined,
        sort,
        page,
        limit: 24,
      }),
    [queryKey]
  );

  const categoriesState = useApiData<Category[]>(() => taxonomyService.categories(), []);
  const genresState = useApiData<Genre[]>(() => taxonomyService.genres(), []);

  const categoryOptions = useMemo(() => {
    const all = categoriesState.data ?? [];
    if (!selectedTypes.length) return all;
    return all.filter((item) => selectedTypes.includes(KIND_TO_TYPE_PARAM[item.content_type]));
  }, [categoriesState.data, selectedTypes]);

  useSeo({
    title: q ? `Search: ${q}` : 'Search the catalogue',
    description: q
      ? `Search results for "${q}" across movies, TV series, TV shows and anime on FREE2WATCH.`
      : 'Search and filter movies, TV series, TV shows and anime on FREE2WATCH.',
    canonicalPath: '/search',
  });

  const updateParam = (key: string, value: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.delete('page');
      return next;
    });
  };

  const toggleType = (type: ContentKind | 'all') => {
    if (type === 'all') {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('types');
        next.delete('category');
        next.delete('page');
        return next;
      });
      return;
    }

    const nextTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((item) => item !== type)
      : [...selectedTypes, type];

    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextTypes.length) next.set('types', nextTypes.join(','));
      else next.delete('types');
      next.delete('category');
      next.delete('page');
      return next;
    });
  };

  const clearAll = () => {
    setTerm('');
    setSearchParams(new URLSearchParams());
  };

  const activeFilters = [q, typesParam, category, genre].filter(Boolean).length;
  const items = results.data?.items ?? [];
  const pagination = results.data?.pagination;

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-850 via-ink-900 to-ink-950 px-6 py-8 sm:px-9 sm:py-10">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="eyebrow inline-flex items-center gap-1.5">
            <Sparkles size={12} /> Search FREE2WATCH
          </span>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Find your next watch
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Search every movie, TV series, TV show and anime in the catalogue. Partial titles work too.
          </p>

          <div className="relative mt-5">
            <SearchIcon
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Type a title, for example: Sintel"
              className="input h-13 rounded-2xl bg-ink-950/80 py-3.5 pl-12 pr-12 text-base"
              autoFocus
              aria-label="Search titles"
            />
            {term && (
              <button
                type="button"
                onClick={() => setTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-white"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div ref={resultsRef} className="mt-6 scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_FILTERS.map((filter) => {
            const active =
              filter.value === 'all' ? selectedTypes.length === 0 : selectedTypes.includes(filter.value);
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => toggleType(filter.value)}
                className={cn('chip px-3.5 py-2', active && 'chip-active')}
                aria-pressed={active}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="panel-soft flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
          <select
            value={category}
            onChange={(event) => updateParam('category', event.target.value)}
            className="select flex-1 py-2 text-xs"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categoryOptions.map((item) => (
              <option key={`${item.content_type}-${item.id}`} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={genre}
            onChange={(event) => updateParam('genre', event.target.value)}
            className="select flex-1 py-2 text-xs"
            aria-label="Filter by genre"
          >
            <option value="">All genres</option>
            {(genresState.data ?? []).map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => updateParam('sort', event.target.value)}
            className="select flex-1 py-2 text-xs"
            aria-label="Sort results"
          >
            <option value="latest">Recently added</option>
            <option value="oldest">Oldest first</option>
            <option value="year">Release year</option>
            <option value="title">Title A–Z</option>
          </select>

          {activeFilters > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="btn-secondary btn-sm shrink-0"
            >
              <FilterX size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      <div className="mt-7">
        {results.error ? (
          <ErrorState message={results.error} onRetry={results.refresh} />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
              <p>
                {results.loading && !results.data
                  ? 'Searching…'
                  : `${pagination?.total ?? 0} ${pagination?.total === 1 ? 'result' : 'results'}${
                      q ? ` for “${q}”` : ''
                    }`}
              </p>
              {pagination && pagination.totalPages > 1 && (
                <p>Page {pagination.page} of {pagination.totalPages}</p>
              )}
            </div>

            <ContentGrid
              items={items}
              loading={results.loading}
              skeletonCount={18}
              emptyState={
                <EmptyState
                  icon={SearchIcon}
                  title={q ? `No results for “${q}”` : 'No titles match these filters'}
                  description="Check the spelling, try a shorter keyword, or remove a filter to widen the search."
                  action={{ label: 'Reset search', onClick: clearAll }}
                />
              }
            />

            {pagination && (
              <Pagination
                className="mt-10"
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(nextPage) => {
                  updateParam('page', String(nextPage));
                  window.setTimeout(
                    () => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                    60
                  );
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

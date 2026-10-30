import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Clapperboard,
  FilterX,
  Grid2X2,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tv,
} from 'lucide-react';
import type { Category, Content, ContentListResponse, Facets, Genre, Section } from '../types';
import { contentService } from '../services/content.service';
import { taxonomyService } from '../services/catalog.service';
import { useApiData, useDebouncedValue } from '../hooks/useApiData';
import { useSeo } from '../hooks/useSeo';
import { ContentGrid } from '../components/ContentGrid';
import { EmptyState, ErrorState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { SECTIONS } from '../utils/routes';
import { cn } from '../utils/format';

interface BrowsePageProps {
  section: Section;
  categoryMode?: boolean;
}

const SORT_OPTIONS = [
  { value: 'latest', label: 'Recently added' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'year', label: 'Release year' },
  { value: 'title', label: 'Title A–Z' },
];

const SECTION_BLURB: Record<Section, string> = {
  movies: 'Feature films from every corner of the world — filtered the way you want to watch.',
  series: 'Multi-season storytelling with full season and episode browsing.',
  'tv-shows': 'Episodic formats, panel shows, reality and everything in between.',
  anime: 'Japanese, Chinese, Korean and dubbed animation, organised by season.',
};

export function BrowsePage({ section, categoryMode = false }: BrowsePageProps) {
  const meta = SECTIONS[section];
  const { slug: categorySlugParam } = useParams();
  const categorySlug = categoryMode ? categorySlugParam : undefined;
  const [searchParams, setSearchParams] = useSearchParams();
  const resultsRef = useRef<HTMLDivElement>(null);

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const sort = searchParams.get('sort') || 'latest';
  const genre = searchParams.get('genre') || '';
  const year = searchParams.get('year') || '';
  const language = searchParams.get('language') || '';
  const country = searchParams.get('country') || '';
  const quality = searchParams.get('quality') || '';
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(searchParam);
  const debouncedSearch = useDebouncedValue(searchTerm, 400);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setSearchTerm(searchParam);
  }, [searchParam]);

  // Keep the search box and the URL in sync without adding history noise.
  useEffect(() => {
    if (debouncedSearch === searchParam) return;
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (debouncedSearch.trim()) next.set('q', debouncedSearch.trim());
        else next.delete('q');
        next.delete('page');
        return next;
      },
      { replace: true }
    );
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const categoriesState = useApiData<Category[]>(
    () => taxonomyService.categories(meta.kind),
    [meta.kind]
  );
  const genresState = useApiData<Genre[]>(() => taxonomyService.genres(), []);
  const facetsState = useApiData<Facets>(() => contentService.facets(section), [section]);

  const queryKey = searchParams.toString();
  const listState = useApiData<ContentListResponse>(
    () =>
      contentService.list(section, {
        page,
        limit: 24,
        sort,
        search: searchParam || undefined,
        category: categorySlug || categoryParam || undefined,
        genre: genre || undefined,
        year: year || undefined,
        language: language || undefined,
        country: country || undefined,
        quality: quality || undefined,
      }),
    [section, categorySlug, categoryParam, queryKey]
  );

  const category = useMemo(
    () => (categoriesState.data ?? []).find((item) => item.slug === categorySlug),
    [categoriesState.data, categorySlug]
  );

  const title = categoryMode ? category?.name ?? 'Category' : meta.label;
  const description = categoryMode
    ? `Browse ${category?.name ?? 'this category'} on FREE2WATCH. ${meta.label} with posters, metadata and full details.`
    : SECTION_BLURB[section];

  useSeo({
    title: categoryMode ? `${title} — ${meta.label}` : `${meta.label} — Watch on FREE2WATCH`,
    description,
    canonicalPath: categoryMode
      ? `${meta.basePath}/category/${categorySlug ?? ''}`
      : meta.basePath,
    type: section === 'movies' ? 'video.movie' : 'video.tv_show',
  });

  const updateParam = (key: string, value: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.delete('page');
      return next;
    });
    if (key !== 'page') {
      window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    const next = new URLSearchParams();
    if (categorySlug && !categoryMode) next.set('category', categorySlug);
    setSearchParams(next);
  };

  const activeFilterCount = [genre, year, language, country, quality, categoryMode ? '' : categoryParam, searchParam]
    .filter(Boolean).length;

  const items = listState.data?.items ?? [];
  const pagination = listState.data?.pagination;
  const facets = facetsState.data;

  const onPage = (nextPage: number) => {
    updateParam('page', String(nextPage));
    window.setTimeout(
      () => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      60
    );
  };


  return (
    <div className="container-page py-8 sm:py-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-850 via-ink-900 to-ink-950 px-6 py-8 sm:px-9 sm:py-10">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative">
          <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-zinc-500">
            <Link to="/" className="transition hover:text-white">Home</Link>
            <span>/</span>
            <Link to={meta.basePath} className="transition hover:text-white">{meta.label}</Link>
            {categoryMode && (
              <>
                <span>/</span>
                <span className="text-zinc-300">{category?.name ?? 'Category'}</span>
              </>
            )}
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="eyebrow inline-flex items-center gap-1.5">
                <SectionIcon section={section} />
                {categoryMode ? 'Category' : 'Collection'}
              </span>
              <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {title}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">{description}</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3">
              <Grid2X2 size={16} className="text-brand-400" />
              <div>
                <p className="text-lg font-bold leading-none text-white">{pagination?.total ?? '—'}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">titles available</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search + controls */}
      <div ref={resultsRef} className="mt-6 scroll-mt-24 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-md">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={`Search ${meta.label.toLowerCase()} by title…`}
              className="input pl-10"
              aria-label={`Search ${meta.label}`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-zinc-500 sm:inline">
                Sort
              </span>
              <select
                value={sort}
                onChange={(event) => updateParam('sort', event.target.value)}
                className="select w-auto min-w-[160px] py-2 text-xs"
                aria-label="Sort results"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className={cn('btn-secondary btn-sm lg:hidden', activeFilterCount > 0 && 'border-brand-500/40')}
            >
              <SlidersHorizontal size={14} />
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          </div>
        </div>

        <div className={cn('panel-soft p-4', !filtersOpen && 'hidden lg:block')}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {!categoryMode && (
              <FilterSelect
                label="Category"
                value={categoryParam}
                onChange={(value) => updateParam('category', value)}
                options={(categoriesState.data ?? []).map((item) => ({ value: item.slug, label: item.name }))}
                placeholder="All categories"
              />
            )}
            <FilterSelect
              label="Genre"
              value={genre}
              onChange={(value) => updateParam('genre', value)}
              options={(genresState.data ?? []).map((item) => ({ value: item.name, label: item.name }))}
              placeholder="All genres"
            />
            <FilterSelect
              label="Year"
              value={year}
              onChange={(value) => updateParam('year', value)}
              options={(facets?.years ?? []).map((value) => ({ value: String(value), label: String(value) }))}
              placeholder="Any year"
            />
            <FilterSelect
              label="Language"
              value={language}
              onChange={(value) => updateParam('language', value)}
              options={(facets?.languages ?? []).map((value) => ({ value, label: value }))}
              placeholder="Any language"
            />
            <FilterSelect
              label="Country"
              value={country}
              onChange={(value) => updateParam('country', value)}
              options={(facets?.countries ?? []).map((value) => ({ value, label: value }))}
              placeholder="Any country"
            />
            {section === 'movies' && (
              <FilterSelect
                label="Quality"
                value={quality}
                onChange={(value) => updateParam('quality', value)}
                options={(facets?.qualities ?? []).map((value) => ({ value, label: value }))}
                placeholder="Any quality"
              />
            )}
          </div>

          {activeFilterCount > 0 && (
            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
              <p className="text-[11px] text-zinc-500">
                {activeFilterCount} active {activeFilterCount === 1 ? 'filter' : 'filters'}
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 transition hover:text-white"
              >
                <FilterX size={13} /> Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mt-7">
        {listState.error ? (
          <ErrorState message={listState.error} onRetry={listState.refresh} />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3 text-xs text-zinc-500">
              <p>
                {listState.loading && !listState.data
                  ? 'Loading titles…'
                  : `${pagination?.total ?? 0} ${pagination?.total === 1 ? 'title' : 'titles'} found`}
              </p>
              {pagination && pagination.totalPages > 1 && (
                <p>
                  Page {pagination.page} of {pagination.totalPages}
                </p>
              )}
            </div>

            <ContentGrid
              items={items}
              loading={listState.loading}
              skeletonCount={18}
              emptyState={
                <EmptyState
                  icon={Clapperboard}
                  title="No titles match these filters"
                  description="Try a different search term, remove a filter, or explore another category."
                  action={{ label: 'Clear filters', onClick: clearFilters }}
                />
              }
            />

            {pagination && (
              <Pagination
                className="mt-10"
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={onPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SectionIcon({ section }: { section: Section }) {
  if (section === 'anime') return <Sparkles size={12} />;
  if (section === 'movies') return <Clapperboard size={12} />;
  return <Tv size={12} />;
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn('select py-2 text-xs', value && 'border-brand-500/40 text-white')}
        aria-label={label}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

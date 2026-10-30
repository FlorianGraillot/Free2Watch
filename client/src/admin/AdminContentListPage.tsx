import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ExternalLink,
  FolderOpen,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import type { Category, Content, ContentListResponse, ContentKind, Facets } from '../types';
import { contentService } from '../services/content.service';
import { taxonomyService } from '../services/catalog.service';
import { useApiData, useDebouncedValue } from '../hooks/useApiData';
import { useSeo } from '../hooks/useSeo';
import { useToast } from '../contexts/ToastContext';
import { apiErrorMessage } from '../services/api';
import { PosterImage } from '../components/PosterImage';
import { StatusBadge } from '../components/Field';
import { ConfirmDialog, Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { EmptyState, ErrorState } from '../components/EmptyState';
import { cn, formatDate } from '../utils/format';
import { contentPath, SECTIONS, sectionForKind } from '../utils/routes';

const PAGE_SIZE = 10;

export function AdminContentListPage({ kind }: { kind: ContentKind }) {
  const section = sectionForKind(kind);
  const meta = SECTIONS[section];
  const isEpisodic = kind !== 'movie';
  const navigate = useNavigate();
  const { notify } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchParam = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? 'all';
  const category = searchParams.get('category') ?? '';
  const year = searchParams.get('year') ?? '';
  const sort = searchParams.get('sort') ?? 'latest';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [searchTerm, setSearchTerm] = useState(searchParam);
  const debouncedSearch = useDebouncedValue(searchTerm, 400);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Content | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  useSeo({
    title: `${meta.label} management`,
    description: `Create, edit, publish and delete ${meta.label.toLowerCase()} on FREE2WATCH.`,
  });

  useEffect(() => {
    setSearchTerm(searchParam);
  }, [searchParam]);

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

  const queryKey = searchParams.toString();
  const listState = useApiData<ContentListResponse>(
    () =>
      contentService.list(section, {
        status,
        search: searchParam || undefined,
        category: category || undefined,
        year: year || undefined,
        sort,
        page,
        limit: PAGE_SIZE,
      }),
    [section, queryKey]
  );

  const categoriesState = useApiData<Category[]>(() => taxonomyService.categories(kind), [kind]);
  const facetsState = useApiData<Facets>(() => contentService.facets(section, true), [section]);

  const items = listState.data?.items ?? [];
  const pagination = listState.data?.pagination;
  const activeFilters = [searchParam, status !== 'all' ? status : '', category, year].filter(Boolean).length;

  const setParam = (key: string, value: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.delete('page');
      return next;
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSearchParams(new URLSearchParams());
  };

  const togglePublish = async (item: Content) => {
    setBusyId(item.id);
    try {
      const nextStatus = item.status === 'published' ? 'draft' : 'published';
      await contentService.setStatus(section, item.id, nextStatus);
      notify(
        nextStatus === 'published' ? `“${item.title}” is now published` : `“${item.title}” moved to drafts`,
        'success'
      );
      listState.refresh();
    } catch (error) {
      notify(apiErrorMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await contentService.remove(section, deleteTarget.id);
      notify(`“${deleteTarget.title}” was deleted`, 'success');
      setDeleteTarget(null);
      listState.refresh();
    } catch (error) {
      notify(apiErrorMessage(error), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const headerActions = useMemo(
    () => (
      <div className="flex flex-wrap gap-2">
        {isEpisodic && (
          <Link to={`${meta.adminPath}/manage`} className="btn-secondary btn-sm">
            <Layers size={14} /> Manage existing
          </Link>
        )}
        <button
          type="button"
          onClick={() => (isEpisodic ? setAddOpen(true) : navigate(`${meta.adminPath}/new`))}
          className="btn-primary btn-sm"
        >
          <Plus size={14} /> Add {meta.singular}
        </button>
      </div>
    ),
    [isEpisodic, meta, navigate]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">{meta.label}</span>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white">
            {meta.label} library
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {pagination ? `${pagination.total} ${pagination.total === 1 ? 'title' : 'titles'} stored in SQLite` : 'Loading…'}
            {isEpisodic ? ' · seasons and episodes are managed per title' : ''}
          </p>
        </div>
        {headerActions}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/10 bg-ink-850/60 p-3.5">
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_0.8fr_1fr_auto]">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={`Search ${meta.label.toLowerCase()}…`}
              className="input py-2 pl-9 text-xs"
              aria-label={`Search ${meta.label}`}
            />
          </div>

          <select className="select py-2 text-xs" value={status} onChange={(event) => setParam('status', event.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>

          <select className="select py-2 text-xs" value={category} onChange={(event) => setParam('category', event.target.value)} aria-label="Filter by category">
            <option value="">All categories</option>
            {(categoriesState.data ?? []).map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name} ({item.item_count ?? 0})
              </option>
            ))}
          </select>

          <select className="select py-2 text-xs" value={year} onChange={(event) => setParam('year', event.target.value)} aria-label="Filter by year">
            <option value="">Years</option>
            {(facetsState.data?.years ?? []).map((value) => (
              <option key={value} value={String(value)}>
                {value}
              </option>
            ))}
          </select>

          <select className="select py-2 text-xs" value={sort} onChange={(event) => setParam('sort', event.target.value)} aria-label="Sort">
            <option value="latest">Recently added</option>
            <option value="updated">Recently updated</option>
            <option value="title">Title A–Z</option>
            <option value="year">Release year</option>
          </select>

          {activeFilters > 0 ? (
            <button type="button" onClick={resetFilters} className="btn-ghost btn-sm justify-self-start px-2 text-zinc-400">
              Reset
            </button>
          ) : (
            <span className="hidden xl:block" />
          )}
        </div>
      </div>

      {listState.error ? (
        <ErrorState message={listState.error} onRetry={listState.refresh} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-850/60">
          <div className="hidden items-center gap-3 border-b border-white/10 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 md:flex">
            <span className="w-10 shrink-0" />
            <span className="flex-1">Title</span>
            <span className="w-32">Category</span>
            <span className="w-20">Year</span>
            <span className="w-24">Status</span>
            <span className="w-28">Updated</span>
            <span className="w-[188px] text-right">Actions</span>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {listState.loading && !listState.data
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-14 w-10 skeleton rounded-md" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 skeleton" />
                      <div className="h-2.5 w-1/3 skeleton" />
                    </div>
                  </div>
                ))
              : items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 transition hover:bg-white/[0.02] md:flex-nowrap"
                  >
                    <PosterImage
                      src={item.poster}
                      alt={item.title}
                      className="h-16 w-11 shrink-0 rounded-md ring-1 ring-white/10"
                    />

                    <div className="min-w-0 flex-1 basis-40">
                      <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                        /{meta.detailBase.replace('/', '')}/{item.slug}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500 md:hidden">
                        <span>{item.category_name ?? 'Uncategorized'}</span>
                        {item.year && <span>· {item.year}</span>}
                        {isEpisodic && <span>· {item.season_count ?? 0} seasons</span>}
                      </div>
                    </div>

                    <div className="hidden w-32 md:block">
                      <span className="block truncate text-[11px] text-zinc-400">
                        {item.category_name ?? '—'}
                      </span>
                      {isEpisodic && (
                        <span className="mt-0.5 block text-[10px] text-zinc-600">
                          {item.season_count ?? 0} seasons · {item.episode_count ?? 0} eps
                        </span>
                      )}
                    </div>

                    <span className="hidden w-20 text-[11px] text-zinc-400 md:block">{item.year ?? '—'}</span>
                    <span className="hidden w-24 md:block"><StatusBadge status={item.status} /></span>
                    <span className="hidden w-28 text-[10px] text-zinc-500 md:block">{formatDate(item.updated_at)}</span>

                    <div className="ml-auto flex items-center gap-1 md:ml-0 md:w-[188px] md:justify-end">
                      <Link
                        to={contentPath({ ...item, content_type: kind })}
                        target="_blank"
                        className="btn-icon h-8 w-8"
                        title="Preview on the public site"
                        aria-label={`Preview ${item.title}`}
                      >
                        <ExternalLink size={14} />
                      </Link>

                      {isEpisodic && (
                        <Link
                          to={`${meta.adminPath}/${item.id}/manage`}
                          className="btn-icon h-8 w-8"
                          title="Manage seasons and episodes"
                          aria-label={`Manage seasons for ${item.title}`}
                        >
                          <Layers size={14} />
                        </Link>
                      )}

                      <Link
                        to={`${meta.adminPath}/${item.id}/edit`}
                        className="btn-icon h-8 w-8"
                        title="Edit title"
                        aria-label={`Edit ${item.title}`}
                      >
                        <Pencil size={14} />
                      </Link>

                      <button
                        type="button"
                        onClick={() => togglePublish(item)}
                        disabled={busyId === item.id}
                        className={cn('btn-icon h-8 w-8', busyId === item.id && 'opacity-50')}
                        title={item.status === 'published' ? 'Unpublish' : 'Publish'}
                        aria-label={item.status === 'published' ? `Unpublish ${item.title}` : `Publish ${item.title}`}
                      >
                        {item.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="btn-icon h-8 w-8 hover:border-brand-500/50 hover:text-brand-300"
                        title="Delete title"
                        aria-label={`Delete ${item.title}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
          </div>

          {!listState.loading && items.length === 0 && (
            <div className="p-4">
              <EmptyState
                icon={FolderOpen}
                title={activeFilters ? 'No titles match these filters' : `No ${meta.label.toLowerCase()} yet`}
                description={
                  activeFilters
                    ? 'Adjust the search or clear filters to see more of the library.'
                    : `Create the first ${meta.singular.toLowerCase()} and it will be stored in SQLite immediately.`
                }
                action={
                  activeFilters
                    ? { label: 'Clear filters', onClick: resetFilters }
                    : { label: `Add ${meta.singular}`, onClick: () => (isEpisodic ? setAddOpen(true) : navigate(`${meta.adminPath}/new`)) }
                }
              />
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="border-t border-white/10 px-4 py-4">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(nextPage) => setParam('page', String(nextPage))}
              />
            </div>
          )}
        </div>
      )}

      {/* Add choices for episodic content */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={`Add ${meta.singular}`}
        description="Choose whether to create a brand new title or manage seasons and episodes on an existing one."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate(`${meta.adminPath}/new`)}
            className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left transition hover:border-brand-500/50 hover:bg-brand-500/[0.06]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/25">
              <Plus size={18} />
            </span>
            <span className="mt-3 block font-display text-sm font-bold text-white">Create a new title</span>
            <span className="mt-1 block text-[11px] leading-relaxed text-zinc-500">
              Add a completely new {meta.singular.toLowerCase()} with its own information, then add
              seasons and episodes.
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`${meta.adminPath}/manage`)}
            className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left transition hover:border-brand-500/50 hover:bg-brand-500/[0.06]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-zinc-300 ring-1 ring-white/10">
              <Layers size={18} />
            </span>
            <span className="mt-3 block font-display text-sm font-bold text-white">Manage an existing title</span>
            <span className="mt-1 block text-[11px] leading-relaxed text-zinc-500">
              Search the library, select a {meta.singular.toLowerCase()} and add or edit its seasons
              and episodes.
            </span>
          </button>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-[11px] leading-relaxed text-amber-200/80">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" />
          Parent title information is never requested again when adding seasons or episodes.
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${meta.singular.toLowerCase()}?`}
        message={`“${deleteTarget?.title ?? ''}” and ${
          isEpisodic ? 'all of its seasons and episodes' : 'its record'
        } will be permanently removed from SQLite. This cannot be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete permanently'}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

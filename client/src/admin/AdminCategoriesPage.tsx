import { useMemo, useState } from 'react';
import { FolderTree, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { Category, ContentTypeParam } from '../types';
import { taxonomyService } from '../services/catalog.service';
import { apiErrorMessage } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import { useSeo } from '../hooks/useSeo';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { Modal, ConfirmDialog } from '../components/Modal';
import { EmptyState, ErrorState } from '../components/EmptyState';
import { SECTIONS, sectionForKind } from '../utils/routes';
import { cn } from '../utils/format';

const TYPES: { value: ContentTypeParam; label: string }[] = [
  { value: 'movie', label: 'Movies' },
  { value: 'series', label: 'TV Series' },
  { value: 'tv_show', label: 'TV Shows' },
  { value: 'anime', label: 'Anime' },
];

export function AdminCategoriesPage() {
  const { notify } = useToast();
  const { data, loading, error, refresh } = useApiData<Category[]>(() => taxonomyService.categories(), []);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<{ open: boolean; category: Category | null }>({
    open: false,
    category: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [working, setWorking] = useState(false);
  const [form, setForm] = useState<{ name: string; content_type: ContentTypeParam }>({
    name: '',
    content_type: 'movie',
  });
  const [formError, setFormError] = useState('');

  useSeo({
    title: 'Category management',
    description: 'Add, edit and delete FREE2WATCH categories for each content type.',
  });

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = (data ?? []).filter((category) => !needle || category.name.toLowerCase().includes(needle));
    return TYPES.map((type) => ({
      ...type,
      items: filtered.filter((category) => category.content_type === type.value),
    }));
  }, [data, query]);

  const openCreate = () => {
    setForm({ name: '', content_type: 'movie' });
    setFormError('');
    setModal({ open: true, category: null });
  };

  const openEdit = (category: Category) => {
    setForm({ name: category.name, content_type: category.content_type });
    setFormError('');
    setModal({ open: true, category });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError('Category name is required.');
      return;
    }
    setWorking(true);
    setFormError('');
    try {
      if (modal.category) {
        await taxonomyService.updateCategory(modal.category.id, {
          name: form.name.trim(),
          content_type: form.content_type,
        });
        notify('Category updated', 'success');
      } else {
        await taxonomyService.createCategory({
          name: form.name.trim(),
          content_type: form.content_type,
        });
        notify('Category created', 'success');
      }
      setModal({ open: false, category: null });
      refresh();
    } catch (error) {
      setFormError(apiErrorMessage(error));
    } finally {
      setWorking(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setWorking(true);
    try {
      await taxonomyService.deleteCategory(deleteTarget.id);
      notify(`“${deleteTarget.name}” deleted`, 'success');
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      notify(apiErrorMessage(error), 'error');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Taxonomy</span>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white">Categories</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-500">
            Categories are scoped to one content type. Categories that are still in use cannot be
            deleted — reassign their titles first.
          </p>
        </div>
        <Button icon={<Plus size={15} />} onClick={openCreate}>Add category</Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search categories…"
            className="input pl-9"
            aria-label="Search categories"
          />
        </div>
        <p className="text-[11px] text-zinc-500">
          {data ? `${data.length} categories across ${TYPES.length} content types` : 'Loading…'}
        </p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-64 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {groups.map((group) => (
            <section key={group.value} className="rounded-2xl border border-white/10 bg-ink-850/70">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
                <h3 className="font-display text-sm font-bold text-white">{group.label}</h3>
                <span className="badge bg-white/5 text-zinc-400 ring-1 ring-white/10">
                  {group.items.length}
                </span>
              </div>
              <div className="divide-y divide-white/[0.05]">
                {group.items.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[11px] text-zinc-600">No categories.</p>
                ) : (
                  group.items.map((category) => (
                    <div key={category.id} className="group flex items-center gap-2 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-zinc-200">{category.name}</p>
                        <p className="mt-0.5 text-[10px] text-zinc-600">
                          {category.slug} · {category.item_count ?? 0} items
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-60 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => openEdit(category)}
                          className="btn-icon h-7 w-7"
                          aria-label={`Edit ${category.name}`}
                          title="Edit category"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(category)}
                          className="btn-icon h-7 w-7 hover:border-brand-500/50 hover:text-brand-300"
                          aria-label={`Delete ${category.name}`}
                          title="Delete category"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, category: null })}
        title={modal.category ? 'Edit category' : 'Add category'}
        description="Categories power public category pages such as /movies/category/korean-movies."
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModal({ open: false, category: null })}>
              Cancel
            </button>
            <Button type="submit" form="category-form" loading={working} icon={<FolderTree size={14} />}>
              {modal.category ? 'Save category' : 'Create category'}
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={submit} className="space-y-4">
          <Field label="Category name" htmlFor="category-name" required>
            <input
              id="category-name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="input"
              placeholder="Korean Movies"
              autoFocus
              maxLength={80}
            />
          </Field>
          <Field label="Content type" htmlFor="category-type" required hint="Changing the type is blocked while titles use this category.">
            <select
              id="category-type"
              value={form.content_type}
              onChange={(event) =>
                setForm((current) => ({ ...current, content_type: event.target.value as ContentTypeParam }))
              }
              className="select"
            >
              {TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </Field>
          {formError && (
            <p className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-xs text-brand-200">
              {formError}
            </p>
          )}
          {modal.category && (
            <p className={cn('rounded-lg px-3 py-2 text-[11px]', 'bg-white/[0.03] text-zinc-500')}>
              Used by {modal.category.item_count ?? 0} item(s). The slug is regenerated from the name.
            </p>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete category?"
        message={`“${deleteTarget?.name ?? ''}” will be deleted. If any titles still use it, the operation will be refused so no content is left without a category.`}
        confirmLabel={working ? 'Deleting…' : 'Delete category'}
        loading={working}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export const CATEGORY_TYPE_LABELS = TYPES;
export const categoryAdminPath = (type: ContentTypeParam) => SECTIONS[sectionForKind(type)].adminPath;

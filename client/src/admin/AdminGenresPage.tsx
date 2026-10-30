import { useState } from 'react';
import { Pencil, Plus, Search, Tags, Trash2 } from 'lucide-react';
import type { Genre } from '../types';
import { taxonomyService } from '../services/catalog.service';
import { apiErrorMessage } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import { useSeo } from '../hooks/useSeo';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { Modal, ConfirmDialog } from '../components/Modal';
import { EmptyState, ErrorState } from '../components/EmptyState';

export function AdminGenresPage() {
  const { notify } = useToast();
  const { data, loading, error, refresh } = useApiData<Genre[]>(() => taxonomyService.genres(), []);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<{ open: boolean; genre: Genre | null }>({ open: false, genre: null });
  const [deleteTarget, setDeleteTarget] = useState<Genre | null>(null);
  const [working, setWorking] = useState(false);
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');

  useSeo({
    title: 'Genre management',
    description: 'Create and manage the genres assigned to movies, series, TV shows and anime.',
  });

  const needle = query.trim().toLowerCase();
  const genres = (data ?? []).filter((genre) => !needle || genre.name.toLowerCase().includes(needle));

  const openCreate = () => {
    setName('');
    setFormError('');
    setModal({ open: true, genre: null });
  };

  const openEdit = (genre: Genre) => {
    setName(genre.name);
    setFormError('');
    setModal({ open: true, genre });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setFormError('Genre name is required.');
      return;
    }
    setWorking(true);
    setFormError('');
    try {
      if (modal.genre) {
        await taxonomyService.updateGenre(modal.genre.id, { name: name.trim() });
        notify('Genre updated — assigned titles were updated too', 'success');
      } else {
        await taxonomyService.createGenre({ name: name.trim() });
        notify('Genre created', 'success');
      }
      setModal({ open: false, genre: null });
      refresh();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setWorking(true);
    try {
      await taxonomyService.deleteGenre(deleteTarget.id);
      notify(`“${deleteTarget.name}” deleted`, 'success');
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Taxonomy</span>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white">Genres</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-500">
            Genres are global and reusable across all four content types. Renaming a genre updates every
            title that references it.
          </p>
        </div>
        <Button icon={<Plus size={15} />} onClick={openCreate}>Add genre</Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search genres…"
            className="input pl-9"
            aria-label="Search genres"
          />
        </div>
        <p className="text-[11px] text-zinc-500">{data ? `${data.length} genres` : 'Loading…'}</p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-20 skeleton rounded-xl" />
          ))}
        </div>
      ) : genres.length === 0 ? (
        <EmptyState
          icon={Tags}
          title={query ? 'No genres match your search' : 'No genres yet'}
          description="Genres let you tag titles and power public genre filters."
          action={{ label: 'Add genre', onClick: openCreate }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {genres.map((genre) => (
            <div
              key={genre.id}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-ink-850/70 px-4 py-3.5 transition hover:border-white/20"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20">
                <Tags size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-100">{genre.name}</p>
                <p className="text-[10px] text-zinc-500">{genre.item_count ?? 0} titles · {genre.slug}</p>
              </div>
              <div className="flex items-center gap-0.5 opacity-60 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => openEdit(genre)}
                  className="btn-icon h-7 w-7"
                  aria-label={`Edit ${genre.name}`}
                  title="Edit genre"
                >
                  <Pencil size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(genre)}
                  className="btn-icon h-7 w-7 hover:border-brand-500/50 hover:text-brand-300"
                  aria-label={`Delete ${genre.name}`}
                  title="Delete genre"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, genre: null })}
        title={modal.genre ? 'Edit genre' : 'Add genre'}
        description="Genres are stored once in SQLite and referenced by content rows as JSON."
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModal({ open: false, genre: null })}>
              Cancel
            </button>
            <Button type="submit" form="genre-form" loading={working} icon={<Tags size={14} />}>
              {modal.genre ? 'Save genre' : 'Create genre'}
            </Button>
          </>
        }
      >
        <form id="genre-form" onSubmit={submit} className="space-y-4">
          <Field label="Genre name" htmlFor="genre-name" required>
            <input
              id="genre-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="input"
              placeholder="Science Fiction"
              autoFocus
              maxLength={60}
            />
          </Field>
          {formError && (
            <p className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-xs text-brand-200">
              {formError}
            </p>
          )}
          {modal.genre && (modal.genre.item_count ?? 0) > 0 && (
            <p className="rounded-lg bg-white/[0.03] px-3 py-2 text-[11px] text-zinc-500">
              Used by {modal.genre.item_count} title(s). Renaming will update them all automatically.
            </p>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete genre?"
        message={`“${deleteTarget?.name ?? ''}” will be deleted. If any title still uses it, the operation will be refused until it is removed from those titles.`}
        confirmLabel={working ? 'Deleting…' : 'Delete genre'}
        loading={working}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

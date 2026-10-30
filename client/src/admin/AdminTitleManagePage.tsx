import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  Layers,
  ListVideo,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import type { Category, Content, ContentDetailResponse, ContentKind, Episode, Genre, Season } from '../types';
import {
  contentService,
  episodeService,
  seasonService,
  type EpisodePayload,
  type SeasonPayload,
} from '../services/content.service';
import { taxonomyService } from '../services/catalog.service';
import { apiErrorMessage } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import { useSeo } from '../hooks/useSeo';
import { useToast } from '../contexts/ToastContext';
import { PosterImage } from '../components/PosterImage';
import { VideoEmbed } from '../components/VideoEmbed';
import { GenrePicker } from '../components/GenrePicker';
import { Field, StatusBadge } from '../components/Field';
import { Modal, ConfirmDialog } from '../components/Modal';
import { Button } from '../components/Button';
import { EmptyState, ErrorState } from '../components/EmptyState';
import { cn } from '../utils/format';
import { contentPath, episodePath, SECTIONS, sectionForKind } from '../utils/routes';

export function AdminTitleManagePage({ kind }: { kind: ContentKind }) {
  const section = sectionForKind(kind);
  const meta = SECTIONS[section];
  const { id } = useParams();
  const contentId = Number(id);
  const { notify } = useToast();

  const [expanded, setExpanded] = useState<number | null>(null);
  const [seasonModal, setSeasonModal] = useState<{ open: boolean; season: Season | null }>({
    open: false,
    season: null,
  });
  const [episodeModal, setEpisodeModal] = useState<{
    open: boolean;
    season: Season | null;
    episode: Episode | null;
  }>({ open: false, season: null, episode: null });
  const [deleteSeason, setDeleteSeason] = useState<Season | null>(null);
  const [deleteEpisode, setDeleteEpisode] = useState<{ season: Season; episode: Episode } | null>(null);
  const [working, setWorking] = useState(false);
  const [movingId, setMovingId] = useState<number | null>(null);

  useSeo({
    title: `Manage ${meta.singular}`,
    description: `Add and edit seasons and episodes for a ${meta.singular.toLowerCase()} on FREE2WATCH.`,
  });

  const detailState = useApiData<ContentDetailResponse>(
    () => contentService.detail(section, contentId),
    [section, contentId],
    { enabled: Number.isFinite(contentId) }
  );
  const categoriesState = useApiData<Category[]>(() => taxonomyService.categories(kind), [kind]);
  const genresState = useApiData<Genre[]>(() => taxonomyService.genres(), []);

  const content = detailState.data?.content ?? null;
  const seasons = useMemo(
    () =>
      [...(detailState.data?.seasons ?? [])].sort((a, b) => a.season_number - b.season_number),
    [detailState.data]
  );

  useEffect(() => {
    if (seasons.length && expanded === null) setExpanded(seasons[0].id);
  }, [seasons, expanded]);

  const totalEpisodes = seasons.reduce((total, season) => total + (season.episodes?.length ?? 0), 0);

  const togglePublish = async () => {
    if (!content) return;
    setWorking(true);
    try {
      const nextStatus = content.status === 'published' ? 'draft' : 'published';
      await contentService.setStatus(section, content.id, nextStatus);
      notify(nextStatus === 'published' ? 'Title published' : 'Title moved to drafts', 'success');
      detailState.refresh();
    } catch (error) {
      notify(apiErrorMessage(error), 'error');
    } finally {
      setWorking(false);
    }
  };

  const confirmDeleteSeason = async () => {
    if (!deleteSeason) return;
    setWorking(true);
    try {
      await seasonService.remove(section, contentId, deleteSeason.id);
      notify(`“${deleteSeason.title}” deleted`, 'success');
      setDeleteSeason(null);
      detailState.refresh();
    } catch (error) {
      notify(apiErrorMessage(error), 'error');
    } finally {
      setWorking(false);
    }
  };

  const confirmDeleteEpisode = async () => {
    if (!deleteEpisode) return;
    setWorking(true);
    try {
      await episodeService.remove(section, contentId, deleteEpisode.season.id, deleteEpisode.episode.id);
      notify(`“${deleteEpisode.episode.title}” deleted`, 'success');
      setDeleteEpisode(null);
      detailState.refresh();
    } catch (error) {
      notify(apiErrorMessage(error), 'error');
    } finally {
      setWorking(false);
    }
  };

  const moveEpisode = async (season: Season, episode: Episode, direction: 'up' | 'down') => {
    setMovingId(episode.id);
    try {
      await episodeService.move(section, contentId, season.id, episode.id, direction);
      detailState.refresh();
    } catch (error) {
      notify(apiErrorMessage(error), 'error');
    } finally {
      setMovingId(null);
    }
  };

  if (detailState.error && !content) {
    return <ErrorState message={detailState.error} onRetry={detailState.refresh} />;
  }

  if (detailState.loading && !content) {
    return (
      <div className="space-y-4">
        <div className="h-32 skeleton rounded-2xl" />
        <div className="h-24 skeleton rounded-2xl" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={meta.adminPath}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 transition hover:text-white"
        >
          <ArrowLeft size={13} /> Back to {meta.label}
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link to={`${meta.adminPath}/${content.id}/edit`} className="btn-secondary btn-sm">
            <Pencil size={14} /> Edit title
          </Link>
          <Link to={contentPath({ ...content, content_type: kind })} target="_blank" className="btn-secondary btn-sm">
            <ExternalLink size={14} /> Preview
          </Link>
          <button type="button" onClick={togglePublish} disabled={working} className="btn-secondary btn-sm">
            {content.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
            {content.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Parent title — shown once, never requested again in child forms */}
      <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-ink-850 to-ink-900 p-4 sm:flex-row sm:items-center sm:p-5">
        <PosterImage
          src={content.poster}
          alt={content.title}
          className="h-32 w-[86px] shrink-0 rounded-xl ring-1 ring-white/15"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={content.status} />
            <span className="badge bg-white/5 text-zinc-400 ring-1 ring-white/10">{meta.singular}</span>
            {content.category_name && (
              <span className="badge bg-white/5 text-zinc-400 ring-1 ring-white/10">{content.category_name}</span>
            )}
          </div>
          <h2 className="mt-2 truncate font-display text-2xl font-extrabold text-white">{content.title}</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {[content.year, content.language, content.country, ...content.genres.slice(0, 3)].filter(Boolean).join(' · ')}
          </p>
          <p className="mt-2 line-clamp-2 max-w-2xl text-xs leading-relaxed text-zinc-500">
            {content.description}
          </p>
        </div>
        <div className="flex shrink-0 gap-3 sm:flex-col">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-center">
            <p className="font-display text-xl font-extrabold text-white">{seasons.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Seasons</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-center">
            <p className="font-display text-xl font-extrabold text-white">{totalEpisodes}</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Episodes</p>
          </div>
        </div>
      </section>

      {/* Seasons */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-white">Seasons</h3>
            <p className="text-[11px] text-zinc-500">
              Parent title is linked automatically. Season numbers must be unique.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setSeasonModal({ open: true, season: null })}
          >
            Add season
          </Button>
        </div>

        {seasons.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No seasons yet"
            description={`Add the first season for “${content.title}”. Episodes are added inside each season.`}
            action={{
              label: 'Add first season',
              onClick: () => setSeasonModal({ open: true, season: null }),
            }}
          />
        ) : (
          <div className="space-y-3">
            {seasons.map((season) => {
              const open = expanded === season.id;
              const episodes = season.episodes ?? [];
              return (
                <div key={season.id} className="overflow-hidden rounded-2xl border border-white/10 bg-ink-850/70">
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : season.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      aria-expanded={open}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-sm font-bold text-brand-300 ring-1 ring-brand-500/20">
                        {season.season_number}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-white">
                          {season.title || `Season ${season.season_number}`}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                          <span>{episodes.length} episodes</span>
                          {season.year && <span>· {season.year}</span>}
                          {season.language && <span>· {season.language}</span>}
                          {season.category_name && <span>· {season.category_name}</span>}
                        </span>
                      </span>
                      <ChevronDown
                        size={16}
                        className={cn('ml-auto shrink-0 text-zinc-500 transition-transform', open && 'rotate-180')}
                      />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEpisodeModal({ open: true, season, episode: null })}
                        className="btn-icon h-8 w-8"
                        title="Add episode"
                        aria-label={`Add episode to ${season.title}`}
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSeasonModal({ open: true, season })}
                        className="btn-icon h-8 w-8"
                        title="Edit season"
                        aria-label={`Edit ${season.title}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteSeason(season)}
                        className="btn-icon h-8 w-8 hover:border-brand-500/50 hover:text-brand-300"
                        title="Delete season"
                        aria-label={`Delete ${season.title}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="border-t border-white/10">
                      {(season.description || season.story) && (
                        <p className="border-b border-white/5 px-4 py-3 text-[11px] leading-relaxed text-zinc-500">
                          {season.description || season.story}
                        </p>
                      )}

                      {episodes.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <p className="text-xs text-zinc-500">No episodes in this season yet.</p>
                          <button
                            type="button"
                            onClick={() => setEpisodeModal({ open: true, season, episode: null })}
                            className="btn-secondary btn-sm mt-3"
                          >
                            <Plus size={13} /> Add first episode
                          </button>
                        </div>
                      ) : (
                        <div>
                          {episodes.map((episode, index) => (
                            <div
                              key={episode.id}
                              className="flex flex-wrap items-center gap-3 border-b border-white/[0.05] px-4 py-2.5 last:border-0 sm:flex-nowrap"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-xs font-bold text-zinc-400">
                                {episode.episode_number}
                              </span>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-zinc-200">
                                  {episode.title || `Episode ${episode.episode_number}`}
                                </p>
                                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                                  <span>Episode {episode.episode_number}</span>
                                  {episode.duration && <span>· {episode.duration}</span>}
                                  {episode.quality && <span>· {episode.quality}</span>}
                                  <span
                                    className={cn(
                                      'inline-flex items-center gap-1',
                                      episode.episode_video ? 'text-emerald-400/80' : 'text-amber-400/80'
                                    )}
                                  >
                                    · {episode.episode_video ? 'Video attached' : 'No video'}
                                  </span>
                                </p>
                              </div>

                              <div className="ml-auto flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveEpisode(season, episode, 'up')}
                                  disabled={index === 0 || movingId === episode.id}
                                  className="btn-icon h-7 w-7 disabled:opacity-30"
                                  title="Move up"
                                  aria-label={`Move ${episode.title} up`}
                                >
                                  <ArrowUp size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveEpisode(season, episode, 'down')}
                                  disabled={index === episodes.length - 1 || movingId === episode.id}
                                  className="btn-icon h-7 w-7 disabled:opacity-30"
                                  title="Move down"
                                  aria-label={`Move ${episode.title} down`}
                                >
                                  <ArrowDown size={12} />
                                </button>
                                <Link
                                  to={episodePath(kind, content.slug, season.season_number, episode.episode_number)}
                                  target="_blank"
                                  className="btn-icon h-7 w-7"
                                  title="Preview episode"
                                  aria-label={`Preview ${episode.title}`}
                                >
                                  <ExternalLink size={12} />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => setEpisodeModal({ open: true, season, episode })}
                                  className="btn-icon h-7 w-7"
                                  title="Edit episode"
                                  aria-label={`Edit ${episode.title}`}
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteEpisode({ season, episode })}
                                  className="btn-icon h-7 w-7 hover:border-brand-500/50 hover:text-brand-300"
                                  title="Delete episode"
                                  aria-label={`Delete ${episode.title}`}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}

                          <div className="flex items-center justify-between px-4 py-3">
                            <p className="text-[10px] text-zinc-600">
                              Episode order is saved to SQLite. Use the arrows to reorder.
                            </p>
                            <button
                              type="button"
                              onClick={() => setEpisodeModal({ open: true, season, episode: null })}
                              className="btn-secondary btn-sm"
                            >
                              <Plus size={13} /> Add episode
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <p className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[11px] text-zinc-500">
        <ListVideo size={14} className="text-brand-400" />
        {meta.label} → Seasons → Episodes. Everything is stored in SQLite and linked by validated
        parent IDs.
      </p>

      <SeasonModal
        open={seasonModal.open}
        onClose={() => setSeasonModal({ open: false, season: null })}
        season={seasonModal.season}
        content={content}
        kind={kind}
        seasons={seasons}
        categories={categoriesState.data ?? []}
        genres={genresState.data ?? []}
        onSaved={() => {
          setSeasonModal({ open: false, season: null });
          detailState.refresh();
        }}
      />

      <EpisodeModal
        open={episodeModal.open}
        onClose={() => setEpisodeModal({ open: false, season: null, episode: null })}
        season={episodeModal.season}
        episode={episodeModal.episode}
        kind={kind}
        onSaved={() => {
          setEpisodeModal({ open: false, season: null, episode: null });
          detailState.refresh();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteSeason)}
        title="Delete season?"
        message={`“${deleteSeason?.title ?? ''}” and all ${deleteSeason?.episodes?.length ?? 0} of its episodes will be permanently deleted from SQLite.`}
        confirmLabel={working ? 'Deleting…' : 'Delete season'}
        loading={working}
        onCancel={() => setDeleteSeason(null)}
        onConfirm={confirmDeleteSeason}
      />

      <ConfirmDialog
        open={Boolean(deleteEpisode)}
        title="Delete episode?"
        message={`“${deleteEpisode?.episode.title ?? ''}” will be permanently deleted. Remaining episodes keep their numbers.`}
        confirmLabel={working ? 'Deleting…' : 'Delete episode'}
        loading={working}
        onCancel={() => setDeleteEpisode(null)}
        onConfirm={confirmDeleteEpisode}
      />
    </div>
  );
}

/* -------------------------------- Season modal -------------------------------- */

function SeasonModal({
  open,
  onClose,
  season,
  content,
  kind,
  seasons,
  categories,
  genres,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  season: Season | null;
  content: Content;
  kind: ContentKind;
  seasons: Season[];
  categories: Category[];
  genres: Genre[];
  onSaved: () => void;
}) {
  const section = sectionForKind(kind);
  const { notify } = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    season_number: '',
    poster: '',
    trailer: '',
    description: '',
    story: '',
    category_id: '',
    genres: [] as string[],
    language: '',
    country: '',
    year: '',
  });

  const nextNumber = useMemo(() => {
    const numbers = seasons.map((item) => item.season_number);
    return numbers.length ? Math.max(...numbers) + 1 : 1;
  }, [seasons]);

  useEffect(() => {
    if (!open) return;
    if (season) {
      setForm({
        title: season.title ?? '',
        season_number: String(season.season_number),
        poster: season.poster ?? '',
        trailer: season.trailer ?? '',
        description: season.description ?? '',
        story: season.story ?? '',
        category_id: season.category_id ? String(season.category_id) : '',
        genres: season.genres ?? [],
        language: season.language ?? '',
        country: season.country ?? '',
        year: season.year ? String(season.year) : '',
      });
    } else {
      setForm({
        title: `Season ${nextNumber}`,
        season_number: String(nextNumber),
        poster: '',
        trailer: '',
        description: '',
        story: '',
        category_id: content.category_id ? String(content.category_id) : '',
        genres: content.genres ?? [],
        language: content.language ?? '',
        country: content.country ?? '',
        year: content.year ? String(content.year) : '',
      });
    }
    setErrors({});
  }, [open, season, nextNumber, content]);

  const update = (key: keyof typeof form, value: string | string[]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    const number = Number(form.season_number);
    if (!Number.isInteger(number) || number <= 0) next.season_number = 'Enter a positive season number.';
    if (!form.title.trim()) next.title = 'Season title is required.';
    if (form.year && (Number(form.year) < 1888 || Number(form.year) > new Date().getFullYear() + 5)) {
      next.year = 'Enter a valid year.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload: SeasonPayload = {
      title: form.title.trim(),
      season_number: number,
      poster: form.poster.trim(),
      trailer: form.trailer.trim(),
      description: form.description.trim(),
      story: form.story.trim(),
      category_id: form.category_id ? Number(form.category_id) : null,
      genres: form.genres,
      language: form.language.trim(),
      country: form.country.trim(),
      year: form.year ? Number(form.year) : null,
    };

    setSaving(true);
    try {
      if (season) {
        await seasonService.update(section, content.id, season.id, payload);
        notify('Season updated', 'success');
      } else {
        await seasonService.create(section, content.id, payload);
        notify('Season created', 'success');
      }
      onSaved();
    } catch (error) {
      notify(apiErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={season ? `Edit ${season.title}` : 'Add season'}
      description={
        season
          ? 'Update this season. The parent title is already associated.'
          : `A new season will be linked to “${content.title}” automatically.`
      }
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <Button type="submit" form="season-form" loading={saving} icon={<Layers size={14} />}>
            {season ? 'Save season' : 'Create season'}
          </Button>
        </>
      }
    >
      <form id="season-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Field label="Season title" htmlFor="season-title" required error={errors.title}>
            <input
              id="season-title"
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              className="input"
              placeholder="Season 1"
            />
          </Field>
          <Field label="Season number" htmlFor="season-number" required error={errors.season_number}>
            <input
              id="season-number"
              type="number"
              min={1}
              value={form.season_number}
              onChange={(event) => update('season_number', event.target.value)}
              className="input"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Poster URL" htmlFor="season-poster" hint="Optional. Falls back to the title poster.">
            <input
              id="season-poster"
              value={form.poster}
              onChange={(event) => update('poster', event.target.value)}
              className="input"
              placeholder="https://…"
            />
          </Field>
          <Field label="Trailer URL" htmlFor="season-trailer" hint="Optional iframe trailer.">
            <input
              id="season-trailer"
              value={form.trailer}
              onChange={(event) => update('trailer', event.target.value)}
              className="input"
              placeholder="https://www.youtube.com/embed/…"
            />
          </Field>
        </div>

        <Field label="Description" htmlFor="season-description">
          <textarea
            id="season-description"
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            className="textarea min-h-[70px]"
            placeholder="Optional short description for this season."
          />
        </Field>

        <Field label="Story" htmlFor="season-story">
          <textarea
            id="season-story"
            value={form.story}
            onChange={(event) => update('story', event.target.value)}
            className="textarea min-h-[90px]"
            placeholder="Optional season synopsis."
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="season-category">
            <select
              id="season-category"
              value={form.category_id}
              onChange={(event) => update('category_id', event.target.value)}
              className="select"
            >
              <option value="">Inherit / none</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Release year" htmlFor="season-year" error={errors.year}>
            <input
              id="season-year"
              type="number"
              value={form.year}
              onChange={(event) => update('year', event.target.value)}
              className="input"
              placeholder={String(new Date().getFullYear())}
            />
          </Field>
          <Field label="Language" htmlFor="season-language">
            <input
              id="season-language"
              value={form.language}
              onChange={(event) => update('language', event.target.value)}
              className="input"
              placeholder="English"
            />
          </Field>
          <Field label="Country" htmlFor="season-country">
            <input
              id="season-country"
              value={form.country}
              onChange={(event) => update('country', event.target.value)}
              className="input"
              placeholder="United States"
            />
          </Field>
        </div>

        <Field label="Genres">
          <GenrePicker genres={genres} selected={form.genres} onChange={(value) => update('genres', value)} />
        </Field>

        <p className="rounded-lg bg-white/[0.03] px-3 py-2 text-[10px] text-zinc-500">
          Parent title “{content.title}” is associated automatically — no title fields are repeated.
        </p>
      </form>
    </Modal>
  );
}

/* -------------------------------- Episode modal -------------------------------- */

function EpisodeModal({
  open,
  onClose,
  season,
  episode,
  kind,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  season: Season | null;
  episode: Episode | null;
  kind: ContentKind;
  onSaved: () => void;
}) {
  const section = sectionForKind(kind);
  const { notify } = useToast();
  const [saving, setSaving] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    episode_number: '',
    quality: 'WEB-DL',
    duration: '',
    episode_url: '',
    episode_video: '',
  });

  const nextNumber = useMemo(() => {
    const numbers = (season?.episodes ?? []).map((item) => item.episode_number);
    return numbers.length ? Math.max(...numbers) + 1 : 1;
  }, [season]);

  useEffect(() => {
    if (!open) return;
    setShowVideo(false);
    setErrors({});
    if (episode) {
      setForm({
        title: episode.title ?? '',
        episode_number: String(episode.episode_number),
        quality: episode.quality ?? '',
        duration: episode.duration ?? '',
        episode_url: episode.episode_url ?? '',
        episode_video: episode.episode_video ?? '',
      });
    } else {
      setForm({
        title: `Episode ${nextNumber}`,
        episode_number: String(nextNumber),
        quality: 'WEB-DL',
        duration: '',
        episode_url: '',
        episode_video: '',
      });
    }
  }, [open, episode, nextNumber]);

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!season) return;

    const next: Record<string, string> = {};
    const number = Number(form.episode_number);
    if (!Number.isInteger(number) || number <= 0) next.episode_number = 'Enter a positive episode number.';
    if (!form.title.trim()) next.title = 'Episode title is required.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload: EpisodePayload = {
      title: form.title.trim(),
      episode_number: number,
      quality: form.quality.trim(),
      duration: form.duration.trim(),
      episode_url: form.episode_url.trim(),
      episode_video: form.episode_video.trim(),
    };

    setSaving(true);
    try {
      if (episode) {
        await episodeService.update(section, season.content_id, season.id, episode.id, payload);
        notify('Episode updated', 'success');
      } else {
        await episodeService.create(section, season.content_id, season.id, payload);
        notify('Episode created', 'success');
      }
      onSaved();
    } catch (error) {
      notify(apiErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={episode ? `Edit ${episode.title}` : 'Add episode'}
      description={
        season
          ? `Season ${season.season_number} · ${season.title}. The season is already associated.`
          : undefined
      }
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <Button type="submit" form="episode-form" loading={saving} icon={<Plus size={14} />}>
            {episode ? 'Save episode' : 'Create episode'}
          </Button>
        </>
      }
    >
      <form id="episode-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Field label="Episode title" htmlFor="episode-title" required error={errors.title}>
            <input
              id="episode-title"
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              className="input"
              placeholder="Episode 1"
            />
          </Field>
          <Field label="Episode number" htmlFor="episode-number" required error={errors.episode_number}>
            <input
              id="episode-number"
              type="number"
              min={1}
              value={form.episode_number}
              onChange={(event) => update('episode_number', event.target.value)}
              className="input"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Quality" htmlFor="episode-quality">
            <input
              id="episode-quality"
              value={form.quality}
              onChange={(event) => update('quality', event.target.value)}
              className="input"
              placeholder="WEB-DL"
            />
          </Field>
          <Field label="Duration" htmlFor="episode-duration">
            <input
              id="episode-duration"
              value={form.duration}
              onChange={(event) => update('duration', event.target.value)}
              className="input"
              placeholder="45 minutes"
            />
          </Field>
        </div>

        <Field label="Episode source URL" htmlFor="episode-url" hint="Optional reference page for this episode.">
          <input
            id="episode-url"
            value={form.episode_url}
            onChange={(event) => update('episode_url', event.target.value)}
            className="input"
            placeholder="https://example.com/episode-1"
          />
        </Field>

        <Field
          label="Episode video URL"
          htmlFor="episode-video"
          hint="Embeddable iframe URL. YouTube watch links are normalised by the server."
        >
          <div className="flex gap-2">
            <input
              id="episode-video"
              value={form.episode_video}
              onChange={(event) => update('episode_video', event.target.value)}
              className="input"
              placeholder="https://www.youtube.com/embed/…"
            />
            <button
              type="button"
              onClick={() => setShowVideo((value) => !value)}
              className={cn('btn-icon h-[42px] w-[42px] shrink-0', showVideo && 'border-brand-500/50 text-brand-300')}
              title="Test episode player"
              aria-label="Test episode player"
            >
              <Loader2 size={15} className={showVideo ? 'animate-spin' : ''} />
            </button>
          </div>
        </Field>

        {showVideo && (
          <div className="rounded-xl border border-white/10 bg-ink-900/40 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Player preview
            </p>
            <VideoEmbed src={form.episode_video} title="Episode preview" />
          </div>
        )}

        <p className="rounded-lg bg-white/[0.03] px-3 py-2 text-[10px] text-zinc-500">
          Season “{season?.title}” is associated automatically. Duplicate episode numbers inside a
          season are rejected by the database and API.
        </p>
      </form>
    </Modal>
  );
}

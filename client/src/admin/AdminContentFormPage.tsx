import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Layers,
  Loader2,
  Save,
  Sparkles,
  Tv,
  Upload,
  AlertTriangle,
  Youtube,
} from 'lucide-react';
import { api } from '../services/api';
import type { Category, Content, ContentKind, Genre } from '../types';
import { contentService, type ContentPayload } from '../services/content.service';
import { taxonomyService } from '../services/catalog.service';
import { apiErrorMessage } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import { useSeo } from '../hooks/useSeo';
import { useToast } from '../contexts/ToastContext';
import { PosterImage } from '../components/PosterImage';
import { VideoEmbed } from '../components/VideoEmbed';
import { GenrePicker } from '../components/GenrePicker';
import { Field, StatusBadge } from '../components/Field';
import { Button } from '../components/Button';
import { ErrorState } from '../components/EmptyState';
import { SECTIONS, sectionForKind } from '../utils/routes';
import { cn } from '../utils/format';

const CURRENT_YEAR = new Date().getFullYear();

interface FormState {
  title: string;
  poster: string;
  trailer: string;
  description: string;
  story: string;
  category_id: string;
  genres: string[];
  quality: string;
  language: string;
  country: string;
  year: string;
  duration: string;
  movie_video: string;
  series_url: string;
  status: 'published' | 'draft';
}

const EMPTY_FORM: FormState = {
  title: '',
  poster: '',
  trailer: '',
  description: '',
  story: '',
  category_id: '',
  genres: [],
  quality: '',
  language: '',
  country: '',
  year: '',
  duration: '',
  movie_video: '',
  series_url: '',
  status: 'draft',
};

function isWebUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/') || trimmed.startsWith('data:image/')) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isEmbedUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function AdminContentFormPage({ kind }: { kind: ContentKind }) {
  const section = sectionForKind(kind);
  const meta = SECTIONS[section];
  const isMovie = kind === 'movie';
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { notify } = useToast();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePosterFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('Please select an image file (JPEG, PNG, WEBP, AVIF, SVG)', 'error');
      return;
    }
    setUploadingPoster(true);
    setPosterFailed(false);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUri = reader.result as string;
      try {
        const { data } = await api.post('/uploads/poster', {
          image: dataUri,
          filename: file.name,
        });
        update('poster', data.url || dataUri);
        notify('Poster uploaded and saved', 'success');
      } catch {
        // Fall back to direct embedded data URI
        update('poster', dataUri);
        notify('Poster loaded from device', 'info');
      } finally {
        setUploadingPoster(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      notify('Failed to read image file', 'error');
      setUploadingPoster(false);
    };
    reader.readAsDataURL(file);
  };

  useSeo({
    title: editing ? `Edit ${meta.singular}` : `Add ${meta.singular}`,
    description: `Administrator form for ${meta.label.toLowerCase()} on FREE2WATCH.`,
  });

  const categoriesState = useApiData<Category[]>(() => taxonomyService.categories(kind), [kind]);
  const genresState = useApiData<Genre[]>(() => taxonomyService.genres(), []);
  const detailState = useApiData<{ content: Content }>(
    () => contentService.detail(section, id ?? ''),
    [section, id],
    { enabled: editing }
  );

  useEffect(() => {
    const content = detailState.data?.content;
    if (!content) return;
    setForm({
      title: content.title ?? '',
      poster: content.poster ?? '',
      trailer: content.trailer ?? '',
      description: content.description ?? '',
      story: content.story ?? '',
      category_id: content.category_id ? String(content.category_id) : '',
      genres: content.genres ?? [],
      quality: content.quality ?? '',
      language: content.language ?? '',
      country: content.country ?? '',
      year: content.year ? String(content.year) : '',
      duration: content.duration ?? '',
      movie_video: content.movie_video ?? '',
      series_url: content.series_url ?? '',
      status: content.status,
    });
  }, [detailState.data]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'A title is required.';
    if (form.title.trim().length > 200) next.title = 'Keep the title under 200 characters.';
    if (!isWebUrl(form.poster)) next.poster = 'Poster must be a valid http(s) URL or a /relative path.';
    if (!isEmbedUrl(form.trailer)) next.trailer = 'Trailer must be a valid http(s) URL.';
    if (!isEmbedUrl(form.movie_video)) next.movie_video = 'Video URL must be a valid http(s) URL.';
    if (!isEmbedUrl(form.series_url)) next.series_url = 'Series URL must be a valid http(s) URL.';
    if (form.year.trim()) {
      const year = Number(form.year);
      if (!Number.isInteger(year) || year < 1888 || year > CURRENT_YEAR + 5) {
        next.year = `Enter a year between 1888 and ${CURRENT_YEAR + 5}.`;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      notify('Please fix the highlighted fields before saving.', 'error');
      return;
    }

    const payload: ContentPayload = {
      title: form.title.trim(),
      poster: form.poster.trim(),
      trailer: form.trailer.trim(),
      description: form.description.trim(),
      story: form.story.trim(),
      category_id: form.category_id ? Number(form.category_id) : null,
      genres: form.genres,
      language: form.language.trim(),
      country: form.country.trim(),
      year: form.year.trim() ? Number(form.year) : null,
      status: form.status,
    };

    if (isMovie) {
      payload.quality = form.quality.trim();
      payload.duration = form.duration.trim();
      payload.movie_video = form.movie_video.trim();
    } else {
      payload.series_url = form.series_url.trim();
    }

    setSubmitting(true);
    try {
      if (editing && id) {
        const updated = await contentService.update(section, Number(id), payload);
        notify(`“${updated.title}” saved successfully`, 'success');
        navigate(meta.adminPath);
      } else {
        const created = await contentService.create(section, payload);
        notify(`“${created.title}” created`, 'success');
        if (isMovie) {
          navigate(meta.adminPath);
        } else {
          navigate(`${meta.adminPath}/${created.id}/manage`);
        }
      }
    } catch (error) {
      notify(apiErrorMessage(error), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const existing = detailState.data?.content;
  const categories = categoriesState.data ?? [];
  const hasGenres = (genresState.data ?? []).length > 0;

  const previewHref = existing ? `${meta.detailBase}/${existing.slug}` : null;

  const categoryHint = useMemo(() => {
    if (categoriesState.loading) return 'Loading categories…';
    if (categories.length === 0) return 'No categories for this content type yet.';
    return 'Categories are loaded from SQLite and can be managed in the dashboard.';
  }, [categoriesState.loading, categories.length]);

  if (editing && detailState.error && !detailState.data) {
    return <ErrorState message={detailState.error} onRetry={detailState.refresh} />;
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to={meta.adminPath}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 transition hover:text-white"
          >
            <ArrowLeft size={13} /> Back to {meta.label}
          </Link>
          <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-white">
            {editing ? `Edit ${meta.singular}` : `Add ${meta.singular}`}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {editing
              ? 'Update the title information and save your changes.'
              : `Create a new ${meta.singular.toLowerCase()}. Fields marked with * are required.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {editing && previewHref && (
            <Link to={previewHref} target="_blank" className="btn-secondary btn-sm">
              <ExternalLink size={14} /> Preview
            </Link>
          )}
          {editing && !isMovie && existing && (
            <Link to={`${meta.adminPath}/${existing.id}/manage`} className="btn-secondary btn-sm">
              <Layers size={14} /> Seasons &amp; episodes
            </Link>
          )}
          <Button type="submit" loading={submitting} icon={<Save size={15} />} size="sm">
            {editing ? 'Save changes' : `Create ${meta.singular}`}
          </Button>
        </div>
      </div>

      {editing && detailState.loading && !existing ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="h-64 skeleton rounded-2xl" />
            <div className="h-64 skeleton rounded-2xl" />
          </div>
          <div className="h-96 skeleton rounded-2xl" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-5">
            <Section title="Basic information" description="The title, short description and full story.">
              <Field label="Title" htmlFor="title" required error={errors.title}>
                <input
                  id="title"
                  value={form.title}
                  onChange={(event) => update('title', event.target.value)}
                  className="input"
                  placeholder={isMovie ? 'e.g. Words of War' : `e.g. ${meta.singular} title`}
                  maxLength={200}
                />
              </Field>

              <Field
                label="Short description"
                htmlFor="description"
                hint="Shown on cards, heroes and in search results."
              >
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(event) => update('description', event.target.value)}
                  className="textarea min-h-[90px]"
                  placeholder="A concise one or two sentence description."
                  maxLength={2000}
                />
              </Field>

              <Field label="Full story / synopsis" htmlFor="story" hint="Displayed on the details page.">
                <textarea
                  id="story"
                  value={form.story}
                  onChange={(event) => update('story', event.target.value)}
                  className="textarea min-h-[150px]"
                  placeholder="Describe the story, characters and setting."
                  maxLength={10000}
                />
              </Field>
            </Section>

            <Section
              title="Media"
              description="Posters are rendered as real images; trailers and videos are embedded as iframes."
            >
              <Field
                label="Poster Image"
                htmlFor="poster"
                error={errors.poster}
                hint="Enter an image URL or upload an image file from your device."
              >
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      id="poster"
                      value={form.poster}
                      onChange={(event) => {
                        update('poster', event.target.value);
                        setPosterFailed(false);
                      }}
                      className="input"
                      placeholder="https://example.com/poster.jpg or upload file →"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handlePosterFile(e.target.files?.[0])}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingPoster}
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary shrink-0 gap-1.5"
                      title="Upload an image file from your computer"
                    >
                      {uploadingPoster ? (
                        <Loader2 size={15} className="animate-spin text-brand-400" />
                      ) : (
                        <Upload size={15} />
                      )}
                      <span className="hidden sm:inline">Upload file</span>
                    </button>
                  </div>

                  {posterFailed && form.poster && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
                      <div>
                        <p className="font-semibold text-white">This image could not be loaded</p>
                        <p className="mt-0.5 text-amber-200/90 leading-relaxed">
                          The host website (such as streaming or Cloudflare-protected sites like egydead.live) blocks direct hotlinking.
                        </p>
                        <p className="mt-1 font-medium text-amber-100">
                          Solution: Right-click the image, choose <strong>Save image as</strong>, and click <strong>Upload file</strong> above!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Trailer URL"
                  htmlFor="trailer"
                  error={errors.trailer}
                  hint="YouTube watch links are converted to embed links automatically."
                >
                  <div className="flex gap-2">
                    <input
                      id="trailer"
                      value={form.trailer}
                      onChange={(event) => update('trailer', event.target.value)}
                      className="input"
                      placeholder="https://www.youtube.com/watch?v=…"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTrailer((value) => !value)}
                      className={cn('btn-icon h-[42px] w-[42px] shrink-0', showTrailer && 'border-brand-500/50 text-brand-300')}
                      title="Test trailer embed"
                      aria-label="Test trailer embed"
                    >
                      <Youtube size={17} />
                    </button>
                  </div>
                </Field>

                {isMovie ? (
                  <Field
                    label="Movie video URL"
                    htmlFor="movie_video"
                    error={errors.movie_video}
                    hint="Embeddable player URL (iframe)."
                  >
                    <div className="flex gap-2">
                      <input
                        id="movie_video"
                        value={form.movie_video}
                        onChange={(event) => update('movie_video', event.target.value)}
                        className="input"
                        placeholder="https://www.youtube.com/embed/…"
                      />
                      <button
                        type="button"
                        onClick={() => setShowVideo((value) => !value)}
                        className={cn('btn-icon h-[42px] w-[42px] shrink-0', showVideo && 'border-brand-500/50 text-brand-300')}
                        title="Test movie player"
                        aria-label="Test movie player"
                      >
                        <Film size={17} />
                      </button>
                    </div>
                  </Field>
                ) : (
                  <Field
                    label="Series URL"
                    htmlFor="series_url"
                    error={errors.series_url}
                    hint="Optional external reference or source page."
                  >
                    <input
                      id="series_url"
                      value={form.series_url}
                      onChange={(event) => update('series_url', event.target.value)}
                      className="input"
                      placeholder="https://example.com/series"
                    />
                  </Field>
                )}
              </div>

              {showTrailer && (
                <div className="rounded-xl border border-white/10 bg-ink-900/40 p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Trailer preview
                  </p>
                  <VideoEmbed src={form.trailer} title="Trailer preview" />
                </div>
              )}

              {showVideo && isMovie && (
                <div className="rounded-xl border border-white/10 bg-ink-900/40 p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Movie player preview
                  </p>
                  <VideoEmbed src={form.movie_video} title="Movie player preview" />
                </div>
              )}
            </Section>

            <Section title="Metadata" description="Categories and genres are loaded dynamically from SQLite.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category" htmlFor="category_id" hint={categoryHint}>
                  <select
                    id="category_id"
                    value={form.category_id}
                    onChange={(event) => update('category_id', event.target.value)}
                    className="select"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Release year" htmlFor="year" error={errors.year}>
                  <input
                    id="year"
                    type="number"
                    value={form.year}
                    onChange={(event) => update('year', event.target.value)}
                    className="input"
                    placeholder={String(CURRENT_YEAR)}
                    min={1888}
                    max={CURRENT_YEAR + 5}
                  />
                </Field>

                <Field label="Language" htmlFor="language">
                  <input
                    id="language"
                    value={form.language}
                    onChange={(event) => update('language', event.target.value)}
                    className="input"
                    placeholder="English, Arabic, Japanese…"
                  />
                </Field>

                <Field label="Country" htmlFor="country">
                  <input
                    id="country"
                    value={form.country}
                    onChange={(event) => update('country', event.target.value)}
                    className="input"
                    placeholder="United States, Korea…"
                  />
                </Field>

                {isMovie ? (
                  <>
                    <Field label="Quality" htmlFor="quality">
                      <input
                        id="quality"
                        value={form.quality}
                        onChange={(event) => update('quality', event.target.value)}
                        className="input"
                        placeholder="WEB-DL, BluRay, 4K…"
                      />
                    </Field>
                    <Field label="Duration" htmlFor="duration">
                      <input
                        id="duration"
                        value={form.duration}
                        onChange={(event) => update('duration', event.target.value)}
                        className="input"
                        placeholder="117 min"
                      />
                    </Field>
                  </>
                ) : (
                  <Field label="Content status" className="sm:col-span-2">
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900/60 px-3.5 py-2.5">
                      <span className="text-xs text-zinc-400">
                        Seasons and episodes are added after saving this title.
                      </span>
                      <Layers size={14} className="ml-auto text-brand-400" />
                    </div>
                  </Field>
                )}
              </div>

              <Field label="Genres">
                <GenrePicker
                  genres={genresState.data ?? []}
                  selected={form.genres}
                  onChange={(genres) => update('genres', genres)}
                  loading={genresState.loading}
                />
                {!hasGenres && !genresState.loading && (
                  <p className="mt-1.5 text-[11px] text-amber-300/80">
                    No genres exist yet. Create some on the Genres page to assign them here.
                  </p>
                )}
              </Field>
            </Section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-white/10 bg-ink-850/70 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-white">Poster preview</h3>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 transition flex items-center gap-1"
                >
                  <Upload size={12} /> Upload
                </button>
              </div>
              <div
                className="mt-3 group relative cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) handlePosterFile(e.dataTransfer.files[0]);
                }}
                title="Click or drop an image file here to set the poster"
              >
                <PosterImage
                  src={form.poster}
                  alt={form.title || 'Poster preview'}
                  onStatusChange={(failed) => setPosterFailed(failed)}
                  className="w-full rounded-xl ring-1 ring-white/10"
                />
                <div className="absolute inset-0 rounded-xl bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1.5 text-white backdrop-blur-[2px]">
                  <Upload size={22} className="text-brand-400" />
                  <span className="text-xs font-semibold">Upload new image</span>
                  <span className="text-[10px] text-zinc-400">or drop file here</span>
                </div>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-zinc-500">
                Direct image link or local image upload (JPEG, PNG, WEBP, AVIF).
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-ink-850/70 p-4">
              <h3 className="font-display text-sm font-bold text-white">Publication</h3>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                Drafts are only visible to the administrator.
              </p>
              <div className="mt-3 space-y-2">
                {(['published', 'draft'] as const).map((value) => (
                  <label
                    key={value}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition',
                      form.status === value
                        ? 'border-brand-500/50 bg-brand-500/[0.08]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="status"
                        value={value}
                        checked={form.status === value}
                        onChange={() => update('status', value)}
                        className="h-3.5 w-3.5 accent-brand-500"
                      />
                      <span>
                        <span className="block text-xs font-semibold text-white">
                          {value === 'published' ? 'Published' : 'Draft'}
                        </span>
                        <span className="block text-[10px] text-zinc-500">
                          {value === 'published'
                            ? 'Visible on the public website'
                            : 'Hidden from visitors'}
                        </span>
                      </span>
                    </span>
                    <StatusBadge status={value} />
                  </label>
                ))}
              </div>

              <Button
                type="submit"
                loading={submitting}
                icon={<Save size={15} />}
                className="mt-3 w-full"
              >
                {editing ? 'Save changes' : `Create ${meta.singular}`}
              </Button>
              <Link to={meta.adminPath} className="btn-ghost mt-1 w-full text-xs">
                Cancel
              </Link>
            </div>

            {!isMovie && (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-brand-500/10 to-transparent p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Sparkles size={14} className="text-brand-400" /> Hierarchical content
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-400">
                  After creating this {meta.singular.toLowerCase()}, you will add seasons and
                  episodes without re-entering the parent information.
                </p>
                {editing && existing && (
                  <Link
                    to={`${meta.adminPath}/${existing.id}/manage`}
                    className="btn-secondary btn-sm mt-3 w-full"
                  >
                    <Layers size={13} /> Manage seasons
                  </Link>
                )}
              </div>
            )}
          </aside>
        </div>
      )}

      {submitting && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-ink-900/95 px-4 py-2 text-xs text-zinc-300 shadow-panel backdrop-blur">
            <Loader2 size={13} className="animate-spin" /> Saving to SQLite…
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 text-[11px] text-zinc-600">
        <Tv size={13} /> {meta.label} · {isMovie ? 'flat content' : 'seasons and episodes'}
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-ink-850/70 p-4 sm:p-5">
      <div className="mb-4 border-b border-white/10 pb-3">
        <h3 className="font-display text-sm font-bold text-white">{title}</h3>
        {description && <p className="mt-0.5 text-[11px] text-zinc-500">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

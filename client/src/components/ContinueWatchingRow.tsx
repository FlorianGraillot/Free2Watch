import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Sparkles, X, History } from 'lucide-react';
import { userPreferences, type WatchProgressItem } from '../services/userPreferences';
import { PosterImage } from './PosterImage';
import { episodePath, contentPath } from '../utils/routes';

export function ContinueWatchingRow() {
  const [items, setItems] = useState<WatchProgressItem[]>([]);

  const loadProgress = () => {
    setItems(userPreferences.getContinueWatching());
  };

  useEffect(() => {
    loadProgress();
    const handleUpdate = () => loadProgress();
    window.addEventListener('f2w:progress-updated', handleUpdate);
    return () => window.removeEventListener('f2w:progress-updated', handleUpdate);
  }, []);

  const handleRemove = (e: React.MouseEvent, item: WatchProgressItem) => {
    e.preventDefault();
    e.stopPropagation();
    userPreferences.removeProgress(item.id, item.kind);
    setItems((prev) => prev.filter((i) => !(i.id === item.id && i.kind === item.kind)));
  };

  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/25">
            <History size={14} />
          </span>
          <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
            Continue Watching
          </h2>
        </div>
        <span className="text-[11px] font-medium text-zinc-500">
          Saved in your browser
        </span>
      </div>

      <div className="relative -mx-4 sm:mx-0">
        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:px-0">
          {items.map((item) => {
            const watchUrl =
              item.seasonNumber && item.episodeNumber
                ? episodePath(item.kind as any, item.slug, item.seasonNumber, item.episodeNumber)
                : contentPath({ content_type: item.kind, slug: item.slug });

            return (
              <div
                key={`cw-${item.kind}-${item.id}`}
                className="group relative w-[240px] sm:w-[280px] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition duration-300 hover:border-gold-500/40 hover:bg-gold-500/[0.04]"
              >
                <Link to={watchUrl} className="block">
                  <div className="relative aspect-video w-full overflow-hidden bg-ink-900">
                    <PosterImage
                      src={item.poster}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-75"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    {/* Play circle */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500/90 text-white shadow-glow transition group-hover:scale-110">
                        <Play size={16} fill="currentColor" className="ml-0.5" />
                      </span>
                    </div>

                    {/* Progress Bar at bottom of thumbnail */}
                    <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/60">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-amber-500"
                        style={{ width: `${Math.min(100, Math.max(10, item.progressPercent))}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="truncate font-display text-sm font-semibold text-white group-hover:text-gold-300">
                      {item.title}
                    </h3>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-400">
                      <span>
                        {item.seasonNumber
                          ? `S${item.seasonNumber} · E${item.episodeNumber}`
                          : 'Feature Film'}
                      </span>
                      <span className="text-zinc-500 font-mono">
                        {Math.round(item.progressPercent)}% left
                      </span>
                    </div>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={(e) => handleRemove(e, item)}
                  className="absolute right-2 top-2 z-10 rounded-lg bg-black/60 p-1.5 text-zinc-400 backdrop-blur opacity-0 transition group-hover:opacity-100 hover:bg-black hover:text-white"
                  title="Remove from history"
                  aria-label="Remove from continue watching"
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

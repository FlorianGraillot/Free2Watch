import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Bookmark, Play, Trash2, X, Clapperboard, Sparkles } from 'lucide-react';
import { userPreferences, type WatchlistItem } from '../services/userPreferences';
import { PosterImage } from './PosterImage';
import { contentPath, kindLabel } from '../utils/routes';

interface WatchlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WatchlistDrawer({ isOpen, onClose }: WatchlistDrawerProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadItems = () => {
    setItems(userPreferences.getWatchlist());
  };

  useEffect(() => {
    loadItems();
    const handleUpdate = () => loadItems();
    window.addEventListener('f2w:watchlist-updated', handleUpdate);
    return () => window.removeEventListener('f2w:watchlist-updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadItems();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const removeItem = (e: React.MouseEvent, item: WatchlistItem) => {
    e.preventDefault();
    e.stopPropagation();
    userPreferences.removeFromWatchlist(item.id, item.kind);
    setItems((prev) => prev.filter((i) => !(i.id === item.id && i.kind === item.kind)));
  };

  const clearAll = () => {
    items.forEach((item) => userPreferences.removeFromWatchlist(item.id, item.kind));
    setItems([]);
  };

  const drawerContent = (
    <div className="fixed inset-0 z-[1000] overflow-hidden" role="dialog" aria-modal="true">
      {/* Full Screen Dim Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Right-aligned Full Height Drawer Panel */}
      <div className="fixed inset-y-0 right-0 z-[1001] flex h-full w-full max-w-[390px] flex-col border-l border-white/10 bg-[#0B0B0F] shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/30">
              <Bookmark size={16} className="fill-current text-gold-400" />
            </span>
            <div>
              <h2 className="font-display text-sm sm:text-base font-bold text-white tracking-tight">
                My VIP Watchlist
              </h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                {items.length} {items.length === 1 ? 'TITLE SAVED' : 'TITLES SAVED'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close watchlist"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-zinc-600 mb-3 ring-1 ring-white/10">
                <Clapperboard size={24} />
              </span>
              <h3 className="font-display text-sm font-bold text-white">Your Watchlist is empty</h3>
              <p className="mt-1 text-xs text-zinc-500 max-w-xs leading-relaxed">
                Click "+ Add to Watchlist" on any movie, TV series, or anime to curate your personal cinema queue.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="group relative flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#121218] p-2.5 transition hover:border-gold-500/30 hover:bg-[#161622]"
              >
                {/* Clickable link to watch */}
                <Link
                  to={contentPath(item as any, item.kind)}
                  onClick={onClose}
                  className="flex items-center gap-3 min-w-0 flex-1 select-none"
                >
                  {/* Fixed Compact Poster Thumbnail */}
                  <div className="relative h-[62px] w-[46px] shrink-0 overflow-hidden rounded-xl bg-ink-900 ring-1 ring-white/15">
                    <PosterImage
                      src={item.poster}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                      <Play size={13} fill="currentColor" className="text-white ml-0.5" />
                    </div>
                  </div>

                  {/* Title and Metadata */}
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-display text-sm font-semibold text-white group-hover:text-gold-300 transition">
                      {item.title}
                    </h4>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
                      {item.year && <span>{item.year}</span>}
                      {item.year && <span>·</span>}
                      <span className="capitalize">{kindLabel(item.kind)}</span>
                      {item.quality && (
                        <>
                          <span>·</span>
                          <span className="text-zinc-400 font-mono text-[11px]">{item.quality}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => removeItem(e, item)}
                  className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/10 hover:text-rose-400 shrink-0"
                  aria-label={`Remove ${item.title} from watchlist`}
                  title="Remove from watchlist"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        {items.length > 0 && (
          <div className="border-t border-white/10 px-5 py-3.5 flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-gold-400" />
              Saved in browser
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="text-zinc-500 hover:text-rose-400 transition text-[11px]"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}

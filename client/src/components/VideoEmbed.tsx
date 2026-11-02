import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2, Moon, PlayCircle, ShieldAlert, Sun, RefreshCw } from 'lucide-react';
import { userPreferences } from '../services/userPreferences';
import { cn } from '../utils/format';

interface VideoEmbedProps {
  src?: string | null;
  title: string;
  className?: string;
  /** Shows a compact placeholder instead of a player. */
  emptyLabel?: string;
  allow?: string;
  autoLoad?: boolean;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Responsive 16:9 iframe player with 5-Star Cinema Theater Mode (Dim Lights).
 */
export function VideoEmbed({
  src,
  title,
  className,
  emptyLabel = 'Video not available yet',
  allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen',
  autoLoad = true,
}: VideoEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [theaterMode, setTheaterMode] = useState(() => userPreferences.getTheaterMode());
  const timerRef = useRef<number | null>(null);
  const url = (src ?? '').trim();
  const valid = url !== '' && isValidHttpUrl(url);

  useEffect(() => {
    setLoaded(false);
    setSlow(false);
    if (!valid || !autoLoad) return;

    timerRef.current = window.setTimeout(() => setSlow(true), 9000);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [url, valid, autoLoad, reloadKey]);

  const toggleTheater = () => {
    const next = !theaterMode;
    setTheaterMode(next);
    userPreferences.setTheaterMode(next);
  };

  if (!valid) {
    return (
      <div
        className={cn(
          'flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gold-500/25 bg-ink-900/80 px-6 text-center shadow-panel backdrop-blur',
          className
        )}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-zinc-600 ring-1 ring-white/10">
          <PlayCircle size={32} />
        </span>
        <p className="text-sm font-semibold text-zinc-300">{emptyLabel}</p>
        <p className="max-w-sm text-xs text-zinc-500">
          Please attach a video stream URL in the administrator dashboard to stream this title.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2.5', theaterMode && 'relative z-40', className)}>
      {/* Theater Dim Scrim */}
      {theaterMode && (
        <div
          className="fixed inset-0 z-30 bg-black/92 backdrop-blur-sm transition-opacity duration-500"
          onClick={toggleTheater}
          aria-label="Exit theater mode"
        />
      )}

      {/* Main Video Frame */}
      <div
        className={cn(
          'relative aspect-video w-full overflow-hidden rounded-2xl border bg-black transition-all duration-500',
          theaterMode
            ? 'border-gold-500/60 shadow-[0_0_90px_rgba(0,0,0,1)] ring-2 ring-gold-500/25 z-40'
            : 'border-white/10 shadow-cinema'
        )}
      >
        {!loaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-ink-950">
            <Loader2 className="animate-spin text-brand-500" size={28} />
            <p className="text-xs font-semibold text-zinc-400">Initializing Cinema Stream…</p>
          </div>
        )}
        {autoLoad && (
          <iframe
            key={reloadKey}
            src={url}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow={allow}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setLoaded(true)}
          />
        )}
      </div>

      {/* Cinema Player Controls Bar */}
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400 transition',
          theaterMode && 'relative z-40 bg-ink-950/90 p-2 rounded-xl border border-white/10'
        )}
      >
        <div className="flex items-center gap-2">
          {slow ? (
            <span className="inline-flex items-center gap-1.5 text-amber-300">
              <ShieldAlert size={13} />
              Slow connection. You can switch servers or open directly.
            </span>
          ) : (
            <span className="text-zinc-500">
              {theaterMode ? 'Theater Mode Active · Click outside or press toggle to restore' : '5-Star Cinema Player'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Dim Lights / Theater Mode Button */}
          <button
            type="button"
            onClick={toggleTheater}
            className={cn(
              'inline-flex items-center gap-1.5 font-semibold transition rounded-lg px-2 py-1',
              theaterMode
                ? 'bg-gold-500/20 text-gold-300 ring-1 ring-gold-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
            title={theaterMode ? 'Exit Theater Mode' : 'Dim Lights (Cinema Mode)'}
          >
            {theaterMode ? <Sun size={13} /> : <Moon size={13} />}
            <span>{theaterMode ? 'Lights On' : 'Dim Lights'}</span>
          </button>

          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="inline-flex items-center gap-1 font-medium text-zinc-400 transition hover:text-white"
          >
            <RefreshCw size={11} /> Reload
          </button>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-zinc-400 transition hover:text-white"
          >
            Open Source <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  );
}

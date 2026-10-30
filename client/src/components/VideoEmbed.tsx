import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2, PlayCircle, ShieldAlert } from 'lucide-react';
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
 * Responsive 16:9 iframe player. Media is embedded only from http(s) sources;
 * the UI clearly explains when a third-party page blocks embedding.
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

  if (!valid) {
    return (
      <div
        className={cn(
          'flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-ink-900/70 px-6 text-center',
          className
        )}
      >
        <PlayCircle size={34} className="text-zinc-600" />
        <p className="text-sm font-medium text-zinc-400">{emptyLabel}</p>
        <p className="max-w-sm text-xs text-zinc-600">
          An administrator can attach an embeddable video URL from the dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black shadow-card">
        {!loaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-ink-900">
            <Loader2 className="animate-spin text-brand-500" size={26} />
            <p className="text-xs text-zinc-500">Loading player…</p>
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

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
        {slow ? (
          <span className="inline-flex items-center gap-1.5 text-amber-300/90">
            <ShieldAlert size={13} />
            The source may block embedding. You can open it in a new tab.
          </span>
        ) : (
          <span>If playback does not start, the source may not allow embedding.</span>
        )}

        <span className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="font-medium text-zinc-400 transition hover:text-white"
          >
            Reload player
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-zinc-400 transition hover:text-white"
          >
            Open source <ExternalLink size={11} />
          </a>
        </span>
      </div>
    </div>
  );
}

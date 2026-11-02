import { useEffect, useRef, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '../utils/format';

interface PosterImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
  rounded?: boolean;
  onStatusChange?: (failed: boolean) => void;
}

const FALLBACK = '/assets/poster-fallback.svg';

function resolvePosterUrl(url?: string | null): string {
  if (!url) return FALLBACK;
  const trimmed = url.trim();
  if (!trimmed) return FALLBACK;
  // Upgrade insecure http image links to https to avoid mixed-content blocking
  if (trimmed.startsWith('http://')) {
    return 'https://' + trimmed.slice(7);
  }
  return trimmed;
}

/**
 * Real HTML <img> poster with lazy loading, aspect ratio, placeholder shimmer
 * and graceful broken-image handling.
 * Includes referrerPolicy="no-referrer" to prevent 403 Forbidden blocks from
 * CDNs that restrict hotlinking (e.g. IMDb, TMDb, Wikipedia, MyAnimeList).
 */
export function PosterImage({
  src,
  alt,
  className,
  imgClassName,
  eager = false,
  rounded = true,
  onStatusChange,
}: PosterImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const resolved = resolvePosterUrl(src);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    onStatusChange?.(false);

    // If image is already cached by the browser, mark it as loaded immediately
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [resolved, onStatusChange]);

  const activeSrc = failed ? FALLBACK : resolved;
  const isCustomUrl = Boolean(src && src.trim() && src.trim() !== FALLBACK);

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-ink-800',
        rounded && 'rounded-xl',
        'aspect-[2/3]',
        className
      )}
    >
      {!loaded && <div className="absolute inset-0 skeleton rounded-none" aria-hidden="true" />}
      <img
        ref={imgRef}
        key={activeSrc}
        src={activeSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => {
          setLoaded(true);
          onStatusChange?.(false);
        }}
        onError={() => {
          if (!failed && resolved !== FALLBACK) {
            setFailed(true);
            onStatusChange?.(true);
          }
          setLoaded(true);
        }}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          imgClassName
        )}
      />
      {failed && isCustomUrl && (
        <span className="absolute bottom-2 left-2 right-2 inline-flex items-center gap-1.5 rounded-md bg-black/85 px-2 py-1 text-[10px] font-medium text-amber-300 backdrop-blur">
          <ImageOff size={11} className="shrink-0" /> Host blocked image
        </span>
      )}
    </div>
  );
}

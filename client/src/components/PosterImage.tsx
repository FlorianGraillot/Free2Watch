import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '../utils/format';

interface PosterImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
  rounded?: boolean;
}

const FALLBACK = '/assets/poster-fallback.svg';

/**
 * Real HTML <img> poster with lazy loading, aspect ratio, placeholder shimmer
 * and graceful broken-image handling. Never a CSS background replacement.
 */
export function PosterImage({
  src,
  alt,
  className,
  imgClassName,
  eager = false,
  rounded = true,
}: PosterImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const resolved = !src || !src.trim() ? FALLBACK : src;

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
        src={failed ? FALLBACK : resolved}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!failed) setFailed(true);
          setLoaded(true);
        }}
        className={cn(
          'h-full w-full object-cover transition-all duration-500',
          loaded ? 'opacity-100' : 'opacity-0',
          imgClassName
        )}
      />
      {failed && (
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-1 text-[10px] font-medium text-zinc-300 backdrop-blur">
          <ImageOff size={11} /> No poster
        </span>
      )}
    </div>
  );
}

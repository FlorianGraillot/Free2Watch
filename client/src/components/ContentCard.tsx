import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Play, Star } from 'lucide-react';
import type { Content, ContentKind } from '../types';
import { PosterImage } from './PosterImage';
import { userPreferences } from '../services/userPreferences';
import { cn } from '../utils/format';
import { contentPath, kindLabel, sectionForKind } from '../utils/routes';

interface ContentCardProps {
  content: Content;
  eager?: boolean;
  className?: string;
  showType?: boolean;
  defaultKind?: ContentKind;
  rank?: number;
}

export function ContentCard({
  content,
  eager = false,
  className,
  showType = true,
  defaultKind,
  rank,
}: ContentCardProps) {
  const kind = content.content_type ?? defaultKind ?? 'movie';
  const quality = content.quality || (kind !== 'movie' ? 'HD' : '4K');
  const [inWatchlist, setInWatchlist] = useState(() => userPreferences.isInWatchlist(content.id, kind));

  const toggleList = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nowIn = userPreferences.toggleWatchlist(content, defaultKind);
    setInWatchlist(nowIn);
  };

  const meta = [content.year, showType ? kindLabel(kind) : content.category_name || content.language]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      to={contentPath(content, defaultKind)}
      className={cn('group block min-w-0 select-none', className)}
      aria-label={`${content.title} — ${kindLabel(kind)}`}
    >
      <div className="relative overflow-hidden rounded-xl ring-1 ring-white/10 transition-all duration-300 group-hover:ring-gold-500/50 group-hover:shadow-[0_20px_45px_-15px_rgba(229,169,60,0.35)]">
        <PosterImage
          src={content.poster}
          alt={content.title}
          eager={eager}
          imgClassName="group-hover:scale-[1.07] group-hover:brightness-[0.70] transition-all duration-500"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-80" />

        {/* Quality Badge */}
        {quality && (
          <span className="absolute left-2 top-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold-300 ring-1 ring-gold-500/30 backdrop-blur">
            {quality}
          </span>
        )}

        {/* 1-Click Watchlist Quick Save Button */}
        <button
          type="button"
          onClick={toggleList}
          className={cn(
            'absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-lg backdrop-blur transition-all duration-200',
            inWatchlist
              ? 'bg-gold-500 text-black shadow-gold'
              : 'bg-black/60 text-zinc-300 opacity-0 group-hover:opacity-100 hover:bg-black/90 hover:text-white'
          )}
          aria-label={inWatchlist ? 'Remove from My List' : 'Add to My List'}
          title={inWatchlist ? 'In My List' : 'Add to My List'}
        >
          <Bookmark size={13} className={inWatchlist ? 'fill-current' : ''} />
        </button>

        {/* Cinema Play Disc */}
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="flex h-12 w-12 translate-y-3 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-rose-500 text-white opacity-0 shadow-cinema transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <Play size={18} fill="currentColor" className="ml-0.5" />
          </span>
        </span>

        {/* Bottom hover bar */}
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-2.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-gold-300 ring-1 ring-gold-500/20 backdrop-blur">
            {kindLabel(kind)}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
            <Star size={10} fill="currentColor" /> 5.0
          </span>
        </span>
      </div>

      <div className="mt-2.5 space-y-1">
        <h3 className="line-clamp-2 font-display text-[13px] font-semibold leading-snug text-zinc-100 transition group-hover:text-gold-300 sm:text-sm">
          {content.title}
        </h3>
        <p className="truncate text-[11px] text-zinc-500">{meta || 'Uncategorized'}</p>
      </div>
    </Link>
  );
}

export function contentSectionLabel(content: Content): string {
  return `/admin/${sectionForKind(content.content_type ?? 'movie')}`;
}

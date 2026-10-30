import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import type { Content } from '../types';
import { PosterImage } from './PosterImage';
import { cn } from '../utils/format';
import { contentPath, kindLabel, sectionForKind } from '../utils/routes';

interface ContentCardProps {
  content: Content;
  eager?: boolean;
  className?: string;
  showType?: boolean;
}

export function ContentCard({ content, eager = false, className, showType = true }: ContentCardProps) {
  const kind = content.content_type ?? 'movie';
  const quality = content.quality || (content.content_type && content.content_type !== 'movie' ? 'HD' : '');
  const meta = [content.year, showType ? kindLabel(kind) : content.category_name || content.language]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      to={contentPath(content)}
      className={cn('group block min-w-0', className)}
      aria-label={`${content.title} — ${kindLabel(kind)}`}
    >
      <div className="relative overflow-hidden rounded-xl ring-1 ring-white/10 transition duration-300 group-hover:ring-white/30 group-hover:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.95)]">
        <PosterImage
          src={content.poster}
          alt={content.title}
          eager={eager}
          imgClassName="group-hover:scale-[1.06] group-hover:brightness-[0.72]"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent opacity-80" />

        {quality && (
          <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-100 ring-1 ring-white/15 backdrop-blur">
            {quality}
          </span>
        )}

        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-brand-500/95 text-white opacity-0 shadow-glow transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <Play size={18} fill="currentColor" className="ml-0.5" />
          </span>
        </span>

        <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-2.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            {kindLabel(kind)}
          </span>
          <span className="text-[10px] font-medium text-zinc-300">{content.category_name ?? ''}</span>
        </span>
      </div>

      <div className="mt-2.5 space-y-1">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-zinc-100 transition group-hover:text-brand-300 sm:text-sm">
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

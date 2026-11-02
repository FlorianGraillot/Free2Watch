import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Content, ContentKind } from '../types';
import { ContentCard } from './ContentCard';
import { cn } from '../utils/format';

interface ContentRowProps {
  title: string;
  subtitle?: string;
  items: Content[];
  viewAllHref?: string;
  loading?: boolean;
  className?: string;
  accent?: boolean;
  defaultKind?: ContentKind;
}

export function ContentRow({
  title,
  subtitle,
  items,
  viewAllHref,
  loading = false,
  className,
  accent,
  defaultKind,
}: ContentRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: direction === 'left' ? -node.clientWidth * 0.8 : node.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            {accent && <span className="h-5 w-1 rounded-full bg-brand-500" />}
            <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h2>
          </div>
          {subtitle && <p className="mt-1 text-xs text-zinc-500 sm:text-sm">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link
              to={viewAllHref}
              className="hidden text-xs font-semibold text-zinc-400 transition hover:text-brand-300 sm:inline-flex"
            >
              View all
            </Link>
          )}
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label={`Scroll ${title} left`}
            className="btn-icon hidden h-8 w-8 sm:inline-flex"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label={`Scroll ${title} right`}
            className="btn-icon hidden h-8 w-8 sm:inline-flex"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="relative -mx-4 sm:mx-0">
        <div
          ref={scrollerRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:gap-4 sm:px-0"
        >
          {loading && items.length === 0
            ? Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="w-[142px] shrink-0 sm:w-[164px] lg:w-[180px]">
                  <div className="aspect-[2/3] skeleton rounded-xl" />
                  <div className="mt-3 h-3 w-4/5 skeleton" />
                  <div className="mt-2 h-2.5 w-2/5 skeleton" />
                </div>
              ))
            : items.map((item, index) => (
                <div
                  key={`${item.content_type ?? defaultKind ?? 'movie'}-${item.id}-${index}`}
                  className="w-[142px] shrink-0 snap-start sm:w-[164px] lg:w-[180px]"
                >
                  <ContentCard content={item} defaultKind={defaultKind} />
                </div>
              ))}
        </div>
      </div>

      {!loading && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-center text-sm text-zinc-500">
          Nothing published here yet. Content will appear after an administrator publishes it.
        </div>
      )}
    </section>
  );
}

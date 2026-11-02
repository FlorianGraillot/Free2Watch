import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Crown, Flame } from 'lucide-react';
import type { Content } from '../types';
import { ContentCard } from './ContentCard';
import { cn } from '../utils/format';

interface TopTenRowProps {
  items: Content[];
  loading?: boolean;
}

export function TopTenRow({ items, loading }: TopTenRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({
      left: direction === 'left' ? -node.clientWidth * 0.75 : node.clientWidth * 0.75,
      behavior: 'smooth',
    });
  };

  const topTen = items.slice(0, 10);
  if (!loading && topTen.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold-400">
            <Crown size={16} className="fill-current text-gold-400" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] font-mono text-gold-400">
              Box Office Premiere
            </span>
          </div>
          <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-white sm:text-3xl flex items-center gap-2">
            Top 10 Cinema Masterpieces
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-rose-400 font-sans">
              <Flame size={14} className="fill-current" /> Hot This Week
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Scroll Top 10 left"
            className="btn-icon hidden h-8 w-8 sm:inline-flex"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Scroll Top 10 right"
            className="btn-icon hidden h-8 w-8 sm:inline-flex"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="relative -mx-4 sm:mx-0">
        <div
          ref={scrollerRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:gap-6 sm:px-0"
        >
          {loading && topTen.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-end shrink-0 w-[220px] sm:w-[260px]">
                  <div className="w-16 h-32 skeleton rounded-lg mr-2" />
                  <div className="w-40 aspect-[2/3] skeleton rounded-xl" />
                </div>
              ))
            : topTen.map((item, index) => {
                const rank = index + 1;
                return (
                  <div
                    key={`top10-${item.content_type || 'content'}-${item.id}-${index}`}
                    className="group relative flex items-end shrink-0 snap-start w-[210px] sm:w-[250px] transition-transform duration-300 hover:scale-[1.02]"
                  >
                    {/* Grand Metallic Cinema Rank Number */}
                    <div className="relative -mr-5 sm:-mr-8 z-0 select-none pointer-events-none">
                      <span
                        className={cn(
                          'font-display font-black leading-none tracking-tighter text-[90px] sm:text-[130px]',
                          rank === 1
                            ? 'text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-gold-400 to-amber-700 drop-shadow-[0_8px_20px_rgba(229,169,60,0.4)]'
                            : rank === 2
                            ? 'text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-600 drop-shadow-[0_8px_20px_rgba(255,255,255,0.2)]'
                            : rank === 3
                            ? 'text-transparent bg-clip-text bg-gradient-to-b from-amber-600 via-amber-700 to-amber-950'
                            : 'text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-white/5'
                        )}
                        style={{
                          WebkitTextStroke: '1px rgba(255,255,255,0.15)',
                        }}
                      >
                        {rank}
                      </span>
                    </div>

                    {/* Poster Card */}
                    <div className="relative z-10 flex-1">
                      <ContentCard content={item} rank={rank} />
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </section>
  );
}

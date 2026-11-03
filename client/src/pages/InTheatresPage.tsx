import { useMemo, useState } from 'react';
import {
  Clapperboard,
  Crown,
  ExternalLink,
  Film,
  Filter,
  Flame,
  Info,
  Play,
  Search,
  Sparkles,
  Star,
  Ticket,
} from 'lucide-react';
import { useApiData } from '../hooks/useApiData';
import { useSeo } from '../hooks/useSeo';
import { cinemaService, type TheatricalMovie, type InTheatresResponse } from '../services/cinema.service';
import { TheatricalModal } from '../components/TheatricalModal';
import { AdSenseBanner } from '../components/common/AdSenseBanner';
import { EmptyState } from '../components/EmptyState';
import { cn } from '../utils/format';

export function InTheatresPage() {
  const [selectedMovie, setSelectedMovie] = useState<TheatricalMovie | null>(null);
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rating' | 'release' | 'title'>('rating');

  useSeo({
    title: 'Now Showing in Theatres — FREE2WATCH 5-Star Cinema',
    description:
      'Explore movies currently playing in cinemas worldwide. Browse high-resolution theatrical posters, full story synopsis, official trailers, box office data and cast info.',
    canonicalPath: '/in-theatres',
  });

  const { data, loading, error, refresh } = useApiData<InTheatresResponse>(
    () => cinemaService.getInTheatres(),
    []
  );

  const allMovies = data?.items ?? [];

  // Extract unique genres
  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const movie of allMovies) {
      for (const g of movie.genres || []) {
        set.add(g);
      }
    }
    return Array.from(set).sort();
  }, [allMovies]);

  // Filter & sort
  const filteredMovies = useMemo(() => {
    let result = [...allMovies];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.overview.toLowerCase().includes(q) ||
          m.genres.some((g) => g.toLowerCase().includes(q)) ||
          (m.director && m.director.toLowerCase().includes(q))
      );
    }

    if (genreFilter !== 'all') {
      result = result.filter((m) => m.genres.includes(genreFilter));
    }

    result.sort((a, b) => {
      if (sortBy === 'rating') return b.vote_average - a.vote_average;
      if (sortBy === 'release') return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
      return a.title.localeCompare(b.title);
    });

    return result;
  }, [allMovies, searchQuery, genreFilter, sortBy]);

  return (
    <div className="pb-20">
      {/* 5-STAR CINEMA MARQUEE HERO */}
      <section className="relative overflow-hidden border-b border-gold-500/20 bg-ink-950 pt-10 pb-12 sm:pt-14 sm:pb-16">
        {/* Ambient Cinema Lighting */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[700px] rounded-full bg-gold-500/10 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(217,163,60,0.08),transparent_70%)]" />
          <div className="grain absolute inset-0 opacity-40" />
        </div>

        <div className="container-page relative z-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-bold text-gold-400 font-mono tracking-wider shadow-gold">
            <Ticket size={13} className="fill-current text-gold-400" />
            WORLDWIDE THEATRICAL RELEASES
          </div>

          <h1 className="mt-4 font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
            Now Showing in <span className="text-gradient-gold">Cinemas</span>
          </h1>

          <p className="mt-3 mx-auto max-w-2xl text-sm sm:text-base text-zinc-300 leading-relaxed font-sans">
            Fresh from the silver screen. Click any theatrical poster to open its complete premier dossier, official trailers, box office numbers, and cast details.
          </p>

          {/* Quick Stats Pill */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Film size={13} className="text-gold-400" /> {allMovies.length} Feature Films
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Flame size={13} className="text-amber-400" /> Box Office Charts
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-brand-400" /> 4K Official Trailers
            </span>
          </div>
        </div>
      </section>

      {/* FILTER & SEARCH BAR */}
      <div className="container-page mt-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cinema movie, director, actor..."
              className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-gold-500/60 focus:outline-none focus:ring-1 focus:ring-gold-500/60"
            />
          </div>

          {/* Sort selector */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-zinc-500 font-medium">Sort by:</span>
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
              <button
                type="button"
                onClick={() => setSortBy('rating')}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  sortBy === 'rating' ? 'bg-gold-500 text-black shadow-gold font-bold' : 'text-zinc-400 hover:text-white'
                )}
              >
                Top Rated
              </button>
              <button
                type="button"
                onClick={() => setSortBy('release')}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  sortBy === 'release' ? 'bg-gold-500 text-black shadow-gold font-bold' : 'text-zinc-400 hover:text-white'
                )}
              >
                Release Date
              </button>
              <button
                type="button"
                onClick={() => setSortBy('title')}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  sortBy === 'title' ? 'bg-gold-500 text-black shadow-gold font-bold' : 'text-zinc-400 hover:text-white'
                )}
              >
                Alphabetical
              </button>
            </div>
          </div>
        </div>

        {/* Genre Pill Filter Bar */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            type="button"
            onClick={() => setGenreFilter('all')}
            className={cn(
              'shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition',
              genreFilter === 'all'
                ? 'border border-gold-500/50 bg-gold-500/20 text-gold-300 font-bold'
                : 'border border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white'
            )}
          >
            All Genres
          </button>
          {genres.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => setGenreFilter(genre)}
              className={cn(
                'shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition',
                genreFilter === genre
                  ? 'border border-gold-500/50 bg-gold-500/20 text-gold-300 font-bold'
                  : 'border border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white'
              )}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* SPONSORED BANNER */}
      <div className="container-page mt-6">
        <AdSenseBanner slotType="header" />
      </div>

      {/* POSTER GALLERY GRID */}
      <div className="container-page mt-8">
        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-2xl skeleton" />
            ))}
          </div>
        )}

        {!loading && filteredMovies.length === 0 && (
          <div className="py-12">
            <EmptyState
              icon={Clapperboard}
              title="No cinema releases match your filter"
              description="Try adjusting your genre or search keywords to view theatrical releases."
              action={{ label: 'Reset filters', to: '/in-theatres' }}
            />
          </div>
        )}

        {!loading && filteredMovies.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-6">
            {filteredMovies.map((movie) => (
              <div
                key={movie.id}
                onClick={() => setSelectedMovie(movie)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#0e0d14] shadow-cinema transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-500/60 hover:shadow-[0_20px_45px_rgba(217,163,60,0.25)]"
              >
                {/* Poster Image Container */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-ink-950">
                  <img
                    src={movie.poster_path}
                    alt={movie.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <span className="flex items-center gap-1 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-bold text-gold-300 ring-1 ring-gold-500/30 backdrop-blur">
                      <Star size={10} className="fill-current text-gold-400" />
                      {movie.vote_average.toFixed(1)}
                    </span>

                    {movie.is_on_free2watch && (
                      <span className="flex items-center gap-1 rounded-md bg-emerald-500/90 px-2 py-0.5 text-[9px] font-bold text-white shadow-glow">
                        Streamable
                      </span>
                    )}
                  </div>

                  {/* Cinema Spotlight Hover Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 backdrop-blur-[2px]">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-500 text-black shadow-cinema transition-transform group-hover:scale-110">
                      <Info size={20} />
                    </span>
                    <span className="mt-3 text-xs font-bold text-white uppercase tracking-wider">
                      View Details &amp; Trailer
                    </span>
                    <span className="mt-1 text-[10px] text-zinc-300 line-clamp-2 max-w-[150px]">
                      {movie.tagline || movie.genres.join(', ')}
                    </span>
                  </div>

                  {/* Bottom Title Bar */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5">
                    <h3 className="truncate font-display text-xs sm:text-sm font-bold text-white group-hover:text-gold-300 transition-colors">
                      {movie.title}
                    </h3>
                    <div className="mt-0.5 flex items-center justify-between text-[10px] text-zinc-400">
                      <span>{movie.release_date.split('-')[0]}</span>
                      <span className="truncate max-w-[80px]">{movie.genres[0]}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dossier & Trailer Modal */}
      <TheatricalModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Film,
  MessageSquarePlus,
  Play,
  Share2,
  Sparkles,
  Star,
  Users,
  Video,
  X,
} from 'lucide-react';
import type { TheatricalMovie } from '../services/cinema.service';
import { useToast } from '../contexts/ToastContext';

interface TheatricalModalProps {
  movie: TheatricalMovie | null;
  onClose: () => void;
}

export function TheatricalModal({ movie, onClose }: TheatricalModalProps) {
  const { notify } = useToast();
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    if (!movie) {
      setShowTrailer(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [movie, onClose]);

  if (!movie) return null;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    notify('Theatrical premiere link copied to clipboard!', 'info');
  };

  const handleRequest = () => {
    onClose();
    window.dispatchEvent(
      new CustomEvent('f2w:open-request', {
        detail: {
          title: movie.title,
          year: movie.release_date ? movie.release_date.split('-')[0] : '',
        },
      })
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Main Modal Box */}
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-gold-500/30 bg-[#0d0c13] text-white shadow-cinema max-h-[92vh] flex flex-col my-auto">
        {/* Top Header Cinema Banner */}
        <div className="relative aspect-[21/9] sm:aspect-[21/8] w-full overflow-hidden shrink-0 bg-ink-950">
          <img
            src={movie.backdrop_path || movie.poster_path}
            alt={movie.title}
            className="h-full w-full object-cover object-center brightness-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0c13] via-[#0d0c13]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0c13] via-transparent to-[#0d0c13]/80" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-zinc-300 ring-1 ring-white/20 transition hover:bg-black/90 hover:text-white"
            title="Close dossier"
          >
            <X size={18} />
          </button>

          {/* Top Marquee Ribbon */}
          <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-gold-400 ring-1 ring-gold-500/40 backdrop-blur">
              <Star size={12} className="fill-current text-gold-400" />
              {movie.status || 'Cinema Release'}
            </span>
            {movie.is_on_free2watch && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/40 backdrop-blur">
                <CheckCircle2 size={12} /> Available to Stream
              </span>
            )}
          </div>

          {/* Play Trailer Floating Button */}
          {movie.trailer_url && !showTrailer && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowTrailer(true)}
                className="group flex items-center gap-3 rounded-full border border-gold-500/40 bg-black/60 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-cinema backdrop-blur transition hover:scale-105 hover:bg-gold-500 hover:text-black"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-black group-hover:bg-black group-hover:text-gold-400">
                  <Play size={14} fill="currentColor" className="ml-0.5" />
                </span>
                Watch Cinema Trailer
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto px-5 py-6 sm:px-8 sm:py-7 space-y-6">
          {/* Active Trailer Player if opened */}
          {showTrailer && movie.trailer_url && (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-gold-500/30 bg-black shadow-cinema animate-fade-in">
              <iframe
                src={`${movie.trailer_url}?autoplay=1`}
                title={`${movie.title} Trailer`}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <button
                type="button"
                onClick={() => setShowTrailer(false)}
                className="absolute top-3 right-3 z-10 rounded-lg bg-black/80 px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:text-white"
              >
                Close Trailer
              </button>
            </div>
          )}

          {/* Title Header with Poster and Metadata */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <img
              src={movie.poster_path}
              alt={movie.title}
              className="w-32 sm:w-44 shrink-0 rounded-2xl border-2 border-gold-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] object-cover aspect-[2/3]"
            />

            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {movie.title}
                </h2>
                {movie.tagline && (
                  <p className="mt-1 text-sm italic text-gold-300/80 font-serif">
                    "{movie.tagline}"
                  </p>
                )}
              </div>

              {/* Unboxed Metadata row */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-zinc-400">
                <span className="flex items-center gap-1 font-bold text-gold-400">
                  <Star size={14} className="fill-current text-gold-400" />
                  {movie.vote_average.toFixed(1)} / 10
                  <span className="text-[10px] text-zinc-500">({movie.vote_count.toLocaleString()} votes)</span>
                </span>
                {movie.runtime && (
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> {movie.runtime}
                  </span>
                )}
                {movie.release_date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> {movie.release_date}
                  </span>
                )}
                {movie.certification && (
                  <span className="rounded border border-white/20 bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">
                    {movie.certification}
                  </span>
                )}
                {movie.box_office && (
                  <span className="text-zinc-300 font-mono text-[11px]">
                    Box Office: {movie.box_office}
                  </span>
                )}
              </div>

              {/* Genre Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {movie.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-zinc-300"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Key Crew / Director & Cast */}
              <div className="space-y-1.5 pt-2 text-xs border-t border-white/10 text-zinc-400">
                {movie.director && (
                  <p>
                    <strong className="text-zinc-200">Director:</strong> {movie.director}
                  </p>
                )}
                {movie.cast && movie.cast.length > 0 && (
                  <p>
                    <strong className="text-zinc-200">Starring:</strong> {movie.cast.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Synopsis */}
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-gold-400 flex items-center gap-2">
              <Film size={15} /> Cinema Storyline
            </h3>
            <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-line">
              {movie.overview}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-3">
              {movie.is_on_free2watch && movie.free2watch_slug ? (
                <Link
                  to={`/movie/${movie.free2watch_slug}`}
                  onClick={onClose}
                  className="btn-primary py-3 px-6 text-sm font-bold shadow-cinema flex items-center gap-2"
                >
                  <Play size={16} fill="currentColor" /> Stream Full Movie on FREE2WATCH
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleRequest}
                  className="btn-cinema-gold py-3 px-6 text-sm font-bold shadow-cinema flex items-center gap-2"
                >
                  <MessageSquarePlus size={16} /> Request on FREE2WATCH
                </button>
              )}

              {movie.trailer_url && !showTrailer && (
                <button
                  type="button"
                  onClick={() => setShowTrailer(true)}
                  className="btn-secondary py-3 px-5 text-sm font-semibold flex items-center gap-2"
                >
                  <Video size={16} className="text-gold-400" /> Watch Trailer
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="btn-secondary py-2.5 px-4 text-xs flex items-center gap-2 text-zinc-400 hover:text-white"
              title="Share movie dossier"
            >
              <Share2 size={14} /> Share
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

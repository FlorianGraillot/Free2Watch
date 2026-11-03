import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FastForward, Play, X } from 'lucide-react';
import type { Episode } from '../types';

interface EpisodeAutoNextProps {
  nextEpisode: Episode;
  nextHref: string;
}

export function EpisodeAutoNext({ nextEpisode, nextHref }: EpisodeAutoNextProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Show auto-next reminder
    setDismissed(false);
    setCountdown(null);
  }, [nextEpisode.id]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) {
      if (countdown === 0) {
        navigate(nextHref);
      }
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, nextHref, navigate]);

  if (dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-gold-500/30 bg-gradient-to-r from-[#141018] via-[#101016] to-[#141018] p-3 sm:p-4 shadow-gold animate-fade-in">
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-500/20 text-gold-400 border border-gold-500/40">
          <FastForward size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gold-400 font-mono">
            Up Next
          </p>
          <h4 className="truncate font-display text-xs sm:text-sm font-semibold text-white">
            Episode {nextEpisode.episode_number}: {nextEpisode.title || 'Next Chapter'}
          </h4>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          to={nextHref}
          className="btn-cinema-gold btn-sm py-1.5 px-3 text-xs font-bold flex items-center gap-1.5"
        >
          <Play size={12} fill="currentColor" /> Play Next
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 text-zinc-500 hover:text-white transition"
          aria-label="Dismiss up next"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

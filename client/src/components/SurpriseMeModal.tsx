import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Bookmark, Dices, Play, RefreshCw, Sparkles, Star, X } from 'lucide-react';
import { communityService } from '../services/community.service';
import { userPreferences } from '../services/userPreferences';
import { PosterImage } from './PosterImage';
import type { Content, ContentKind } from '../types';
import { contentPath, kindLabel } from '../utils/routes';
import { cn } from '../utils/format';

interface SurpriseMeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: { label: string; value: string }[] = [
  { label: 'Anything', value: '' },
  { label: 'Movies', value: 'movie' },
  { label: 'TV Series', value: 'series' },
  { label: 'Anime', value: 'anime' },
];

const MOODS = [
  'All Genres',
  'Action',
  'Sci-Fi',
  'Drama',
  'Comedy',
  'Horror',
  'Adventure',
  'Romance',
  'Thriller',
];

export function SurpriseMeModal({ isOpen, onClose }: SurpriseMeModalProps) {
  const [selectedType, setSelectedType] = useState('');
  const [selectedMood, setSelectedMood] = useState('All Genres');
  const [spinning, setSpinning] = useState(false);
  const [picked, setPicked] = useState<Content | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rollWheel = async () => {
    setSpinning(true);
    setError(null);

    try {
      // Simulate spinning reels for 650ms
      const genreParam = selectedMood === 'All Genres' ? undefined : selectedMood;
      const [title] = await Promise.all([
        communityService.getRandomTitle(selectedType || undefined, genreParam),
        new Promise((resolve) => setTimeout(resolve, 600)),
      ]);

      setPicked(title);
      setInWatchlist(userPreferences.isInWatchlist(title.id, title.content_type));
    } catch (err: any) {
      setError(err?.message || 'No titles matched this criteria. Try selecting another mood!');
    } finally {
      setSpinning(false);
    }
  };

  const toggleWatchlist = () => {
    if (!picked) return;
    const nowIn = userPreferences.toggleWatchlist(picked);
    setInWatchlist(nowIn);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Box */}
      <div className="relative z-[1001] w-full max-w-lg rounded-3xl border border-gold-500/30 bg-[#0C0C12] p-6 shadow-cinema animate-fade-in overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-gradient-to-b from-gold-500/20 via-brand-500/10 to-transparent blur-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-gold-500/10 text-gold-400 border border-gold-500/30 shadow-[0_0_20px_rgba(229,169,60,0.3)]">
              <Dices size={20} className={cn(spinning && 'animate-spin')} />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                Cinema Roulette
                <span className="rounded bg-gold-500/20 px-1.5 py-0.5 text-[9px] font-bold text-gold-300 font-mono">
                  SURPRISE ME
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Can't decide? Let the cinema reel choose for you.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 space-y-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/10">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedType(cat.value)}
                className={cn(
                  'flex-1 rounded-lg py-1.5 px-2 text-xs font-semibold transition',
                  selectedType === cat.value
                    ? 'bg-gold-500 text-black shadow-gold font-bold'
                    : 'text-zinc-400 hover:text-white'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Mood / Genre Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400 shrink-0">Genre:</span>
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="select py-1.5 text-xs bg-ink-900 border-white/10 text-white rounded-xl"
            >
              {MOODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Spinning or Result Box */}
        <div className="mt-5 min-h-[170px] flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          {spinning ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/20 text-gold-400 ring-2 ring-gold-500/40 animate-spin">
                <RefreshCw size={24} />
              </span>
              <p className="text-sm font-bold text-white tracking-wide animate-pulse">
                Rolling the 35mm reels…
              </p>
            </div>
          ) : picked ? (
            <div className="flex gap-4 items-start w-full animate-fade-in">
              <div className="relative w-20 h-28 shrink-0 overflow-hidden rounded-xl bg-ink-900 ring-1 ring-white/15 shadow-md">
                <PosterImage
                  src={picked.poster}
                  alt={picked.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[11px] text-gold-400 font-semibold uppercase">
                  <span>{kindLabel(picked.content_type ?? 'movie')}</span>
                  {picked.year && (
                    <>
                      <span>·</span>
                      <span className="text-zinc-400 font-mono">{picked.year}</span>
                    </>
                  )}
                  {picked.quality && (
                    <>
                      <span>·</span>
                      <span className="text-zinc-300 font-mono">{picked.quality}</span>
                    </>
                  )}
                </div>

                <h3 className="mt-1 font-display text-base font-bold text-white line-clamp-1">
                  {picked.title}
                </h3>

                <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {picked.description || picked.story || 'A curated cinema release ready to stream in high definition.'}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <Link
                    to={
                      picked.content_type === 'movie'
                        ? `${contentPath(picked)}?play=1`
                        : contentPath(picked)
                    }
                    onClick={onClose}
                    className="btn-primary btn-sm flex items-center gap-1.5 px-3 py-1.5"
                  >
                    <Play size={13} fill="currentColor" /> Watch Now
                  </Link>

                  <button
                    type="button"
                    onClick={toggleWatchlist}
                    className={cn(
                      'btn-sm btn rounded-xl border px-3 py-1.5 text-xs font-semibold transition',
                      inWatchlist
                        ? 'border-gold-500/50 bg-gold-500/15 text-gold-300'
                        : 'border-white/15 bg-white/5 text-white hover:border-white/30'
                    )}
                  >
                    <Bookmark size={13} className={inWatchlist ? 'fill-current text-gold-400' : ''} />
                    {inWatchlist ? 'Saved' : 'Watchlist'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 px-4">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-400 mb-2.5">
                <Sparkles size={22} />
              </span>
              <p className="text-sm font-semibold text-white">Press spin to discover a title</p>
              <p className="text-xs text-zinc-500 mt-0.5">Filter by category or mood if you wish.</p>
            </div>
          )}
        </div>

        {error && <p className="mt-2 text-center text-xs text-rose-400">{error}</p>}

        {/* Action Button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={rollWheel}
            disabled={spinning}
            className="btn-cinema-gold w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
          >
            <Dices size={17} className={cn(spinning && 'animate-spin')} />
            {picked ? 'Spin Again' : 'Roll the Cinema Reels'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

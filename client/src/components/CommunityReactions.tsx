import { useEffect, useState } from 'react';
import { Flame, Heart, Laugh, Popcorn, Sparkles, Zap } from 'lucide-react';
import { communityService, type ReactionsState } from '../services/community.service';
import { cn } from '../utils/format';

interface CommunityReactionsProps {
  contentType: string;
  contentId: number;
}

const REACTIONS: { key: keyof ReactionsState['counts']; label: string; emoji: string }[] = [
  { key: 'fire', label: 'Epic', emoji: '🔥' },
  { key: 'mindblown', label: 'Mind-Blowing', emoji: '🤯' },
  { key: 'popcorn', label: 'Masterpiece', emoji: '🍿' },
  { key: 'heart', label: 'Loved It', emoji: '❤️' },
  { key: 'laugh', label: 'Hilarious', emoji: '😂' },
];

export function CommunityReactions({ contentType, contentId }: CommunityReactionsProps) {
  const [data, setData] = useState<ReactionsState>({
    counts: { fire: 0, mindblown: 0, popcorn: 0, heart: 0, laugh: 0 },
    userReaction: null,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    communityService
      .getReactions(contentType, contentId)
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [contentType, contentId]);

  const handleReact = async (reactionKey: string) => {
    if (submitting) return;
    setSubmitting(true);

    // Optimistic UI update
    const prev = { ...data };
    const currentVote = prev.userReaction;
    const isRemoving = currentVote === reactionKey;

    const newCounts = { ...prev.counts };
    if (currentVote && newCounts[currentVote as keyof ReactionsState['counts']] !== undefined) {
      newCounts[currentVote as keyof ReactionsState['counts']] = Math.max(
        0,
        newCounts[currentVote as keyof ReactionsState['counts']] - 1
      );
    }
    if (!isRemoving && newCounts[reactionKey as keyof ReactionsState['counts']] !== undefined) {
      newCounts[reactionKey as keyof ReactionsState['counts']] += 1;
    }

    setData({
      counts: newCounts,
      userReaction: isRemoving ? null : reactionKey,
    });

    try {
      const res = await communityService.toggleReaction(contentType, contentId, reactionKey);
      setData(res);
    } catch {
      // Revert if failed
      setData(prev);
    } finally {
      setSubmitting(false);
    }
  };

  const totalReactions = Object.values(data.counts).reduce((acc, c) => acc + c, 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#101016] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gold-500/15 text-gold-400">
            <Zap size={14} />
          </span>
          <h3 className="font-display text-sm font-bold text-white tracking-tight">
            Audience Reactions
          </h3>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">
          {totalReactions} {totalReactions === 1 ? 'vote' : 'votes'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {REACTIONS.map((r) => {
          const count = data.counts[r.key] || 0;
          const isSelected = data.userReaction === r.key;

          return (
            <button
              key={r.key}
              type="button"
              onClick={() => handleReact(r.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 select-none active:scale-95',
                isSelected
                  ? 'border-gold-500/70 bg-gradient-to-r from-gold-500/20 to-amber-500/20 text-gold-300 ring-1 ring-gold-500/40 shadow-gold'
                  : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/25 hover:bg-white/[0.06] hover:text-white'
              )}
              title={`React: ${r.label}`}
            >
              <span className="text-base leading-none">{r.emoji}</span>
              <span>{r.label}</span>
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold',
                  isSelected ? 'bg-gold-500 text-black' : 'bg-white/10 text-zinc-400'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

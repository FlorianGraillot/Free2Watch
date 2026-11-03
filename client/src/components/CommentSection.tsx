import { useEffect, useState } from 'react';
import { Eye, EyeOff, MessageSquare, Send, ShieldAlert, Sparkles, User } from 'lucide-react';
import { communityService, type CommentItem } from '../services/community.service';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../utils/format';

interface CommentSectionProps {
  contentType: string;
  contentId: number;
}

export function CommentSection({ contentType, contentId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [posting, setPosting] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<number, boolean>>({});
  const { notify } = useToast();

  useEffect(() => {
    let active = true;
    setLoading(true);
    communityService
      .getComments(contentType, contentId)
      .then((items) => {
        if (active) setComments(items);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [contentType, contentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setPosting(true);
    try {
      const created = await communityService.addComment(
        contentType,
        contentId,
        text,
        name.trim() || undefined,
        isSpoiler
      );
      setComments((prev) => [created, ...prev]);
      setText('');
      setIsSpoiler(false);
      notify('Your cinema review has been posted!', 'success');
    } catch (err: any) {
      notify(err?.message || 'Failed to post comment', 'error');
    } finally {
      setPosting(false);
    }
  };

  const toggleRevealSpoiler = (id: number) => {
    setRevealedSpoilers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0E0E14] p-5 sm:p-7 space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-500/15 text-gold-400 border border-gold-500/30">
            <MessageSquare size={16} />
          </span>
          <div>
            <h3 className="font-display text-base font-bold text-white tracking-tight">
              Cinema Discussions &amp; Reviews
            </h3>
            <p className="text-xs text-zinc-400">Share your thoughts with fellow moviegoers</p>
          </div>
        </div>
        <span className="rounded-lg bg-white/5 px-2 py-1 text-xs font-mono font-semibold text-zinc-400">
          {comments.length} {comments.length === 1 ? 'Review' : 'Reviews'}
        </span>
      </div>

      {/* Post a Review Form */}
      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name or handle (optional)"
            maxLength={40}
            className="input text-xs py-2 h-9 rounded-xl max-w-xs"
          />

          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none self-center sm:ml-auto">
            <input
              type="checkbox"
              checked={isSpoiler}
              onChange={(e) => setIsSpoiler(e.target.checked)}
              className="rounded border-white/20 bg-ink-900 text-gold-500 focus:ring-gold-500/30"
            />
            <span className={cn('font-medium', isSpoiler && 'text-amber-300 font-semibold')}>
              Contains spoilers
            </span>
          </label>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your review, favourite scene, or reaction…"
          maxLength={800}
          rows={3}
          required
          className="textarea w-full text-xs sm:text-sm rounded-xl resize-none py-2.5"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-zinc-500 font-mono">
            {text.length}/800
          </span>
          <button
            type="submit"
            disabled={posting || !text.trim()}
            className="btn-cinema-gold btn-sm px-4 py-2 font-bold flex items-center gap-1.5"
          >
            <Send size={13} />
            {posting ? 'Posting…' : 'Post Review'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {loading && comments.length === 0 ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 skeleton rounded-xl" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">
            No reviews yet. Be the first to start the discussion!
          </div>
        ) : (
          comments.map((comment) => {
            const hasSpoiler = Boolean(comment.is_spoiler);
            const isRevealed = Boolean(revealedSpoilers[comment.id]);

            return (
              <div
                key={comment.id}
                className="rounded-xl border border-white/10 bg-white/[0.025] p-3.5 sm:p-4 space-y-2 transition hover:border-white/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400 font-bold text-xs uppercase border border-gold-500/20">
                      {comment.author_name[0] || 'C'}
                    </span>
                    <span className="font-display text-xs sm:text-sm font-semibold text-white">
                      {comment.author_name}
                    </span>
                    {hasSpoiler && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 uppercase tracking-wide">
                        <ShieldAlert size={10} /> Spoiler
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>

                {hasSpoiler && !isRevealed ? (
                  <div
                    onClick={() => toggleRevealSpoiler(comment.id)}
                    className="relative cursor-pointer rounded-lg bg-black/50 p-3 text-center border border-amber-500/20 hover:border-amber-500/40 transition select-none"
                  >
                    <p className="text-xs font-semibold text-amber-300 flex items-center justify-center gap-1.5">
                      <Eye size={13} /> Click to reveal spoiler review
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm leading-relaxed text-zinc-300 whitespace-pre-line">
                      {comment.text}
                    </p>
                    {hasSpoiler && (
                      <button
                        type="button"
                        onClick={() => toggleRevealSpoiler(comment.id)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 mt-1"
                      >
                        <EyeOff size={10} /> Hide spoiler
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

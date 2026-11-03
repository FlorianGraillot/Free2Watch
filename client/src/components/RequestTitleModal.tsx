import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Film, Send, Sparkles, X } from 'lucide-react';
import { communityService } from '../services/community.service';
import { useToast } from '../contexts/ToastContext';

interface RequestTitleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestTitleModal({ isOpen, onClose }: RequestTitleModalProps) {
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('movie');
  const [year, setYear] = useState('');
  const [notes, setNotes] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await communityService.submitRequest({
        title: title.trim(),
        contentType,
        year: year.trim() || undefined,
        notes: notes.trim() || undefined,
        email: email.trim() || undefined,
      });
      notify('Thank you! Your request has been queued for our curation team.', 'success');
      setTitle('');
      setYear('');
      setNotes('');
      setEmail('');
      onClose();
    } catch (err: any) {
      notify(err?.message || 'Failed to submit request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-[1001] w-full max-w-md rounded-3xl border border-gold-500/30 bg-[#0C0C12] p-6 shadow-cinema animate-fade-in">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/30">
              <Film size={17} />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-white">Request a Title</h2>
              <p className="text-xs text-zinc-400">Can't find a movie or series? We will add it!</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="label">Title Name *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Inception, Attack on Titan Season 4..."
              className="input text-xs py-2 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="select text-xs py-2 rounded-xl"
              >
                <option value="movie">Movie</option>
                <option value="series">TV Series</option>
                <option value="tv_show">TV Show</option>
                <option value="anime">Anime</option>
              </select>
            </div>

            <div>
              <label className="label">Release Year</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2024"
                className="input text-xs py-2 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="label">Notes / Season (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specific version, season number, audio preference..."
              className="textarea text-xs py-2 rounded-xl resize-none"
            />
          </div>

          <div>
            <label className="label">Your Email (Optional, to get notified)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="input text-xs py-2 rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="btn-cinema-gold w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Send size={13} />
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

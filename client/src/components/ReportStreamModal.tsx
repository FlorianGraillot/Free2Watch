import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Send, X } from 'lucide-react';
import { communityService } from '../services/community.service';
import { useToast } from '../contexts/ToastContext';

interface ReportStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: string;
  contentId: number;
  contentTitle: string;
  currentServer?: string;
}

const ISSUE_TYPES = [
  { value: 'not_playing', label: 'Video will not load or start playing' },
  { value: 'buffering', label: 'Constant buffering or very slow' },
  { value: 'wrong_audio_subs', label: 'Missing or wrong subtitles/audio' },
  { value: 'broken_embed', label: 'Embedding blocked or broken link' },
  { value: 'wrong_episode', label: 'Wrong episode or movie file' },
];

export function ReportStreamModal({
  isOpen,
  onClose,
  contentType,
  contentId,
  contentTitle,
  currentServer = 'Server 1',
}: ReportStreamModalProps) {
  const [issueType, setIssueType] = useState('not_playing');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await communityService.submitReport({
        contentType,
        contentId,
        contentTitle,
        serverName: currentServer,
        issueType,
        notes: notes.trim() || undefined,
      });
      notify('Thank you! Technical report submitted. Our team will verify.', 'success');
      setNotes('');
      onClose();
    } catch (err: any) {
      notify(err?.message || 'Failed to submit report', 'error');
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

      <div className="relative z-[1001] w-full max-w-md rounded-3xl border border-rose-500/30 bg-[#0C0C12] p-6 shadow-cinema animate-fade-in">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <AlertTriangle size={17} />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-white">Report Stream Issue</h2>
              <p className="text-xs text-zinc-400">{contentTitle} ({currentServer})</p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="label">What issue are you experiencing?</label>
            <div className="space-y-2 mt-2">
              {ISSUE_TYPES.map((issue) => (
                <label
                  key={issue.value}
                  className="flex items-center gap-2.5 p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer text-xs text-zinc-300"
                >
                  <input
                    type="radio"
                    name="issueType"
                    value={issue.value}
                    checked={issueType === issue.value}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="text-brand-500 focus:ring-brand-500/30 bg-ink-900 border-white/20"
                  />
                  <span>{issue.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Additional Details (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Stops playing at 14:20..."
              className="textarea text-xs py-2 rounded-xl resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Send size={13} />
            {submitting ? 'Submitting…' : 'Send Report'}
          </button>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

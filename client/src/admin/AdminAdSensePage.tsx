import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  DollarSign,
  ExternalLink,
  HelpCircle,
  Info,
  Megaphone,
  Radio,
  Save,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Tv,
} from 'lucide-react';
import { adsenseService } from '../services/adsense.service';
import { apiErrorMessage } from '../services/api';
import { useAdSense } from '../contexts/AdSenseContext';
import { useToast } from '../contexts/ToastContext';
import { useSeo } from '../hooks/useSeo';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { AdSenseBanner } from '../components/common/AdSenseBanner';
import { cn } from '../utils/format';
import type { AdSenseSettings } from '../types';

export function AdminAdSensePage() {
  const { notify } = useToast();
  const { updateLocalSettings } = useAdSense();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedAdsTxt, setCopiedAdsTxt] = useState(false);

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [clientId, setClientId] = useState('');
  const [slotHeader, setSlotHeader] = useState('');
  const [slotInFeed, setSlotInFeed] = useState('');
  const [slotPlayerBottom, setSlotPlayerBottom] = useState('');
  const [adsTxtContent, setAdsTxtContent] = useState('');

  useSeo({
    title: 'Google AdSense Monetization',
    description: 'Configure Google AdSense publisher ID, ad slot units, and ads.txt verification.',
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adsenseService.getAdminSettings();
      setEnabled(Boolean(data.enabled));
      setTestMode(Boolean(data.testMode));
      setClientId(data.clientId || '');
      setSlotHeader(data.slotHeader || '');
      setSlotInFeed(data.slotInFeed || '');
      setSlotPlayerBottom(data.slotPlayerBottom || '');
      setAdsTxtContent(data.adsTxtContent || '');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load Google AdSense settings.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload: Partial<AdSenseSettings> = {
        enabled,
        testMode,
        clientId: clientId.trim(),
        slotHeader: slotHeader.trim(),
        slotInFeed: slotInFeed.trim(),
        slotPlayerBottom: slotPlayerBottom.trim(),
      };

      const updated = await adsenseService.updateSettings(payload);
      updateLocalSettings(updated);
      setSuccess('Google AdSense configuration saved successfully!');
      notify('AdSense settings saved', 'success');

      // Refresh admin data to get updated adsTxtContent
      const refreshed = await adsenseService.getAdminSettings();
      setAdsTxtContent(refreshed.adsTxtContent || '');
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to save AdSense settings.'));
      notify('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const copyAdsTxt = () => {
    if (!adsTxtContent) return;
    navigator.clipboard.writeText(adsTxtContent);
    setCopiedAdsTxt(true);
    notify('ads.txt copied to clipboard', 'info');
    setTimeout(() => setCopiedAdsTxt(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-60 skeleton" />
        <div className="h-4 w-96 skeleton" />
        <div className="h-64 panel skeleton mt-6" />
      </div>
    );
  }

  const isConfigured = Boolean(clientId.trim().startsWith('ca-pub-') || clientId.trim().startsWith('pub-'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow flex items-center gap-1.5 text-brand-400">
            <DollarSign size={13} /> Monetization
          </span>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white">
            Google AdSense Settings
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500">
            Monetize FREE2WATCH with Google AdSense. Manage your Publisher ID, responsive ad slots,
            test mode, and automated <code className="text-zinc-400">/ads.txt</code> verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/ads.txt"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary btn-sm"
            title="View live ads.txt file"
          >
            <ExternalLink size={13} /> View /ads.txt
          </a>
          <a
            href="https://www.google.com/adsense"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary btn-sm"
          >
            <ExternalLink size={13} /> AdSense Console
          </a>
        </div>
      </div>

      {/* Status pills */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel p-4 flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1',
              enabled
                ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/25'
                : 'bg-zinc-800 text-zinc-500 ring-white/10'
            )}
          >
            <Radio size={18} />
          </div>
          <div>
            <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Status</div>
            <div className="text-sm font-bold text-white">
              {enabled ? (
                <span className="text-emerald-400">Ads Enabled</span>
              ) : (
                <span className="text-zinc-400">Disabled</span>
              )}
            </div>
          </div>
        </div>

        <div className="panel p-4 flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1',
              testMode
                ? 'bg-amber-500/15 text-amber-300 ring-amber-500/25'
                : 'bg-blue-500/15 text-blue-300 ring-blue-500/25'
            )}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Environment</div>
            <div className="text-sm font-bold text-white">
              {testMode ? (
                <span className="text-amber-300">Test / Preview Mode</span>
              ) : (
                <span className="text-blue-300">Live Production</span>
              )}
            </div>
          </div>
        </div>

        <div className="panel p-4 flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1',
              isConfigured
                ? 'bg-brand-500/15 text-brand-300 ring-brand-500/25'
                : 'bg-zinc-800 text-zinc-500 ring-white/10'
            )}
          >
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Publisher ID</div>
            <div className="text-xs font-mono font-semibold text-zinc-300 truncate max-w-[140px]">
              {clientId || 'Not configured'}
            </div>
          </div>
        </div>

        <div className="panel p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">ads.txt Route</div>
            <div className="text-sm font-bold text-emerald-400">Automated & Live</div>
          </div>
        </div>
      </div>

      {/* Main settings form */}
      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <form onSubmit={handleSave} className="panel p-5 sm:p-6 space-y-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/25">
              <Megaphone size={18} />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-white">AdSense Configuration</h3>
              <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
                Your settings are saved directly in the SQLite database and served across all clients.
              </p>
            </div>
          </div>

          {/* Master Toggles */}
          <div className="grid gap-3 sm:grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            {/* Global Enable */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <label htmlFor="toggle-adsense" className="text-xs font-semibold text-white cursor-pointer">
                  Enable AdSense
                </label>
                <p className="text-[11px] text-zinc-500">Turn on ad slots across the website</p>
              </div>
              <button
                type="button"
                id="toggle-adsense"
                role="switch"
                aria-checked={enabled}
                onClick={() => setEnabled((prev) => !prev)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                  enabled ? 'bg-brand-500' : 'bg-zinc-800'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                    enabled ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {/* Test Mode */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <label htmlFor="toggle-testmode" className="text-xs font-semibold text-white cursor-pointer">
                  Test / Preview Mode
                </label>
                <p className="text-[11px] text-zinc-500">
                  Deliver safe test ads and preview slot outlines
                </p>
              </div>
              <button
                type="button"
                id="toggle-testmode"
                role="switch"
                aria-checked={testMode}
                onClick={() => setTestMode((prev) => !prev)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                  testMode ? 'bg-amber-500' : 'bg-zinc-800'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                    testMode ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          </div>

          {/* Publisher ID */}
          <Field
            label="Google AdSense Publisher ID"
            htmlFor="client-id"
            required
            hint="Your unique Google AdSense client ID starting with ca-pub- (e.g. ca-pub-1234567890123456)."
          >
            <div className="relative">
              <input
                id="client-id"
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                className="input font-mono text-xs"
              />
            </div>
            {clientId && !clientId.startsWith('ca-pub-') && (
              <p className="mt-1 text-[11px] text-amber-400">
                Tip: Enter your full ID starting with <code>ca-pub-</code>. We will auto-format it on save.
              </p>
            )}
          </Field>

          <div className="h-px bg-white/[0.07]" />

          {/* Ad Slot IDs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Ad Unit Slots (Optional)
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Leave empty to let AdSense optimize automatically (Auto Ads), or enter specific Display Ad Unit IDs.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Header Leaderboard"
                htmlFor="slot-header"
                hint="Displayed under navigation bar."
              >
                <input
                  id="slot-header"
                  type="text"
                  value={slotHeader}
                  onChange={(e) => setSlotHeader(e.target.value)}
                  placeholder="e.g. 1234567890"
                  className="input font-mono text-xs"
                />
              </Field>

              <Field
                label="In-Feed (Catalog)"
                htmlFor="slot-in-feed"
                hint="Between rows on Home & Browse."
              >
                <input
                  id="slot-in-feed"
                  type="text"
                  value={slotInFeed}
                  onChange={(e) => setSlotInFeed(e.target.value)}
                  placeholder="e.g. 2345678901"
                  className="input font-mono text-xs"
                />
              </Field>

              <Field
                label="Watch Player Bottom"
                htmlFor="slot-player"
                hint="Beneath video player & servers."
              >
                <input
                  id="slot-player"
                  type="text"
                  value={slotPlayerBottom}
                  onChange={(e) => setSlotPlayerBottom(e.target.value)}
                  placeholder="e.g. 3456789012"
                  className="input font-mono text-xs"
                />
              </Field>
            </div>
          </div>

          {error && (
            <div
              className="flex items-start gap-2 rounded-xl border border-brand-500/30 bg-brand-500/10 p-3 text-xs text-brand-200"
              role="alert"
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200"
              role="status"
            >
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-zinc-500">
              {enabled
                ? 'AdSense is active across public pages.'
                : 'AdSense is currently disabled (no ads shown to viewers).'}
            </p>
            <Button type="submit" loading={saving} icon={<Save size={15} />}>
              Save AdSense Settings
            </Button>
          </div>
        </form>

        {/* Sidebar instructions & ads.txt */}
        <div className="space-y-4">
          {/* Automated ads.txt Card */}
          <section className="panel p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <h3 className="font-display text-sm font-bold text-white">ads.txt Verification</h3>
              </div>
              <button
                type="button"
                onClick={copyAdsTxt}
                className="btn-secondary btn-xs flex items-center gap-1"
                title="Copy ads.txt content"
              >
                <Copy size={12} />
                {copiedAdsTxt ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Google AdSense requires an <code className="text-zinc-300 font-mono">ads.txt</code> file at the root of
              your domain to prevent ad fraud. FREE2WATCH generates and serves this automatically at:
            </p>

            <div className="rounded-xl border border-white/10 bg-black/50 p-3 font-mono text-[11px] text-emerald-300 break-all select-all">
              {adsTxtContent || '# Set your Publisher ID to see your verified ads.txt'}
            </div>

            <p className="text-[10px] text-zinc-500 flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-400" /> Verified automatically by Google crawlers at{' '}
              <a href="/ads.txt" target="_blank" rel="noreferrer" className="text-brand-300 underline">
                /ads.txt
              </a>
            </p>
          </section>

          {/* Setup Guide */}
          <section className="panel p-5 space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle size={16} className="text-brand-400" />
              <h3 className="font-display text-sm font-bold text-white">How to connect Google AdSense</h3>
            </div>

            <ol className="space-y-3 text-[11px] leading-relaxed text-zinc-400">
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] font-bold text-white">
                  1
                </span>
                <div>
                  <strong className="text-white">Get your Publisher ID:</strong> Sign in to{' '}
                  <a
                    href="https://www.google.com/adsense"
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-400 hover:underline"
                  >
                    Google AdSense
                  </a>
                  , go to <em>Account &gt; Settings &gt; Account information</em> and copy your{' '}
                  <code className="text-zinc-300">ca-pub-XXXXXXXXXXXX</code> ID.
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] font-bold text-white">
                  2
                </span>
                <div>
                  <strong className="text-white">Save in FREE2WATCH:</strong> Paste your Publisher ID in the field on the left,
                  keep <em>Test Mode</em> turned on, and click Save.
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] font-bold text-white">
                  3
                </span>
                <div>
                  <strong className="text-white">Add site to AdSense:</strong> In the AdSense console, click{' '}
                  <em>Sites &gt; Add site</em> and enter your domain name. AdSense will verify your site via{' '}
                  <code className="text-zinc-300">/ads.txt</code>.
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] font-bold text-white">
                  4
                </span>
                <div>
                  <strong className="text-white">Go Live:</strong> Once Google approves your site, toggle{' '}
                  <em>Test Mode OFF</em> to start generating revenue from live ads!
                </div>
              </li>
            </ol>
          </section>
        </div>
      </div>

      {/* Live Visual Slot Preview */}
      <section className="panel p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Tv size={18} className="text-brand-400" />
            <div>
              <h3 className="font-display text-base font-bold text-white">Ad Slot Layout Preview</h3>
              <p className="text-[11px] text-zinc-500">
                This preview reflects how ad slots appear in header, in-feed catalog, and watch player positions.
              </p>
            </div>
          </div>
          <span className="badge bg-white/[0.05] text-zinc-400 font-mono text-[10px]">
            Preview
          </span>
        </div>

        <div className="space-y-6 pt-2">
          <div>
            <div className="text-xs font-semibold text-zinc-400 mb-2">1. Header Leaderboard Slot</div>
            <AdSenseBanner slotType="header" />
          </div>

          <div>
            <div className="text-xs font-semibold text-zinc-400 mb-2">2. In-Feed Catalog Slot</div>
            <AdSenseBanner slotType="in_feed" />
          </div>

          <div>
            <div className="text-xs font-semibold text-zinc-400 mb-2">3. Watch Player Bottom Slot</div>
            <AdSenseBanner slotType="player_bottom" />
          </div>
        </div>
      </section>
    </div>
  );
}

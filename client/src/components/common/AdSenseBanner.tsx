import { useEffect, useRef, useState } from 'react';
import { useAdSense } from '../../contexts/AdSenseContext';
import { Megaphone, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/format';

export type AdSlotType = 'header' | 'in_feed' | 'player_bottom' | 'custom';

interface AdSenseBannerProps {
  slotType: AdSlotType;
  slotId?: string;
  format?: 'auto' | 'horizontal' | 'rectangle';
  className?: string;
  label?: string;
}

const SLOT_LABELS: Record<AdSlotType, string> = {
  header: 'Header Leaderboard Banner',
  in_feed: 'In-Feed Catalog Ad',
  player_bottom: 'Video Player Sponsored Banner',
  custom: 'Display Ad Unit',
};

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export function AdSenseBanner({
  slotType,
  slotId: explicitSlotId,
  format = 'auto',
  className,
  label = 'Advertisement',
}: AdSenseBannerProps) {
  const { settings, loading } = useAdSense();
  const pushedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [adError, setAdError] = useState(false);

  // Determine which slot ID to use
  const slotId =
    explicitSlotId ||
    (slotType === 'header'
      ? settings?.slotHeader
      : slotType === 'in_feed'
      ? settings?.slotInFeed
      : slotType === 'player_bottom'
      ? settings?.slotPlayerBottom
      : '');

  const isEnabled = Boolean(settings?.enabled);
  const isTestMode = Boolean(settings?.testMode);
  const clientId = settings?.clientId?.trim();

  // Initialize adsbygoogle
  useEffect(() => {
    if (!isEnabled || !clientId || pushedRef.current) return;

    // Small delay to ensure the container is mounted and has measured dimensions
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && containerRef.current) {
          const ins = containerRef.current.querySelector('ins.adsbygoogle');
          if (ins && !ins.getAttribute('data-adsbygoogle-status')) {
            window.adsbygoogle = window.adsbygoogle || [];
            window.adsbygoogle.push({});
            pushedRef.current = true;
          }
        }
      } catch (err) {
        // Silently catch ad-blocker or slot size errors
        console.debug('[AdSense] Slot push notice:', err);
        setAdError(true);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isEnabled, clientId, slotId]);

  // If AdSense is disabled, render nothing
  if (!loading && !isEnabled) {
    return null;
  }

  // Loading skeleton while initial settings are fetched
  if (loading && !settings) {
    return null;
  }

  // If test mode is enabled or clientId is not yet provided, show the test/preview placeholder
  if (isTestMode || !clientId) {
    return (
      <div className={cn('w-full my-6', className)}>
        <div className="mx-auto flex flex-col items-center">
          <div className="mb-1.5 flex items-center gap-2 self-start text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
            <span>{label}</span>
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-amber-400 font-mono">
              Test Mode
            </span>
          </div>

          <div
            className={cn(
              'w-full rounded-2xl border border-dashed border-brand-500/30 bg-gradient-to-r from-ink-900/90 via-ink-900/60 to-ink-900/90 p-4 sm:p-6 text-center transition backdrop-blur-md relative overflow-hidden',
              slotType === 'header' && 'min-h-[90px] sm:min-h-[110px]',
              slotType === 'in_feed' && 'min-h-[140px]',
              slotType === 'player_bottom' && 'min-h-[100px]'
            )}
          >
            {/* Background subtle effect */}
            <div className="absolute inset-0 bg-brand-500/[0.02] pointer-events-none" />

            <div className="relative flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-2 text-brand-400">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/15 ring-1 ring-brand-500/25">
                  <Megaphone size={14} />
                </span>
                <span className="font-display text-xs sm:text-sm font-bold text-white tracking-wide">
                  Google AdSense — {SLOT_LABELS[slotType]}
                </span>
              </div>

              <p className="max-w-md text-[11px] text-zinc-400 leading-relaxed">
                {clientId ? (
                  <>
                    Account: <code className="text-zinc-300 font-mono text-[10px] bg-black/40 px-1 py-0.5 rounded">{clientId}</code>
                    {slotId ? (
                      <> · Slot: <code className="text-zinc-300 font-mono text-[10px] bg-black/40 px-1 py-0.5 rounded">{slotId}</code></>
                    ) : (
                      ' · Auto format active'
                    )}
                  </>
                ) : (
                  <span className="text-amber-300/90 flex items-center justify-center gap-1.5">
                    <AlertCircle size={13} />
                    Publisher ID not configured yet. Set your ca-pub ID in Admin &gt; Google AdSense.
                  </span>
                )}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[10px] text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <Sparkles size={11} className="text-brand-400" /> Responsive slot ({format})
                </span>
                <span>•</span>
                <span>Verified with ads.txt</span>
                <span>•</span>
                <span>Turn off Test Mode in Admin to serve live ads</span>
              </div>
            </div>

            {/* If client ID is present, we still include the real test tag in the DOM */}
            {clientId && (
              <div ref={containerRef} className="opacity-0 h-0 overflow-hidden" aria-hidden="true">
                <ins
                  className="adsbygoogle"
                  style={{ display: 'block' }}
                  data-ad-client={clientId}
                  data-ad-slot={slotId || undefined}
                  data-ad-format={format}
                  data-full-width-responsive="true"
                  data-ad-test="on"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Live Mode: Real Google AdSense Tag
  return (
    <div className={cn('w-full my-6 overflow-hidden', className)}>
      <div className="mb-1 text-right text-[10px] uppercase tracking-wider font-semibold text-zinc-600">
        {label}
      </div>
      <div
        ref={containerRef}
        className={cn(
          'w-full flex justify-center items-center rounded-xl bg-ink-950/40 min-h-[90px]',
          adError && 'hidden'
        )}
      >
        <ins
          className="adsbygoogle"
          style={{ display: 'block', minWidth: '250px', width: '100%' }}
          data-ad-client={clientId}
          data-ad-slot={slotId || undefined}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}

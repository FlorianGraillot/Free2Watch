import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { adsenseService } from '../services/adsense.service';
import type { AdSenseSettings } from '../types';

interface AdSenseContextValue {
  settings: AdSenseSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateLocalSettings: (settings: AdSenseSettings) => void;
}

const defaultSettings: AdSenseSettings = {
  enabled: false,
  clientId: '',
  testMode: true,
  slotHeader: '',
  slotInFeed: '',
  slotPlayerBottom: '',
};

const AdSenseContext = createContext<AdSenseContextValue>({
  settings: defaultSettings,
  loading: false,
  refreshSettings: async () => {},
  updateLocalSettings: () => {},
});

export function AdSenseProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AdSenseSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adsenseService.getPublicSettings();
      setSettings(data);
    } catch (err) {
      console.warn('[AdSense] Failed to load AdSense settings:', err);
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Inject Google AdSense script when enabled and clientId is present
  useEffect(() => {
    if (!settings?.enabled || !settings?.clientId) {
      return;
    }

    const scriptId = 'google-adsense-script';
    const existing = document.getElementById(scriptId);

    // If script already exists with correct client ID, don't recreate
    const expectedSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.clientId}`;
    if (existing) {
      if (existing.getAttribute('src') === expectedSrc) {
        return;
      }
      existing.remove();
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = expectedSrc;
    script.crossOrigin = 'anonymous';

    script.onerror = () => {
      console.info('[AdSense] AdSense script blocked or failed to load (possibly due to an ad-blocker or unverified test domain).');
    };

    document.head.appendChild(script);
  }, [settings?.enabled, settings?.clientId]);

  const updateLocalSettings = useCallback((newSettings: AdSenseSettings) => {
    setSettings(newSettings);
  }, []);

  return (
    <AdSenseContext.Provider
      value={{
        settings,
        loading,
        refreshSettings: fetchSettings,
        updateLocalSettings,
      }}
    >
      {children}
    </AdSenseContext.Provider>
  );
}

export function useAdSense() {
  const context = useContext(AdSenseContext);
  if (!context) {
    throw new Error('useAdSense must be used within an AdSenseProvider');
  }
  return context;
}

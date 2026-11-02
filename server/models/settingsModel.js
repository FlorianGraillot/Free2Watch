import { getDb } from '../database/connection.js';

export const settingsModel = {
  get(key, defaultValue = '') {
    const db = getDb();
    const row = db.prepare('SELECT value FROM site_settings WHERE key = ?').get(key);
    return row ? row.value : defaultValue;
  },

  set(key, value) {
    const db = getDb();
    db.prepare(`
      INSERT INTO site_settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `).run(key, String(value));
  },

  getAll(keys) {
    const db = getDb();
    if (!keys || !keys.length) {
      const rows = db.prepare('SELECT key, value FROM site_settings').all();
      return Object.fromEntries(rows.map((r) => [r.key, r.value]));
    }
    const placeholders = keys.map(() => '?').join(',');
    const rows = db.prepare(`SELECT key, value FROM site_settings WHERE key IN (${placeholders})`).all(...keys);
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  },

  getAdSenseSettings() {
    const values = this.getAll([
      'adsense_enabled',
      'adsense_client_id',
      'adsense_test_mode',
      'adsense_slot_header',
      'adsense_slot_in_feed',
      'adsense_slot_player_bottom',
    ]);

    return {
      enabled: values.adsense_enabled === '1',
      clientId: values.adsense_client_id || '',
      testMode: values.adsense_test_mode !== '0', // Defaults to true if unconfigured
      slotHeader: values.adsense_slot_header || '',
      slotInFeed: values.adsense_slot_in_feed || '',
      slotPlayerBottom: values.adsense_slot_player_bottom || '',
    };
  },

  updateAdSenseSettings({ enabled, clientId, testMode, slotHeader, slotInFeed, slotPlayerBottom }) {
    // Sanitize and normalize client ID: ca-pub-1234567890123456
    let cleanClientId = (clientId || '').trim();
    if (cleanClientId) {
      if (!cleanClientId.startsWith('ca-pub-') && cleanClientId.startsWith('pub-')) {
        cleanClientId = `ca-${cleanClientId}`;
      } else if (!cleanClientId.startsWith('ca-pub-') && /^\d+$/.test(cleanClientId)) {
        cleanClientId = `ca-pub-${cleanClientId}`;
      }
    }

    const db = getDb();
    const update = db.transaction(() => {
      if (typeof enabled !== 'undefined') {
        this.set('adsense_enabled', enabled ? '1' : '0');
      }
      if (typeof clientId !== 'undefined') {
        this.set('adsense_client_id', cleanClientId);
      }
      if (typeof testMode !== 'undefined') {
        this.set('adsense_test_mode', testMode ? '1' : '0');
      }
      if (typeof slotHeader !== 'undefined') {
        this.set('adsense_slot_header', (slotHeader || '').trim());
      }
      if (typeof slotInFeed !== 'undefined') {
        this.set('adsense_slot_in_feed', (slotInFeed || '').trim());
      }
      if (typeof slotPlayerBottom !== 'undefined') {
        this.set('adsense_slot_player_bottom', (slotPlayerBottom || '').trim());
      }
    });

    update();
    return this.getAdSenseSettings();
  },

  getAdsTxtContent() {
    const { clientId } = this.getAdSenseSettings();
    if (!clientId) {
      return '# Google AdSense ads.txt for FREE2WATCH\n# Configure your Publisher ID in the FREE2WATCH Admin Panel > Google AdSense.\n';
    }
    // Extract the pub-XXXXXXXXXXXXXXXX portion
    const pubPart = clientId.replace(/^ca-/, '');
    return `# Google AdSense Authorized Digital Sellers (ads.txt)\n# Publisher ID: ${clientId}\ngoogle.com, ${pubPart}, DIRECT, f08c47fec0942fa0\n`;
  },
};

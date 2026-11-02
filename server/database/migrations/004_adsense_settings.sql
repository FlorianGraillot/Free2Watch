-- Migration 004: Create site_settings table for Google AdSense and site monetization
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Pre-seed default Google AdSense settings
INSERT OR IGNORE INTO site_settings (key, value) VALUES
  ('adsense_enabled', '0'),
  ('adsense_client_id', ''),
  ('adsense_test_mode', '1'),
  ('adsense_slot_header', ''),
  ('adsense_slot_in_feed', ''),
  ('adsense_slot_player_bottom', '');

import { settingsModel } from '../models/settingsModel.js';

export const settingsController = {
  getPublicAdSense(_req, res) {
    const settings = settingsModel.getAdSenseSettings();
    res.json(settings);
  },

  getAdminAdSense(_req, res) {
    const settings = settingsModel.getAdSenseSettings();
    const adsTxtContent = settingsModel.getAdsTxtContent();
    res.json({
      ...settings,
      adsTxtContent,
    });
  },

  updateAdSense(req, res) {
    const { enabled, clientId, testMode, slotHeader, slotInFeed, slotPlayerBottom } = req.body || {};
    const updated = settingsModel.updateAdSenseSettings({
      enabled,
      clientId,
      testMode,
      slotHeader,
      slotInFeed,
      slotPlayerBottom,
    });
    res.json({
      message: 'Google AdSense settings updated successfully',
      settings: updated,
    });
  },

  serveAdsTxt(_req, res) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(settingsModel.getAdsTxtContent());
  },
};

import { api } from './api';
import type { AdSenseSettings } from '../types';

export const adsenseService = {
  async getPublicSettings(): Promise<AdSenseSettings> {
    const { data } = await api.get<AdSenseSettings>('/settings/adsense');
    return data;
  },

  async getAdminSettings(): Promise<AdSenseSettings> {
    const { data } = await api.get<AdSenseSettings>('/admin/settings/adsense');
    return data;
  },

  async updateSettings(payload: Partial<AdSenseSettings>): Promise<AdSenseSettings> {
    const { data } = await api.put<{ message: string; settings: AdSenseSettings }>(
      '/admin/settings/adsense',
      payload
    );
    return data.settings;
  },
};

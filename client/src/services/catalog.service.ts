import { api } from './api';
import type {
  Admin,
  Category,
  ContentKind,
  DashboardStats,
  Genre,
  HomeData,
  Paginated,
  RecentContent,
  SearchSuggestion,
  Content,
  WatchData,
} from '../types';
import type { QueryParams } from './content.service';

export const catalogService = {
  async home(): Promise<HomeData> {
    const { data } = await api.get('/home');
    return data;
  },

  async search(params: QueryParams): Promise<Paginated<Content>> {
    const { data } = await api.get('/search', { params });
    return data;
  },

  async suggestions(q: string): Promise<SearchSuggestion[]> {
    const { data } = await api.get('/search/suggestions', { params: { q } });
    return data.items;
  },

  async watch(
    kind: 'series' | 'tv_show' | 'anime',
    slug: string,
    seasonNumber: number,
    episodeNumber: number
  ): Promise<WatchData> {
    const section = kind === 'series' ? 'series' : kind === 'tv_show' ? 'tv-shows' : 'anime';
    const { data } = await api.get(
      `/watch/${section}/${slug}/season/${seasonNumber}/episode/${episodeNumber}`
    );
    return data;
  },
};

export const taxonomyService = {
  async categories(contentType?: string): Promise<Category[]> {
    const { data } = await api.get('/categories', {
      params: contentType ? { content_type: contentType } : {},
    });
    return data.items;
  },
  async createCategory(payload: { name: string; content_type: string }): Promise<Category> {
    const { data } = await api.post('/categories', payload);
    return data.category;
  },
  async updateCategory(id: number, payload: { name: string; content_type: string }): Promise<Category> {
    const { data } = await api.put(`/categories/${id}`, payload);
    return data.category;
  },
  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
  async genres(): Promise<Genre[]> {
    const { data } = await api.get('/genres');
    return data.items;
  },
  async createGenre(payload: { name: string }): Promise<Genre> {
    const { data } = await api.post('/genres', payload);
    return data.genre;
  },
  async updateGenre(id: number, payload: { name: string }): Promise<Genre> {
    const { data } = await api.put(`/genres/${id}`, payload);
    return data.genre;
  },
  async deleteGenre(id: number): Promise<void> {
    await api.delete(`/genres/${id}`);
  },
};

export const authService = {
  async login(username: string, password: string): Promise<Admin> {
    const { data } = await api.post('/auth/login', { username, password });
    return data.admin;
  },
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
  async me(): Promise<Admin> {
    const { data } = await api.get('/auth/me');
    return data.admin;
  },
  async updateCredentials(payload: {
    current_password: string;
    username?: string;
    password?: string;
  }): Promise<Admin> {
    const { data } = await api.put('/auth/credentials', payload);
    return data.admin;
  },
};

export const dashboardService = {
  async stats(): Promise<DashboardStats> {
    const { data } = await api.get('/admin/dashboard/stats');
    return data;
  },
  async recent(): Promise<RecentContent> {
    const { data } = await api.get('/admin/dashboard/recent-content');
    return data;
  },
};

export type { ContentKind, HomeData, DashboardStats };

import { api } from './api';
import type {
  Content,
  ContentDetailResponse,
  ContentListResponse,
  Facets,
  Paginated,
  Section,
  TitleSummary,
} from '../types';

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

export interface ContentPayload {
  title?: string;
  poster?: string;
  trailer?: string;
  description?: string;
  story?: string;
  category_id?: number | null;
  genres?: string[];
  quality?: string;
  language?: string;
  country?: string;
  year?: number | null;
  duration?: string;
  movie_video?: string;
  series_url?: string;
  status?: 'published' | 'draft';
}

export const contentService = {
  async list(section: Section, params: QueryParams = {}): Promise<ContentListResponse> {
    const { data } = await api.get(`/${section}`, { params });
    return data;
  },

  async facets(section: Section, includeDrafts = false): Promise<Facets> {
    const { data } = await api.get(`/${section}/facets`, { params: { includeDrafts } });
    return data.data;
  },

  async detail(section: Section, idOrSlug: string | number): Promise<ContentDetailResponse> {
    const { data } = await api.get(`/${section}/${idOrSlug}`);
    return data;
  },

  async create(section: Section, payload: ContentPayload): Promise<Content> {
    const { data } = await api.post(`/${section}`, payload);
    return data.content;
  },

  async update(section: Section, id: number, payload: ContentPayload): Promise<Content> {
    const { data } = await api.put(`/${section}/${id}`, payload);
    return data.content;
  },

  async remove(section: Section, id: number): Promise<void> {
    await api.delete(`/${section}/${id}`);
  },

  async setStatus(section: Section, id: number, status: 'published' | 'draft'): Promise<Content> {
    const { data } = await api.patch(`/${section}/${id}/status`, { status });
    return data.content;
  },

  async titles(section: Section, q = '', limit = 40): Promise<TitleSummary[]> {
    const { data } = await api.get(`/${section}/titles`, { params: { q, limit } });
    return data.items;
  },
};

export interface SeasonPayload {
  title?: string;
  season_number?: number;
  poster?: string;
  trailer?: string;
  description?: string;
  story?: string;
  category_id?: number | null;
  genres?: string[];
  language?: string;
  country?: string;
  year?: number | null;
}

export const seasonService = {
  async list(section: Section, contentId: number, includeEpisodes = false) {
    const { data } = await api.get(`/${section}/${contentId}/seasons`, {
      params: includeEpisodes ? { include: 'episodes' } : {},
    });
    return data.items;
  },
  async create(section: Section, contentId: number, payload: SeasonPayload) {
    const { data } = await api.post(`/${section}/${contentId}/seasons`, payload);
    return data.season;
  },
  async update(section: Section, contentId: number, seasonId: number, payload: SeasonPayload) {
    const { data } = await api.put(`/${section}/${contentId}/seasons/${seasonId}`, payload);
    return data.season;
  },
  async remove(section: Section, contentId: number, seasonId: number) {
    await api.delete(`/${section}/${contentId}/seasons/${seasonId}`);
  },
};

export interface EpisodePayload {
  title?: string;
  episode_number?: number;
  quality?: string;
  duration?: string;
  episode_url?: string;
  episode_video?: string;
}

export const episodeService = {
  async list(section: Section, contentId: number, seasonId: number) {
    const { data } = await api.get(`/${section}/${contentId}/seasons/${seasonId}/episodes`);
    return data.items;
  },
  async create(section: Section, contentId: number, seasonId: number, payload: EpisodePayload) {
    const { data } = await api.post(`/${section}/${contentId}/seasons/${seasonId}/episodes`, payload);
    return data.episode;
  },
  async update(
    section: Section,
    contentId: number,
    seasonId: number,
    episodeId: number,
    payload: EpisodePayload
  ) {
    const { data } = await api.put(
      `/${section}/${contentId}/seasons/${seasonId}/episodes/${episodeId}`,
      payload
    );
    return data.episode;
  },
  async remove(section: Section, contentId: number, seasonId: number, episodeId: number) {
    await api.delete(`/${section}/${contentId}/seasons/${seasonId}/episodes/${episodeId}`);
  },
  async move(
    section: Section,
    contentId: number,
    seasonId: number,
    episodeId: number,
    direction: 'up' | 'down'
  ) {
    const { data } = await api.post(
      `/${section}/${contentId}/seasons/${seasonId}/episodes/${episodeId}/move`,
      { direction }
    );
    return data.episode;
  },
};

export type { Content, Paginated };

import { api } from './api';
import type { Content } from '../types';

export interface CommentItem {
  id: number;
  content_type: string;
  content_id: number;
  author_name: string;
  text: string;
  is_spoiler: number;
  created_at: string;
}

export interface ReactionsState {
  counts: {
    fire: number;
    mindblown: number;
    popcorn: number;
    heart: number;
    laugh: number;
  };
  userReaction: string | null;
}

// Generate or retrieve persistent browser client id for reaction voting
export function getClientId(): string {
  let id = localStorage.getItem('f2w_client_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('f2w_client_id', id);
  }
  return id;
}

export const communityService = {
  async getComments(contentType: string, contentId: number): Promise<CommentItem[]> {
    const res = await api.get<{ comments: CommentItem[] }>(
      `/community/comments/${contentType}/${contentId}`
    );
    return res.data.comments;
  },

  async addComment(
    contentType: string,
    contentId: number,
    text: string,
    authorName?: string,
    isSpoiler = false
  ): Promise<CommentItem> {
    const res = await api.post<{ comment: CommentItem }>('/community/comments', {
      contentType,
      contentId,
      text,
      authorName,
      isSpoiler,
    });
    return res.data.comment;
  },

  async getReactions(contentType: string, contentId: number): Promise<ReactionsState> {
    const clientId = getClientId();
    const res = await api.get<ReactionsState>(
      `/community/reactions/${contentType}/${contentId}?clientId=${encodeURIComponent(clientId)}`
    );
    return res.data;
  },

  async toggleReaction(
    contentType: string,
    contentId: number,
    reaction: string
  ): Promise<ReactionsState> {
    const clientId = getClientId();
    const res = await api.post<ReactionsState>('/community/reactions', {
      contentType,
      contentId,
      reaction,
      clientId,
    });
    return res.data;
  },

  async submitRequest(data: {
    title: string;
    contentType?: string;
    year?: string;
    notes?: string;
    email?: string;
  }): Promise<{ success: boolean; id: number }> {
    const res = await api.post<{ success: boolean; id: number }>('/community/requests', data);
    return res.data;
  },

  async submitReport(data: {
    contentType: string;
    contentId: number;
    contentTitle?: string;
    serverName?: string;
    issueType: string;
    notes?: string;
  }): Promise<{ success: boolean; id: number }> {
    const res = await api.post<{ success: boolean; id: number }>('/community/reports', data);
    return res.data;
  },

  async getRandomTitle(type?: string, genre?: string): Promise<Content> {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (genre) params.set('genre', genre);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get<{ title: Content }>(`/community/random${qs}`);
    return res.data.title;
  },
};

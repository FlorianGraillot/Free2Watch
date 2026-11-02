import type { Content, ContentKind } from '../types';

export interface WatchProgressItem {
  id: number;
  slug: string;
  title: string;
  poster: string;
  kind: ContentKind;
  progressPercent: number;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  updatedAt: number;
}

export interface WatchlistItem {
  id: number;
  slug: string;
  title: string;
  poster: string;
  kind: ContentKind;
  year?: number | null;
  quality?: string | null;
  category_name?: string | null;
  addedAt: number;
}

const WATCHLIST_KEY = 'f2w_vip_watchlist';
const PROGRESS_KEY = 'f2w_continue_watching';
const THEATER_KEY = 'f2w_theater_mode';

export const userPreferences = {
  // Watchlist
  getWatchlist(): WatchlistItem[] {
    try {
      const raw = localStorage.getItem(WATCHLIST_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  isInWatchlist(id: number, kind: ContentKind = 'movie'): boolean {
    const list = this.getWatchlist();
    return list.some((item) => item.id === id && item.kind === kind);
  },

  toggleWatchlist(content: Content, defaultKind?: ContentKind): boolean {
    const list = this.getWatchlist();
    const kind = content.content_type ?? defaultKind ?? 'movie';
    const index = list.findIndex((item) => item.id === content.id && item.kind === kind);

    if (index >= 0) {
      list.splice(index, 1);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('f2w:watchlist-updated', { detail: { count: list.length } }));
      return false; // Removed
    } else {
      const newItem: WatchlistItem = {
        id: content.id,
        slug: content.slug,
        title: content.title,
        poster: content.poster,
        kind,
        year: content.year,
        quality: content.quality,
        category_name: content.category_name,
        addedAt: Date.now(),
      };
      list.unshift(newItem);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list.slice(0, 50)));
      window.dispatchEvent(new CustomEvent('f2w:watchlist-updated', { detail: { count: list.length } }));
      return true; // Added
    }
  },

  removeFromWatchlist(id: number, kind: ContentKind): void {
    const list = this.getWatchlist().filter((item) => !(item.id === id && item.kind === kind));
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('f2w:watchlist-updated', { detail: { count: list.length } }));
  },

  // Continue Watching
  getContinueWatching(): WatchProgressItem[] {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  recordWatch(item: Omit<WatchProgressItem, 'updatedAt'>): void {
    try {
      const list = this.getContinueWatching().filter(
        (i) => !(i.id === item.id && i.kind === item.kind)
      );
      list.unshift({ ...item, updatedAt: Date.now() });
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(list.slice(0, 15)));
      window.dispatchEvent(new CustomEvent('f2w:progress-updated'));
    } catch {
      // Ignore localStorage quotas
    }
  },

  removeProgress(id: number, kind: ContentKind): void {
    const list = this.getContinueWatching().filter((i) => !(i.id === id && i.kind === kind));
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('f2w:progress-updated'));
  },

  // Theater Mode
  getTheaterMode(): boolean {
    return localStorage.getItem(THEATER_KEY) === 'true';
  },

  setTheaterMode(enabled: boolean): void {
    localStorage.setItem(THEATER_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent('f2w:theater-mode', { detail: { enabled } }));
  },
};

export type ContentKind = 'movie' | 'series' | 'tv_show' | 'anime';
export type Section = 'movies' | 'series' | 'tv-shows' | 'anime';
export type ContentStatus = 'published' | 'draft';
export type ContentTypeParam = 'movie' | 'series' | 'tv_show' | 'anime';

export interface Content {
  id: number;
  title: string;
  slug: string;
  poster: string;
  trailer: string;
  description: string;
  story: string;
  category_id: number | null;
  category_name?: string | null;
  category_slug?: string | null;
  genres: string[];
  quality?: string | null;
  language: string;
  country: string;
  year: number | null;
  duration?: string | null;
  movie_video?: string | null;
  series_url?: string | null;
  status: ContentStatus;
  content_type?: ContentKind;
  route?: string;
  season_count?: number;
  episode_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: number;
  season_id: number;
  title: string;
  episode_number: number;
  quality: string | null;
  duration: string | null;
  episode_url: string | null;
  episode_video: string | null;
  created_at: string;
  updated_at: string;
}

export interface Season {
  id: number;
  content_type: 'series' | 'tv_show' | 'anime';
  content_id: number;
  title: string;
  season_number: number;
  poster: string | null;
  trailer: string | null;
  description: string | null;
  story: string | null;
  category_id: number | null;
  category_name?: string | null;
  category_slug?: string | null;
  genres: string[];
  language: string | null;
  country: string | null;
  year: number | null;
  episode_count?: number;
  episodes?: Episode[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  content_type: ContentTypeParam;
  item_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
  item_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Admin {
  id: number;
  username: string;
  created_at?: string;
  updated_at?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface ContentListResponse extends Paginated<Content> {}

export interface ContentDetailResponse {
  content: Content;
  seasons: Season[];
}

export interface Facets {
  years: number[];
  languages: string[];
  countries: string[];
  qualities: string[];
}

export interface HomeData {
  hero: Content[];
  trending: Content[];
  recommended: Content[];
  latest: {
    movies: Content[];
    series: Content[];
    tvShows: Content[];
    anime: Content[];
  };
  categories: Category[];
}

export interface DashboardStats {
  stats: {
    movies: number;
    moviesPublished: number;
    series: number;
    seriesPublished: number;
    tvShows: number;
    tvShowsPublished: number;
    anime: number;
    animePublished: number;
    seasons: number;
    episodes: number;
    categories: number;
    genres: number;
  };
  distribution: { type: string; published: number; drafts: number }[];
  categoryBreakdown: { id: number; name: string; content_type: ContentTypeParam; item_count: number }[];
}

export interface RecentContent {
  movies: Content[];
  series: Content[];
  tvShows: Content[];
  anime: Content[];
  episodes: (Episode & {
    season_id: number;
    season_title: string;
    season_number: number;
    content_type: 'series' | 'tv_show' | 'anime';
    content_id: number;
    parent_title: string | null;
  })[];
}

export interface WatchData {
  content: Content;
  season: Season;
  episode: Episode;
  episodes: Episode[];
  previous: Episode | null;
  next: Episode | null;
}

export interface TitleSummary {
  id: number;
  title: string;
  slug: string;
  poster: string;
  year: number | null;
  status: ContentStatus;
  season_count: number;
  episode_count: number;
}

export interface SearchSuggestion {
  id: number;
  title: string;
  slug: string;
  poster: string;
  year: number | null;
  content_type: ContentKind;
  route: string;
}

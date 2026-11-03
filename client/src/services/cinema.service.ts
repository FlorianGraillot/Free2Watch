import { api } from './api';

export interface TheatricalMovie {
  id: number;
  tmdb_id: number;
  title: string;
  tagline?: string;
  overview: string;
  poster_path: string;
  backdrop_path?: string;
  release_date: string;
  runtime?: string;
  vote_average: number;
  vote_count: number;
  certification?: string;
  genres: string[];
  director?: string;
  cast: string[];
  trailer_url?: string;
  box_office?: string;
  status?: string;
  is_on_free2watch?: boolean;
  free2watch_slug?: string | null;
}

export interface InTheatresResponse {
  items: TheatricalMovie[];
  source: string;
  total: number;
  updated_at: string;
}

export const cinemaService = {
  async getInTheatres(): Promise<InTheatresResponse> {
    const res = await api.get<InTheatresResponse>('/cinema/in-theatres');
    return res.data;
  },

  async getMovieDetails(id: number | string): Promise<{ movie: TheatricalMovie }> {
    const res = await api.get<{ movie: TheatricalMovie }>(`/cinema/movie/${id}`);
    return res.data;
  },
};

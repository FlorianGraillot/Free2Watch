export const ROUTE_TO_KIND = {
  movies: 'movie',
  series: 'series',
  'tv-shows': 'tv_show',
  anime: 'anime',
};

export const KIND_TO_ROUTE = {
  movie: 'movie',
  series: 'series',
  tv_show: 'tv-show',
  anime: 'anime',
};

export const KIND_TO_SECTION = {
  movie: 'movies',
  series: 'series',
  tv_show: 'tv-shows',
  anime: 'anime',
};

export const EPISODIC_ROUTE_TO_KIND = {
  series: 'series',
  'tv-shows': 'tv_show',
  anime: 'anime',
};

export function kindFromRoute(route) {
  return ROUTE_TO_KIND[route] ?? null;
}

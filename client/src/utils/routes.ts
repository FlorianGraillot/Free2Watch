import type { Content, ContentKind, Section } from '../types';

interface SectionMeta {
  label: string;
  singular: string;
  kind: ContentKind;
  /** Public route prefix, e.g. /movies or /series */
  basePath: string;
  /** Details route prefix, e.g. /movie or /series */
  detailBase: string;
  adminPath: string;
  apiPath: string;
}

export const SECTIONS: Record<Section, SectionMeta> = {
  movies: {
    label: 'Movies',
    singular: 'Movie',
    kind: 'movie',
    basePath: '/movies',
    detailBase: '/movie',
    adminPath: '/admin/movies',
    apiPath: '/movies',
  },
  series: {
    label: 'TV Series',
    singular: 'TV Series',
    kind: 'series',
    basePath: '/series',
    detailBase: '/series',
    adminPath: '/admin/series',
    apiPath: '/series',
  },
  'tv-shows': {
    label: 'TV Shows',
    singular: 'TV Show',
    kind: 'tv_show',
    basePath: '/tv-shows',
    detailBase: '/tv-show',
    adminPath: '/admin/tv-shows',
    apiPath: '/tv-shows',
  },
  anime: {
    label: 'Anime',
    singular: 'Anime',
    kind: 'anime',
    basePath: '/anime',
    detailBase: '/anime',
    adminPath: '/admin/anime',
    apiPath: '/anime',
  },
};

export const SECTION_ORDER: Section[] = ['movies', 'series', 'tv-shows', 'anime'];

export function sectionForKind(kind: ContentKind): Section {
  switch (kind) {
    case 'movie':
      return 'movies';
    case 'series':
      return 'series';
    case 'tv_show':
      return 'tv-shows';
    case 'anime':
      return 'anime';
    default:
      return 'movies';
  }
}

const KIND_LABEL: Record<ContentKind, string> = {
  movie: 'Movie',
  series: 'TV Series',
  tv_show: 'TV Show',
  anime: 'Anime',
};

export function kindLabel(kind: ContentKind): string {
  return KIND_LABEL[kind] ?? 'Content';
}

/** Resolves the public details URL for any content item. */
export function contentPath(item: Pick<Content, 'content_type' | 'slug'>): string {
  const kind = item.content_type ?? 'movie';
  return `${SECTIONS[sectionForKind(kind)].detailBase}/${item.slug}`;
}

export function categoryPath(kind: ContentKind, slug: string): string {
  return `${SECTIONS[sectionForKind(kind)].basePath}/category/${slug}`;
}

export function episodePath(
  kind: ContentKind,
  slug: string,
  seasonNumber: number,
  episodeNumber: number
): string {
  return `${SECTIONS[sectionForKind(kind)].detailBase}/${slug}/season/${seasonNumber}/episode/${episodeNumber}`;
}

export function adminEditPath(kind: ContentKind, id: number): string {
  return `${SECTIONS[sectionForKind(kind)].adminPath}/${id}/edit`;
}

export function adminManagePath(kind: ContentKind, id: number): string {
  return `${SECTIONS[sectionForKind(kind)].adminPath}/${id}/manage`;
}

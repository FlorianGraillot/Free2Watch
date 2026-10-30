import { slugify } from '../utils/slugify.js';

/** Initial taxonomy requested by the FREE2WATCH specification. */
export const DEFAULT_CATEGORIES = {
  movie: [
    'English Movies',
    'Korean Movies',
    'Arabic Movies',
    'Japanese Movies',
    'Indian Movies',
    'Turkish Movies',
    'Chinese Movies',
    'French Movies',
    'Cartoon Movies',
    'Other Movies',
  ],
  series: [
    'Arabic Series',
    'Korean Series',
    'Japanese Series',
    'Turkish Series',
    'English Series',
    'Indian Series',
    'Chinese Series',
    'Other Series',
  ],
  tv_show: [
    'Arabic TV Shows',
    'Korean TV Shows',
    'English TV Shows',
    'Japanese TV Shows',
    'Other TV Shows',
  ],
  anime: [
    'Japanese Anime',
    'Chinese Anime',
    'Korean Anime',
    'Dubbed Anime',
    'Subtitled Anime',
    'Cartoon Anime',
    'Other Anime',
  ],
};

export const DEFAULT_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'History',
  'Horror',
  'Music',
  'Mystery',
  'Reality',
  'Romance',
  'Sci-Fi',
  'Sport',
  'Thriller',
  'War',
  'Western',
];

/**
 * Seeds the initial categories and genres once. It never deletes or overwrites
 * categories or genres created later by the administrator.
 */
export function seedReferenceData(db) {
  const insertCategory = db.prepare(
    'INSERT OR IGNORE INTO categories (name, slug, content_type) VALUES (?, ?, ?)'
  );
  const insertGenre = db.prepare('INSERT OR IGNORE INTO genres (name, slug) VALUES (?, ?)');

  const seed = db.transaction(() => {
    for (const [contentType, names] of Object.entries(DEFAULT_CATEGORIES)) {
      for (const name of names) {
        insertCategory.run(name, slugify(name), contentType);
      }
    }
    for (const name of DEFAULT_GENRES) {
      insertGenre.run(name, slugify(name));
    }
  });

  seed();
}

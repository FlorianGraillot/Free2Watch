/**
 * Seeds a small, fully functional demo catalogue (open Blender movies) so the
 * platform can be tested end-to-end. All rows are written through the same
 * models used by the API and stored in SQLite.
 *
 * Run with: npm run seed  (from the project root)
 */
import fs from 'node:fs';
import path from 'node:path';
import { initializeDatabase } from '../database/initialize.js';
import { getDb, closeDb } from '../database/connection.js';
import { createContent } from '../models/contentModel.js';
import { seasonModel } from '../models/seasonModel.js';
import { episodeModel } from '../models/episodeModel.js';
import { serverRoot } from '../config/env.js';

const posterDir = path.resolve(serverRoot, '../client/public/assets/demo');

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapTitle(title, maxChars = 13) {
  const words = title.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

function makePoster({ slug, title, year, kicker, from, via, to }) {
  const lines = wrapTitle(title);
  const lineHeight = 74;
  const startY = 660 - (lines.length - 1) * lineHeight;
  const titleSvg = lines
    .map(
      (line, index) =>
        `<text x="48" y="${startY + index * lineHeight}" font-family="Arial Black, Arial, sans-serif" font-size="62" font-weight="900" fill="#ffffff" letter-spacing="-1">${escapeXml(line)}</text>`
    )
    .join('\n  ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="52%" stop-color="${via}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="glow" cx="72%" cy="20%" r="62%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="45%" stop-color="#05060a" stop-opacity="0"/>
      <stop offset="100%" stop-color="#05060a" stop-opacity="0.94"/>
    </linearGradient>
    <pattern id="grain" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.8" fill="#ffffff" opacity="0.06"/>
      <circle cx="4" cy="4" r="0.6" fill="#000000" opacity="0.12"/>
    </pattern>
  </defs>
  <rect width="600" height="900" fill="url(#bg)"/>
  <rect width="600" height="900" fill="url(#glow)"/>
  <rect width="600" height="900" fill="url(#grain)"/>
  <g opacity="0.22" fill="#ffffff">
    <rect x="458" y="70" width="24" height="24" rx="4"/>
    <rect x="498" y="70" width="24" height="24" rx="4"/>
    <rect x="538" y="70" width="24" height="24" rx="4"/>
    <rect x="458" y="112" width="24" height="24" rx="4"/>
    <rect x="498" y="112" width="24" height="24" rx="4"/>
    <rect x="538" y="112" width="24" height="24" rx="4"/>
  </g>
  <circle cx="300" cy="320" r="118" fill="none" stroke="#ffffff" stroke-opacity="0.28" stroke-width="2"/>
  <circle cx="300" cy="320" r="86" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="1"/>
  <polygon points="278,276 278,364 354,320" fill="#ffffff" fill-opacity="0.85"/>
  <rect width="600" height="900" fill="url(#shade)"/>
  <text x="48" y="86" font-family="Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="5" fill="#ffffff" fill-opacity="0.82">${escapeXml(kicker.toUpperCase())}</text>
  <rect x="48" y="104" width="56" height="4" rx="2" fill="#e11d2e"/>
  <text x="48" y="150" font-family="Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="4" fill="#ffffff" fill-opacity="0.55">FREE2WATCH</text>
  ${titleSvg}
  <text x="50" y="812" font-family="Arial, sans-serif" font-size="20" font-weight="600" letter-spacing="2" fill="#ffffff" fill-opacity="0.72">${year} &#183; FREE2WATCH ORIGINAL</text>
  <rect x="48" y="846" width="504" height="1" fill="#ffffff" fill-opacity="0.2"/>
</svg>`;

  fs.mkdirSync(posterDir, { recursive: true });
  fs.writeFileSync(path.join(posterDir, `${slug}.svg`), svg, 'utf8');
  return `/assets/demo/${slug}.svg`;
}

const TRAILERS = {
  bunny: 'https://www.youtube.com/embed/YE7VzlLtp-4',
  sintel: 'https://www.youtube.com/embed/eRsGyueVLvQ',
  steel: 'https://www.youtube.com/embed/R6MlUcmOul8',
  dream: 'https://www.youtube.com/embed/TLkA0RELQ1g',
  cosmos: 'https://www.youtube.com/embed/Y-rmzh0PI3c',
  spring: 'https://www.youtube.com/embed/WhWc3b3KhnY',
};

function categoryId(db, contentType, name) {
  const row = db
    .prepare('SELECT id FROM categories WHERE content_type = ? AND name = ?')
    .get(contentType, name);
  if (!row) throw new Error(`Seed category not found: ${contentType}/${name}`);
  return row.id;
}

const MOVIES = [
  {
    slug: 'big-buck-bunny',
    title: 'Big Buck Bunny',
    category: 'English Movies',
    genres: ['Animation', 'Comedy', 'Family'],
    description:
      'A gentle giant rabbit decides to teach three bullying rodents a lesson in this landmark open movie.',
    story:
      'Big Buck Bunny lives a peaceful life in the forest until three troublemaking rodents begin tormenting the woodland creatures. When his patience finally runs out, the gentle bunny sets an elaborate and hilarious trap.',
    quality: 'WEB-DL',
    language: 'English',
    country: 'United States',
    year: 2008,
    duration: '10 min',
    video: TRAILERS.bunny,
    kicker: 'Open Cinema',
    palette: ['#1d4d2b', '#2f7d3f', '#0b2312'],
  },
  {
    slug: 'sintel',
    title: 'Sintel',
    category: 'Other Movies',
    genres: ['Animation', 'Fantasy', 'Adventure'],
    description:
      'A lonely wanderer crosses a harsh world to reunite with the dragon she once raised.',
    story:
      'Sintel rescues an injured baby dragon and nurses it back to health, but the creature is taken from her. Years of searching lead her across deserts and mountains, toward a reunion that changes everything.',
    quality: 'BluRay',
    language: 'English',
    country: 'Netherlands',
    year: 2010,
    duration: '15 min',
    video: TRAILERS.sintel,
    kicker: 'Fantasy',
    palette: ['#3a1d4d', '#6b2f7d', '#170b23'],
  },
  {
    slug: 'tears-of-steel',
    title: 'Tears of Steel',
    category: 'Other Movies',
    genres: ['Sci-Fi', 'Action', 'Drama'],
    description:
      'In a ruined future, a team of scientists tries to undo the robot uprising by repairing one broken memory.',
    story:
      'Amsterdam lies in ruins after machines turned against humanity. A small group of scientists brings the man who caused the disaster back to the exact moment everything went wrong, hoping love can rewrite history.',
    quality: '4K',
    language: 'English',
    country: 'Netherlands',
    year: 2012,
    duration: '12 min',
    video: TRAILERS.steel,
    kicker: 'Sci-Fi',
    palette: ['#2b2f3a', '#46506b', '#0c0e14'],
  },
  {
    slug: 'elephants-dream',
    title: 'Elephants Dream',
    category: 'Other Movies',
    genres: ['Animation', 'Sci-Fi', 'Mystery'],
    description:
      'Two travellers explore a vast mechanical world that may be a dream, a machine, or both.',
    story:
      'Proog guides the young Emo through an endless industrial labyrinth, insisting it is a beautiful machine. Emo sees only danger and begins to question the reality his mentor has built around him.',
    quality: 'BluRay',
    language: 'English',
    country: 'Netherlands',
    year: 2006,
    duration: '11 min',
    video: TRAILERS.dream,
    kicker: 'Cult Classic',
    palette: ['#4d2a1d', '#7d4a2f', '#23110b'],
  },
  {
    slug: 'cosmos-laundromat',
    title: 'Cosmos Laundromat',
    category: 'Cartoon Movies',
    genres: ['Animation', 'Comedy', 'Fantasy'],
    description:
      'A suicidal sheep meets a mysterious salesman who offers him infinite lives on a hundred different worlds.',
    story:
      'Franck the sheep has had enough of his island existence. When a strange salesman arrives with a device that promises endless new lives, Franck must decide whether infinity is a gift or another trap.',
    quality: 'WEB-DL',
    language: 'English',
    country: 'Netherlands',
    year: 2015,
    duration: '12 min',
    video: TRAILERS.cosmos,
    kicker: 'Comedy',
    palette: ['#1d3a4d', '#2f6a7d', '#0b1c23'],
  },
  {
    slug: 'spring',
    title: 'Spring',
    category: 'Cartoon Movies',
    genres: ['Animation', 'Fantasy', 'Family'],
    description:
      'A young shepherd and her dog confront ancient spirits to bring the season back to life.',
    story:
      'High in the mountains, a shepherd girl guards the cycle of the seasons. When the spirits of winter refuse to release the world, she and her faithful dog must find the courage to face them.',
    quality: 'WEB-DL',
    language: 'English',
    country: 'Netherlands',
    year: 2019,
    duration: '8 min',
    video: TRAILERS.spring,
    kicker: 'Family',
    palette: ['#2f4d1d', '#6a7d2f', '#141f0b'],
  },
];

const EPISODIC = [
  {
    kind: 'series',
    slug: 'neon-horizons',
    title: 'Neon Horizons',
    category: 'English Series',
    genres: ['Drama', 'Sci-Fi', 'Thriller'],
    description:
      'A detective in a rain-soaked megacity uncovers a conspiracy hidden inside the city’s dream network.',
    story:
      'Detective Mara Voss investigates a disappearance that leads her into the shared dream network keeping the city awake. Every clue takes her further from the truth — and closer to the architect of the network.',
    language: 'English',
    country: 'United States',
    year: 2024,
    seasons: [
      { number: 1, episodes: 3 },
      { number: 2, episodes: 3 },
    ],
    videokeys: ['steel', 'cosmos', 'dream'],
    kicker: 'Original Series',
    palette: ['#1a1f4d', '#3a2f8a', '#080a1f'],
  },
  {
    kind: 'tv_show',
    slug: 'the-midnight-kitchen',
    title: 'The Midnight Kitchen',
    category: 'English TV Shows',
    genres: ['Comedy', 'Family', 'Reality'],
    description:
      'Four night-shift cooks turn a tiny diner into the most talked-about table in the city.',
    story:
      'After midnight, the diner belongs to the staff. Between impossible orders, eccentric regulars and a rivalry with the restaurant across the street, every shift becomes a small adventure.',
    language: 'English',
    country: 'United Kingdom',
    year: 2023,
    seasons: [{ number: 1, episodes: 4 }],
    videokeys: ['bunny', 'spring', 'cosmos', 'dream'],
    kicker: 'TV Show',
    palette: ['#4d1d1d', '#8a2f2f', '#1f0808'],
  },
  {
    kind: 'anime',
    slug: 'sintel-chronicles',
    title: 'Sintel Chronicles',
    category: 'Japanese Anime',
    genres: ['Animation', 'Fantasy', 'Adventure'],
    description:
      'The wanderer’s journey expands into a full saga of dragons, lost cities and impossible promises.',
    story:
      'Bound to a dragon she raised as her own, Sintel travels through realms that remember every promise she has broken. Each season follows a new chapter of her search for home.',
    language: 'Japanese',
    country: 'Japan',
    year: 2021,
    seasons: [
      { number: 1, episodes: 3 },
      { number: 2, episodes: 2 },
    ],
    videokeys: ['sintel', 'dream', 'spring'],
    kicker: 'Anime',
    palette: ['#4d1d3a', '#8a2f6b', '#1f0b17'],
  },
  {
    kind: 'anime',
    slug: 'spring-tales',
    title: 'Spring Tales',
    category: 'Chinese Anime',
    genres: ['Animation', 'Fantasy', 'Family'],
    description:
      'Short, luminous stories about the spirits that guide the changing seasons.',
    story:
      'Each episode follows a different mountain spirit as winter gives way to spring. Gentle, hand-crafted tales about nature, memory and the courage to begin again.',
    language: 'Chinese',
    country: 'China',
    year: 2022,
    seasons: [{ number: 1, episodes: 2 }],
    videokeys: ['spring', 'cosmos'],
    kicker: 'Anime',
    palette: ['#1d4d3f', '#2f8a6f', '#0b1f19'],
  },
];

function seed() {
  const db = initializeDatabase();
  const existing = db.prepare('SELECT COUNT(*) AS count FROM movies').get().count;

  if (existing > 0) {
    console.log('[seed] content already exists — skipping demo seed (delete the database to reseed).');
    closeDb();
    return;
  }

  const insert = db.transaction(() => {
    for (const movie of MOVIES) {
      const poster = makePoster({
        slug: movie.slug,
        title: movie.title,
        year: movie.year,
        kicker: movie.kicker,
        from: movie.palette[0],
        via: movie.palette[1],
        to: movie.palette[2],
      });

      createContent('movie', {
        title: movie.title,
        slug: movie.slug,
        poster,
        trailer: movie.video,
        description: movie.description,
        story: movie.story,
        category_id: categoryId(db, 'movie', movie.category),
        genres: movie.genres,
        quality: movie.quality,
        language: movie.language,
        country: movie.country,
        year: movie.year,
        duration: movie.duration,
        movie_video: movie.video,
        status: 'published',
      });
      console.log(`[seed] movie: ${movie.title}`);
    }

    for (const entry of EPISODIC) {
      const poster = makePoster({
        slug: entry.slug,
        title: entry.title,
        year: entry.year,
        kicker: entry.kicker,
        from: entry.palette[0],
        via: entry.palette[1],
        to: entry.palette[2],
      });

      const content = createContent(entry.kind, {
        title: entry.title,
        slug: entry.slug,
        poster,
        trailer: TRAILERS[entry.videokeys[0]],
        description: entry.description,
        story: entry.story,
        category_id: categoryId(db, entry.kind, entry.category),
        genres: entry.genres,
        language: entry.language,
        country: entry.country,
        year: entry.year,
        status: 'published',
      });

      console.log(`[seed] ${entry.kind}: ${entry.title}`);

      entry.seasons.forEach((seasonDef) => {
        const season = seasonModel.create(entry.kind, content.id, {
          title: `Season ${seasonDef.number}`,
          season_number: seasonDef.number,
          description: `${entry.title} — Season ${seasonDef.number}`,
          story: entry.story,
          category_id: content.category_id,
          genres: entry.genres,
          language: entry.language,
          country: entry.country,
          year: entry.year,
        });

        for (let index = 1; index <= seasonDef.episodes; index += 1) {
          const videoKey = entry.videokeys[(index - 1) % entry.videokeys.length];
          episodeModel.create(entry.kind, content.id, season.id, {
            title: `Episode ${index}`,
            episode_number: index,
            quality: 'WEB-DL',
            duration: '12 min',
            episode_url: '',
            episode_video: TRAILERS[videoKey],
          });
        }
      });
    }
  });

  insert();

  const counts = {
    movies: db.prepare('SELECT COUNT(*) AS c FROM movies').get().c,
    series: db.prepare('SELECT COUNT(*) AS c FROM series').get().c,
    tvShows: db.prepare('SELECT COUNT(*) AS c FROM tv_shows').get().c,
    anime: db.prepare('SELECT COUNT(*) AS c FROM anime').get().c,
    seasons: db.prepare('SELECT COUNT(*) AS c FROM seasons').get().c,
    episodes: db.prepare('SELECT COUNT(*) AS c FROM episodes').get().c,
  };

  console.log('[seed] done:', counts);
  closeDb();
}

seed();

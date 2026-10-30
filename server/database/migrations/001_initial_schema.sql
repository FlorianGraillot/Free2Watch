-- FREE2WATCH initial schema
-- All content lives in SQLite. Genres are stored as a JSON array of genre names.

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'series', 'tv_show', 'anime')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (content_type, slug)
);

CREATE TABLE IF NOT EXISTS genres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  poster TEXT,
  trailer TEXT,
  description TEXT,
  story TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  genres TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(genres)),
  quality TEXT,
  language TEXT,
  country TEXT,
  year INTEGER,
  duration TEXT,
  movie_video TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  poster TEXT,
  trailer TEXT,
  description TEXT,
  story TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  genres TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(genres)),
  language TEXT,
  country TEXT,
  year INTEGER,
  series_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tv_shows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  poster TEXT,
  trailer TEXT,
  description TEXT,
  story TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  genres TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(genres)),
  language TEXT,
  country TEXT,
  year INTEGER,
  series_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS anime (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  poster TEXT,
  trailer TEXT,
  description TEXT,
  story TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  genres TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(genres)),
  language TEXT,
  country TEXT,
  year INTEGER,
  series_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS seasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL CHECK (content_type IN ('series', 'tv_show', 'anime')),
  content_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  season_number INTEGER NOT NULL CHECK (season_number > 0),
  poster TEXT,
  trailer TEXT,
  description TEXT,
  story TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  genres TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(genres)),
  language TEXT,
  country TEXT,
  year INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (content_type, content_id, season_number)
);

CREATE TABLE IF NOT EXISTS episodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  episode_number INTEGER NOT NULL CHECK (episode_number > 0),
  quality TEXT,
  duration TEXT,
  episode_url TEXT,
  episode_video TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (season_id, episode_number)
);

CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(content_type);
CREATE INDEX IF NOT EXISTS idx_movies_slug ON movies(slug);
CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_category ON movies(category_id);
CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year);
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_series_slug ON series(slug);
CREATE INDEX IF NOT EXISTS idx_series_status ON series(status);
CREATE INDEX IF NOT EXISTS idx_series_category ON series(category_id);
CREATE INDEX IF NOT EXISTS idx_series_year ON series(year);
CREATE INDEX IF NOT EXISTS idx_tv_shows_slug ON tv_shows(slug);
CREATE INDEX IF NOT EXISTS idx_tv_shows_status ON tv_shows(status);
CREATE INDEX IF NOT EXISTS idx_tv_shows_category ON tv_shows(category_id);
CREATE INDEX IF NOT EXISTS idx_tv_shows_year ON tv_shows(year);
CREATE INDEX IF NOT EXISTS idx_anime_slug ON anime(slug);
CREATE INDEX IF NOT EXISTS idx_anime_status ON anime(status);
CREATE INDEX IF NOT EXISTS idx_anime_category ON anime(category_id);
CREATE INDEX IF NOT EXISTS idx_anime_year ON anime(year);
CREATE INDEX IF NOT EXISTS idx_seasons_parent ON seasons(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_seasons_category ON seasons(category_id);
CREATE INDEX IF NOT EXISTS idx_episodes_season ON episodes(season_id);

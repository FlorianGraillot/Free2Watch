-- Additional lookup indexes used by the public filters and search.
CREATE INDEX IF NOT EXISTS idx_movies_language ON movies(language);
CREATE INDEX IF NOT EXISTS idx_movies_country ON movies(country);
CREATE INDEX IF NOT EXISTS idx_movies_quality ON movies(quality);
CREATE INDEX IF NOT EXISTS idx_series_title ON series(title);
CREATE INDEX IF NOT EXISTS idx_series_language ON series(language);
CREATE INDEX IF NOT EXISTS idx_series_country ON series(country);
CREATE INDEX IF NOT EXISTS idx_tv_shows_title ON tv_shows(title);
CREATE INDEX IF NOT EXISTS idx_tv_shows_language ON tv_shows(language);
CREATE INDEX IF NOT EXISTS idx_anime_title ON anime(title);
CREATE INDEX IF NOT EXISTS idx_anime_language ON anime(language);
CREATE INDEX IF NOT EXISTS idx_genres_slug ON genres(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

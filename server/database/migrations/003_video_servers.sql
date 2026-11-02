-- Migration 003: Add support for 3 video servers (embed URLs) per movie and per episode
-- Backfill server1_url from existing movie_video and episode_video columns

ALTER TABLE movies ADD COLUMN server1_url TEXT;
ALTER TABLE movies ADD COLUMN server2_url TEXT;
ALTER TABLE movies ADD COLUMN server3_url TEXT;

ALTER TABLE episodes ADD COLUMN server1_url TEXT;
ALTER TABLE episodes ADD COLUMN server2_url TEXT;
ALTER TABLE episodes ADD COLUMN server3_url TEXT;

UPDATE movies
SET server1_url = movie_video
WHERE (server1_url IS NULL OR server1_url = '')
  AND movie_video IS NOT NULL
  AND movie_video != '';

UPDATE episodes
SET server1_url = episode_video
WHERE (server1_url IS NULL OR server1_url = '')
  AND episode_video IS NOT NULL
  AND episode_video != '';

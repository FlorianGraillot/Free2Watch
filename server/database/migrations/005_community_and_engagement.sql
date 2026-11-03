-- Migration 005: Community discussions, reactions, content requests, and stream reports

CREATE TABLE IF NOT EXISTS content_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL,
  content_id INTEGER NOT NULL,
  author_name TEXT NOT NULL,
  text TEXT NOT NULL,
  is_spoiler INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comments_target ON content_comments (content_type, content_id, created_at DESC);

CREATE TABLE IF NOT EXISTS content_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL,
  content_id INTEGER NOT NULL,
  reaction TEXT NOT NULL,
  client_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reactions_target ON content_reactions (content_type, content_id, reaction);

CREATE TABLE IF NOT EXISTS content_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'movie',
  year TEXT,
  notes TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stream_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL,
  content_id INTEGER NOT NULL,
  content_title TEXT,
  server_name TEXT,
  issue_type TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

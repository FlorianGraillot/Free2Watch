import { getDb } from '../database/connection.js';

function fetchReactionsData(contentType, contentId, clientId) {
  const db = getDb();
  const counts = db
    .prepare(
      `SELECT reaction, COUNT(*) as count
       FROM content_reactions
       WHERE content_type = ? AND content_id = ?
       GROUP BY reaction`
    )
    .all(contentType, Number(contentId));

  const reactionCounts = {
    fire: 0,
    mindblown: 0,
    popcorn: 0,
    heart: 0,
    laugh: 0,
  };

  for (const row of counts) {
    if (reactionCounts[row.reaction] !== undefined) {
      reactionCounts[row.reaction] = row.count;
    }
  }

  let userReaction = null;
  if (clientId) {
    const userRow = db
      .prepare(
        `SELECT reaction FROM content_reactions
         WHERE content_type = ? AND content_id = ? AND client_id = ?
         LIMIT 1`
      )
      .get(contentType, Number(contentId), clientId);
    if (userRow) userReaction = userRow.reaction;
  }

  return { counts: reactionCounts, userReaction };
}

export const communityController = {
  // Comments
  async getComments(req, res) {
    const { contentType, contentId } = req.params;
    const db = getDb();
    const comments = db
      .prepare(
        `SELECT id, content_type, content_id, author_name, text, is_spoiler, created_at
         FROM content_comments
         WHERE content_type = ? AND content_id = ?
         ORDER BY id DESC
         LIMIT 100`
      )
      .all(contentType, Number(contentId));

    res.json({ comments });
  },

  async addComment(req, res) {
    const { contentType, contentId, authorName, text, isSpoiler } = req.body;

    if (!contentType || !contentId || !text?.trim()) {
      return res.status(400).json({ error: 'Text, content type, and content ID are required.' });
    }

    const safeAuthor = (authorName || '').trim() || 'Anonymous Cinephile';
    const safeText = text.trim().slice(0, 800);
    const spoilerFlag = isSpoiler ? 1 : 0;

    const db = getDb();
    const result = db
      .prepare(
        `INSERT INTO content_comments (content_type, content_id, author_name, text, is_spoiler)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(contentType, Number(contentId), safeAuthor, safeText, spoilerFlag);

    const created = db
      .prepare('SELECT * FROM content_comments WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json({ comment: created });
  },

  // Reactions
  async getReactions(req, res) {
    const contentType = req.params.contentType || req.body?.contentType;
    const contentId = req.params.contentId || req.body?.contentId;
    const clientId = req.query.clientId || req.body?.clientId;

    const data = fetchReactionsData(contentType, contentId, clientId);
    res.json(data);
  },

  async toggleReaction(req, res) {
    const { contentType, contentId, reaction, clientId } = req.body;

    if (!contentType || !contentId || !reaction || !clientId) {
      return res.status(400).json({ error: 'Missing required reaction fields.' });
    }

    const validReactions = ['fire', 'mindblown', 'popcorn', 'heart', 'laugh'];
    if (!validReactions.includes(reaction)) {
      return res.status(400).json({ error: 'Invalid reaction type.' });
    }

    const db = getDb();
    const existing = db
      .prepare(
        `SELECT id, reaction FROM content_reactions
         WHERE content_type = ? AND content_id = ? AND client_id = ?`
      )
      .get(contentType, Number(contentId), clientId);

    if (existing) {
      if (existing.reaction === reaction) {
        // Toggle off
        db.prepare('DELETE FROM content_reactions WHERE id = ?').run(existing.id);
      } else {
        // Change reaction
        db.prepare('UPDATE content_reactions SET reaction = ? WHERE id = ?').run(reaction, existing.id);
      }
    } else {
      db.prepare(
        `INSERT INTO content_reactions (content_type, content_id, reaction, client_id)
         VALUES (?, ?, ?, ?)`
      )
      .run(contentType, Number(contentId), reaction, clientId);
    }

    // Return updated counts with user reaction
    const data = fetchReactionsData(contentType, contentId, clientId);
    res.json(data);
  },

  // Content Requests
  async createRequest(req, res) {
    const { title, contentType, year, notes, email } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required for a content request.' });
    }

    const db = getDb();
    const result = db
      .prepare(
        `INSERT INTO content_requests (title, content_type, year, notes, email)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        title.trim(),
        contentType || 'movie',
        (year || '').trim(),
        (notes || '').trim(),
        (email || '').trim()
      );

    res.status(201).json({ success: true, id: result.lastInsertRowid });
  },

  // Stream Broken Link Reports
  async createReport(req, res) {
    const { contentType, contentId, contentTitle, serverName, issueType, notes } = req.body;

    if (!contentType || !contentId || !issueType) {
      return res.status(400).json({ error: 'Content and issue type are required.' });
    }

    const db = getDb();
    const result = db
      .prepare(
        `INSERT INTO stream_reports (content_type, content_id, content_title, server_name, issue_type, notes)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        contentType,
        Number(contentId),
        (contentTitle || '').trim(),
        (serverName || 'Server 1').trim(),
        issueType,
        (notes || '').trim()
      );

    res.status(201).json({ success: true, id: result.lastInsertRowid });
  },

  // Surprise Me Random Title
  async getRandomTitle(req, res) {
    const { type, genre } = req.query;
    const db = getDb();

    let table = 'movies';
    let contentType = 'movie';

    if (type === 'series') {
      table = 'series';
      contentType = 'series';
    } else if (type === 'tv_show') {
      table = 'tv_shows';
      contentType = 'tv_show';
    } else if (type === 'anime') {
      table = 'anime';
      contentType = 'anime';
    }

    let query = `
      SELECT id, title, slug, poster, year, duration, quality, description, story
      FROM ${table}
      WHERE (description IS NOT NULL AND description != '') OR (poster IS NOT NULL AND poster != '')
    `;
    const params = [];

    if (genre) {
      // Find content IDs having this genre
      query = `
        SELECT c.id, c.title, c.slug, c.poster, c.year, c.duration, c.quality, c.description, c.story
        FROM ${table} c
        JOIN content_genres cg ON cg.content_id = c.id AND cg.content_type = ?
        JOIN genres g ON g.id = cg.genre_id
        WHERE g.name LIKE ?
      `;
      params.push(contentType, `%${genre}%`);
    }

    query += ` ORDER BY RANDOM() LIMIT 1`;

    const row = db.prepare(query).get(...params);

    if (!row) {
      // Fallback: pick any random movie
      const fallback = db.prepare('SELECT id, title, slug, poster, year, duration, quality, description, story FROM movies ORDER BY RANDOM() LIMIT 1').get();
      if (!fallback) {
        return res.status(404).json({ error: 'No titles found in catalog.' });
      }
      return res.json({ title: { ...fallback, content_type: 'movie' } });
    }

    res.json({ title: { ...row, content_type: contentType } });
  },

  // Admin Views
  async getAdminRequests(req, res) {
    const db = getDb();
    const requests = db.prepare('SELECT * FROM content_requests ORDER BY id DESC LIMIT 50').all();
    res.json({ requests });
  },

  async getAdminReports(req, res) {
    const db = getDb();
    const reports = db.prepare('SELECT * FROM stream_reports ORDER BY id DESC LIMIT 50').all();
    res.json({ reports });
  },
};

import {
  EPISODIC_KINDS,
  listContent,
  getContentFacets,
  requireContent,
  createContent,
  updateContent,
  deleteContent,
  searchTitles,
} from '../models/contentModel.js';
import { seasonModel } from '../models/seasonModel.js';
import { validateContent, validateSeason } from '../validators/index.js';
import { ApiError } from '../utils/ApiError.js';

/** Builds the CRUD controller for one of the four independent content types. */
export function createContentController(kind) {
  return {
    list(req, res) {
      const includeDrafts = Boolean(req.admin);
      const requestedStatus = includeDrafts && req.query.status ? String(req.query.status) : 'published';
      const status =
        requestedStatus === 'all' ? 'all' : requestedStatus === 'draft' ? 'draft' : 'published';

      const result = listContent(kind, {
        status,
        search: req.query.search || req.query.q,
        category: req.query.category,
        genre: req.query.genre,
        year: req.query.year,
        language: req.query.language,
        country: req.query.country,
        quality: req.query.quality,
        sort: req.query.sort,
        page: req.query.page,
        limit: req.query.limit,
      });

      res.json(result);
    },

    facets(req, res) {
      res.json({
        data: getContentFacets(kind, {
          includeDrafts: Boolean(req.admin) && req.query.includeDrafts === 'true',
        }),
      });
    },

    detail(req, res) {
      const content = requireContent(kind, req.params.id, { includeDrafts: Boolean(req.admin) });
      const seasons = EPISODIC_KINDS.has(kind)
        ? seasonModel.list(kind, content.id, { includeEpisodes: true })
        : [];

      res.json({ content, seasons });
    },

    create(req, res) {
      const payload = validateContent(kind, req.body);
      const content = createContent(kind, payload);
      res.status(201).json({ message: 'Created successfully', content });
    },

    update(req, res) {
      const payload = validateContent(kind, req.body, { partial: true });
      const content = updateContent(kind, req.params.id, payload);
      res.json({ message: 'Updated successfully', content });
    },

    remove(req, res) {
      const deleted = deleteContent(kind, req.params.id);
      res.json({ message: 'Deleted successfully', id: deleted.id });
    },

    titles(req, res) {
      res.json({ items: searchTitles(kind, req.query.q, req.query.limit) });
    },

    publish(req, res) {
      const content = requireContent(kind, req.params.id, { includeDrafts: true });
      const status = req.body?.status === 'draft' ? 'draft' : 'published';
      const updated = updateContent(kind, content.id, { status });
      res.json({ message: status === 'published' ? 'Published' : 'Unpublished', content: updated });
    },
  };
}

export function createSeasonController(kind) {
  if (!EPISODIC_KINDS.has(kind)) throw ApiError.badRequest('Invalid content type');

  return {
    list(req, res) {
      const seasons = seasonModel.list(kind, Number(req.params.contentId), {
        includeEpisodes: req.query.include === 'episodes',
      });
      res.json({ items: seasons });
    },

    create(req, res) {
      const payload = validateSeason(req.body);
      const season = seasonModel.create(kind, Number(req.params.contentId), payload);
      res.status(201).json({ message: 'Season created', season });
    },

    update(req, res) {
      const payload = validateSeason(req.body, { partial: true });
      const season = seasonModel.update(
        kind,
        Number(req.params.contentId),
        Number(req.params.seasonId),
        payload
      );
      res.json({ message: 'Season updated', season });
    },

    remove(req, res) {
      const deleted = seasonModel.remove(kind, Number(req.params.contentId), Number(req.params.seasonId));
      res.json({ message: 'Season deleted', id: deleted.id });
    },
  };
}

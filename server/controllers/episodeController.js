import { episodeModel } from '../models/episodeModel.js';
import { validateEpisode } from '../validators/index.js';

export function createEpisodeController(kind) {
  return {
    list(req, res) {
      const items = episodeModel.list(kind, Number(req.params.contentId), Number(req.params.seasonId));
      res.json({ items });
    },

    create(req, res) {
      const payload = validateEpisode(req.body);
      const episode = episodeModel.create(
        kind,
        Number(req.params.contentId),
        Number(req.params.seasonId),
        payload
      );
      res.status(201).json({ message: 'Episode created', episode });
    },

    update(req, res) {
      const payload = validateEpisode(req.body, { partial: true });
      const episode = episodeModel.update(
        kind,
        Number(req.params.contentId),
        Number(req.params.seasonId),
        Number(req.params.episodeId),
        payload
      );
      res.json({ message: 'Episode updated', episode });
    },

    remove(req, res) {
      const deleted = episodeModel.remove(
        kind,
        Number(req.params.contentId),
        Number(req.params.seasonId),
        Number(req.params.episodeId)
      );
      res.json({ message: 'Episode deleted', id: deleted.id });
    },

    move(req, res) {
      const direction = req.body?.direction === 'up' ? 'up' : 'down';
      const episode = episodeModel.move(
        kind,
        Number(req.params.contentId),
        Number(req.params.seasonId),
        Number(req.params.episodeId),
        direction
      );
      res.json({ message: 'Episode order updated', episode });
    },
  };
}

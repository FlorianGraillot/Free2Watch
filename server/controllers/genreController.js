import { genreModel } from '../models/genreModel.js';
import { validateGenre } from '../validators/index.js';

export const genreController = {
  list(_req, res) {
    res.json({ items: genreModel.list() });
  },

  create(req, res) {
    const genre = genreModel.create(validateGenre(req.body));
    res.status(201).json({ message: 'Genre created', genre });
  },

  update(req, res) {
    const genre = genreModel.update(Number(req.params.id), validateGenre(req.body));
    res.json({ message: 'Genre updated', genre });
  },

  remove(req, res) {
    const deleted = genreModel.remove(Number(req.params.id));
    res.json({ message: 'Genre deleted', id: deleted.id });
  },
};

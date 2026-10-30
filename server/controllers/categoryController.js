import { categoryModel } from '../models/categoryModel.js';
import { validateCategory } from '../validators/index.js';

export const categoryController = {
  list(req, res) {
    res.json({ items: categoryModel.list(req.query.content_type) });
  },

  create(req, res) {
    const payload = validateCategory(req.body);
    const category = categoryModel.create(payload);
    res.status(201).json({ message: 'Category created', category });
  },

  update(req, res) {
    const payload = validateCategory({ ...req.body, content_type: req.body.content_type ?? req.body.type });
    const category = categoryModel.update(Number(req.params.id), payload);
    res.json({ message: 'Category updated', category });
  },

  remove(req, res) {
    const deleted = categoryModel.remove(Number(req.params.id));
    res.json({ message: 'Category deleted', id: deleted.id });
  },
};

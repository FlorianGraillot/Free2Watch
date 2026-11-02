import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { requireAdmin } from '../middleware/auth.js';
import { serverRoot } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const router = express.Router();
const uploadsDir = path.resolve(serverRoot, '../client/public/uploads');

router.post('/poster', requireAdmin, async (req, res, next) => {
  try {
    const { image, filename } = req.body ?? {};
    if (!image || typeof image !== 'string') {
      throw ApiError.badRequest('Image data or URL is required');
    }

    fs.mkdirSync(uploadsDir, { recursive: true });

    // Handle base64 data URI
    const match = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (match) {
      let ext = match[1].toLowerCase();
      if (ext === 'jpeg') ext = 'jpg';
      if (ext.includes('svg')) ext = 'svg';
      const buffer = Buffer.from(match[2], 'base64');
      const name = `poster-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
      const filePath = path.join(uploadsDir, name);
      fs.writeFileSync(filePath, buffer);
      return res.json({ url: `/uploads/${name}`, message: 'Poster uploaded successfully' });
    }

    // If it's a URL, attempt to download it server-side to save locally
    if (image.startsWith('http://') || image.startsWith('https://')) {
      try {
        const response = await fetch(image, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
        });
        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.startsWith('image/')) {
            const ext = contentType.includes('png')
              ? 'png'
              : contentType.includes('webp')
              ? 'webp'
              : contentType.includes('svg')
              ? 'svg'
              : 'jpg';
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const name = `poster-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
            const filePath = path.join(uploadsDir, name);
            fs.writeFileSync(filePath, buffer);
            return res.json({ url: `/uploads/${name}`, message: 'Poster downloaded and saved' });
          }
        }
      } catch {
        // Fall back to returning original URL if server fetch fails
      }
    }

    return res.json({ url: image });
  } catch (err) {
    next(err);
  }
});

export default router;

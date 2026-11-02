import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const serverRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.resolve(serverRoot, '../.env') });
dotenv.config({ path: path.join(serverRoot, '.env') });

const rawDatabasePath = process.env.DATABASE_PATH || './database/free2watch.db';

export const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  databasePath: path.isAbsolute(rawDatabasePath)
    ? rawDatabasePath
    : path.resolve(serverRoot, rawDatabasePath),
  jwtSecret: process.env.JWT_SECRET || 'free2watch-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',
  seedDemoContent: process.env.SEED_DEMO_CONTENT === 'true',
  cookieName: 'f2w_session',
};

export const contentKindLabels = {
  movie: 'Movie',
  series: 'TV Series',
  tv_show: 'TV Show',
  anime: 'Anime',
};

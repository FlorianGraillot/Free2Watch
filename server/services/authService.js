import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { adminModel } from '../models/adminModel.js';
import { ApiError } from '../utils/ApiError.js';

export const authService = {
  signToken(admin) {
    return jwt.sign({ sub: admin.id, username: admin.username, role: 'admin' }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
      issuer: 'free2watch',
    });
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwtSecret, { issuer: 'free2watch' });
    } catch {
      return null;
    }
  },

  login(username, password) {
    if (!username || !password) {
      throw ApiError.badRequest('Username and password are required');
    }

    const admin = adminModel.findByUsername(String(username).trim());
    // Constant-ish response for both unknown user and wrong password.
    const valid = admin ? adminModel.verifyPassword(String(password), admin.password_hash) : false;
    if (!admin || !valid) {
      throw ApiError.unauthorized('Invalid username or password');
    }

    const token = this.signToken(admin);
    return {
      token,
      admin: { id: admin.id, username: admin.username },
    };
  },

  resolveAdminFromToken(token) {
    if (!token) return null;
    const payload = this.verifyToken(token);
    if (!payload?.sub) return null;
    return adminModel.findById(payload.sub) ?? null;
  },
};

export const cookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: config.isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

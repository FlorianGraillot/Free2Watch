import { authService, cookieOptions } from '../services/authService.js';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

function extractToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);

  const cookieToken = req.cookies?.[config.cookieName];
  if (cookieToken) return cookieToken;

  return null;
}

/** Hard gate for every administrator-only endpoint. */
export function requireAdmin(req, _res, next) {
  const admin = authService.resolveAdminFromToken(extractToken(req));
  if (!admin) return next(ApiError.unauthorized('Administrator session required'));
  req.admin = admin;
  return next();
}

/** Soft gate used by public read endpoints that can reveal drafts to admins. */
export function optionalAdmin(req, _res, next) {
  const admin = authService.resolveAdminFromToken(extractToken(req));
  req.admin = admin ?? null;
  next();
}

export function setSessionCookie(res, token) {
  res.cookie(config.cookieName, token, cookieOptions);
}

export function clearSessionCookie(res) {
  res.clearCookie(config.cookieName, { ...cookieOptions, maxAge: undefined });
}

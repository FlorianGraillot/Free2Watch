import { authService, cookieOptions } from '../services/authService.js';
import { adminModel } from '../models/adminModel.js';
import { setSessionCookie, clearSessionCookie } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';

export const authController = {
  login(req, res) {
    const { username, password } = req.body ?? {};
    const { token, admin } = authService.login(username, password);
    setSessionCookie(res, token);

    res.json({
      message: 'Signed in successfully',
      admin,
      token,
      expiresIn: cookieOptions.maxAge,
    });
  },

  logout(_req, res) {
    clearSessionCookie(res);
    res.json({ message: 'Signed out' });
  },

  me(req, res) {
    res.json({ admin: req.admin });
  },

  updateCredentials(req, res) {
    const { current_password: currentPassword, username, password } = req.body ?? {};
    const admin = adminModel.findByUsername(req.admin.username);

    if (!currentPassword || !adminModel.verifyPassword(String(currentPassword), admin.password_hash)) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    const nextUsername = String(username ?? '').trim() || admin.username;
    const nextPassword = password ? String(password) : '';

    if (nextPassword && nextPassword.length < 6) {
      throw ApiError.badRequest('New password must be at least 6 characters');
    }
    if (nextUsername.length < 3) {
      throw ApiError.badRequest('Username must be at least 3 characters');
    }
    if (nextUsername !== admin.username) {
      const taken = adminModel.findByUsername(nextUsername);
      if (taken && taken.id !== admin.id) throw ApiError.conflict('That username is already taken');
    }

    const updated = adminModel.updateCredentials({
      id: admin.id,
      username: nextUsername,
      password: nextPassword || undefined,
    });

    // Refresh the session so the token carries the new username.
    const token = authService.signToken(updated);
    setSessionCookie(res, token);

    res.json({ message: 'Credentials updated', admin: updated, token });
  },
};

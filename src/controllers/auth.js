const { validationResult } = require('express-validator');
const authService = require('../services/auth');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
};

/**
 * POST /auth/register
 */
async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { access, refresh } = await authService.register(req.body);
    res.cookie('refresh_token', refresh, REFRESH_COOKIE_OPTIONS);
    return res.status(201).json({ access_token: access });
  } catch (error) {
    console.error('[register]', error.message);
    return res.status(400).json({ error: error.message });
  }
}

/**
 * POST /auth/login
 */
async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { access, refresh } = await authService.login(req.body);
    res.cookie('refresh_token', refresh, REFRESH_COOKIE_OPTIONS);
    return res.status(200).json({ access_token: access });
  } catch (error) {
    console.error('[login]', error.message);
    return res.status(401).json({ error: error.message });
  }
}

/**
 * GET /auth/me
 * Requiere authMiddleware() en el router.
 */
async function me(req, res) {
  try {
    const user = await authService.getProfile(req.user.sub);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.status(200).json({ data: user });
  } catch (error) {
    console.error('[me]', error.message);
    return res.status(500).json({ error: 'Error al obtener perfil' });
  }
}

module.exports = { register, login, me };

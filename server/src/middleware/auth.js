import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export const AUTH_COOKIE = 'repolens_token';

export function signToken(userId) {
  return jwt.sign({ sub: userId.toString() }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    issuer: 'repolens',
  });
}

/** Converts "7d" / "12h" / "30m" / "3600" (seconds) into milliseconds. */
function durationToMs(value) {
  const match = String(value).trim().match(/^(\d+)\s*([smhdw]?)$/i);
  if (!match) return 7 * 864e5;
  const n = Number(match[1]);
  const unit = { '': 1, s: 1, m: 60, h: 3600, d: 86400, w: 604800 }[match[2].toLowerCase()];
  return n * unit * 1000;
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: durationToMs(env.jwtExpiresIn),
  };
}

function extractToken(req) {
  const cookieToken = req.cookies?.[AUTH_COOKIE];
  if (cookieToken) return cookieToken;
  const header = req.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

/** Requires a valid JWT (httpOnly cookie or Bearer header). Sets req.user. */
export async function requireAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next(AppError.unauthorized());

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { issuer: 'repolens' });
  } catch {
    return next(AppError.unauthorized('Your session has expired. Please sign in again.'));
  }

  const user = await User.findById(payload.sub);
  if (!user) return next(AppError.unauthorized('Account no longer exists.'));
  req.user = user;
  next();
}

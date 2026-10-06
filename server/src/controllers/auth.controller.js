import { z } from 'zod';
import { User } from '../models/User.js';
import { Analysis } from '../models/Analysis.js';
import { AppError } from '../utils/AppError.js';
import { AUTH_COOKIE, cookieOptions, signToken } from '../middleware/auth.js';

const password = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

const email = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(254);

const name = z
  .string({ required_error: 'Name is required' })
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(60, 'Name must be at most 60 characters');

export const schemas = {
  register: z.object({ name, email, password }),
  login: z.object({ email, password: z.string().min(1, 'Password is required').max(128) }),
  updateProfile: z.object({ name }),
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: password,
  }),
  deleteAccount: z.object({ password: z.string().min(1, 'Password is required') }),
};

function sendSession(res, user, status = 200) {
  const token = signToken(user._id);
  res.cookie(AUTH_COOKIE, token, cookieOptions());
  res.status(status).json({ user: user.toPublicJSON() });
}

export async function register(req, res) {
  const { name, email, password } = req.body;
  const exists = await User.exists({ email });
  if (exists) throw AppError.conflict('An account with this email already exists.');
  const user = await User.create({ name, email, password, lastLoginAt: new Date() });
  sendSession(res, user, 201);
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password (no account enumeration).
  if (!user || !(await user.comparePassword(password))) {
    throw AppError.unauthorized('Invalid email or password.');
  }
  user.lastLoginAt = new Date();
  await user.save();
  sendSession(res, user);
}

export function logout(_req, res) {
  const { maxAge: _maxAge, ...opts } = cookieOptions();
  res.clearCookie(AUTH_COOKIE, opts);
  res.status(204).end();
}

export function me(req, res) {
  res.json({ user: req.user.toPublicJSON() });
}

export async function updateProfile(req, res) {
  req.user.name = req.body.name;
  await req.user.save();
  res.json({ user: req.user.toPublicJSON() });
}

export async function changePassword(req, res) {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw AppError.badRequest('Current password is incorrect.', {
      fields: { currentPassword: 'Current password is incorrect.' },
    });
  }
  user.password = req.body.newPassword;
  await user.save();
  sendSession(res, user);
}

export async function deleteAccount(req, res) {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.password))) {
    throw AppError.badRequest('Password is incorrect.', { fields: { password: 'Password is incorrect.' } });
  }
  await Analysis.deleteMany({ user: user._id });
  await user.deleteOne();
  logout(req, res);
}

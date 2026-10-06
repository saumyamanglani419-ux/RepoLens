import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as auth from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

// Brute-force protection for credential endpoints.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Too many attempts. Please try again in a few minutes.', code: 'RATE_LIMITED' } },
});

router.post('/register', credentialLimiter, validateBody(auth.schemas.register), auth.register);
router.post('/login', credentialLimiter, validateBody(auth.schemas.login), auth.login);
router.post('/logout', auth.logout);

router.get('/me', requireAuth, auth.me);
router.patch('/me', requireAuth, validateBody(auth.schemas.updateProfile), auth.updateProfile);
router.delete('/me', requireAuth, credentialLimiter, validateBody(auth.schemas.deleteAccount), auth.deleteAccount);
router.patch(
  '/password',
  requireAuth,
  credentialLimiter,
  validateBody(auth.schemas.changePassword),
  auth.changePassword,
);

export default router;

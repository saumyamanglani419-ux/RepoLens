import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as analyses from '../controllers/analysis.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

// Each analysis costs several GitHub API calls, so limit how often a user can run one.
const analysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user._id.toString(), // requireAuth runs first
  message: { error: { message: 'You are analyzing repositories very quickly. Please wait a few minutes.', code: 'RATE_LIMITED' } },
});

router.use(requireAuth);

router.get('/', analyses.list);
router.get('/stats', analyses.stats);
router.post('/', analysisLimiter, validateBody(analyses.schemas.create), analyses.create);
router.delete('/', analyses.clearAll);
router.get('/:id', analyses.getOne);
router.post('/:id/reanalyze', analysisLimiter, analyses.reanalyze);
router.delete('/:id', analyses.remove);

export default router;

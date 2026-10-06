import { Router } from 'express';

const router = Router();
router.get('/', (req, res) => res.json([]));
router.post('/', (req, res) => res.status(201).end());
router.get('/:id', (req, res) => res.json({}));
router
  .route('/:id/avatar')
  .put((req, res) => res.end())
  .delete((req, res) => res.end());

export default router;

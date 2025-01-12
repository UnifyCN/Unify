import { Router } from 'express';

const router = Router();

// Test route, this is just for testing express
router.get('/test', (req, res) => {
  res.json({ message: 'API is working!!' });
});

export default router;

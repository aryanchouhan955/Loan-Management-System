import { Router, Response } from 'express';
import { authenticate, enforceRole, AuthRequest } from '../middleware/authenticate';
import User from '../models/User.model';

const router = Router();

router.use(authenticate);

// Admin: list all executives
router.get('/', enforceRole(['admin']), async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({ role: { $ne: 'borrower' } }).select('-passwordHash');
    res.json({ users });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

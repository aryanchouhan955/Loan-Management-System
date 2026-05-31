import { Router } from 'express';
import { authenticate, enforceRole } from '../middleware/authenticate';
import { recordPayment, getPayments } from '../controllers/payment.controller';

const router = Router();

router.use(authenticate);

router.post('/:loanId', enforceRole(['collection', 'admin']), recordPayment);
router.get('/:loanId', enforceRole(['collection', 'admin']), getPayments);

export default router;

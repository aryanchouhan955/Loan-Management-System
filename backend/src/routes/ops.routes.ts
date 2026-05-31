import { Router } from 'express';
import { authenticate, enforceRole } from '../middleware/authenticate';
import {
  getSalesLeads,
  getSanctionQueue,
  sanctionLoan,
  getDisbursementQueue,
  disburseLoan,
  getCollectionQueue,
  getAllLoans,
} from '../controllers/ops.controller';

const router = Router();

router.use(authenticate);

router.get('/sales', enforceRole(['sales', 'admin']), getSalesLeads);
router.get('/sanction', enforceRole(['sanction', 'admin']), getSanctionQueue);
router.patch('/sanction/:id', enforceRole(['sanction', 'admin']), sanctionLoan);
router.get('/disbursement', enforceRole(['disbursement', 'admin']), getDisbursementQueue);
router.patch('/disburse/:id', enforceRole(['disbursement', 'admin']), disburseLoan);
router.get('/collection', enforceRole(['collection', 'admin']), getCollectionQueue);
router.get('/all-loans', enforceRole(['admin']), getAllLoans);

export default router;

import { Router } from 'express';
import { authenticate, enforceRole } from '../middleware/authenticate';
import { savePersonalDetails, uploadDocument, applyLoan, getMyLoans, calculatePreview } from '../controllers/loan.controller';
import { upload } from '../config/multer';

const router = Router();

router.use(authenticate);
router.use(enforceRole(['borrower']));

router.post('/personal-details', savePersonalDetails);
router.post('/upload-document', upload.single('salarySlip'), uploadDocument);
router.post('/apply', applyLoan);
router.get('/my', getMyLoans);
router.get('/calculate', calculatePreview);

export default router;

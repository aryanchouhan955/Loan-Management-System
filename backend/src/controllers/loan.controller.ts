import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import User from '../models/User.model';
import Loan from '../models/Loan.model';
import DocumentModel from '../models/Document.model';
import { runBRE } from '../services/bre.service';
import { calculateLoan } from '../utils/loanCalc';

// POST /api/loans/personal-details — save personal details + run BRE
export const savePersonalDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, pan, dob, monthlySalary, employmentMode } = req.body;

    if (!fullName || !pan || !dob || !monthlySalary || !employmentMode) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    const breResult = runBRE({
      dob: new Date(dob),
      monthlySalary: Number(monthlySalary),
      pan: pan.toUpperCase(),
      employmentMode,
    });

    if (!breResult.passed) {
      res.status(422).json({
        message: 'Application rejected by eligibility check',
        breErrors: breResult.errors,
        passed: false,
      });
      return;
    }

    await User.findByIdAndUpdate(req.user?.id, {
      fullName,
      pan: pan.toUpperCase(),
      dob: new Date(dob),
      monthlySalary: Number(monthlySalary),
      employmentMode,
      personalDetailsSubmitted: true,
    });

    res.json({ message: 'Personal details saved. Eligibility check passed.', passed: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// POST /api/loans/upload-document — upload salary slip
export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const doc = await DocumentModel.create({
      userId: req.user?.id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    });

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: { id: doc._id, fileUrl: doc.fileUrl, fileName: doc.originalName },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// POST /api/loans/apply — create loan application
export const applyLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { principalAmount, tenureDays, documentId } = req.body;

    if (!principalAmount || !tenureDays) {
      res.status(400).json({ message: 'Principal amount and tenure are required' });
      return;
    }

    const amount = Number(principalAmount);
    const tenure = Number(tenureDays);

    if (amount < 50000 || amount > 500000) {
      res.status(400).json({ message: 'Loan amount must be between ₹50,000 and ₹5,00,000' });
      return;
    }
    if (tenure < 30 || tenure > 365) {
      res.status(400).json({ message: 'Tenure must be between 30 and 365 days' });
      return;
    }

    const user = await User.findById(req.user?.id);
    if (!user?.personalDetailsSubmitted) {
      res.status(400).json({ message: 'Please complete personal details first' });
      return;
    }

    // Check for existing active loan
    const existingLoan = await Loan.findOne({
      borrowerId: req.user?.id,
      status: { $in: ['applied', 'sanctioned', 'disbursed'] },
    });
    if (existingLoan) {
      res.status(409).json({ message: 'You already have an active loan application' });
      return;
    }

    const calc = calculateLoan(amount, tenure);

    const loan = await Loan.create({
      borrowerId: req.user?.id,
      principalAmount: calc.principal,
      tenureDays: calc.tenureDays,
      interestRate: calc.interestRate,
      simpleInterest: calc.simpleInterest,
      totalRepayment: calc.totalRepayment,
      status: 'applied',
    });

    // Link document to loan if provided
    if (documentId) {
      await DocumentModel.findByIdAndUpdate(documentId, { loanId: loan._id });
    }

    res.status(201).json({
      message: 'Loan application submitted successfully',
      loan: {
        id: loan._id,
        principalAmount: loan.principalAmount,
        tenureDays: loan.tenureDays,
        simpleInterest: loan.simpleInterest,
        totalRepayment: loan.totalRepayment,
        status: loan.status,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// GET /api/loans/my — borrower's own loans
export const getMyLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ borrowerId: req.user?.id }).sort({ createdAt: -1 });
    res.json({ loans });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/loans/calculate — preview calculation
export const calculatePreview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { principalAmount, tenureDays } = req.query;
    if (!principalAmount || !tenureDays) {
      res.status(400).json({ message: 'principalAmount and tenureDays are required' });
      return;
    }
    const calc = calculateLoan(Number(principalAmount), Number(tenureDays));
    res.json(calc);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import User from '../models/User.model';
import Loan from '../models/Loan.model';

// GET /api/ops/sales — users who registered but haven't applied
export const getSalesLeads = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const borrowers = await User.find({ role: 'borrower' }).select('-passwordHash').sort({ createdAt: -1 });

    const leads = await Promise.all(
      borrowers.map(async (user) => {
        const loan = await Loan.findOne({ borrowerId: user._id }).sort({ createdAt: -1 });
        return {
          user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            pan: user.pan,
            monthlySalary: user.monthlySalary,
            employmentMode: user.employmentMode,
            personalDetailsSubmitted: user.personalDetailsSubmitted,
            createdAt: user.createdAt,
          },
          loanStatus: loan?.status || null,
          loanId: loan?._id || null,
        };
      })
    );

    res.json({ leads });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// GET /api/ops/sanction — applied loans
export const getSanctionQueue = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: 'applied' })
      .populate('borrowerId', 'fullName email pan monthlySalary employmentMode dob')
      .sort({ createdAt: -1 });
    res.json({ loans });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/ops/sanction/:id — approve or reject
export const sanctionLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ message: 'Action must be approve or reject' });
      return;
    }
    if (action === 'reject' && !rejectionReason) {
      res.status(400).json({ message: 'Rejection reason is required' });
      return;
    }

    const loan = await Loan.findById(id);
    if (!loan) {
      res.status(404).json({ message: 'Loan not found' });
      return;
    }
    if (loan.status !== 'applied') {
      res.status(400).json({ message: `Cannot sanction a loan with status: ${loan.status}` });
      return;
    }

    if (action === 'approve') {
      loan.status = 'sanctioned';
      loan.sanctionedBy = req.user?.id as unknown as typeof loan.sanctionedBy;
      loan.sanctionedAt = new Date();
    } else {
      loan.status = 'rejected';
      loan.rejectionReason = rejectionReason;
    }

    await loan.save();
    res.json({ message: `Loan ${action === 'approve' ? 'sanctioned' : 'rejected'} successfully`, loan });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// GET /api/ops/disbursement — sanctioned loans
export const getDisbursementQueue = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: 'sanctioned' })
      .populate('borrowerId', 'fullName email pan')
      .populate('sanctionedBy', 'fullName')
      .sort({ sanctionedAt: -1 });
    res.json({ loans });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/ops/disburse/:id — mark as disbursed
export const disburseLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const loan = await Loan.findById(id);

    if (!loan) {
      res.status(404).json({ message: 'Loan not found' });
      return;
    }
    if (loan.status !== 'sanctioned') {
      res.status(400).json({ message: `Cannot disburse a loan with status: ${loan.status}` });
      return;
    }

    loan.status = 'disbursed';
    loan.disbursedBy = req.user?.id as unknown as typeof loan.disbursedBy;
    loan.disbursedAt = new Date();
    await loan.save();

    res.json({ message: 'Loan disbursed successfully', loan });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/ops/collection — disbursed loans
export const getCollectionQueue = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: { $in: ['disbursed', 'closed'] } })
      .populate('borrowerId', 'fullName email pan')
      .populate('disbursedBy', 'fullName')
      .sort({ disbursedAt: -1 });
    res.json({ loans });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/ops/all-loans — admin overview
export const getAllLoans = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find()
      .populate('borrowerId', 'fullName email pan')
      .sort({ createdAt: -1 });
    res.json({ loans });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import Payment from '../models/Payment.model';
import Loan from '../models/Loan.model';

// POST /api/payments/:loanId
export const recordPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loanId } = req.params;
    const { utrNumber, amount, paymentDate } = req.body;

    if (!utrNumber || !amount || !paymentDate) {
      res.status(400).json({ message: 'UTR number, amount, and payment date are required' });
      return;
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ message: 'Loan not found' });
      return;
    }
    if (loan.status !== 'disbursed') {
      res.status(400).json({ message: `Cannot record payment for loan with status: ${loan.status}` });
      return;
    }

    const payAmount = Number(amount);
    const outstanding = loan.totalRepayment - loan.totalPaid;

    if (payAmount <= 0) {
      res.status(400).json({ message: 'Amount must be greater than 0' });
      return;
    }
    if (payAmount > outstanding) {
      res.status(400).json({
        message: `Payment amount ₹${payAmount.toLocaleString('en-IN')} exceeds outstanding balance ₹${outstanding.toLocaleString('en-IN')}`,
      });
      return;
    }

    // Check UTR uniqueness
    const existingUTR = await Payment.findOne({ utrNumber: utrNumber.toUpperCase() });
    if (existingUTR) {
      res.status(409).json({ message: 'UTR number already exists. Each payment must have a unique UTR.' });
      return;
    }

    const newTotalPaid = loan.totalPaid + payAmount;
    const outstandingAfter = loan.totalRepayment - newTotalPaid;

    const payment = await Payment.create({
      loanId,
      recordedBy: req.user?.id,
      utrNumber: utrNumber.toUpperCase(),
      amount: payAmount,
      paymentDate: new Date(paymentDate),
      outstandingAfter: Math.max(0, outstandingAfter),
    });

    // Update loan
    loan.totalPaid = newTotalPaid;
    if (newTotalPaid >= loan.totalRepayment) {
      loan.status = 'closed';
      loan.closedAt = new Date();
    }
    await loan.save();

    res.status(201).json({
      message: loan.status === 'closed' ? 'Payment recorded. Loan is now closed!' : 'Payment recorded successfully',
      payment,
      loan: {
        id: loan._id,
        status: loan.status,
        totalPaid: loan.totalPaid,
        totalRepayment: loan.totalRepayment,
        outstandingBalance: Math.max(0, outstandingAfter),
      },
    });
  } catch (err: unknown) {
    const mongoErr = err as { code?: number };
    if (mongoErr.code === 11000) {
      res.status(409).json({ message: 'UTR number already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// GET /api/payments/:loanId
export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loanId } = req.params;
    const loan = await Loan.findById(loanId).populate('borrowerId', 'fullName email');
    if (!loan) {
      res.status(404).json({ message: 'Loan not found' });
      return;
    }

    const payments = await Payment.find({ loanId })
      .populate('recordedBy', 'fullName')
      .sort({ paymentDate: -1 });

    res.json({
      loan: {
        id: loan._id,
        principalAmount: loan.principalAmount,
        totalRepayment: loan.totalRepayment,
        totalPaid: loan.totalPaid,
        outstandingBalance: Math.max(0, loan.totalRepayment - loan.totalPaid),
        status: loan.status,
        borrower: loan.borrowerId,
      },
      payments,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

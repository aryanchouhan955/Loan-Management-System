export type UserRole = 'borrower' | 'admin' | 'sales' | 'sanction' | 'disbursement' | 'collection';
export type EmploymentMode = 'salaried' | 'self_employed' | 'unemployed';
export type LoanStatus = 'applied' | 'sanctioned' | 'rejected' | 'disbursed' | 'closed';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  pan?: string;
  dob?: string;
  monthlySalary?: number;
  employmentMode?: EmploymentMode;
  personalDetailsSubmitted: boolean;
}

export interface Loan {
  _id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  borrowerId: any;
  principalAmount: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  totalPaid: number;
  status: LoanStatus;
  rejectionReason?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sanctionedBy?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disbursedBy?: any;
  appliedAt: string;
  sanctionedAt?: string;
  disbursedAt?: string;
  closedAt?: string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  loanId: string;
  recordedBy: string | User;
  utrNumber: string;
  amount: number;
  paymentDate: string;
  outstandingAfter: number;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

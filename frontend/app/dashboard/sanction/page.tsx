'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loan } from '@/types';
import { formatCurrency, formatDate } from '@/lib/loanCalc';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface LoanWithBorrower extends Loan {
  borrowerId: {
    _id: string;
    fullName: string;
    email: string;
    pan?: string;
    monthlySalary?: number;
    employmentMode?: string;
    dob?: string;
  };
}

export default function SanctionPage() {
  const [loans, setLoans] = useState<LoanWithBorrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{ loanId: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !['sanction', 'admin'].includes(user.role)) { router.push('/dashboard'); return; }
    fetchLoans();
  }, [user, router]);

  const fetchLoans = () => {
    setLoading(true);
    api.get('/ops/sanction').then(r => setLoans(r.data.loans)).catch(console.error).finally(() => setLoading(false));
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (loanId: string) => {
    setActionLoading(loanId + '-approve');
    try {
      await api.patch(`/ops/sanction/${loanId}`, { action: 'approve' });
      showToast('Loan sanctioned successfully!', 'success');
      fetchLoans();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(e.response?.data?.message || 'Failed to sanction', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionModal || !rejectionReason.trim()) return;
    setActionLoading(rejectionModal.loanId + '-reject');
    try {
      await api.patch(`/ops/sanction/${rejectionModal.loanId}`, { action: 'reject', rejectionReason });
      showToast('Loan rejected.', 'success');
      setRejectionModal(null);
      setRejectionReason('');
      fetchLoans();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(e.response?.data?.message || 'Failed to reject', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {rejectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-gray-900 mb-3">Reject Loan Application</h3>
            <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejection. This will be visible to the borrower.</p>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Insufficient income, high debt ratio..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              rows={3}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRejectionModal(null); setRejectionReason(''); }} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || !!actionLoading}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sanction — Review Applications</h1>
        <p className="text-gray-500 text-sm mt-1">Approve or reject pending loan applications</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : loans.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🎉</div>
          <p>No pending applications to review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map(loan => {
            const b = loan.borrowerId;
            return (
              <div key={loan._id} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{b.fullName}</h3>
                    <p className="text-sm text-gray-500">{b.email} · PAN: {b.pan || 'N/A'}</p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">PENDING REVIEW</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  {[
                    ['Loan Amount', formatCurrency(loan.principalAmount)],
                    ['Tenure', `${loan.tenureDays} days`],
                    ['Interest (12% p.a.)', formatCurrency(loan.simpleInterest)],
                    ['Total Repayment', formatCurrency(loan.totalRepayment)],
                    ['Monthly Salary', b.monthlySalary ? `₹${b.monthlySalary.toLocaleString('en-IN')}` : 'N/A'],
                    ['Employment', b.employmentMode?.replace('_', ' ') || 'N/A'],
                    ['Date of Birth', b.dob ? formatDate(b.dob) : 'N/A'],
                    ['Applied On', formatDate(loan.appliedAt)],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-gray-500">{label}</p>
                      <p className="font-medium text-gray-800 capitalize">{val}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(loan._id)}
                    disabled={!!actionLoading}
                    className="px-5 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === loan._id + '-approve' ? 'Processing...' : '✓ Sanction'}
                  </button>
                  <button
                    onClick={() => setRejectionModal({ loanId: loan._id })}
                    disabled={!!actionLoading}
                    className="px-5 py-2 bg-red-50 text-red-600 border border-red-200 text-sm rounded-lg font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

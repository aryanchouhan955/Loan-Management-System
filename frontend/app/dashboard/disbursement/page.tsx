'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loan } from '@/types';
import { formatCurrency, formatDate } from '@/lib/loanCalc';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface LoanWithBorrower extends Loan {
  borrowerId: { _id: string; fullName: string; email: string; pan?: string };
  sanctionedBy: { fullName: string } | null;
}

export default function DisbursementPage() {
  const [loans, setLoans] = useState<LoanWithBorrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !['disbursement', 'admin'].includes(user.role)) { router.push('/dashboard'); return; }
    fetchLoans();
  }, [user, router]);

  const fetchLoans = () => {
    setLoading(true);
    api.get('/ops/disbursement').then(r => setLoans(r.data.loans)).catch(console.error).finally(() => setLoading(false));
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDisburse = async (loanId: string) => {
    setActionLoading(loanId);
    try {
      await api.patch(`/ops/disburse/${loanId}`);
      showToast('Loan disbursed successfully!', 'success');
      fetchLoans();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(e.response?.data?.message || 'Failed to disburse', 'error');
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

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Disbursement — Release Funds</h1>
        <p className="text-gray-500 text-sm mt-1">Sanctioned loans awaiting fund disbursement</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : loans.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">💼</div>
          <p>No sanctioned loans pending disbursement</p>
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
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">SANCTIONED</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  {[
                    ['Loan Amount', formatCurrency(loan.principalAmount)],
                    ['Tenure', `${loan.tenureDays} days`],
                    ['Total Repayment', formatCurrency(loan.totalRepayment)],
                    ['Sanctioned By', loan.sanctionedBy?.fullName || 'N/A'],
                    ['Applied On', formatDate(loan.appliedAt)],
                    ['Sanctioned On', loan.sanctionedAt ? formatDate(loan.sanctionedAt) : 'N/A'],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-gray-500">{label}</p>
                      <p className="font-medium text-gray-800">{val}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleDisburse(loan._id)}
                  disabled={actionLoading === loan._id}
                  className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === loan._id ? 'Processing...' : '💰 Disburse Funds'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

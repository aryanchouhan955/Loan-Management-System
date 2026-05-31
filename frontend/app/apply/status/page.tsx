'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Loan } from '@/types';
import { formatCurrency, formatDate } from '@/lib/loanCalc';

const STATUS_CONFIG = {
  applied:    { label: 'Under Review',  color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  sanctioned: { label: 'Sanctioned',    color: 'bg-blue-100 text-blue-800',     icon: '✅' },
  rejected:   { label: 'Rejected',      color: 'bg-red-100 text-red-800',       icon: '❌' },
  disbursed:  { label: 'Disbursed',     color: 'bg-purple-100 text-purple-800', icon: '💰' },
  closed:     { label: 'Closed',        color: 'bg-green-100 text-green-800',   icon: '🎉' },
};

export default function LoanStatusPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/loans/my').then(r => setLoans(r.data.loans)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Applications</h2>
          <p className="text-gray-500 text-sm">Track your loan application status</p>
        </div>
        <button
          onClick={() => router.push('/apply/personal')}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Application
        </button>
      </div>

      {loans.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">📋</div>
          <p>No loan applications yet.</p>
          <button onClick={() => router.push('/apply/personal')} className="mt-3 text-blue-600 font-medium hover:underline">
            Apply now →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map(loan => {
            const cfg = STATUS_CONFIG[loan.status];
            return (
              <div key={loan._id} className="border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs text-gray-400">Application ID</span>
                    <p className="font-mono text-sm text-gray-700">{loan._id.slice(-12).toUpperCase()}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Loan Amount</p>
                    <p className="font-semibold">{formatCurrency(loan.principalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Repayment</p>
                    <p className="font-semibold">{formatCurrency(loan.totalRepayment)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tenure</p>
                    <p className="font-semibold">{loan.tenureDays} days</p>
                  </div>
                </div>
                {loan.status === 'disbursed' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Paid so far</span>
                      <span className="font-medium text-green-600">{formatCurrency(loan.totalPaid)}</span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (loan.totalPaid / loan.totalRepayment) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {loan.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                    <strong>Reason:</strong> {loan.rejectionReason}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-3">Applied on {formatDate(loan.appliedAt)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

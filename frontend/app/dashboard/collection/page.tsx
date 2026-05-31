'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loan, Payment } from '@/types';
import { formatCurrency, formatDate } from '@/lib/loanCalc';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface LoanWithBorrower extends Loan {
  borrowerId: { _id: string; fullName: string; email: string; pan?: string };
  disbursedBy: { fullName: string } | null;
}

interface PaymentForm {
  utrNumber: string;
  amount: string;
  paymentDate: string;
}

export default function CollectionPage() {
  const [loans, setLoans] = useState<LoanWithBorrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithBorrower | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payForm, setPayForm] = useState<PaymentForm>({ utrNumber: '', amount: '', paymentDate: new Date().toISOString().split('T')[0] });
  const [payLoading, setPayLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [payError, setPayError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !['collection', 'admin'].includes(user.role)) { router.push('/dashboard'); return; }
    fetchLoans();
  }, [user, router]);

  const fetchLoans = () => {
    setLoading(true);
    api.get('/ops/collection').then(r => setLoans(r.data.loans)).catch(console.error).finally(() => setLoading(false));
  };

  const openPaymentPanel = async (loan: LoanWithBorrower) => {
    setSelectedLoan(loan);
    setPayError('');
    setPayForm({ utrNumber: '', amount: '', paymentDate: new Date().toISOString().split('T')[0] });
    try {
      const r = await api.get(`/payments/${loan._id}`);
      setPayments(r.data.payments);
    } catch {
      setPayments([]);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRecordPayment = async () => {
    setPayError('');
    if (!payForm.utrNumber.trim() || !payForm.amount || !payForm.paymentDate) {
      setPayError('All fields are required');
      return;
    }
    if (Number(payForm.amount) <= 0) { setPayError('Amount must be positive'); return; }
    setPayLoading(true);
    try {
      const r = await api.post(`/payments/${selectedLoan!._id}`, {
        utrNumber: payForm.utrNumber.trim().toUpperCase(),
        amount: Number(payForm.amount),
        paymentDate: payForm.paymentDate,
      });
      showToast(r.data.message, 'success');
      setPayForm({ utrNumber: '', amount: '', paymentDate: new Date().toISOString().split('T')[0] });
      // Refresh loan data
      const updated = await api.get(`/payments/${selectedLoan!._id}`);
      setPayments(updated.data.payments);
      const updatedLoan = { ...selectedLoan!, ...r.data.loan, borrowerId: selectedLoan!.borrowerId, disbursedBy: selectedLoan!.disbursedBy };
      setSelectedLoan(updatedLoan as LoanWithBorrower);
      fetchLoans();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setPayError(e.response?.data?.message || 'Failed to record payment');
    } finally {
      setPayLoading(false);
    }
  };

  const outstanding = selectedLoan ? selectedLoan.totalRepayment - selectedLoan.totalPaid : 0;

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Collection — Record Payments</h1>
        <p className="text-gray-500 text-sm mt-1">Track disbursed loans and record EMI payments</p>
      </div>

      <div className="flex gap-6">
        {/* Loan List */}
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : loans.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">📭</div>
              <p>No disbursed loans to collect</p>
            </div>
          ) : (
            <div className="space-y-3">
              {loans.map(loan => {
                const outstanding = loan.totalRepayment - loan.totalPaid;
                const progress = Math.min(100, (loan.totalPaid / loan.totalRepayment) * 100);
                const isSelected = selectedLoan?._id === loan._id;
                return (
                  <div
                    key={loan._id}
                    onClick={() => openPaymentPanel(loan)}
                    className={`bg-white border rounded-xl p-5 cursor-pointer transition-all ${isSelected ? 'border-blue-400 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{loan.borrowerId.fullName}</h3>
                        <p className="text-xs text-gray-500">{loan.borrowerId.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${loan.status === 'closed' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                        {loan.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-3">
                      <div><span className="text-gray-400">Principal</span><br /><span className="font-medium">{formatCurrency(loan.principalAmount)}</span></div>
                      <div><span className="text-gray-400">Total Repay</span><br /><span className="font-medium">{formatCurrency(loan.totalRepayment)}</span></div>
                      <div><span className="text-gray-400">Outstanding</span><br /><span className="font-medium text-red-600">{formatCurrency(Math.max(0, outstanding))}</span></div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{progress.toFixed(1)}% paid</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Panel */}
        {selectedLoan && (
          <div className="w-96 shrink-0">
            <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Record Payment</h3>
                <button onClick={() => setSelectedLoan(null)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm mb-4">
                <p className="font-medium text-gray-800">{selectedLoan.borrowerId.fullName}</p>
                <div className="mt-2 space-y-1 text-gray-600">
                  <div className="flex justify-between"><span>Total Repayment</span><span className="font-medium">{formatCurrency(selectedLoan.totalRepayment)}</span></div>
                  <div className="flex justify-between"><span>Total Paid</span><span className="font-medium text-green-600">{formatCurrency(selectedLoan.totalPaid)}</span></div>
                  <div className="flex justify-between border-t border-gray-200 pt-1 mt-1"><span>Outstanding</span><span className="font-bold text-red-600">{formatCurrency(Math.max(0, outstanding))}</span></div>
                </div>
              </div>

              {selectedLoan.status === 'disbursed' && outstanding > 0 && (
                <div className="space-y-3 mb-4">
                  {payError && <p className="text-red-500 text-xs">{payError}</p>}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">UTR Number *</label>
                    <input
                      type="text"
                      value={payForm.utrNumber}
                      onChange={e => setPayForm({ ...payForm, utrNumber: e.target.value.toUpperCase() })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                      placeholder="UNIQUE UTR NUMBER"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹) * — Max: {formatCurrency(outstanding)}</label>
                    <input
                      type="number"
                      value={payForm.amount}
                      onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min={1}
                      max={outstanding}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Payment Date *</label>
                    <input
                      type="date"
                      value={payForm.paymentDate}
                      onChange={e => setPayForm({ ...payForm, paymentDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <button
                    onClick={handleRecordPayment}
                    disabled={payLoading}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {payLoading ? 'Recording...' : 'Record Payment'}
                  </button>
                </div>
              )}

              {selectedLoan.status === 'closed' && (
                <div className="bg-green-50 text-green-700 text-sm text-center py-3 rounded-lg font-medium mb-4">
                  🎉 Loan fully repaid and closed!
                </div>
              )}

              {/* Payment History */}
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Payment History</h4>
                {payments.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">No payments yet</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {payments.map(p => (
                      <div key={p._id} className="bg-gray-50 rounded-lg p-2.5 text-xs">
                        <div className="flex justify-between font-medium">
                          <span className="text-gray-700">{formatCurrency(p.amount)}</span>
                          <span className="text-gray-500">{formatDate(p.paymentDate)}</span>
                        </div>
                        <div className="text-gray-400 mt-0.5">UTR: {p.utrNumber}</div>
                        <div className="text-gray-400">Outstanding after: {formatCurrency(p.outstandingAfter)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

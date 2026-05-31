'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { calculateLoan, formatCurrency } from '@/lib/loanCalc';

export default function LoanConfigPage() {
  const router = useRouter();
  const [principal, setPrincipal] = useState(150000);
  const [tenure, setTenure] = useState(90);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const calc = calculateLoan(principal, tenure);

  const handleApply = async () => {
    setError('');
    setLoading(true);
    try {
      const documentId = localStorage.getItem('lms_docId') || '';
      await api.post('/loans/apply', {
        principalAmount: principal,
        tenureDays: tenure,
        documentId,
      });
      localStorage.removeItem('lms_docId');
      setSuccess(true);
      setTimeout(() => router.push('/apply/status'), 1200);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Application failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Loan Configuration</h2>
        <p className="text-gray-500 text-sm mb-6">Choose your loan amount and repayment tenure.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium">
            ✅ Loan application submitted! Redirecting...
          </div>
        )}

        {/* Loan Amount Slider */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">Loan Amount</label>
            <span className="text-lg font-bold text-blue-600">{formatCurrency(principal)}</span>
          </div>
          <input
            type="range"
            min={50000}
            max={500000}
            step={5000}
            value={principal}
            onChange={e => setPrincipal(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>₹50,000</span>
            <span>₹5,00,000</span>
          </div>
        </div>

        {/* Tenure Slider */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">Tenure</label>
            <span className="text-lg font-bold text-blue-600">{tenure} days</span>
          </div>
          <input
            type="range"
            min={30}
            max={365}
            step={5}
            value={tenure}
            onChange={e => setTenure(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>30 days</span>
            <span>365 days</span>
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Repayment Summary</h3>
          <div className="space-y-2">
            {[
              ['Principal Amount', formatCurrency(calc.principal)],
              ['Interest Rate', `${calc.interestRate}% p.a. (Simple Interest)`],
              ['Tenure', `${calc.tenureDays} days`],
              ['Interest Amount', formatCurrency(calc.simpleInterest)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-600">{label}</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
            <div className="border-t border-blue-200 pt-2 flex justify-between">
              <span className="font-semibold text-gray-800">Total Repayment</span>
              <span className="font-bold text-blue-700 text-lg">{formatCurrency(calc.totalRepayment)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Formula: SI = (P × R × T) / (365 × 100) = ({formatCurrency(principal)} × 12 × {tenure}) / (365 × 100)
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => router.push('/apply/upload')}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={loading || success}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Submitting...' : 'Apply for Loan →'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function PersonalDetailsPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    pan: '',
    dob: '',
    monthlySalary: '',
    employmentMode: '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const fe: Record<string, string> = {};
    if (!form.fullName.trim()) fe.fullName = 'Full name is required';
    if (!form.pan.trim()) fe.pan = 'PAN is required';
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(form.pan.trim())) fe.pan = 'Invalid PAN format (e.g. ABCDE1234F)';
    if (!form.dob) fe.dob = 'Date of birth is required';
    if (!form.monthlySalary) fe.monthlySalary = 'Monthly salary is required';
    else if (Number(form.monthlySalary) <= 0) fe.monthlySalary = 'Enter a valid salary';
    if (!form.employmentMode) fe.employmentMode = 'Employment mode is required';
    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/loans/personal-details', {
        ...form,
        monthlySalary: Number(form.monthlySalary),
      });
      setSuccess(true);
      setTimeout(() => router.push('/apply/upload'), 800);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; breErrors?: string[] } } };
      if (e.response?.data?.breErrors) {
        setErrors(e.response.data.breErrors);
      } else {
        setErrors([e.response?.data?.message || 'Something went wrong']);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Personal Details</h2>
      <p className="text-gray-500 text-sm mb-6">We need a few details to check your eligibility.</p>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-medium text-sm mb-2">❌ Eligibility check failed:</p>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((err, i) => (
              <li key={i} className="text-red-700 text-sm">{err}</li>
            ))}
          </ul>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-6 text-sm font-medium">
          ✅ Eligibility check passed! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={form.fullName}
            onChange={e => setForm({ ...form, fullName: e.target.value })}
            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.fullName ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="As per PAN card"
          />
          {fieldErrors.fullName && <p className="text-red-500 text-xs mt-1">{fieldErrors.fullName}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
            <input
              type="text"
              value={form.pan}
              onChange={e => setForm({ ...form, pan: e.target.value.toUpperCase() })}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.pan ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="ABCDE1234F"
              maxLength={10}
            />
            {fieldErrors.pan && <p className="text-red-500 text-xs mt-1">{fieldErrors.pan}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={form.dob}
              onChange={e => setForm({ ...form, dob: e.target.value })}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.dob ? 'border-red-400' : 'border-gray-300'}`}
              max={new Date().toISOString().split('T')[0]}
            />
            {fieldErrors.dob && <p className="text-red-500 text-xs mt-1">{fieldErrors.dob}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (₹)</label>
            <input
              type="number"
              value={form.monthlySalary}
              onChange={e => setForm({ ...form, monthlySalary: e.target.value })}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.monthlySalary ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="e.g. 50000"
              min={0}
            />
            {fieldErrors.monthlySalary && <p className="text-red-500 text-xs mt-1">{fieldErrors.monthlySalary}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employment Mode</label>
            <select
              value={form.employmentMode}
              onChange={e => setForm({ ...form, employmentMode: e.target.value })}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.employmentMode ? 'border-red-400' : 'border-gray-300'}`}
            >
              <option value="">Select...</option>
              <option value="salaried">Salaried</option>
              <option value="self_employed">Self-Employed</option>
              <option value="unemployed">Unemployed</option>
            </select>
            {fieldErrors.employmentMode && <p className="text-red-500 text-xs mt-1">{fieldErrors.employmentMode}</p>}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          <strong>Eligibility criteria:</strong> Age 23–50 · Salary ≥ ₹25,000/mo · Valid PAN · Employed
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Checking eligibility...' : 'Save & Continue →'}
        </button>
      </form>
    </div>
  );
}

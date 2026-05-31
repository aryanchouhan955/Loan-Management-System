'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatDate } from '@/lib/loanCalc';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface Lead {
  user: {
    id: string;
    fullName: string;
    email: string;
    pan?: string;
    monthlySalary?: number;
    employmentMode?: string;
    personalDetailsSubmitted: boolean;
    createdAt: string;
  };
  loanStatus: string | null;
  loanId: string | null;
}

const loanStatusBadge = (status: string | null) => {
  if (!status) return <span className="text-xs text-gray-400 italic">No application</span>;
  const map: Record<string, string> = {
    applied: 'bg-yellow-100 text-yellow-800',
    sanctioned: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    disbursed: 'bg-purple-100 text-purple-800',
    closed: 'bg-green-100 text-green-800',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status.toUpperCase()}
    </span>
  );
};

export default function SalesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !['sales', 'admin'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }
    api.get('/ops/sales').then(r => setLeads(r.data.leads)).catch(console.error).finally(() => setLoading(false));
  }, [user, router]);

  const filtered = leads.filter(l =>
    l.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
    l.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: leads.length,
    registered: leads.filter(l => !l.loanStatus).length,
    applied: leads.filter(l => l.loanStatus === 'applied').length,
    active: leads.filter(l => ['sanctioned', 'disbursed'].includes(l.loanStatus || '')).length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales — Lead Tracking</h1>
        <p className="text-gray-500 text-sm mt-1">All registered borrowers and their application status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Leads', value: stats.total, color: 'text-gray-800' },
          { label: 'Registered Only', value: stats.registered, color: 'text-gray-500' },
          { label: 'Applied', value: stats.applied, color: 'text-yellow-600' },
          { label: 'Active Loans', value: stats.active, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No leads found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Email', 'PAN', 'Salary', 'Employment', 'Details', 'Loan Status', 'Registered'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(lead => (
                  <tr key={lead.user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{lead.user.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.user.email}</td>
                    <td className="px-4 py-3 font-mono text-gray-600">{lead.user.pan || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {lead.user.monthlySalary ? `₹${lead.user.monthlySalary.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{lead.user.employmentMode?.replace('_', ' ') || '—'}</td>
                    <td className="px-4 py-3">
                      {lead.user.personalDetailsSubmitted
                        ? <span className="text-xs text-green-600 font-medium">✓ Submitted</span>
                        : <span className="text-xs text-gray-400">Pending</span>}
                    </td>
                    <td className="px-4 py-3">{loanStatusBadge(lead.loanStatus)}</td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(lead.user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

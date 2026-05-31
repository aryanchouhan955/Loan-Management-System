'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';

const steps = [
  { label: 'Personal Details', path: '/apply/personal', step: 1 },
  { label: 'Upload Salary Slip', path: '/apply/upload', step: 2 },
  { label: 'Loan Configuration', path: '/apply/config', step: 3 },
];

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'borrower') { router.push('/dashboard'); return; }
  }, [user, isLoading, router]);

  const currentStep = steps.find(s => pathname?.startsWith(s.path))?.step || 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">₹</span>
            </div>
            <span className="font-semibold text-gray-900">LMS</span>
          </div>
          <button
            onClick={() => { localStorage.removeItem('lms_token'); localStorage.removeItem('lms_user'); router.push('/login'); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Step indicator */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.step} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      currentStep > s.step ? 'bg-green-500 text-white' :
                      currentStep === s.step ? 'bg-blue-600 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > s.step ? '✓' : s.step}
                  </div>
                  <span className={`text-sm hidden sm:block ${currentStep === s.step ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 ${currentStep > s.step ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

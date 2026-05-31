export function calculateLoan(principal: number, tenureDays: number, interestRate = 12) {
  const simpleInterest = (principal * interestRate * tenureDays) / (365 * 100);
  const totalRepayment = principal + simpleInterest;
  return {
    principal,
    tenureDays,
    interestRate,
    simpleInterest: Math.round(simpleInterest * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

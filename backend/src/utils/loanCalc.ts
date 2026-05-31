export interface LoanCalcResult {
  principal: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
}

export function calculateLoan(principal: number, tenureDays: number, interestRate = 12): LoanCalcResult {
  // SI = (P × R × T) / (365 × 100)
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

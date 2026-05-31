export type EmploymentMode = 'salaried' | 'self_employed' | 'unemployed';

export interface BREInput {
  dob: Date;
  monthlySalary: number;
  pan: string;
  employmentMode: EmploymentMode;
}

export interface BREResult {
  passed: boolean;
  errors: string[];
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

function getAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function runBRE(input: BREInput): BREResult {
  const errors: string[] = [];

  const age = getAge(new Date(input.dob));
  if (age < 23 || age > 50) {
    errors.push(`Age must be between 23 and 50 years. Your age: ${age}`);
  }

  if (input.monthlySalary < 25000) {
    errors.push(`Monthly salary must be at least ₹25,000. Provided: ₹${input.monthlySalary.toLocaleString('en-IN')}`);
  }

  if (!PAN_REGEX.test(input.pan.toUpperCase())) {
    errors.push('PAN format is invalid. Expected format: AAAAA9999A (5 letters, 4 digits, 1 letter)');
  }

  if (input.employmentMode === 'unemployed') {
    errors.push('Unemployed applicants are not eligible for a loan');
  }

  return { passed: errors.length === 0, errors };
}

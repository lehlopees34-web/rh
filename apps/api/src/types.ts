export type BenefitType = "TRANSPORT" | "HEALTH" | "DENTAL";
export type EmployeeStatus = "ACTIVE" | "VACATION" | "LEAVE" | "DISMISSED";
export type VacationStatus = "SCHEDULED" | "APPROVED" | "TAKEN";
export type TimeBankEntryType = "CREDIT" | "DEBIT";
export type DreCategory =
  | "REVENUE"
  | "VARIABLE_COST"
  | "FIXED_COST"
  | "PERSONNEL_COST"
  | "ADMIN_EXPENSE"
  | "TAX"
  | "OTHER";

export interface Employee {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  admissionDate: string;
  salaryBase: number;
  status: EmployeeStatus;
}

export interface Benefit {
  id: string;
  type: BenefitType;
  name: string;
  monthlyCost: number;
  copay: number;
}

export interface EmployeeBenefit {
  employeeId: string;
  benefitId: string;
  startDate: string;
}

export interface TimeBankEntry {
  id: string;
  employeeId: string;
  date: string;
  minutes: number;
  type: TimeBankEntryType;
  description: string;
}

export interface Vacation {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  days: number;
  status: VacationStatus;
}

export interface PayrollExplanationItem {
  label: string;
  type: "earning" | "deduction" | "info";
  amount: number;
  description: string;
}

export interface PayrollInput {
  employeeId: string;
  nightHours: number;
  overtime50Hours: number;
  overtime100Hours: number;
  dependentsCount: number;
  dependentsDeduction: number;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  baseSalary: number;
  grossSalary: number;
  taxableBase: number;
  nightShiftAmount: number;
  overtime50Amount: number;
  overtime100Amount: number;
  overtimeAmount: number;
  benefitsAmount: number;
  transportVoucherDeduction: number;
  healthPlanDeduction: number;
  dependentsDeduction: number;
  inssDeduction: number;
  irrfDeduction: number;
  deductions: number;
  netSalary: number;
  canExplainPayslip: boolean;
  payslipStatus: "PENDING" | "SIGNED";
  signedAt?: string | null;
  signedIp?: string | null;
  isLocked: boolean;
  explanation: PayrollExplanationItem[];
}

export interface PayslipSignature {
  employeeId: string;
  month: number;
  year: number;
  status: "PENDING" | "SIGNED";
  signedAt: string | null;
  signedIp: string | null;
}

export interface PayslipAccessToken {
  token: string;
  employeeId: string;
  month: number;
  year: number;
  createdAt: string;
  expiresAt: string;
}

export interface PayslipAccessLog {
  token: string;
  employeeId: string;
  month: number;
  year: number;
  viewed: boolean;
  accessedAt: string;
  ip: string | null;
}

export interface DreEntry {
  id: string;
  category: DreCategory;
  description: string;
  amount: number;
  reference: string;
}

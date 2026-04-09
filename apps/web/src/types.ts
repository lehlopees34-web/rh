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
  status: string;
}

export interface CreateEmployeePayload {
  name: string;
  document: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  admissionDate: string;
  salaryBase: number;
  status: string;
}

export interface PayrollExplanationItem {
  label: string;
  type: "earning" | "deduction" | "info";
  amount: number;
  description: string;
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
  employee?: Employee;
}

export interface PayslipExplanationResponse {
  employeeId: string;
  employee?: Employee;
  month: number;
  year: number;
  canExplainPayslip: boolean;
  payslipStatus: "PENDING" | "SIGNED";
  signedAt?: string | null;
  signedIp?: string | null;
  isLocked: boolean;
  summaryText: string;
  exportReady: {
    format: "pdf";
    available: boolean;
    message: string;
  };
  sections: {
    earnings: PayrollExplanationItem[];
    deductions: PayrollExplanationItem[];
    bases: PayrollExplanationItem[];
  };
  explanation: PayrollExplanationItem[];
  record: PayrollRecord;
}

export interface PayslipShareLinkResponse {
  token: string;
  employeeId: string;
  month: number;
  year: number;
  createdAt: string;
  expiresAt: string;
}

export interface TimeBankGroup {
  employeeId: string;
  employeeName: string;
  balanceMinutes: number;
  balanceHours: number;
  entries: Array<{
    id: string;
    date: string;
    minutes: number;
    type: string;
    description: string;
  }>;
}

export interface VacationItem {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  employee?: Employee;
}

export interface BenefitsResponse {
  catalog: Array<{
    id: string;
    type: string;
    name: string;
    monthlyCost: number;
    copay: number;
  }>;
  assignments: Array<{
    employeeId: string;
    employeeName: string;
    benefits: Array<{
      id: string;
      type: string;
      name: string;
      monthlyCost: number;
      copay: number;
    }>;
  }>;
}

export interface DreEntry {
  id: string;
  category: string;
  description: string;
  amount: number;
  reference: string;
}

export interface DreReport {
  entries: DreEntry[];
  summary: {
    grossRevenue: number;
    operatingCosts: number;
    totalPersonnelCost: number;
    personnelSalaries: number;
    personnelCharges: number;
    personnelBenefits: number;
    taxes: number;
    ebitda: number;
    netProfit: number;
    personnelImpactPercent: number;
    marginPercent: number;
  };
}

import {
  Benefit,
  DreEntry,
  Employee,
  EmployeeBenefit,
  PayslipAccessLog,
  PayslipAccessToken,
  PayslipSignature,
  PayrollInput,
  PayrollRecord,
  TimeBankEntry,
  Vacation,
} from "../types.js";

export const employees: Employee[] = [
  {
    id: "emp-001",
    name: "Mariana Souza",
    document: "123.456.789-00",
    email: "mariana.souza@empresa.com",
    phone: "5511998765432",
    role: "Analista de RH",
    department: "Recursos Humanos",
    admissionDate: "2024-02-01",
    salaryBase: 4200,
    status: "ACTIVE",
  },
  {
    id: "emp-002",
    name: "Carlos Lima",
    document: "987.654.321-00",
    email: "carlos.lima@empresa.com",
    phone: "5511987654321",
    role: "Coordenador Financeiro",
    department: "Financeiro",
    admissionDate: "2023-07-15",
    salaryBase: 6800,
    status: "ACTIVE",
  },
  {
    id: "emp-003",
    name: "Ana Beatriz Rocha",
    document: "654.321.987-00",
    email: "ana.rocha@empresa.com",
    phone: "5511976543210",
    role: "Assistente Administrativo",
    department: "Operacoes",
    admissionDate: "2025-01-10",
    salaryBase: 2900,
    status: "VACATION",
  },
];

export const benefits: Benefit[] = [
  { id: "ben-001", type: "TRANSPORT", name: "Vale Transporte", monthlyCost: 320, copay: 6 },
  { id: "ben-002", type: "HEALTH", name: "Plano de Saude Empresarial", monthlyCost: 540, copay: 120 },
  { id: "ben-003", type: "DENTAL", name: "Plano Odontologico", monthlyCost: 80, copay: 20 },
];

export const employeeBenefits: EmployeeBenefit[] = [
  { employeeId: "emp-001", benefitId: "ben-001", startDate: "2024-02-01" },
  { employeeId: "emp-001", benefitId: "ben-002", startDate: "2024-02-01" },
  { employeeId: "emp-002", benefitId: "ben-002", startDate: "2023-07-15" },
  { employeeId: "emp-002", benefitId: "ben-003", startDate: "2023-07-15" },
  { employeeId: "emp-003", benefitId: "ben-001", startDate: "2025-01-10" },
];

export const timeBankEntries: TimeBankEntry[] = [
  {
    id: "tb-001",
    employeeId: "emp-001",
    date: "2026-04-01",
    minutes: 90,
    type: "CREDIT",
    description: "Horas extras em fechamento de folha",
  },
  {
    id: "tb-002",
    employeeId: "emp-002",
    date: "2026-04-03",
    minutes: 45,
    type: "DEBIT",
    description: "Saida antecipada",
  },
  {
    id: "tb-003",
    employeeId: "emp-003",
    date: "2026-03-27",
    minutes: 240,
    type: "CREDIT",
    description: "Cobertura de inventario mensal",
  },
];

export const vacations: Vacation[] = [
  {
    id: "vac-001",
    employeeId: "emp-003",
    startDate: "2026-04-05",
    endDate: "2026-04-24",
    days: 20,
    status: "APPROVED",
  },
  {
    id: "vac-002",
    employeeId: "emp-001",
    startDate: "2026-07-01",
    endDate: "2026-07-10",
    days: 10,
    status: "SCHEDULED",
  },
];

export const payrollInputs: PayrollInput[] = [
  {
    employeeId: "emp-001",
    nightHours: 12,
    overtime50Hours: 8,
    overtime100Hours: 2,
    dependentsCount: 1,
    dependentsDeduction: 280,
  },
  {
    employeeId: "emp-002",
    nightHours: 0,
    overtime50Hours: 4,
    overtime100Hours: 1.5,
    dependentsCount: 2,
    dependentsDeduction: 540,
  },
  {
    employeeId: "emp-003",
    nightHours: 16,
    overtime50Hours: 0,
    overtime100Hours: 0,
    dependentsCount: 0,
    dependentsDeduction: 0,
  },
];

export const dreEntries: DreEntry[] = [
  {
    id: "dre-001",
    category: "REVENUE",
    description: "Receita de servicos",
    amount: 125000,
    reference: "2026-04-01",
  },
  {
    id: "dre-002",
    category: "VARIABLE_COST",
    description: "Comissoes e custos operacionais",
    amount: 21500,
    reference: "2026-04-01",
  },
  {
    id: "dre-003",
    category: "FIXED_COST",
    description: "Folha de pagamento",
    amount: 38200,
    reference: "2026-04-01",
  },
  {
    id: "dre-004",
    category: "ADMIN_EXPENSE",
    description: "Beneficios corporativos",
    amount: 7900,
    reference: "2026-04-01",
  },
  {
    id: "dre-005",
    category: "TAX",
    description: "Impostos sobre faturamento",
    amount: 14300,
    reference: "2026-04-01",
  },
];

export const payslipSignatures: PayslipSignature[] = [];
export const payslipAccessTokens: PayslipAccessToken[] = [];
export const payslipAccessLogs: PayslipAccessLog[] = [];

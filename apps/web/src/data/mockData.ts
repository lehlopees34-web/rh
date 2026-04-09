import { BenefitsResponse, DreReport, Employee, PayrollRecord, PayslipExplanationResponse, TimeBankGroup, VacationItem } from "../types";

export const mockEmployees: Employee[] = [
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
];

export const mockPayroll: PayrollRecord[] = [
  {
    id: "pay-001",
    employeeId: "emp-001",
    month: 4,
    year: 2026,
    baseSalary: 4200,
    grossSalary: 4549.09,
    taxableBase: 4158.37,
    nightShiftAmount: 45.82,
    overtime50Amount: 229.09,
    overtime100Amount: 74.18,
    overtimeAmount: 303.27,
    benefitsAmount: 860,
    transportVoucherDeduction: 252,
    healthPlanDeduction: 32.4,
    dependentsDeduction: 280,
    inssDeduction: 390.72,
    irrfDeduction: 248.59,
    deductions: 1203.71,
    netSalary: 3345.38,
    canExplainPayslip: true,
    payslipStatus: "PENDING",
    signedAt: null,
    signedIp: null,
    isLocked: false,
    employee: mockEmployees[0],
    explanation: [
      {
        label: "Salario Base",
        type: "earning",
        amount: 4200,
        description: "Valor mensal contratado.",
      },
      {
        label: "Adicional Noturno",
        type: "earning",
        amount: 45.82,
        description: "Adicional de 20% calculado sobre as horas noturnas.",
      },
      {
        label: "Hora Extra 50%",
        type: "earning",
        amount: 229.09,
        description: "Horas extras remuneradas com adicional de 50%.",
      },
      {
        label: "Hora Extra 100%",
        type: "earning",
        amount: 74.18,
        description: "Horas extras remuneradas com adicional de 100%.",
      },
      {
        label: "INSS",
        type: "deduction",
        amount: 390.72,
        description: "Contribuicao previdenciaria progressiva.",
      },
    ],
  },
];

export const mockTimeBank: TimeBankGroup[] = [
  {
    employeeId: "emp-001",
    employeeName: "Mariana Souza",
    balanceMinutes: 90,
    balanceHours: 1.5,
    entries: [
      {
        id: "tb-001",
        date: "2026-04-01",
        minutes: 90,
        type: "CREDIT",
        description: "Fechamento da folha",
      },
    ],
  },
];

export const mockVacations: VacationItem[] = [
  {
    id: "vac-001",
    employeeId: "emp-001",
    startDate: "2026-07-01",
    endDate: "2026-07-10",
    days: 10,
    status: "SCHEDULED",
    employee: mockEmployees[0],
  },
];

export const mockBenefits: BenefitsResponse = {
  catalog: [
    {
      id: "ben-001",
      type: "TRANSPORT",
      name: "Vale Transporte",
      monthlyCost: 320,
      copay: 6,
    },
    {
      id: "ben-002",
      type: "HEALTH",
      name: "Plano de Saude",
      monthlyCost: 540,
      copay: 120,
    },
  ],
  assignments: [
    {
      employeeId: "emp-001",
      employeeName: "Mariana Souza",
      benefits: [
        {
          id: "ben-001",
          type: "TRANSPORT",
          name: "Vale Transporte",
          monthlyCost: 320,
          copay: 6,
        },
      ],
    },
  ],
};

export const mockDre: DreReport = {
  entries: [
    {
      id: "dre-001",
      category: "REVENUE",
      description: "Receita de servicos",
      amount: 125000,
      reference: "2026-04-01",
    },
    {
      id: "dre-002",
      category: "FIXED_COST",
      description: "Folha de pagamento",
      amount: 38200,
      reference: "2026-04-01",
    },
  ],
  summary: {
    grossRevenue: 125000,
    operatingCosts: 67600,
    totalPersonnelCost: 15200,
    personnelSalaries: 11000,
    personnelCharges: 303.27,
    personnelBenefits: 3896.73,
    taxes: 14300,
    ebitda: 57400,
    netProfit: 43100,
    personnelImpactPercent: 12.16,
    marginPercent: 34.48,
  },
};

export const mockPayslipExplanation: PayslipExplanationResponse = {
  employeeId: "emp-001",
  employee: mockEmployees[0],
  month: 4,
  year: 2026,
  canExplainPayslip: true,
  payslipStatus: "PENDING",
  signedAt: null,
  signedIp: null,
  isLocked: false,
  summaryText: "Voce recebeu R$ 4.549,09, teve R$ 1.203,71 de descontos e seu liquido foi R$ 3.345,38.",
  exportReady: {
    format: "pdf",
    available: false,
    message: "Estrutura preparada para exportacao futura em PDF.",
  },
  sections: {
    earnings: [
      {
        label: "Salario Base",
        type: "earning",
        amount: 4200,
        description: "Valor mensal contratual do funcionario usado como base da folha: R$ 4200.00.",
      },
      {
        label: "Adicional Noturno",
        type: "earning",
        amount: 45.82,
        description: "12.00h x hora base R$ 19.09 x adicional noturno de 20% = R$ 45.82.",
      },
    ],
    deductions: [
      {
        label: "Vale Transporte",
        type: "deduction",
        amount: 252,
        description: "Desconto de vale transporte calculado em 6% do salario base.",
      },
      {
        label: "INSS",
        type: "deduction",
        amount: 390.72,
        description: "INSS calculado com base na faixa salarial.",
      },
    ],
    bases: [
      {
        label: "Salario Bruto",
        type: "info",
        amount: 4549.09,
        description: "Somatorio de salario base, adicional noturno e horas extras.",
      },
      {
        label: "Base de IRRF",
        type: "info",
        amount: 4158.37,
        description: "Base do IRRF apos desconto de INSS e deducao legal por dependentes.",
      },
    ],
  },
  explanation: mockPayroll[0].explanation,
  record: mockPayroll[0],
};

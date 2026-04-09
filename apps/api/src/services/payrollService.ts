import { benefits, employeeBenefits, payrollInputs } from "../data/sampleData.js";
import { listEmployees } from "../repositories/employeeRepository.js";
import { getPayslipSignature } from "../repositories/payslipSignatureRepository.js";
import { PayrollExplanationItem, PayrollInput, PayrollRecord } from "../types.js";

const MONTHLY_WORKLOAD = 220;
const NIGHT_SHIFT_BONUS_RATE = 0.2;
const TRANSPORT_VOUCHER_DISCOUNT_RATE = 0.06;
const HEALTH_PLAN_DISCOUNT_RATE = 0.06;
const DEPENDENT_IRRF_DEDUCTION = 189.59;

const INSS_BRACKETS_2026 = [
  { limit: 1518, rate: 0.075 },
  { limit: 2793.88, rate: 0.09 },
  { limit: 4190.83, rate: 0.12 },
  { limit: 8157.41, rate: 0.14 },
];

const IRRF_BRACKETS_2026 = [
  { limit: 2428.8, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 182.16 },
  { limit: 3751.05, rate: 0.15, deduction: 394.16 },
  { limit: 4664.68, rate: 0.225, deduction: 675.49 },
  { limit: Number.POSITIVE_INFINITY, rate: 0.275, deduction: 908.73 },
];

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2)}`;
}

function getEmployeeInput(employeeId: string): PayrollInput {
  return (
    payrollInputs.find((input) => input.employeeId === employeeId) ?? {
      employeeId,
      nightHours: 0,
      overtime50Hours: 0,
      overtime100Hours: 0,
      dependentsCount: 0,
      dependentsDeduction: 0,
    }
  );
}

function getBenefitsByEmployee(employeeId: string) {
  return employeeBenefits
    .filter((item) => item.employeeId === employeeId)
    .map((link) => benefits.find((benefit) => benefit.id === link.benefitId))
    .filter(Boolean);
}

function calculateInss(baseAmount: number) {
  let previousLimit = 0;
  let total = 0;

  for (const bracket of INSS_BRACKETS_2026) {
    const taxableSlice = Math.min(baseAmount, bracket.limit) - previousLimit;

    if (taxableSlice > 0) {
      total += taxableSlice * bracket.rate;
      previousLimit = bracket.limit;
    }

    if (baseAmount <= bracket.limit) {
      break;
    }
  }

  return roundCurrency(total);
}

function calculateIrrf(taxableBase: number) {
  if (taxableBase <= 0) {
    return 0;
  }

  const bracket = IRRF_BRACKETS_2026.find((item) => taxableBase <= item.limit) ?? IRRF_BRACKETS_2026[IRRF_BRACKETS_2026.length - 1];
  return roundCurrency(Math.max(0, taxableBase * bracket.rate - bracket.deduction));
}

function getInssBracketDescription(baseAmount: number) {
  let previousLimit = 0;

  return INSS_BRACKETS_2026.map((bracket) => {
    const taxableSlice = Math.min(baseAmount, bracket.limit) - previousLimit;
    const description =
      taxableSlice > 0
        ? `${formatCurrency(taxableSlice)} x ${(bracket.rate * 100).toFixed(1)}%`
        : `${formatCurrency(0)} x ${(bracket.rate * 100).toFixed(1)}%`;

    previousLimit = bracket.limit;
    return description;
  }).join(" + ");
}

export function buildPayrollExplanation(
  record: PayrollRecord,
  context: {
    hourlyRate: number;
    nightHours: number;
    overtime50Hours: number;
    overtime100Hours: number;
    healthPlanValue: number;
    transportPlanValue: number;
    dependentsCount: number;
  },
): PayrollExplanationItem[] {
  return [
    {
      label: "Salario Base",
      type: "earning",
      amount: record.baseSalary,
      description: `Valor mensal contratual do funcionario usado como base da folha: ${formatCurrency(record.baseSalary)}.`,
    },
    {
      label: "Adicional Noturno",
      type: "earning",
      amount: record.nightShiftAmount,
      description: `${context.nightHours.toFixed(2)}h x hora base ${formatCurrency(context.hourlyRate)} x adicional noturno de 20% = ${formatCurrency(record.nightShiftAmount)}.`,
    },
    {
      label: "Hora Extra 50%",
      type: "earning",
      amount: record.overtime50Amount,
      description: `${context.overtime50Hours.toFixed(2)}h x hora base ${formatCurrency(context.hourlyRate)} x 1,5 = ${formatCurrency(record.overtime50Amount)}.`,
    },
    {
      label: "Hora Extra 100%",
      type: "earning",
      amount: record.overtime100Amount,
      description: `${context.overtime100Hours.toFixed(2)}h x hora base ${formatCurrency(context.hourlyRate)} x 2,0 = ${formatCurrency(record.overtime100Amount)}.`,
    },
    {
      label: "Salario Bruto",
      type: "info",
      amount: record.grossSalary,
      description: `Somatorio de salario base, adicional noturno e horas extras: ${formatCurrency(record.grossSalary)}.`,
    },
    {
      label: "Beneficios Concedidos",
      type: "info",
      amount: record.benefitsAmount,
      description: `Valor total dos beneficios vinculados ao funcionario no mes: ${formatCurrency(record.benefitsAmount)}.`,
    },
    {
      label: "Vale Transporte",
      type: "deduction",
      amount: record.transportVoucherDeduction,
      description: `Desconto de vale transporte calculado em 6% do salario base (${formatCurrency(record.baseSalary * TRANSPORT_VOUCHER_DISCOUNT_RATE)}), limitado ao valor do beneficio (${formatCurrency(context.transportPlanValue)}). Resultado: ${formatCurrency(record.transportVoucherDeduction)}.`,
    },
    {
      label: "Plano de Saude",
      type: "deduction",
      amount: record.healthPlanDeduction,
      description: `Desconto de 6% sobre o valor do plano de saude (${formatCurrency(context.healthPlanValue)} x 6%) = ${formatCurrency(record.healthPlanDeduction)}.`,
    },
    {
      label: "Dependentes",
      type: "deduction",
      amount: record.dependentsDeduction,
      description: `Desconto integral configurado para dependentes: ${context.dependentsCount} dependente(s), total lancado de ${formatCurrency(record.dependentsDeduction)}.`,
    },
    {
      label: "INSS",
      type: "deduction",
      amount: record.inssDeduction,
      description: `INSS calculado com base na faixa salarial sobre ${formatCurrency(record.grossSalary)}. Faixas aplicadas: ${getInssBracketDescription(record.grossSalary)}. Total do INSS: ${formatCurrency(record.inssDeduction)}.`,
    },
    {
      label: "Base de IRRF",
      type: "info",
      amount: record.taxableBase,
      description: `Base do IRRF = salario bruto ${formatCurrency(record.grossSalary)} - INSS ${formatCurrency(record.inssDeduction)} - deducao legal por dependentes (${context.dependentsCount} x ${formatCurrency(DEPENDENT_IRRF_DEDUCTION)}). Resultado: ${formatCurrency(record.taxableBase)}.`,
    },
    {
      label: "IRRF",
      type: "deduction",
      amount: record.irrfDeduction,
      description: `IRRF calculado sobre a base de ${formatCurrency(record.taxableBase)} conforme tabela mensal vigente, resultando em ${formatCurrency(record.irrfDeduction)} apos a deducao da faixa.`,
    },
    {
      label: "Total de Descontos",
      type: "info",
      amount: record.deductions,
      description: `Somatorio de vale transporte, plano de saude, dependentes, INSS e IRRF = ${formatCurrency(record.deductions)}.`,
    },
    {
      label: "Liquido a Receber",
      type: "earning",
      amount: record.netSalary,
      description: `Salario liquido = bruto ${formatCurrency(record.grossSalary)} - descontos ${formatCurrency(record.deductions)} = ${formatCurrency(record.netSalary)}.`,
    },
  ];
}

async function generatePayrollRecord(employee: Awaited<ReturnType<typeof listEmployees>>[number], month: number, year: number): Promise<PayrollRecord> {
  const employeeInput = getEmployeeInput(employee.id);
  const linkedBenefits = getBenefitsByEmployee(employee.id);
  const hourlyRate = employee.salaryBase / MONTHLY_WORKLOAD;
  const nightShiftAmount = roundCurrency(employeeInput.nightHours * hourlyRate * NIGHT_SHIFT_BONUS_RATE);
  const overtime50Amount = roundCurrency(employeeInput.overtime50Hours * hourlyRate * 1.5);
  const overtime100Amount = roundCurrency(employeeInput.overtime100Hours * hourlyRate * 2);
  const overtimeAmount = roundCurrency(overtime50Amount + overtime100Amount);
  const grossSalary = roundCurrency(employee.salaryBase + nightShiftAmount + overtimeAmount);
  const healthPlanValue = linkedBenefits
    .filter((benefit) => benefit?.type === "HEALTH")
    .reduce((sum, benefit) => sum + Number(benefit?.monthlyCost ?? 0), 0);
  const benefitsAmount = roundCurrency(linkedBenefits.reduce((sum, benefit) => sum + Number(benefit?.monthlyCost ?? 0), 0));
  const transportPlanValue = linkedBenefits
    .filter((benefit) => benefit?.type === "TRANSPORT")
    .reduce((sum, benefit) => sum + Number(benefit?.monthlyCost ?? 0), 0);
  const transportVoucherDeduction = roundCurrency(
    Math.min(employee.salaryBase * TRANSPORT_VOUCHER_DISCOUNT_RATE, transportPlanValue),
  );
  const healthPlanDeduction = roundCurrency(healthPlanValue * HEALTH_PLAN_DISCOUNT_RATE);
  const dependentsDeduction = roundCurrency(employeeInput.dependentsDeduction);
  const inssDeduction = calculateInss(grossSalary);
  const taxableBase = roundCurrency(
    Math.max(0, grossSalary - inssDeduction - employeeInput.dependentsCount * DEPENDENT_IRRF_DEDUCTION),
  );
  const irrfDeduction = calculateIrrf(taxableBase);
  const deductions = roundCurrency(
    transportVoucherDeduction + healthPlanDeduction + dependentsDeduction + inssDeduction + irrfDeduction,
  );
  const netSalary = roundCurrency(grossSalary - deductions);
  const signature = await getPayslipSignature(employee.id, month, year);

  const record: PayrollRecord = {
    id: `pay-${employee.id}-${year}-${String(month).padStart(2, "0")}`,
    employeeId: employee.id,
    month,
    year,
    baseSalary: employee.salaryBase,
    grossSalary,
    taxableBase,
    nightShiftAmount,
    overtime50Amount,
    overtime100Amount,
    overtimeAmount,
    benefitsAmount,
    transportVoucherDeduction,
    healthPlanDeduction,
    dependentsDeduction,
    inssDeduction,
    irrfDeduction,
    deductions,
    netSalary,
    canExplainPayslip: true,
    payslipStatus: signature?.status ?? "PENDING",
    signedAt: signature?.signedAt ?? null,
    signedIp: signature?.signedIp ?? null,
    isLocked: (signature?.status ?? "PENDING") === "SIGNED",
    explanation: [],
  };

  return {
    ...record,
    explanation: buildPayrollExplanation(record, {
      hourlyRate,
      nightHours: employeeInput.nightHours,
      overtime50Hours: employeeInput.overtime50Hours,
      overtime100Hours: employeeInput.overtime100Hours,
      healthPlanValue,
      transportPlanValue,
      dependentsCount: employeeInput.dependentsCount,
    }),
  };
}

export async function getPayrollSummary(month?: number, year?: number) {
  const now = new Date();
  const payrollMonth = month ?? now.getMonth() + 1;
  const payrollYear = year ?? now.getFullYear();
  const employees = await listEmployees();

  return Promise.all(employees.map(async (employee) => ({
    ...(await generatePayrollRecord(employee, payrollMonth, payrollYear)),
    employee,
  })));
}

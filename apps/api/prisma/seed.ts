import "dotenv/config";
import { BenefitType, DreCategory, EmployeeStatus, PrismaClient, TimeBankEntryType, VacationStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.payslipAccessLog.deleteMany();
  await prisma.payslipAccessToken.deleteMany();
  await prisma.payslipSignature.deleteMany();
  await prisma.employeeBenefit.deleteMany();
  await prisma.timeBankEntry.deleteMany();
  await prisma.vacation.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.benefit.deleteMany();
  await prisma.dreEntry.deleteMany();
  await prisma.employee.deleteMany();

  const mariana = await prisma.employee.create({
    data: {
      name: "Mariana Souza",
      document: "123.456.789-00",
      email: "mariana.souza@empresa.com",
      phone: "5511998765432",
      role: "Analista de RH",
      department: "Recursos Humanos",
      admissionDate: new Date("2024-02-01"),
      salaryBase: 4200,
      status: EmployeeStatus.ACTIVE,
    },
  });

  const carlos = await prisma.employee.create({
    data: {
      name: "Carlos Lima",
      document: "987.654.321-00",
      email: "carlos.lima@empresa.com",
      phone: "5511987654321",
      role: "Coordenador Financeiro",
      department: "Financeiro",
      admissionDate: new Date("2023-07-15"),
      salaryBase: 6800,
      status: EmployeeStatus.ACTIVE,
    },
  });

  const ana = await prisma.employee.create({
    data: {
      name: "Ana Beatriz Rocha",
      document: "654.321.987-00",
      email: "ana.rocha@empresa.com",
      phone: "5511976543210",
      role: "Assistente Administrativo",
      department: "Operacoes",
      admissionDate: new Date("2025-01-10"),
      salaryBase: 2900,
      status: EmployeeStatus.VACATION,
    },
  });

  const transport = await prisma.benefit.create({
    data: {
      type: BenefitType.TRANSPORT,
      name: "Vale Transporte",
      monthlyCost: 320,
      copay: 6,
    },
  });

  const health = await prisma.benefit.create({
    data: {
      type: BenefitType.HEALTH,
      name: "Plano de Saude Empresarial",
      monthlyCost: 540,
      copay: 120,
    },
  });

  const dental = await prisma.benefit.create({
    data: {
      type: BenefitType.DENTAL,
      name: "Plano Odontologico",
      monthlyCost: 80,
      copay: 20,
    },
  });

  await prisma.employeeBenefit.createMany({
    data: [
      { employeeId: mariana.id, benefitId: transport.id, startDate: new Date("2024-02-01") },
      { employeeId: mariana.id, benefitId: health.id, startDate: new Date("2024-02-01") },
      { employeeId: carlos.id, benefitId: health.id, startDate: new Date("2023-07-15") },
      { employeeId: carlos.id, benefitId: dental.id, startDate: new Date("2023-07-15") },
      { employeeId: ana.id, benefitId: transport.id, startDate: new Date("2025-01-10") },
    ],
  });

  await prisma.timeBankEntry.createMany({
    data: [
      {
        employeeId: mariana.id,
        date: new Date("2026-04-01"),
        minutes: 90,
        type: TimeBankEntryType.CREDIT,
        description: "Horas extras em fechamento de folha",
      },
      {
        employeeId: carlos.id,
        date: new Date("2026-04-03"),
        minutes: 45,
        type: TimeBankEntryType.DEBIT,
        description: "Saida antecipada",
      },
    ],
  });

  await prisma.vacation.createMany({
    data: [
      {
        employeeId: ana.id,
        startDate: new Date("2026-04-05"),
        endDate: new Date("2026-04-24"),
        days: 20,
        status: VacationStatus.APPROVED,
      },
      {
        employeeId: mariana.id,
        startDate: new Date("2026-07-01"),
        endDate: new Date("2026-07-10"),
        days: 10,
        status: VacationStatus.SCHEDULED,
      },
    ],
  });

  await prisma.payroll.createMany({
    data: [
      {
        employeeId: mariana.id,
        month: 4,
        year: 2026,
        baseSalary: 4200,
        overtimeAmount: 180,
        benefitsAmount: 860,
        deductions: 640,
        netSalary: 4600,
        explanationJson: JSON.stringify([]),
      },
      {
        employeeId: carlos.id,
        month: 4,
        year: 2026,
        baseSalary: 6800,
        overtimeAmount: 0,
        benefitsAmount: 620,
        deductions: 1210,
        netSalary: 6210,
        explanationJson: JSON.stringify([]),
      },
    ],
  });

  await prisma.dreEntry.createMany({
    data: [
      {
        category: DreCategory.REVENUE,
        description: "Receita de servicos",
        amount: 125000,
        reference: new Date("2026-04-01"),
      },
      {
        category: DreCategory.VARIABLE_COST,
        description: "Comissoes e custos operacionais",
        amount: 21500,
        reference: new Date("2026-04-01"),
      },
      {
        category: DreCategory.FIXED_COST,
        description: "Folha de pagamento",
        amount: 38200,
        reference: new Date("2026-04-01"),
      },
      {
        category: DreCategory.ADMIN_EXPENSE,
        description: "Beneficios corporativos",
        amount: 7900,
        reference: new Date("2026-04-01"),
      },
      {
        category: DreCategory.TAX,
        description: "Impostos sobre faturamento",
        amount: 14300,
        reference: new Date("2026-04-01"),
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

import { dreEntries } from "../data/sampleData.js";
import { getPayrollSummary } from "./payrollService.js";

export async function getDreReport(month?: number, year?: number) {
  const payroll = await getPayrollSummary(month, year);
  const personnelSalaries = payroll.reduce((sum, item) => sum + item.baseSalary, 0);
  const personnelCharges = payroll.reduce(
    (sum, item) => sum + item.nightShiftAmount + item.overtimeAmount,
    0,
  );
  const personnelBenefits = payroll.reduce((sum, item) => sum + item.benefitsAmount, 0);
  const personnelCost = Number((personnelSalaries + personnelCharges + personnelBenefits).toFixed(2));
  const personnelEntry = {
    id: "dre-personnel",
    category: "PERSONNEL_COST" as const,
    description: "Custo com pessoal",
    amount: personnelCost,
    reference: `${year ?? new Date().getFullYear()}-${String(month ?? new Date().getMonth() + 1).padStart(2, "0")}-01`,
  };

  const totals = dreEntries.reduce(
    (acc, entry) => {
      acc[entry.category] += entry.amount;
      return acc;
    },
    {
      REVENUE: 0,
      VARIABLE_COST: 0,
      FIXED_COST: 0,
      PERSONNEL_COST: 0,
      ADMIN_EXPENSE: 0,
      TAX: 0,
      OTHER: 0,
    },
  );

  totals.PERSONNEL_COST += personnelCost;

  const grossRevenue = totals.REVENUE;
  const operatingCosts =
    totals.VARIABLE_COST + totals.FIXED_COST + totals.PERSONNEL_COST + totals.ADMIN_EXPENSE + totals.OTHER;
  const netProfit = grossRevenue - operatingCosts - totals.TAX;
  const ebitda = grossRevenue - operatingCosts;

  return {
    entries: [...dreEntries, personnelEntry],
    summary: {
      grossRevenue,
      operatingCosts,
      totalPersonnelCost: personnelCost,
      personnelSalaries,
      personnelCharges,
      personnelBenefits,
      taxes: totals.TAX,
      ebitda,
      netProfit,
      personnelImpactPercent: grossRevenue > 0 ? Number(((personnelCost / grossRevenue) * 100).toFixed(2)) : 0,
      marginPercent: grossRevenue > 0 ? Number(((netProfit / grossRevenue) * 100).toFixed(2)) : 0,
    },
  };
}

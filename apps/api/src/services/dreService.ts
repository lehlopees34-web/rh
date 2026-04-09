import { benefits, employeeBenefits } from "../data/sampleData.js";
import { getPayrollSummary } from "./payrollService.js";

type DreCmvMode = "MONTHLY" | "WEEKLY" | "WEEKLY_AVERAGE";
type DreItemKind = "automatic" | "manual" | "mixed";
type DreLineVariant = "positive" | "negative" | "neutral";

type DreItem = {
  id: string;
  name: string;
  amount: number;
  source: DreItemKind;
  editable: boolean;
  notes?: string;
  variant?: DreLineVariant;
};

type DreSection = {
  id: string;
  title: string;
  formula: string;
  allowManualEntries: boolean;
  affectsGroupTotal: boolean;
  items: DreItem[];
};

type DreGroup = {
  id: string;
  title: string;
  formula: string;
  total: number;
  percentOfNetRevenue: number;
  variant: DreLineVariant;
  sections: DreSection[];
};

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function getCompetenceFactor(month: number, year: number) {
  const monthFactor = 1 + ((month - 1) % 6) * 0.018;
  const yearFactor = 1 + (year - 2026) * 0.012;
  return monthFactor * yearFactor;
}

function scaleAmount(baseAmount: number, factor: number) {
  return roundCurrency(baseAmount * factor);
}

function buildPercent(amount: number, netRevenue: number) {
  return netRevenue > 0 ? Number(((amount / netRevenue) * 100).toFixed(2)) : 0;
}

function createItem(
  id: string,
  name: string,
  amount: number,
  source: DreItemKind,
  editable: boolean,
  notes?: string,
  variant: DreLineVariant = "negative",
): DreItem {
  return {
    id,
    name,
    amount: roundCurrency(amount),
    source,
    editable,
    notes,
    variant,
  };
}

function sumItems(items: DreItem[]) {
  return roundCurrency(items.reduce((sum, item) => sum + item.amount, 0));
}

function getPreviousCompetence(month: number, year: number) {
  if (month === 1) {
    return { month: 12, year: year - 1 };
  }

  return { month: month - 1, year };
}

function buildMonthlyRevenueItems(month: number, year: number) {
  const factor = getCompetenceFactor(month, year);

  return [
    createItem("rev-cash", "Dinheiro", scaleAmount(18250, factor), "automatic", false, "Recebimentos no caixa da competencia.", "positive"),
    createItem("rev-pix", "PIX / Transferencia", scaleAmount(27600, factor), "automatic", false, "Recebimentos por PIX e transferencia.", "positive"),
    createItem("rev-debit", "Cartao de Debito", scaleAmount(12450, factor), "automatic", false, "Vendas aprovadas em debito.", "positive"),
    createItem("rev-credit", "Cartao de Credito", scaleAmount(24780, factor), "automatic", false, "Vendas aprovadas em credito.", "positive"),
    createItem("rev-marketplace", "Marketplaces / Delivery", scaleAmount(16820, factor), "automatic", false, "Pedidos integrados por marketplace.", "positive"),
    createItem("rev-meal", "Vale Refeicao", scaleAmount(9540, factor), "automatic", false, "Receita recebida em convenios de refeicao.", "positive"),
    createItem("rev-external", "Vendas Externas / Eventos", scaleAmount(6480, factor), "automatic", false, "Eventos e operacoes externas.", "positive"),
    createItem("rev-dark", "Dark Kitchen", scaleAmount(11320, factor), "automatic", false, "Receita da operacao de dark kitchen.", "positive"),
    createItem("rev-fiado", "Fiado", scaleAmount(2140, factor), "manual", true, "Lancamento complementar de vendas a prazo.", "positive"),
    createItem("rev-other", "Outras Receitas", scaleAmount(1380, factor), "manual", true, "Receitas fora do fluxo padrao.", "positive"),
  ];
}

function buildRevenueDeductionItems(month: number, year: number) {
  const factor = getCompetenceFactor(month, year);

  return [
    createItem("ded-service", "Servico 10%", scaleAmount(3920, factor), "manual", true, "Taxa de servico provisionada no periodo."),
    createItem("ded-courtesy", "Cortesias", scaleAmount(820, factor), "manual", true, "Itens concedidos sem cobranca."),
    createItem("ded-partners", "Consumo dos socios", scaleAmount(690, factor), "manual", true, "Consumo interno registrado como deducao."),
    createItem("ded-barter", "Permutas", scaleAmount(340, factor), "manual", true, "Trocas e permutas comerciais."),
    createItem("ded-marketplace-fee", "Taxas de marketplaces", scaleAmount(2660, factor), "automatic", false, "Taxas operacionais descontadas dos pedidos."),
    createItem("ded-reversal", "Estornos / cancelamentos", scaleAmount(540, factor), "automatic", false, "Cancelamentos e estornos efetivados."),
    createItem("ded-tax", "Impostos sobre vendas", scaleAmount(9180, factor), "automatic", false, "Tributos incidentes sobre faturamento."),
  ];
}

function buildCmvCategoryItems(month: number, year: number) {
  const factor = getCompetenceFactor(month, year);

  return [
    createItem("cmv-raw", "Compras de materia-prima", scaleAmount(2250, factor), "automatic", false, "Base consolidada de compras do periodo."),
    createItem("cmv-meat", "Carnes", scaleAmount(11200, factor), "automatic", false),
    createItem("cmv-poultry", "Aves", scaleAmount(3180, factor), "automatic", false),
    createItem("cmv-seafood", "Frutos do mar", scaleAmount(2860, factor), "automatic", false),
    createItem("cmv-horti", "Hortifruti", scaleAmount(4180, factor), "automatic", false),
    createItem("cmv-frozen", "Congelados", scaleAmount(2380, factor), "automatic", false),
    createItem("cmv-dry", "Secos", scaleAmount(3540, factor), "automatic", false),
    createItem("cmv-dairy", "Laticinios e frios", scaleAmount(2890, factor), "automatic", false),
    createItem("cmv-bakery", "Padaria", scaleAmount(1710, factor), "automatic", false),
    createItem("cmv-drinks", "Bebidas", scaleAmount(4420, factor), "automatic", false),
    createItem("cmv-packaging", "Embalagens", scaleAmount(1980, factor), "automatic", false),
  ];
}

function buildWeeklyCmvItems(month: number, year: number) {
  const factor = getCompetenceFactor(month, year);

  return [
    createItem("cmv-week-1", "CMV semanal - Semana 1", scaleAmount(9780, factor), "automatic", false),
    createItem("cmv-week-2", "CMV semanal - Semana 2", scaleAmount(10120, factor), "automatic", false),
    createItem("cmv-week-3", "CMV semanal - Semana 3", scaleAmount(9980, factor), "automatic", false),
    createItem("cmv-week-4", "CMV semanal - Semana 4", scaleAmount(10360, factor), "automatic", false),
  ];
}

function buildOtherVariableCostItems(month: number, year: number) {
  const factor = getCompetenceFactor(month, year);

  return [
    createItem("var-commission", "Comissoes", scaleAmount(2620, factor), "manual", true),
    createItem("var-card", "Taxas de cartao", scaleAmount(2980, factor), "automatic", false),
    createItem("var-bank", "Taxas bancarias ligadas a venda", scaleAmount(460, factor), "automatic", false),
    createItem("var-freight", "Fretes sobre vendas", scaleAmount(1520, factor), "automatic", false),
    createItem("var-discount", "Descontos comerciais", scaleAmount(1180, factor), "manual", true),
  ];
}

function buildAdministrativeItems(month: number, year: number) {
  const factor = getCompetenceFactor(month, year);

  return [
    createItem("adm-accounting", "Contabilidade", scaleAmount(1450, factor), "manual", true),
    createItem("adm-systems", "Sistemas", scaleAmount(880, factor), "manual", true),
    createItem("adm-office", "Material de escritorio", scaleAmount(340, factor), "manual", true),
    createItem("adm-internet", "Internet", scaleAmount(260, factor), "manual", true),
    createItem("adm-phone", "Telefone", scaleAmount(220, factor), "manual", true),
    createItem("adm-prolabore", "Pro-labore administrativo", scaleAmount(3100, factor), "manual", true),
  ];
}

function buildCommercialItems(month: number, year: number) {
  const factor = getCompetenceFactor(month, year);

  return [
    createItem("com-marketing", "Marketing", scaleAmount(1680, factor), "manual", true),
    createItem("com-publicity", "Divulgacao", scaleAmount(920, factor), "manual", true),
    createItem("com-platforms", "Plataformas", scaleAmount(1210, factor), "automatic", false),
    createItem("com-sales-commission", "Comissoes comerciais", scaleAmount(1470, factor), "manual", true),
  ];
}

function buildOccupancyItems(month: number, year: number) {
  const factor = getCompetenceFactor(month, year);

  return [
    createItem("occ-rent", "Aluguel", scaleAmount(7200, factor), "manual", true),
    createItem("occ-condo", "Condominio", scaleAmount(1180, factor), "manual", true),
    createItem("occ-energy", "Energia", scaleAmount(2960, factor), "manual", true),
    createItem("occ-water", "Agua", scaleAmount(620, factor), "manual", true),
    createItem("occ-gas", "Gas", scaleAmount(790, factor), "manual", true),
    createItem("occ-iptu", "IPTU", scaleAmount(480, factor), "manual", true),
    createItem("occ-maintenance", "Manutencao", scaleAmount(930, factor), "manual", true),
  ];
}

function buildGeneralExpenseItems(month: number, year: number) {
  const factor = getCompetenceFactor(month, year);

  return [
    createItem("gen-cleaning", "Limpeza", scaleAmount(840, factor), "manual", true),
    createItem("gen-uniforms", "Uniformes", scaleAmount(380, factor), "manual", true),
    createItem("gen-epi", "EPIs", scaleAmount(260, factor), "manual", true),
    createItem("gen-small", "Pequenas compras", scaleAmount(690, factor), "manual", true),
    createItem("gen-third-party", "Servicos de terceiros", scaleAmount(1870, factor), "manual", true),
  ];
}

function buildFinancialExpenseItems(month: number, year: number) {
  const factor = getCompetenceFactor(month, year);

  return [
    createItem("fin-interest-paid", "Juros pagos", scaleAmount(520, factor), "automatic", false),
    createItem("fin-bank-fees", "Tarifas bancarias", scaleAmount(310, factor), "automatic", false),
    createItem("fin-anticipation", "Antecipacoes", scaleAmount(680, factor), "automatic", false),
  ];
}

function buildFinancialIncomeItems(month: number, year: number) {
  const factor = getCompetenceFactor(month, year);

  return [
    createItem("fin-interest-received", "Juros recebidos", scaleAmount(110, factor), "manual", true, undefined, "positive"),
    createItem("fin-yields", "Rendimentos", scaleAmount(190, factor), "manual", true, undefined, "positive"),
  ];
}

async function buildPersonnelSections(month: number, year: number) {
  const payroll = await getPayrollSummary(month, year);
  const linkedBenefits = employeeBenefits
    .map((link) => {
      const benefit = benefits.find((item) => item.id === link.benefitId);
      return benefit ? { ...benefit, employeeId: link.employeeId } : null;
    })
    .filter(Boolean);

  const salaries = roundCurrency(payroll.reduce((sum, item) => sum + item.baseSalary, 0));
  const overtime = roundCurrency(payroll.reduce((sum, item) => sum + item.overtimeAmount, 0));
  const nightShift = roundCurrency(payroll.reduce((sum, item) => sum + item.nightShiftAmount, 0));
  const employerCharges = roundCurrency(payroll.reduce((sum, item) => sum + item.grossSalary * 0.278, 0));
  const transportCost = roundCurrency(
    linkedBenefits
      .filter((item) => item?.type === "TRANSPORT")
      .reduce((sum, item) => sum + Number(item?.monthlyCost ?? 0), 0),
  );
  const healthCost = roundCurrency(
    linkedBenefits
      .filter((item) => item?.type === "HEALTH")
      .reduce((sum, item) => sum + Number(item?.monthlyCost ?? 0), 0),
  );
  const dentalCost = roundCurrency(
    linkedBenefits
      .filter((item) => item?.type === "DENTAL")
      .reduce((sum, item) => sum + Number(item?.monthlyCost ?? 0), 0),
  );
  const benefitsCost = roundCurrency(transportCost + healthCost + dentalCost);
  const vacationProvision = roundCurrency(payroll.reduce((sum, item) => sum + item.grossSalary / 12, 0));
  const thirteenthProvision = roundCurrency(payroll.reduce((sum, item) => sum + item.grossSalary / 12, 0));

  const payrollSection: DreSection = {
    id: "personnel-payroll",
    title: "Folha e verbas salariais",
    formula: "Base salarial + adicionais + provisoes",
    allowManualEntries: true,
    affectsGroupTotal: true,
    items: [
      createItem("person-salary", "Salarios", salaries, "automatic", false),
      createItem("person-overtime", "Hora extra", overtime, "automatic", false),
      createItem("person-night", "Adicional noturno", nightShift, "automatic", false),
      createItem("person-attendance", "Assiduidade", 0, "manual", true),
      createItem("person-bonus", "Gratificacoes", 0, "manual", true),
      createItem("person-role-shift", "Desvio de funcao", 0, "manual", true),
      createItem("person-vacation-provision", "Ferias provisionadas", vacationProvision, "automatic", false),
      createItem("person-13th-provision", "13o provisionado", thirteenthProvision, "automatic", false),
    ],
  };

  const chargesSection: DreSection = {
    id: "personnel-charges",
    title: "Encargos e beneficios",
    formula: "Encargos patronais + beneficios concedidos",
    allowManualEntries: true,
    affectsGroupTotal: true,
    items: [
      createItem("person-charges", "Encargos", employerCharges, "automatic", false),
      createItem("person-transport", "Vale transporte", transportCost, "automatic", false),
      createItem("person-health", "Plano de saude", healthCost, "automatic", false),
      createItem("person-dental", "Plano odontologico", dentalCost, "automatic", false),
    ],
  };

  return {
    sections: [payrollSection, chargesSection],
    summary: {
      personnelSalaries: salaries,
      personnelCharges: roundCurrency(overtime + nightShift + employerCharges + vacationProvision + thirteenthProvision),
      personnelBenefits: benefitsCost,
    },
  };
}

function buildCmvSections(month: number, year: number, cmvMode: DreCmvMode) {
  const categoryItems = buildCmvCategoryItems(month, year);
  const weeklyItems = buildWeeklyCmvItems(month, year);
  const monthlyCmv = roundCurrency(sumItems(categoryItems) + scaleAmount(580, getCompetenceFactor(month, year)));
  const weeklyCmv = roundCurrency(sumItems(weeklyItems));
  const weeklyAverageCmv = roundCurrency((weeklyCmv / weeklyItems.length) * 4.33);

  const selectedCmv =
    cmvMode === "MONTHLY" ? monthlyCmv : cmvMode === "WEEKLY" ? weeklyCmv : weeklyAverageCmv;

  const categoriesSection: DreSection = {
    id: "cmv-categories",
    title: "Compras e insumos por categoria",
    formula: "Soma das categorias de compras do mes",
    allowManualEntries: true,
    affectsGroupTotal: false,
    items: categoryItems,
  };

  const apportionmentItems =
    cmvMode === "MONTHLY"
      ? [
          createItem("cmv-real", "CMV real por planilha", monthlyCmv, "automatic", false, "Apuracao mensal consolidada conforme configuracao."),
        ]
      : cmvMode === "WEEKLY"
        ? weeklyItems
        : [
            createItem("cmv-weekly-average", "Media do CMV semanal do mes", weeklyAverageCmv, "automatic", false, "Media das semanas fechadas na competencia."),
          ];

  const selectedSection: DreSection = {
    id: "cmv-method",
    title: "Metodo de apuracao do CMV",
    formula:
      cmvMode === "MONTHLY"
        ? "CMV mensal consolidado pela planilha"
        : cmvMode === "WEEKLY"
          ? "Soma das semanas fechadas no mes"
          : "Media semanal multiplicada pela media de semanas do mes",
    allowManualEntries: false,
    affectsGroupTotal: true,
    items: apportionmentItems,
  };

  return {
    sections: [categoriesSection, selectedSection],
    total: selectedCmv,
  };
}

async function buildDreData(month: number, year: number, cmvMode: DreCmvMode) {
  const revenueItems = buildMonthlyRevenueItems(month, year);
  const revenueDeductions = buildRevenueDeductionItems(month, year);
  const revenueTotal = sumItems(revenueItems);
  const deductionTotal = sumItems(revenueDeductions);
  const netRevenue = roundCurrency(revenueTotal - deductionTotal);

  const cmv = buildCmvSections(month, year, cmvMode);
  const otherVariableItems = buildOtherVariableCostItems(month, year);
  const otherVariableTotal = sumItems(otherVariableItems);
  const variableCostTotal = roundCurrency(cmv.total + otherVariableTotal);
  const contributionMargin = roundCurrency(netRevenue - variableCostTotal);

  const personnel = await buildPersonnelSections(month, year);
  const personnelTotal = roundCurrency(
    personnel.sections
      .filter((section) => section.affectsGroupTotal)
      .reduce((sum, section) => sum + sumItems(section.items), 0),
  );

  const administrativeItems = buildAdministrativeItems(month, year);
  const commercialItems = buildCommercialItems(month, year);
  const occupancyItems = buildOccupancyItems(month, year);
  const generalItems = buildGeneralExpenseItems(month, year);
  const administrativeTotal = sumItems(administrativeItems);
  const commercialTotal = sumItems(commercialItems);
  const occupancyTotal = sumItems(occupancyItems);
  const generalTotal = sumItems(generalItems);
  const operationalExpenses = roundCurrency(
    administrativeTotal + commercialTotal + occupancyTotal + generalTotal,
  );

  const ebitda = roundCurrency(contributionMargin - personnelTotal - operationalExpenses);
  const financialExpenses = sumItems(buildFinancialExpenseItems(month, year));
  const financialIncome = sumItems(buildFinancialIncomeItems(month, year));
  const financialResult = roundCurrency(financialIncome - financialExpenses);
  const netProfit = roundCurrency(ebitda + financialResult);

  const groups: DreGroup[] = [
    {
      id: "gross-revenue",
      title: "Receita Bruta de Vendas",
      formula: "Soma de todas as fontes de venda e outras receitas operacionais",
      total: revenueTotal,
      percentOfNetRevenue: buildPercent(revenueTotal, netRevenue),
      variant: "positive",
      sections: [
        {
          id: "revenue-sources",
          title: "Fontes de receita",
          formula: "Soma dos recebimentos por canal",
          allowManualEntries: true,
          affectsGroupTotal: true,
          items: revenueItems,
        },
      ],
    },
    {
      id: "revenue-deductions",
      title: "Deducoes da Receita Bruta",
      formula: "Receita bruta - servico - cortesias - socios - permutas - taxas - impostos",
      total: deductionTotal,
      percentOfNetRevenue: buildPercent(deductionTotal, netRevenue),
      variant: "negative",
      sections: [
        {
          id: "deduction-items",
          title: "Deducoes operacionais e fiscais",
          formula: "Soma das deducoes e abatimentos sobre faturamento",
          allowManualEntries: true,
          affectsGroupTotal: true,
          items: revenueDeductions,
        },
      ],
    },
    {
      id: "variable-costs",
      title: "Custos Variaveis",
      formula: "CMV configurado + outros custos variaveis",
      total: variableCostTotal,
      percentOfNetRevenue: buildPercent(variableCostTotal, netRevenue),
      variant: "negative",
      sections: [
        ...cmv.sections,
        {
          id: "other-variable-costs",
          title: "Outros custos variaveis",
          formula: "Comissoes + taxas + fretes + descontos comerciais",
          allowManualEntries: true,
          affectsGroupTotal: true,
          items: otherVariableItems,
        },
      ],
    },
    {
      id: "personnel-costs",
      title: "Custos com Pessoal",
      formula: "Folha automatica + encargos + beneficios + provisoes",
      total: personnelTotal,
      percentOfNetRevenue: buildPercent(personnelTotal, netRevenue),
      variant: "negative",
      sections: personnel.sections,
    },
    {
      id: "operational-expenses",
      title: "Despesas Operacionais",
      formula: "Administrativas + comerciais + ocupacao + gerais",
      total: operationalExpenses,
      percentOfNetRevenue: buildPercent(operationalExpenses, netRevenue),
      variant: "negative",
      sections: [
        {
          id: "administrative-expenses",
          title: "Despesas Administrativas",
          formula: "Contabilidade + sistemas + escritorio + internet + telefone + pro-labore",
          allowManualEntries: true,
          affectsGroupTotal: true,
          items: administrativeItems,
        },
        {
          id: "commercial-expenses",
          title: "Despesas Comerciais",
          formula: "Marketing + divulgacao + plataformas + comissoes comerciais",
          allowManualEntries: true,
          affectsGroupTotal: true,
          items: commercialItems,
        },
        {
          id: "occupancy-expenses",
          title: "Despesas com Ocupacao",
          formula: "Aluguel + condominio + energia + agua + gas + IPTU + manutencao",
          allowManualEntries: true,
          affectsGroupTotal: true,
          items: occupancyItems,
        },
        {
          id: "general-expenses",
          title: "Despesas Gerais",
          formula: "Limpeza + uniformes + EPIs + pequenas compras + servicos de terceiros",
          allowManualEntries: true,
          affectsGroupTotal: true,
          items: generalItems,
        },
      ],
    },
    {
      id: "financial-result",
      title: "Resultado Financeiro",
      formula: "Receitas financeiras - despesas financeiras",
      total: financialResult,
      percentOfNetRevenue: buildPercent(financialResult, netRevenue),
      variant: financialResult >= 0 ? "positive" : "negative",
      sections: [
        {
          id: "financial-expenses",
          title: "Despesas financeiras",
          formula: "Juros pagos + tarifas + antecipacoes",
          allowManualEntries: true,
          affectsGroupTotal: true,
          items: buildFinancialExpenseItems(month, year),
        },
        {
          id: "financial-income",
          title: "Receitas financeiras",
          formula: "Juros recebidos + rendimentos",
          allowManualEntries: true,
          affectsGroupTotal: false,
          items: buildFinancialIncomeItems(month, year),
        },
      ],
    },
  ];

  return {
    netRevenue,
    summary: {
      grossRevenue: revenueTotal,
      revenueDeductions: deductionTotal,
      netRevenue,
      cmv: cmv.total,
      variableCosts: variableCostTotal,
      contributionMargin,
      totalPersonnelCost: personnelTotal,
      personnelSalaries: personnel.summary.personnelSalaries,
      personnelCharges: personnel.summary.personnelCharges,
      personnelBenefits: personnel.summary.personnelBenefits,
      operationalExpenses,
      ebitda,
      financialResult,
      netProfit,
      marginPercent: buildPercent(netProfit, netRevenue),
    },
    groups,
  };
}

function buildDashboard(summary: Awaited<ReturnType<typeof buildDreData>>["summary"]) {
  return {
    cards: [
      { id: "card-gross", label: "Receita bruta", value: summary.grossRevenue },
      { id: "card-net", label: "Receita liquida", value: summary.netRevenue },
      { id: "card-cmv", label: "CMV", value: summary.cmv },
      { id: "card-contribution", label: "Margem de contribuicao", value: summary.contributionMargin },
      { id: "card-personnel", label: "Custo com pessoal", value: summary.totalPersonnelCost },
      { id: "card-operational", label: "Despesas operacionais", value: summary.operationalExpenses },
      { id: "card-profit", label: "Lucro / prejuizo", value: summary.netProfit },
    ],
  };
}

async function buildMonthlyTrend(month: number, year: number, cmvMode: DreCmvMode) {
  const trend = [];

  for (let currentMonth = 1; currentMonth <= month; currentMonth += 1) {
    const monthData = await buildDreData(currentMonth, year, cmvMode);
    trend.push({
      month: currentMonth,
      year,
      grossRevenue: monthData.summary.grossRevenue,
      netRevenue: monthData.summary.netRevenue,
      cmv: monthData.summary.cmv,
      personnelCost: monthData.summary.totalPersonnelCost,
      netProfit: monthData.summary.netProfit,
    });
  }

  return trend;
}

export async function getDreReport(month?: number, year?: number, cmvMode: DreCmvMode = "MONTHLY") {
  const now = new Date();
  const selectedMonth = month ?? now.getMonth() + 1;
  const selectedYear = year ?? now.getFullYear();
  const current = await buildDreData(selectedMonth, selectedYear, cmvMode);
  const previousCompetence = getPreviousCompetence(selectedMonth, selectedYear);
  const previous = await buildDreData(previousCompetence.month, previousCompetence.year, cmvMode);

  let ytdGrossRevenue = 0;
  let ytdNetRevenue = 0;
  let ytdNetProfit = 0;

  for (let currentMonth = 1; currentMonth <= selectedMonth; currentMonth += 1) {
    const monthData = await buildDreData(currentMonth, selectedYear, cmvMode);
    ytdGrossRevenue += monthData.summary.grossRevenue;
    ytdNetRevenue += monthData.summary.netRevenue;
    ytdNetProfit += monthData.summary.netProfit;
  }

  return {
    competence: {
      month: selectedMonth,
      year: selectedYear,
      label: `${String(selectedMonth).padStart(2, "0")}/${selectedYear}`,
    },
    cmvMode: {
      selected: cmvMode,
      options: [
        { value: "MONTHLY", label: "CMV mensal" },
        { value: "WEEKLY", label: "CMV semanal" },
        { value: "WEEKLY_AVERAGE", label: "Media semanal do mes" },
      ],
    },
    summary: current.summary,
    dashboard: {
      ...buildDashboard(current.summary),
      monthlyTrend: await buildMonthlyTrend(selectedMonth, selectedYear, cmvMode),
    },
    groups: current.groups,
    comparison: {
      previousCompetence: `${String(previousCompetence.month).padStart(2, "0")}/${previousCompetence.year}`,
      grossRevenueDelta: roundCurrency(current.summary.grossRevenue - previous.summary.grossRevenue),
      netRevenueDelta: roundCurrency(current.summary.netRevenue - previous.summary.netRevenue),
      netProfitDelta: roundCurrency(current.summary.netProfit - previous.summary.netProfit),
      currentNetProfit: current.summary.netProfit,
      previousNetProfit: previous.summary.netProfit,
      yearToDateGrossRevenue: roundCurrency(ytdGrossRevenue),
      yearToDateNetRevenue: roundCurrency(ytdNetRevenue),
      yearToDateNetProfit: roundCurrency(ytdNetProfit),
    },
    configuration: {
      allowManualAdjustments: true,
      allowCategoryMapping: true,
      allowSubcategoryEditing: true,
      formulasVisible: true,
      supportsPdfExport: true,
      supportsExcelExport: true,
    },
  };
}

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { AppSidebar, DataToolbar, GlassPanel, HeroBanner, MetricTile, Topbar } from "./components/shell";
import { api } from "./services/api";
import {
  BenefitsResponse,
  CreateEmployeePayload,
  DreReport,
  Employee,
  PayslipExplanationResponse,
  PayrollRecord,
  TimeBankGroup,
  VacationItem,
} from "./types";
import { exportBatchPayslipsPdf, exportPayslipPdf } from "./utils/payslipPdf";

type Section = "home" | "rh" | "dre";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR");

function normalizeInternationalPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("55")) {
    return digits.slice(0, 13);
  }

  return `55${digits}`.slice(0, 13);
}

function formatPhoneForDisplay(value: string) {
  const normalized = normalizeInternationalPhone(value);

  if (!normalized) {
    return "";
  }

  if (normalized.length <= 2) {
    return `+${normalized}`;
  }

  if (normalized.length <= 4) {
    return `+${normalized.slice(0, 2)} ${normalized.slice(2)}`;
  }

  const countryCode = normalized.slice(0, 2);
  const areaCode = normalized.slice(2, 4);
  const localNumber = normalized.slice(4);

  if (localNumber.length <= 4) {
    return `+${countryCode} (${areaCode}) ${localNumber}`;
  }

  if (localNumber.length <= 8) {
    return `+${countryCode} (${areaCode}) ${localNumber.slice(0, 4)}-${localNumber.slice(4)}`;
  }

  return `+${countryCode} (${areaCode}) ${localNumber.slice(0, 5)}-${localNumber.slice(5)}`;
}

function getPublicPayslipUrl(token: string) {
  const url = new URL(`${window.location.origin}/holerite/${token}`);
  return url.toString();
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function formatDelta(value: number) {
  const signal = value > 0 ? "+" : "";
  return `${signal}${currency.format(value)}`;
}

function getSectionMeta(section: Section) {
  if (section === "rh") {
    return {
      eyebrow: "Operacao RH",
      title: "Recursos humanos e folha",
      subtitle: "Cadastros, jornada, beneficios, banco de horas e holerites em uma experiencia mais organizada.",
      breadcrumb: "Sistema / RH",
    };
  }

  if (section === "dre") {
    return {
      eyebrow: "Painel financeiro",
      title: "DRE e performance financeira",
      subtitle: "Visao mensal com estrutura executiva, comparativos e leitura mais clara do resultado.",
      breadcrumb: "Sistema / DRE",
    };
  }

  return {
    eyebrow: "Workspace premium",
    title: "Painel central de gestao",
    subtitle: "Acesso rapido aos modulos, indicadores do periodo e proximos movimentos da operacao.",
    breadcrumb: "Sistema / Visao geral",
  };
}

function SurfaceStatRow({ children }: { children: ReactNode }) {
  return <div className="surface-stat-row">{children}</div>;
}

function ExecutiveBarChart({
  items,
}: {
  items: { label: string; value: number; tone?: "neutral" | "positive" | "accent" }[];
}) {
  const maxValue = Math.max(...items.map((item) => Math.abs(item.value)), 1);

  return (
    <div className="executive-bar-chart">
      {items.map((item) => (
        <div className={`executive-bar-row ${item.tone ?? "neutral"}`} key={item.label}>
          <div className="executive-bar-copy">
            <span>{item.label}</span>
            <strong>{currency.format(item.value)}</strong>
          </div>
          <div className="executive-bar-track">
            <div className="executive-bar-fill" style={{ width: `${Math.max((Math.abs(item.value) / maxValue) * 100, 8)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressInsights({
  items,
}: {
  items: { label: string; valueLabel: string; percent: number }[];
}) {
  return (
    <div className="progress-insights">
      {items.map((item) => (
        <div className="progress-insight-row" key={item.label}>
          <div className="progress-insight-copy">
            <strong>{item.label}</strong>
            <span>{item.valueLabel}</span>
          </div>
          <div className="progress-insight-meter">
            <div className="progress-insight-fill" style={{ width: `${Math.max(6, Math.min(item.percent, 100))}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AppButton({
  children,
  variant = "primary",
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button className={`app-button ${variant}`} onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  );
}

function PublicPayslipPage() {
  const pathMatch = window.location.pathname.match(/^\/holerite\/([^/]+)$/);
  const token = pathMatch?.[1] ?? "";
  const [payslip, setPayslip] = useState<PayslipExplanationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function load() {
      if (!token) {
        setErrorMessage("link invalido ou expirado");
        setLoading(false);
        return;
      }

      const response = await api.getPublicPayslipByToken(token);

      if (!response) {
        setPayslip(null);
        setErrorMessage("link invalido ou expirado");
      } else {
        setPayslip(response);
        setErrorMessage("");
      }

      setLoading(false);
    }

    void load();
  }, [token]);

  if (loading) {
    return <div className="public-payslip-page">Carregando holerite...</div>;
  }

  if (!payslip) {
    return (
      <div className="public-payslip-page">
        <div className="public-payslip-card public-payslip-card-error">
          <p className="eyebrow">Acesso ao holerite</p>
          <h1>Link invalido ou expirado</h1>
          <p>{errorMessage || "Este holerite nao esta mais disponivel por este endereco."}</p>
          <p className="public-payslip-note">Solicite um novo link seguro para visualizar o holerite novamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-payslip-page">
      <div className="public-payslip-card premium-sheet">
        <div className="public-payslip-header">
          <div>
            <p className="eyebrow">Visualizacao online</p>
            <h1>{payslip.employee?.name ?? payslip.employeeId}</h1>
            <p>
              Competencia {String(payslip.month).padStart(2, "0")}/{payslip.year}
            </p>
          </div>
          <span className={payslip.payslipStatus === "SIGNED" ? "status-badge signed" : "status-badge pending"}>
            {payslip.payslipStatus === "SIGNED" ? "Assinado" : "Pendente"}
          </span>
        </div>

        <section className="summary-banner">
          <strong>{payslip.summaryText}</strong>
          <span>
            {payslip.payslipStatus === "SIGNED" && payslip.signedAt
              ? `Assinado digitalmente em ${new Date(payslip.signedAt).toLocaleString("pt-BR")}`
              : "Holerite disponivel para visualizacao online."}
          </span>
        </section>

        <section className="sheet-grid">
          <div className="meta-grid">
            <div className="meta-card">
              <span>Funcionario</span>
              <strong>{payslip.employee?.name}</strong>
            </div>
            <div className="meta-card">
              <span>Cargo</span>
              <strong>{payslip.employee?.role}</strong>
            </div>
            <div className="meta-card">
              <span>Total bruto</span>
              <strong>{currency.format(payslip.record.grossSalary)}</strong>
            </div>
            <div className="meta-card">
              <span>Liquido</span>
              <strong>{currency.format(payslip.record.netSalary)}</strong>
            </div>
          </div>

          <div className="two-column-panels">
            <section className="sheet-panel">
              <h3>Proventos</h3>
              {payslip.sections.earnings.map((item) => (
                <div className="line-item" key={item.label}>
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.description}</p>
                  </div>
                  <span>{currency.format(item.amount)}</span>
                </div>
              ))}
            </section>

            <section className="sheet-panel">
              <h3>Descontos</h3>
              {payslip.sections.deductions.map((item) => (
                <div className="line-item" key={item.label}>
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.description}</p>
                  </div>
                  <span>{currency.format(item.amount)}</span>
                </div>
              ))}
            </section>
          </div>

          <section className="sheet-panel muted">
            <h3>Bases de calculo</h3>
            {payslip.sections.bases.map((item) => (
              <div className="line-item" key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.description}</p>
                </div>
                <span>{currency.format(item.amount)}</span>
              </div>
            ))}
          </section>
        </section>
      </div>
    </div>
  );
}

function MainApp() {
  const today = new Date();
  const initialMonth = today.getMonth() + 1;
  const initialYear = today.getFullYear();
  const emptyEmployeeForm: CreateEmployeePayload = {
    name: "",
    document: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    admissionDate: "",
    salaryBase: 0,
    status: "ACTIVE",
  };

  const [employeeForm, setEmployeeForm] = useState<CreateEmployeePayload>({ ...emptyEmployeeForm });
  const [section, setSection] = useState<Section>("home");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [benefits, setBenefits] = useState<BenefitsResponse | null>(null);
  const [timeBank, setTimeBank] = useState<TimeBankGroup[]>([]);
  const [vacations, setVacations] = useState<VacationItem[]>([]);
  const [dre, setDre] = useState<DreReport | null>(null);
  const [employeeStatusMessage, setEmployeeStatusMessage] = useState("");
  const [isSubmittingEmployee, setIsSubmittingEmployee] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [selectedCompetenceMonth, setSelectedCompetenceMonth] = useState(initialMonth);
  const [selectedCompetenceYear, setSelectedCompetenceYear] = useState(initialYear);
  const [selectedCmvMode, setSelectedCmvMode] = useState<"MONTHLY" | "WEEKLY" | "WEEKLY_AVERAGE">("MONTHLY");
  const [dreView, setDreView] = useState<"table" | "dashboard">("dashboard");
  const [collapsedDreGroups, setCollapsedDreGroups] = useState<Record<string, boolean>>({});
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipExplanationResponse | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [isLoadingPayslip, setIsLoadingPayslip] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingBatchPdf, setIsExportingBatchPdf] = useState(false);
  const [isSigningPayslip, setIsSigningPayslip] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [rhFilter, setRhFilter] = useState<"ALL" | "ACTIVE" | "SIGNED">("ALL");

  useEffect(() => {
    void Promise.all([
      api.getEmployees().then(setEmployees),
      api.getPayroll(selectedCompetenceMonth, selectedCompetenceYear).then(setPayroll),
      api.getBenefits().then(setBenefits),
      api.getTimeBank().then(setTimeBank),
      api.getVacations().then(setVacations),
      api.getDre(selectedCompetenceMonth, selectedCompetenceYear, selectedCmvMode).then(setDre),
    ]);
  }, [selectedCompetenceMonth, selectedCompetenceYear, selectedCmvMode]);

  useEffect(() => {
    async function reloadOpenPayslip() {
      if (!isPayslipModalOpen || !selectedPayslip?.employeeId) {
        return;
      }

      setIsLoadingPayslip(true);

      try {
        const explanation = await api.getPayslipExplanation(
          selectedPayslip.employeeId,
          selectedCompetenceMonth,
          selectedCompetenceYear,
        );
        setSelectedPayslip(explanation);
      } finally {
        setIsLoadingPayslip(false);
      }
    }

    void reloadOpenPayslip();
  }, [isPayslipModalOpen, selectedPayslip?.employeeId, selectedCompetenceMonth, selectedCompetenceYear]);

  const stats = {
    employees: employees.length,
    activePayroll: payroll.length,
    scheduledVacations: vacations.filter((item) => item.status !== "TAKEN").length,
    netProfit: dre?.summary.netProfit ?? 0,
  };

  const competenceLabel = `${String(selectedCompetenceMonth).padStart(2, "0")}/${selectedCompetenceYear}`;
  const sectionMeta = getSectionMeta(section);
  const signedPayrollCount = payroll.filter((item) => item.payslipStatus === "SIGNED").length;
  const pendingPayrollCount = payroll.length - signedPayrollCount;

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch = [employee.name, employee.role, employee.department, employee.email]
        .join(" ")
        .toLowerCase()
        .includes(employeeSearch.toLowerCase());
      const payrollStatus = payroll.find((item) => item.employeeId === employee.id)?.payslipStatus ?? "PENDING";

      if (rhFilter === "ACTIVE" && employee.status !== "ACTIVE") {
        return false;
      }

      if (rhFilter === "SIGNED" && payrollStatus !== "SIGNED") {
        return false;
      }

      return matchesSearch;
    });
  }, [employeeSearch, employees, payroll, rhFilter]);

  async function handleEmployeeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingEmployee(true);
    setEmployeeStatusMessage("");

    try {
      if (editingEmployeeId) {
        const employee = await api.updateEmployee(editingEmployeeId, employeeForm);
        setEmployees((current) => current.map((item) => (item.id === editingEmployeeId ? employee : item)));
        setEmployeeStatusMessage("Funcionario atualizado com sucesso.");
      } else {
        const employee = await api.createEmployee(employeeForm);
        setEmployees((current) => [employee, ...current]);
        setEmployeeStatusMessage("Funcionario cadastrado com sucesso.");
      }

      setEmployeeForm({ ...emptyEmployeeForm });
      setEditingEmployeeId(null);
    } catch (error) {
      setEmployeeStatusMessage(error instanceof Error ? error.message : "Falha ao cadastrar funcionario.");
    } finally {
      setIsSubmittingEmployee(false);
    }
  }

  function handleEditEmployee(employee: Employee) {
    setEditingEmployeeId(employee.id);
    setEmployeeForm({
      name: employee.name,
      document: employee.document,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      department: employee.department,
      admissionDate: employee.admissionDate.slice(0, 10),
      salaryBase: employee.salaryBase,
      status: employee.status,
    });
    setEmployeeStatusMessage("");
  }

  function handleCancelEmployeeEdit() {
    setEditingEmployeeId(null);
    setEmployeeForm({ ...emptyEmployeeForm });
    setEmployeeStatusMessage("");
  }

  async function handleDeleteEmployee(id: string) {
    try {
      await api.deleteEmployee(id);
      setEmployees((current) => current.filter((employee) => employee.id !== id));
      if (editingEmployeeId === id) {
        handleCancelEmployeeEdit();
      }
      setEmployeeStatusMessage("Funcionario removido com sucesso.");
    } catch (error) {
      setEmployeeStatusMessage(error instanceof Error ? error.message : "Falha ao remover funcionario.");
    }
  }

  function getPayrollStatus(employeeId: string) {
    return payroll.find((item) => item.employeeId === employeeId)?.payslipStatus ?? "PENDING";
  }

  async function handleOpenPayslip(employee: Employee) {
    setIsLoadingPayslip(true);
    setIsPayslipModalOpen(true);

    try {
      const explanation = await api.getPayslipExplanation(employee.id, selectedCompetenceMonth, selectedCompetenceYear);
      setSelectedPayslip(explanation);
    } finally {
      setIsLoadingPayslip(false);
    }
  }

  function handleClosePayslip() {
    setIsPayslipModalOpen(false);
    setSelectedPayslip(null);
  }

  async function handleExportCurrentPayslipPdf() {
    if (!selectedPayslip) {
      return;
    }

    setIsExportingPdf(true);

    try {
      exportPayslipPdf(selectedPayslip);
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleExportBatchPdf() {
    setIsExportingBatchPdf(true);

    try {
      const payslips = await Promise.all(
        payroll
          .filter((item) => item.employee)
          .map((item) => api.getPayslipExplanation(item.employeeId, selectedCompetenceMonth, selectedCompetenceYear)),
      );

      exportBatchPayslipsPdf(payslips, competenceLabel);
    } finally {
      setIsExportingBatchPdf(false);
    }
  }

  async function handleSignPayslip() {
    if (!selectedPayslip || selectedPayslip.payslipStatus === "SIGNED") {
      return;
    }

    setIsSigningPayslip(true);

    try {
      await api.signPayslip(selectedPayslip.employeeId, selectedPayslip.month, selectedPayslip.year);
      const refreshed = await api.getPayslipExplanation(
        selectedPayslip.employeeId,
        selectedPayslip.month,
        selectedPayslip.year,
      );
      setSelectedPayslip(refreshed);
      const refreshedPayroll = await api.getPayroll(selectedCompetenceMonth, selectedCompetenceYear);
      setPayroll(refreshedPayroll);
      const refreshedDre = await api.getDre(selectedCompetenceMonth, selectedCompetenceYear, selectedCmvMode);
      setDre(refreshedDre);
    } finally {
      setIsSigningPayslip(false);
    }
  }

  async function handleSendWhatsApp() {
    if (!selectedPayslip) {
      return;
    }

    const phone = normalizeInternationalPhone(selectedPayslip.employee?.phone ?? "");

    if (!phone) {
      window.alert("Este funcionario nao possui telefone cadastrado para envio por WhatsApp.");
      return;
    }

    try {
      const shareLink = await api.createPayslipShareLink(
        selectedPayslip.employeeId,
        selectedPayslip.month,
        selectedPayslip.year,
      );
      const publicPayslipUrl = getPublicPayslipUrl(shareLink.token);

      const message = [
        `Funcionario: ${selectedPayslip.employee?.name ?? selectedPayslip.employeeId}`,
        `Competencia: ${String(selectedPayslip.month).padStart(2, "0")}/${selectedPayslip.year}`,
        `Resumo: ${selectedPayslip.summaryText}`,
        `Holerite: ${publicPayslipUrl}`,
      ].join("\n");

      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    } catch {
      window.alert("Nao foi possivel gerar o link seguro do holerite.");
    }
  }

  function toggleDreGroup(groupId: string) {
    setCollapsedDreGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  }

  const topbarActions =
    section === "home"
      ? [
          { id: "go-rh", label: "Abrir RH", variant: "secondary" as const, onClick: () => setSection("rh") },
          { id: "go-dre", label: "Abrir DRE", variant: "primary" as const, onClick: () => setSection("dre") },
        ]
      : section === "rh"
        ? [
            {
              id: "new-employee",
              label: editingEmployeeId ? "Editando funcionario" : "Novo funcionario",
              variant: "primary" as const,
              onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
            },
          ]
        : [
            {
              id: "toggle-dre",
              label: dreView === "dashboard" ? "Ver tabela DRE" : "Ver dashboard",
              variant: "secondary" as const,
              onClick: () => setDreView((current) => (current === "dashboard" ? "table" : "dashboard")),
            },
          ];

  return (
    <div className="workspace-shell">
      <AppSidebar
        eyebrow="Aura Suite"
        title="Sistema RH + DRE"
        subtitle="Gestao centralizada com visual mais refinado para operacao, pessoas e resultado."
        activeId={section}
        onSelect={(id) => setSection(id as Section)}
        items={[
          { id: "home", label: "Visao geral", description: "Indicadores, atalhos e status do periodo" },
          { id: "rh", label: "Recursos humanos", description: "Cadastros, folha, beneficios e ferias" },
          { id: "dre", label: "Painel DRE", description: "Financeiro, margem e desempenho mensal" },
        ]}
        footer={
          <div className="sidebar-summary">
            <div>
              <span>Funcionarios</span>
              <strong>{stats.employees}</strong>
            </div>
            <div>
              <span>Folhas processadas</span>
              <strong>{stats.activePayroll}</strong>
            </div>
            <div>
              <span>Lucro do periodo</span>
              <strong>{currency.format(stats.netProfit)}</strong>
            </div>
          </div>
        }
      />

      <div className="workspace-main">
        <Topbar
          eyebrow={sectionMeta.eyebrow}
          title={sectionMeta.title}
          subtitle={sectionMeta.subtitle}
          breadcrumb={sectionMeta.breadcrumb}
          actions={topbarActions}
        />

        <main className="workspace-content">
          {section === "home" ? (
            <>
              <div className="dashboard-stage">
                <HeroBanner
                  eyebrow="Workspace"
                  title="Painel executivo com acesso rapido aos modulos"
                  description="Uma experiencia visual mais limpa para acompanhar pessoas, folha e financeiro sem mudar a logica que ja existe no sistema."
                  aside={
                    <div className="hero-summary-card spotlight">
                      <span>Resultado do mes</span>
                      <strong>{currency.format(stats.netProfit)}</strong>
                      <p>Baseado no DRE atual e consolidado com os dados carregados do periodo.</p>
                      <div className="hero-orbit">
                        <div><small>Receita liquida</small><strong>{currency.format(dre?.summary.netRevenue ?? 0)}</strong></div>
                        <div><small>Custo com pessoal</small><strong>{currency.format(dre?.summary.totalPersonnelCost ?? 0)}</strong></div>
                      </div>
                    </div>
                  }
                />

                <div className="dashboard-side-rail">
                  <GlassPanel className="executive-side-card" title="Fluxo do periodo" subtitle="Leitura rapida dos blocos principais do resultado.">
                    <ExecutiveBarChart
                      items={[
                        { label: "Receita liquida", value: dre?.summary.netRevenue ?? 0, tone: "accent" },
                        { label: "Custo com pessoal", value: dre?.summary.totalPersonnelCost ?? 0, tone: "neutral" },
                        { label: "Lucro do periodo", value: dre?.summary.netProfit ?? 0, tone: "positive" },
                      ]}
                    />
                  </GlassPanel>

                  <GlassPanel className="executive-side-card subdued" title="Sinais da operacao" subtitle="Status rapido de pessoas, assinaturas e agenda.">
                    <ProgressInsights
                      items={[
                        {
                          label: "Holerites assinados",
                          valueLabel: `${signedPayrollCount} de ${Math.max(payroll.length, 1)}`,
                          percent: payroll.length ? (signedPayrollCount / payroll.length) * 100 : 0,
                        },
                        {
                          label: "Beneficios ativos",
                          valueLabel: `${benefits?.assignments.length ?? 0} colaboradores`,
                          percent: employees.length ? ((benefits?.assignments.length ?? 0) / employees.length) * 100 : 0,
                        },
                        {
                          label: "Ferias programadas",
                          valueLabel: `${stats.scheduledVacations} registros`,
                          percent: employees.length ? (stats.scheduledVacations / employees.length) * 100 : 0,
                        },
                      ]}
                    />
                  </GlassPanel>
                </div>
              </div>

              <div className="kpi-ribbon">
                <SurfaceStatRow>
                  <MetricTile label="Funcionarios" value={String(stats.employees)} hint="Base ativa no modulo RH" />
                  <MetricTile label="Folhas processadas" value={String(stats.activePayroll)} hint={`Competencia ${competenceLabel}`} />
                  <MetricTile label="Ferias em aberto" value={String(stats.scheduledVacations)} hint="Agendadas ou aprovadas" />
                  <MetricTile label="Lucro / prejuizo" value={currency.format(stats.netProfit)} hint="Visao atual do DRE" />
                </SurfaceStatRow>
              </div>

              <div className="dashboard-lower-grid">
                <GlassPanel
                  className="feature-card feature-card-primary premium-feature-card"
                  title="Recursos humanos"
                  subtitle="Cadastros, jornadas, beneficios e acesso detalhado aos holerites."
                  action={<AppButton variant="primary" onClick={() => setSection("rh")}>Entrar no RH</AppButton>}
                >
                  <div className="feature-stack">
                    <span>{employees.length} funcionarios carregados</span>
                    <span>{pendingPayrollCount} holerites pendentes de assinatura</span>
                    <span>{timeBank.length} saldos no banco de horas</span>
                  </div>
                </GlassPanel>

                <GlassPanel
                  className="feature-card premium-feature-card"
                  title="Financeiro e DRE"
                  subtitle="Leitura mais executiva da performance mensal, margem e comparativos."
                  action={<AppButton variant="secondary" onClick={() => setSection("dre")}>Abrir DRE</AppButton>}
                >
                  <div className="feature-stack">
                    <span>Receita liquida {currency.format(dre?.summary.netRevenue ?? 0)}</span>
                    <span>Custo com pessoal {currency.format(dre?.summary.totalPersonnelCost ?? 0)}</span>
                    <span>Margem liquida {formatPercent(dre?.summary.marginPercent ?? 0)}</span>
                  </div>
                </GlassPanel>

                <GlassPanel className="radar-panel" title="Radar do periodo" subtitle="Leituras rapidas para tomada de decisao">
                  <div className="signal-list">
                    <div className="signal-row">
                      <strong>Folha assinada</strong>
                      <span>{signedPayrollCount} de {payroll.length} holerites</span>
                    </div>
                    <div className="signal-row">
                      <strong>Beneficios ativos</strong>
                      <span>{benefits?.assignments.length ?? 0} colaboradores com beneficios</span>
                    </div>
                    <div className="signal-row">
                      <strong>Controle de ferias</strong>
                      <span>{vacations.length} registros monitorados</span>
                    </div>
                  </div>
                </GlassPanel>

                <GlassPanel className="action-panel" title="Atalhos principais" subtitle="Navegacao mais objetiva para a rotina do dia">
                  <div className="quick-actions">
                    <AppButton variant="secondary" onClick={() => setSection("rh")}>Novo cadastro</AppButton>
                    <AppButton variant="secondary" onClick={() => setSection("rh")}>Abrir folha</AppButton>
                    <AppButton variant="secondary" onClick={() => setSection("dre")}>Painel financeiro</AppButton>
                    <AppButton variant="ghost" onClick={() => setSection("dre")}>Comparar meses</AppButton>
                  </div>
                </GlassPanel>
              </div>
            </>
          ) : null}

          {section === "rh" ? (
            <>
              <HeroBanner
                eyebrow="Recursos humanos"
                title="Operacao de pessoas com visual mais claro e corporativo"
                description="A mesma logica do sistema agora organizada em blocos mais leves, com foco em leitura, acao e acompanhamento da folha."
                aside={
                  <div className="hero-summary-card compact">
                    <span>Competencia atual</span>
                    <strong>{competenceLabel}</strong>
                    <p>{pendingPayrollCount} pendentes e {signedPayrollCount} assinados.</p>
                  </div>
                }
              />

              <div className="kpi-ribbon">
                <SurfaceStatRow>
                  <MetricTile label="Base total" value={String(employees.length)} hint="Colaboradores cadastrados" />
                  <MetricTile label="Folhas pendentes" value={String(pendingPayrollCount)} hint="Aguardando assinatura" />
                  <MetricTile label="Banco de horas" value={String(timeBank.length)} hint="Saldos monitorados" />
                  <MetricTile label="Beneficios ativos" value={String(benefits?.assignments.length ?? 0)} hint="Vinculos em andamento" />
                </SurfaceStatRow>
              </div>

              <div className="content-grid employee-layout">
                <GlassPanel
                  className="form-panel"
                  title={editingEmployeeId ? "Editar funcionario" : "Novo funcionario"}
                  subtitle="Formulario com estrutura mais limpa para cadastro e manutencao."
                >
                  <form className="premium-form" onSubmit={handleEmployeeSubmit}>
                    <div className="form-grid two">
                      <label><span>Nome completo</span><input placeholder="Nome completo" value={employeeForm.name} onChange={(event) => setEmployeeForm((current) => ({ ...current, name: event.target.value }))} required /></label>
                      <label><span>CPF</span><input placeholder="CPF" value={employeeForm.document} onChange={(event) => setEmployeeForm((current) => ({ ...current, document: event.target.value }))} required /></label>
                      <label><span>E-mail</span><input placeholder="E-mail" type="email" value={employeeForm.email} onChange={(event) => setEmployeeForm((current) => ({ ...current, email: event.target.value }))} required /></label>
                      <label><span>Telefone</span><input placeholder="Telefone (+55 DDD numero)" value={formatPhoneForDisplay(employeeForm.phone)} onChange={(event) => setEmployeeForm((current) => ({ ...current, phone: normalizeInternationalPhone(event.target.value) }))} required /></label>
                      <label><span>Cargo</span><input placeholder="Cargo" value={employeeForm.role} onChange={(event) => setEmployeeForm((current) => ({ ...current, role: event.target.value }))} required /></label>
                      <label><span>Departamento</span><input placeholder="Departamento" value={employeeForm.department} onChange={(event) => setEmployeeForm((current) => ({ ...current, department: event.target.value }))} required /></label>
                      <label><span>Data de admissao</span><input type="date" value={employeeForm.admissionDate} onChange={(event) => setEmployeeForm((current) => ({ ...current, admissionDate: event.target.value }))} required /></label>
                      <label><span>Salario base</span><input placeholder="Salario base" type="number" min="0" step="0.01" value={employeeForm.salaryBase || ""} onChange={(event) => setEmployeeForm((current) => ({ ...current, salaryBase: Number(event.target.value) }))} required /></label>
                    </div>

                    <label>
                      <span>Status</span>
                      <select value={employeeForm.status} onChange={(event) => setEmployeeForm((current) => ({ ...current, status: event.target.value }))}>
                        <option value="ACTIVE">Ativo</option>
                        <option value="VACATION">Ferias</option>
                        <option value="LEAVE">Afastado</option>
                        <option value="DISMISSED">Desligado</option>
                      </select>
                    </label>

                    <div className="form-actions">
                      <AppButton type="submit" disabled={isSubmittingEmployee}>
                        {isSubmittingEmployee ? "Salvando..." : editingEmployeeId ? "Salvar alteracoes" : "Cadastrar funcionario"}
                      </AppButton>
                      {editingEmployeeId ? <AppButton variant="ghost" onClick={handleCancelEmployeeEdit}>Cancelar edicao</AppButton> : null}
                    </div>

                    {employeeStatusMessage ? <p className="status-message">{employeeStatusMessage}</p> : null}
                  </form>
                </GlassPanel>

                <div className="employee-side-stack">
                  <GlassPanel title="Equipe" subtitle="Busca, filtro e acoes principais da base de colaboradores." action={<span className="panel-counter">{filteredEmployees.length} resultado(s)</span>}>
                    <DataToolbar>
                      <input placeholder="Buscar por nome, cargo, departamento ou e-mail" value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} />
                      <select value={rhFilter} onChange={(event) => setRhFilter(event.target.value as "ALL" | "ACTIVE" | "SIGNED")}>
                        <option value="ALL">Todos</option>
                        <option value="ACTIVE">Somente ativos</option>
                        <option value="SIGNED">Holerite assinado</option>
                      </select>
                    </DataToolbar>

                    <div className="data-table employee-table">
                      <div className="data-table-head">
                        <span>Colaborador</span>
                        <span>Status</span>
                        <span>Contato</span>
                        <span>Acoes</span>
                      </div>
                      {filteredEmployees.map((employee) => {
                        const payrollStatus = getPayrollStatus(employee.id);
                        return (
                          <div className="data-row" key={employee.id}>
                            <div className="row-main">
                              <strong>{employee.name}</strong>
                              <span>{employee.role} - {employee.department}</span>
                            </div>
                            <div className="row-status">
                              <span className={payrollStatus === "SIGNED" ? "status-badge signed" : "status-badge pending"}>{payrollStatus === "SIGNED" ? "Assinado" : employee.status === "ACTIVE" ? "Ativo" : employee.status}</span>
                            </div>
                            <div className="row-contact">
                              <span>{employee.email}</span>
                              <span>{formatPhoneForDisplay(employee.phone)}</span>
                            </div>
                            <div className="row-actions">
                              <AppButton variant="ghost" onClick={() => handleEditEmployee(employee)} disabled={getPayrollStatus(employee.id) === "SIGNED"}>Editar</AppButton>
                              <AppButton variant="secondary" onClick={() => void handleOpenPayslip(employee)}>Holerite</AppButton>
                              <AppButton variant="danger" onClick={() => void handleDeleteEmployee(employee.id)}>Excluir</AppButton>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </GlassPanel>

                  <div className="content-grid two">
                    <GlassPanel title="Banco de horas" subtitle="Leitura resumida do saldo atual">
                      <div className="mini-list">
                        {timeBank.map((item) => (
                          <div className="mini-list-row" key={item.employeeId}>
                            <div><strong>{item.employeeName}</strong><span>Ultimo ajuste registrado no modulo</span></div>
                            <strong>{item.balanceHours} h</strong>
                          </div>
                        ))}
                      </div>
                    </GlassPanel>

                    <GlassPanel title="Ferias" subtitle="Agenda consolidada do periodo">
                      <div className="mini-list">
                        {vacations.map((vacation) => (
                          <div className="mini-list-row" key={vacation.id}>
                            <div><strong>{vacation.employee?.name ?? vacation.employeeId}</strong><span>{dateFormatter.format(new Date(vacation.startDate))} ate {dateFormatter.format(new Date(vacation.endDate))}</span></div>
                            <strong>{vacation.days} dias</strong>
                          </div>
                        ))}
                      </div>
                    </GlassPanel>
                  </div>
                </div>
              </div>

              <GlassPanel
                className="payroll-command-panel"
                title="Folha da competencia"
                subtitle="Resumo da folha automatizada com destaque para status, liquido e acoes de acesso."
                action={
                  <DataToolbar>
                    <select value={selectedCompetenceMonth} onChange={(event) => setSelectedCompetenceMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{String(index + 1).padStart(2, "0")}</option>)}</select>
                    <select value={selectedCompetenceYear} onChange={(event) => setSelectedCompetenceYear(Number(event.target.value))}>{[initialYear - 1, initialYear, initialYear + 1].map((year) => <option key={year} value={year}>{year}</option>)}</select>
                    <AppButton variant="secondary" onClick={() => void handleExportBatchPdf()} disabled={isExportingBatchPdf}>{isExportingBatchPdf ? "Gerando PDFs..." : "Exportar competencia"}</AppButton>
                  </DataToolbar>
                }
              >
                <div className="kpi-ribbon compact">
                  <SurfaceStatRow>
                    <MetricTile label="Competencia" value={competenceLabel} hint="Periodo em destaque" />
                    <MetricTile label="Pendentes" value={String(pendingPayrollCount)} hint="Aguardando assinatura" />
                    <MetricTile label="Assinados" value={String(signedPayrollCount)} hint="Ja concluidos" />
                    <MetricTile label="Liquido medio" value={currency.format(payroll.length ? payroll.reduce((sum, item) => sum + item.netSalary, 0) / payroll.length : 0)} hint="Baseado nos holerites carregados" />
                  </SurfaceStatRow>
                </div>

                <div className="payroll-board">
                  {payroll.map((item) => (
                    <article className="payroll-card" key={item.id}>
                      <div className="payroll-card-head">
                        <div><strong>{item.employee?.name ?? item.employeeId}</strong><span>{item.employee?.role ?? "Funcionario"} - {competenceLabel}</span></div>
                        <span className={item.payslipStatus === "SIGNED" ? "status-badge signed" : "status-badge pending"}>{item.payslipStatus === "SIGNED" ? "Assinado" : "Pendente"}</span>
                      </div>
                      <div className="payroll-card-metrics">
                        <div><span>Bruto</span><strong>{currency.format(item.grossSalary)}</strong></div>
                        <div><span>Descontos</span><strong>{currency.format(item.deductions)}</strong></div>
                        <div><span>Liquido</span><strong>{currency.format(item.netSalary)}</strong></div>
                      </div>
                      <div className="payroll-card-actions">
                        <AppButton variant="secondary" onClick={() => item.employee && void handleOpenPayslip(item.employee)}>Explicar holerite</AppButton>
                      </div>
                    </article>
                  ))}
                </div>
              </GlassPanel>

              <div className="content-grid two">
                <GlassPanel title="Leitura do holerite" subtitle="Explicacoes automaticas e referencia rapida da folha">
                  {payroll[0] ? (
                    <div className="sheet-preview">
                      <div className="sheet-highlight-row">
                        <div><span>Bruto</span><strong>{currency.format(payroll[0].grossSalary)}</strong></div>
                        <div><span>Base IRRF</span><strong>{currency.format(payroll[0].taxableBase)}</strong></div>
                        <div><span>Descontos</span><strong>{currency.format(payroll[0].deductions)}</strong></div>
                      </div>
                      {payroll[0].explanation.map((line) => (
                        <div className={`sheet-line explanation-${line.type}`} key={line.label}>
                          <div><strong>{line.label}</strong><p>{line.description}</p></div>
                          <span>{currency.format(line.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-copy">Nenhum holerite disponivel na competencia selecionada.</p>
                  )}
                </GlassPanel>

                <GlassPanel title="Beneficios ativos" subtitle="Visao consolidada por colaborador">
                  <div className="mini-list">
                    {benefits?.assignments.map((assignment) => (
                      <div className="mini-list-row" key={assignment.employeeId}>
                        <div><strong>{assignment.employeeName}</strong><span>{assignment.benefits.map((benefit) => benefit.name).join(" - ")}</span></div>
                        <strong>{currency.format(assignment.benefits.reduce((sum, benefit) => sum + benefit.monthlyCost, 0))}</strong>
                      </div>
                    ))}
                  </div>
                </GlassPanel>
              </div>
            </>
          ) : null}

          {section === "dre" && dre ? (
            <>
              <HeroBanner
                eyebrow="Painel DRE"
                title="Leitura financeira com cara de sistema executivo"
                description="A logica atual foi preservada, mas a apresentacao agora prioriza hierarquia visual, comparativos e clareza para tomada de decisao."
                aside={<div className="hero-summary-card compact"><span>Competencia</span><strong>{dre.competence.label}</strong><p>Modo do CMV: {dre.cmvMode.options.find((option) => option.value === dre.cmvMode.selected)?.label}</p></div>}
              />

              <GlassPanel className="dre-controls-panel" title="Controles do painel" subtitle="Escolha competencia, modo de CMV e alternancia visual do DRE.">
                <DataToolbar>
                  <select value={selectedCompetenceMonth} onChange={(event) => setSelectedCompetenceMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{String(index + 1).padStart(2, "0")}</option>)}</select>
                  <select value={selectedCompetenceYear} onChange={(event) => setSelectedCompetenceYear(Number(event.target.value))}>{[initialYear - 1, initialYear, initialYear + 1].map((year) => <option key={year} value={year}>{year}</option>)}</select>
                  <select value={selectedCmvMode} onChange={(event) => setSelectedCmvMode(event.target.value as "MONTHLY" | "WEEKLY" | "WEEKLY_AVERAGE")}>{dre.cmvMode.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                  <div className="segmented-control">
                    <button className={dreView === "dashboard" ? "active" : ""} onClick={() => setDreView("dashboard")} type="button">Dashboard</button>
                    <button className={dreView === "table" ? "active" : ""} onClick={() => setDreView("table")} type="button">Tabela</button>
                  </div>
                </DataToolbar>
              </GlassPanel>

              <div className="finance-stage">
                <GlassPanel className="finance-spotlight" title="Resumo executivo do resultado" subtitle="Leitura central do mes com foco em margem, estrutura de custo e lucro.">
                  <div className="finance-spotlight-grid">
                    <div className="finance-primary-number">
                      <span>Lucro / prejuizo</span>
                      <strong>{currency.format(dre.summary.netProfit)}</strong>
                      <small>Margem {formatPercent(dre.summary.marginPercent)}</small>
                    </div>
                    <ExecutiveBarChart
                      items={[
                        { label: "Receita bruta", value: dre.summary.grossRevenue, tone: "accent" },
                        { label: "Receita liquida", value: dre.summary.netRevenue, tone: "accent" },
                        { label: "CMV", value: dre.summary.cmv, tone: "neutral" },
                        { label: "Pessoal", value: dre.summary.totalPersonnelCost, tone: "neutral" },
                        { label: "Resultado", value: dre.summary.netProfit, tone: "positive" },
                      ]}
                    />
                  </div>
                </GlassPanel>

                <div className="finance-side-stack">
                  <GlassPanel className="finance-side-card" title="Comparativo mensal" subtitle="Visao sintetica da evolucao do resultado">
                    <div className="mini-stat-grid">
                      <div className="mini-stat-card"><span>Competencia anterior</span><strong>{dre.comparison.previousCompetence}</strong></div>
                      <div className="mini-stat-card"><span>Delta receita liquida</span><strong>{formatDelta(dre.comparison.netRevenueDelta)}</strong></div>
                      <div className="mini-stat-card"><span>Delta lucro</span><strong>{formatDelta(dre.comparison.netProfitDelta)}</strong></div>
                      <div className="mini-stat-card"><span>Lucro acumulado no ano</span><strong>{currency.format(dre.comparison.yearToDateNetProfit)}</strong></div>
                    </div>
                  </GlassPanel>

                  <GlassPanel className="finance-side-card" title="Indicadores-chave" subtitle="Peso de cada bloco sobre a receita liquida">
                    <div className="signal-list">
                      <div className="signal-row"><strong>Deducoes da receita</strong><span>{currency.format(dre.summary.revenueDeductions)}</span></div>
                      <div className="signal-row"><strong>Custo com pessoal</strong><span>{currency.format(dre.summary.totalPersonnelCost)}</span></div>
                      <div className="signal-row"><strong>Despesas operacionais</strong><span>{currency.format(dre.summary.operationalExpenses)}</span></div>
                      <div className="signal-row"><strong>Resultado financeiro</strong><span>{currency.format(dre.summary.financialResult)}</span></div>
                    </div>
                  </GlassPanel>
                </div>
              </div>

              <div className="kpi-ribbon">
                <SurfaceStatRow>
                  <MetricTile label="Receita bruta" value={currency.format(dre.summary.grossRevenue)} hint="Faturamento total do periodo" />
                  <MetricTile label="Receita liquida" value={currency.format(dre.summary.netRevenue)} hint="Apos deducoes" />
                  <MetricTile label="CMV" value={currency.format(dre.summary.cmv)} hint="Configurado para o periodo" />
                  <MetricTile label="Margem de contribuicao" value={currency.format(dre.summary.contributionMargin)} hint="Receita liquida menos variaveis" />
                  <MetricTile label="Lucro / prejuizo" value={currency.format(dre.summary.netProfit)} hint={`Margem ${formatPercent(dre.summary.marginPercent)}`} />
                </SurfaceStatRow>
              </div>

              {dreView === "dashboard" ? (
                <>
                  <div className="dashboard-finance-grid">
                    {dre.dashboard.cards.map((card) => (
                      <GlassPanel key={card.id} className="metric-panel" title={card.label}>
                        <strong className="dashboard-card-value">{currency.format(card.value)}</strong>
                      </GlassPanel>
                    ))}
                  </div>

                  <div className="finance-dashboard-lower">
                    <GlassPanel className="trend-panel" title="Evolucao mensal" subtitle="Linha do tempo compacta do desempenho mensal">
                      <div className="timeline-list">
                        {dre.dashboard.monthlyTrend.map((point) => (
                          <div className="timeline-row" key={`${point.year}-${point.month}`}>
                            <div><strong>{String(point.month).padStart(2, "0")}/{point.year}</strong><span>Receita liquida {currency.format(point.netRevenue)}</span></div>
                            <div><span>CMV {currency.format(point.cmv)}</span><span>Pessoal {currency.format(point.personnelCost)}</span><strong>{currency.format(point.netProfit)}</strong></div>
                          </div>
                        ))}
                      </div>
                    </GlassPanel>

                    <GlassPanel className="trend-panel visual" title="Ritmo do ano" subtitle="Leitura visual da performance mensal">
                      <ExecutiveBarChart
                        items={dre.dashboard.monthlyTrend.map((point) => ({
                          label: `${String(point.month).padStart(2, "0")}/${String(point.year).slice(-2)}`,
                          value: point.netProfit,
                          tone: point.netProfit >= 0 ? "positive" : "neutral",
                        }))}
                      />
                    </GlassPanel>
                  </div>
                </>
              ) : (
                <GlassPanel title="Estrutura do DRE" subtitle="Grupos com subtotais, formulas e percentual sobre receita liquida">
                  <div className="dre-panel-list">
                    {dre.groups.map((group) => {
                      const isCollapsed = collapsedDreGroups[group.id] ?? false;
                      return (
                        <article className="dre-panel" key={group.id}>
                          <button className="dre-panel-header" onClick={() => toggleDreGroup(group.id)} type="button">
                            <div><strong>{group.title}</strong><span>{group.formula}</span></div>
                            <div className="dre-panel-total"><strong>{currency.format(group.total)}</strong><span>{formatPercent(group.percentOfNetRevenue)}</span><small>{isCollapsed ? "Expandir" : "Recolher"}</small></div>
                          </button>
                          {!isCollapsed ? (
                            <div className="dre-panel-body">
                              {group.sections.map((groupSection) => {
                                const sectionTotal = groupSection.items.reduce((sum, item) => sum + item.amount, 0);
                                return (
                                  <section className="dre-subpanel" key={groupSection.id}>
                                    <div className="dre-subpanel-head">
                                      <div><strong>{groupSection.title}</strong><span>{groupSection.formula}</span></div>
                                      <div className="dre-subpanel-total"><span>{groupSection.allowManualEntries ? "Aceita ajuste manual" : "Automatico"}</span><strong>{currency.format(sectionTotal)}</strong></div>
                                    </div>
                                    <div className="professional-table">
                                      <div className="professional-table-head"><span>Subcategoria</span><span>Origem</span><span>Valor</span><span>% receita liquida</span></div>
                                      {groupSection.items.map((item) => (
                                        <div className="professional-table-row" key={item.id}>
                                          <div><strong>{item.name}</strong><span>{item.notes ?? "Sem observacao complementar."}</span></div>
                                          <span>{item.source === "automatic" ? "Automatico" : item.source === "manual" ? "Manual" : "Misto"}</span>
                                          <strong>{currency.format(item.amount)}</strong>
                                          <span>{formatPercent(dre.summary.netRevenue > 0 ? (item.amount / dre.summary.netRevenue) * 100 : 0)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </section>
                                );
                              })}
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </GlassPanel>
              )}
            </>
          ) : null}
        </main>
      </div>

      {isPayslipModalOpen ? (
        <div className="modal-overlay" onClick={handleClosePayslip}>
          <div className="payslip-modal premium-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header premium-modal-header">
              <div>
                <p className="eyebrow">Holerite detalhado</p>
                <h2>{selectedPayslip?.employee?.name ?? "Funcionario"}</h2>
                <p>Competencia {competenceLabel}</p>
                <span className={selectedPayslip?.payslipStatus === "SIGNED" ? "status-badge signed" : "status-badge pending"}>{selectedPayslip?.payslipStatus === "SIGNED" ? "Assinado" : "Pendente"}</span>
              </div>
              <div className="modal-actions">
                <div className="compact-controls">
                  <select value={selectedCompetenceMonth} onChange={(event) => setSelectedCompetenceMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{String(index + 1).padStart(2, "0")}</option>)}</select>
                  <select value={selectedCompetenceYear} onChange={(event) => setSelectedCompetenceYear(Number(event.target.value))}>{[initialYear - 1, initialYear, initialYear + 1].map((year) => <option key={year} value={year}>{year}</option>)}</select>
                </div>
                <AppButton variant="secondary" onClick={() => void handleExportCurrentPayslipPdf()} disabled={isExportingPdf || !selectedPayslip}>{isExportingPdf ? "Gerando PDF..." : "Exportar PDF"}</AppButton>
                <AppButton variant="secondary" onClick={handleSendWhatsApp} disabled={!selectedPayslip}>Enviar por WhatsApp</AppButton>
                <AppButton variant="primary" onClick={() => void handleSignPayslip()} disabled={!selectedPayslip || selectedPayslip.payslipStatus === "SIGNED" || isSigningPayslip}>{selectedPayslip?.payslipStatus === "SIGNED" ? "Holerite assinado" : isSigningPayslip ? "Assinando..." : "Assinar"}</AppButton>
                <AppButton variant="ghost" onClick={handleClosePayslip}>Fechar</AppButton>
              </div>
            </div>

            {isLoadingPayslip || !selectedPayslip ? (
              <div className="modal-loading">Carregando holerite...</div>
            ) : (
              <div className="payslip-sheet">
                <section className="summary-banner">
                  <strong>{selectedPayslip.summaryText}</strong>
                  <span>{selectedPayslip.exportReady.message}</span>
                  <span>
                    {selectedPayslip.payslipStatus === "SIGNED" && selectedPayslip.signedAt
                      ? `Assinado digitalmente em ${dateFormatter.format(new Date(selectedPayslip.signedAt))} as ${new Date(selectedPayslip.signedAt).toLocaleTimeString("pt-BR")}${selectedPayslip.signedIp ? ` | IP ${selectedPayslip.signedIp}` : ""}`
                      : "Holerite pendente de assinatura."}
                  </span>
                </section>

                <section className="sheet-grid">
                  <div className="meta-grid">
                    <div className="meta-card"><span>Funcionario</span><strong>{selectedPayslip.employee?.name}</strong></div>
                    <div className="meta-card"><span>Cargo</span><strong>{selectedPayslip.employee?.role}</strong></div>
                    <div className="meta-card"><span>Competencia</span><strong>{String(selectedPayslip.month).padStart(2, "0")}/{selectedPayslip.year}</strong></div>
                    <div className="meta-card"><span>Salario liquido</span><strong>{currency.format(selectedPayslip.record.netSalary)}</strong></div>
                  </div>

                  <div className="two-column-panels">
                    <section className="sheet-panel">
                      <h3>Proventos</h3>
                      {selectedPayslip.sections.earnings.map((item) => (
                        <div className="line-item" key={item.label}>
                          <div><strong>{item.label}</strong><p>{item.description}</p></div>
                          <span>{currency.format(item.amount)}</span>
                        </div>
                      ))}
                    </section>

                    <section className="sheet-panel">
                      <h3>Descontos</h3>
                      {selectedPayslip.sections.deductions.map((item) => (
                        <div className="line-item" key={item.label}>
                          <div><strong>{item.label}</strong><p>{item.description}</p></div>
                          <span>{currency.format(item.amount)}</span>
                        </div>
                      ))}
                    </section>
                  </div>

                  <section className="sheet-panel muted">
                    <h3>Bases de calculo</h3>
                    {selectedPayslip.sections.bases.map((item) => (
                      <div className="line-item" key={item.label}>
                        <div><strong>{item.label}</strong><p>{item.description}</p></div>
                        <span>{currency.format(item.amount)}</span>
                      </div>
                    ))}
                  </section>

                  <section className="sheet-panel soft-accent">
                    <h3>Totais do Holerite</h3>
                    <div className="line-item"><div><strong>Total bruto</strong><p>Total de proventos antes dos descontos.</p></div><span>{currency.format(selectedPayslip.record.grossSalary)}</span></div>
                    <div className="line-item"><div><strong>Total de descontos</strong><p>Soma de todos os descontos aplicados na competencia.</p></div><span>{currency.format(selectedPayslip.record.deductions)}</span></div>
                    <div className="line-item"><div><strong>Salario liquido</strong><p>Valor final a receber pelo funcionario.</p></div><span>{currency.format(selectedPayslip.record.netSalary)}</span></div>
                  </section>
                </section>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AppRedesign() {
  return window.location.pathname.startsWith("/holerite/") ? <PublicPayslipPage /> : <MainApp />;
}

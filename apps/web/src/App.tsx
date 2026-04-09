import { FormEvent, useEffect, useState } from "react";
import { api } from "./services/api";
import { BenefitsResponse, CreateEmployeePayload, DreReport, Employee, PayslipExplanationResponse, PayrollRecord, TimeBankGroup, VacationItem } from "./types";
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
          <p className="public-payslip-note">
            Solicite um novo link seguro para visualizar o holerite novamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-payslip-page">
      <div className="public-payslip-card">
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

        <section className="payslip-top-summary">
          <strong>{payslip.summaryText}</strong>
          <span>
            {payslip.payslipStatus === "SIGNED" && payslip.signedAt
              ? `Assinado digitalmente em ${new Date(payslip.signedAt).toLocaleString("pt-BR")}`
              : "Holerite disponivel para visualizacao online."}
          </span>
        </section>

        <section className="payslip-core">
          <div className="payslip-meta">
            <div>
              <span>Funcionario</span>
              <strong>{payslip.employee?.name}</strong>
            </div>
            <div>
              <span>Cargo</span>
              <strong>{payslip.employee?.role}</strong>
            </div>
            <div>
              <span>Total bruto</span>
              <strong>{currency.format(payslip.record.grossSalary)}</strong>
            </div>
            <div>
              <span>Liquido</span>
              <strong>{currency.format(payslip.record.netSalary)}</strong>
            </div>
          </div>

          <section className="holerite-panel holerite-totals">
            <h3>Totais do Holerite</h3>
            <div className="holerite-item">
              <div>
                <strong>Total bruto</strong>
                <p>Total de proventos antes dos descontos.</p>
              </div>
              <span>{currency.format(payslip.record.grossSalary)}</span>
            </div>
            <div className="holerite-item">
              <div>
                <strong>Total de descontos</strong>
                <p>Soma de todos os descontos aplicados na competencia.</p>
              </div>
              <span>{currency.format(payslip.record.deductions)}</span>
            </div>
            <div className="holerite-item">
              <div>
                <strong>Salario liquido</strong>
                <p>Valor final a receber pelo funcionario.</p>
              </div>
              <span>{currency.format(payslip.record.netSalary)}</span>
            </div>
          </section>

          <div className="holerite-columns">
            <section className="holerite-panel">
              <h3>Proventos</h3>
              {payslip.sections.earnings.map((item) => (
                <div className="holerite-item" key={item.label}>
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.description}</p>
                  </div>
                  <span>{currency.format(item.amount)}</span>
                </div>
              ))}
            </section>

            <section className="holerite-panel">
              <h3>Descontos</h3>
              {payslip.sections.deductions.map((item) => (
                <div className="holerite-item" key={item.label}>
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.description}</p>
                  </div>
                  <span>{currency.format(item.amount)}</span>
                </div>
              ))}
            </section>
          </div>

          <section className="holerite-panel holerite-bases">
            <h3>Bases de calculo</h3>
            {payslip.sections.bases.map((item) => (
              <div className="holerite-item" key={item.label}>
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
  const [employeeForm, setEmployeeForm] = useState<CreateEmployeePayload>({
    ...emptyEmployeeForm,
  });
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

  async function handleEmployeeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingEmployee(true);
    setEmployeeStatusMessage("");

    try {
      if (editingEmployeeId) {
        const employee = await api.updateEmployee(editingEmployeeId, employeeForm);
        setEmployees((current) =>
          current.map((item) => (item.id === editingEmployeeId ? employee : item)),
        );
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
      const explanation = await api.getPayslipExplanation(
        employee.id,
        selectedCompetenceMonth,
        selectedCompetenceYear,
      );
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
      const refreshedDre = await api.getDre(selectedCompetenceMonth, selectedCompetenceYear);
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

  const competenceLabel = `${String(selectedCompetenceMonth).padStart(2, "0")}/${selectedCompetenceYear}`;

  function toggleDreGroup(groupId: string) {
    setCollapsedDreGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Gestao Integrada</p>
          <h1>Sistema RH + DRE</h1>
          <p className="sidebar-copy">
            Base inicial para operacao de recursos humanos e acompanhamento financeiro.
          </p>
        </div>

        <nav className="menu">
          <button className={section === "home" ? "menu-item active" : "menu-item"} onClick={() => setSection("home")}>
            Inicio
          </button>
          <button className={section === "rh" ? "menu-item active" : "menu-item"} onClick={() => setSection("rh")}>
            RH
          </button>
          <button className={section === "dre" ? "menu-item active" : "menu-item"} onClick={() => setSection("dre")}>
            DRE
          </button>
        </nav>

        <div className="sidebar-footer">
          <span>{stats.employees} funcionarios</span>
          <span>{stats.activePayroll} folhas calculadas</span>
        </div>
      </aside>

      <main className="content">
        {section === "home" && (
          <>
            <section className="hero">
              <div>
                <p className="eyebrow">Tela inicial</p>
                <h2>Escolha entre RH e DRE a partir do menu lateral</h2>
                <p>
                  O sistema foi estruturado para centralizar processos de funcionarios, folha, beneficios,
                  banco de horas, ferias e demonstrativos financeiros.
                </p>
              </div>
              <div className="hero-panel">
                <span>Lucro liquido atual</span>
                <strong>{currency.format(stats.netProfit)}</strong>
                <small>Consolidado com base no DRE atual</small>
              </div>
            </section>

            <section className="cards-grid">
              <article className="card card-highlight">
                <h3>RH</h3>
                <p>Cadastros, holerite explicado, beneficios, banco de horas e ferias.</p>
                <button onClick={() => setSection("rh")}>Acessar modulo RH</button>
              </article>

              <article className="card">
                <h3>DRE</h3>
                <p>Receita, custos, impostos e resultado operacional em uma visao unica.</p>
                <button onClick={() => setSection("dre")}>Acessar modulo DRE</button>
              </article>
            </section>

            <section className="metrics-row">
              <div className="metric">
                <span>Funcionarios</span>
                <strong>{stats.employees}</strong>
              </div>
              <div className="metric">
                <span>Ferias em controle</span>
                <strong>{stats.scheduledVacations}</strong>
              </div>
              <div className="metric">
                <span>Folhas processadas</span>
                <strong>{stats.activePayroll}</strong>
              </div>
            </section>
          </>
        )}

        {section === "rh" && (
          <>
            <section className="section-header">
              <div>
                <p className="eyebrow">Modulo RH</p>
                <h2>Gestao de funcionarios e folha</h2>
              </div>
            </section>

            <section className="cards-grid three-columns">
              <article className="card">
                <h3>{editingEmployeeId ? "Editar funcionario" : "Novo funcionario"}</h3>
                <form className="employee-form" onSubmit={handleEmployeeSubmit}>
                  <input
                    placeholder="Nome completo"
                    value={employeeForm.name}
                    onChange={(event) => setEmployeeForm((current) => ({ ...current, name: event.target.value }))}
                    required
                  />
                  <input
                    placeholder="CPF"
                    value={employeeForm.document}
                    onChange={(event) => setEmployeeForm((current) => ({ ...current, document: event.target.value }))}
                    required
                  />
                  <input
                    placeholder="E-mail"
                    type="email"
                    value={employeeForm.email}
                    onChange={(event) => setEmployeeForm((current) => ({ ...current, email: event.target.value }))}
                    required
                  />
                  <input
                    placeholder="Telefone (+55 DDD numero)"
                    value={formatPhoneForDisplay(employeeForm.phone)}
                    onChange={(event) =>
                      setEmployeeForm((current) => ({
                        ...current,
                        phone: normalizeInternationalPhone(event.target.value),
                      }))
                    }
                    required
                  />
                  <input
                    placeholder="Cargo"
                    value={employeeForm.role}
                    onChange={(event) => setEmployeeForm((current) => ({ ...current, role: event.target.value }))}
                    required
                  />
                  <input
                    placeholder="Departamento"
                    value={employeeForm.department}
                    onChange={(event) => setEmployeeForm((current) => ({ ...current, department: event.target.value }))}
                    required
                  />
                  <input
                    type="date"
                    value={employeeForm.admissionDate}
                    onChange={(event) => setEmployeeForm((current) => ({ ...current, admissionDate: event.target.value }))}
                    required
                  />
                  <input
                    placeholder="Salario base"
                    type="number"
                    min="0"
                    step="0.01"
                    value={employeeForm.salaryBase || ""}
                    onChange={(event) =>
                      setEmployeeForm((current) => ({ ...current, salaryBase: Number(event.target.value) }))
                    }
                    required
                  />
                  <select
                    value={employeeForm.status}
                    onChange={(event) => setEmployeeForm((current) => ({ ...current, status: event.target.value }))}
                  >
                    <option value="ACTIVE">Ativo</option>
                    <option value="VACATION">Ferias</option>
                    <option value="LEAVE">Afastado</option>
                    <option value="DISMISSED">Desligado</option>
                  </select>
                  <button type="submit" disabled={isSubmittingEmployee}>
                    {isSubmittingEmployee
                      ? "Salvando..."
                      : editingEmployeeId
                        ? "Salvar alteracoes"
                        : "Cadastrar funcionario"}
                  </button>
                  {editingEmployeeId ? (
                    <button className="secondary-button" type="button" onClick={handleCancelEmployeeEdit}>
                      Cancelar edicao
                    </button>
                  ) : null}
                </form>
                {employeeStatusMessage ? <p className="status-message">{employeeStatusMessage}</p> : null}
              </article>

              <article className="card">
                <h3>Cadastro de funcionarios</h3>
                <ul className="simple-list">
                  {employees.map((employee) => (
                    <li key={employee.id}>
                      <div className="employee-list-item">
                        <strong>{employee.name}</strong>
                        <span>{employee.role}</span>
                        <span>{employee.department}</span>
                        <span>{formatPhoneForDisplay(employee.phone)}</span>
                      </div>
                      <div className="employee-actions">
                        <button className="ghost-button" onClick={() => handleEditEmployee(employee)} disabled={getPayrollStatus(employee.id) === "SIGNED"}>
                          Editar
                        </button>
                        <button className="ghost-button" onClick={() => void handleOpenPayslip(employee)}>
                          Holerite
                        </button>
                        <button className="ghost-button danger-button" onClick={() => void handleDeleteEmployee(employee.id)}>
                          Excluir
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="card">
                <h3>Banco de horas</h3>
                <ul className="simple-list">
                  {timeBank.map((item) => (
                    <li key={item.employeeId}>
                      <strong>{item.employeeName}</strong>
                      <span>Saldo: {item.balanceHours} h</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="card">
                <h3>Controle de ferias</h3>
                <ul className="simple-list">
                  {vacations.map((vacation) => (
                    <li key={vacation.id}>
                      <strong>{vacation.employee?.name ?? vacation.employeeId}</strong>
                      <span>
                        {dateFormatter.format(new Date(vacation.startDate))} ate{" "}
                        {dateFormatter.format(new Date(vacation.endDate))}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            </section>

            <section className="panel-grid">
              <article className="card large-card">
                <div className="section-title-row">
                  <h3>Folha de pagamento automatizada</h3>
                  <div className="competence-controls">
                    <select
                      value={selectedCompetenceMonth}
                      onChange={(event) => setSelectedCompetenceMonth(Number(event.target.value))}
                    >
                      {Array.from({ length: 12 }, (_, index) => (
                        <option key={index + 1} value={index + 1}>
                          {String(index + 1).padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedCompetenceYear}
                      onChange={(event) => setSelectedCompetenceYear(Number(event.target.value))}
                    >
                      {[initialYear - 1, initialYear, initialYear + 1].map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <button className="secondary-button batch-export-button" onClick={() => void handleExportBatchPdf()} disabled={isExportingBatchPdf}>
                      {isExportingBatchPdf ? "Gerando PDFs..." : "Exportar PDFs da competencia"}
                    </button>
                  </div>
                </div>
                <div className="table-like payroll-table">
                  {payroll.map((item) => (
                    <div className="table-row" key={item.id}>
                      <div>
                        <strong>{item.employee?.name ?? item.employeeId}</strong>
                        <span>
                          Competencia {String(item.month).padStart(2, "0")}/{item.year}
                        </span>
                        <span>Bruto: {currency.format(item.grossSalary)}</span>
                        <span className={item.payslipStatus === "SIGNED" ? "status-badge signed" : "status-badge pending"}>
                          {item.payslipStatus === "SIGNED" ? "Assinado" : "Pendente"}
                        </span>
                      </div>
                      <div>
                        <span>Liquido</span>
                        <strong>{currency.format(item.netSalary)}</strong>
                        <button className="ghost-button" onClick={() => item.employee && void handleOpenPayslip(item.employee)}>
                          Explicar holerite
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="card large-card">
                <div className="section-title-row">
                  <h3>Estrutura do holerite</h3>
                  <span className="pill-badge">Competencia {competenceLabel}</span>
                </div>
                {payroll[0] ? (
                  <div className="explanation-list">
                    <div className="payroll-summary-box">
                      <div>
                        <span>Salario bruto</span>
                        <strong>{currency.format(payroll[0].grossSalary)}</strong>
                      </div>
                      <div>
                        <span>Base IRRF</span>
                        <strong>{currency.format(payroll[0].taxableBase)}</strong>
                      </div>
                      <div>
                        <span>Total descontos</span>
                        <strong>{currency.format(payroll[0].deductions)}</strong>
                      </div>
                    </div>

                    {payroll[0].explanation.map((line) => (
                      <div className={`explanation-item explanation-${line.type}`} key={line.label}>
                        <div>
                          <strong>{line.label}</strong>
                          <p>{line.description}</p>
                        </div>
                        <span>{currency.format(line.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Nenhum holerite disponivel.</p>
                )}
                <p className="helper-text">
                  Clique em "Explicar holerite" ao lado do funcionario para abrir a visualizacao detalhada e exportar o PDF.
                </p>
              </article>
            </section>

            <section className="card">
              <h3>Beneficios</h3>
              <div className="benefits-grid">
                {benefits?.assignments.map((assignment) => (
                  <div className="benefit-column" key={assignment.employeeId}>
                    <strong>{assignment.employeeName}</strong>
                    {assignment.benefits.map((benefit) => (
                      <span key={benefit.id}>
                        {benefit.name} - {currency.format(benefit.monthlyCost)}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {section === "dre" && dre && (
          <>
            <section className="section-header">
              <div>
                <p className="eyebrow">Modulo Financeiro</p>
                <h2>Demonstrativo de Resultado do Exercicio</h2>
                <p>DRE automatico por competencia com integracao da folha, CMV, receitas e despesas.</p>
              </div>
              <div className="competence-controls">
                <select
                  value={selectedCompetenceMonth}
                  onChange={(event) => setSelectedCompetenceMonth(Number(event.target.value))}
                >
                  {Array.from({ length: 12 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      {String(index + 1).padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedCompetenceYear}
                  onChange={(event) => setSelectedCompetenceYear(Number(event.target.value))}
                >
                  {[initialYear - 1, initialYear, initialYear + 1].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedCmvMode}
                  onChange={(event) =>
                    setSelectedCmvMode(event.target.value as "MONTHLY" | "WEEKLY" | "WEEKLY_AVERAGE")
                  }
                >
                  {dre.cmvMode.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="metrics-row">
              <div className="metric">
                <span>Receita Bruta</span>
                <strong>{currency.format(dre.summary.grossRevenue)}</strong>
              </div>
              <div className="metric">
                <span>Receita Liquida</span>
                <strong>{currency.format(dre.summary.netRevenue)}</strong>
              </div>
              <div className="metric">
                <span>Margem de contribuicao</span>
                <strong>{currency.format(dre.summary.contributionMargin)}</strong>
              </div>
              <div className="metric">
                <span>Custo com pessoal</span>
                <strong>{currency.format(dre.summary.totalPersonnelCost)}</strong>
              </div>
              <div className="metric">
                <span>Lucro / prejuizo</span>
                <strong>{currency.format(dre.summary.netProfit)}</strong>
              </div>
            </section>

            <section className="card">
              <div className="section-title-row">
                <h3>Resumo do DRE</h3>
                <div className="view-toggle">
                  <button
                    className={dreView === "dashboard" ? "menu-item active" : "menu-item"}
                    onClick={() => setDreView("dashboard")}
                  >
                    Dashboard
                  </button>
                  <button
                    className={dreView === "table" ? "menu-item active" : "menu-item"}
                    onClick={() => setDreView("table")}
                  >
                    Tabela
                  </button>
                </div>
              </div>
              <div className="metrics-row compact-metrics">
                <div className="metric">
                  <span>Deducoes da receita</span>
                  <strong>{currency.format(dre.summary.revenueDeductions)}</strong>
                </div>
                <div className="metric">
                  <span>CMV</span>
                  <strong>{currency.format(dre.summary.cmv)}</strong>
                </div>
                <div className="metric">
                  <span>Despesas operacionais</span>
                  <strong>{currency.format(dre.summary.operationalExpenses)}</strong>
                </div>
                <div className="metric">
                  <span>Margem liquida</span>
                  <strong>{formatPercent(dre.summary.marginPercent)}</strong>
                </div>
              </div>
            </section>

            <section className="panel-grid">
              <article className="card">
                <h3>Comparativo e acumulado</h3>
                <div className="metrics-row compact-metrics">
                  <div className="metric">
                    <span>Competencia anterior</span>
                    <strong>{dre.comparison.previousCompetence}</strong>
                  </div>
                  <div className="metric">
                    <span>Delta receita liquida</span>
                    <strong>{formatDelta(dre.comparison.netRevenueDelta)}</strong>
                  </div>
                  <div className="metric">
                    <span>Delta lucro</span>
                    <strong>{formatDelta(dre.comparison.netProfitDelta)}</strong>
                  </div>
                  <div className="metric">
                    <span>Acumulado lucro no ano</span>
                    <strong>{currency.format(dre.comparison.yearToDateNetProfit)}</strong>
                  </div>
                </div>
              </article>

              <article className="card">
                <h3>Integracoes e configuracao</h3>
                <div className="simple-list">
                  <div className="table-row">
                    <div>
                      <strong>Folha integrada ao DRE</strong>
                      <span>Salarios, adicionais, provisoes, encargos e beneficios.</span>
                    </div>
                    <strong>{currency.format(dre.summary.totalPersonnelCost)}</strong>
                  </div>
                  <div className="table-row">
                    <div>
                      <strong>Modo do CMV</strong>
                      <span>{dre.cmvMode.options.find((option) => option.value === dre.cmvMode.selected)?.label}</span>
                    </div>
                    <strong>{currency.format(dre.summary.cmv)}</strong>
                  </div>
                  <div className="table-row">
                    <div>
                      <strong>Ajustes manuais</strong>
                      <span>{dre.configuration.allowManualAdjustments ? "Estrutura habilitada para ajustes futuros." : "Desabilitado"}</span>
                    </div>
                    <strong>{dre.configuration.allowManualAdjustments ? "Ativo" : "Inativo"}</strong>
                  </div>
                </div>
              </article>
            </section>

            {dreView === "dashboard" ? (
              <>
                <section className="cards-grid three-columns">
                  {dre.dashboard.cards.map((card) => (
                    <article className="card" key={card.id}>
                      <p className="eyebrow">Indicador</p>
                      <h3>{card.label}</h3>
                      <strong className="dashboard-card-value">{currency.format(card.value)}</strong>
                    </article>
                  ))}
                </section>

                <section className="card large-card">
                  <div className="section-title-row">
                    <h3>Evolucao mensal</h3>
                    <span className="pill-badge">Acumulado ate {dre.competence.label}</span>
                  </div>
                  <div className="dre-trend-list">
                    {dre.dashboard.monthlyTrend.map((point) => (
                      <div className="dre-trend-row" key={`${point.year}-${point.month}`}>
                        <div>
                          <strong>{String(point.month).padStart(2, "0")}/{point.year}</strong>
                          <span>Receita liquida {currency.format(point.netRevenue)}</span>
                        </div>
                        <div>
                          <span>CMV {currency.format(point.cmv)}</span>
                          <span>Pessoal {currency.format(point.personnelCost)}</span>
                          <strong>{currency.format(point.netProfit)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <section className="card large-card">
                <div className="section-title-row">
                  <h3>Estrutura completa do DRE</h3>
                  <span className="pill-badge">Percentual sobre receita liquida</span>
                </div>
                <div className="dre-groups">
                  {dre.groups.map((group) => {
                    const isCollapsed = collapsedDreGroups[group.id] ?? false;

                    return (
                      <article className="dre-group-card" key={group.id}>
                        <button className="dre-group-header" onClick={() => toggleDreGroup(group.id)}>
                          <div>
                            <strong>{group.title}</strong>
                            <span>{group.formula}</span>
                          </div>
                          <div className="dre-group-meta">
                            <span>{currency.format(group.total)}</span>
                            <span>{formatPercent(group.percentOfNetRevenue)}</span>
                            <span>{isCollapsed ? "Expandir" : "Recolher"}</span>
                          </div>
                        </button>

                        {!isCollapsed ? (
                          <div className="dre-group-content">
                            {group.sections.map((section) => {
                              const sectionTotal = section.items.reduce((sum, item) => sum + item.amount, 0);

                              return (
                                <section className="dre-section-block" key={section.id}>
                                  <div className="dre-section-head">
                                    <div>
                                      <strong>{section.title}</strong>
                                      <span>{section.formula}</span>
                                    </div>
                                    <div className="dre-section-meta">
                                      <span>{section.allowManualEntries ? "Aceita ajuste manual" : "Automatico"}</span>
                                      <strong>{currency.format(sectionTotal)}</strong>
                                    </div>
                                  </div>
                                  <div className="dre-line-table">
                                    <div className="dre-line-table-header">
                                      <span>Subcategoria</span>
                                      <span>Origem</span>
                                      <span>Valor</span>
                                      <span>% Receita liquida</span>
                                    </div>
                                    {section.items.map((item) => (
                                      <div className="dre-line-row" key={item.id}>
                                        <div>
                                          <strong>{item.name}</strong>
                                          <span>{item.notes ?? "Sem observacao complementar."}</span>
                                        </div>
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
              </section>
            )}

            <section className="card">
              <h3>Blocos de resultado</h3>
              <div className="dre-result-grid">
                {[
                  { label: "Receita liquida", value: dre.summary.netRevenue },
                  { label: "Custos variaveis", value: dre.summary.variableCosts },
                  { label: "Margem de contribuicao", value: dre.summary.contributionMargin },
                  { label: "Custos com pessoal", value: dre.summary.totalPersonnelCost },
                  { label: "Despesas operacionais", value: dre.summary.operationalExpenses },
                  { label: "EBITDA", value: dre.summary.ebitda },
                  { label: "Resultado financeiro", value: dre.summary.financialResult },
                  { label: "Lucro / prejuizo", value: dre.summary.netProfit },
                ].map((item) => (
                  <div className="dre-result-item" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{currency.format(item.value)}</strong>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {isPayslipModalOpen ? (
        <div className="modal-overlay" onClick={handleClosePayslip}>
          <div className="payslip-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">Holerite detalhado</p>
                <h2>{selectedPayslip?.employee?.name ?? "Funcionario"}</h2>
                <p>Competencia {competenceLabel}</p>
                <span className={selectedPayslip?.payslipStatus === "SIGNED" ? "status-badge signed" : "status-badge pending"}>
                  {selectedPayslip?.payslipStatus === "SIGNED" ? "Assinado" : "Pendente"}
                </span>
              </div>
              <div className="modal-actions">
                <div className="competence-controls modal-competence-controls">
                  <select
                    value={selectedCompetenceMonth}
                    onChange={(event) => setSelectedCompetenceMonth(Number(event.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, index) => (
                      <option key={index + 1} value={index + 1}>
                        {String(index + 1).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedCompetenceYear}
                    onChange={(event) => setSelectedCompetenceYear(Number(event.target.value))}
                  >
                    {[initialYear - 1, initialYear, initialYear + 1].map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="secondary-button batch-export-button" onClick={() => void handleExportCurrentPayslipPdf()} disabled={isExportingPdf || !selectedPayslip}>
                  {isExportingPdf ? "Gerando PDF..." : "Exportar PDF"}
                </button>
                <button className="secondary-button batch-export-button" onClick={handleSendWhatsApp} disabled={!selectedPayslip}>
                  Enviar por WhatsApp
                </button>
                <button className="secondary-button batch-export-button" onClick={() => void handleSignPayslip()} disabled={!selectedPayslip || selectedPayslip.payslipStatus === "SIGNED" || isSigningPayslip}>
                  {selectedPayslip?.payslipStatus === "SIGNED" ? "Holerite assinado" : isSigningPayslip ? "Assinando..." : "Assinar"}
                </button>
                <button className="ghost-button" onClick={handleClosePayslip}>
                  Fechar
                </button>
              </div>
            </div>

            {isLoadingPayslip || !selectedPayslip ? (
              <div className="modal-loading">Carregando holerite...</div>
            ) : (
              <div className="payslip-sheet">
                <section className="payslip-top-summary">
                  <strong>{selectedPayslip.summaryText}</strong>
                  <span>{selectedPayslip.exportReady.message}</span>
                  <span>
                    {selectedPayslip.payslipStatus === "SIGNED" && selectedPayslip.signedAt
                      ? `Assinado digitalmente em ${dateFormatter.format(new Date(selectedPayslip.signedAt))} às ${new Date(selectedPayslip.signedAt).toLocaleTimeString("pt-BR")}${selectedPayslip.signedIp ? ` | IP ${selectedPayslip.signedIp}` : ""}`
                      : "Holerite pendente de assinatura."}
                  </span>
                </section>

                <section className="payslip-core">
                  <div className="payslip-meta">
                    <div>
                      <span>Funcionario</span>
                      <strong>{selectedPayslip.employee?.name}</strong>
                    </div>
                    <div>
                      <span>Cargo</span>
                      <strong>{selectedPayslip.employee?.role}</strong>
                    </div>
                    <div>
                      <span>Competencia</span>
                      <strong>{String(selectedPayslip.month).padStart(2, "0")}/{selectedPayslip.year}</strong>
                    </div>
                    <div>
                      <span>Salario liquido</span>
                      <strong>{currency.format(selectedPayslip.record.netSalary)}</strong>
                    </div>
                  </div>

                  <div className="holerite-columns">
                    <section className="holerite-panel">
                      <h3>Proventos</h3>
                      {selectedPayslip.sections.earnings.map((item) => (
                        <div className="holerite-item" key={item.label}>
                          <div>
                            <strong>{item.label}</strong>
                            <p>{item.description}</p>
                          </div>
                          <span>{currency.format(item.amount)}</span>
                        </div>
                      ))}
                    </section>

                    <section className="holerite-panel">
                      <h3>Descontos</h3>
                      {selectedPayslip.sections.deductions.map((item) => (
                        <div className="holerite-item" key={item.label}>
                          <div>
                            <strong>{item.label}</strong>
                            <p>{item.description}</p>
                          </div>
                          <span>{currency.format(item.amount)}</span>
                        </div>
                      ))}
                    </section>
                  </div>

                  <section className="holerite-panel holerite-bases">
                    <h3>Bases de calculo</h3>
                    {selectedPayslip.sections.bases.map((item) => (
                      <div className="holerite-item" key={item.label}>
                        <div>
                          <strong>{item.label}</strong>
                          <p>{item.description}</p>
                        </div>
                        <span>{currency.format(item.amount)}</span>
                      </div>
                    ))}
                  </section>

                  <section className="holerite-panel holerite-totals">
                    <h3>Totais do Holerite</h3>
                    <div className="holerite-item">
                      <div>
                        <strong>Total bruto</strong>
                        <p>Total de proventos antes dos descontos.</p>
                      </div>
                      <span>{currency.format(selectedPayslip.record.grossSalary)}</span>
                    </div>
                    <div className="holerite-item">
                      <div>
                        <strong>Total de descontos</strong>
                        <p>Soma de todos os descontos aplicados na competencia.</p>
                      </div>
                      <span>{currency.format(selectedPayslip.record.deductions)}</span>
                    </div>
                    <div className="holerite-item">
                      <div>
                        <strong>Salario liquido</strong>
                        <p>Valor final a receber pelo funcionario.</p>
                      </div>
                      <span>{currency.format(selectedPayslip.record.netSalary)}</span>
                    </div>
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

export default function App() {
  return window.location.pathname.startsWith("/holerite/") ? <PublicPayslipPage /> : <MainApp />;
}

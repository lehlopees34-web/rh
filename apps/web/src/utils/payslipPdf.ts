import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PayslipExplanationResponse } from "../types";
import { companyBrand } from "./companyBrand";

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

type HoleriteRow = {
  code: string;
  description: string;
  reference: string;
  amount: string;
};

function formatReference(reference: number, suffix = "") {
  if (!reference) {
    return "-";
  }

  return `${reference.toFixed(2)}${suffix}`;
}

function getStructuredRows(payslip: PayslipExplanationResponse) {
  const earnings: HoleriteRow[] = [
    {
      code: "001",
      description: "Salario Base",
      reference: "30 dias",
      amount: currency(payslip.record.baseSalary),
    },
    {
      code: "020",
      description: "Adicional Noturno",
      reference: formatReference(payslip.record.nightShiftAmount ? payslip.record.nightShiftAmount / Math.max(payslip.record.baseSalary / 220 * 0.2, 0.0001) : 0, " h"),
      amount: currency(payslip.record.nightShiftAmount),
    },
    {
      code: "050",
      description: "Hora Extra 50%",
      reference: formatReference(payslip.record.overtime50Amount ? payslip.record.overtime50Amount / Math.max((payslip.record.baseSalary / 220) * 1.5, 0.0001) : 0, " h"),
      amount: currency(payslip.record.overtime50Amount),
    },
    {
      code: "100",
      description: "Hora Extra 100%",
      reference: formatReference(payslip.record.overtime100Amount ? payslip.record.overtime100Amount / Math.max((payslip.record.baseSalary / 220) * 2, 0.0001) : 0, " h"),
      amount: currency(payslip.record.overtime100Amount),
    },
  ].filter((item) => item.amount !== currency(0));

  const deductions: HoleriteRow[] = [
    {
      code: "401",
      description: "Vale Transporte",
      reference: "6,00%",
      amount: currency(payslip.record.transportVoucherDeduction),
    },
    {
      code: "410",
      description: "Plano de Saude",
      reference: "6,00%",
      amount: currency(payslip.record.healthPlanDeduction),
    },
    {
      code: "420",
      description: "Dependentes",
      reference: "-",
      amount: currency(payslip.record.dependentsDeduction),
    },
    {
      code: "511",
      description: "INSS",
      reference: "Tabela",
      amount: currency(payslip.record.inssDeduction),
    },
    {
      code: "521",
      description: "IRRF",
      reference: "Tabela",
      amount: currency(payslip.record.irrfDeduction),
    },
  ].filter((item) => item.amount !== currency(0));

  return { earnings, deductions };
}

function buildCombinedTableBody(payslip: PayslipExplanationResponse) {
  const { earnings, deductions } = getStructuredRows(payslip);
  const rowCount = Math.max(earnings.length, deductions.length, 6);

  return Array.from({ length: rowCount }, (_, index) => {
    const earning = earnings[index];
    const deduction = deductions[index];

    return [
      earning?.code ?? "",
      earning?.description ?? "",
      earning?.reference ?? "",
      earning?.amount ?? "",
      deduction?.code ?? "",
      deduction?.description ?? "",
      deduction?.reference ?? "",
      deduction?.amount ?? "",
    ];
  });
}

function renderPayslipPage(
  doc: jsPDF,
  payslip: PayslipExplanationResponse,
  pageIndex: number,
  totalPages: number,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const { earnings, deductions } = getStructuredRows(payslip);
  let cursorY = 16;

  doc.setFillColor(...companyBrand.accentColor);
  doc.roundedRect(10, 10, pageWidth - 20, 28, 3, 3, "F");
  doc.setDrawColor(205, 214, 224);
  doc.roundedRect(10, 10, pageWidth - 20, 28, 3, 3);

  doc.setFillColor(...companyBrand.primaryColor);
  doc.roundedRect(14, 14, 16, 16, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(companyBrand.initials, 18.7, 23.8);

  doc.setTextColor(...companyBrand.textColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(companyBrand.name, 34, 18);
  doc.setFontSize(12);
  doc.text("RECIBO DE PAGAMENTO DE SALARIO", 34, 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...companyBrand.mutedColor);
  doc.text(`CNPJ: ${companyBrand.cnpj}`, 34, 32);
  doc.text(`Competencia: ${String(payslip.month).padStart(2, "0")}/${payslip.year}`, pageWidth - 62, 18);
  doc.text(`Pagina: ${pageIndex}/${totalPages}`, pageWidth - 40, 26);

  cursorY = 44;
  autoTable(doc, {
    startY: cursorY,
    theme: "grid",
    head: [["Funcionario", "Cargo", "Competencia", "Empresa"]],
    body: [[
      payslip.employee?.name ?? payslip.employeeId,
      payslip.employee?.role ?? "-",
      `${String(payslip.month).padStart(2, "0")}/${payslip.year}`,
      companyBrand.name,
    ]],
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [180, 188, 196],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: companyBrand.accentColor,
      textColor: companyBrand.textColor,
      fontStyle: "bold",
    },
  });

  cursorY = ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 54) + 6;
  doc.setFontSize(9);
  doc.setTextColor(...companyBrand.textColor);
  doc.text(`Resumo: ${payslip.summaryText}`, 14, cursorY, { maxWidth: pageWidth - 28 });

  autoTable(doc, {
    startY: cursorY + 4,
    theme: "grid",
    head: [[
      "Cod.",
      "Proventos",
      "Ref.",
      "Valor",
      "Cod.",
      "Descontos",
      "Ref.",
      "Valor",
    ]],
    body: buildCombinedTableBody(payslip),
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [180, 188, 196],
      lineWidth: 0.2,
      valign: "top",
    },
    headStyles: {
      fillColor: companyBrand.accentColor,
      textColor: companyBrand.textColor,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 42 },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 22, halign: "right" },
      4: { cellWidth: 12, halign: "center" },
      5: { cellWidth: 42 },
      6: { cellWidth: 18, halign: "center" },
      7: { cellWidth: 22, halign: "right" },
    },
  });

  autoTable(doc, {
    startY: ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 150) + 6,
    theme: "grid",
    head: [["Base de Calculo", "Descricao", "Valor"]],
    body: payslip.sections.bases.map((item) => [item.label, item.description, currency(item.amount)]),
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [180, 188, 196],
      lineWidth: 0.2,
      valign: "top",
    },
    headStyles: {
      fillColor: companyBrand.accentColor,
      textColor: companyBrand.textColor,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 124 },
      2: { halign: "right", cellWidth: 26 },
    },
  });

  autoTable(doc, {
    startY: ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 214) + 8,
    theme: "grid",
    head: [["Total de Proventos", "Total de Descontos", "Salario Liquido"]],
    body: [[
      currency(payslip.record.grossSalary),
      currency(payslip.record.deductions),
      currency(payslip.record.netSalary),
    ]],
    styles: {
      fontSize: 10,
      cellPadding: 4,
      halign: "right",
      lineColor: [180, 188, 196],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: companyBrand.accentColor,
      textColor: companyBrand.textColor,
      fontStyle: "bold",
    },
  });

  doc.setFontSize(9);
  doc.setTextColor(...companyBrand.mutedColor);
  doc.text("Documento gerado pelo Sistema RH + DRE", 14, 290);
  if (payslip.payslipStatus === "SIGNED" && payslip.signedAt) {
    doc.text(`Holerite assinado digitalmente em ${new Date(payslip.signedAt).toLocaleString("pt-BR")}`, pageWidth - 115, 290);
  }
}

export function exportPayslipPdf(payslip: PayslipExplanationResponse) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  renderPayslipPage(doc, payslip, 1, 1);
  doc.save(`holerite-${payslip.employee?.name ?? payslip.employeeId}-${payslip.month}-${payslip.year}.pdf`);
}

export function exportBatchPayslipsPdf(payslips: PayslipExplanationResponse[], competenceLabel: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  payslips.forEach((payslip, index) => {
    if (index > 0) {
      doc.addPage();
    }

    renderPayslipPage(doc, payslip, index + 1, payslips.length);
  });

  doc.save(`holerites-${competenceLabel.replace("/", "-")}.pdf`);
}

import { Router } from "express";
import { createPayslipAccessToken, getPayslipAccessToken, isPayslipAccessTokenExpired } from "../repositories/payslipAccessTokenRepository.js";
import { registerPayslipAccess } from "../repositories/payslipAccessLogRepository.js";
import { getPayrollSummary } from "../services/payrollService.js";
import { signPayslip } from "../repositories/payslipSignatureRepository.js";

export const payrollRouter = Router();

function buildPayslipResponse(record: Awaited<ReturnType<typeof getPayrollSummary>>[number]) {
  const earnings = record.explanation.filter((item) => item.type === "earning");
  const deductions = record.explanation.filter((item) => item.type === "deduction");
  const bases = record.explanation.filter((item) => item.type === "info");

  return {
    employeeId: record.employeeId,
    employee: record.employee,
    month: record.month,
    year: record.year,
    canExplainPayslip: record.canExplainPayslip,
    payslipStatus: record.payslipStatus,
    signedAt: record.signedAt,
    signedIp: record.signedIp,
    isLocked: record.isLocked,
    summaryText: `Voce recebeu R$ ${record.grossSalary.toFixed(2)}, teve R$ ${record.deductions.toFixed(2)} de descontos e seu liquido foi R$ ${record.netSalary.toFixed(2)}.`,
    exportReady: {
      format: "pdf" as const,
      available: false,
      message: "Estrutura preparada para exportacao futura em PDF.",
    },
    sections: {
      earnings,
      deductions,
      bases,
    },
    explanation: record.explanation,
    record,
  };
}

payrollRouter.get("/", async (request, response) => {
  const month = request.query.month ? Number(request.query.month) : undefined;
  const year = request.query.year ? Number(request.query.year) : undefined;
  const payroll = await getPayrollSummary(month, year);
  response.json(payroll);
});

payrollRouter.get("/:employeeId/explanation", async (request, response) => {
  const month = request.query.month ? Number(request.query.month) : undefined;
  const year = request.query.year ? Number(request.query.year) : undefined;
  const payroll = await getPayrollSummary(month, year);
  const record = payroll.find((item) => item.employeeId === request.params.employeeId);

  if (!record) {
    return response.status(404).json({ error: "Holerite nao encontrado." });
  }

  return response.json(buildPayslipResponse(record));
});

payrollRouter.post("/:employeeId/sign", async (request, response) => {
  const month = request.body.month ? Number(request.body.month) : undefined;
  const year = request.body.year ? Number(request.body.year) : undefined;

  if (!month || !year) {
    return response.status(400).json({ error: "Competencia obrigatoria para assinatura." });
  }

  const payroll = await getPayrollSummary(month, year);
  const record = payroll.find((item) => item.employeeId === request.params.employeeId);

  if (!record) {
    return response.status(404).json({ error: "Holerite nao encontrado." });
  }

  const signature = await signPayslip(
    request.params.employeeId,
    month,
    year,
    request.ip ?? null,
  );

  return response.json({
    employeeId: request.params.employeeId,
    month,
    year,
    status: signature.status,
    signedAt: signature.signedAt,
    signedIp: signature.signedIp,
  });
});

payrollRouter.post("/:employeeId/share-link", async (request, response) => {
  const month = request.body.month ? Number(request.body.month) : undefined;
  const year = request.body.year ? Number(request.body.year) : undefined;

  if (!month || !year) {
    return response.status(400).json({ error: "Competencia obrigatoria para gerar link seguro." });
  }

  const payroll = await getPayrollSummary(month, year);
  const record = payroll.find((item) => item.employeeId === request.params.employeeId);

  if (!record) {
    return response.status(404).json({ error: "Holerite nao encontrado." });
  }

  const accessToken = await createPayslipAccessToken(request.params.employeeId, month, year);

  return response.json({
    token: accessToken.token,
    employeeId: request.params.employeeId,
    month,
    year,
    createdAt: accessToken.createdAt,
    expiresAt: accessToken.expiresAt,
  });
});

payrollRouter.get("/public/:token", async (request, response) => {
  const accessToken = await getPayslipAccessToken(request.params.token);

  if (!accessToken) {
    return response.status(404).json({ error: "link invalido ou expirado" });
  }

  if (isPayslipAccessTokenExpired(accessToken)) {
    return response.status(410).json({ error: "link invalido ou expirado" });
  }

  const payroll = await getPayrollSummary(accessToken.month, accessToken.year);
  const record = payroll.find((item) => item.employeeId === accessToken.employeeId);

  if (!record) {
    return response.status(404).json({ error: "link invalido ou expirado" });
  }

  await registerPayslipAccess(
    accessToken.token,
    accessToken.employeeId,
    accessToken.month,
    accessToken.year,
    request.ip ?? null,
  );

  return response.json(buildPayslipResponse(record));
});

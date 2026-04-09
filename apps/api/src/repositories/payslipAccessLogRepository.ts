import { payslipAccessLogs } from "../data/sampleData.js";
import { prisma } from "../lib/prisma.js";
import { PayslipAccessLog } from "../types.js";

function toDto(log: {
  token: string;
  employeeId: string;
  month: number;
  year: number;
  viewed: boolean;
  accessedAt: Date | string;
  ip: string | null;
}): PayslipAccessLog {
  return {
    token: log.token,
    employeeId: log.employeeId,
    month: log.month,
    year: log.year,
    viewed: log.viewed,
    accessedAt: typeof log.accessedAt === "string" ? log.accessedAt : log.accessedAt.toISOString(),
    ip: log.ip,
  };
}

export async function registerPayslipAccess(
  token: string,
  employeeId: string,
  month: number,
  year: number,
  ip: string | null,
) {
  try {
    const record = await prisma.payslipAccessLog.create({
      data: {
        token,
        employeeId,
        month,
        year,
        viewed: true,
        ip,
      },
    });

    return toDto(record);
  } catch {
    const fallback: PayslipAccessLog = {
      token,
      employeeId,
      month,
      year,
      viewed: true,
      accessedAt: new Date().toISOString(),
      ip,
    };

    payslipAccessLogs.push(fallback);
    return fallback;
  }
}

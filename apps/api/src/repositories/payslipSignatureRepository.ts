import { payslipSignatures } from "../data/sampleData.js";
import { prisma } from "../lib/prisma.js";
import { PayslipSignature } from "../types.js";

export async function getPayslipSignature(employeeId: string, month: number, year: number) {
  try {
    const signature = await prisma.payslipSignature.findUnique({
      where: {
        employeeId_month_year: {
          employeeId,
          month,
          year,
        },
      },
    });

    return signature
      ? {
          employeeId: signature.employeeId,
          month: signature.month,
          year: signature.year,
          status: signature.status as "PENDING" | "SIGNED",
          signedAt: signature.signedAt?.toISOString() ?? null,
          signedIp: signature.signedIp ?? null,
        }
      : null;
  } catch {
    return (
      payslipSignatures.find(
        (item) => item.employeeId === employeeId && item.month === month && item.year === year,
      ) ?? null
    );
  }
}

export async function signPayslip(
  employeeId: string,
  month: number,
  year: number,
  signedIp: string | null,
) {
  const existing = await getPayslipSignature(employeeId, month, year);

  try {
    const signature = await prisma.payslipSignature.upsert({
      where: {
        employeeId_month_year: {
          employeeId,
          month,
          year,
        },
      },
      update: {
        status: "SIGNED",
        signedAt: new Date(),
        signedIp,
      },
      create: {
        employeeId,
        month,
        year,
        status: "SIGNED",
        signedAt: new Date(),
        signedIp,
      },
    });

    return {
      employeeId: signature.employeeId,
      month: signature.month,
      year: signature.year,
      status: "SIGNED" as const,
      signedAt: signature.signedAt?.toISOString() ?? null,
      signedIp: signature.signedIp ?? null,
    };
  } catch {
    if (existing) {
      existing.status = "SIGNED";
      existing.signedAt = new Date().toISOString();
      existing.signedIp = signedIp;
      return existing;
    }

    const signature: PayslipSignature = {
      employeeId,
      month,
      year,
      status: "SIGNED",
      signedAt: new Date().toISOString(),
      signedIp,
    };

    payslipSignatures.push(signature);
    return signature;
  }
}

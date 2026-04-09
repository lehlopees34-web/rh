import { randomBytes } from "node:crypto";
import { payslipAccessTokens } from "../data/sampleData.js";
import { prisma } from "../lib/prisma.js";
import { PayslipAccessToken } from "../types.js";

const TOKEN_EXPIRATION_DAYS = 7;

function buildExpirationDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRATION_DAYS);
  return expiresAt;
}

function toDto(token: {
  token: string;
  employeeId: string;
  month: number;
  year: number;
  createdAt: Date | string;
  expiresAt: Date | string;
}): PayslipAccessToken {
  return {
    token: token.token,
    employeeId: token.employeeId,
    month: token.month,
    year: token.year,
    createdAt: typeof token.createdAt === "string" ? token.createdAt : token.createdAt.toISOString(),
    expiresAt: typeof token.expiresAt === "string" ? token.expiresAt : token.expiresAt.toISOString(),
  };
}

export async function createPayslipAccessToken(employeeId: string, month: number, year: number) {
  const token = randomBytes(24).toString("hex");
  const expiresAt = buildExpirationDate();

  try {
    const record = await prisma.payslipAccessToken.create({
      data: {
        token,
        employeeId,
        month,
        year,
        expiresAt,
      },
    });

    return toDto(record);
  } catch {
    const fallback: PayslipAccessToken = {
      token,
      employeeId,
      month,
      year,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    payslipAccessTokens.push(fallback);
    return fallback;
  }
}

export async function getPayslipAccessToken(token: string) {
  try {
    const record = await prisma.payslipAccessToken.findUnique({
      where: { token },
    });

    return record ? toDto(record) : null;
  } catch {
    return payslipAccessTokens.find((item) => item.token === token) ?? null;
  }
}

export function isPayslipAccessTokenExpired(token: PayslipAccessToken) {
  return new Date(token.expiresAt).getTime() < Date.now();
}

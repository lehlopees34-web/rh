import { mockBenefits, mockDre, mockEmployees, mockPayroll, mockPayslipExplanation, mockTimeBank, mockVacations } from "../data/mockData";
import { CreateEmployeePayload, Employee, PayslipExplanationResponse, PayslipShareLinkResponse, PayrollRecord } from "../types";

const API_URL = "http://localhost:3333/api";

async function request<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`);

    if (!response.ok) {
      throw new Error(`Falha ao buscar ${path}`);
    }

    return (await response.json()) as T;
  } catch (_error) {
    return fallback;
  }
}

export const api = {
  getEmployees: () => request("/employees", mockEmployees),
  getPayroll: (month?: number, year?: number) => {
    const params = new URLSearchParams();

    if (month) {
      params.set("month", String(month));
    }

    if (year) {
      params.set("year", String(year));
    }

    const query = params.toString();
    return request(`/payroll${query ? `?${query}` : ""}`, mockPayroll);
  },
  getBenefits: () => request("/benefits", mockBenefits),
  getTimeBank: () => request("/time-bank", mockTimeBank),
  getVacations: () => request("/vacations", mockVacations),
  getDre: (month?: number, year?: number) => {
    const params = new URLSearchParams();

    if (month) {
      params.set("month", String(month));
    }

    if (year) {
      params.set("year", String(year));
    }

    const query = params.toString();
    return request(`/dre${query ? `?${query}` : ""}`, mockDre);
  },
  async getPayslipExplanation(employeeId: string, month: number, year: number): Promise<PayslipExplanationResponse> {
    const fallback: PayslipExplanationResponse = {
      ...mockPayslipExplanation,
      employeeId,
      month,
      year,
      record: {
        ...mockPayslipExplanation.record,
        employeeId,
        month,
        year,
      } as PayrollRecord,
    };

    return request(`/payroll/${employeeId}/explanation?month=${month}&year=${year}`, fallback);
  },
  async getPublicPayslipByToken(token: string): Promise<PayslipExplanationResponse | null> {
    try {
      const response = await fetch(`${API_URL}/payroll/public/${token}`);

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as PayslipExplanationResponse;
    } catch {
      return null;
    }
  },
  async createPayslipShareLink(employeeId: string, month: number, year: number): Promise<PayslipShareLinkResponse> {
    const response = await fetch(`${API_URL}/payroll/${employeeId}/share-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ month, year }),
    });

    if (!response.ok) {
      throw new Error("Nao foi possivel gerar o link seguro do holerite.");
    }

    return (await response.json()) as PayslipShareLinkResponse;
  },
  async createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
    const response = await fetch(`${API_URL}/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        salaryBase: Number(payload.salaryBase),
      }),
    });

    if (!response.ok) {
      throw new Error("Nao foi possivel cadastrar o funcionario.");
    }

    return (await response.json()) as Employee;
  },
  async updateEmployee(id: string, payload: Partial<CreateEmployeePayload>): Promise<Employee> {
    const response = await fetch(`${API_URL}/employees/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        salaryBase: payload.salaryBase !== undefined ? Number(payload.salaryBase) : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error("Nao foi possivel atualizar o funcionario.");
    }

    return (await response.json()) as Employee;
  },
  async deleteEmployee(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/employees/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Nao foi possivel remover o funcionario.");
    }
  },
  async signPayslip(employeeId: string, month: number, year: number) {
    const response = await fetch(`${API_URL}/payroll/${employeeId}/sign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ month, year }),
    });

    if (!response.ok) {
      throw new Error("Nao foi possivel assinar o holerite.");
    }

    return response.json();
  },
};

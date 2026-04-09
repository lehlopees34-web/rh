import { Employee as PrismaEmployee, EmployeeStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { employees as fallbackEmployees } from "../data/sampleData.js";

type CreateEmployeeInput = {
  name: string;
  document: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  admissionDate: string;
  salaryBase: number;
  status: EmployeeStatus;
};

type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

function mapEmployee(employee: PrismaEmployee) {
  return {
    ...employee,
    admissionDate: employee.admissionDate.toISOString(),
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  };
}

export async function listEmployees() {
  try {
    const result = await prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
    });

    return result.map(mapEmployee);
  } catch {
    return fallbackEmployees;
  }
}

export async function createEmployee(data: CreateEmployeeInput) {
  try {
    const employee = await prisma.employee.create({
      data: {
        ...data,
        admissionDate: new Date(data.admissionDate),
      },
    });

    return mapEmployee(employee);
  } catch {
    const employee = {
      id: `emp-${String(fallbackEmployees.length + 1).padStart(3, "0")}`,
      ...data,
    };

    fallbackEmployees.push(employee);
    return employee;
  }
}

export async function updateEmployee(id: string, data: UpdateEmployeeInput) {
  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...data,
        admissionDate: data.admissionDate ? new Date(data.admissionDate) : undefined,
      },
    });

    return mapEmployee(employee);
  } catch {
    const index = fallbackEmployees.findIndex((employee) => employee.id === id);

    if (index === -1) {
      return null;
    }

    fallbackEmployees[index] = {
      ...fallbackEmployees[index],
      ...data,
    };

    return fallbackEmployees[index];
  }
}

export async function deleteEmployee(id: string) {
  try {
    await prisma.employee.delete({ where: { id } });
    return true;
  } catch {
    const index = fallbackEmployees.findIndex((employee) => employee.id === id);

    if (index === -1) {
      return false;
    }

    fallbackEmployees.splice(index, 1);
    return true;
  }
}

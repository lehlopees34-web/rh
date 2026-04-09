import { Router } from "express";
import { z } from "zod";
import { createEmployee, deleteEmployee, listEmployees, updateEmployee } from "../repositories/employeeRepository.js";

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

const employeeSchema = z.object({
  name: z.string().min(3),
  document: z.string().min(11),
  email: z.string().email(),
  phone: z.string().min(10).transform(normalizeInternationalPhone).refine((value) => value.length >= 12, {
    message: "Telefone deve incluir codigo do pais, DDD e numero.",
  }),
  role: z.string().min(2),
  department: z.string().min(2),
  admissionDate: z.string(),
  salaryBase: z.number().positive(),
  status: z.enum(["ACTIVE", "VACATION", "LEAVE", "DISMISSED"]).default("ACTIVE"),
});

const employeeUpdateSchema = employeeSchema.partial();

export const employeesRouter = Router();

employeesRouter.get("/", async (_request, response) => {
  const employees = await listEmployees();
  response.json(employees);
});

employeesRouter.post("/", async (request, response) => {
  const result = employeeSchema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ error: result.error.flatten() });
  }

  const employee = await createEmployee(result.data);
  return response.status(201).json(employee);
});

employeesRouter.put("/:id", async (request, response) => {
  const result = employeeUpdateSchema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ error: result.error.flatten() });
  }

  const employee = await updateEmployee(request.params.id, result.data);

  if (!employee) {
    return response.status(404).json({ error: "Funcionario nao encontrado." });
  }

  return response.json(employee);
});

employeesRouter.delete("/:id", async (request, response) => {
  const removed = await deleteEmployee(request.params.id);

  if (!removed) {
    return response.status(404).json({ error: "Funcionario nao encontrado." });
  }

  return response.status(204).send();
});

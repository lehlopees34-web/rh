import { Router } from "express";
import { employees, vacations } from "../data/sampleData.js";

export const vacationsRouter = Router();

vacationsRouter.get("/", (_request, response) => {
  const data = vacations.map((vacation) => ({
    ...vacation,
    employee: employees.find((employee) => employee.id === vacation.employeeId),
  }));

  response.json(data);
});

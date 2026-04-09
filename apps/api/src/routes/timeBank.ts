import { Router } from "express";
import { employees, timeBankEntries } from "../data/sampleData.js";

export const timeBankRouter = Router();

timeBankRouter.get("/", (_request, response) => {
  const grouped = employees.map((employee) => {
    const entries = timeBankEntries.filter((entry) => entry.employeeId === employee.id);
    const balanceMinutes = entries.reduce(
      (sum, entry) => sum + (entry.type === "CREDIT" ? entry.minutes : -entry.minutes),
      0,
    );

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      balanceMinutes,
      balanceHours: Number((balanceMinutes / 60).toFixed(2)),
      entries,
    };
  });

  response.json(grouped);
});

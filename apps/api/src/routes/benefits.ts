import { Router } from "express";
import { benefits, employeeBenefits, employees } from "../data/sampleData.js";

export const benefitsRouter = Router();

benefitsRouter.get("/", (_request, response) => {
  const enrichedBenefits = employees.map((employee) => {
    const linkedBenefits = employeeBenefits
      .filter((item) => item.employeeId === employee.id)
      .map((item) => benefits.find((benefit) => benefit.id === item.benefitId))
      .filter(Boolean);

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      benefits: linkedBenefits,
    };
  });

  response.json({
    catalog: benefits,
    assignments: enrichedBenefits,
  });
});

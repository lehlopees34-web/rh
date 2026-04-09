import { Router } from "express";
import { getDreReport } from "../services/dreService.js";

export const dreRouter = Router();

dreRouter.get("/", async (request, response) => {
  const month = request.query.month ? Number(request.query.month) : undefined;
  const year = request.query.year ? Number(request.query.year) : undefined;
  response.json(await getDreReport(month, year));
});

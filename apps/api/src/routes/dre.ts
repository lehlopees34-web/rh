import { Router } from "express";
import { getDreReport } from "../services/dreService.js";

export const dreRouter = Router();

dreRouter.get("/", async (request, response) => {
  const month = request.query.month ? Number(request.query.month) : undefined;
  const year = request.query.year ? Number(request.query.year) : undefined;
  const cmvMode = typeof request.query.cmvMode === "string" ? request.query.cmvMode : undefined;
  response.json(await getDreReport(month, year, cmvMode === "WEEKLY" || cmvMode === "WEEKLY_AVERAGE" ? cmvMode : "MONTHLY"));
});

import { Router } from "express";
import { benefitsRouter } from "./benefits.js";
import { dreRouter } from "./dre.js";
import { employeesRouter } from "./employees.js";
import { payrollRouter } from "./payroll.js";
import { timeBankRouter } from "./timeBank.js";
import { vacationsRouter } from "./vacations.js";

export const apiRouter = Router();

apiRouter.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "sistema-rh-dre-api",
    timestamp: new Date().toISOString(),
  });
});

apiRouter.use("/employees", employeesRouter);
apiRouter.use("/benefits", benefitsRouter);
apiRouter.use("/time-bank", timeBankRouter);
apiRouter.use("/vacations", vacationsRouter);
apiRouter.use("/payroll", payrollRouter);
apiRouter.use("/dre", dreRouter);

import express from "express";
import cors from "cors";
import calculateRouter from "./routes/calculate.js";
import workOrdersRouter from "./routes/workOrders.js";
import contractorsRouter from "./routes/contractors.js";
import budgetsRouter from "./routes/budgets.js";
import extraItemsRouter from "./routes/extraItems.js";
import auditNotesRouter from "./routes/auditNotes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/calculate", calculateRouter);
app.use("/api/work-orders", workOrdersRouter);
app.use("/api/contractors", contractorsRouter);
app.use("/api/budgets", budgetsRouter);
app.use("/api/extra-items", extraItemsRouter);
app.use("/api/audit-notes", auditNotesRouter);

export default app;

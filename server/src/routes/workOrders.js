import { Router } from "express";
import AuditNote from "../models/AuditNote.js";
import Budget from "../models/Budget.js";
import ExtraItem from "../models/ExtraItem.js";
import WorkOrder from "../models/WorkOrder.js";
import { calculateAudit } from "../services/auditCalculator.js";

const router = Router();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

function getBudgetImpactAmount(workOrderLike) {
  return toPositiveNumber(workOrderLike?.calculations?.wit ?? workOrderLike?.calculations?.net);
}

async function applyBudgetImpact(previousWorkOrder, nextWorkOrder) {
  const previousBudgetId = previousWorkOrder?.budgetId ? String(previousWorkOrder.budgetId) : "";
  const nextBudgetId = nextWorkOrder?.budgetId ? String(nextWorkOrder.budgetId) : "";
  const previousImpact = getBudgetImpactAmount(previousWorkOrder);
  const nextImpact = getBudgetImpactAmount(nextWorkOrder);

  const impactedBudgetIds = [...new Set([previousBudgetId, nextBudgetId].filter(Boolean))];
  if (impactedBudgetIds.length === 0) {
    return [];
  }

  const budgets = await Budget.find({ _id: { $in: impactedBudgetIds } });
  const budgetMap = new Map(budgets.map((budget) => [String(budget._id), budget]));
  const touchedBudgetIds = new Set();

  const applyDelta = async (budgetId, delta) => {
    if (!budgetId || delta === 0) return;

    const budget = budgetMap.get(String(budgetId));
    if (!budget || Number(budget.allocation || 0) <= 0) return;

    budget.balance = Math.max(0, Number(budget.balance || 0) - delta);
    budget.expenditure = Math.max(0, Number(budget.expenditure || 0) + delta);
    await budget.save();
    touchedBudgetIds.add(String(budget._id));
  };

  if (previousImpact > 0) {
    await applyDelta(previousBudgetId, -previousImpact);
  }
  if (nextImpact > 0) {
    await applyDelta(nextBudgetId, nextImpact);
  }

  return Array.from(touchedBudgetIds)
    .map((budgetId) => budgetMap.get(budgetId))
    .filter(Boolean)
    .map((budget) => budget.toObject());
}

async function syncWorkOrderRecord(payload, options = {}) {
  const { preferredId, allowCreate = true, matchByAgno = true } = options;
  const calculations = calculateAudit(payload);

  let existing = null;
  if (preferredId) {
    existing = await WorkOrder.findById(preferredId);
  }
  if (!existing && matchByAgno && payload.agno) {
    existing = await WorkOrder.findOne({ agno: payload.agno });
  }

  if (!existing && !allowCreate) {
    return { notFound: true };
  }

  const nextSnapshot = { ...payload, calculations };
  const previousSnapshot = existing ? existing.toObject() : null;

  if (existing) {
    existing.set(nextSnapshot);
    await existing.save();
  } else {
    existing = await WorkOrder.create(nextSnapshot);
  }

  const budgetUpdates = await applyBudgetImpact(previousSnapshot, existing.toObject());
  return { workOrder: existing, budgetUpdates };
}

async function deleteWorkOrderRecord(id) {
  const existing = await WorkOrder.findById(id);
  if (!existing) {
    return { notFound: true };
  }

  const previousSnapshot = existing.toObject();
  await Promise.all([
    ExtraItem.deleteMany({ workOrderId: existing._id }),
    AuditNote.deleteMany({ workOrderId: existing._id })
  ]);
  await existing.deleteOne();

  const budgetUpdates = await applyBudgetImpact(previousSnapshot, null);
  return {
    deletedId: String(existing._id),
    budgetUpdates
  };
}

router.get("/", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) {
    const items = await WorkOrder.find().sort({ updatedAt: -1 }).limit(100);
    return res.json(items);
  }

  const re = new RegExp(escapeRegExp(q), "i");
  const items = await WorkOrder.find({
    $or: [
      { agno: re },
      { nameOfWork: re },
      { workOrderNo: re },
      { coy: re },
      { section: re }
    ]
  })
    .sort({ updatedAt: -1 })
    .limit(200);
  res.json(items);
});

router.get("/:id", async (req, res) => {
  try {
    const item = await WorkOrder.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/sync", async (req, res) => {
  try {
    const payload = req.body || {};
    const preferredId = payload.serverId || payload._id || null;
    const synced = await syncWorkOrderRecord(payload, {
      preferredId,
      allowCreate: true,
      matchByAgno: true
    });
    res.json({
      workOrder: synced.workOrder,
      budgetUpdates: synced.budgetUpdates
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = req.body || {};
    const synced = await syncWorkOrderRecord(payload, {
      allowCreate: true,
      matchByAgno: true
    });
    res.status(201).json(synced.workOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const payload = req.body || {};
    const synced = await syncWorkOrderRecord(payload, {
      preferredId: req.params.id,
      allowCreate: false,
      matchByAgno: true
    });
    if (synced?.notFound) {
      return res.status(404).json({ error: "Work order not found" });
    }
    res.json(synced.workOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await deleteWorkOrderRecord(req.params.id);
    if (deleted?.notFound) {
      return res.status(404).json({ error: "Work order not found" });
    }
    res.json({
      message: "Work order deleted",
      deletedId: deleted.deletedId,
      budgetUpdates: deleted.budgetUpdates
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

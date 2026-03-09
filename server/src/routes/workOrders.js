import { Router } from "express";
import WorkOrder from "../models/WorkOrder.js";
import { calculateAudit } from "../services/auditCalculator.js";

const router = Router();

// list work orders, supports optional `q` query to search common fields
router.get("/", async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) {
    const items = await WorkOrder.find().sort({ createdAt: -1 }).limit(100);
    return res.json(items);
  }

  // simple case-insensitive partial match across a few fields
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const items = await WorkOrder.find({
    $or: [
      { agno: re },
      { nameOfWork: re },
      { workOrderNo: re },
      { coy: re },
      { section: re }
    ]
  }).sort({ createdAt: -1 }).limit(200);
  res.json(items);
});

// get a single work order by id
router.get("/:id", async (req, res) => {
  try {
    const item = await WorkOrder.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = req.body || {};
    const calculations = calculateAudit(payload);
    const created = await WorkOrder.create({ ...payload, calculations });
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const payload = req.body || {};
    const calculations = calculateAudit(payload);
    const updated = await WorkOrder.findByIdAndUpdate(
      req.params.id,
      { ...payload, calculations },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: "Work order not found" });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

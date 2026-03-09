import { Router } from "express";
import Budget from "../models/Budget.js";

const router = Router();

// Get by code - put this BEFORE the :id catch-all
router.get("/code/:code", async (req, res) => {
  try {
    const budget = await Budget.findOne({ code: req.params.code, isActive: true });
    if (!budget) return res.status(404).json({ error: "Not found" });
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all budgets
router.get("/", async (_req, res) => {
  try {
    const budgets = await Budget.find({ isActive: true }).sort({ code: 1 });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single budget
router.get("/:id", async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) return res.status(404).json({ error: "Not found" });
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create budget
router.post("/", async (req, res) => {
  try {
    const budget = await Budget.create(req.body);
    res.status(201).json(budget);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update budget
router.put("/:id", async (req, res) => {
  try {
    const budget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!budget) return res.status(404).json({ error: "Not found" });
    res.json(budget);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

import { Router } from "express";
import ExtraItem from "../models/ExtraItem.js";

const router = Router();

// Get items for work order - put this BEFORE the catch-all /:id route
router.get("/work/:workOrderId", async (req, res) => {
  try {
    const items = await ExtraItem.find({ workOrderId: req.params.workOrderId })
      .sort({ itemNo: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all extra items
router.get("/", async (_req, res) => {
  try {
    const items = await ExtraItem.find()
      .populate("workOrderId")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single item
router.get("/:id", async (req, res) => {
  try {
    const item = await ExtraItem.findById(req.params.id).populate("workOrderId");
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create extra item
router.post("/", async (req, res) => {
  try {
    const item = await ExtraItem.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create multiple items for work order
router.post("/batch/:workOrderId", async (req, res) => {
  try {
    const items = req.body.map(item => ({
      ...item,
      workOrderId: req.params.workOrderId
    }));
    const created = await ExtraItem.insertMany(items);
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update extra item
router.put("/:id", async (req, res) => {
  try {
    const item = await ExtraItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete extra item
router.delete("/:id", async (req, res) => {
  try {
    const item = await ExtraItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

import { Router } from "express";
import Contractor from "../models/Contractor.js";

const router = Router();

// Get all contractors
router.get("/", async (_req, res) => {
  try {
    const contractors = await Contractor.find({ isActive: true }).sort({ name: 1 });
    res.json(contractors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single contractor
router.get("/:id", async (req, res) => {
  try {
    const contractor = await Contractor.findById(req.params.id);
    if (!contractor) return res.status(404).json({ error: "Not found" });
    res.json(contractor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create contractor
router.post("/", async (req, res) => {
  try {
    const contractor = await Contractor.create(req.body);
    res.status(201).json(contractor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update contractor
router.put("/:id", async (req, res) => {
  try {
    const contractor = await Contractor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!contractor) return res.status(404).json({ error: "Not found" });
    res.json(contractor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete contractor
router.delete("/:id", async (req, res) => {
  try {
    const contractor = await Contractor.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!contractor) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Contractor deactivated" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

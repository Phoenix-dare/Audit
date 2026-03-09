import { Router } from "express";
import AuditNote from "../models/AuditNote.js";

const router = Router();

// Get notes for work order - put this BEFORE the catch-all /:id route
router.get("/work/:workOrderId", async (req, res) => {
  try {
    const notes = await AuditNote.find({ workOrderId: req.params.workOrderId })
      .sort({ auditDate: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all audit notes
router.get("/", async (_req, res) => {
  try {
    const notes = await AuditNote.find()
      .populate("workOrderId")
      .sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single note
router.get("/:id", async (req, res) => {
  try {
    const note = await AuditNote.findById(req.params.id).populate("workOrderId");
    if (!note) return res.status(404).json({ error: "Not found" });
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create audit note
router.post("/", async (req, res) => {
  try {
    const note = await AuditNote.create(req.body);
    res.status(201).json(note);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update audit note
router.put("/:id", async (req, res) => {
  try {
    const note = await AuditNote.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!note) return res.status(404).json({ error: "Not found" });
    res.json(note);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete audit note
router.delete("/:id", async (req, res) => {
  try {
    const note = await AuditNote.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Note deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

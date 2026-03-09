import { Router } from "express";
import { calculateAudit } from "../services/auditCalculator.js";

const router = Router();

router.post("/preview", (req, res) => {
  try {
    const result = calculateAudit(req.body || {});
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

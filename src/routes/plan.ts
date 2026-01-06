import { Router } from "express";
import { generateVisaPlan } from "../services/planEngine";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const plan = await generateVisaPlan(req.body);
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(502).json({
      error: "AI plan generation failed",
    });
  }
});

export default router;

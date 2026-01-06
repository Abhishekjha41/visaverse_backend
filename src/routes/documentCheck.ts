import { Router } from "express";
import { analyzeDocument } from "../services/documentEngine";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { text, ...meta } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing document text" });
    }

    const result = await analyzeDocument(text);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(502).json({
      error: "Document analysis failed",
    });
  }
});

export default router;

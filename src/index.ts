// src/index.ts
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import planRoute from "./routes/plan";
import documentCheckRoute from "./routes/documentCheck";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use(
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${ms}ms`);
  });
  next();
});

app.use("/api/plan", planRoute);
app.use("/api/document-check", documentCheckRoute);

app.get("/", (_, res) => {
  res.json({ status: "VisaVerse VisaOps Copilot API running" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

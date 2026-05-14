import "dotenv/config";
import express from "express";
import cors from "cors";
import healthRouter from "./routes/health";
import tablesRouter from "./routes/tables";
import groundwaterBuildingsRouter from "./routes/groundwaterBuildings";
import heatStressBuildingsRouter from "./routes/heatStressBuildings";
import infiltrationBuildingsRouter from "./routes/infiltrationBuildings";
import adminRebuildRouter from "./routes/adminRebuild";
import scenarioBuildingsRouter from "./routes/scenarioBuildings";
import scenarioResultsRouter from "./routes/scenarioResults";
import scenarioGridRouter from "./routes/scenarioGrid";
import fstpBuildingStatsRouter from "./routes/fstpBuildingStats";
import fleetStatsRouter from "./routes/fleetStats";

const app = express();
const PORT = process.env.PORT ?? 8080;

// --- CORS ---
// ALLOWED_ORIGIN can be "*" or a comma-separated list of origins.
// e.g. "https://bohol-cwis.innpact.ai,https://boholdashboard-ctfydscra6cdeafz.southeastasia-01.azurewebsites.net"
const allowedOriginEnv = process.env.ALLOWED_ORIGIN ?? "*";
const allowedOrigins = allowedOriginEnv === "*"
  ? "*"
  : allowedOriginEnv.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins === "*"
      ? true
      : (origin, callback) => {
          if (!origin || (allowedOrigins as string[]).includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`CORS: origin '${origin}' not allowed`));
          }
        },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// --- Routes ---
app.use("/health", healthRouter);
app.use("/api/tables", tablesRouter);
app.use("/api/groundwater-buildings", groundwaterBuildingsRouter);
app.use("/api/heat-stress-buildings", heatStressBuildingsRouter);
app.use("/api/infiltration-buildings", infiltrationBuildingsRouter);
app.use("/api/admin", adminRebuildRouter);
app.use("/api/scenario-buildings", scenarioBuildingsRouter);
app.use("/api/scenario-results", scenarioResultsRouter);
app.use("/api/scenario-grid", scenarioGridRouter);
app.use("/api/fstp-building-stats", fstpBuildingStatsRouter);
app.use("/api/fleet-stats", fleetStatsRouter);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`[server] Running on port ${PORT} (${process.env.NODE_ENV ?? "development"})`);
});

export default app;

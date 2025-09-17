import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { handleDemo } from "./routes/demo";
import galleryRouter from "./routes/gallery";
import donorsRouter from "./routes/donors";
import authRouter from "./routes/auth";
import membersRouter from "./routes/members";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health
  app.get("/health", (_req, res) => res.json({ ok: true }));

  // Static uploads (for local/dev). In production with Node, this serves uploaded files.
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const uploadsPath = path.resolve(__dirname, "../public/uploads");
  app.use("/uploads", express.static(uploadsPath));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth
  app.use("/api/admin", authRouter);

  // App routes
  app.use("/api/gallery", galleryRouter);
  app.use("/api/donors", donorsRouter);
  app.use("/api/members", membersRouter);

  return app;
}

import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "../server/routes/demo";
import galleryRouter from "../server/routes/gallery";
import donorsRouter from "../server/routes/donors";
import authRouter from "../server/routes/auth";
import membersRouter from "../server/routes/members";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Static uploads (for Vercel, serve from public folder)
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

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

// Export for Vercel
export default app;

import { Router } from "express";
import {
  verifyAdminCredentials,
  createAdminToken,
  initAdminHash,
} from "../auth";

const router = Router();

// Initialize hash at startup
initAdminHash().catch((err) => {
  console.error("Failed to init admin hash", err);
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const ok = await verifyAdminCredentials(email, password);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = createAdminToken();
  res.json({ token });
});

export default router;

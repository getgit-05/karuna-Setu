import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "karunasetu@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "NGOcraze@25";
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "dev-secret-change-me";

// Hash the password once at startup
let hashedPassword: string | null = null;

export async function initAdminHash() {
  if (!hashedPassword) {
    hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    console.log("Admin password hash generated");
  }
}

export async function verifyAdminCredentials(email: string, password: string) {
  if (email !== ADMIN_EMAIL) return false;
  if (!hashedPassword) await initAdminHash();
  if (!hashedPassword) return false;
  return bcrypt.compare(password, hashedPassword);
}

export function createAdminToken(payload?: object) {
  return jwt.sign({ email: ADMIN_EMAIL, ...(payload || {}) }, JWT_SECRET, {
    expiresIn: "4h",
  });
}

export function verifyAdminToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Hardcoded admin credentials (you can later move to DB)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "password123";
let passwordHash: string;

// Initialize hash
export async function initAdminHash() {
  passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
}

// Verify credentials
export async function verifyAdminCredentials(email: string, password: string) {
  if (email !== ADMIN_EMAIL) return false;
  return bcrypt.compare(password, passwordHash);
}

// Create JWT token
export function createAdminToken() {
  return jwt.sign({ role: "admin" }, process.env.JWT_SECRET || "changeme", {
    expiresIn: "5h",
  });
}

// Verify JWT token
export function verifyAdminToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "changeme");
  } catch {
    return null;
  }
}

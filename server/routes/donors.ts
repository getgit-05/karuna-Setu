import { RequestHandler, Router } from "express";
import { connectMongo } from "../db";
import { DonorModel } from "../models/Donor";
import { requireAdminKey } from "../middleware/adminAuth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function ensureUploadsDir() {
  const uploadsDir = path.resolve(__dirname, "../../public/uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  return uploadsDir;
}

function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });
    return true;
  }
  return false;
}

// GET /api/donors - public list
router.get("/", (async (_req, res) => {
  const { connected } = await connectMongo();
  if (!connected) {
    return res.json({ donors: [] });
  }
  const donors = await DonorModel.find().sort({ createdAt: -1 }).lean();
  res.json({ donors });
}) as RequestHandler);

// POST /api/admin/donors - create donor with optional logo upload
router.post("/admin", requireAdminKey, upload.single("logo"), (async (
  req,
  res,
) => {
  const { name, tier, website, donatedAmount, donatedCommodity } = req.body as {
    name: string;
    tier: "Platinum" | "Gold" | "Silver" | "Bronze";
    website?: string;
    donatedAmount?: string | number;
    donatedCommodity?: string;
  };
  if (!name || !tier)
    return res.status(400).json({ error: "name and tier required" });

  const { connected } = await connectMongo();
  if (!connected)
    return res.status(503).json({ error: "Database not configured" });

  let logoUrl: string | undefined;
  const file = req.file;
  const cloudOk = configureCloudinary();
  try {
    if (file) {
      if (cloudOk) {
        const uploaded = await new Promise<{ secure_url: string }>(
          (resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: process.env.CLOUDINARY_FOLDER || "ngo-gallery" },
              (err, result) => {
                if (err || !result) return reject(err);
                resolve({ secure_url: result.secure_url });
              },
            );
            stream.end(file.buffer);
          },
        );
        logoUrl = uploaded.secure_url;
      } else {
        const uploadsDir = ensureUploadsDir();
        const filename = `${Date.now()}-${file.originalname}`.replace(
          /\s+/g,
          "-",
        );
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, file.buffer);
        logoUrl = `/uploads/${filename}`;
      }
    }

    const doc = await DonorModel.create({
      name,
      tier,
      website,
      logoUrl,
      donatedAmount: donatedAmount ? Number(donatedAmount) : undefined,
      donatedCommodity: donatedCommodity || undefined,
    });

    res.status(201).json({ donor: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create donor" });
  }
}) as RequestHandler);

// DELETE /api/admin/donors/:id - delete donor
router.delete("/admin/:id", requireAdminKey, (async (req, res) => {
  const id = req.params.id;
  const { connected } = await connectMongo();
  if (!connected)
    return res.status(503).json({ error: "Database not configured" });
  await DonorModel.findByIdAndDelete(id);
  res.json({ ok: true });
}) as RequestHandler);

export default router;

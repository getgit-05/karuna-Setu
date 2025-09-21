import { RequestHandler, Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import { connectMongo } from "../db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { MemberModel } from "../models/Member";
import { requireAdminKey } from "../middleware/adminAuth";

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

// GET /api/members
router.get("/", (async (_req, res) => {
  const { connected } = await connectMongo();
  if (!connected) return res.json({ members: [] });
  const members = await MemberModel.find().sort({ position: 1 }).lean();
  res.json({ members });
}) as RequestHandler);

// POST /api/admin/members - create with optional photo
router.post("/admin", requireAdminKey, upload.single("photo"), (async (
  req,
  res,
) => {
  const { name, role, bio, instaId, email, contact } = req.body as {
    name?: string;
    role?: string;
    bio?: string;
    instaId?: string;
    email?: string;
    contact?: string;
  };
  if (!name) return res.status(400).json({ error: "name required" });

  const { connected } = await connectMongo();
  if (!connected)
    return res.status(503).json({ error: "Database not configured" });

  let photoUrl: string | undefined;
  let photoPublicId: string | undefined;
  const file = req.file;
  const cloudOk = configureCloudinary();
  try {
    if (file) {
      if (cloudOk) {
        const uploaded = await new Promise<{ secure_url: string; public_id: string }>(
          (resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: process.env.CLOUDINARY_FOLDER || "ngo-gallery" },
              (err, result) => {
                if (err || !result) return reject(err);
                resolve({ secure_url: result.secure_url, public_id: result.public_id });
              },
            );
            stream.end(file.buffer);
          },
        );
        photoUrl = uploaded.secure_url;
        photoPublicId = uploaded.public_id;
      } else {
        const uploadsDir = ensureUploadsDir();
        const filename = `${Date.now()}-${file.originalname}`.replace(
          /\s+/g,
          "-",
        );
        fs.writeFileSync(path.join(uploadsDir, filename), file.buffer);
        photoUrl = `/uploads/${filename}`;
      }
    }

    const doc = await MemberModel.create({
      name,
      role: (role as any) || "Core",
      bio,
      photoUrl,
      photoPublicId,
      instaId,
      email,
      contact,
    });
    res.status(201).json({ member: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create member" });
  }
}) as RequestHandler);

// DELETE /api/admin/members/:id
router.delete("/admin/:id", requireAdminKey, (async (req, res) => {
  const id = req.params.id;
  const { connected } = await connectMongo();
  if (!connected)
    return res.status(503).json({ error: "Database not configured" });

  const member = await MemberModel.findById(id).lean();
  if (!member) return res.status(404).json({ error: "Not found" });

  try {
    if ((member as any).photoPublicId) {
      try { await cloudinary.uploader.destroy((member as any).photoPublicId); } catch {}
    } else if (member.photoUrl && member.photoUrl.startsWith("/uploads/")) {
      const uploadsRoot = path.resolve(__dirname, "../../public");
      const rel = member.photoUrl.replace(/^\//, "");
      const filePath = path.join(uploadsRoot, rel);
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
    }

    await MemberModel.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete member" });
  }
}) as RequestHandler);


// POST /api/members/admin/reorder - reorder members
router.post("/admin/reorder", requireAdminKey, (async (req, res) => {
  const { orderedIds } = req.body as { orderedIds?: string[] };
  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: "orderedIds must be an array" });
  }

  const { connected } = await connectMongo();
  if (!connected) {
    return res.status(503).json({ error: "Database not configured" });
  }

  try {
    const promises = orderedIds.map((id, index) =>
      MemberModel.updateOne({ _id: id }, { $set: { position: index } })
    );
    await Promise.all(promises);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to reorder members" });
  }
}) as RequestHandler);

export default router;


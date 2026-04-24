import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { getUserId } from "./utils";
import { Router, Response } from "express";
import { prisma } from "../../prisma";
import { AuthenticatedRequest } from "../../middleware/auth";

const router = Router();

const uploadDir = path.join(process.cwd(), "public", "profilepictures");
const tempDir = path.join(process.cwd(), "public", "tmp");

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

const upload = multer({
  dest: tempDir,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG and WEBP images are allowed"));
    }

    cb(null, true);
  },
});

router.patch(
  "/",
  upload.single("profile_picture"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req, res);

      if (userId === null) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      const filename = `${userId}.jpg`;
      const outputPath = path.join(uploadDir, filename);
      const publicPath = `/profilepictures/${filename}`;

      await sharp(req.file.path)
        .resize(512, 512, {
          fit: "cover",
          position: "center",
        })
        .jpeg({
          quality: 80,
          mozjpeg: true,
        })
        .toFile(outputPath);

      fs.unlinkSync(req.file.path);

      const user = await prisma.users.update({
        where: { id: userId },
        data: {
          picture: publicPath,
        },
      });

      res.json(user);
    } catch (error) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(400).json({ error: "Could not upload profile picture" });
    }
  },
);

export default router;

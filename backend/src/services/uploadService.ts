import fs from 'fs';
import path from 'path';
import multer from 'multer';

export class UploadService {
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    this.ensureUploadDir();
  }

  singleImageMiddleware() {
    return multer({
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, this.uploadDir);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, uniqueSuffix + path.extname(file.originalname));
        },
      }),
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
          return cb(null, true);
        }

        cb(new Error('Only images (jpeg, jpg, png, webp) are allowed!'));
      },
    }).single('image');
  }

  getFileUrl(file?: Express.Multer.File) {
    if (!file) return null;
    return `/uploads/${file.filename}`;
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir);
    }
  }
}

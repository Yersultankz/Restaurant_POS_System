import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { UploadService } from '../services/uploadService';

export class UploadController {
  private uploadService = new UploadService();

  uploadSingleImage = (req: Request, res: Response, next: NextFunction) => {
    this.uploadService.singleImageMiddleware()(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        return res.status(400).json({ error: { code: 'UPLOAD_LIMIT', message: error.message } });
      }

      if (error) {
        return res.status(400).json({ error: { code: 'INVALID_FILE', message: error.message } });
      }

      return next();
    });
  };

  completeUpload = (req: Request, res: Response) => {
    try {
      const fileUrl = this.uploadService.getFileUrl(req.file);
      if (!fileUrl) {
        return res.status(400).json({ error: { code: 'NO_FILE', message: 'No file uploaded' } });
      }

      return res.json({ url: fileUrl });
    } catch {
      return res.status(500).json({
        error: { code: 'UPLOAD_FAILED', message: 'Failed to process uploaded file' },
      });
    }
  };
}

import { Router } from 'express';
import { UploadController } from '../controllers/uploadController';

export function createUploadRoutes() {
  const router = Router();
  const controller = new UploadController();

  router.post('/', controller.uploadSingleImage, controller.completeUpload);

  return router;
}

import { Router } from "express";
import {
  generateSinglePreSignedUrl,
  startMultipartUpload,
  generatePreSignedUrlForMultipart,
  completeMultipartUpload,
} from "../controllers/uploads.controller.js";

const router = Router();

router.post("/single-upload", generateSinglePreSignedUrl);
router.post("/start-multipart-upload", startMultipartUpload);
router.post("/generate-presigned-url", generatePreSignedUrlForMultipart);
router.post("/complete-multipart-upload", completeMultipartUpload);

export default router;

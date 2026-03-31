import { Router } from 'express';
import multer from 'multer';
import * as screenshotController from '../controllers/screenshot.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.js';
import {
  uploadSchema,
  getByIdSchema,
  getByTimeEntrySchema,
} from '../validators/screenshot.validator.js';

const router = Router();

// Multer config: temp storage, 5MB limit, JPEG/PNG only
const upload = multer({
  dest: 'uploads/temp/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

router.post('/upload', upload.single('screenshot'), validate(uploadSchema), screenshotController.upload);
router.get('/:id', validate(getByIdSchema), screenshotController.getById);
router.get('/time-entry/:timeEntryId', validate(getByTimeEntrySchema), screenshotController.getByTimeEntry);

export default router;

import path from 'node:path';
import multer from 'multer';
import { SALARY_SLIP_UPLOAD } from '../constants/upload';
import { AppError } from '../utils/app-error';

const UNSUPPORTED_MESSAGE = 'Salary slip must be a PDF, JPG or PNG file.';

/**
 * First line of defence: declared MIME type + extension. The file service later verifies the
 * real content via magic bytes. Files are kept in memory (max 5 MB) and streamed to GridFS.
 */
export const uploadSalarySlip = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: SALARY_SLIP_UPLOAD.MAX_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowed = SALARY_SLIP_UPLOAD.ALLOWED_TYPES.some(
      (type) => type.mimeType === file.mimetype && type.extensions.includes(extension),
    );
    if (!allowed) {
      callback(new AppError(415, 'UNSUPPORTED_FILE_TYPE', UNSUPPORTED_MESSAGE));
      return;
    }
    callback(null, true);
  },
}).single(SALARY_SLIP_UPLOAD.FIELD_NAME);

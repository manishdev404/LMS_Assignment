import path from 'node:path';
import type { GridFSBucketReadStream, ObjectId } from 'mongodb';
import { SALARY_SLIP_UPLOAD } from '../constants/upload';
import { getSalarySlipBucket } from '../db/gridfs';
import type { SalarySlipMeta, SalarySlipUpload } from '../interfaces/borrower.interface';
import { AppError } from '../utils/app-error';

const UNSUPPORTED_MESSAGE = 'Salary slip must be a real PDF, JPG or PNG file.';

/** Identifies the real file type from its leading bytes, ignoring what the client claimed. */
function detectFileType(buffer: Buffer) {
  return SALARY_SLIP_UPLOAD.ALLOWED_TYPES.find((type) =>
    type.signature.every((byte, index) => buffer[index] === byte),
  );
}

function sanitizeFileName(name: string): string {
  const base = path.basename(name).replace(/[^\w.\- ()]/g, '_').trim();
  return base.slice(-120) || 'salary-slip';
}

export async function storeSalarySlip(upload: SalarySlipUpload, ownerId: ObjectId): Promise<SalarySlipMeta> {
  const detected = detectFileType(upload.buffer);
  const extension = path.extname(upload.originalName).toLowerCase();
  if (!detected || !detected.extensions.includes(extension)) {
    throw new AppError(415, 'UNSUPPORTED_FILE_TYPE', UNSUPPORTED_MESSAGE);
  }

  const originalName = sanitizeFileName(upload.originalName);
  const stream = getSalarySlipBucket().openUploadStream(originalName, {
    metadata: { ownerId, originalName, mimeType: detected.mimeType },
  });

  await new Promise<void>((resolve, reject) => {
    stream.once('finish', () => resolve());
    stream.once('error', reject);
    stream.end(upload.buffer);
  });

  return {
    fileId: stream.id,
    originalName,
    mimeType: detected.mimeType,
    size: upload.buffer.length,
    uploadedAt: new Date(),
  };
}

export async function openStoredFile(fileId: ObjectId): Promise<GridFSBucketReadStream> {
  const bucket = getSalarySlipBucket();
  const file = await bucket.find({ _id: fileId }).limit(1).next();
  if (!file) {
    throw AppError.notFound('The salary slip file could not be found.');
  }
  return bucket.openDownloadStream(fileId);
}

/** Best effort — an orphaned file is harmless, a failed request is not. */
export async function deleteStoredFile(fileId: ObjectId): Promise<void> {
  try {
    await getSalarySlipBucket().delete(fileId);
  } catch (error) {
    console.warn(`Could not delete GridFS file ${fileId.toHexString()}`, error);
  }
}

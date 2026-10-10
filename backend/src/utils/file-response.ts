import { pipeline } from 'node:stream/promises';
import type { Response } from 'express';
import type { GridFSBucketReadStream } from 'mongodb';
import type { SalarySlipMeta } from '../interfaces/borrower.interface';

function contentDisposition(fileName: string): string {
  const asciiName = fileName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  return `inline; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

/** Streams a stored file to the client so the browser can preview it inline. */
export async function streamFile(
  res: Response,
  file: { meta: SalarySlipMeta; stream: GridFSBucketReadStream },
): Promise<void> {
  res.setHeader('Content-Type', file.meta.mimeType);
  res.setHeader('Content-Length', String(file.meta.size));
  res.setHeader('Content-Disposition', contentDisposition(file.meta.originalName));
  res.setHeader('Cache-Control', 'private, no-store');
  // The JSON-oriented CSP from helmet would stop the browser's built-in PDF viewer.
  res.removeHeader('Content-Security-Policy');
  await pipeline(file.stream, res);
}

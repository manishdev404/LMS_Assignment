export interface AllowedFileType {
  mimeType: string;
  extensions: readonly string[];
  /** Leading "magic bytes" that identify the real file format. */
  signature: readonly number[];
}

export const SALARY_SLIP_UPLOAD = {
  FIELD_NAME: 'salarySlip',
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  BUCKET_NAME: 'salarySlips',
  ALLOWED_TYPES: [
    { mimeType: 'application/pdf', extensions: ['.pdf'], signature: [0x25, 0x50, 0x44, 0x46] },
    { mimeType: 'image/png', extensions: ['.png'], signature: [0x89, 0x50, 0x4e, 0x47] },
    { mimeType: 'image/jpeg', extensions: ['.jpg', '.jpeg'], signature: [0xff, 0xd8, 0xff] },
  ] satisfies readonly AllowedFileType[],
} as const;

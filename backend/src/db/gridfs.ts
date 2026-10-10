import { GridFSBucket } from 'mongodb';
import { SALARY_SLIP_UPLOAD } from '../constants/upload';
import { getDb } from './client';

let salarySlipBucket: GridFSBucket | null = null;

export function getSalarySlipBucket(): GridFSBucket {
  salarySlipBucket ??= new GridFSBucket(getDb(), { bucketName: SALARY_SLIP_UPLOAD.BUCKET_NAME });
  return salarySlipBucket;
}

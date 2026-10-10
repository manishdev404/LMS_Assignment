'use client';

import { useRef, useState, type DragEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileIcon, UploadIcon } from '@/components/ui/icons';
import { errorMessage, uploadFile } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatBytes, formatDateTime } from '@/lib/format';
import type { ApplicationConfig, SalarySlip } from '@/types/api';

const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];

interface SalarySlipStepProps {
  slip: SalarySlip | null;
  upload: ApplicationConfig['upload'];
  onUploaded: (slip: SalarySlip) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function SalarySlipStep({ slip, upload, onUploaded, onBack, onContinue }: SalarySlipStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validate(file: File): string | null {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!upload.allowedMimeTypes.includes(file.type) || !ALLOWED_EXTENSIONS.includes(extension)) {
      return 'Only PDF, JPG or PNG files are allowed.';
    }
    if (file.size > upload.maxSizeBytes) {
      return `This file is ${formatBytes(file.size)}. The maximum size is ${formatBytes(upload.maxSizeBytes)}.`;
    }
    return null;
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const problem = validate(file);
    if (problem) {
      setError(problem);
      return;
    }

    const formData = new FormData();
    formData.append('salarySlip', file);
    setProgress(0);
    try {
      const result = await uploadFile<{ salarySlip: SalarySlip }>('/borrower/salary-slip', formData, setProgress);
      onUploaded(result.salarySlip);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void handleFile(event.dataTransfer.files[0]);
  }

  const uploading = progress !== null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Upload your latest salary slip</h2>
        <p className="text-sm text-slate-600">PDF, JPG or PNG · up to {formatBytes(upload.maxSizeBytes)}</p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        onChange={(event) => void handleFile(event.target.files?.[0])}
        aria-label="Salary slip file"
      />

      {slip && !uploading ? (
        <div className="flex flex-col gap-4 rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200 sm:flex-row sm:items-center">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 ring-1 ring-emerald-200">
            <FileIcon className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-slate-900">{slip.originalName}</p>
            <p className="text-xs text-slate-600">
              {formatBytes(slip.size)} · uploaded {formatDateTime(slip.uploadedAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/api/borrower/salary-slip"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              View
            </a>
            <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors',
            dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50',
          )}
        >
          <UploadIcon className="size-10 text-slate-400" />
          {uploading ? (
            <div className="mt-4 w-full max-w-xs">
              <p className="text-sm font-medium text-slate-700">Uploading… {progress}%</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <>
              <p className="mt-4 text-sm text-slate-700">
                <span className="font-semibold">Drag and drop</span> your file here, or
              </p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => inputRef.current?.click()}>
                Choose file
              </Button>
            </>
          )}
        </div>
      )}

      <div className="flex justify-between border-t border-slate-100 pt-5">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onContinue} disabled={!slip || uploading}>
          Continue
        </Button>
      </div>
    </div>
  );
}

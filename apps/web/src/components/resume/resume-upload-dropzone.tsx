'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUploadResume } from '@/hooks/use-resumes';

export function ResumeUploadDropzone() {
  const [isMaster, setIsMaster] = useState(true);
  const upload = useUploadResume();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) upload.mutate({ file, isMaster });
    },
    [upload, isMaster],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: upload.isPending,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
          isDragActive ? 'border-saffron-500 bg-saffron-50' : 'border-ink-200 bg-white hover:border-ink-300',
        )}
      >
        <input {...getInputProps()} />
        {upload.isPending ? (
          <>
            <Loader2 className="mb-3 h-8 w-8 animate-spin text-saffron-500" />
            <p className="font-medium text-ink-700">Parsing your resume…</p>
            <p className="text-sm text-ink-400">Extracting skills, scoring ATS readiness</p>
          </>
        ) : (
          <>
            <UploadCloud className="mb-3 h-8 w-8 text-ink-300" />
            <p className="font-medium text-ink-700">
              {isDragActive ? 'Drop it here' : 'Drag & drop your resume, or click to browse'}
            </p>
            <p className="text-sm text-ink-400">PDF or DOCX, up to 10MB</p>
          </>
        )}
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-ink-500">
        <input
          type="checkbox"
          checked={isMaster}
          onChange={(e) => setIsMaster(e.target.checked)}
          className="rounded border-ink-300"
        />
        Set as my master resume (used as the base for all tailoring)
      </label>

      {upload.isError && (
        <p className="mt-2 text-sm text-alert-500">
          {(upload.error as any)?.response?.data?.message || 'Upload failed. Try again.'}
        </p>
      )}
    </div>
  );
}

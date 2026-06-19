'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, FileCheck2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Status = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

export default function ResumeUpload({
  onUploadComplete,
}: {
  onUploadComplete: (resumeId: string, filename: string) => void
}) {
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return

      if (file.size > 5 * 1024 * 1024) {
        setError('Your file exceeds the 5MB limit. Please compress your PDF and try again.')
        setStatus('error')
        return
      }
      const allowed = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ]
      if (!allowed.includes(file.type)) {
        setError('Only PDF and DOCX files are accepted for resume upload.')
        setStatus('error')
        return
      }

        setStatus('uploading')
        setProgress(0)
        setError(null)

        try {
          const formData = new FormData()
          formData.append('file', file)

          const result = await new Promise<{ resumeId: string; profileSynced?: string[] }>((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100)
                setProgress(pct)
                if (pct >= 100) setStatus('processing')
              }
            }
          xhr.onload = () => {
            if (xhr.status === 200) {
              try {
                resolve(JSON.parse(xhr.responseText))
              } catch {
                reject(new Error('Invalid server response'))
              }
              return
            }
            let message = 'Upload failed. Please try again.'
            try {
              const body = JSON.parse(xhr.responseText)
              if (body?.message) message = body.message
            } catch {
              /* use default */
            }
            reject(new Error(message))
          }
          xhr.onerror = () => reject(new Error('Network error during upload.'))
          xhr.open('POST', '/api/resume/upload')
          xhr.send(formData)
        })

        setStatus('done')
        onUploadComplete(result.resumeId, file.name)
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
      }
    },
    [onUploadComplete]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary-600 bg-primary-50'
            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
        )}
      >
        <input {...getInputProps()} />
        {status === 'uploading' && (
          <div className="space-y-3">
            <p className="text-body-md text-gray-700">Uploading... {progress}%</p>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-2 bg-primary-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        {status === 'processing' && (
          <p className="text-body-md text-gray-700">Reading resume & updating your profile…</p>
        )}
        {status === 'done' && (
          <div className="flex flex-col items-center gap-2 text-success">
            <FileCheck2 size={32} />
            <p className="text-body-md font-medium">Resume uploaded successfully!</p>
          </div>
        )}
        {(status === 'idle' || status === 'error') && (
          <>
            <UploadCloud size={36} className="mx-auto text-primary-600 mb-3" />
            <p className="text-body-lg text-gray-900 font-medium">
              {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
            </p>
            <p className="text-body-sm text-gray-500 mt-1">PDF or DOCX, max 5MB</p>
            <button
              type="button"
              className="mt-4 bg-primary-600 text-gray-900 px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-primary-700 transition-all"
            >
              Browse File
            </button>
          </>
        )}
      </div>
      {error && <p className="text-danger text-xs mt-2">{error}</p>}
    </div>
  )
}

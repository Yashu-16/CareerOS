import Link from 'next/link'
import ProgressRing from '@/components/ui/ProgressRing'
import type { ATSReport } from '@/types'

export function ATSScoreCard({ report }: { report: ATSReport | null; resumeId?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 h-full flex flex-col">
      <h2 className="text-h2 text-gray-900 mb-4">ATS Resume Score</h2>

      {report ? (
        <>
          <div className="flex justify-center py-2">
            <ProgressRing score={report.overallScore} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-body-sm">
            <SubScore label="Experience" value={report.experienceScore} />
            <SubScore label="Skills" value={report.skillsScore} />
            <SubScore label="Education" value={report.educationScore} />
            <SubScore label="Summary" value={report.summaryScore} />
          </div>
          <Link
            href="/resume"
            className="mt-5 text-center bg-white text-primary-600 border border-primary-300 px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-primary-50 transition-all"
          >
            View full report
          </Link>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <p className="text-body-md text-gray-900 font-medium">No score yet</p>
          <p className="text-body-sm text-gray-500 mt-1">
            Run an ATS analysis to see how your resume scores.
          </p>
          <Link
            href="/resume"
            className="mt-4 bg-primary-600 text-gray-900 px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-primary-700 transition-all"
          >
            Analyze resume
          </Link>
        </div>
      )}
    </div>
  )
}

function SubScore({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'text-success' : value >= 40 ? 'text-warning' : 'text-danger'
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
      <span className="text-gray-700">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  )
}

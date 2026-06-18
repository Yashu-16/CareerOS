'use client'

import ProgressRing from '@/components/ui/ProgressRing'
import { SkillTag } from '@/components/ui/Badge'
import { RewriteSuggestion } from './RewriteSuggestion'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { ATSReport, ATSSuggestion } from '@/types'

export function ATSReportView({ report, context }: { report: ATSReport; context: string }) {
  const suggestions = (report.suggestions as unknown as ATSSuggestion[]) || []

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ProgressRing score={report.overallScore} size={140} />
          <div className="flex-1">
            <h2 className="text-h2 text-gray-900">Overall ATS Score</h2>
            <p className="text-body-md text-gray-700 mt-1 prose-readable">{report.rawAnalysis}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              <Sub label="Experience" value={report.experienceScore} />
              <Sub label="Skills" value={report.skillsScore} />
              <Sub label="Education" value={report.educationScore} />
              <Sub label="Summary" value={report.summaryScore} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-h3 text-gray-900 flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} className="text-success" /> Matched keywords
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {report.matchedKeywords.length ? (
              report.matchedKeywords.map((k) => <SkillTag key={k}>{k}</SkillTag>)
            ) : (
              <p className="text-body-sm text-gray-500">None detected.</p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-h3 text-gray-900 flex items-center gap-2 mb-3">
            <XCircle size={18} className="text-danger" /> Missing keywords
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {report.missingKeywords.length ? (
              report.missingKeywords.map((k) => (
                <span
                  key={k}
                  className="bg-danger-light text-danger text-xs px-2 py-0.5 rounded-md border border-danger/20"
                >
                  {k}
                </span>
              ))
            ) : (
              <p className="text-body-sm text-gray-500">Great — nothing critical missing!</p>
            )}
          </div>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-h3 text-gray-900 mb-4">AI rewrite suggestions</h3>
          <div className="space-y-4">
            {suggestions.map((s, i) => (
              <RewriteSuggestion key={i} suggestion={s} context={context} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Sub({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'text-success' : value >= 40 ? 'text-warning' : 'text-danger'
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
      <div className={`text-h2 font-bold ${color}`}>{value}</div>
      <div className="text-caption text-gray-500">{label}</div>
    </div>
  )
}

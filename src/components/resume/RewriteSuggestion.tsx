'use client'

import { useState } from 'react'
import { Sparkles, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import type { ATSSuggestion } from '@/types'

export function RewriteSuggestion({ suggestion, context }: { suggestion: ATSSuggestion; context: string }) {
  const { toast } = useToast()
  const [rewritten, setRewritten] = useState(suggestion.suggested)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const regenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ats/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original: suggestion.original, context }),
      })
      const data = await res.json()
      if (res.ok && data.rewritten) setRewritten(data.rewritten)
      else toast('AI rewrite is unavailable right now.', 'error')
    } catch {
      toast('AI rewrite is unavailable right now.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(rewritten)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <span className="text-label text-ai bg-ai-light px-2 py-0.5 rounded-md">{suggestion.section}</span>
      <div className="mt-3 space-y-3">
        <div>
          <p className="text-caption text-gray-500 mb-1">Original</p>
          <p className="text-body-sm text-gray-700 line-through decoration-danger/40">{suggestion.original}</p>
        </div>
        <div>
          <p className="text-caption text-success mb-1">Suggested</p>
          <p className="text-body-sm text-gray-900 font-medium">{rewritten}</p>
        </div>
        {suggestion.reason && (
          <p className="text-caption text-gray-500">Why: {suggestion.reason}</p>
        )}
      </div>
      <div className="flex gap-2 mt-3">
        <Button size="sm" variant="secondary" onClick={regenerate} loading={loading}>
          <Sparkles size={14} /> Regenerate
        </Button>
        <Button size="sm" variant="ghost" onClick={copy}>
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  )
}

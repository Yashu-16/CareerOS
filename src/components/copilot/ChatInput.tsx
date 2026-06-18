'use client'

import { useState } from 'react'
import { SendHorizonal } from 'lucide-react'

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void
  disabled?: boolean
}) {
  const [value, setValue] = useState('')

  const submit = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
  }

  return (
    <div className="flex items-end gap-2 border border-gray-200 rounded-xl bg-white p-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
        rows={1}
        placeholder="Ask about resumes, interviews, job strategy…"
        className="flex-1 resize-none max-h-32 px-2 py-2 text-sm outline-none bg-transparent"
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="bg-primary-600 text-gray-900 rounded-lg p-2.5 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        aria-label="Send"
      >
        <SendHorizonal size={18} />
      </button>
    </div>
  )
}

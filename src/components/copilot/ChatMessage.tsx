'use client'

import { Sparkles, User } from 'lucide-react'
import { cn } from '@/lib/cn'

export function ChatMessage({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user'
  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'h-8 w-8 rounded-full grid place-items-center shrink-0',
          isUser ? 'bg-primary-600 text-gray-900' : 'bg-ai-light text-ai'
        )}
      >
        {isUser ? <User size={16} /> : <Sparkles size={16} />}
      </div>
      <div
        className={cn(
          'rounded-xl px-4 py-2.5 max-w-[80%] text-body-md whitespace-pre-wrap prose-readable',
          isUser ? 'bg-primary-600 text-gray-900' : 'bg-white border border-gray-200 text-gray-900'
        )}
      >
        {content || <span className="text-gray-500">…</span>}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import type { ChatMessageInput } from '@/types'

const SUGGESTIONS = [
  'Review my resume for a frontend role',
  'How do I prepare for a TCS interview?',
  'What skills should I learn for data science in India?',
  'Help me write a cold outreach message to a recruiter',
]

export function CopilotChat({ sessionId }: { sessionId?: string }) {
  const [messages, setMessages] = useState<ChatMessageInput[]>([])
  const [streaming, setStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async (text: string) => {
    const userMsg: ChatMessageInput = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages([...history, { role: 'assistant', content: '' }])
    setStreaming(true)

    try {
      const res = await fetch('/api/copilot/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, sessionId }),
      })

      if (!res.ok || !res.body) {
        appendToLast('\n\n⚠️ The AI service is temporarily unavailable. Please try again shortly.')
        setStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') continue
          try {
            const parsed = JSON.parse(payload)
            if (parsed.text) appendToLast(parsed.text)
            else if (parsed.error) appendToLast(`\n\n⚠️ ${parsed.error}`)
          } catch {
            /* ignore malformed chunk */
          }
        }
      }
    } catch {
      appendToLast('\n\n⚠️ Connection lost. Please try again.')
    } finally {
      setStreaming(false)
    }
  }

  const appendToLast = (text: string) => {
    setMessages((prev) => {
      const next = [...prev]
      const last = next[next.length - 1]
      if (last && last.role === 'assistant') {
        next[next.length - 1] = { ...last, content: last.content + text }
      }
      return next
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-ai-light text-ai grid place-items-center mb-3">
              <Sparkles size={24} />
            </div>
            <h2 className="text-h2 text-gray-900">CareerOS AI Copilot</h2>
            <p className="text-body-md text-gray-500 mt-1 max-w-md">
              Your personal career advisor for the Indian job market. Ask anything about resumes,
              interviews, or job strategy.
            </p>
            <div className="grid sm:grid-cols-2 gap-2 mt-6 w-full max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-body-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2.5 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => <ChatMessage key={i} role={m.role} content={m.content} />)
        )}
      </div>
      <div className="p-4 border-t border-gray-200 bg-white">
        <ChatInput onSend={send} disabled={streaming} />
      </div>
    </div>
  )
}

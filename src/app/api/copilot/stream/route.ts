import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { streamCopilotResponse } from '@/lib/anthropic'
import { rateLimit } from '@/lib/rate-limit'

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(8000),
})
const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
  sessionId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const allowed = await rateLimit(`copilot:${user.id}`, 30, 60)
  if (!allowed) return new Response('Rate limit exceeded', { status: 429 })

  let parsed
  try {
    parsed = bodySchema.parse(await req.json())
  } catch {
    return new Response('Invalid request', { status: 400 })
  }
  const { messages, sessionId } = parsed

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { targetRole: true, skills: true, experienceLevel: true },
  })

  // Persist the latest user message.
  if (sessionId) {
    const last = messages[messages.length - 1]
    if (last?.role === 'user') {
      const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId: user.id },
      })
      if (session) {
        await prisma.chatMessage.create({
          data: { sessionId, role: 'USER', content: last.content },
        })
      }
    }
  }

  const encoder = new TextEncoder()
  let fullResponse = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamCopilotResponse(messages, {
          targetRole: profile?.targetRole,
          skills: profile?.skills,
          experienceLevel: profile?.experienceLevel ?? undefined,
        })) {
          fullResponse += chunk
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))

        if (sessionId && fullResponse) {
          await prisma.chatMessage
            .create({ data: { sessionId, role: 'ASSISTANT', content: fullResponse } })
            .catch(() => {})
        }
      } catch (error) {
        console.error('[COPILOT_STREAM]', error)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'AI service unavailable' })}\n\n`)
        )
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

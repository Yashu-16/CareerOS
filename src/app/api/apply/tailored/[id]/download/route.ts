import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { resolveExtensionToken } from '@/lib/extension-token'
import { getResumeBuffer } from '@/lib/resume-storage'
import {
  buildEditsFromSuggestions,
  rebuildTailoredBuffer,
  DOCX_MIME,
} from '@/lib/resume-tailor'
import { ApiErrors } from '@/lib/errors'
import type { ATSAnalysis } from '@/lib/anthropic'

async function authorize(req: NextRequest, tailoredId: string): Promise<string | null> {
  const extToken = req.headers.get('x-careeros-token')
  if (extToken) {
    const userId = await resolveExtensionToken(extToken)
    if (!userId) return null
    const ok = await prisma.tailoredResume.findFirst({ where: { id: tailoredId, userId } })
    return ok ? userId : null
  }
  const user = await getCurrentUser()
  if (!user) return null
  const ok = await prisma.tailoredResume.findFirst({ where: { id: tailoredId, userId: user.id } })
  return ok ? user.id : null
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await authorize(req, params.id)
  if (!userId) return ApiErrors.unauthorized()

  const tailored = await prisma.tailoredResume.findUnique({
    where: { id: params.id },
    include: { baseResume: true, job: { select: { title: true } } },
  })
  if (!tailored) return ApiErrors.notFound('Tailored resume')
  if (!tailored.baseResume) return ApiErrors.notFound('Resume file')

  const filename = tailored.filename.endsWith('.docx')
    ? tailored.filename
    : tailored.filename.replace(/\.(pdf|doc)$/i, '') + '.docx'

  try {
    // Prefer the stored tailored file (already patched in place during POST /api/apply/tailor).
    try {
      const stored = await getResumeBuffer(tailored.s3Key)
      const safeName = filename.replace(/[^\w\s.-]/g, '_')
      return new NextResponse(new Uint8Array(stored), {
        headers: {
          'Content-Type': DOCX_MIME,
          'Content-Disposition': `attachment; filename="${safeName}"`,
          'Cache-Control': 'no-store',
        },
      })
    } catch {
      /* fall through — rebuild from base DOCX + saved suggestions */
    }

    const suggestions = tailored.suggestions as ATSAnalysis['suggestions'] | null
    const edits = suggestions?.length ? buildEditsFromSuggestions(suggestions) : []

    const { buffer } = await rebuildTailoredBuffer(
      tailored.baseResume,
      edits,
      {
        missingKeywords: tailored.missingKeywords,
        jobTitle: tailored.job?.title ?? 'Role',
        resumeText: tailored.baseResume.parsedText || tailored.parsedText || '',
      }
    )

    const safeName = filename.replace(/[^\w\s.-]/g, '_')
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': DOCX_MIME,
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    if ((err as Error).message === 'DOCX_REQUIRED') {
      return ApiErrors.validation([
        { message: 'Re-upload your resume as DOCX to download a tailored copy.', path: ['resume'] },
      ])
    }
    console.error('[TAILORED_DOWNLOAD]', err)
    return ApiErrors.database()
  }
}

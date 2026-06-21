'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { useGenerateCoverLetter, useGenerateInterviewAnswer } from '@/hooks/use-tailoring';

const COMMON_QUESTIONS = [
  'Why should we hire you?',
  'Why do you want to work at this company?',
  'Tell us about yourself.',
  'Describe your leadership experience.',
];

export function ApplicationAssistantPanel({ jobId }: { jobId: string }) {
  const coverLetter = useGenerateCoverLetter();
  const interviewAnswer = useGenerateInterviewAnswer();
  const [question, setQuestion] = useState('');

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI application assistant</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Button size="sm" onClick={() => coverLetter.mutate(jobId)} disabled={coverLetter.isPending}>
            {coverLetter.isPending ? 'Writing…' : 'Generate cover letter'}
          </Button>
          {coverLetter.data && (
            <Textarea className="mt-3" rows={10} readOnly value={coverLetter.data.coverLetter} />
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink-700">Application question</p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {COMMON_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => setQuestion(q)}
                className="rounded-full border border-ink-200 px-2.5 py-1 text-xs text-ink-500 hover:border-saffron-400 hover:text-saffron-600"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea
              rows={2}
              placeholder="Paste any application question…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            className="mt-2"
            disabled={!question || interviewAnswer.isPending}
            onClick={() => interviewAnswer.mutate({ jobId, question })}
          >
            {interviewAnswer.isPending ? 'Thinking…' : 'Generate answer'}
          </Button>
          {interviewAnswer.data && (
            <Textarea className="mt-3" rows={6} readOnly value={interviewAnswer.data.answer} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Education } from '@/types';
import { useAddEducation, useDeleteEducation } from '@/hooks/use-profile';

export function EducationSection({ education }: { education: Education[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gradeValue: '' });
  const add = useAddEducation();
  const remove = useDeleteEducation();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    add.mutate(form as any, {
      onSuccess: () => {
        setForm({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gradeValue: '' });
        setIsAdding(false);
      },
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Education</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isAdding && (
          <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-ink-100 p-4">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Institution" required value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
              <Input placeholder="Degree (e.g. B.Tech)" required value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input placeholder="Field of study" value={form.fieldOfStudy} onChange={(e) => setForm({ ...form, fieldOfStudy: e.target.value })} />
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <Input placeholder="Grade (e.g. 8.7 CGPA)" value={form.gradeValue} onChange={(e) => setForm({ ...form, gradeValue: e.target.value })} />
            <Button type="submit" size="sm" disabled={add.isPending}>Save</Button>
          </form>
        )}

        {education.length === 0 && !isAdding && (
          <p className="text-sm text-ink-400">No education added yet.</p>
        )}

        {education.map((edu) => (
          <div key={edu.id} className="flex items-start justify-between rounded-lg border border-ink-100 p-3">
            <div>
              <p className="font-medium text-ink-800">{edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}</p>
              <p className="text-sm text-ink-500">{edu.institution}</p>
              {edu.gradeValue && <p className="text-xs text-ink-400">{edu.gradeValue}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove.mutate(edu.id)}>
              <Trash2 className="h-4 w-4 text-ink-300 hover:text-alert-500" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

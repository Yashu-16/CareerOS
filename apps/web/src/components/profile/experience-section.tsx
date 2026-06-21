'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Experience } from '@/types';
import { useAddExperience, useDeleteExperience } from '@/hooks/use-profile';

export function ExperienceSection({ experience }: { experience: Experience[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    company: '', title: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '',
  });
  const add = useAddExperience();
  const remove = useDeleteExperience();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const achievements = form.description
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    add.mutate({ ...form, achievements } as any, {
      onSuccess: () => {
        setForm({ company: '', title: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' });
        setIsAdding(false);
      },
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Experience</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isAdding && (
          <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-ink-100 p-4">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Company" required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              <Input placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              <Input type="date" value={form.endDate} disabled={form.isCurrent} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-500">
              <input type="checkbox" checked={form.isCurrent} onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })} />
              I currently work here
            </label>
            <Textarea
              placeholder="One achievement/bullet per line"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Button type="submit" size="sm" disabled={add.isPending}>Save</Button>
          </form>
        )}

        {experience.length === 0 && !isAdding && (
          <p className="text-sm text-ink-400">No experience added yet.</p>
        )}

        {experience.map((exp) => (
          <div key={exp.id} className="flex items-start justify-between rounded-lg border border-ink-100 p-3">
            <div>
              <p className="font-medium text-ink-800">{exp.title} — {exp.company}</p>
              <p className="text-sm text-ink-500">{exp.location}</p>
              {exp.achievements.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-sm text-ink-500">
                  {exp.achievements.map((a, i) => (
                    <li key={i}>• {a}</li>
                  ))}
                </ul>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove.mutate(exp.id)}>
              <Trash2 className="h-4 w-4 text-ink-300 hover:text-alert-500" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
